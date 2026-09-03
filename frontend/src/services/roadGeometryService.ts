/**
 * Road Geometry Service
 *
 * Fetches real road geometry from OpenStreetMap via the Overpass API.
 * This replaces the hardcoded straight-line coordinates with actual
 * road paths so the traffic color overlay follows real roads.
 *
 * Flow:
 *   1. Map loads → collect road IDs + bounding boxes
 *   2. Query Overpass API for way geometry within each bbox
 *   3. Match returned ways to our road segments by proximity
 *   4. Replace coordinates in the GeoJSON features
 */

import type { RoadGeoJSONCollection, GeoJSONRoadFeature } from '../data/mockGeoJSON';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

/**
 * Bounding boxes for each city [south, west, north, east].
 * Used to limit Overpass queries to the relevant area.
 */
const CITY_BBOXES: Record<string, [number, number, number, number]> = {
  'Bengaluru': [12.85, 77.55, 13.10, 77.80],
  'Delhi-NCR': [28.40, 76.85, 28.90, 77.55],
  'Mumbai': [18.85, 72.75, 19.25, 73.10],
  'Hyderabad': [17.25, 78.25, 17.60, 78.60],
};

/**
 * Known road names to search for in OSM.
 * Each entry maps our road ID to an Overpass search query.
 */
const ROAD_OSM_QUERIES: Record<string, Record<string, string>> = {
  'Bengaluru': {
    'blr-r1': '["highway"]["name"~"Outer Ring Road",i]',
    'blr-r2': '["highway"]["name"~"Marathahalli",i]',
    'blr-r3': '["highway"]["name"~"HAL.*Airport",i]',
    'blr-r4': '["highway"]["name"~"Hosur Road",i]',
  },
  'Delhi-NCR': {
    'del-r1': '["highway"]["name"~"Ring Road",i]',
    'del-r2': '["highway"]["name"~"NH 48|Delhi.*Gurgaon",i]',
    'del-r3': '["highway"]["name"~"DND",i]',
  },
  'Mumbai': {
    'bom-r1': '["highway"]["name"~"Western Express",i]',
    'bom-r2': '["highway"]["name"~"Bandra.*Worli",i]',
    'bom-r3': '["highway"]["name"~"Eastern Freeway",i]',
  },
  'Hyderabad': {
    'hyd-r1': '["highway"]["name"~"Outer Ring Road",i]',
    'hyd-r2': '["highway"]["name"~"HITECH|Cyber.*Towers",i]',
    'hyd-r3': '["highway"]["name"~"PVNR|P.V.",i]',
  },
};

interface OverpassWay {
  id: number;
  nodes: number[];
  geometry?: Array<{ lat: number; lon: number }>;
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassWay[];
}

/**
 * Build an Overpass QL query to find road ways in a bounding box.
 */
function buildOverpassQuery(bbox: [number, number, number, number], roadFilter: string): string {
  const [south, west, north, east] = bbox;
  return `
    [out:json][timeout:15];
    (
      way${roadFilter}(${south},${west},${north},${east});
    );
    out body geom;
  `;
}

/**
 * Find the closest matching OSM way to our road segment's endpoints.
 * Returns the way's geometry as [lng, lat][] coordinates.
 */
function matchWayToRoad(
  ways: OverpassWay[],
  startPoint: [number, number],
  endPoint: [number, number],
): [number, number][] | null {
  if (ways.length === 0) return null;

  let bestWay: OverpassWay | null = null;
  let bestScore = Infinity;

  for (const way of ways) {
    if (!way.geometry || way.geometry.length < 2) continue;

    const wayStart = way.geometry[0];
    const wayEnd = way.geometry[way.geometry.length - 1];

    // Calculate distance from our endpoints to the way's endpoints
    const distStartToStart = haversine(startPoint[1], startPoint[0], wayStart.lat, wayStart.lon);
    const distEndToEnd = haversine(endPoint[1], endPoint[0], wayEnd.lat, wayEnd.lon);
    const distStartToEnd = haversine(startPoint[1], startPoint[0], wayEnd.lat, wayEnd.lon);
    const distEndToStart = haversine(endPoint[1], endPoint[0], wayStart.lat, wayStart.lon);

    // Score: prefer ways where endpoints are closest
    const score = Math.min(
      distStartToStart + distEndToEnd,
      distStartToEnd + distEndToStart,
    );

    if (score < bestScore) {
      bestScore = score;
      bestWay = way;
    }
  }

  if (!bestWay || !bestWay.geometry) return null;

  // If the way starts from the "wrong" end, reverse it
  const wayStart = bestWay.geometry[0];
  const wayEnd = bestWay.geometry[bestWay.geometry.length - 1];
  const directDist = haversine(startPoint[1], startPoint[0], wayStart.lat, wayStart.lon);
  const reverseDist = haversine(startPoint[1], startPoint[0], wayEnd.lat, wayEnd.lon);

  const coords = bestWay.geometry.map((p) => [p.lon, p.lat] as [number, number]);
  return reverseDist < directDist ? coords.reverse() : coords;
}

/**
 * Haversine distance in km between two lat/lng points.
 */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Cache to avoid re-fetching
const geometryCache = new Map<string, [number, number][]>();

/**
 * Fetch real road geometry from OSM for a city's road segments.
 * Returns the same GeoJSON but with real coordinates replacing the straight lines.
 */
export async function fetchRoadGeometry(
  geoJSON: RoadGeoJSONCollection,
  cityName: string,
): Promise<RoadGeoJSONCollection> {
  const bbox = CITY_BBOXES[cityName];
  const queries = ROAD_OSM_QUERIES[cityName];
  if (!bbox || !queries) return geoJSON;

  const enrichedFeatures: GeoJSONRoadFeature[] = [];

  for (const feature of geoJSON.features) {
    const roadId = feature.properties.id;
    const cached = geometryCache.get(`${cityName}:${roadId}`);
    if (cached) {
      enrichedFeatures.push({
        ...feature,
        geometry: { type: 'LineString', coordinates: cached },
      });
      continue;
    }

    const filter = queries[roadId];
    if (!filter) {
      enrichedFeatures.push(feature);
      continue;
    }

    try {
      const query = buildOverpassQuery(bbox, filter);
      const response = await fetch(OVERPASS_URL, {
        method: 'POST',
        body: new URLSearchParams({ data: query }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (!response.ok) throw new Error(`Overpass ${response.status}`);

      const data: OverpassResponse = await response.json();
      const coords = feature.geometry.coordinates;
      const startPoint = coords[0];
      const endPoint = coords[coords.length - 1];
      const matchedCoords = matchWayToRoad(data.elements, startPoint, endPoint);

      if (matchedCoords && matchedCoords.length > 3) {
        geometryCache.set(`${cityName}:${roadId}`, matchedCoords);
        enrichedFeatures.push({
          ...feature,
          geometry: { type: 'LineString', coordinates: matchedCoords },
        });
      } else {
        enrichedFeatures.push(feature);
      }
    } catch {
      // If OSM fails, keep the original coordinates
      enrichedFeatures.push(feature);
    }
  }

  return { ...geoJSON, features: enrichedFeatures };
}
