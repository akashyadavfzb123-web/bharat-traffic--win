import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Map,
  Navigation,
  AlertTriangle,
  TrendingUp,
  History,
  Settings,
  Cpu,
  Sliders,
  GitPullRequest,
  Siren,
  FileSpreadsheet,
  BarChart3,
  Building2,
  X,
} from 'lucide-react';

interface SidebarProps {
  onItemClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const { role } = useApp();

  const userItems = [
    { label: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
    { label: 'Live Traffic', path: '/user/live-traffic', icon: Map },
    { label: 'Route Planner', path: '/user/routes', icon: Navigation },
    { label: 'Traffic Alerts', path: '/user/alerts', icon: AlertTriangle },
    { label: 'Predictions', path: '/user/predictions', icon: TrendingUp },
    { label: 'My Trips', path: '/user/trips', icon: History },
    { label: 'Settings', path: '/user/settings', icon: Settings },
  ];

  const adminItems = [
    { label: 'Overview / Command', path: '/admin/overview', icon: LayoutDashboard },
    { label: 'Live Traffic', path: '/admin/live-traffic', icon: Map },
    { label: 'Digital Twin', path: '/admin/digital-twin', icon: Cpu },
    { label: 'Predictions', path: '/admin/predictions', icon: TrendingUp },
    { label: 'Signal Optimization', path: '/admin/signal-optimization', icon: Sliders },
    { label: 'What-If Scenarios', path: '/admin/what-if', icon: GitPullRequest },
    { label: 'Emergency Corridor', path: '/admin/emergency-corridor', icon: Siren },
    { label: 'Incident Management', path: '/admin/incidents', icon: AlertTriangle },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Reports', path: '/admin/reports', icon: FileSpreadsheet },
    { label: 'City Management', path: '/admin/city-management', icon: Building2 },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const items = role === 'admin' ? adminItems : userItems;

  return (
    <aside className="w-64 h-full border-r border-slate-800 bg-slate-900/90 backdrop-blur-md flex flex-col shrink-0">
      <div className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/60 flex items-center justify-between">
        <span>{role === 'admin' ? 'Command Modules' : 'Citizen Mobility Navigation'}</span>
        {onItemClick && (
          <button onClick={onItemClick} className="md:hidden p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? role === 'admin'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10 font-semibold'
                      : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 space-y-1 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-cyan-400">Portal Mode:</span>
          <span className="text-slate-200 font-bold uppercase">{role}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-cyan-400">Backend API:</span>
          <span className="text-amber-400 font-bold">MOCK MODE</span>
        </div>
      </div>
    </aside>
  );
};
