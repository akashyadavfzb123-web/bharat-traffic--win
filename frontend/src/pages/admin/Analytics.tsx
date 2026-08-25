import React from 'react';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminAnalytics: React.FC = () => {
  const corridorData = [
    { corridor: 'Outer Ring Rd', vehicleFlow: 54000, avgDelaySec: 185 },
    { corridor: 'Hosur Road', vehicleFlow: 42000, avgDelaySec: 120 },
    { corridor: 'Old Airport Rd', vehicleFlow: 31000, avgDelaySec: 95 },
    { corridor: 'Ballari Road', vehicleFlow: 48000, avgDelaySec: 140 },
    { corridor: 'Kanakapura Rd', vehicleFlow: 22000, avgDelaySec: 65 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-100 font-mono flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          CITYWIDE CORRIDOR THROUGHPUT & EMISSIONS ANALYTICS
        </h2>
        <p className="text-xs text-slate-400">
          Macro-level vehicle counts, corridor queue delays, and municipal carbon emission trends.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-2xl space-y-4">
        <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
          Corridor Daily Vehicle Volume vs Average Delay
        </h3>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={corridorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="corridor" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
              <Bar dataKey="vehicleFlow" fill="#06b6d4" name="Vehicles / Day" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avgDelaySec" fill="#ef4444" name="Avg Delay (Sec)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
