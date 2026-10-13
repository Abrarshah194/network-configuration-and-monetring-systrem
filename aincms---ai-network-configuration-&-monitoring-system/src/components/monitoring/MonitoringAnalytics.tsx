import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import {
  LineChart,
  Activity,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  Radio,
  Layers,
  PieChart as PieIcon,
  HardDrive,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const MonitoringAnalytics: React.FC = () => {
  const { state } = useNetwork();
  const [metricTab, setMetricTab] = useState<'traffic' | 'resources' | 'protocols'>('traffic');

  if (!state) return null;

  const samples = state.metricSamples || [];

  const timeSeriesData = samples.map((s) => ({
    time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    Throughput: s.totalThroughputMbps,
    Latency: s.avgLatencyMs,
    PacketLoss: s.avgPacketLossPercent,
    CPU: s.cpuAvgPercent,
    Memory: s.memAvgPercent,
  }));

  // Protocol distribution from latest sample
  const latestProtocols = samples[samples.length - 1]?.protocolStats || [
    { protocol: 'HTTPS (TCP/443)', percentage: 54, bytes: 42000000 },
    { protocol: 'DNS (UDP/53)', percentage: 14, bytes: 11000000 },
    { protocol: 'SSH (TCP/22)', percentage: 12, bytes: 9400000 },
    { protocol: 'OSPF (IP/89)', percentage: 8, bytes: 6200000 },
    { protocol: 'ICMP (Echo)', percentage: 12, bytes: 9300000 },
  ];

  const protocolColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  // Top Talkers (Nodes with highest simulated traffic)
  const topTalkers = state.devices.map((d) => {
    const isRouter = d.type === 'router';
    const isServer = d.type === 'server';
    const flowMbps = isRouter ? 42.5 : isServer ? 28.0 : d.type === 'firewall' ? 36.2 : 8.5;
    return {
      name: d.name,
      ip: d.managementIp,
      type: d.type,
      bandwidthMbps: flowMbps,
      packetsSec: Math.round(flowMbps * 820),
    };
  }).sort((a, b) => b.bandwidthMbps - a.bandwidthMbps);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LineChart className="w-5 h-5 text-cyan-400" />
            Network Traffic & Telemetry Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time interface flow counters, synthetic protocol distributions, latency curves, and device utilization.
          </p>
        </div>

        {/* Category Selector */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setMetricTab('traffic')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              metricTab === 'traffic' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Traffic & Loss
          </button>
          <button
            onClick={() => setMetricTab('resources')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              metricTab === 'resources' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CPU & Memory
          </button>
          <button
            onClick={() => setMetricTab('protocols')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              metricTab === 'protocols' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Protocols & Talkers
          </button>
        </div>
      </div>

      {/* Verification Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Telemetry Source: <strong>Simulation Engine Core</strong> (Seeded Virtual Clock Tick #{state.virtualTick})</span>
        </div>
        <span className="text-[11px] font-mono text-slate-500">Retention: 40 Sliding Window Samples</span>
      </div>

      {/* Tab 1: Traffic & Loss */}
      {metricTab === 'traffic' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Total Network Bandwidth (Mbps)</h3>
            <p className="text-xs text-slate-400 mb-4">Sum of all active Layer 2/3 virtual link transmissions</p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorBw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="Throughput" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorBw)" name="Throughput (Mbps)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-1">Calculated Average Latency (ms)</h3>
              <p className="text-xs text-slate-400 mb-4">Simulated propagation and queuing delay across links</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="Latency" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b" fillOpacity={0.1} name="Latency (ms)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-1">Packet Loss Percentage (%)</h3>
              <p className="text-xs text-slate-400 mb-4">Calculated tail-drops and degraded link discards</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="PacketLoss" stroke="#f43f5e" strokeWidth={2} fill="#f43f5e" fillOpacity={0.1} name="Loss (%)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: CPU & Memory */}
      {metricTab === 'resources' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Control Plane CPU & RAM Utilization (%)</h3>
          <p className="text-xs text-slate-400 mb-4">Historical hardware resource load across all virtual routers & switches</p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="CPU" stroke="#ec4899" strokeWidth={2} fill="#ec4899" fillOpacity={0.1} name="CPU Avg (%)" />
                <Area type="monotone" dataKey="Memory" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.1} name="Memory Avg (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: Protocols & Top Talkers */}
      {metricTab === 'protocols' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Protocol Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Simulated Protocol Composition</h3>
            <p className="text-xs text-slate-400 mb-4">L4 and application-tier protocol breakdown</p>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={latestProtocols}
                    dataKey="percentage"
                    nameKey="protocol"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {latestProtocols.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={protocolColors[index % protocolColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Talkers */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Top Bandwidth-Consuming Nodes</h3>
            <p className="text-xs text-slate-400 mb-4">Ranked by transmitted and routed bitrate (Mbps)</p>

            <div className="space-y-3">
              {topTalkers.map((talker, idx) => (
                <div key={talker.name} className="flex items-center justify-between bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-500 w-4">#{idx + 1}</span>
                    <div>
                      <div className="font-semibold text-slate-200">{talker.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{talker.ip} • {talker.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-cyan-400 font-bold">{talker.bandwidthMbps} Mbps</div>
                    <div className="text-[10px] text-slate-500">{talker.packetsSec.toLocaleString()} pkt/s</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
