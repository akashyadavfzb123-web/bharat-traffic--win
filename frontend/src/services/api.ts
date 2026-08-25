import axios from 'axios';
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

// Configured for future FastAPI backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Flag to toggle mock data during Phase 1
const USE_MOCK = true;

export const trafficService = {
  getCityStats: async (): Promise<CitySummaryStats> => {
    if (USE_MOCK) return Promise.resolve(INITIAL_CITY_STATS);
    const response = await apiClient.get<CitySummaryStats>('/stats');
    return response.data;
  },

  getJunctions: async (): Promise<Junction[]> => {
    if (USE_MOCK) return Promise.resolve([...MOCK_JUNCTIONS]);
    const response = await apiClient.get<Junction[]>('/junctions');
    return response.data;
  },

  updateSignalMode: async (junctionId: string, mode: Junction['signalMode']): Promise<Junction> => {
    if (USE_MOCK) {
      const junction = MOCK_JUNCTIONS.find((j) => j.id === junctionId);
      if (junction) junction.signalMode = mode;
      return Promise.resolve(junction || MOCK_JUNCTIONS[0]);
    }
    const response = await apiClient.patch<Junction>(`/junctions/${junctionId}/signal`, { mode });
    return response.data;
  },

  getIncidents: async (): Promise<Incident[]> => {
    if (USE_MOCK) return Promise.resolve([...MOCK_INCIDENTS]);
    const response = await apiClient.get<Incident[]>('/incidents');
    return response.data;
  },

  reportIncident: async (newIncident: Omit<Incident, 'id' | 'reportedAt' | 'status'>): Promise<Incident> => {
    if (USE_MOCK) {
      const created: Incident = {
        ...newIncident,
        id: `inc-${Date.now()}`,
        reportedAt: 'Just now',
        status: 'reported',
      };
      MOCK_INCIDENTS.unshift(created);
      return Promise.resolve(created);
    }
    const response = await apiClient.post<Incident>('/incidents', newIncident);
    return response.data;
  },

  getRouteOptions: async (origin: string, destination: string): Promise<RouteOption[]> => {
    if (USE_MOCK) {
      console.log(`Calculating route from ${origin} to ${destination}...`);
      return Promise.resolve([...MOCK_ROUTES]);
    }
    const response = await apiClient.post<RouteOption[]>('/route/calculate', { origin, destination });
    return response.data;
  },

  getDigitalTwinNodes: async (): Promise<DigitalTwinNode[]> => {
    if (USE_MOCK) return Promise.resolve([...MOCK_DIGITAL_TWIN_NODES]);
    const response = await apiClient.get<DigitalTwinNode[]>('/digital-twin/nodes');
    return response.data;
  },

  getEmergencyCorridors: async (): Promise<EmergencyCorridor[]> => {
    if (USE_MOCK) return Promise.resolve([...MOCK_EMERGENCY_CORRIDORS]);
    const response = await apiClient.get<EmergencyCorridor[]>('/emergency-corridors');
    return response.data;
  },

  activateEmergencyCorridor: async (corridorId: string): Promise<EmergencyCorridor> => {
    if (USE_MOCK) {
      const corr = MOCK_EMERGENCY_CORRIDORS.find((c) => c.id === corridorId);
      if (corr) corr.status = 'active';
      return Promise.resolve(corr || MOCK_EMERGENCY_CORRIDORS[0]);
    }
    const response = await apiClient.post<EmergencyCorridor>(`/emergency-corridors/${corridorId}/activate`);
    return response.data;
  },

  getWhatIfScenarios: async (): Promise<WhatIfScenario[]> => {
    if (USE_MOCK) return Promise.resolve([...MOCK_WHAT_IF_SCENARIOS]);
    const response = await apiClient.get<WhatIfScenario[]>('/scenarios');
    return response.data;
  },

  runWhatIfScenario: async (scenarioId: string): Promise<WhatIfScenario> => {
    if (USE_MOCK) {
      const item = MOCK_WHAT_IF_SCENARIOS.find((s) => s.id === scenarioId);
      if (item) item.status = 'running';
      return Promise.resolve(item || MOCK_WHAT_IF_SCENARIOS[0]);
    }
    const response = await apiClient.post<WhatIfScenario>(`/scenarios/${scenarioId}/run`);
    return response.data;
  },

  getPredictions: async (): Promise<TrafficPrediction[]> => {
    if (USE_MOCK) return Promise.resolve([...MOCK_PREDICTIONS]);
    const response = await apiClient.get<TrafficPrediction[]>('/predictions');
    return response.data;
  },

  getTripHistory: async (): Promise<TripHistory[]> => {
    if (USE_MOCK) return Promise.resolve([...MOCK_TRIP_HISTORY]);
    const response = await apiClient.get<TripHistory[]>('/trips');
    return response.data;
  },
};
