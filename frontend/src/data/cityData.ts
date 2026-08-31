export interface CityConfig {
  id: string;
  name: string;
  state: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  junctions: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    status: 'critical' | 'red' | 'yellow' | 'green';
    waitTimeSec: number;
    queueLengthVeh: number;
    congestionPct: number;
  }>;
  roadsGeoJSON: {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      properties: {
        id: string;
        name: string;
        congestion: number;
        avgSpeedKmh: number;
        densityVehKm: number;
        roadStatus: string;
      };
      geometry: {
        type: 'LineString';
        coordinates: [number, number][];
      };
    }>;
  };
}

export const CITIES: Record<string, CityConfig> = {
  Bengaluru: {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    center: [77.5946, 12.9716],
    zoom: 12,
    junctions: [
      { id: 'blr-1', name: 'Silk Board Junction', lat: 12.9172, lng: 77.6228, status: 'critical', waitTimeSec: 226, queueLengthVeh: 1466, congestionPct: 94 },
      { id: 'blr-2', name: 'Dairy Circle Flyover', lat: 12.9348, lng: 77.605, status: 'red', waitTimeSec: 126, queueLengthVeh: 886, congestionPct: 79 },
      { id: 'blr-3', name: 'HSR Layout BDA Complex', lat: 12.9116, lng: 77.6476, status: 'yellow', waitTimeSec: 74, queueLengthVeh: 388, congestionPct: 67 },
      { id: 'blr-4', name: 'Hebbal Flyover Junction', lat: 13.0359, lng: 77.597, status: 'critical', waitTimeSec: 225, queueLengthVeh: 1640, congestionPct: 91 },
      { id: 'blr-5', name: 'MG Road Trinity Circle', lat: 12.973, lng: 77.6171, status: 'green', waitTimeSec: 49, queueLengthVeh: 306, congestionPct: 35 },
      { id: 'blr-6', name: 'Marathahalli Multiplex', lat: 12.9569, lng: 77.7011, status: 'red', waitTimeSec: 170, queueLengthVeh: 1070, congestionPct: 79 },
    ],
    roadsGeoJSON: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { id: 'blr-r1', name: 'Outer Ring Road (Silk Board - Bellandur)', congestion: 92, avgSpeedKmh: 11, densityVehKm: 145, roadStatus: 'Gridlock' },
          geometry: { type: 'LineString', coordinates: [[77.6228, 12.9172], [77.6408, 12.922], [77.66, 12.924], [77.6762, 12.9262]] },
        },
        {
          type: 'Feature',
          properties: { id: 'blr-r2', name: 'Bellandur to Marathahalli Expressway', congestion: 85, avgSpeedKmh: 14, densityVehKm: 110, roadStatus: 'Heavy Congestion' },
          geometry: { type: 'LineString', coordinates: [[77.6762, 12.9262], [77.69, 12.94], [77.7011, 12.9569]] },
        },
        {
          type: 'Feature',
          properties: { id: 'blr-r3', name: 'HAL Old Airport Road (CBD Bypass)', congestion: 32, avgSpeedKmh: 42, densityVehKm: 45, roadStatus: 'Clear' },
          geometry: { type: 'LineString', coordinates: [[77.6228, 12.9348], [77.65, 12.96], [77.68, 12.965], [77.72, 12.985]] },
        },
        {
          type: 'Feature',
          properties: { id: 'blr-r4', name: 'Hosur Road Elevated Expressway', congestion: 58, avgSpeedKmh: 34, densityVehKm: 75, roadStatus: 'Slow Traffic' },
          geometry: { type: 'LineString', coordinates: [[77.6228, 12.9172], [77.635, 12.89], [77.65, 12.85]] },
        },
      ],
    },
  },

  'Delhi-NCR': {
    id: 'delhi-ncr',
    name: 'Delhi-NCR',
    state: 'Delhi / Haryana / UP',
    center: [77.2090, 28.6139],
    zoom: 11.5,
    junctions: [
      { id: 'del-1', name: 'Connaught Place Outer Circle', lat: 28.6315, lng: 77.2167, status: 'yellow', waitTimeSec: 85, queueLengthVeh: 620, congestionPct: 65 },
      { id: 'del-2', name: 'DND Flyway Toll Plaza', lat: 28.5684, lng: 77.2796, status: 'critical', waitTimeSec: 210, queueLengthVeh: 1850, congestionPct: 92 },
      { id: 'del-3', name: 'Gurgaon IFFCO Chowk', lat: 28.4721, lng: 77.0725, status: 'red', waitTimeSec: 165, queueLengthVeh: 1240, congestionPct: 84 },
      { id: 'del-4', name: 'AIIMS Ring Road Flyover', lat: 28.5672, lng: 77.2100, status: 'critical', waitTimeSec: 240, queueLengthVeh: 1980, congestionPct: 96 },
      { id: 'del-5', name: 'Noida Sector 18 Underpass', lat: 28.5708, lng: 77.3261, status: 'green', waitTimeSec: 42, queueLengthVeh: 290, congestionPct: 38 },
    ],
    roadsGeoJSON: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { id: 'del-r1', name: 'Ring Road (AIIMS to Dhaula Kuan)', congestion: 94, avgSpeedKmh: 10, densityVehKm: 160, roadStatus: 'Gridlock' },
          geometry: { type: 'LineString', coordinates: [[77.2100, 28.5672], [77.1850, 28.5800], [77.1650, 28.5920]] },
        },
        {
          type: 'Feature',
          properties: { id: 'del-r2', name: 'Delhi-Gurgaon Expressway (NH-48)', congestion: 88, avgSpeedKmh: 18, densityVehKm: 135, roadStatus: 'Heavy Congestion' },
          geometry: { type: 'LineString', coordinates: [[77.1650, 28.5920], [77.1250, 28.5400], [77.0725, 28.4721]] },
        },
        {
          type: 'Feature',
          properties: { id: 'del-r3', name: 'DND Flyway (Mayur Vihar to Noida)', congestion: 76, avgSpeedKmh: 24, densityVehKm: 95, roadStatus: 'Slow Traffic' },
          geometry: { type: 'LineString', coordinates: [[77.2796, 28.5684], [77.3050, 28.5700], [77.3261, 28.5708]] },
        },
      ],
    },
  },

  Mumbai: {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    center: [72.8777, 19.0760],
    zoom: 11.5,
    junctions: [
      { id: 'bom-1', name: 'Bandra-Worli Sea Link Toll', lat: 19.0330, lng: 72.8170, status: 'critical', waitTimeSec: 250, queueLengthVeh: 2100, congestionPct: 95 },
      { id: 'bom-2', name: 'BKC Kalanagar Junction', lat: 19.0600, lng: 72.8530, status: 'red', waitTimeSec: 180, queueLengthVeh: 1420, congestionPct: 87 },
      { id: 'bom-3', name: 'Dadar TT Circle', lat: 19.0178, lng: 72.8478, status: 'yellow', waitTimeSec: 95, queueLengthVeh: 710, congestionPct: 68 },
      { id: 'bom-4', name: 'Western Express Highway (Andheri)', lat: 19.1197, lng: 72.8464, status: 'critical', waitTimeSec: 235, queueLengthVeh: 1890, congestionPct: 93 },
      { id: 'bom-5', name: 'Marine Drive Nariman Point', lat: 18.9260, lng: 72.8230, status: 'green', waitTimeSec: 35, queueLengthVeh: 240, congestionPct: 28 },
    ],
    roadsGeoJSON: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { id: 'bom-r1', name: 'Western Express Highway (Andheri to BKC)', congestion: 95, avgSpeedKmh: 9, densityVehKm: 175, roadStatus: 'Gridlock' },
          geometry: { type: 'LineString', coordinates: [[72.8464, 19.1197], [72.8500, 19.0900], [72.8530, 19.0600]] },
        },
        {
          type: 'Feature',
          properties: { id: 'bom-r2', name: 'Bandra-Worli Sea Link Corridor', congestion: 45, avgSpeedKmh: 55, densityVehKm: 60, roadStatus: 'Clear' },
          geometry: { type: 'LineString', coordinates: [[72.8350, 19.0500], [72.8170, 19.0330], [72.8150, 19.0050]] },
        },
        {
          type: 'Feature',
          properties: { id: 'bom-r3', name: 'Eastern Freeway (Chembur to South Mumbai)', congestion: 38, avgSpeedKmh: 62, densityVehKm: 42, roadStatus: 'Clear' },
          geometry: { type: 'LineString', coordinates: [[72.8900, 19.0400], [72.8600, 18.9800], [72.8400, 18.9400]] },
        },
      ],
    },
  },

  Hyderabad: {
    id: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    center: [78.4867, 17.3850],
    zoom: 12,
    junctions: [
      { id: 'hyd-1', name: 'HITECH City Cyber Towers', lat: 17.4504, lng: 78.3808, status: 'critical', waitTimeSec: 215, queueLengthVeh: 1520, congestionPct: 91 },
      { id: 'hyd-2', name: 'Gachibowli Bio-Diversity Flyover', lat: 17.4401, lng: 78.3615, status: 'red', waitTimeSec: 155, queueLengthVeh: 1100, congestionPct: 82 },
      { id: 'hyd-3', name: 'Begumpet Airport Road', lat: 17.4448, lng: 78.4682, status: 'yellow', waitTimeSec: 80, queueLengthVeh: 580, congestionPct: 62 },
      { id: 'hyd-4', name: 'Jubilee Hills Checkpost', lat: 17.4319, lng: 78.4072, status: 'critical', waitTimeSec: 195, queueLengthVeh: 1380, congestionPct: 89 },
      { id: 'hyd-5', name: 'Charminar Heritage Plaza', lat: 17.3616, lng: 78.4747, status: 'green', waitTimeSec: 40, queueLengthVeh: 260, congestionPct: 32 },
    ],
    roadsGeoJSON: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { id: 'hyd-r1', name: 'Outer Ring Road (Gachibowli to Shamshabad)', congestion: 25, avgSpeedKmh: 85, densityVehKm: 30, roadStatus: 'Clear' },
          geometry: { type: 'LineString', coordinates: [[78.3615, 17.4401], [78.3800, 17.3800], [78.4200, 17.2500]] },
        },
        {
          type: 'Feature',
          properties: { id: 'hyd-r2', name: 'HITECH City Main Arterial Corridor', congestion: 92, avgSpeedKmh: 12, densityVehKm: 148, roadStatus: 'Gridlock' },
          geometry: { type: 'LineString', coordinates: [[78.3615, 17.4401], [78.3808, 17.4504], [78.4072, 17.4319]] },
        },
        {
          type: 'Feature',
          properties: { id: 'hyd-r3', name: 'PVNR Elevated Expressway', congestion: 52, avgSpeedKmh: 45, densityVehKm: 70, roadStatus: 'Slow Traffic' },
          geometry: { type: 'LineString', coordinates: [[78.4480, 17.3950], [78.4350, 17.3600], [78.4200, 17.3200]] },
        },
      ],
    },
  },
};
