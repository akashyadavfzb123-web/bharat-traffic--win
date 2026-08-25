import React from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Shield,
  User,
  Radio,
  MapPin,
  AlertTriangle,
  Menu,
} from 'lucide-react';

interface NavbarProps {
  onMobileMenuToggle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMobileMenuToggle }) => {
  const { role, setRole, selectedCity, setSelectedCity } = useApp();
  const navigate = useNavigate();

  const handleRoleToggle = (newRole: 'user' | 'admin') => {
    setRole(newRole);
    if (newRole === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/user/dashboard');
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-50">
      {/* Left Brand & Mobile Menu Button */}
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold tracking-wide bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-200 bg-clip-text text-transparent font-mono">
              BHARAT TRAFFIC TWIN
            </h1>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              v1.0-USER
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            {role === 'admin' ? 'Traffic Control Command Center' : 'Citizen Mobility Portal'}
          </p>
        </div>
      </div>

      {/* Middle Ticker / City Selector */}
      <div className="hidden lg:flex items-center gap-4 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span>City:</span>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="Bengaluru" className="bg-slate-900 text-slate-200">Bengaluru</option>
            <option value="Delhi-NCR" className="bg-slate-900 text-slate-200">Delhi-NCR</option>
            <option value="Mumbai" className="bg-slate-900 text-slate-200">Mumbai</option>
            <option value="Hyderabad" className="bg-slate-900 text-slate-200">Hyderabad</option>
          </select>
        </div>

        <div className="h-4 w-[1px] bg-slate-800" />

        <div className="flex items-center gap-2 text-xs text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
          <span className="truncate max-w-[260px]">
            Alert: Silk Board Junction delay (+17m)
          </span>
        </div>
      </div>

      {/* Role Switcher */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => handleRoleToggle('user')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              role === 'user'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3 h-3" />
            <span className="hidden sm:inline">User Portal</span>
            <span className="sm:hidden">User</span>
          </button>
          <button
            onClick={() => handleRoleToggle('admin')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              role === 'admin'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span className="hidden sm:inline">Admin Command</span>
            <span className="sm:hidden">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
};
