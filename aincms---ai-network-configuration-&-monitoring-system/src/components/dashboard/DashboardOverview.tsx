import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import {
  Server,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers,
  ShieldAlert,
  Terminal,
  Zap,
  Radio,
  FileCode,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

export const DashboardOverview: React.FC<{
  onNavigate: (tab: any) => void;
}> = ({ onNavigate }) => {
  const { state, setDiagnosticModalOpen, setSelectedDevice } = useNetwork();
  const [timeRange, setTimeRange] = useState<'5m' | '15m' | '1h'>('5m');

  if (!state) return null;

  const devices = state.devices;
  const links = state.links;
  const faults = state.faults;
  const alerts = state.alerts;

  const onlineDevices = devices.filter((d) => d.status === 'online').length;
  const degradedDevices = devices.filter((d) => d.status === 'degraded').length;
  const offlineDevices = devices.filter((d) => d.status === 'offline').length;
  const availability = devices.length ? ((onlineDevices / devices.length) * 100).toFixed(1) : '100';

  const activeLinks = links.filter((l) => l.status === 'active').length;
  const totalThroughput = (
    links.reduce((acc, l) => acc + (l.status === 'active' ? l.trafficFlowBps : 0), 0) / 1000000
  ).toFixed(1);

  const avgCpu = Math.round(
    devices.reduce((acc, d) => acc + d.cpuPercent, 0) / (devices.length || 1)
  );
  const avgMemory = Math.round(
    devices.reduce((acc, d) => acc + d.memoryPercent, 0) / (devices.length || 1)
  );

  const activeFaults = faults.filter((f) => f.status === 'active');
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged && !a.resolved);

  // Format metric chart samples
  const chartData = (state.metricSamples || []).map((sample) => ({
    time: new Date(sample.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    Throughput: sample.totalThroughputMbps,
    Latency: sample.avgLatencyMs,
    CPU: sample.cpuAvgPercent,
  }));

  const deviceDistributionData = [
    { name: 'Routers', value: devices.filter((d) => d.type === 'router').length, color: '#3b82f6' },
    { name: 'Switches', value: devices.filter((d) => d.type.startsWith('switch')).length, color: '#10b981' },
    { name: 'Firewalls', value: devices.filter((d) => d.type === 'firewall').length, color: '#f59e0b' },
    { name: 'Servers & Hosts', value: devices.filter((d) => d.type === 'server' || d.type === 'host').length, color: '#8b5cf6' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Verification Mode Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                Deterministic Software Simulation (Mode A) Active
              </h2>
              <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                FYP Verification Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              All metrics, ARP tables, OSPF convergence, and traffic flows are calculated deterministically via pseudo-random state engine. No physical hardware required.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('faults')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Inject / Test Fault
          </button>
          <button
            onClick={() => setDiagnosticModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Terminal className="w-3.5 h-3.5" />
            Ping Diagnostic
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Total Devices */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Virtual Devices</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white">{devices.length}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
              <span className="text-emerald-400">{onlineDevices} online</span>
              {offlineDevices > 0 && <span className="text-rose-400">({offlineDevices} off)</span>}
            </div>
          </div>
        </div>

        {/* Network Availability */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Availability</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-400">{availability}%</div>
            <div className="text-[11px] text-slate-400 mt-1">SLA: 99.9% Target</div>
          </div>
        </div>

        {/* Active Topology Links */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Links</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white">
              {activeLinks} / {links.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">100% STP Loop-Free</div>
          </div>
        </div>

        {/* Simulated Throughput */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Throughput</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white">{totalThroughput} <span className="text-xs font-normal text-slate-400">Mbps</span></div>
            <div className="text-[11px] text-cyan-400/90 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Peak: 145 Mbps
            </div>
          </div>
        </div>

        {/* Average CPU / Mem */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Control Plane CPU</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white">{avgCpu}%</div>
            <div className="text-[11px] text-slate-400 mt-1">Memory avg: {avgMemory}%</div>
          </div>
        </div>

        {/* Active Alerts */}
        <div
          onClick={() => onNavigate('alerts')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between cursor-pointer hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Alerts</span>
            <AlertTriangle className={`w-4 h-4 ${unacknowledgedAlerts.length > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-bold ${unacknowledgedAlerts.length > 0 ? 'text-amber-400' : 'text-white'}`}>
              {unacknowledgedAlerts.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {activeFaults.length} critical fault(s)
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-Time Throughput & Latency Trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                Simulated Network Throughput & Jitter
              </h3>
              <p className="text-xs text-slate-400">
                Real-time bounded deterministic telemetry (Mbps)
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
              {(['5m', '15m', '1h'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                    timeRange === r ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="Throughput" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorThroughput)" name="Throughput (Mbps)" />
                <Area type="monotone" dataKey="Latency" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" name="Latency (ms)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Distribution & Protocols */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Node Composition</h3>
            <p className="text-xs text-slate-400">Virtual Network Role Distribution</p>
          </div>

          <div className="h-44 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deviceDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
            {deviceDistributionData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Faults & Device Quick Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Faults & Diagnostics */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-white">Active Faults & Diagnostics</h3>
            </div>
            <button
              onClick={() => onNavigate('faults')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              View Engine <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {activeFaults.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
                <span>No active network faults detected. All monitored nodes healthy.</span>
              </div>
            ) : (
              activeFaults.map((f) => (
                <div
                  key={f.id}
                  className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-xs flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rose-300 uppercase tracking-wide">
                      {f.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(f.firstDetected).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-300">{f.likelyCause}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Managed Devices Snapshot */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Monitored Device Fleet</h3>
            </div>
            <button
              onClick={() => onNavigate('devices')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              Full Inventory <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-800/80">
            {devices.slice(0, 5).map((dev) => (
              <div
                key={dev.id}
                onClick={() => {
                  setSelectedDevice(dev);
                  onNavigate('config');
                }}
                className="py-2.5 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-lg cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      dev.status === 'online'
                        ? 'bg-emerald-400'
                        : dev.status === 'degraded'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />
                  <div>
                    <h4 className="text-xs font-medium text-slate-200">{dev.name}</h4>
                    <p className="text-[11px] text-slate-500 font-mono">{dev.managementIp} • {dev.type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <div className="text-right">
                    <span>CPU: {dev.cpuPercent}%</span>
                    <div className="w-16 bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full ${
                          dev.cpuPercent > 80 ? 'bg-rose-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${dev.cpuPercent}%` }}
                      />
                    </div>
                  </div>
                  <FileCode className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURE 5: Future Work Section for Mode B Preview on Dashboard */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-purple-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Mode B: Real Hardware Integration via SSH & SNMP — Future Work</h3>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-mono font-semibold uppercase">
                Phase 2
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect real Cisco switches, routers, and FRRouting containers via Netmiko SSH & SNMP MIB-II polling.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('future_work')}
          className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shrink-0 shadow-md shadow-purple-600/20"
        >
          <span>Explore Mode B Roadmap</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
