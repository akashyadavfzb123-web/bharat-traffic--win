import React, { useEffect, useState } from 'react';
import { trafficService } from '../../services/api';
import type { CitySummaryStats, Junction, Incident, EmergencyCorridor } from '../../types/traffic';
import { StatCard } from '../../components/common/StatCard';
import { MapContainer } from '../../components/common/MapContainer';
import { Link } from 'react-router-dom';
import {
  Activity,
  Sliders,
  Siren,
  AlertTriangle,
  Cpu,
  ArrowUpRight,
  Zap,
} from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<CitySummaryStats | null>(null);
  const [junctions, setJunctions] = useState<Junction[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [emergencyCorridors, setEmergencyCorridors] = useState<EmergencyCorridor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCommandCenterData = async () => {
      try {
        const [s, j, inc, ec] = await Promise.all([
          trafficService.getCityStats(),
          trafficService.getJunctions(),
          trafficService.getIncidents(),
          trafficService.getEmergencyCorridors(),
        ]);
        setStats(s);
        setJunctions(j);
        setIncidents(inc);
        setEmergencyCorridors(ec);
      } finally {
        setLoading(false);
      }
    };
    loadCommandCenterData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-8 font-mono text-cyan-400 text-xs animate-pulse">
        [COMMAND CENTER] Initializing telemetry feeds & digital twin connection...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Telemetry Command Header */}
      <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-2xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide font-mono">
              TRAFFIC CONTROL COMMAND CENTER
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            How can I reduce traffic? Real-time adaptive signal control, emergency corridor priority, and digital twin simulation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/signal-optimization"
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
          >
            <Sliders className="w-4 h-4" />
            Adaptive Signal Opt
          </Link>
          <Link
            to="/admin/emergency-corridor"
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
          >
            <Siren className="w-4 h-4" />
            Corridor Override
          </Link>
        </div>
      </div>

      {/* KPI Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="City Congestion Index"
          value={`${stats.cityCongestionIndex}%`}
          change="Silk Board High Delay (+14%)"
          trend="down"
          icon={Activity}
          color="red"
        />
        <StatCard
          title="Adaptive Signals Active"
          value={`${stats.activeAdaptiveSignals}/${stats.totalJunctions}`}
          change="112 Auto-optimizing"
          trend="up"
          icon={Sliders}
          color="emerald"
        />
        <StatCard
          title="Active Road Incidents"
          value={stats.activeIncidents}
          change="2 Emergency dispatched"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Vehicles Under Tracking"
          value={stats.totalVehiclesTracked.toLocaleString()}
          change="Avg speed 24.5 km/h"
          icon={Cpu}
          color="cyan"
        />
      </div>

      {/* Command Map & Realtime Overrides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Map View */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl flex flex-col h-[480px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 font-mono">
              <Zap className="w-4 h-4 text-emerald-400" />
              Live Network Map & Junction Telemetry
            </h3>
            <Link to="/admin/live-traffic" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
              Command Map <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex-1">
            <MapContainer junctions={junctions} incidents={incidents} />
          </div>
        </div>

        {/* Action Panel: Critical Junction Controls & Active Corridors */}
        <div className="space-y-4">
          {/* Active Emergency Corridors Box */}
          <div className="bg-slate-900 border border-red-500/30 p-4 rounded-2xl shadow-xl space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Siren className="w-4 h-4 animate-pulse" />
                Active Green Corridor
              </h4>
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-bold">
                PRIORITY ACTIVE
              </span>
            </div>

            {emergencyCorridors.map((ec) => (
              <div key={ec.id} className="p-3 bg-slate-950 rounded-xl border border-red-500/20 space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-200">
                  <span>{ec.title}</span>
                  <span className="font-mono text-emerald-400">ETA {ec.etaMin}m</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {ec.source} → {ec.destination}
                </div>
              </div>
            ))}
          </div>

          {/* Critical Junction Overrides */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Critical Junction Queue Overrides
            </h4>

            <div className="space-y-2.5">
              {junctions
                .filter((j) => j.status === 'critical' || j.status === 'red')
                .slice(0, 3)
                .map((j) => (
                  <div
                    key={j.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-200">{j.name}</h5>
                      <span className="text-[10px] text-red-400 font-mono">
                        Wait: {j.currentWaitTimeSec}s | Congestion: {j.congestionIndex}%
                      </span>
                    </div>
                    <Link
                      to="/admin/signal-optimization"
                      className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold"
                    >
                      Override
                    </Link>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
