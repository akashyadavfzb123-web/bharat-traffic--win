import React, { useEffect, useState, useCallback } from 'react';
import { trafficService } from '../../services/api';
import type { Junction, Incident } from '../../types/traffic';
import type { RoadSegmentProperties } from '../../data/mockGeoJSON';
import { CITIES } from '../../data/cityData';
import { useRealtime } from '../../context/RealtimeContext';
import { useApp } from '../../context/AppContext';
import { MapContainer } from '../../components/common/MapContainer';
import { MOCK_EMERGENCY_CORRIDORS, corridorsToMapFormat } from '../../mock/mockEmergency';
import { Link } from 'react-router-dom';
import {
  Map,
  Filter,
  Gauge,
  Car,
  Activity,
  Clock,
  Cpu,
  ArrowUpRight,
  Layers,
  X,
  ChevronRight,
  Siren,
} from 'lucide-react';

type InspectorTarget =
  | { type: 'road'; data: RoadSegmentProperties }
  | { type: 'junction'; data: Junction }
  | null;

export const AdminLiveTraffic: React.FC = () => {
  const { selectedCity } = useApp();
  const { snapshot, wsConnected, wsMode } = useRealtime();
  const [junctions, setJunctions] = useState<Junction[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'critical' | 'adaptive'>('all');
  const [roadFilter, setRoadFilter] = useState<'all' | 'gridlock' | 'heavy' | 'slow' | 'clear'>('all');
  const [selectedTarget, setSelectedTarget] = useState<InspectorTarget>(null);
  const [greenCorridors, setGreenCorridors] = useState(corridorsToMapFormat(MOCK_EMERGENCY_CORRIDORS));

  const cityConfig = CITIES[selectedCity] || CITIES['Bengaluru'];

  useEffect(() => {
    // Map cityConfig junctions into Junction types
    const cityJunctions: Junction[] = cityConfig.junctions.map((cj) => ({
      id: cj.id,
      name: cj.name,
      city: selectedCity,
      lat: cj.lat,
      lng: cj.lng,
      status: cj.status,
      currentWaitTimeSec: cj.waitTimeSec,
      vehicleCount: cj.queueLengthVeh,
      congestionIndex: cj.congestionPct,
      signalMode: cj.status === 'critical' ? 'adaptive' : 'fixed',
      cycleLengthSec: 90,
      activePhase: 'Main Phase',
      lastUpdated: 'Just now',
    }));

    setJunctions(cityJunctions);
    trafficService.getIncidents().then(setIncidents);
  }, [selectedCity, cityConfig]);

  // Sync junction data with real-time simulation
  useEffect(() => {
    setJunctions((prev) =>
      prev.map((localJ) => {
        const realtimeJ = snapshot.junctions.find((rj) => rj.id === localJ.id);
        if (realtimeJ) {
          return {
            ...localJ,
            congestionIndex: realtimeJ.congestionIndex,
            currentWaitTimeSec: realtimeJ.currentWaitTimeSec,
            vehicleCount: realtimeJ.vehicleCount,
            status: realtimeJ.status,
            signalMode: realtimeJ.signalMode,
          };
        }
        return localJ;
      })
    );
  }, [snapshot.junctions]);

  useEffect(() => {
    setIncidents((prev) =>
      prev.map((localI) => {
        const realtimeI = snapshot.incidents.find((ri) => ri.id === localI.id);
        if (realtimeI) {
          return { ...localI, status: realtimeI.status };
        }
        return localI;
      })
    );
  }, [snapshot.incidents]);

  // Filtered junctions
  const filteredJunctions = junctions.filter((j) => {
    if (filterMode === 'critical') return j.status === 'critical' || j.status === 'red';
    if (filterMode === 'adaptive') return j.signalMode === 'adaptive';
    return true;
  });

  // Filtered roads
  const roadFeatures = cityConfig.roadsGeoJSON.features.map((f) => f.properties);
  const filteredRoads = roadFeatures.filter((r) => {
    if (roadFilter === 'gridlock') return r.roadStatus === 'Gridlock';
    if (roadFilter === 'heavy') return r.roadStatus === 'Heavy Congestion';
    if (roadFilter === 'slow') return r.roadStatus === 'Slow Traffic';
    if (roadFilter === 'clear') return r.roadStatus === 'Clear';
    return true;
  });

  // Filtered GeoJSON for map
  const filteredGeoJSON = {
    ...cityConfig.roadsGeoJSON,
    features: cityConfig.roadsGeoJSON.features.filter((f) => filteredRoads.some((r) => r.id === f.properties.id)),
  };

  // Summary stats
  const totalVehicles = filteredJunctions.reduce((s, j) => s + j.vehicleCount, 0);
  const avgCongestion = Math.round(filteredJunctions.reduce((s, j) => s + j.congestionIndex, 0) / (filteredJunctions.length || 1));
  const criticalCount = filteredJunctions.filter((j) => j.status === 'critical').length;

  // Click handlers
  const handleRoadClick = useCallback((road: RoadSegmentProperties) => {
    setSelectedTarget({ type: 'road', data: road });
  }, []);

  const handleJunctionClick = useCallback((junction: Junction) => {
    setSelectedTarget({ type: 'junction', data: junction });
  }, []);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-3">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
        <div>
          <h2 className="text-lg font-black text-slate-100 font-mono flex items-center gap-2">
            <Map className="w-5 h-5 text-emerald-400" />
            LIVE TRAFFIC & JUNCTION TELEMETRY ({selectedCity.toUpperCase()})
          </h2>
          <p className="text-[11px] text-slate-400">
            Interactive GIS matrix for {selectedCity} — click any road segment or intersection marker for detailed telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Live tick */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-emerald-500/30 rounded-lg">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-[9px] font-mono font-bold text-emerald-400">TICK #{snapshot.tickCount}</span>
          </div>

          {/* WebSocket status */}
          <div className={`flex items-center gap-1.5 px-2 py-1 bg-slate-900 border rounded-lg ${
            wsConnected ? 'border-emerald-500/30' : 'border-amber-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              wsConnected ? 'bg-emerald-400' : 'bg-amber-400'
            }`} />
            <span className={`text-[9px] font-mono font-bold ${
              wsConnected ? 'text-emerald-400' : 'text-amber-400'
            }`}>{
              wsMode === 'websocket' ? 'WS LIVE' : wsMode === 'rest' ? 'REST' : 'OFFLINE'
            }</span>
          </div>

          {/* Quick summary */}
          <div className="flex items-center gap-3 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-mono">
            <span className="text-slate-400">Vehicles: <span className="text-cyan-300 font-bold">{totalVehicles.toLocaleString()}</span></span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Avg: <span className={`font-bold ${avgCongestion > 70 ? 'text-red-400' : 'text-emerald-400'}`}>{avgCongestion}%</span></span>
            {criticalCount > 0 && (
              <>
                <span className="text-slate-700">|</span>
                <span className="text-red-400 font-bold">{criticalCount} critical</span>
              </>
            )}
          </div>

          {/* Junction filter */}
          <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            <Filter className="w-3 h-3 text-slate-500 ml-1" />
            {(['all', 'critical', 'adaptive'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  filterMode === mode
                    ? mode === 'critical' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {mode === 'all' ? `All (${junctions.length})` : mode === 'critical' ? 'Critical' : 'Adaptive'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Grid: Map + Inspector ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 min-h-0">
        {/* Map Panel */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          {/* Road status filter bar */}
          <div className="flex items-center gap-1 mb-2 shrink-0">
            <Layers className="w-3 h-3 text-slate-500" />
            <span className="text-[9px] font-mono text-slate-500 mr-1">ROADS:</span>
            {([
              { key: 'all', label: 'All', count: roadFeatures.length },
              { key: 'gridlock', label: 'Gridlock', count: roadFeatures.filter((r) => r.roadStatus === 'Gridlock').length, color: 'text-red-400' },
              { key: 'heavy', label: 'Heavy', count: roadFeatures.filter((r) => r.roadStatus === 'Heavy Congestion').length, color: 'text-amber-400' },
              { key: 'slow', label: 'Slow', count: roadFeatures.filter((r) => r.roadStatus === 'Slow Traffic').length, color: 'text-yellow-400' },
              { key: 'clear', label: 'Clear', count: roadFeatures.filter((r) => r.roadStatus === 'Clear').length, color: 'text-emerald-400' },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setRoadFilter(opt.key as typeof roadFilter)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  roadFilter === opt.key
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : `text-slate-500 hover:text-slate-300 ${'color' in opt ? opt.color : ''}`
                }`}
              >
                {opt.label} ({opt.count})
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0">
            <MapContainer
              junctions={filteredJunctions}
              incidents={incidents}
              roadGeoJSON={filteredGeoJSON as any}
              greenCorridors={greenCorridors}
              onRoadClick={handleRoadClick}
              onJunctionClick={handleJunctionClick}
              selectedRoadId={selectedTarget?.type === 'road' ? selectedTarget.data.id : null}
              selectedJunctionId={selectedTarget?.type === 'junction' ? selectedTarget.data.id : null}
            />
          </div>
        </div>

        {/* ── Inspector / Monitor Panel ── */}
        <div className="flex flex-col min-h-0 overflow-hidden bg-slate-900 border border-slate-800 rounded-xl">
          {selectedTarget ? (
            /* ── Detailed Inspector ── */
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Inspector Header */}
              <div className="px-3 py-2.5 border-b border-slate-800 flex items-center justify-between shrink-0">
                <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  {selectedTarget.type === 'road' ? (
                    <><Gauge className="w-3 h-3" /> Road Inspector</>
                  ) : (
                    <><Cpu className="w-3 h-3" /> Intersection Inspector</>
                  )}
                </h3>
                <button
                  onClick={() => setSelectedTarget(null)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {selectedTarget.type === 'road' ? (
                  /* ── Road Detail ── */
                  <RoadInspector data={selectedTarget.data} incidents={incidents} />
                ) : (
                  /* ── Junction Detail ── */
                  <JunctionInspector data={selectedTarget.data} />
                )}
              </div>
            </div>
          ) : (
            /* ── Default: Queue Monitor ── */
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-slate-800 shrink-0">
                <h3 className="text-[10px] font-bold text-slate-200 uppercase tracking-wider font-mono">
                  {selectedCity} Junction Queue Monitor
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filteredJunctions.map((j) => (
                  <div
                    key={j.id}
                    onClick={() => handleJunctionClick(j)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all hover:border-emerald-500/30 ${
                      j.status === 'critical' ? 'bg-red-950/20 border-red-500/30' :
                      j.status === 'red' ? 'bg-amber-950/10 border-amber-500/20' :
                      'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{
                          backgroundColor: j.status === 'critical' ? '#ef4444' : j.status === 'red' ? '#f97316' : j.status === 'yellow' ? '#eab308' : '#22c55e'
                        }} />
                        <span className="text-[11px] font-bold text-slate-200 truncate">{j.name}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                    </div>
                    <div className="mt-1.5 grid grid-cols-3 gap-1 text-[9px] font-mono text-slate-400">
                      <span>Wait: <span className={`${j.currentWaitTimeSec > 120 ? 'text-red-400' : 'text-slate-200'}`}>{j.currentWaitTimeSec}s</span></span>
                      <span>Queue: <span className="text-slate-200">{j.vehicleCount}</span></span>
                      <span className={`font-bold ${j.congestionIndex > 85 ? 'text-red-400' : j.congestionIndex > 65 ? 'text-amber-400' : 'text-emerald-400'}`}>{j.congestionIndex}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Road Inspector Sub-component ──
const RoadInspector: React.FC<{ data: RoadSegmentProperties; incidents: Incident[] }> = ({ data, incidents }) => {
  const roadIncidents = incidents.filter((inc) => inc.locationName.toLowerCase().includes(data.corridor.toLowerCase().split(' ')[0]));

  const statusColor = {
    'Gridlock': 'red',
    'Heavy Congestion': 'amber',
    'Slow Traffic': 'yellow',
    'Clear': 'emerald',
  } as const;

  const statusKey = statusColor[data.roadStatus] || 'slate';

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-bold text-slate-100">{data.name}</h4>
        <p className="text-[10px] text-slate-400 font-mono">{data.corridor}</p>
      </div>

      <div className={`flex items-center justify-between p-2 rounded-lg border ${
        statusKey === 'red' ? 'bg-red-500/10 border-red-500/30' :
        statusKey === 'amber' ? 'bg-amber-500/10 border-amber-500/30' :
        statusKey === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/30' :
        'bg-emerald-500/10 border-emerald-500/30'
      }`}>
        <span className="text-[10px] text-slate-400">Road Status</span>
        <span className={`text-[10px] font-mono font-bold ${
          statusKey === 'red' ? 'text-red-400' :
          statusKey === 'amber' ? 'text-amber-400' :
          statusKey === 'yellow' ? 'text-yellow-400' :
          'text-emerald-400'
        }`}>{data.roadStatus}</span>
      </div>

      <div className="space-y-1.5">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Telemetry</span>
        <div className="grid grid-cols-2 gap-1.5">
          <TelemetryCell icon={Car} label="Vehicles" value={`${Math.round(data.densityVehKm * data.lengthKm)}`} color="cyan" />
          <TelemetryCell icon={Activity} label="Density" value={`${data.densityVehKm} v/km`} color="amber" />
          <TelemetryCell icon={Gauge} label="Avg Speed" value={`${data.avgSpeedKmh} km/h`} color={data.avgSpeedKmh < 20 ? 'red' : 'emerald'} />
          <TelemetryCell icon={Clock} label="Congestion" value={`${data.congestion}%`} color={data.congestion > 70 ? 'red' : data.congestion > 40 ? 'amber' : 'emerald'} />
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Details</span>
        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-[10px] font-mono">
          <div className="flex justify-between text-slate-400">
            <span>Lanes:</span>
            <span className="text-slate-200">{data.laneCount}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Length:</span>
            <span className="text-slate-200">{data.lengthKm} km</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Active Incidents:</span>
            <span className={data.incidentCount > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>{data.incidentCount}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Last Updated:</span>
            <span className="text-slate-300">{data.lastUpdated}</span>
          </div>
        </div>
      </div>

      {roadIncidents.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Related Incidents</span>
          {roadIncidents.slice(0, 2).map((inc) => (
            <div key={inc.id} className="p-2 bg-red-950/20 rounded-lg border border-red-500/20 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-200 truncate">{inc.title}</span>
                <span className={`px-1 py-0.5 rounded text-[8px] font-mono font-bold ${
                  inc.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                }`}>{inc.severity}</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">+{inc.estimatedDelayMin} min delay</span>
            </div>
          ))}
        </div>
      )}

      <Link
        to="/admin/signal-optimization"
        className="flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-mono font-bold transition-all"
      >
        Optimize Signal for This Corridor
        <ArrowUpRight className="w-3 h-3" />
      </Link>
    </div>
  );
};

// ── Junction Inspector Sub-component ──
const JunctionInspector: React.FC<{ data: Junction }> = ({ data }) => {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-bold text-slate-100">{data.name}</h4>
        <p className="text-[10px] text-slate-400 font-mono">{data.city}</p>
      </div>

      <div className={`flex items-center justify-between p-2 rounded-lg border ${
        data.status === 'critical' ? 'bg-red-500/10 border-red-500/30' :
        data.status === 'red' ? 'bg-amber-500/10 border-amber-500/30' :
        data.status === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/30' :
        'bg-emerald-500/10 border-emerald-500/30'
      }`}>
        <span className="text-[10px] text-slate-400">Intersection Status</span>
        <span className={`text-[10px] font-mono font-bold uppercase ${
          data.status === 'critical' ? 'text-red-400' :
          data.status === 'red' ? 'text-amber-400' :
          data.status === 'yellow' ? 'text-yellow-400' :
          'text-emerald-400'
        }`}>{data.status}</span>
      </div>

      <div className="space-y-1.5">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Telemetry</span>
        <div className="grid grid-cols-2 gap-1.5">
          <TelemetryCell icon={Car} label="Vehicles" value={data.vehicleCount.toLocaleString()} color="cyan" />
          <TelemetryCell icon={Clock} label="Wait Time" value={`${data.currentWaitTimeSec}s`} color={data.currentWaitTimeSec > 120 ? 'red' : 'emerald'} />
          <TelemetryCell icon={Activity} label="Congestion" value={`${data.congestionIndex}%`} color={data.congestionIndex > 85 ? 'red' : data.congestionIndex > 65 ? 'amber' : 'emerald'} />
          <TelemetryCell icon={Cpu} label="Signal Mode" value={data.signalMode.toUpperCase()} color="cyan" />
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Signal Controller</span>
        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-[10px] font-mono">
          <div className="flex justify-between text-slate-400">
            <span>Active Phase:</span>
            <span className="text-cyan-400 font-bold truncate max-w-[120px]">{data.activePhase}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Cycle Length:</span>
            <span className="text-slate-200">{data.cycleLengthSec}s</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Last Updated:</span>
            <span className="text-slate-300">{data.lastUpdated}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Queue Pressure</span>
        <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              data.congestionIndex > 85 ? 'bg-red-500' : data.congestionIndex > 65 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${data.congestionIndex}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-slate-500">
          <span>0%</span>
          <span>{data.vehicleCount} vehicles queued</span>
          <span>100%</span>
        </div>
      </div>

      {data.signalMode === 'emergency' && (
        <div className="p-2 bg-red-950/20 rounded-lg border border-red-500/30 flex items-center gap-2">
          <Siren className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span className="text-[10px] font-mono text-red-300 font-bold">Green Corridor Active</span>
        </div>
      )}

      <Link
        to="/admin/signal-optimization"
        className="flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-mono font-bold transition-all"
      >
        Override Signal Mode
        <ArrowUpRight className="w-3 h-3" />
      </Link>
    </div>
  );
};

// ── Reusable Telemetry Cell ──
const TelemetryCell: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: 'cyan' | 'emerald' | 'amber' | 'red' | 'purple';
}> = ({ icon: Icon, label, value, color }) => {
  const colorMap = {
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
  };

  return (
    <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 space-y-0.5">
      <span className="text-[9px] text-slate-500 flex items-center gap-1">
        <Icon className="w-2.5 h-2.5" />
        {label}
      </span>
      <span className={`text-[11px] font-mono font-bold ${colorMap[color]}`}>{value}</span>
    </div>
  );
};
