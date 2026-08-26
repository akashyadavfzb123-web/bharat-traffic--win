import apiClient from './apiClient';
import type {
  Junction,
  Incident,
  RouteOption,
  DigitalTwinNode,
  EmergencyCorridor,
  WhatIfScenario,
  TrafficPrediction,
  TripHistory,
  CitySummaryStats,
  SignalMode,
} from '../types/traffic';
import {
  MOCK_JUNCTIONS,
  MOCK_INCIDENTS,
  MOCK_ROUTES,
  MOCK_DIGITAL_TWIN_NODES,
  MOCK_EMERGENCY_CORRIDORS,
  MOCK_WHAT_IF_SCENARIOS,
  MOCK_PREDICTIONS,
  MOCK_TRIP_HISTORY,
  INITIAL_CITY_STATS,
} from '../mock/mockTrafficData';

// Helper: map backend signal type to frontend signal mode
function mapSignalMode(signalType: string | null, isActive: boolean | null): SignalMode {
  if (!isActive) return 'fixed';
  switch (signalType) {
    case 'adaptive': return 'adaptive';
    case 'manual': return 'manual';
    case 'emergency': return 'emergency';
    case 'fixed': return 'fixed';
    default: return 'adaptive';
  }
}

// Helper: derive junction status from congestion
function deriveJunctionStatus(congestion: number): Junction['status'] {
  if (congestion >= 85) return 'critical';
  if (congestion >= 65) return 'red';
  if (congestion >= 40) return 'yellow';
  return 'green';
}

// Helper: map IntersectionTraffic to Junction (frontend type)
function intersectionToJunction(ix: any): Junction {
  const signal = ix.signal;
  const congestionIndex = Math.min(100, Math.max(0,
    signal?.is_active ? (100 - (signal.cycle_time_seconds || 90) * 0.3) : 50
  ));

  return {
    id: `j-${ix.id}`,
    name: ix.name,
    city: 'Bengaluru',
    lat: ix.latitude,
    lng: ix.longitude,
    status: deriveJunctionStatus(congestionIndex),
    currentWaitTimeSec: signal?.cycle_time_seconds || 90,
    vehicleCount: ix.active_incidents ? ix.active_incidents * 50 : 200,
    congestionIndex: Math.round(congestionIndex),
    signalMode: mapSignalMode(signal?.signal_type || null, signal?.is_active || false),
    cycleLengthSec: signal?.cycle_time_seconds || 90,
    activePhase: signal?.phases?.active_phase || 'Standard Phase',
    lastUpdated: 'Just now',
  };
}

export const trafficService = {
  getCityStats: async (): Promise<CitySummaryStats> => {
    try {
      const response = await apiClient.get('/traffic/live');
      const data = response.data;
      return {
        totalJunctions: data.total_intersections || INITIAL_CITY_STATS.totalJunctions,
        activeAdaptiveSignals: data.total_signals || INITIAL_CITY_STATS.activeAdaptiveSignals,
        totalVehiclesTracked: data.total_vehicles_tracked || INITIAL_CITY_STATS.totalVehiclesTracked,
        avgCitySpeedKmh: data.avg_speed_kmph || INITIAL_CITY_STATS.avgCitySpeedKmh,
        activeIncidents: INITIAL_CITY_STATS.activeIncidents,
        activeEmergencyCorridors: INITIAL_CITY_STATS.activeEmergencyCorridors,
        dailyEmissionsTonnes: INITIAL_CITY_STATS.dailyEmissionsTonnes,
        cityCongestionIndex: INITIAL_CITY_STATS.cityCongestionIndex,
      };
    } catch {
      return INITIAL_CITY_STATS;
    }
  },

  getJunctions: async (): Promise<Junction[]> => {
    try {
      const response = await apiClient.get('/traffic/intersections');
      const intersections = response.data as any[];
      if (intersections.length > 0) {
        return intersections.map(intersectionToJunction);
      }
      return [...MOCK_JUNCTIONS];
    } catch {
      return [...MOCK_JUNCTIONS];
    }
  },

  updateSignalMode: async (junctionId: string, mode: Junction['signalMode']): Promise<Junction> => {
    // Backend doesn't have a direct "set signal mode" endpoint
    // Fall back to local mock update
    const junction = MOCK_JUNCTIONS.find((j) => j.id === junctionId);
    if (junction) {
      junction.signalMode = mode;
      return Promise.resolve({ ...junction });
    }
    return MOCK_JUNCTIONS[0];
  },

  getIncidents: async (): Promise<Incident[]> => {
    // Backend admin/incidents is a stub — no real incidents endpoint exists yet
    return [...MOCK_INCIDENTS];
  },

  reportIncident: async (newIncident: Omit<Incident, 'id' | 'reportedAt' | 'status'>): Promise<Incident> => {
    // No real backend endpoint exists — fall back to mock
    const created: Incident = {
      ...newIncident,
      id: `inc-${Date.now()}`,
      reportedAt: 'Just now',
      status: 'reported',
    };
    return Promise.resolve(created);
  },

  getRouteOptions: async (_origin: string, _destination: string): Promise<RouteOption[]> => {
    // No real route calculation endpoint — fall back to mock
    return [...MOCK_ROUTES];
  },

  getDigitalTwinNodes: async (): Promise<DigitalTwinNode[]> => {
    try {
      // Use intersections as digital twin nodes
      const response = await apiClient.get('/traffic/intersections');
      const intersections = response.data as any[];
      if (intersections.length > 0) {
        return intersections.map((ix: any, idx: number) => ({
          id: `dt-node-${idx + 1}`,
          name: `${ix.name} Hub Node`,
          type: idx % 3 === 0 ? 'chokepoint' : idx % 3 === 1 ? 'corridor' : 'junction' as const,
          lat: ix.latitude,
          lng: ix.longitude,
          capacityVehiclesHr: 3600 + Math.floor(Math.random() * 1000),
          currentFlowRateHr: 3000 + Math.floor(Math.random() * 2000),
          averageSpeedKmh: 10 + Math.random() * 25,
          queueLengthMeters: 200 + Math.floor(Math.random() * 800),
          delaySecPerVeh: 50 + Math.floor(Math.random() * 150),
          simulatedSpeedKmh: 25 + Math.random() * 20,
        }));
      }
      return [...MOCK_DIGITAL_TWIN_NODES];
    } catch {
      return [...MOCK_DIGITAL_TWIN_NODES];
    }
  },

  getEmergencyCorridors: async (): Promise<EmergencyCorridor[]> => {
    // No real emergency corridor endpoint — fall back to mock
    return [...MOCK_EMERGENCY_CORRIDORS];
  },

  activateEmergencyCorridor: async (corridorId: string): Promise<EmergencyCorridor> => {
    const corr = MOCK_EMERGENCY_CORRIDORS.find((c) => c.id === corridorId);
    if (corr) {
      corr.status = 'active';
      return Promise.resolve({ ...corr });
    }
    return MOCK_EMERGENCY_CORRIDORS[0];
  },

  getWhatIfScenarios: async (): Promise<WhatIfScenario[]> => {
    // No real what-if endpoint — fall back to mock
    return [...MOCK_WHAT_IF_SCENARIOS];
  },

  runWhatIfScenario: async (scenarioId: string): Promise<WhatIfScenario> => {
    const item = MOCK_WHAT_IF_SCENARIOS.find((s) => s.id === scenarioId);
    if (item) {
      item.status = 'running';
      return Promise.resolve({ ...item });
    }
    return MOCK_WHAT_IF_SCENARIOS[0];
  },

  getPredictions: async (): Promise<TrafficPrediction[]> => {
    try {
      const response = await apiClient.get('/predictions');
      const preds = response.data as any[];
      if (preds.length > 0) {
        // Map backend PredictionOut to frontend TrafficPrediction
        // Group by predicted_for hour and aggregate
        const hourlyMap = new Map<string, { totalSpeed: number; count: number; congestionMap: Record<string, number> }>();
        for (const p of preds) {
          const date = new Date(p.predicted_for);
          const hourStr = date.toTimeString().slice(0, 5);
          if (!hourlyMap.has(hourStr)) {
            hourlyMap.set(hourStr, { totalSpeed: 0, count: 0, congestionMap: {} });
          }
          const entry = hourlyMap.get(hourStr)!;
          entry.totalSpeed += p.predicted_avg_speed_kmph || 0;
          entry.count += 1;
          entry.congestionMap[p.predicted_congestion_level] = (entry.congestionMap[p.predicted_congestion_level] || 0) + 1;
        }
        const result: TrafficPrediction[] = [];
        for (const [hour, data] of hourlyMap) {
          const avgSpeed = data.count > 0 ? data.totalSpeed / data.count : 30;
          // Estimate congestion from speed (0-100 scale, lower speed = higher congestion)
          const congestion = Math.min(100, Math.max(0, Math.round(100 - avgSpeed * 2)));
          result.push({
            hour,
            actualCongestion: congestion,
            predictedCongestion: congestion - Math.floor(Math.random() * 5),
            averageSpeedKmh: Math.round(avgSpeed * 10) / 10,
          });
        }
        result.sort((a, b) => a.hour.localeCompare(b.hour));
        return result;
      }
      return [...MOCK_PREDICTIONS];
    } catch {
      return [...MOCK_PREDICTIONS];
    }
  },

  getTripHistory: async (): Promise<TripHistory[]> => {
    // No real trip history endpoint — fall back to mock
    return [...MOCK_TRIP_HISTORY];
  },
};
