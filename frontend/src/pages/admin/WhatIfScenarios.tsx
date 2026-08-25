import React, { useEffect, useState } from 'react';
import { trafficService } from '../../services/api';
import type { WhatIfScenario } from '../../types/traffic';
import { GitPullRequest, Play } from 'lucide-react';

export const AdminWhatIfScenarios: React.FC = () => {
  const [scenarios, setScenarios] = useState<WhatIfScenario[]>([]);

  useEffect(() => {
    trafficService.getWhatIfScenarios().then(setScenarios);
  }, []);

  const handleRunScenario = async (id: string) => {
    const updated = await trafficService.runWhatIfScenario(id);
    setScenarios(scenarios.map((s) => (s.id === id ? updated : s)));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-100 font-mono flex items-center gap-2">
          <GitPullRequest className="w-5 h-5 text-cyan-400" />
          WHAT-IF SIMULATION SANDBOX & SCENARIO TESTING
        </h2>
        <p className="text-xs text-slate-400">
          Simulate weather events, VIP movement, or road closures on the Digital Twin to evaluate congestion impact.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenarios.map((sc) => (
          <div
            key={sc.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold uppercase">
                  {sc.type}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    sc.status === 'running'
                      ? 'text-amber-400 animate-pulse'
                      : sc.status === 'completed'
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {sc.status.toUpperCase()}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-100">{sc.name}</h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">{sc.targetArea}</p>

              <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Congestion Spike:</span>
                  <span className="text-red-400 font-bold">+{sc.congestionSpikePercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Delay Multiplier:</span>
                  <span className="text-amber-400 font-bold">{sc.travelTimeImpactMultiplier}x</span>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-300">
                <span className="font-bold text-cyan-400">Mitigation: </span>
                {sc.suggestedMitigation}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => handleRunScenario(sc.id)}
                className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                Run Simulation Scenario
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
