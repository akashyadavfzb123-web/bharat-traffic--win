// ── What-If Simulation Mock Data ──

export type ScenarioType = 'accident' | 'road_closure' | 'heavy_rain' | 'festival' | 'traffic_surge' | 'signal_failure' | 'vip_movement';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface WhatIfMetrics {
  speed: number;        // km/h
  waitTime: number;     // seconds
  queue: number;        // meters
  throughput: number;   // vehicles/hour
  congestion: number;   // 0-100%
}

export interface WhatIfSimulation {
  id: string;
  type: ScenarioType;
  name: string;
  city: string;
  road: string;
  duration: string;
  trafficIncreasePct: number;
  severity: SeverityLevel;
  before: WhatIfMetrics;
  after: WhatIfMetrics;
  mitigation: string;
  status: 'idle' | 'running' | 'completed';
  affectedJunctions: number;
  estimatedRecoveryMin: number;
}

export const SCENARIO_TYPE_CONFIG: Record<ScenarioType, { label: string; icon: string; color: string; defaultIncrease: number }> = {
  accident: { label: 'Accident', icon: '🚗', color: 'red', defaultIncrease: 45 },
  road_closure: { label: 'Road Closure', icon: '🚧', color: 'amber', defaultIncrease: 60 },
  heavy_rain: { label: 'Heavy Rain', icon: '🌧️', color: 'cyan', defaultIncrease: 35 },
  festival: { label: 'Festival', icon: '🎪', color: 'purple', defaultIncrease: 80 },
  traffic_surge: { label: 'Traffic Surge', icon: '📈', color: 'amber', defaultIncrease: 55 },
  signal_failure: { label: 'Signal Failure', icon: '🔴', color: 'red', defaultIncrease: 70 },
  vip_movement: { label: 'VIP Movement', icon: '🏛️', color: 'emerald', defaultIncrease: 40 },
};

export const MOCK_CITIES = ['Bengaluru', 'Delhi-NCR', 'Mumbai', 'Hyderabad'];
export const MOCK_ROADS = [
  'ORR South (Silk Board–Bellandur)',
  'Hosur Road Elevated',
  'MG Road CBD Corridor',
  'Hebbal Flyover–Ballari Road',
  'ORR East (Bellandur–Marathahalli)',
  'Whitefield Main Road',
  'Koramangala 100ft Road',
  'Mysore Road Elevated',
];
export const MOCK_DURATIONS = ['15 min', '30 min', '1 hour', '2 hours', '4 hours', 'Full day'];
export const MOCK_SEVERITIES: SeverityLevel[] = ['low', 'medium', 'high', 'critical'];

export const BASE_METRICS: WhatIfMetrics = {
  speed: 24.5,
  waitTime: 120,
  queue: 480,
  throughput: 3200,
  congestion: 68,
};

// ── Pre-built completed simulations ──
export const MOCK_COMPLETED_SIMULATIONS: WhatIfSimulation[] = [
  {
    id: 'sim-01',
    type: 'accident',
    name: 'Multi-vehicle Pile-up on ORR South',
    city: 'Bengaluru',
    road: 'ORR South (Silk Board–Bellandur)',
    duration: '1 hour',
    trafficIncreasePct: 45,
    severity: 'high',
    before: { speed: 24.5, waitTime: 120, queue: 480, throughput: 3200, congestion: 68 },
    after: { speed: 11.2, waitTime: 285, queue: 1250, throughput: 1800, congestion: 94 },
    mitigation: 'Activate Inner Ring Road detour. Divert via Bannerghatta Rd. Deploy 2 traffic police units.',
    status: 'completed',
    affectedJunctions: 8,
    estimatedRecoveryMin: 75,
  },
  {
    id: 'sim-02',
    type: 'road_closure',
    name: 'Silk Board Flyover Maintenance (2 Lanes)',
    city: 'Bengaluru',
    road: 'ORR South (Silk Board–Bellandur)',
    duration: '4 hours',
    trafficIncreasePct: 60,
    severity: 'critical',
    before: { speed: 24.5, waitTime: 120, queue: 480, throughput: 3200, congestion: 68 },
    after: { speed: 8.5, waitTime: 340, queue: 1680, throughput: 1200, congestion: 97 },
    mitigation: 'Divert heavy vehicles via Hosur Road Elevated. Enable green wave on Bannerghatta Rd. Alert citizens 2 hours prior.',
    status: 'completed',
    affectedJunctions: 12,
    estimatedRecoveryMin: 240,
  },
  {
    id: 'sim-03',
    type: 'heavy_rain',
    name: 'Heavy Rain Event (50mm/hr) — Citywide',
    city: 'Bengaluru',
    road: 'ORR East (Bellandur–Marathahalli)',
    duration: '2 hours',
    trafficIncreasePct: 35,
    severity: 'high',
    before: { speed: 24.5, waitTime: 120, queue: 480, throughput: 3200, congestion: 68 },
    after: { speed: 14.8, waitTime: 210, queue: 920, throughput: 2100, congestion: 86 },
    mitigation: 'Activate waterlogging alerts. Deploy BBMP pump squads to Tin Factory underpass. Reduce signal cycle lengths by 20%.',
    status: 'completed',
    affectedJunctions: 24,
    estimatedRecoveryMin: 90,
  },
  {
    id: 'sim-04',
    type: 'vip_movement',
    name: 'VIP Convoy — Airport to Raj Bhavan',
    city: 'Bengaluru',
    road: 'Hebbal Flyover–Ballari Road',
    duration: '30 min',
    trafficIncreasePct: 40,
    severity: 'medium',
    before: { speed: 24.5, waitTime: 120, queue: 480, throughput: 3200, congestion: 68 },
    after: { speed: 16.2, waitTime: 195, queue: 780, throughput: 2400, congestion: 82 },
    mitigation: 'Pre-emptive green wave on Hebbal–Ballari corridor. Deploy traffic police at 6 junctions. Divert local traffic via Sahakara Nagar Rd.',
    status: 'completed',
    affectedJunctions: 6,
    estimatedRecoveryMin: 30,
  },
];

// ── Compute simulation results based on inputs ──
export function computeSimulation(
  _type: ScenarioType,
  trafficIncrease: number,
  severity: SeverityLevel
): { before: WhatIfMetrics; after: WhatIfMetrics } {
  const severityMultiplier = { low: 0.5, medium: 0.75, high: 1.0, critical: 1.25 }[severity];
  const impact = (trafficIncrease / 100) * severityMultiplier;

  const after: WhatIfMetrics = {
    speed: Math.max(3, Math.round((BASE_METRICS.speed * (1 - impact * 0.7)) * 10) / 10),
    waitTime: Math.round(BASE_METRICS.waitTime * (1 + impact * 1.8)),
    queue: Math.round(BASE_METRICS.queue * (1 + impact * 2.2)),
    throughput: Math.round(BASE_METRICS.throughput * (1 - impact * 0.5)),
    congestion: Math.min(99, Math.round(BASE_METRICS.congestion + impact * 35)),
  };

  return { before: { ...BASE_METRICS }, after };
}

// ── Recovery timeline (mock 12-point curve) ──
export function getRecoveryTimeline(before: WhatIfMetrics, after: WhatIfMetrics): { minute: string; speed: number; congestion: number }[] {
  const points = 12;
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const ease = 1 - Math.pow(1 - t, 2); // ease-out curve
    return {
      minute: `+${Math.round(t * 120)}m`,
      speed: Math.round((after.speed + (before.speed - after.speed) * ease) * 10) / 10,
      congestion: Math.round(after.congestion + (before.congestion - after.congestion) * ease * -1),
    };
  });
}
