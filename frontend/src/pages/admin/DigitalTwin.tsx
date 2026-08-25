import React, { useEffect, useState } from 'react';
import { trafficService } from '../../services/api';
import type { DigitalTwinNode } from '../../types/traffic';
import { MapContainer } from '../../components/common/MapContainer';
import { Cpu, RefreshCcw, Zap } from 'lucide-react';

export const AdminDigitalTwin: React.FC = () => {
  const [nodes, setNodes] = useState<DigitalTwinNode[]>([]);

  useEffect(() => {
    trafficService.getDigitalTwinNodes().then(setNodes);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-100 font-mono flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            SUMO DIGITAL TWIN SIMULATION ENGINE
          </h2>
          <p className="text-xs text-slate-400">
            Real-time microscopic SUMO simulation mirroring live traffic sensors & network node densities.
          </p>
        </div>

        <button
          onClick={() => trafficService.getDigitalTwinNodes().then(setNodes)}
          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 text-xs font-mono font-bold rounded-xl flex items-center gap-2 transition-all"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Sync SUMO Step State
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation Map View */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col h-[480px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Microscopic Virtual Vehicle Stream Overlay
            </h3>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
              SUMO TraCI Synced
            </span>
          </div>
          <div className="flex-1">
            <MapContainer digitalTwinNodes={nodes} />
          </div>
        </div>

        {/* Node Telemetry Matrix */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
            Twin vs Actual Telemetry Comparison
          </h3>

          <div className="space-y-3">
            {nodes.map((node) => (
              <div key={node.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-200">{node.name}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                    {node.type.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-400">Actual Speed: </span>
                    <span className="text-amber-400 font-bold">{node.averageSpeedKmh} km/h</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Twin Speed: </span>
                    <span className="text-emerald-400 font-bold">{node.simulatedSpeedKmh} km/h</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Flow: </span>
                    <span className="text-slate-200">{node.currentFlowRateHr} v/h</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Queue: </span>
                    <span className="text-slate-200">{node.queueLengthMeters}m</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
