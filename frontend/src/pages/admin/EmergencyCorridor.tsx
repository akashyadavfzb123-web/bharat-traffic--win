import React, { useEffect, useState } from 'react';
import { trafficService } from '../../services/api';
import type { EmergencyCorridor } from '../../types/traffic';
import { Siren, Zap } from 'lucide-react';

export const AdminEmergencyCorridor: React.FC = () => {
  const [corridors, setCorridors] = useState<EmergencyCorridor[]>([]);
  const [activeMsg, setActiveMsg] = useState('');

  useEffect(() => {
    trafficService.getEmergencyCorridors().then(setCorridors);
  }, []);

  const handleActivate = async (id: string) => {
    const updated = await trafficService.activateEmergencyCorridor(id);
    setCorridors(corridors.map((c) => (c.id === id ? updated : c)));
    setActiveMsg(`GREEN CORRIDOR ACTIVATED for ${updated.title}`);
    setTimeout(() => setActiveMsg(''), 5000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-100 font-mono flex items-center gap-2">
            <Siren className="w-5 h-5 text-red-500 animate-pulse" />
            EMERGENCY VEHICLE GREEN CORRIDOR CONTROL
          </h2>
          <p className="text-xs text-slate-400">
            Real-time signal pre-emption for ambulances, fire tenders, and high-priority rescue convoys.
          </p>
        </div>
      </div>

      {activeMsg && (
        <div className="p-3 bg-red-600/20 border border-red-500/50 rounded-xl text-red-300 text-xs font-mono font-bold flex items-center gap-2">
          <Zap className="w-4 h-4 animate-bounce" />
          {activeMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {corridors.map((c) => (
          <div
            key={c.id}
            className={`p-6 rounded-2xl border shadow-2xl space-y-4 ${
              c.status === 'active'
                ? 'bg-gradient-to-br from-red-950/60 to-slate-900 border-red-500/50 shadow-red-500/10'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="px-2.5 py-0.5 rounded bg-red-500/20 text-red-400 text-xs font-mono font-extrabold uppercase">
                {c.vehicleType}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  c.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {c.status.toUpperCase()}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-100">{c.title}</h3>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Origin:</span>
                <span className="text-cyan-400">{c.source}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Destination:</span>
                <span className="text-emerald-400">{c.destination}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Distance / ETA:</span>
                <span className="text-amber-400 font-bold">{c.distanceKm} km ({c.etaMin} mins)</span>
              </div>
            </div>

            <button
              onClick={() => handleActivate(c.id)}
              disabled={c.status === 'active'}
              className={`w-full py-2.5 rounded-xl font-mono font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all ${
                c.status === 'active'
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 cursor-default'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
              }`}
            >
              <Siren className="w-4 h-4" />
              {c.status === 'active' ? 'Green Corridor Pre-emption Live' : 'Activate Green Wave Corridor'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
