import React, { useEffect, useState } from 'react';
import { trafficService } from '../../services/api';
import type { TrafficPrediction } from '../../types/traffic';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminPredictions: React.FC = () => {
  const [predictions, setPredictions] = useState<TrafficPrediction[]>([]);

  useEffect(() => {
    trafficService.getPredictions().then(setPredictions);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-100 font-mono flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          CITYWIDE AI BOTTLENECK FORECASTING & PREDICTIVE ANALYTICS
        </h2>
        <p className="text-xs text-slate-400">
          Predictive neural net models calculating 2-hour ahead congestion indices & arterial corridor throughput.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-2xl space-y-4">
        <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
          Predicted Congestion Index vs Average Speed Profile
        </h3>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={predictions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="predictedCongestion" stroke="#a855f7" strokeWidth={3} name="Predicted Congestion %" />
              <Line type="monotone" dataKey="averageSpeedKmh" stroke="#10b981" strokeWidth={2} name="Avg Speed (km/h)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
