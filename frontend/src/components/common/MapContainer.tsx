import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Junction, Incident, RouteOption, DigitalTwinNode } from '../../types/traffic';
import type { RoadGeoJSONCollection, RoadSegmentProperties } from '../../data/mockGeoJSON';
import { searchPlaces, getCityBoundary, getCityRoads, type GeocodingResult, type CityBoundary, type RoadSegment } from '../../services/mapApi';

interface MapProps {
  junctions?: Junction[];
  incidents?: Incident[];
  digitalTwinNodes?: DigitalTwinNode[];
  routes?: RouteOption[];
  roadGeoJSON?: RoadGeoJSONCollection;
  selectedRoadId?: string | null;
  selectedJunctionId?: string | null;
  onRoadClick?: (road: RoadSegmentProperties) => void;
  onJunctionClick?: (junction: Junction) => void;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  interactive?: boolean;
  showCitySearch?: boolean;
  onCitySelect?: (city: GeocodingResult) => void;
}

export const MapContainer: React.FC<MapProps> = ({
  junctions = [],
  incidents = [],
  digitalTwinNodes = [],
  routes = [],
  roadGeoJSON,
  onRoadClick,
  onJunctionClick,
  selectedJunctionId,
  center = [77.6228, 12.9172], // Silk Board / Bengaluru default
  zoom = 12,
  interactive = true,
  showCitySearch = false,
  onCitySelect,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cityBoundary, setCityBoundary] = useState<CityBoundary | null>(null);
  const [cityRoads, setCityRoads] = useState<RoadSegment[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '&copy; CARTO &copy; OpenStreetMap',
          },
        },
        layers: [
          {
            id: 'carto-dark-layer',
            type: 'raster',
            source: 'carto-dark',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: center,
      zoom: zoom,
      interactive: interactive,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      // Add Road GeoJSON vector lines if provided
      if (roadGeoJSON) {
        map.addSource('road-segments-src', {
          type: 'geojson',
          data: roadGeoJSON as unknown as string,
        });

        // Base line layer colored by congestion level
        map.addLayer({
          id: 'road-segments-line',
          type: 'line',
          source: 'road-segments-src',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': [
              'step',
              ['get', 'congestion'],
              '#22c55e', // Green if <40%
              40,
              '#eab308', // Yellow if 40-70%
              70,
              '#ef4444', // Red if >70%
            ],
            'line-width': 7,
            'line-opacity': 0.85,
          },
        });

        // Hover & Click interaction handlers
        map.on('mouseenter', 'road-segments-line', () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'road-segments-line', () => {
          map.getCanvas().style.cursor = '';
        });

        map.on('click', 'road-segments-line', (e) => {
          if (e.features && e.features.length > 0 && onRoadClick) {
            const props = e.features[0].properties as RoadSegmentProperties;
            onRoadClick(props);
          }
        });
      }

      // Add city boundary layer if loaded
      if (cityBoundary) {
        map.addSource('city-boundary-src', {
          type: 'geojson',
          data: cityBoundary as unknown as string,
        });

        map.addLayer({
          id: 'city-boundary-fill',
          type: 'fill',
          source: 'city-boundary-src',
          paint: {
            'fill-color': '#06b6d4',
            'fill-opacity': 0.08,
          },
        });

        map.addLayer({
          id: 'city-boundary-line',
          type: 'line',
          source: 'city-boundary-src',
          paint: {
            'line-color': '#06b6d4',
            'line-width': 2,
            'line-dasharray': [3, 2],
          },
        });
      }

      // Add city roads layer if loaded
      if (cityRoads.length > 0) {
        map.addSource('city-roads-src', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: cityRoads,
          },
        });

        map.addLayer({
          id: 'city-roads-line',
          type: 'line',
          source: 'city-roads-src',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#64748b',
            'line-width': [
              'match',
              ['get', 'highway'],
              'motorway', 3,
              'trunk', 3,
              'primary', 2.5,
              'secondary', 2,
              1.5,
            ],
            'line-opacity': 0.6,
          },
        });
      }

      // Add Custom Route Lines
      routes.forEach((route) => {
        const sourceId = `route-source-${route.id}`;
        const layerId = `route-layer-${route.id}`;

        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: route.coordinates,
              },
            },
          });

          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': route.isRecommended
                ? '#06b6d4'
                : route.congestionLevel === 'severe'
                ? '#ef4444'
                : '#f59e0b',
              'line-width': route.isRecommended ? 6 : 4,
              'line-opacity': 0.85,
            },
          });
        }
      });

      // Add Markers for Junctions
      junctions.forEach((j) => {
        const el = document.createElement('div');
        const isSelected = j.id === selectedJunctionId;
        el.className =
          `w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-125 border-2 shadow-lg ${
            isSelected ? 'border-white scale-125 ring-2 ring-cyan-400' : 'border-slate-900'
          }`;

        if (j.status === 'critical') {
          el.style.backgroundColor = '#ef4444';
          el.style.boxShadow = '0 0 12px #ef4444';
        } else if (j.status === 'red') {
          el.style.backgroundColor = '#f97316';
        } else if (j.status === 'yellow') {
          el.style.backgroundColor = '#eab308';
        } else {
          el.style.backgroundColor = '#22c55e';
        }

        const inner = document.createElement('div');
        inner.className = 'w-2 h-2 rounded-full bg-white';
        el.appendChild(inner);

        // Click handler for junction inspection
        el.addEventListener('click', () => {
          if (onJunctionClick) onJunctionClick(j);
        });

        const popupContent = `
          <div style="font-family: sans-serif;">
            <h4 style="margin: 0; font-size: 14px; font-weight: bold; color: #38bdf8;">${j.name}</h4>
            <p style="margin: 4px 0 0; font-size: 12px; color: #cbd5e1;">City: ${j.city}</p>
            <div style="margin-top: 6px; font-size: 11px;">
              <div>Wait Time: <strong style="color: #f8fafc;">${j.currentWaitTimeSec}s</strong></div>
              <div>Congestion: <strong style="color: ${j.congestionIndex > 80 ? '#ef4444' : '#22c55e'};">${j.congestionIndex}%</strong></div>
              <div>Signal Mode: <strong style="color: #38bdf8;">${j.signalMode.toUpperCase()}</strong></div>
            </div>
          </div>
        `;

        new maplibregl.Marker(el)
          .setLngLat([j.lng, j.lat])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(popupContent))
          .addTo(map);
      });

      // Add Markers for Incidents
      incidents.forEach((inc) => {
        const el = document.createElement('div');
        el.className =
          'w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-lg animate-pulse border-2 border-white cursor-pointer';
        el.innerHTML = '⚠️';

        const popupContent = `
          <div style="font-family: sans-serif;">
            <h4 style="margin: 0; font-size: 13px; font-weight: bold; color: #ef4444;">${inc.title}</h4>
            <p style="margin: 4px 0; font-size: 11px; color: #94a3b8;">${inc.locationName}</p>
            <div style="font-size: 11px; color: #cbd5e1;">Delay: ~${inc.estimatedDelayMin} mins</div>
          </div>
        `;

        new maplibregl.Marker(el)
          .setLngLat([inc.lng, inc.lat])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(popupContent))
          .addTo(map);
      });

      // Add Digital Twin Node Markers
      digitalTwinNodes.forEach((node) => {
        const el = document.createElement('div');
        el.className =
          'w-8 h-8 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center cursor-pointer text-cyan-300 font-mono text-[10px] font-bold shadow-cyan-500/50 shadow-md';
        el.innerText = 'TWIN';

        new maplibregl.Marker(el)
          .setLngLat([node.lng, node.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(`
              <div style="font-family: monospace;">
                <h4 style="color: #22d3ee; margin: 0;">${node.name}</h4>
                <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">
                  <div>Flow: ${node.currentFlowRateHr} veh/hr</div>
                  <div>Actual Speed: ${node.averageSpeedKmh} km/h</div>
                  <div>Twin Speed: ${node.simulatedSpeedKmh} km/h</div>
                </div>
              </div>
            `)
          )
          .addTo(map);
      });
    });

    return () => {
      map.remove();
    };
  }, [junctions, incidents, digitalTwinNodes, routes, roadGeoJSON, onRoadClick, onJunctionClick, selectedJunctionId, center, zoom, interactive, showCitySearch, onCitySelect, cityBoundary, cityRoads]);

  // Handle city search input
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchPlaces(value, 5);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  // Handle city selection
  const handleCitySelect = useCallback(async (city: GeocodingResult) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [city.lng, city.lat],
        zoom: 12,
        duration: 2000,
      });
    }

    // Load city boundary and roads
    const cityName = city.displayName.split(',')[0].trim();
    const boundary = await getCityBoundary(cityName);
    if (boundary) {
      setCityBoundary(boundary);
    }

    const roads = await getCityRoads(cityName);
    setCityRoads(roads);

    if (onCitySelect) {
      onCitySelect(city);
    }

    setSearchResults([]);
    setSearchQuery(cityName);
  }, [onCitySelect]);

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* City Search Overlay */}
      {showCitySearch && (
        <div className="absolute top-3 left-3 z-20 w-80">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search city (e.g., Mumbai, Delhi, Bengaluru)..."
              className="w-full px-4 py-2.5 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg overflow-hidden shadow-xl">
                {searchResults.map((result) => (
                  <button
                    key={result.placeId}
                    onClick={() => handleCitySelect(result)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-800/50 border-b border-slate-800 last:border-b-0 transition-colors"
                  >
                    <div className="text-sm font-medium text-slate-200 truncate">
                      {result.displayName.split(',').slice(0, 2).join(',')}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {result.type} • {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1.5 z-10 shadow-lg">
        <div className="font-semibold text-slate-400 text-[10px] uppercase font-mono">Map Layer Legend</div>
        <div className="flex items-center gap-2">
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
        {cityBoundary && (
          <div className="pt-2 mt-2 border-t border-slate-700">
            <div className="text-cyan-400 font-medium">📍 {cityBoundary.properties.name}</div>
            <div className="text-slate-500">Roads loaded: {cityRoads.length}</div>
          </div>
        )}
      </div>
    </div>
  );
};
