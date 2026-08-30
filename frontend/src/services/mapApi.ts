/**
 * Map API Service
 * Uses Nominatim (OpenStreetMap) for geocoding and Overpass API for road data
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OVERPASS_BASE = 'https://overpass-api.de/api/interpreter';

// Rate limiting for Nominatim (1 request per second)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
  
  return fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'BharatTrafficTwin/1.0 (traffic-management-app)',
    },
  });
}

export interface GeocodingResult {
  placeId: number;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
  importance: number;
  address?: {
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  boundingBox?: [number, number, number, number]; // [south, north, west, east]
}

export interface CityBoundary {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    name: string;
    osmId: number;
  };
}

export interface RoadSegment {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
  properties: {
    osmId: number;
    name?: string;
    highway?: string;
    lanes?: number;
    maxspeed?: string;
    oneway?: string;
  };
}

/**
 * Search for cities/places using Nominatim
 */
export async function searchPlaces(
  query: string,
  limit: number = 5,
  viewbox?: [number, number, number, number] // [west, south, east, north]
): Promise<GeocodingResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: limit.toString(),
    addressdetails: '1',
    extratags: '1',
  });

  if (viewbox) {
    params.set('viewbox', `${viewbox[0]},${viewbox[1]},${viewbox[2]},${viewbox[3]}`);
    params.set('bounded', '0');
  }

  try {
    const response = await rateLimitedFetch(`${NOMINATIM_BASE}/search?${params}`);
    if (!response.ok) throw new Error('Geocoding failed');
    
    const data = await response.json();
    
    return data.map((item: any) => ({
      placeId: item.place_id,
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      importance: item.importance,
      address: item.address,
      boundingBox: item.boundingbox ? [
        parseFloat(item.boundingbox[0]),
        parseFloat(item.boundingbox[1]),
        parseFloat(item.boundingbox[2]),
        parseFloat(item.boundingbox[3]),
      ] : undefined,
    }));
  } catch (error) {
    console.error('Place search error:', error);
    return [];
  }
}

/**
 * Get city boundary from OpenStreetMap
 */
export async function getCityBoundary(cityName: string): Promise<CityBoundary | null> {
  try {
    // First, search for the city
    const results = await searchPlaces(cityName, 1);
    if (results.length === 0) return null;

    const city = results[0];
    
    // Get boundary from Nominatim
    const params = new URLSearchParams({
      format: 'json',
      polygon_geojson: '1',
    });

    const response = await rateLimitedFetch(
      `${NOMINATIM_BASE}/details?osmtype=${city.type === 'city' ? 'R' : 'N'}&osmid=${city.placeId}&${params}`
    );

    if (!response.ok) {
      // Fallback: use Overpass to get boundary
      return await getCityBoundaryOverpass(cityName);
    }

    const data = await response.json();
    
    if (data.geometry) {
      return {
        type: 'Feature',
        geometry: data.geometry,
        properties: {
          name: cityName,
          osmId: city.placeId,
        },
      };
    }

    return await getCityBoundaryOverpass(cityName);
  } catch (error) {
    console.error('City boundary error:', error);
    return null;
  }
}

/**
 * Get city boundary using Overpass API (fallback)
 */
async function getCityBoundaryOverpass(cityName: string): Promise<CityBoundary | null> {
  const query = `
    [out:json][timeout:25];
    area["name"="${cityName}"]["boundary"="administrative"]["admin_level"~"^(6|7|8)$"]->.searchArea;
    (
      way["boundary"="administrative"](area.searchArea);
      relation["boundary"="administrative"](area.searchArea);
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const response = await fetch(OVERPASS_BASE, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) throw new Error('Overpass query failed');

    const data = await response.json();
    
    // Parse OSM data to GeoJSON
    const elements = data.elements;
    const nodes = new Map<number, [number, number]>();
    const ways: any[] = [];
    const relations: any[] = [];

    elements.forEach((el: any) => {
      if (el.type === 'node') {
        nodes.set(el.id, [el.lon, el.lat]);
      } else if (el.type === 'way') {
        ways.push(el);
      } else if (el.type === 'relation') {
        relations.push(el);
      }
    });

    // Find the administrative boundary
    const adminRelation = relations.find(r => 
      r.tags?.boundary === 'administrative' && 
      (r.tags?.admin_level === '6' || r.tags?.admin_level === '7' || r.tags?.admin_level === '8')
    );

    if (adminRelation && adminRelation.members) {
      const outerWays = adminRelation.members
        .filter((m: any) => m.type === 'way' && m.role === 'outer')
        .map((m: any) => ways.find(w => w.id === m.ref))
        .filter(Boolean);

      if (outerWays.length > 0) {
        const coordinates = outerWays.map((way: any) => 
          way.nodes.map((nodeId: number) => nodes.get(nodeId)).filter(Boolean)
        );

        return {
          type: 'Feature',
          geometry: {
            type: coordinates.length === 1 ? 'Polygon' : 'MultiPolygon',
            coordinates: coordinates.length === 1 ? [coordinates[0]] : [coordinates],
          },
          properties: {
            name: cityName,
            osmId: adminRelation.id,
          },
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Overpass boundary error:', error);
    return null;
  }
}

/**
 * Get road network for a city area using Overpass API
 */
export async function getCityRoads(
  cityName: string,
  limit: number = 500
): Promise<RoadSegment[]> {
  const query = `
    [out:json][timeout:30];
    area["name"="${cityName}"]["boundary"="administrative"]["admin_level"~"^(6|7|8)$"]->.searchArea;
    (
      way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential)$"](area.searchArea);
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const response = await fetch(OVERPASS_BASE, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) throw new Error('Overpass query failed');

    const data = await response.json();
    
    // Parse OSM data to GeoJSON features
    const nodes = new Map<number, [number, number]>();
    const ways: any[] = [];

    data.elements.forEach((el: any) => {
      if (el.type === 'node') {
        nodes.set(el.id, [el.lon, el.lat]);
      } else if (el.type === 'way') {
        ways.push(el);
      }
    });

    const roadSegments: RoadSegment[] = ways.slice(0, limit).map(way => {
      const coordinates = way.nodes
        .map((nodeId: number) => nodes.get(nodeId))
        .filter(Boolean) as [number, number][];

      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates,
        },
        properties: {
          osmId: way.id,
          name: way.tags?.name,
          highway: way.tags?.highway,
          lanes: way.tags?.lanes ? parseInt(way.tags.lanes) : undefined,
          maxspeed: way.tags?.maxspeed,
          oneway: way.tags?.oneway,
        },
      };
    });

    return roadSegments;
  } catch (error) {
    console.error('Overpass roads error:', error);
    return [];
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodingResult | null> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    format: 'json',
    addressdetails: '1',
  });

  try {
    const response = await rateLimitedFetch(`${NOMINATIM_BASE}/reverse?${params}`);
    if (!response.ok) throw new Error('Reverse geocoding failed');
    
    const data = await response.json();
    
    return {
      placeId: data.place_id,
      displayName: data.display_name,
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
      type: data.type,
      importance: data.importance,
      address: data.address,
    };
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return null;
  }
}

/**
 * Calculate bounding box for a city
 */
export function calculateBoundingBox(
  coordinates: [number, number][]
): [number, number, number, number] {
  if (coordinates.length === 0) return [0, 0, 0, 0];

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  coordinates.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });

  return [minLng, minLat, maxLng, maxLat];
}
