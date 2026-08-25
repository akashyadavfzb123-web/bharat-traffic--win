import React, { useEffect, useState } from 'react';
import { trafficService } from '../../services/api';
import type { Junction } from '../../types/traffic';
import { Building2, Plus } from 'lucide-react';

export const AdminCityManagement: React.FC = () => {
  const [junctions, setJunctions] = useState<Junction[]>([]);

  useEffect(() => {
    trafficService.getJunctions().then(setJunctions);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-100 font-mono flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            JUNCTION REGISTRY & SENSOR GRID MANAGEMENT
          </h2>
          <p className="text-xs text-slate-400">
            Register new traffic junctions, configure IoT sensor cameras, and manage SUMO network nodes.
          </p>
        </div>

        <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 shadow-lg">
          <Plus className="w-4 h-4" />
          Register New Junction Node
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-3 px-3">Node ID</th>
                <th className="pb-3 px-3">Junction Name</th>
                <th className="pb-3 px-3">Coordinates</th>
                <th className="pb-3 px-3">Signal Controller</th>
                <th className="pb-3 px-3">Sensors / Cameras</th>
                <th className="pb-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {junctions.map((j) => (
                <tr key={j.id} className="hover:bg-slate-950/40">
                  <td className="py-3 px-3 text-cyan-400 font-bold">{j.id}</td>
                  <td className="py-3 px-3 font-semibold">{j.name}</td>
                  <td className="py-3 px-3 text-slate-400">{j.lat.toFixed(4)}, {j.lng.toFixed(4)}</td>
                  <td className="py-3 px-3 uppercase text-emerald-400">{j.signalMode}</td>
                  <td className="py-3 px-3 text-slate-300">4 ANPR Cameras + 2 Radar</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      ONLINE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
