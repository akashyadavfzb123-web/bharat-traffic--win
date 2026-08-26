// ── Emergency Corridor Mock Data ──

export type VehicleType = 'ambulance' | 'fire_brigade' | 'police' | 'vvip' | 'rescue';
export type CorridorStatus = 'idle' | 'simulated' | 'approved' | 'active' | 'cleared';

export interface CoordinatedSignal {
  junctionId: string;
  junctionName: string;
  distanceFromOriginKm: number;
  normalPhase: string;
  emergencyPhase: string;
  phaseDurationSec: number;
  status: 'pending' | 'pre-empted' | 'green' | 'cleared';
}

export interface EmergencyRoute {
  name: string;
  distanceKm: number;
  normalEtaMin: number;
  emergencyEtaMin: number;
  timeSavedMin: number;
  viaRoads: string[];
  coordinates: [number, number][];
}

export interface EmergencyCorridorData {
  id: string;
  vehicleType: VehicleType;
  vehicleId: string;
  vehicleCallsign: string;
  title: string;
  currentLocation: string;
  currentLat: number;
  currentLng: number;
  destination: string;
  destLat: number;
  destLng: number;
  route: EmergencyRoute;
  coordinatedSignals: CoordinatedSignal[];
  patientOrUnit: string;
  priority: 'critical' | 'high' | 'medium';
  status: CorridorStatus;
}

export const VEHICLE_TYPE_CONFIG: Record<VehicleType, { label: string; icon: string; color: string; bgGradient: string }> = {
  ambulance: { label: 'Ambulance', icon: '🚑', color: 'red', bgGradient: 'from-red-950/60 to-slate-900' },
  fire_brigade: { label: 'Fire Brigade', icon: '🚒', color: 'amber', bgGradient: 'from-amber-950/60 to-slate-900' },
  police: { label: 'Police Escort', icon: '🚔', color: 'cyan', bgGradient: 'from-cyan-950/60 to-slate-900' },
  vvip: { label: 'VVIP convoy', icon: '🏛️', color: 'purple', bgGradient: 'from-purple-950/60 to-slate-900' },
  rescue: { label: 'Rescue Unit', icon: '救援', color: 'emerald', bgGradient: 'from-emerald-950/60 to-slate-900' },
};

export const MOCK_EMERGENCY_CORRIDORS: EmergencyCorridorData[] = [
  {
    id: 'ec-001',
    vehicleType: 'ambulance',
    vehicleId: 'KA-01-A-4421',
    vehicleCallsign: 'MEDIC-07',
    title: 'Cardiac Emergency — St. Johns Hospital',
    currentLocation: 'HSR Layout Sector 1, Signal Junction',
    currentLat: 12.9116,
    currentLng: 77.6412,
    destination: 'St. Johns Medical College Hospital',
    destLat: 12.9295,
    destLng: 77.6105,
    route: {
      name: 'AI Optimized Green Corridor',
      distanceKm: 4.8,
      normalEtaMin: 22,
      emergencyEtaMin: 7,
      timeSavedMin: 15,
      viaRoads: ['HSR Layout Main Rd', 'BDA Complex Signal', 'Silk Board Link Rd', 'Bommanahalli Flyover', 'St. Johns Hospital Rd'],
      coordinates: [
        [77.6412, 12.9116],
        [77.635, 12.915],
        [77.628, 12.92],
        [77.62, 12.925],
        [77.615, 12.928],
        [77.6105, 12.9295],
      ],
    },
    coordinatedSignals: [
      { junctionId: 'ix-01', junctionName: 'HSR Layout BDA Signal', distanceFromOriginKm: 0.0, normalPhase: 'Standard Phase B', emergencyPhase: 'Green Override (N-S)', phaseDurationSec: 30, status: 'pre-empted' },
      { junctionId: 'ix-02', junctionName: 'Silk Board Link Junction', distanceFromOriginKm: 1.2, normalPhase: 'N-S Arterial Green', emergencyPhase: 'Green Override (S-N)', phaseDurationSec: 25, status: 'pre-empted' },
      { junctionId: 'ix-03', junctionName: 'Bommanahalli Junction', distanceFromOriginKm: 2.8, normalPhase: 'Standard Phase A', emergencyPhase: 'Green Override (N-S)', phaseDurationSec: 20, status: 'pending' },
      { junctionId: 'ix-04', junctionName: 'St. Johns Hospital Entry', distanceFromOriginKm: 4.5, normalPhase: 'Standard Phase B', emergencyPhase: 'Green Override (All)', phaseDurationSec: 15, status: 'pending' },
    ],
    patientOrUnit: 'Patient: Male, 58 yrs — Chest Pain',
    priority: 'critical',
    status: 'simulated',
  },
  {
    id: 'ec-002',
    vehicleType: 'fire_brigade',
    vehicleId: 'KA-05-F-0088',
    vehicleCallsign: 'ENGINE-04',
    title: 'Fire Emergency — Electronics City Warehouse',
    currentLocation: 'Jayanagar Fire Station, 4th Block',
    currentLat: 12.9295,
    currentLng: 77.5848,
    destination: 'Phoenix Industrial Warehouse, Electronic City Phase 1',
    destLat: 12.8456,
    destLng: 77.6605,
    route: {
      name: 'South Express Corridor',
      distanceKm: 14.2,
      normalEtaMin: 45,
      emergencyEtaMin: 18,
      timeSavedMin: 27,
      viaRoads: ['Jayanagar 4th Block', 'YS Circle', 'Hosur Road Elevated', 'Electronic City Phase 1 Ramp', 'Phoenix Warehouse Gate'],
      coordinates: [
        [77.5848, 12.9295],
        [77.595, 12.91],
        [77.61, 12.88],
        [77.63, 12.86],
        [77.65, 12.845],
        [77.6605, 12.8456],
      ],
    },
    coordinatedSignals: [
      { junctionId: 'ix-05', junctionName: 'YS Circle Junction', distanceFromOriginKm: 1.8, normalPhase: 'Standard Phase', emergencyPhase: 'Green Override (S)', phaseDurationSec: 35, status: 'pending' },
      { junctionId: 'ix-06', junctionName: 'Hosur Road Entry Ramp', distanceFromOriginKm: 3.5, normalPhase: 'Highway Merge', emergencyPhase: 'Green Override', phaseDurationSec: 25, status: 'pending' },
      { junctionId: 'ix-07', junctionName: 'Bommanahalli Signal', distanceFromOriginKm: 6.2, normalPhase: 'Standard Phase A', emergencyPhase: 'Green Override (S)', phaseDurationSec: 30, status: 'pending' },
      { junctionId: 'ix-08', junctionName: 'Electronic City Toll', distanceFromOriginKm: 9.8, normalPhase: 'Toll Free Flow', emergencyPhase: 'Barrier Open', phaseDurationSec: 10, status: 'pending' },
      { junctionId: 'ix-09', junctionName: 'Phoenix Warehouse Gate', distanceFromOriginKm: 14.0, normalPhase: 'Standard Phase', emergencyPhase: 'All Green', phaseDurationSec: 15, status: 'pending' },
    ],
    patientOrUnit: 'Unit: Engine Tender + 6 Firefighters',
    priority: 'high',
    status: 'idle',
  },
  {
    id: 'ec-003',
    vehicleType: 'ambulance',
    vehicleId: 'KA-03-A-7712',
    vehicleCallsign: 'MEDIC-12',
    title: 'Trauma Case — Multi-vehicle Accident',
    currentLocation: 'Koramangala 100ft Road Junction',
    currentLat: 12.9348,
    currentLng: 77.6254,
    destination: 'Apollo Hospital, Bannerghatta Road',
    destLat: 12.8898,
    destLng: 77.6005,
    route: {
      name: 'South Bypass Emergency Route',
      distanceKm: 6.1,
      normalEtaMin: 35,
      emergencyEtaMin: 12,
      timeSavedMin: 23,
      viaRoads: ['Koramangala 100ft Rd', 'Madiwala Signal', 'BTM Layout Main Rd', 'Bannerghatta Rd', 'Apollo Hospital Entry'],
      coordinates: [
        [77.6254, 12.9348],
        [77.62, 12.925],
        [77.615, 12.91],
        [77.605, 12.895],
        [77.6005, 12.8898],
      ],
    },
    coordinatedSignals: [
      { junctionId: 'ix-10', junctionName: 'Madiwala Junction', distanceFromOriginKm: 1.5, normalPhase: 'E-W Transit', emergencyPhase: 'Green Override (S)', phaseDurationSec: 25, status: 'pending' },
      { junctionId: 'ix-11', junctionName: 'BTM Layout Signal', distanceFromOriginKm: 3.2, normalPhase: 'Standard Phase A', emergencyPhase: 'Green Override (S)', phaseDurationSec: 30, status: 'pending' },
      { junctionId: 'ix-12', junctionName: 'Bannerghatta Rd Junction', distanceFromOriginKm: 5.0, normalPhase: 'N-S Green', emergencyPhase: 'Green Override (All)', phaseDurationSec: 20, status: 'pending' },
      { junctionId: 'ix-13', junctionName: 'Apollo Hospital Entry', distanceFromOriginKm: 6.0, normalPhase: 'Standard Phase', emergencyPhase: 'All Green', phaseDurationSec: 15, status: 'pending' },
    ],
    patientOrUnit: 'Patient: Female, 34 yrs — Road Accident Trauma',
    priority: 'critical',
    status: 'idle',
  },
  {
    id: 'ec-004',
    vehicleType: 'police',
    vehicleId: 'KA-01-P-3399',
    vehicleCallsign: 'ECHO-02',
    title: 'VIP Security Escort — Airport to Raj Bhavan',
    currentLocation: 'Hebbal Flyover Entry, Bellary Road',
    currentLat: 13.0359,
    currentLng: 77.597,
    destination: 'Raj Bhavan, Raj Bhavan Road',
    destLat: 12.9935,
    destLng: 77.5945,
    route: {
      name: 'North VIP Express Corridor',
      distanceKm: 8.4,
      normalEtaMin: 32,
      emergencyEtaMin: 14,
      timeSavedMin: 18,
      viaRoads: ['Bellary Road', 'Hebbal Flyover', 'Cubbon Road', 'MG Road', 'Raj Bhavan Road'],
      coordinates: [
        [77.597, 13.0359],
        [77.594, 13.01],
        [77.598, 12.99],
        [77.605, 12.98],
        [77.5945, 12.9935],
      ],
    },
    coordinatedSignals: [
      { junctionId: 'ix-14', junctionName: 'Hebbal Flyover Junction', distanceFromOriginKm: 0.0, normalPhase: 'N-S Arterial Green', emergencyPhase: 'Green Override (All)', phaseDurationSec: 30, status: 'pending' },
      { junctionId: 'ix-15', junctionName: 'Cubbon Road Junction', distanceFromOriginKm: 3.5, normalPhase: 'Standard Phase', emergencyPhase: 'Green Override (W)', phaseDurationSec: 25, status: 'pending' },
      { junctionId: 'ix-16', junctionName: 'MG Road Junction', distanceFromOriginKm: 5.8, normalPhase: 'CBD Westbound Flow', emergencyPhase: 'Green Override (All)', phaseDurationSec: 20, status: 'pending' },
    ],
    patientOrUnit: 'VIP: Protocol Level 1 Security',
    priority: 'medium',
    status: 'idle',
  },
];

// ── Helper ──
export function getActiveCorridorCount(corridors: EmergencyCorridorData[]): number {
  return corridors.filter((c) => c.status === 'active' || c.status === 'approved').length;
}
