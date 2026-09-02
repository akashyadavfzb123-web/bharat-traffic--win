import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Junction, Incident, RouteOption, DigitalTwinNode } from '../../types/traffic';
import type { RoadGeoJSONCollection, RoadSegmentProperties } from '../../data/mockGeoJSON';
import { CITIES } from '../../data/cityData';
import { mapSearchService, type SearchResult } from '../../services/mapApi';
import { useApp } from '../../context/AppContext';
import {
  Layers,
  Search,
  MapPin,
  X,
  Zap,
  Globe,
} from 'lucide-react';

interface GreenCorridor {
  id: string;
  vehicleType: string;
  vehicleCallsign: string;
  title: string;
  currentLat: number;
  currentLng: number;
  destLat: number;
  destLng: number;
  etaMin: number;
  status: string;
  coordinates: [number, number][];
}

interface MapProps {
  junctions?: Junction[];
  incidents?: Incident[];
  digitalTwinNodes?: DigitalTwinNode[];
  routes?: RouteOption[];
  roadGeoJSON?: RoadGeoJSONCollection;
  greenCorridors?: GreenCorridor[];
  selectedRoadId?: string | null;
  selectedJunctionId?: string | null;
  onRoadClick?: (road: RoadSegmentProperties) => void;
  onJunctionClick?: (junction: Junction) => void;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  interactive?: boolean;
}

type MapStyleType = 'dark' | 'satellite' | 'traffic' | 'streets';

// Build tile URLs from env vars, falling back to CARTO/OSM/ArcGIS free tiers.
// To remove the "API KEY REQUIRED" watermark on CARTO tiles, set
// VITE_CARTO_API_KEY in your .env (free at https://app.carto.com).
const cartoKey = import.meta.env.VITE_CARTO_API_KEY || '';
const cartoQs = cartoKey ? `?api_key=${cartoKey}` : '';

const MAP_STYLES: Record<MapStyleType, { name: string; url: string; icon: string }> = {
  dark: {
    name: 'Command Dark',
    url: import.meta.env.VITE_MAP_DARK_URL || `https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png${cartoQs}`,
    icon: '🌙',
  },
  satellite: {
    name: 'Satellite Aerial',
    url: import.meta.env.VITE_MAP_SATELLITE_URL || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    icon: '🛰️',
  },
  traffic: {
    name: 'Traffic Density',
    url: import.meta.env.VITE_MAP_TRAFFIC_URL || `https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png${cartoQs}`,
    icon: '🚦',
  },
  streets: {
    name: 'Standard Streets',
    url: import.meta.env.VITE_MAP_STREETS_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    icon: '🏙️',
  },
};

function buildMapStyle(tileUrl: string) {
  return {
    version: 8 as const,
    sources: {
      'base-tile-src': {
        type: 'raster' as const,
        tiles: [tileUrl],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap &copy; CARTO',
      },
    },
    layers: [
      {
        id: 'base-tile-layer',
        type: 'raster' as const,
        source: 'base-tile-src',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };
}

/** Remove all markers whose element carries the given data-key attribute. */
function clearMarkers(map: maplibregl.Map, key: string) {
  const markers = maplibregl.Marker.getAll?.() ?? [];
  for (const m of markers) {
    const el = m.getElement();
    if (el.dataset[key]) m.remove();
  }
}

export const MapContainer: React.FC<MapProps> = ({
  junctions = [],
  incidents = [],
  digitalTwinNodes = [],
  routes = [],
  roadGeoJSON,
  greenCorridors = [],
  onRoadClick,
  onJunctionClick,
  center,
  zoom = 12,
  interactive = true,
}) => {
  const { selectedCity, setSelectedCity } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersKeyRef = useRef(0); // bumped on each marker refresh

  const [currentStyle, setCurrentStyle] = useState<MapStyleType>('dark');
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  const cityConfig = CITIES[selectedCity] || CITIES['Bengaluru'];
  const activeCenter = center || cityConfig.center;

  // ── Refs that hold the latest props for use in callbacks without re-creating the map
  const junctionsRef = useRef(junctions);
  const incidentsRef = useRef(incidents);
  const onJunctionClickRef = useRef(onJunctionClick);
  const onRoadClickRef = useRef(onRoadClick);
  const cityConfigRef = useRef(cityConfig);
  const selectedCityRef = useRef(selectedCity);

  useEffect(() => { junctionsRef.current = junctions; }, [junctions]);
  useEffect(() => { incidentsRef.current = incidents; }, [incidents]);
  useEffect(() => { onJunctionClickRef.current = onJunctionClick; }, [onJunctionClick]);
  useEffect(() => { onRoadClickRef.current = onRoadClick; }, [onRoadClick]);
  useEffect(() => { cityConfigRef.current = cityConfig; }, [cityConfig]);
  useEffect(() => { selectedCityRef.current = selectedCity; }, [selectedCity]);

  // Handle Location Search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await mapSearchService.searchLocations(searchQuery, selectedCity);
      setSearchResults(results);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCity]);

  // Handle City Change (fly to, don't recreate map)
  const handleCitySelect = useCallback((cityName: string) => {
    setSelectedCity(cityName);
    const targetCity = CITIES[cityName];
    if (mapRef.current && targetCity) {
      mapRef.current.flyTo({ center: targetCity.center, zoom: targetCity.zoom, speed: 1.2 });
    }
  }, [setSelectedCity]);

  const handleSelectSearchResult = useCallback((res: SearchResult) => {
    const lat = parseFloat(res.lat);
    const lng = parseFloat(res.lon);
    if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 14, speed: 1.5 });
      new maplibregl.Marker({ color: '#06b6d4' })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup().setHTML(`<b style="color: #0284c7;">${res.display_name}</b>`))
        .addTo(mapRef.current);
    }
    setSearchResults([]);
    setSearchQuery('');
  }, []);

  // ── Map lifecycle: create ONCE, destroy ONCE ──
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: buildMapStyle(MAP_STYLES[currentStyle].url),
      center: activeCenter,
      zoom,
      interactive,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    // Handle WebGL context loss gracefully — pause rendering, resume when restored
    const canvas = map.getCanvas();
    const onContextLost = (e: Event) => { e.preventDefault(); };
    const onContextRestored = () => { map.resize(); };
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    // After the base style loads, add the initial GeoJSON + markers + routes.
    map.on('load', () => {
      try {
        addRoadSource(map, roadGeoJSON || cityConfig.roadsGeoJSON, showTrafficLayer);
        addRouteLayers(map, routes);
        addGreenCorridorLayers(map, greenCorridors);
      } catch (e) { console.warn('[MapContainer] load layers error:', e); }
      addJunctionMarkers(map, junctions.length > 0 ? junctions : cityConfig.junctions, selectedCity);
      addIncidentMarkers(map, incidents);
    });

    return () => {
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mount once only

  // ── Imperative updates when props change (no map recreation) ──

  // Update tile style — re-add layers after the new style finishes loading
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(buildMapStyle(MAP_STYLES[currentStyle].url));
    // Wait for the new style to load before re-adding custom layers
    const onStyleLoad = () => {
      addRoadSource(map, roadGeoJSON || cityConfig.roadsGeoJSON, showTrafficLayer);
      addRouteLayers(map, routes);
    };
    map.once('style.load', onStyleLoad);
    return () => { map.off('style.load', onStyleLoad); };
  }, [currentStyle]);

  // Update road GeoJSON source when data or toggle changes (only if style is stable)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    addRoadSource(map, roadGeoJSON || cityConfig.roadsGeoJSON, showTrafficLayer);
  }, [roadGeoJSON, showTrafficLayer, cityConfig]);

  // Update green corridors on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    addGreenCorridorLayers(map, greenCorridors);
  }, [greenCorridors]);

  // Update junction markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    addJunctionMarkers(map, junctions.length > 0 ? junctions : cityConfig.junctions, selectedCity);
  }, [junctions, cityConfig, selectedCity]);

  // Update incident markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    addIncidentMarkers(map, incidents);
  }, [incidents]);

  // Update route layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    addRouteLayers(map, routes);
  }, [routes]);

  // ── Imperative helpers ──

  function addRoadSource(map: maplibregl.Map, geoJSON: RoadGeoJSONCollection | undefined, show: boolean) {
    if (!geoJSON) return;

    // Remove old layers/source first (check existence to avoid console errors)
    if (map.getLayer('road-segments-line')) map.removeLayer('road-segments-line');
    if (map.getSource('road-segments-src')) map.removeSource('road-segments-src');

    if (!show) return;

    map.addSource('road-segments-src', {
      type: 'geojson',
      data: geoJSON as unknown as string,
    });

    map.addLayer({
      id: 'road-segments-line',
      type: 'line',
      source: 'road-segments-src',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': [
          'step', ['get', 'congestion'],
          '#22c55e', 40, '#eab308', 70, '#ef4444',
        ],
        'line-width': 7,
        'line-opacity': 0.85,
      },
    });

    // Re-bind click/hover handlers (callbacks may have changed)
    map.on('mouseenter', 'road-segments-line', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'road-segments-line', () => {
      map.getCanvas().style.cursor = '';
    });
    map.on('click', 'road-segments-line', (e) => {
      if (e.features?.length && onRoadClickRef.current) {
        onRoadClickRef.current(e.features[0].properties as any);
      }
    });
  }

  function addRouteLayers(map: maplibregl.Map, routeList: RouteOption[]) {
    routeList.forEach((route) => {
      const sourceId = `route-source-${route.id}`;
      const layerId = `route-layer-${route.id}`;
      if (map.getSource(sourceId)) return; // already added

      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: route.coordinates },
        },
      });
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': route.isRecommended ? '#06b6d4'
            : route.congestionLevel === 'severe' ? '#ef4444' : '#f59e0b',
          'line-width': route.isRecommended ? 6 : 4,
          'line-opacity': 0.85,
        },
      });
    });
  }

  function addJunctionMarkers(map: maplibregl.Map, junctionList: any[], city: string) {
    // Remove old junction markers
    mapContainerRef.current?.querySelectorAll('[data-marker="junction"]').forEach((el) => el.remove());

    junctionList.forEach((j: any) => {
      const el = document.createElement('div');
      el.dataset.marker = 'junction';
      el.className =
        'w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-125 border-2 border-slate-900 shadow-lg';

      if (j.status === 'critical') { el.style.backgroundColor = '#ef4444'; el.style.boxShadow = '0 0 12px #ef4444'; }
      else if (j.status === 'red') { el.style.backgroundColor = '#f97316'; }
      else if (j.status === 'yellow') { el.style.backgroundColor = '#eab308'; }
      else { el.style.backgroundColor = '#22c55e'; }

      const inner = document.createElement('div');
      inner.className = 'w-2 h-2 rounded-full bg-white';
      el.appendChild(inner);

      el.addEventListener('click', () => onJunctionClickRef.current?.(j));

      const popupContent = `
        <div style="font-family: monospace; padding: 4px;">
          <h4 style="margin: 0; font-size: 13px; font-weight: bold; color: #38bdf8;">${j.name}</h4>
          <p style="margin: 2px 0 0; font-size: 11px; color: #94a3b8;">Metro: ${city}</p>
          <div style="margin-top: 6px; font-size: 11px; color: #f8fafc;">
            <div>Wait Time: <strong>${j.currentWaitTimeSec || j.waitTimeSec || 60}s</strong></div>
            <div>Queue Vehicles: <strong>${j.vehicleCount || j.queueLengthVeh || 300}</strong></div>
            <div>Congestion: <strong style="color: ${(j.congestionIndex || j.congestionPct) > 80 ? '#ef4444' : '#22c55e'};">${j.congestionIndex || j.congestionPct}%</strong></div>
          </div>
        </div>
      `;

      new maplibregl.Marker(el)
        .setLngLat([j.lng, j.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(popupContent))
        .addTo(map);
    });
  }

  function addGreenCorridorLayers(map: maplibregl.Map, corridors: GreenCorridor[]) {
    // Remove existing green corridor layers
    ['green-corridor-bg', 'green-corridor-line', 'green-corridor-glow', 'green-corridor-vehicle'].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource('green-corridor-src')) map.removeSource('green-corridor-src');

    if (corridors.length === 0) return;

    // Build a combined GeoJSON for all active corridors
    const features = corridors
      .filter(c => c.status === 'active' && c.coordinates && c.coordinates.length > 1)
      .map(c => ({
        type: 'Feature' as const,
        properties: {
          id: c.id,
          title: c.title,
          vehicleType: c.vehicleType,
          callsign: c.vehicleCallsign,
          etaMin: c.etaMin,
          status: c.status,
          currentLat: c.currentLat,
          currentLng: c.currentLng,
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: c.coordinates,
        },
      }));

    if (features.length === 0) return;

    map.addSource('green-corridor-src', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features } as any,
    });

    // Wide green glow underneath
    map.addLayer({
      id: 'green-corridor-bg',
      type: 'line',
      source: 'green-corridor-src',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#22c55e',
        'line-width': 14,
        'line-opacity': 0.15,
        'line-blur': 8,
      },
    });

    // Animated dashed green line
    map.addLayer({
      id: 'green-corridor-line',
      type: 'line',
      source: 'green-corridor-src',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#4ade80',
        'line-width': 5,
        'line-opacity': 0.95,
        'line-dasharray': [0, 4, 3],
      },
    });

    // Bright glow overlay
    map.addLayer({
      id: 'green-corridor-glow',
      type: 'line',
      source: 'green-corridor-src',
      paint: {
        'line-color': '#86efac',
        'line-width': 3,
        'line-opacity': 0.5,
        'line-blur': 3,
      },
    });

    // Vehicle position dots
    map.addLayer({
      id: 'green-corridor-vehicle',
      type: 'circle',
      source: 'green-corridor-src',
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          10, 5, 15, 10,
        ],
        'circle-color': '#22c55e',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-blur': 0.15,
      },
    });

    // Animate the dashes by updating the dasharray periodically
    let dashStep = 0;
    let animFrameId: number | null = null;
    const animateDash = () => {
      if (!map || !map.getLayer('green-corridor-line')) return;
      dashStep = (dashStep + 0.15) % 12;
      try {
        map.setPaintProperty('green-corridor-line', 'line-dasharray', [
          dashStep, 4, 3 - (dashStep % 3) + 1
        ]);
      } catch { /* map may have been removed */ }
      animFrameId = requestAnimationFrame(animateDash);
    };
    animFrameId = requestAnimationFrame(animateDash);
    // Cleanup animation when corridor layers are removed
    const onRemove = () => { if (animFrameId) cancelAnimationFrame(animFrameId); };
    map.once('remove', onRemove);
  }

  function addTrafficDirectionArrows(map: maplibregl.Map) {
    // Add arrow symbols to show traffic flow direction along road segments
    try {
      if (map.getLayer('road-arrows')) map.removeLayer('road-arrows');
      if (!map.getSource('road-segments-src')) return;

      map.addLayer({
        id: 'road-arrows',
        type: 'symbol',
        source: 'road-segments-src',
        layout: {
          'symbol-placement': 'line',
          'text-field': '▶',
          'text-size': 10,
          'symbol-spacing': 120,
          'symbol-avoid-edges': true,
        },
        paint: {
          'text-color': '#94a3b8',
          'text-opacity': 0.4,
        },
      });
    } catch { /* arrow layer not supported — ignore */ }
  }

  function addIncidentMarkers(map: maplibregl.Map, incList: Incident[]) {
    mapContainerRef.current?.querySelectorAll('[data-marker="incident"]').forEach((el) => el.remove());

    incList.forEach((inc) => {
      const el = document.createElement('div');
      el.dataset.marker = 'incident';
      el.className =
        'w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-lg animate-pulse border-2 border-white cursor-pointer';
      el.innerHTML = '⚠️';

      new maplibregl.Marker(el)
        .setLngLat([inc.lng, inc.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<b>${inc.title}</b><br/>${inc.locationName}`))
        .addTo(map);
    });
  }

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950 flex flex-col">
      {/* Top Map Header Control Bar: 4-City Tabs + Search + Style Menu */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-2 z-20 shrink-0">
        {/* 1. 4-City Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <span className="text-[10px] font-mono text-cyan-400 px-2 font-bold flex items-center gap-1 hidden sm:flex">
            <Globe className="w-3 h-3" />
            CITY:
          </span>
          {Object.keys(CITIES).map((cityName) => (
            <button
              key={cityName}
              onClick={() => handleCitySelect(cityName)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold font-mono transition-all ${
                selectedCity === cityName
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {cityName}
            </button>
          ))}
        </div>          {/* 2. City-Scoped Location Search Bar with Suggestions */}
          <div className="relative flex-1 max-w-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={`Search areas, roads, landmarks in ${selectedCity}...`}
                className="w-full pl-8 pr-7 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSuggestions(false); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Search Results (from typing) */}
            {searchResults.length > 0 && showSuggestions && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-30 max-h-56 overflow-y-auto font-mono text-xs">
                <div className="px-2.5 py-1.5 bg-slate-950/80 border-b border-slate-800/60 text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Search Results</span>
                  <span className="text-cyan-500">in {selectedCity}</span>
                </div>
                {searchResults.map((res) => (
                  <div
                    key={res.place_id}
                    onClick={() => { handleSelectSearchResult(res); setShowSuggestions(false); }}
                    className="px-2.5 py-2 hover:bg-cyan-500/15 cursor-pointer border-b border-slate-800/40 text-slate-200 flex items-start gap-2.5 text-[11px] transition-colors"
                  >
                    <div className="shrink-0 mt-0.5">
                      {res.source === 'local' ? (
                        <div className="w-5 h-5 rounded-md bg-cyan-500/20 flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center">
                          <Globe className="w-3 h-3 text-emerald-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-200 font-medium truncate">{res.display_name.split(',')[0]}</div>
                      <div className="text-[10px] text-slate-500 truncate">{res.display_name.split(',').slice(1).join(',')}</div>
                    </div>
                    {res.source === 'local' && (
                      <span className="shrink-0 text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded mt-0.5">LOCAL</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Popular Areas Suggestions (when focused but no query) */}
            {searchQuery.trim().length < 2 && showSuggestions && searchResults.length === 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-30 font-mono text-xs">
                <div className="px-2.5 py-1.5 bg-slate-950/80 border-b border-slate-800/60 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  🔥 Popular Areas in {selectedCity}
                </div>
                {mapSearchService.getPopularAreas(selectedCity).map((area) => (
                  <div
                    key={area.name}
                    onClick={() => { setSearchQuery(area.name); setShowSuggestions(true); }}
                    className="px-2.5 py-2 hover:bg-cyan-500/15 cursor-pointer border-b border-slate-800/40 text-slate-200 flex items-center gap-2.5 text-[11px] transition-colors"
                  >
                    <div className="w-5 h-5 rounded-md bg-cyan-500/20 flex items-center justify-center shrink-0">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-200 font-medium">{area.name}</div>
                      <div className="text-[10px] text-slate-500">{area.description}</div>
                    </div>
                    <span className="shrink-0 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                      {area.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        {/* 3. Map Controls: Traffic Toggle & Style Switcher */}
        <div className="flex items-center gap-2">
          {/* Live Traffic Toggle */}
          <button
            onClick={() => setShowTrafficLayer(!showTrafficLayer)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono border transition-all ${
              showTrafficLayer
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Zap className={`w-3 h-3 ${showTrafficLayer ? 'animate-pulse text-emerald-400' : ''}`} />
            <span className="hidden md:inline">Traffic Layer</span>
          </button>

          {/* Map Style Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-bold font-mono text-slate-300 hover:text-white"
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>{MAP_STYLES[currentStyle].icon}</span>
            </button>

            {showStyleMenu && (
              <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-30 w-44 font-mono text-xs space-y-1">
                <div className="text-[10px] text-slate-500 font-bold px-2 py-1 uppercase">Select Map Style</div>
                {(Object.keys(MAP_STYLES) as MapStyleType[]).map((styleKey) => (
                  <button
                    key={styleKey}
                    onClick={() => { setCurrentStyle(styleKey); setShowStyleMenu(false); }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-all ${
                      currentStyle === styleKey
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>{MAP_STYLES[styleKey].name}</span>
                    <span>{MAP_STYLES[styleKey].icon}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close suggestions on outside click */}
      {showSuggestions && (
        <div className="absolute inset-0 z-5" onClick={() => setShowSuggestions(false)} />
      )}

      {/* Main Map Container Canvas */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* Legend Overlay */}
        {/* Traffic Legend */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1 z-10 shadow-lg font-mono">
          <div className="font-bold text-slate-400 text-[10px] uppercase flex items-center justify-between gap-4">
            <span>{selectedCity} Live Network</span>
            <span className="text-cyan-400 text-[9px]">MapLibre Active</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="w-3 h-1 bg-emerald-500 inline-block rounded" />
            <span>Clear Flow (&gt;40 km/h)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-amber-500 inline-block rounded" />
            <span>Slow Traffic (20-40 km/h)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-red-500 inline-block rounded" />
            <span>Heavy Gridlock (&lt;20 km/h)</span>
          </div>
          {greenCorridors.some(c => c.status === 'active') && (
            <>
              <div className="border-t border-slate-700/60 mt-1 pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-1 bg-green-400 inline-block rounded animate-pulse" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #4ade80 0px, #4ade80 4px, transparent 4px, transparent 7px)' }} />
                  <span className="text-green-400 font-bold">Green Corridor</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full border border-white shadow-sm" />
                  <span className="text-[10px] text-slate-400">Emergency Vehicle</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Green Corridor Alert Banner */}
        {greenCorridors.some(c => c.status === 'active') && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-green-900/90 backdrop-blur-md px-4 py-2 rounded-lg border border-green-500/50 z-10 shadow-lg shadow-green-500/20 animate-pulse">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-green-400 font-bold">🟢 GREEN CORRIDOR ACTIVE</span>
              <span className="text-green-300">—</span>
              <span className="text-green-200">
                {greenCorridors.filter(c => c.status === 'active').map(c => `${c.title} (ETA ${c.etaMin}min)`).join(' | ')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
