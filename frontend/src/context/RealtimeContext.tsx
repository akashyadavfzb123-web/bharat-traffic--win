import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  Junction,
  Incident,
  EmergencyCorridor,
  CitySummaryStats,
  DigitalTwinNode,
} from '../types/traffic';
import {
  MOCK_JUNCTIONS,
  MOCK_INCIDENTS,
  MOCK_EMERGENCY_CORRIDORS,
  MOCK_DIGITAL_TWIN_NODES,
  INITIAL_CITY_STATS,
} from '../mock/mockTrafficData';

export type SimulationSpeed = 'realtime' | 'fast' | 'paused';

interface TelemetrySnapshot {
  timestamp: number;
  junctions: Junction[];
  incidents: Incident[];
  emergencyCorridors: EmergencyCorridor[];
  digitalTwinNodes: DigitalTwinNode[];
  cityStats: CitySummaryStats;
  tickCount: number;
}

interface RealtimeContextType {
  snapshot: TelemetrySnapshot;
  isRunning: boolean;
  speed: SimulationSpeed;
  toggleSimulation: () => void;
  setSpeed: (speed: SimulationSpeed) => void;
  refreshJunctions: () => void;
  updateJunctionInSnapshot: (id: string, updates: Partial<Junction>) => void;
  updateCorridorInSnapshot: (id: string, updates: Partial<EmergencyCorridor>) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

// Helpers for realistic fluctuations
function fluctuate(value: number, range: number, min: number, max: number): number {
  const delta = (Math.random() - 0.5) * 2 * range;
  return Math.min(max, Math.max(min, Math.round((value + delta) * 10) / 10));
}

function fluctuateInt(value: number, range: number, min: number, max: number): number {
  return Math.round(fluctuate(value, range, min, max));
}

function mutateJunction(j: Junction): Junction {
  const newCongestion = fluctuateInt(j.congestionIndex, 3, 10, 98);
  const newWait = fluctuateInt(j.currentWaitTimeSec, 5, 15, 240);
  const newVehicleCount = fluctuateInt(j.vehicleCount, 30, 80, 2000);
  const newSpeed = fluctuate(j.avgSpeedKmh ?? 24, 2, 5, 60);

  let newStatus: Junction['status'] = 'green';
  if (newCongestion >= 85) newStatus = 'critical';
  else if (newCongestion >= 65) newStatus = 'red';
  else if (newCongestion >= 40) newStatus = 'yellow';

  return {
    ...j,
    congestionIndex: newCongestion,
    currentWaitTimeSec: newWait,
    vehicleCount: newVehicleCount,
    avgSpeedKmh: newSpeed,
    status: newStatus,
    lastUpdated: 'Just now',
  };
}

function mutateIncident(inc: Incident): Incident {
  // Occasionally advance status
  const shouldProgress = Math.random() < 0.05;
  let newStatus = inc.status;
  if (shouldProgress) {
    if (inc.status === 'reported') newStatus = 'dispatched';
    else if (inc.status === 'dispatched') newStatus = 'in_progress';
    else if (inc.status === 'in_progress') newStatus = 'resolved';
  }
  return { ...inc, status: newStatus };
}

function mutateDigitalTwinNode(node: DigitalTwinNode): DigitalTwinNode {
  return {
    ...node,
    currentFlowRateHr: fluctuateInt(node.currentFlowRateHr, 200, 1000, 6000),
    averageSpeedKmh: fluctuate(node.averageSpeedKmh, 2, 5, 60),
    simulatedSpeedKmh: fluctuate(node.simulatedSpeedKmh, 1.5, 10, 65),
    queueLengthMeters: fluctuateInt(node.queueLengthMeters, 40, 50, 1500),
    delaySecPerVeh: fluctuateInt(node.delaySecPerVeh, 8, 10, 250),
  };
}

// Add avgSpeedKmh to Junction if missing (it's not in the type but we use it in simulation)
function getJunctionSpeed(j: Junction): number {
  return (j as Junction & { avgSpeedKmh?: number }).avgSpeedKmh ?? 24;
}

function buildInitialSnapshot(): TelemetrySnapshot {
  return {
    timestamp: Date.now(),
    junctions: MOCK_JUNCTIONS.map((j) => ({ ...j })),
    incidents: MOCK_INCIDENTS.map((i) => ({ i, ...i })),
    emergencyCorridors: MOCK_EMERGENCY_CORRIDORS.map((c) => ({ ...c })),
    digitalTwinNodes: MOCK_DIGITAL_TWIN_NODES.map((n) => ({ ...n })),
    cityStats: { ...INITIAL_CITY_STATS },
    tickCount: 0,
  };
}

// We need to extend Junction with avgSpeedKmh for simulation
declare module '../types/traffic' {
  interface Junction {
    avgSpeedKmh?: number;
  }
}

const TICK_INTERVAL: Record<SimulationSpeed, number> = {
  realtime: 3000,
  fast: 1000,
  paused: 0,
};

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot>(buildInitialSnapshot);
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState<SimulationSpeed>('realtime');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    setSnapshot((prev) => {
      const newJunctions = prev.junctions.map(mutateJunction);
      const newIncidents = prev.incidents.map(mutateIncident);
      const newDigitalTwinNodes = prev.digitalTwinNodes.map(mutateDigitalTwinNode);

      const avgCongestion =
        Math.round(
          newJunctions.reduce((sum, j) => sum + j.congestionIndex, 0) / newJunctions.length
        );
      const avgSpeed =
        Math.round(
          (newJunctions.reduce((sum, j) => sum + getJunctionSpeed(j), 0) / newJunctions.length) * 10
        ) / 10;

      const newCityStats: CitySummaryStats = {
        ...prev.cityStats,
        cityCongestionIndex: avgCongestion,
        avgCitySpeedKmh: avgSpeed,
        activeIncidents: newIncidents.filter((i) => i.status !== 'resolved').length,
      };

      return {
        timestamp: Date.now(),
        junctions: newJunctions,
        incidents: newIncidents,
        emergencyCorridors: [...prev.emergencyCorridors],
        digitalTwinNodes: newDigitalTwinNodes,
        cityStats: newCityStats,
        tickCount: prev.tickCount + 1,
      };
    });
  }, []);

  // Interval management
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRunning && speed !== 'paused') {
      intervalRef.current = setInterval(tick, TICK_INTERVAL[speed]);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, speed, tick]);

  const toggleSimulation = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const refreshJunctions = useCallback(() => {
    setSnapshot((prev) => ({
      ...prev,
      junctions: prev.junctions.map(mutateJunction),
      timestamp: Date.now(),
    }));
  }, []);

  const updateJunctionInSnapshot = useCallback((id: string, updates: Partial<Junction>) => {
    setSnapshot((prev) => ({
      ...prev,
      junctions: prev.junctions.map((j) => (j.id === id ? { ...j, ...updates } : j)),
      timestamp: Date.now(),
    }));
  }, []);

  const updateCorridorInSnapshot = useCallback((id: string, updates: Partial<EmergencyCorridor>) => {
    setSnapshot((prev) => ({
      ...prev,
      emergencyCorridors: prev.emergencyCorridors.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
      timestamp: Date.now(),
    }));
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        snapshot,
        isRunning,
        speed,
        toggleSimulation,
        setSpeed,
        refreshJunctions,
        updateJunctionInSnapshot,
        updateCorridorInSnapshot,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
