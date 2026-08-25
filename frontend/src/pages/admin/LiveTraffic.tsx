import React, { useEffect, useState } from 'react';
import { trafficService } from '../../services/api';
import type { Junction, Incident } from '../../types/traffic';
import { MapContainer } from '../../components/common/MapContainer';
import { Map, Filter } from 'lucide-react';

export const AdminLiveTraffic: React.FC = () => {
  const [junctions, setJunctions] = useState<Junction[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filterMode, setFilterMode] = useState<string>('all');

  useEffect(() => {
    Promise.all([trafficService.getJunctions(), trafficService.getIncidents()]).then(
      ([jList, incList]) => {
        setJunctions(jList);
        setIncidents(incList);
      }
    );
  }, []);

  const filteredJunctions = junctions.filter((j) => {
    if (filterMode === 'critical') return j.status === 'critical' || j.status === 'red';
    if (filterMode === 'adaptive') return j.signalMode === 'adaptive';
    return true;
  });

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-100 font-mono flex items-center gap-2">
            <Map className="w-5 h-5 text-emerald-400" />
            COMMAND CENTER: LIVE TRAFFIC & JUNCTION TELEMETRY
          </h2>
          <p className="text-xs text-slate-400">
            Interactive GIS traffic matrix with real-time signal phase states and incident markers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                filterMode === 'all' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
              }`}
            >
              All ({junctions.length})
            </button>
            <button
              onClick={() => setFilterMode('critical')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                filterMode === 'critical' ? 'bg-red-500/20 text-red-300' : 'text-slate-400'
              }`}
            >
              Critical Only
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        <div className="lg:col-span-3 h-full">
          <MapContainer junctions={filteredJunctions} incidents={incidents} />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col overflow-hidden">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-3 pb-2 border-b border-slate-800">
            Junction Queue Monitor
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredJunctions.map((j) => (
              <div key={j.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-200">{j.name}</span>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase">{j.signalMode}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                  <div>Wait: <span className="text-slate-200">{j.currentWaitTimeSec}s</span></div>
                  <div>Queue: <span className="text-slate-200">{j.vehicleCount} v</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
