import React, { useEffect, useState } from 'react';
import { trafficService } from '../../services/api';
import type { RouteOption } from '../../types/traffic';
import { MapContainer } from '../../components/common/MapContainer';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingState } from '../../components/LoadingState';
import {
  Navigation,
  MapPin,
  Sparkles,
  Car,
  Bike,
  Bus,
  Zap,
} from 'lucide-react';

export const UserRoutePlanner: React.FC = () => {
  const [fromLocation, setFromLocation] = useState('Koramangala 5th Block, Bengaluru');
  const [toLocation, setToLocation] = useState('Whitefield ITPL, Bengaluru');
  const [travelMode, setTravelMode] = useState<'car' | 'bike' | 'transit'>('car');
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const fetchRoutes = async (origin: string, destination: string) => {
    try {
      const res = await trafficService.getRouteOptions(origin, destination);
      setRoutes(res);
      const best = res.find((r) => r.isRecommended) || res[0];
      setSelectedRoute(best);
    } finally {
      setLoading(false);
      setCalculating(false);
    }
  };

  useEffect(() => {
    fetchRoutes(fromLocation, toLocation);
  }, []);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalculating(true);
    await fetchRoutes(fromLocation, toLocation);
  };

  if (loading) {
    return <LoadingState message="Calculating optimal traffic-free bypass routes..." />;
  }

  const recommendedRoute = routes.find((r) => r.isRecommended) || routes[0];
  const alternativeRoutes = routes.filter((r) => !r.isRecommended);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold text-slate-100 font-mono flex items-center gap-2">
            <Navigation className="w-5 h-5 text-cyan-400" />
            Smart Route Planner & Traffic Avoidance
          </h2>
          <Badge color="cyan" dot>
            AI Routing Matrix
          </Badge>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Enter starting location and destination to compare traffic-aware routes, distance, ETA, and time saved.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Inputs & Route Options Cards */}
        <div className="space-y-4">
          {/* 1. From / To Inputs Form */}
          <Card
            header={
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-200 uppercase">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Calculate Journey Route</span>
              </div>
            }
          >
            <form onSubmit={handleCalculate} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  From (Starting Location)
                </label>
                <input
                  type="text"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  placeholder="Enter starting location"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  To (Destination Location)
                </label>
                <input
                  type="text"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  placeholder="Enter destination location"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              {/* Mode Toggle */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block font-mono">
                  Travel Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTravelMode('car')}
                    className={`py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center justify-center gap-1.5 transition-all ${
                      travelMode === 'car'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    Car
                  </button>
                  <button
                    type="button"
                    onClick={() => setTravelMode('bike')}
                    className={`py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center justify-center gap-1.5 transition-all ${
                      travelMode === 'bike'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <Bike className="w-3.5 h-3.5" />
                    Two Wheeler
                  </button>
                  <button
                    type="button"
                    onClick={() => setTravelMode('transit')}
                    className={`py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center justify-center gap-1.5 transition-all ${
                      travelMode === 'transit'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <Bus className="w-3.5 h-3.5" />
                    Transit
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={calculating}
                className="w-full"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Calculate Traffic-Free Route
              </Button>
            </form>
          </Card>

          {/* 2. Recommended Route Section */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono block mb-2">
              Recommended Route
            </span>
            {recommendedRoute && (
              <div
                onClick={() => setSelectedRoute(recommendedRoute)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedRoute?.id === recommendedRoute.id
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-xl shadow-cyan-500/10'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-100">{recommendedRoute.name}</h4>
                  </div>
                  <Badge color="emerald" dot size="sm">
                    AI Top Pick
                  </Badge>
                </div>

                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Via: {recommendedRoute.viaRoads.join(' → ')}
                </p>

                {/* Key Metrics: Distance, ETA, Traffic Condition, Time Saved */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800">
                  <div className="p-2 bg-slate-950 rounded-lg">
                    <span className="text-slate-400 text-[10px]">Distance & ETA:</span>
                    <div className="font-bold text-cyan-400">
                      {recommendedRoute.distanceKm} km • {recommendedRoute.durationMin} mins
                    </div>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg">
                    <span className="text-slate-400 text-[10px]">Traffic Condition:</span>
                    <div className="font-bold text-emerald-400 capitalize">
                      {recommendedRoute.congestionLevel} Flow
                    </div>
                  </div>
                </div>

                {recommendedRoute.timeSavedMin > 0 && (
                  <div className="mt-2.5 p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      Time Saved vs Normal Route:
                    </span>
                    <span>+{recommendedRoute.timeSavedMin} mins</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Alternative Routes Section */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
              Alternative Routes ({alternativeRoutes.length})
            </span>
            {alternativeRoutes.map((rt) => (
              <div
                key={rt.id}
                onClick={() => setSelectedRoute(rt)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedRoute?.id === rt.id
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200">{rt.name}</h4>
                  <Badge
                    color={
                      rt.congestionLevel === 'severe'
                        ? 'red'
                        : rt.congestionLevel === 'heavy'
                        ? 'amber'
                        : 'cyan'
                    }
                    size="sm"
                  >
                    {rt.congestionLevel}
                  </Badge>
                </div>

                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Via: {rt.viaRoads.join(', ')}
                </p>

                <div className="mt-2.5 flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Distance: <strong className="text-slate-200">{rt.distanceKm} km</strong></span>
                  <span className="text-slate-400">ETA: <strong className="text-slate-200">{rt.durationMin} mins</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: MapLibre Polyline Display & Details */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          {/* Selected Route Summary Banner */}
          {selectedRoute && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap justify-between items-center gap-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                  Currently Viewing Route Geometry
                </span>
                <h3 className="text-sm font-bold text-slate-100">{selectedRoute.name}</h3>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Duration</span>
                  <span className="font-bold text-cyan-400">{selectedRoute.durationMin} mins</span>
                </div>
                <div className="h-6 w-[1px] bg-slate-800" />
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Distance</span>
                  <span className="font-bold text-slate-200">{selectedRoute.distanceKm} km</span>
                </div>
              </div>
            </div>
          )}

          {/* MapLibre Container */}
          <div className="flex-1 min-h-[440px]">
            <MapContainer routes={selectedRoute ? [selectedRoute] : routes} />
          </div>
        </div>
      </div>
    </div>
  );
};
