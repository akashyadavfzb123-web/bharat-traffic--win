import React, { useEffect, useState } from 'react';
import { trafficService } from '../../services/api';
import type { Junction } from '../../types/traffic';
import { Sliders, CheckCircle2 } from 'lucide-react';

export const AdminSignalOptimization: React.FC = () => {
  const [junctions, setJunctions] = useState<Junction[]>([]);
  const [updatedMsg, setUpdatedMsg] = useState('');

  useEffect(() => {
    trafficService.getJunctions().then(setJunctions);
  }, []);

  const handleModeChange = async (junctionId: string, newMode: Junction['signalMode']) => {
    const updated = await trafficService.updateSignalMode(junctionId, newMode);
    setJunctions(junctions.map((j) => (j.id === junctionId ? updated : j)));
    setUpdatedMsg(`Signal Mode updated to [${newMode.toUpperCase()}] for ${updated.name}`);
    setTimeout(() => setUpdatedMsg(''), 4000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-100 font-mono flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            ADAPTIVE SIGNAL OPTIMIZATION & OVERRIDE CONTROLLER
          </h2>
          <p className="text-xs text-slate-400">
            Override cycle lengths, switch signal timing policies, or force green wave corridors.
          </p>
        </div>
      </div>

      {updatedMsg && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {updatedMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {junctions.map((j) => (
          <div
            key={j.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 hover:border-emerald-500/40 transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{j.name}</h3>
                <span className="text-[11px] text-slate-400 font-mono">{j.city}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  j.status === 'critical'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {j.congestionIndex}% Congestion
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Active Phase:</span>
                <span className="text-cyan-400 font-bold">{j.activePhase}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cycle Length:</span>
                <span className="text-slate-200">{j.cycleLengthSec}s</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Current Mode:</span>
                <span className="text-emerald-400 font-bold uppercase">{j.signalMode}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] text-slate-400 font-semibold uppercase font-mono block">
                Signal Controller Override Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleModeChange(j.id, 'adaptive')}
                  className={`py-1.5 rounded text-xs font-mono font-bold transition-all ${
                    j.signalMode === 'adaptive'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  Adaptive AI
                </button>
                <button
                  onClick={() => handleModeChange(j.id, 'manual')}
                  className={`py-1.5 rounded text-xs font-mono font-bold transition-all ${
                    j.signalMode === 'manual'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  Manual Split
                </button>
                <button
                  onClick={() => handleModeChange(j.id, 'emergency')}
                  className={`py-1.5 rounded text-xs font-mono font-bold transition-all ${
                    j.signalMode === 'emergency'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  Emergency
                </button>
                <button
                  onClick={() => handleModeChange(j.id, 'fixed')}
                  className={`py-1.5 rounded text-xs font-mono font-bold transition-all ${
                    j.signalMode === 'fixed'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  Fixed Plan
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
