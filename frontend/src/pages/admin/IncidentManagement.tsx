import React, { useEffect, useState } from 'react';
import { trafficService } from '../../services/api';
import type { Incident } from '../../types/traffic';
import { AlertTriangle } from 'lucide-react';

export const AdminIncidentManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    trafficService.getIncidents().then(setIncidents);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-100 font-mono flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          INCIDENT DISPATCH & RESPONSE MATRIX
        </h2>
        <p className="text-xs text-slate-400">
          Dispatch traffic police units, towing vehicles, and emergency pumps to active road hazards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {incidents.map((inc) => (
          <div key={inc.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex justify-between items-start">
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs font-mono font-bold uppercase">
                {inc.type} - {inc.severity} Severity
              </span>
              <span className="text-[10px] font-mono text-cyan-400 uppercase">{inc.status}</span>
            </div>

            <h3 className="text-sm font-bold text-slate-100">{inc.title}</h3>
            <p className="text-xs text-slate-400">{inc.locationName}</p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="text-slate-300">Description: {inc.description}</div>
              <div className="text-amber-400 font-bold">Estimated Delay: +{inc.estimatedDelayMin} mins</div>
              {inc.dispatchedUnits && (
                <div className="text-emerald-400 text-[11px] pt-1">
                  Dispatched: {inc.dispatchedUnits.join(', ')}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-mono font-bold">
                Dispatch Response Unit
              </button>
              <button className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-bold">
                Broadcast Citizen Alert
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
