import React, { useEffect, useRef, useState } from 'react';
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
  Siren,
  Bus,
} from 'lucide-react';

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
}

type MapStyleType = 'dark' | 'satellite' | 'traffic' | 'streets';

const MAP_STYLES: Record<MapStyleType, { name: string; url: string; icon: string }> = {
  dark: {
    name: 'Command Dark',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    icon: '🌙',
  },
  satellite: {
    name: 'Satellite Aerial',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    icon: '🛰️',
  },
  traffic: {
    name: 'Traffic Density',
    url: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    icon: '🚦',
  },
  streets: {
    name: 'Standard Streets',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    icon: '🏙️',
  },
};

export const MapContainer: React.FC<MapProps> = ({
  junctions = [],
  incidents = [],
  digitalTwinNodes = [],
  routes = [],
  roadGeoJSON,
  onRoadClick,
  onJunctionClick,
  center,
  zoom = 12,
  interactive = true,
}) => {
  const { selectedCity, setSelectedCity } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [currentStyle, setCurrentStyle] = useState<MapStyleType>('dark');
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);
  const [showEmergencyVehicles, setShowEmergencyVehicles] = useState(true);
  const [showTransitVehicles, setShowTransitVehicles] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  const cityConfig = CITIES[selectedCity] || CITIES['Bengaluru'];
  const activeCenter = center || cityConfig.center;

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

  // Handle City Change
  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    const targetCity = CITIES[cityName];
    if (mapRef.current && targetCity) {
      mapRef.current.flyTo({
        center: targetCity.center,
        zoom: targetCity.zoom,
        speed: 1.2,
      });
    }
  };

  const handleSelectSearchResult = (res: SearchResult) => {
    const lat = parseFloat(res.lat);
    const lng = parseFloat(res.lon);
    if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        speed: 1.5,
      });

      new maplibregl.Marker({ color: '#06b6d4' })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup().setHTML(`<b style="color: #0284c7;">${res.display_name}</b>`))
        .addTo(mapRef.current);
    }
    setSearchResults([]);
    setSearchQuery('');
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const activeTileUrl = MAP_STYLES[currentStyle].url;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'base-tile-src': {
            type: 'raster',
            tiles: [activeTileUrl],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap &copy; Esri',
          },
        },
        layers: [
          {
            id: 'base-tile-layer',
            type: 'raster',
            source: 'base-tile-src',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: activeCenter,
      zoom: zoom,
      interactive: interactive,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      // 1. Render City Road GeoJSON polylines (Traffic Flow Lines: Green, Yellow, Red)
      const targetGeoJSON = roadGeoJSON || cityConfig.roadsGeoJSON;
      if (targetGeoJSON && showTrafficLayer) {
        map.addSource('road-segments-src', {
          type: 'geojson',
          data: targetGeoJSON as unknown as string,
        });

        // Outer casing glow layer for heavy congestion (Red)
        map.addLayer({
          id: 'road-segments-glow',
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
              'rgba(34, 197, 94, 0.2)', // Green glow
              40,
              'rgba(234, 179, 8, 0.3)',  // Yellow glow
              70,
              'rgba(239, 68, 68, 0.6)',  // Red pulsating glow
            ],
            'line-width': 12,
            'line-blur': 3,
          },
        });

        // Main Traffic Flow Line
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
              '#22c55e', // Green (>40 km/h Clear)
              40,
              '#eab308', // Yellow (20-40 km/h Slow)
              70,
              '#ef4444', // Red (<20 km/h Gridlock)
            ],
            'line-width': 7,
            'line-opacity': 0.9,
          },
        });

        map.on('mouseenter', 'road-segments-line', () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'road-segments-line', () => {
          map.getCanvas().style.cursor = '';
        });

        map.on('click', 'road-segments-line', (e) => {
          if (e.features && e.features.length > 0 && onRoadClick) {
            onRoadClick(e.features[0].properties as any);
          }
        });
      }

      // 2. Render Custom Route Lines
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

      // 3. Render Ambulances & Emergency Priority Vehicles
      if (showEmergencyVehicles) {
        (cityConfig.vehicles || [])
          .filter((v) => v.type === 'ambulance' || v.type === 'fire_brigade')
          .forEach((v) => {
            const el = document.createElement('div');
            el.className =
              'relative w-8 h-8 rounded-full bg-red-600 border-2 border-white text-white flex items-center justify-center font-black text-xs shadow-2xl cursor-pointer transition-transform hover:scale-125 z-30 animate-bounce';
            el.style.boxShadow = '0 0 16px #ef4444';

            el.innerHTML = `
              <span class="text-sm">🚑</span>
              <span class="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></span>
            `;

            const popupContent = `
              <div style="font-family: monospace; padding: 4px; min-width: 200px;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px;">
                  <span style="font-size: 11px; font-weight: bold; color: #ef4444; text-transform: uppercase;">🚑 Emergency Ambulance</span>
                  <span style="font-size: 9px; background: rgba(239,68,68,0.2); color: #f87171; padding: 2px 4px; border-radius: 4px;">PRIORITY</span>
                </div>
                <h4 style="margin: 0; font-size: 12px; font-weight: bold; color: #f8fafc;">${v.name}</h4>
                <div style="margin-top: 6px; font-size: 10px; color: #94a3b8; line-height: 1.4;">
                  <div>Speed: <strong style="color: #38bdf8;">${v.speedKmh} km/h</strong></div>
                  <div>Destination: <strong style="color: #f8fafc;">${v.destination}</strong></div>
                  <div>ETA: <strong style="color: #4ade80;">${v.etaMin || 8} mins</strong></div>
                  <div style="margin-top: 4px; color: #a7f3d0; background: rgba(16,185,129,0.15); padding: 3px; border-radius: 4px; font-weight: bold;">
                    ${v.detail || 'Green Corridor Active'}
                  </div>
                </div>
              </div>
            `;

            new maplibregl.Marker(el)
              .setLngLat([v.lng, v.lat])
              .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(popupContent))
              .addTo(map);
          });
      }

      // 4. Render Buses, Heavy Vehicles & Traffic Clusters
      if (showTransitVehicles) {
        (cityConfig.vehicles || [])
          .filter((v) => v.type === 'city_bus' || v.type === 'heavy_freight' || v.type === 'high_traffic_cluster')
          .forEach((v) => {
            const el = document.createElement('div');

            if (v.type === 'city_bus') {
              el.className =
                'w-7 h-7 rounded-lg bg-cyan-600 border-2 border-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-md cursor-pointer transition-transform hover:scale-125 z-20';
              el.innerHTML = '🚌';
            } else if (v.type === 'heavy_freight') {
              el.className =
                'w-7 h-7 rounded-lg bg-amber-600 border-2 border-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-md cursor-pointer transition-transform hover:scale-125 z-20';
              el.innerHTML = '🚛';
            } else {
              el.className =
                'w-8 h-8 rounded-full bg-red-950 border-2 border-red-500 text-red-400 flex items-center justify-center font-bold text-xs shadow-lg cursor-pointer transition-transform hover:scale-125 z-20 animate-pulse';
              el.innerHTML = '🚘';
            }

            const popupContent = `
              <div style="font-family: monospace; padding: 4px; min-width: 180px;">
                <h4 style="margin: 0; font-size: 11px; font-weight: bold; color: #38bdf8;">${v.name}</h4>
                <div style="margin-top: 4px; font-size: 10px; color: #94a3b8;">
                  <div>Speed: <strong>${v.speedKmh} km/h</strong></div>
                  <div>Corridor: <strong>${v.destination}</strong></div>
                  <div style="color: #cbd5e1; margin-top: 2px;">${v.detail}</div>
                </div>
              </div>
            `;

            new maplibregl.Marker(el)
              .setLngLat([v.lng, v.lat])
              .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(popupContent))
              .addTo(map);
          });
      }

      // 5. Render City Junction Markers
      const activeJunctions = junctions.length > 0 ? junctions : cityConfig.junctions;
      activeJunctions.forEach((j: any) => {
        const el = document.createElement('div');
        el.className =
          'w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-125 border-2 border-slate-900 shadow-lg';

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

        el.addEventListener('click', () => {
          if (onJunctionClick) onJunctionClick(j);
        });

        const popupContent = `
          <div style="font-family: monospace; padding: 4px;">
            <h4 style="margin: 0; font-size: 13px; font-weight: bold; color: #38bdf8;">${j.name}</h4>
            <p style="margin: 2px 0 0; font-size: 11px; color: #94a3b8;">Metro: ${selectedCity}</p>
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

      // 6. Render Incidents
      incidents.forEach((inc) => {
        const el = document.createElement('div');
        el.className =
          'w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-lg animate-pulse border-2 border-white cursor-pointer';
        el.innerHTML = '⚠️';

        new maplibregl.Marker(el)
          .setLngLat([inc.lng, inc.lat])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<b>${inc.title}</b><br/>${inc.locationName}`))
          .addTo(map);
      });
    });

    return () => {
      map.remove();
    };
  }, [junctions, incidents, digitalTwinNodes, routes, roadGeoJSON, currentStyle, showTrafficLayer, showEmergencyVehicles, showTransitVehicles, selectedCity, onJunctionClick, onRoadClick]);

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950 flex flex-col">
      {/* Top Map Header Control Bar: 4-City Tabs + Search + Toggles + Style Menu */}
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
        </div>

        {/* 2. City-Scoped Location Search Bar */}
        <div className="relative flex-1 max-w-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${selectedCity}...`}
              className="w-full pl-8 pr-7 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-30 max-h-48 overflow-y-auto font-mono text-xs">
              {searchResults.map((res) => (
                <div
                  key={res.place_id}
                  onClick={() => handleSelectSearchResult(res)}
                  className="p-2 hover:bg-cyan-500/20 cursor-pointer border-b border-slate-800/60 text-slate-200 flex items-start gap-2 text-[11px]"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{res.display_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Map Controls: Emergency Toggle + Transit Toggle + Traffic Layer + Map Style */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Emergency Ambulances Toggle */}
          <button
            onClick={() => setShowEmergencyVehicles(!showEmergencyVehicles)}
            title="Toggle Ambulances & Green Corridor Vehicles"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold font-mono border transition-all ${
              showEmergencyVehicles
                ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <Siren className={`w-3 h-3 ${showEmergencyVehicles ? 'text-red-400 animate-pulse' : ''}`} />
            <span>Ambulance</span>
          </button>

          {/* Public Transit Buses Toggle */}
          <button
            onClick={() => setShowTransitVehicles(!showTransitVehicles)}
            title="Toggle City Buses & Freight Vehicles"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold font-mono border transition-all ${
              showTransitVehicles
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <Bus className="w-3 h-3 text-cyan-400" />
            <span>Transit</span>
          </button>

          {/* Live Traffic Flow Layer Toggle */}
          <button
            onClick={() => setShowTrafficLayer(!showTrafficLayer)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold font-mono border transition-all ${
              showTrafficLayer
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Zap className={`w-3 h-3 ${showTrafficLayer ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>Flow Lines</span>
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
                    onClick={() => {
                      setCurrentStyle(styleKey);
                      setShowStyleMenu(false);
                    }}
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

      {/* Main Map Container Canvas */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* Legend Overlay: Traffic Flow Colors & Vehicle Markers */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1.5 z-10 shadow-lg font-mono">
          <div className="font-bold text-slate-400 text-[10px] uppercase flex items-center justify-between gap-4">
            <span>{selectedCity} Live Intelligence</span>
            <span className="text-cyan-400 text-[9px]">MapLibre Active</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-emerald-500 inline-block rounded" />
              <span>Green (&gt;40 km/h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-amber-500 inline-block rounded" />
              <span>Yellow (20-40)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-red-500 inline-block rounded shadow-[0_0_8px_#ef4444]" />
              <span className="text-red-400 font-bold">Red Gridlock</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🚑</span>
              <span className="text-red-300 font-bold">Ambulance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🚌</span>
              <span className="text-cyan-300">City Bus</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🚘</span>
              <span className="text-amber-300">Cluster</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
