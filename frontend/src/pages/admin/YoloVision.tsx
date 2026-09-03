import React, { useState, useEffect, useMemo } from 'react';
import {
  Camera,
  Eye,
  Car,
  Bus,
  Truck,
  Bike,
  Activity,
  Clock,
  AlertTriangle,
  Wifi,
  WifiOff,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Shield,
  Cpu,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

// ── Types ──
interface VehicleDetection {
  id: string;
  type: 'car' | 'bus' | 'truck' | 'bike' | 'auto' | 'bicycle' | 'person';
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CameraFeed {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
  resolution: string;
}

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
}

interface VehicleCount {
  type: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

// ── Mock Data ──
const MOCK_CAMERAS: CameraFeed[] = [
  { id: 'cam-01', name: 'ITO Flyover Cam - 01', location: 'ITO, Delhi', status: 'online', resolution: '1280x720' },
  { id: 'cam-02', name: 'Connaught Place Cam - 02', location: 'CP, Delhi', status: 'online', resolution: '1920x1080' },
  { id: 'cam-03', name: 'AIIMS Junction Cam - 03', location: 'AIIMS, Delhi', status: 'offline', resolution: '1280x720' },
  { id: 'cam-04', name: 'Chandni Chowk Cam - 04', location: 'Chandni Chowk, Delhi', status: 'online', resolution: '1280x720' },
];

const VEHICLE_COLORS: Record<string, string> = {
  car: '#22c55e',
  bus: '#f97316',
  truck: '#ef4444',
  bike: '#a855f7',
  auto: '#eab308',
  bicycle: '#06b6d4',
  person: '#64748b',
};

const MOCK_VEHICLE_COUNTS: VehicleCount[] = [
  { type: 'Cars', count: 42, percentage: 58.3, trend: 'up' },
  { type: 'Bikes', count: 18, percentage: 25.0, trend: 'up' },
  { type: 'Buses', count: 5, percentage: 6.9, trend: 'down' },
  { type: 'Trucks', count: 7, percentage: 9.7, trend: 'stable' },
];

const MOCK_ALERTS: Alert[] = [
  { id: '1', type: 'critical', title: 'High congestion detected', message: 'Density above 75% at ITO Flyover', timestamp: '21:54:40' },
  { id: '2', type: 'warning', title: 'Queue length increasing', message: 'Queue length 186m and growing', timestamp: '21:54:20' },
  { id: '3', type: 'info', title: 'Heavy truck detected', message: 'High truck count: 7', timestamp: '21:53:55' },
  { id: '4', type: 'success', title: 'Camera quality good', message: 'Detection confidence stable at 92%', timestamp: '21:53:30' },
];

const MOCK_DENSITY_TREND = Array.from({ length: 12 }, (_, i) => ({
  time: `${21 + Math.floor(i / 4)}:${(i % 4) * 15}:00`,
  density: 50 + Math.random() * 40,
  queue: 100 + Math.random() * 100,
}));

const MOCK_VEHICLE_DISTRIBUTION = [
  { name: 'Cars', value: 42, color: '#22c55e' },
  { name: 'Bikes', value: 18, color: '#a855f7' },
  { name: 'Buses', value: 5, color: '#f97316' },
  { name: 'Trucks', value: 7, color: '#ef4444' },
];

// ── Main Component ──
export const AdminYoloVision: React.FC = () => {
  const [selectedCamera, setSelectedCamera] = useState<CameraFeed>(MOCK_CAMERAS[0]);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isProcessing] = useState(true);
  const [fps, setFps] = useState(22.4);
  const [confidence, setConfidence] = useState(92);
  const [totalVehicles, setTotalVehicles] = useState(72);
  const [trafficDensity, setTrafficDensity] = useState(78);
  const [queueLength, setQueueLength] = useState(186);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [detections, setDetections] = useState<VehicleDetection[]>([]);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate detection updates
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      // Simulate vehicle count changes
      setTotalVehicles((prev) => prev + Math.floor(Math.random() * 5) - 2);
      setTrafficDensity((prev) => Math.min(100, Math.max(0, prev + Math.floor(Math.random() * 5) - 2)));
      setQueueLength((prev) => Math.max(0, prev + Math.floor(Math.random() * 10) - 5));
      setFps((prev) => Math.max(15, Math.min(30, prev + (Math.random() * 2 - 1))));
      setConfidence((prev) => Math.max(80, Math.min(100, prev + (Math.random() * 2 - 1))));

      // Generate random detections
      const newDetections: VehicleDetection[] = Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, i) => ({
        id: `det-${i}`,
        type: ['car', 'bus', 'truck', 'bike', 'auto', 'bicycle', 'person'][Math.floor(Math.random() * 7)] as any,
        confidence: 0.7 + Math.random() * 0.3,
        x: Math.random() * 800,
        y: Math.random() * 400,
        width: 40 + Math.random() * 60,
        height: 30 + Math.random() * 40,
      }));
      setDetections(newDetections);
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing]);

  const totalDetected = useMemo(() => MOCK_VEHICLE_COUNTS.reduce((sum, v) => sum + v.count, 0), []);

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-100 font-mono flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            YOLO VISION MONITOR
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded">BETA</span>
            {isDemoMode && (
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded">YOLO DEMO</span>
            )}
          </h2>
          <p className="text-[11px] text-slate-400">
            Real-time AI-powered traffic monitoring using YOLO object detection
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Camera Selector */}
          <select
            value={selectedCamera.id}
            onChange={(e) => setSelectedCamera(MOCK_CAMERAS.find((c) => c.id === e.target.value) || MOCK_CAMERAS[0])}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            {MOCK_CAMERAS.map((cam) => (
              <option key={cam.id} value={cam.id}>
                Camera: {cam.name}
              </option>
            ))}
          </select>

          {/* Camera Status */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${
            selectedCamera.status === 'online'
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            {selectedCamera.status === 'online' ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
            )}
            <span className={`text-[10px] font-mono font-bold ${
              selectedCamera.status === 'online' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {selectedCamera.status.toUpperCase()}
            </span>
          </div>

          {/* FPS */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono text-slate-400">FPS:</span>
            <span className="text-[10px] font-mono font-bold text-cyan-400">{fps.toFixed(1)}</span>
          </div>

          {/* Model Info */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] font-mono font-bold text-purple-400">YOLOv8</span>
          </div>

          {/* Demo Toggle */}
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
              isDemoMode
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {isDemoMode ? 'DEMO MODE' : 'LIVE MODE'}
          </button>
        </div>
      </div>

      {/* ── 8 KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        <KpiMini
          label="Vehicles Detected"
          value={totalVehicles.toString()}
          icon={Car}
          color="cyan"
          subtitle={`↑ 12 vs last min`}
        />
        <KpiMini
          label="Cars"
          value={MOCK_VEHICLE_COUNTS[0].count.toString()}
          icon={Car}
          color="emerald"
          subtitle={`${MOCK_VEHICLE_COUNTS[0].percentage}%`}
        />
        <KpiMini
          label="Bikes"
          value={MOCK_VEHICLE_COUNTS[1].count.toString()}
          icon={Bike}
          color="purple"
          subtitle={`${MOCK_VEHICLE_COUNTS[1].percentage}%`}
        />
        <KpiMini
          label="Buses"
          value={MOCK_VEHICLE_COUNTS[2].count.toString()}
          icon={Bus}
          color="amber"
          subtitle={`${MOCK_VEHICLE_COUNTS[2].percentage}%`}
        />
        <KpiMini
          label="Trucks"
          value={MOCK_VEHICLE_COUNTS[3].count.toString()}
          icon={Truck}
          color="red"
          subtitle={`${MOCK_VEHICLE_COUNTS[3].percentage}%`}
        />
        <KpiMini
          label="Traffic Density"
          value={`${trafficDensity}%`}
          icon={Activity}
          color="amber"
          subtitle={trafficDensity > 70 ? 'High' : trafficDensity > 40 ? 'Medium' : 'Low'}
        />
        <KpiMini
          label="Queue Length"
          value={`${queueLength}m`}
          icon={Clock}
          color="purple"
          subtitle={`↑ 26m vs last min`}
        />
        <KpiMini
          label="Confidence"
          value={`${confidence.toFixed(0)}%`}
          icon={Shield}
          color="emerald"
          subtitle={confidence > 90 ? 'Very High' : confidence > 70 ? 'High' : 'Medium'}
        />
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Camera Feed + Detections */}
        <div className="lg:col-span-2 space-y-4">
          {/* Live Camera Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                LIVE CAMERA FEED (YOLO DETECTION)
              </h3>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400">LIVE</span>
              </div>
            </div>
            
            {/* Camera Feed Area */}
            <div className="relative bg-slate-950 aspect-video">
              {/* Simulated Camera Feed */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }} />
                
                {/* YOLO Detection Boxes */}
                {detections.map((det) => (
                  <div
                    key={det.id}
                    className="absolute border-2 rounded"
                    style={{
                      left: `${(det.x / 800) * 100}%`,
                      top: `${(det.y / 400) * 100}%`,
                      width: `${(det.width / 800) * 100}%`,
                      height: `${(det.height / 400) * 100}%`,
                      borderColor: VEHICLE_COLORS[det.type],
                      backgroundColor: `${VEHICLE_COLORS[det.type]}20`,
                    }}
                  >
                    <span
                      className="absolute -top-5 left-0 px-1 py-0.5 text-[8px] font-mono font-bold rounded whitespace-nowrap"
                      style={{ backgroundColor: VEHICLE_COLORS[det.type], color: '#000' }}
                    >
                      {det.type} {det.confidence.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Camera Info Overlay */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-black/60 text-[9px] font-mono text-emerald-400 rounded">
                  ● REC
                </span>
                <span className="px-2 py-1 bg-black/60 text-[9px] font-mono text-white rounded">
                  {currentTime.toLocaleTimeString('en-IN', { hour12: false })}
                </span>
              </div>

              {/* Resolution */}
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 text-[9px] font-mono text-white rounded">
                {selectedCamera.resolution}
              </div>
            </div>

            {/* Camera Info Bar */}
            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400">Camera: <span className="text-slate-200">{selectedCamera.name}</span></span>
              <span className="text-slate-400">Location: <span className="text-slate-200">{selectedCamera.location}</span></span>
              <span className="text-slate-400">Resolution: <span className="text-slate-200">{selectedCamera.resolution}</span></span>
            </div>
          </div>

          {/* Real-Time Counts + Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Real-Time Counts */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800">
                <h3 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  REAL-TIME COUNTS
                </h3>
              </div>
              <div className="p-4">
                <table className="w-full text-[10px] font-mono">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800">
                      <th className="text-left pb-2">Type</th>
                      <th className="text-right pb-2">Count</th>
                      <th className="text-right pb-2">%</th>
                      <th className="text-right pb-2">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_VEHICLE_COUNTS.map((v) => (
                      <tr key={v.type} className="border-b border-slate-800/50">
                        <td className="py-2 text-slate-200 font-semibold">{v.type}</td>
                        <td className="py-2 text-right text-slate-200">{v.count}</td>
                        <td className="py-2 text-right text-slate-400">{v.percentage}%</td>
                        <td className="py-2 text-right">
                          {v.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400 inline" />}
                          {v.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400 inline" />}
                          {v.trend === 'stable' && <Minus className="w-3 h-3 text-slate-400 inline" />}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="py-2 text-slate-200">Total</td>
                      <td className="py-2 text-right text-cyan-400">{totalDetected}</td>
                      <td className="py-2 text-right text-slate-400">100%</td>
                      <td className="py-2 text-right"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alerts & Events */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800">
                <h3 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  ALERTS & EVENTS
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {MOCK_ALERTS.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.type === 'critical' ? 'bg-red-950/20 border-red-500/30' :
                      alert.type === 'warning' ? 'bg-amber-950/20 border-amber-500/30' :
                      alert.type === 'info' ? 'bg-blue-950/20 border-blue-500/30' :
                      'bg-emerald-950/20 border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-200">{alert.title}</span>
                      <span className="text-[9px] font-mono text-slate-500">{alert.timestamp}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-mono">{alert.message}</p>
                  </div>
                ))}
                <button className="w-full py-2 text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                  View All Events →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Distribution + Density Trend */}
        <div className="space-y-4">
          {/* Vehicle Type Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
              <PieChart className="w-3.5 h-3.5 text-purple-400" />
              VEHICLE TYPE DISTRIBUTION
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={MOCK_VEHICLE_DISTRIBUTION}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {MOCK_VEHICLE_DISTRIBUTION.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {MOCK_VEHICLE_DISTRIBUTION.map((v) => (
                  <div key={v.name} className="flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: v.color }} />
                      <span className="text-slate-300">{v.name}</span>
                    </div>
                    <span className="text-slate-100 font-bold">{v.value} ({((v.value / totalDetected) * 100).toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Traffic Density Trend */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              TRAFFIC DENSITY TREND
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_DENSITY_TREND}>
                  <defs>
                    <linearGradient id="densityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '10px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="density"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#densityGradient)"
                    name="Density %"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-2">
              <span>Density (%)</span>
              <span className="text-amber-400">Current: {trafficDensity}%</span>
            </div>
          </div>

          {/* Queue Length Trend */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              QUEUE LENGTH TREND
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_DENSITY_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '10px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="queue"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#a855f7' }}
                    name="Queue (m)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-2">
              <span>Queue Length (m)</span>
              <span className="text-purple-400">Current: {queueLength}m</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: AI Insight + Prediction + Recommendation + Model Info ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* AI Insight */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            AI INSIGHT
          </h3>
          <p className="text-[10px] text-slate-300 font-mono leading-relaxed">
            Traffic density is high due to increased vehicle inflow. Queue likely to grow by 15-20% in next 15 minutes.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-500">Confidence:</span>
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full"
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className="text-[9px] font-mono font-bold text-cyan-400">{confidence}%</span>
          </div>
        </div>

        {/* Prediction */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            PREDICTION <span className="text-[9px] font-normal text-slate-500">(Next 15 Min)</span>
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="text-[9px] text-slate-500 block">Predicted Density</span>
              <span className="text-lg font-bold text-slate-100 font-mono">{Math.min(100, trafficDensity + 7)}%</span>
              <span className="text-[9px] text-amber-400 block">High</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block">Predicted Queue</span>
              <span className="text-lg font-bold text-slate-100 font-mono">{queueLength + 34}m</span>
              <span className="text-[9px] text-red-400 block">↑ 34m</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block">Avg Speed</span>
              <span className="text-lg font-bold text-slate-100 font-mono">18 km/h</span>
              <span className="text-[9px] text-red-400 block">↓ 4 km/h</span>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            RECOMMENDATION
          </h3>
          <p className="text-[10px] text-slate-300 font-mono leading-relaxed">
            Increase green time on ITO signal by 12s and divert heavy vehicles via Ring Road.
          </p>
          <button className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-mono font-bold transition-all">
            Apply Recommendation
          </button>
        </div>

        {/* Model Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            MODEL INFO
          </h3>
          <div className="space-y-2 text-[10px] font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Model:</span>
              <span className="text-slate-200 font-bold">YOLOv8n</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dataset:</span>
              <span className="text-slate-200">COCO + Custom Traffic</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Last Updated:</span>
              <span className="text-slate-200">03 Sep 2025 20:18</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Inference:</span>
              <span className="text-slate-200">Edge GPU (RTX 3050)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>YOLO Vision uses AI to detect and classify vehicles in real-time. Data is processed locally and aggregated for digital twin.</span>
        <span>Powered by AI • YOLOv8 • OpenCV • FastAPI</span>
      </div>
    </div>
  );
};

// ── KPI Mini Card ──
const KpiMini: React.FC<{
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  subtitle?: string;
}> = ({ label, value, icon: Icon, color, subtitle }) => {
  const colorMap: Record<string, string> = {
    cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400',
    red: 'from-red-500/10 to-red-500/5 border-red-500/20 text-red-400',
    purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-400',
  };
  const iconBg: Record<string, string> = {
    cyan: 'bg-cyan-500/20 text-cyan-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    red: 'bg-red-500/20 text-red-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className={`p-3 rounded-xl border bg-gradient-to-br ${colorMap[color]} shadow-lg flex items-center justify-between`}>
      <div>
        <p className="text-[9px] text-slate-400 font-medium">{label}</p>
        <h3 className="text-lg font-bold text-slate-100 font-mono tracking-tight">{value}</h3>
        {subtitle && (
          <p className="text-[9px] font-mono text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className={`p-2 rounded-lg ${iconBg[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  );
};
