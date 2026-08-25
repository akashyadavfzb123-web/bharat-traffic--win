import React from 'react';
import { FileSpreadsheet, Download, FileText } from 'lucide-react';

export const AdminReports: React.FC = () => {
  const reports = [
    { title: 'Weekly City Congestion & Signal Efficiency Summary', date: '2026-08-24', size: '2.4 MB', status: 'Ready' },
    { title: 'Emergency Corridor Priority Audit Log', date: '2026-08-23', size: '1.1 MB', status: 'Ready' },
    { title: 'Carbon Footprint & Vehicular Emissions Index', date: '2026-08-20', size: '3.8 MB', status: 'Ready' },
    { title: 'SUMO Twin Validation & Accuracy Report', date: '2026-08-18', size: '5.2 MB', status: 'Ready' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-100 font-mono flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          EXPORTABLE TRAFFIC & COMPLIANCE REPORTS
        </h2>
        <p className="text-xs text-slate-400">
          Download PDF/CSV telemetry logs, signal audit reports, and municipal compliance benchmarks.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        {reports.map((rep, idx) => (
          <div
            key={idx}
            className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center hover:border-emerald-500/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">{rep.title}</h4>
                <span className="text-[10px] font-mono text-slate-400">{rep.date} • {rep.size}</span>
              </div>
            </div>
            <button className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
