import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Junction, Incident, RouteOption, DigitalTwinNode } from '../../types/traffic';
import type { RoadGeoJSONCollection, RoadSegmentProperties } from '../../data/mockGeoJSON';
import type { SyntheticCamera, SyntheticSensor, SyntheticBusStop, SyntheticMetroStation } from '../../types/synthetic';
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
  Camera,
  Radio,
  AlertTriangle,
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
  selectedRouteId?: string | null;
  onRoadClick?: (road: RoadSegmentProperties) => void;
  onJunctionClick?: (junction: Junction) => void;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  interactive?: boolean;
  /** Synthetic data objects from SyntheticTrafficProvider */
  cameras?: SyntheticCamera[];
  sensors?: SyntheticSensor[];
  busStops?: SyntheticBusStop[];
  metroStations?: SyntheticMetroStation[];
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
  selectedRouteId,
  onRoadClick,
  onJunctionClick,
  center,
  zoom = 12,
  interactive = true,
  cameras = [],
  sensors = [],
  busStops = [],
  metroStations = [],
}) => {
  const { selectedCity, setSelectedCity } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isMapLoadedRef = useRef<boolean>(false);

  // Persistent marker references to prevent DOM tearing / marker blinking
  const junctionMarkersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLElement; popup: maplibregl.Popup }>>(new Map());
  const vehicleMarkersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLElement; popup: maplibregl.Popup }>>(new Map());
  const incidentMarkersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLElement }>>(new Map());
  const cameraMarkersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLElement }>>(new Map());
  const sensorMarkersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLElement }>>(new Map());
  const busStopMarkersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLElement }>>(new Map());
  const metroMarkersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLElement }>>(new Map());
  const routeMarkersRef = useRef<maplibregl.Marker[]>([]);
  const searchMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [currentStyle, setCurrentStyle] = useState<MapStyleType>('dark');
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showCameras, setShowCameras] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showTransit, setShowTransit] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  const cityConfig = CITIES[selectedCity] || CITIES['Bengaluru'];
  const activeCenter = center || cityConfig.center;

  // Clear all markers helper
  const clearAllMarkers = () => {
    junctionMarkersRef.current.forEach((item) => item.marker.remove());
    junctionMarkersRef.current.clear();

    vehicleMarkersRef.current.forEach((item) => item.marker.remove());
    vehicleMarkersRef.current.clear();

    incidentMarkersRef.current.forEach((item) => item.marker.remove());
    incidentMarkersRef.current.clear();

    cameraMarkersRef.current.forEach((item) => item.marker.remove());
    cameraMarkersRef.current.clear();

    sensorMarkersRef.current.forEach((item) => item.marker.remove());
    sensorMarkersRef.current.clear();

    busStopMarkersRef.current.forEach((item) => item.marker.remove());
    busStopMarkersRef.current.clear();

    metroMarkersRef.current.forEach((item) => item.marker.remove());
    metroMarkersRef.current.clear();

    routeMarkersRef.current.forEach((m) => m.remove());
    routeMarkersRef.current = [];

    searchMarkersRef.current.forEach((m) => m.remove());
    searchMarkersRef.current = [];
  };

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
      clearAllMarkers();
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

      const m = new maplibregl.Marker({ color: '#06b6d4' })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup().setHTML(`<b style="color: #0284c7;">${res.display_name}</b>`))
        .addTo(mapRef.current);
      searchMarkersRef.current.push(m);
    }
    setSearchResults([]);
    setSearchQuery('');
  };

  // 1. Initialize Map ONCE per container / currentStyle / selectedCity
  useEffect(() => {
    if (!mapContainerRef.current) return;
    isMapLoadedRef.current = false;
    clearAllMarkers();

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
      isMapLoadedRef.current = true;
      updateMapData(map);
    });

    return () => {
      isMapLoadedRef.current = false;
      clearAllMarkers();
      map.remove();
      mapRef.current = null;
    };
  }, [currentStyle, selectedCity]);

  // Function to smoothly update layers & markers WITHOUT tearing down or flickering
  const updateMapData = (map: maplibregl.Map) => {
    if (!map || !isMapLoadedRef.current) return;

    // 1. Traffic Flow Lines (GeoJSON Source Update)
    const targetGeoJSON = roadGeoJSON || cityConfig.roadsGeoJSON;
    if (map.getSource('road-segments-src')) {
      (map.getSource('road-segments-src') as maplibregl.GeoJSONSource).setData(targetGeoJSON as any);
      map.setLayoutProperty('road-segments-line', 'visibility', showTrafficLayer ? 'visible' : 'none');
      map.setLayoutProperty('road-segments-glow', 'visibility', showTrafficLayer ? 'visible' : 'none');
    } else if (targetGeoJSON) {
      map.addSource('road-segments-src', {
        type: 'geojson',
        data: targetGeoJSON as unknown as string,
      });

      map.addLayer({
        id: 'road-segments-glow',
        type: 'line',
        source: 'road-segments-src',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility: showTrafficLayer ? 'visible' : 'none',
        },
        paint: {
          'line-color': [
            'step',
            ['get', 'congestion'],
            'rgba(34, 197, 94, 0.2)',
            40,
            'rgba(234, 179, 8, 0.3)',
            70,
            'rgba(239, 68, 68, 0.6)',
          ],
          'line-width': 12,
          'line-blur': 3,
        },
      });

      map.addLayer({
        id: 'road-segments-line',
        type: 'line',
        source: 'road-segments-src',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility: showTrafficLayer ? 'visible' : 'none',
        },
        paint: {
          'line-color': [
            'step',
            ['get', 'congestion'],
            '#22c55e',
            40,
            '#eab308',
            70,
            '#ef4444',
          ],
          'line-width': 7,
          'line-opacity': 0.9,
        },
      });

      map.on('click', 'road-segments-line', (e) => {
        if (e.features && e.features.length > 0 && onRoadClick) {
          onRoadClick(e.features[0].properties as any);
        }
      });

      // Add road click popup for synthetic data with all required fields
      map.on('click', 'road-segments-line', (e) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties as any;
        const coordinates = (e as any).lngLat;

        const trafficLevelLabel = props.trafficLevel === 'free_flow'
          ? '<span style="color: #22c55e; font-weight: bold;">Free Flow</span>'
          : props.trafficLevel === 'slow'
          ? '<span style="color: #eab308; font-weight: bold;">Slow Traffic</span>'
          : props.trafficLevel === 'congested'
          ? '<span style="color: #ef4444; font-weight: bold;">Congested</span>'
          : '<span style="color: #dc2626; font-weight: bold;">Gridlock</span>';

        const popupHtml = `
          <div style="font-family: monospace; padding: 6px; min-width: 220px;">
            <div style="border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px;">
              <div style="font-size: 12px; font-weight: bold; color: #38bdf8;">${props.name || 'Unknown Road'}</div>
            </div>
            <div style="font-size: 10px; color: #94a3b8; line-height: 1.8;">
              <div>Speed: <strong style="color: #f8fafc;">${props.speed ?? props.avgSpeedKmh ?? '—'} km/h</strong></div>
              <div>Traffic Level: ${trafficLevelLabel}</div>
              <div>Vehicles: <strong style="color: #f8fafc;">${props.vehicleCount ?? '—'}</strong></div>
              <div>Congestion: <strong style="color: ${props.congestion > 70 ? '#ef4444' : props.congestion > 40 ? '#eab308' : '#22c55e'};">${props.congestion ?? '—'}%</strong></div>
              <div>Queue Length: <strong style="color: #f8fafc;">${props.queueLength ?? '—'} vehicles</strong></div>
              <div style="margin-top: 6px; padding: 3px 6px; background: rgba(56, 189, 248, 0.1); border-radius: 4px; color: #38bdf8; font-weight: bold;">
                Data Source: SYNTHETIC DEMO
              </div>
            </div>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 15 })
          .setLngLat(coordinates)
          .setHTML(popupHtml)
          .addTo(map);

        // Remove popup on next click
        map.once('click', () => popup.remove());
      });
    }

    // 2. Custom Route Lines
    (routes || []).forEach((route) => {
      const sourceId = `route-source-${route.id}`;
      const layerId = `route-layer-${route.id}`;

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route.coordinates,
          },
        });
      } else {
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
            'line-color':
              selectedRouteId && route.id === selectedRouteId
                ? '#06b6d4'
                : route.isRecommended
                ? '#06b6d4'
                : route.congestionLevel === 'severe'
                ? '#ef4444'
                : '#f59e0b',
            'line-width':
              selectedRouteId && route.id === selectedRouteId
                ? 7
                : route.isRecommended
                ? 5
                : 3,
            'line-opacity':
              selectedRouteId
                ? route.id === selectedRouteId
                  ? 1.0
                  : 0.35
                : 0.85,
          },
        });
      }
    });

    // 2b. Route Origin / Destination Markers (only recreate if count changed)
    if (routes.length > 0 && routeMarkersRef.current.length === 0) {
      const firstRoute = routes[0];
      if (firstRoute.coordinates && firstRoute.coordinates.length >= 2) {
        const originEl = document.createElement('div');
        originEl.className = 'w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg z-30';
        originEl.innerHTML = '<span class="text-[9px] font-bold text-white">A</span>';
        const m1 = new maplibregl.Marker({ element: originEl })
          .setLngLat(firstRoute.coordinates[0])
          .setPopup(new maplibregl.Popup().setHTML(`<b style='color:#10b981;'>Origin:</b> ${firstRoute.origin || 'Start'}`))
          .addTo(map);
        routeMarkersRef.current.push(m1);

        const destEl = document.createElement('div');
        destEl.className = 'w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center shadow-lg z-30';
        destEl.innerHTML = '<span class="text-[9px] font-bold text-white">B</span>';
        const m2 = new maplibregl.Marker({ element: destEl })
          .setLngLat(firstRoute.coordinates[firstRoute.coordinates.length - 1])
          .setPopup(new maplibregl.Popup().setHTML(`<b style='color:#ef4444;'>Destination:</b> ${firstRoute.destination || 'End'}`))
          .addTo(map);
        routeMarkersRef.current.push(m2);
      }
    } else if (routes.length === 0 && routeMarkersRef.current.length > 0) {
      routeMarkersRef.current.forEach((m) => m.remove());
      routeMarkersRef.current = [];
    }

    // 3. Render / Update Incidents Persistently
    (incidents || []).forEach((inc) => {
      if (!incidentMarkersRef.current.has(inc.id)) {
        const el = document.createElement('div');
        el.className =
          'w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-lg animate-pulse border-2 border-white cursor-pointer';
        el.innerHTML = '⚠️';

        const marker = new maplibregl.Marker(el)
          .setLngLat([inc.lng, inc.lat])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<b>${inc.title}</b><br/>${inc.locationName}`))
          .addTo(map);

        incidentMarkersRef.current.set(inc.id, { marker, el });
      }
    });
    // Toggle visibility
    incidentMarkersRef.current.forEach((item) => {
      item.el.style.display = showIncidents ? '' : 'none';
    });

    // 4. Render / Update Camera Markers (Synthetic)
    cameras.forEach((cam) => {
      if (cameraMarkersRef.current.has(cam.id)) return;
      const el = document.createElement('div');
      el.className = 'w-6 h-6 rounded-lg bg-blue-900/80 border-2 border-blue-400/60 flex items-center justify-center cursor-pointer shadow-md z-20 transition-transform hover:scale-125';
      el.innerHTML = '📷';
      el.title = cam.name;

      const statusColor = cam.status === 'online' ? '#22c55e' : '#ef4444';
      const popupHtml = `
        <div style="font-family: monospace; padding: 4px; min-width: 180px;">
          <div style="font-size: 11px; font-weight: bold; color: #38bdf8;">${cam.name}</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
            <div>Type: <strong style="color: #f8fafc;">${cam.type}</strong></div>
            <div>Status: <strong style="color: ${statusColor};">${cam.status}</strong></div>
          </div>
        </div>
      `;
      const marker = new maplibregl.Marker(el)
        .setLngLat([cam.lng, cam.lat])
        .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(popupHtml))
        .addTo(map);
      cameraMarkersRef.current.set(cam.id, { marker, el });
    });
    cameraMarkersRef.current.forEach((item) => {
      item.el.style.display = showCameras ? '' : 'none';
    });

    // 5. Render / Update Sensor Markers (Synthetic)
    sensors.forEach((sens) => {
      if (sensorMarkersRef.current.has(sens.id)) return;
      const el = document.createElement('div');
      el.className = 'w-6 h-6 rounded-lg bg-purple-900/80 border-2 border-purple-400/60 flex items-center justify-center cursor-pointer shadow-md z-20 transition-transform hover:scale-125';
      el.innerHTML = '📡';
      el.title = sens.name;

      const statusColor = sens.status === 'active' ? '#22c55e' : '#ef4444';
      const popupHtml = `
        <div style="font-family: monospace; padding: 4px; min-width: 180px;">
          <div style="font-size: 11px; font-weight: bold; color: #a855f7;">${sens.name}</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
            <div>Type: <strong style="color: #f8fafc;">${sens.type}</strong></div>
            <div>Reading: <strong style="color: #f8fafc;">${sens.reading}</strong></div>
            <div>Status: <strong style="color: ${statusColor};">${sens.status}</strong></div>
          </div>
        </div>
      `;
      const marker = new maplibregl.Marker(el)
        .setLngLat([sens.lng, sens.lat])
        .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(popupHtml))
        .addTo(map);
      sensorMarkersRef.current.set(sens.id, { marker, el });
    });
    sensorMarkersRef.current.forEach((item) => {
      item.el.style.display = showSensors ? '' : 'none';
    });

    // 6. Render / Update Bus Stop Markers (Synthetic Transit)
    busStops.forEach((b) => {
      if (busStopMarkersRef.current.has(b.id)) return;
      const el = document.createElement('div');
      el.className = 'w-6 h-6 rounded-lg bg-cyan-800/80 border-2 border-cyan-400/60 flex items-center justify-center cursor-pointer shadow-md z-20 transition-transform hover:scale-125';
      el.innerHTML = '🚌';
      el.title = b.name;

      const popupHtml = `
        <div style="font-family: monospace; padding: 4px; min-width: 180px;">
          <div style="font-size: 11px; font-weight: bold; color: #22d3ee;">${b.name}</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
            <div>Routes: <strong style="color: #f8fafc;">${b.routes.join(', ')}</strong></div>
          </div>
        </div>
      `;
      const marker = new maplibregl.Marker(el)
        .setLngLat([b.lng, b.lat])
        .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(popupHtml))
        .addTo(map);
      busStopMarkersRef.current.set(b.id, { marker, el });
    });
    busStopMarkersRef.current.forEach((item) => {
      item.el.style.display = showTransit ? '' : 'none';
    });

    // 7. Render / Update Metro Station Markers (Synthetic Transit)
    metroStations.forEach((m) => {
      if (metroMarkersRef.current.has(m.id)) return;
      const el = document.createElement('div');
      el.className = 'w-6 h-6 rounded-lg bg-emerald-800/80 border-2 border-emerald-400/60 flex items-center justify-center cursor-pointer shadow-md z-20 transition-transform hover:scale-125';
      el.innerHTML = '🚇';
      el.title = m.name;

      const popupHtml = `
        <div style="font-family: monospace; padding: 4px; min-width: 180px;">
          <div style="font-size: 11px; font-weight: bold; color: #34d399;">${m.name}</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
            <div>Line: <strong style="color: #f8fafc;">${m.line}</strong></div>
          </div>
        </div>
      `;
      const marker = new maplibregl.Marker(el)
        .setLngLat([m.lng, m.lat])
        .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(popupHtml))
        .addTo(map);
      metroMarkersRef.current.set(m.id, { marker, el });
    });
    metroMarkersRef.current.forEach((item) => {
      item.el.style.display = showTransit ? '' : 'none';
    });

    // 8. Render / Update Junction Markers PERSISTENTLY (No remove/recreate!)
    const activeJunctions = (junctions && junctions.length > 0) ? junctions : cityConfig.junctions;
    activeJunctions.forEach((j: any) => {
      const statusColor =
        j.status === 'critical' ? '#ef4444' :
        j.status === 'red' ? '#f97316' :
        j.status === 'yellow' ? '#eab308' : '#22c55e';

      const popupHtml = `
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

      const existing = junctionMarkersRef.current.get(j.id);
      if (existing) {
        existing.el.style.backgroundColor = statusColor;
        existing.el.style.boxShadow = j.status === 'critical' ? '0 0 12px #ef4444' : 'none';
        existing.popup.setHTML(popupHtml);
      } else {
        const el = document.createElement('div');
        el.className =
          'w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all border-2 border-slate-900 shadow-lg';
        el.style.backgroundColor = statusColor;
        if (j.status === 'critical') el.style.boxShadow = '0 0 12px #ef4444';

        const inner = document.createElement('div');
        inner.className = 'w-2 h-2 rounded-full bg-white';
        el.appendChild(inner);

        el.addEventListener('click', () => {
          if (onJunctionClick) onJunctionClick(j);
        });

        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupHtml);
        const marker = new maplibregl.Marker(el)
          .setLngLat([j.lng, j.lat])
          .setPopup(popup)
          .addTo(map);

        junctionMarkersRef.current.set(j.id, { marker, el, popup });
      }
    });

    // 9. Render / Update Ambulances & Emergency Priority Vehicles
    (cityConfig.vehicles || [])
      .filter((v) => v.type === 'ambulance' || v.type === 'fire_brigade')
      .forEach((v) => {
        const popupHtml = `
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

        const existing = vehicleMarkersRef.current.get(v.id);
        if (existing) {
          existing.marker.setLngLat([v.lng, v.lat]);
          existing.popup.setHTML(popupHtml);
        } else {
          const el = document.createElement('div');
          el.className =
            'relative w-8 h-8 rounded-full bg-red-600 border-2 border-white text-white flex items-center justify-center font-black text-xs shadow-2xl cursor-pointer transition-transform hover:scale-125 z-30 animate-bounce';
          el.style.boxShadow = '0 0 16px #ef4444';
          el.innerHTML = `
            <span class="text-sm">🚑</span>
            <span class="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></span>
          `;

          const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupHtml);
          const marker = new maplibregl.Marker(el)
            .setLngLat([v.lng, v.lat])
            .setPopup(popup)
            .addTo(map);

          vehicleMarkersRef.current.set(v.id, { marker, el, popup });
        }
      });

    // 10. Render / Update Buses, Heavy Freight & Clusters
    (cityConfig.vehicles || [])
      .filter((v) => v.type === 'city_bus' || v.type === 'heavy_freight' || v.type === 'high_traffic_cluster')
      .forEach((v) => {
        const popupHtml = `
          <div style="font-family: monospace; padding: 4px; min-width: 180px;">
            <h4 style="margin: 0; font-size: 11px; font-weight: bold; color: #38bdf8;">${v.name}</h4>
            <div style="margin-top: 4px; font-size: 10px; color: #94a3b8;">
              <div>Speed: <strong>${v.speedKmh} km/h</strong></div>
              <div>Corridor: <strong>${v.destination}</strong></div>
              <div style="color: #cbd5e1; margin-top: 2px;">${v.detail}</div>
            </div>
          </div>
        `;

        const existing = vehicleMarkersRef.current.get(v.id);
        if (existing) {
          existing.marker.setLngLat([v.lng, v.lat]);
          existing.popup.setHTML(popupHtml);
        } else {
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

          const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupHtml);
          const marker = new maplibregl.Marker(el)
            .setLngLat([v.lng, v.lat])
            .setPopup(popup)
            .addTo(map);

          vehicleMarkersRef.current.set(v.id, { marker, el, popup });
        }
      });
  };

  // 2. Reactively update map data whenever props or layer toggles change (WITHOUT destroying map canvas!)
  useEffect(() => {
    if (mapRef.current && isMapLoadedRef.current) {
      updateMapData(mapRef.current);
    }
  }, [junctions, incidents, digitalTwinNodes, routes, roadGeoJSON, selectedRouteId, showTrafficLayer, showIncidents, showCameras, showSensors, showTransit, cameras, sensors, busStops, metroStations]);

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

        {/* 3. Map Controls: 5 Layer Toggles + Style Menu */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Traffic Layer Toggle */}
          <button
            onClick={() => setShowTrafficLayer(!showTrafficLayer)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold font-mono border transition-all ${
              showTrafficLayer
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Zap className={`w-3 h-3 ${showTrafficLayer ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>Traffic Layer</span>
          </button>

          {/* Incidents Toggle */}
          <button
            onClick={() => setShowIncidents(!showIncidents)}
            title="Toggle Traffic Incidents"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold font-mono border transition-all ${
              showIncidents
                ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <AlertTriangle className={`w-3 h-3 ${showIncidents ? 'text-red-400' : ''}`} />
            <span>Incidents</span>
          </button>

          {/* Cameras Toggle */}
          <button
            onClick={() => setShowCameras(!showCameras)}
            title="Toggle Surveillance Cameras"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold font-mono border transition-all ${
              showCameras
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <Camera className={`w-3 h-3 ${showCameras ? 'text-blue-400' : ''}`} />
            <span>Cameras</span>
          </button>

          {/* Sensors Toggle */}
          <button
            onClick={() => setShowSensors(!showSensors)}
            title="Toggle Road Sensors & Weather Stations"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold font-mono border transition-all ${
              showSensors
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <Radio className={`w-3 h-3 ${showSensors ? 'text-purple-400' : ''}`} />
            <span>Sensors</span>
          </button>

          {/* Transit Toggle */}
          <button
            onClick={() => setShowTransit(!showTransit)}
            title="Toggle Bus Stops & Metro Stations"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold font-mono border transition-all ${
              showTransit
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            <Bus className={`w-3 h-3 ${showTransit ? 'text-cyan-400' : ''}`} />
            <span>Transit</span>
          </button>

          {/* Synthetic Demo Badge */}
          <span className="px-2 py-1 rounded-md text-[9px] font-bold font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 hidden sm:flex items-center gap-1">
            SYNTHETIC DEMO
          </span>

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

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1.5 z-10 shadow-lg font-mono max-w-[260px]">
          <div className="font-bold text-slate-400 text-[10px] uppercase flex items-center justify-between gap-4">
            <span>{selectedCity} Traffic Flow (Speed)</span>
            <span className="text-amber-400 text-[9px]">SYNTHETIC DEMO</span>
          </div>

          {/* Traffic Flow Speed */}
          <div className="space-y-0.5 text-[10px] pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-emerald-500 inline-block rounded" />
              <span>Green (&gt; 40 km/h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-amber-500 inline-block rounded" />
              <span>Yellow (20–40 km/h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-red-500 inline-block rounded shadow-[0_0_8px_#ef4444]" />
              <span className="text-red-400">Red (&lt; 20 km/h)</span>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-slate-800 pt-1 space-y-0.5 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">⚠️</span>
              <span className="text-red-300">Incident</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">📷</span>
              <span className="text-blue-300">Camera</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🚌</span>
              <span className="text-cyan-300">Bus Stop</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🚇</span>
              <span className="text-emerald-300">Metro Station</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
