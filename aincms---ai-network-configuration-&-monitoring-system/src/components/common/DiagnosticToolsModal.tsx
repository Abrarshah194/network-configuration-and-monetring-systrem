import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { runDiagnosticPing, runDiagnosticTraceroute } from '../../services/api';
import { Terminal, Activity, ArrowRight, Play, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const DiagnosticToolsModal: React.FC = () => {
  const {
    state,
    diagnosticModalOpen,
    setDiagnosticModalOpen,
    diagnosticTargetDevice,
  } = useNetwork();

  const [toolType, setToolType] = useState<'ping' | 'traceroute'>('ping');
  const [sourceDeviceId, setSourceDeviceId] = useState<string>(diagnosticTargetDevice?.id || (state?.devices[0]?.id || ''));
  const [targetIp, setTargetIp] = useState<string>('192.168.20.10');
  const [pingCount, setPingCount] = useState<number>(4);
  const [loading, setLoading] = useState<boolean>(false);
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [lastResult, setLastResult] = useState<{ reachable?: boolean; loss?: number; latency?: number } | null>(null);

  if (!diagnosticModalOpen || !state) return null;

  const handleRun = async () => {
    setLoading(true);
    setTerminalOutput(`Executing ${toolType.toUpperCase()} from ${sourceDeviceId} to ${targetIp}...\n[Simulating ARP resolution & network packet flow]...\n`);
    try {
      if (toolType === 'ping') {
        const res = await runDiagnosticPing(sourceDeviceId, targetIp, pingCount);
        setTerminalOutput(res.output);
        setLastResult({ reachable: res.reachable, loss: res.packetLoss, latency: res.avgLatencyMs });
      } else {
        const res = await runDiagnosticTraceroute(sourceDeviceId, targetIp);
        setTerminalOutput(res.output);
        setLastResult({ reachable: true });
      }
    } catch (err: any) {
      setTerminalOutput(`Error executing diagnostic: ${err.message || 'Network unreachable'}`);
      setLastResult({ reachable: false, loss: 100 });
    } finally {
      setLoading(false);
    }
  };

  const setQuickTarget = (ip: string) => {
    setTargetIp(ip);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Network Packet Diagnostics</h3>
              <p className="text-xs text-slate-400">Live ICMP Ping & Hop-by-Hop Traceroute Engine</p>
            </div>
          </div>
          <button
            onClick={() => setDiagnosticModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 space-y-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex gap-2">
            <button
              onClick={() => setToolType('ping')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                toolType === 'ping'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              ICMP Ping
            </button>
            <button
              onClick={() => setToolType('traceroute')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                toolType === 'traceroute'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
              IP Traceroute
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Source Node</label>
              <select
                value={sourceDeviceId}
                onChange={(e) => setSourceDeviceId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {state.devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.managementIp}) {d.status === 'offline' ? '[OFFLINE]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target IPv4 Address</label>
              <input
                type="text"
                value={targetIp}
                onChange={(e) => setTargetIp(e.target.value)}
                placeholder="e.g. 192.168.10.15"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {toolType === 'ping' ? 'Packet Count' : 'Max Hops'}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={pingCount}
                  onChange={(e) => setPingCount(Number(e.target.value))}
                  disabled={toolType !== 'ping'}
                  className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={handleRun}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {loading ? 'Transmitting...' : 'Send Packet'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Targets */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400">Quick Targets:</span>
            {state.devices.map((d) => (
              <button
                key={d.id}
                onClick={() => setQuickTarget(d.managementIp)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1 rounded text-slate-300 transition"
              >
                {d.name.split('-')[0]}: {d.managementIp}
              </button>
            ))}
            <button
              onClick={() => setQuickTarget('1.1.1.1')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1 rounded text-slate-300 transition"
            >
              DNS: 1.1.1.1
            </button>
          </div>
        </div>

        {/* Terminal Output */}
        <div className="p-6 flex-1 flex flex-col min-h-64 bg-slate-950 font-mono text-xs overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-xs mb-3">
            <span>TERMINAL SESSION: /dev/pts/sim-net-0</span>
            {lastResult && (
              <div className="flex items-center gap-3">
                {lastResult.reachable ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-sans">
                    <CheckCircle2 className="w-4 h-4" /> Reachable ({lastResult.latency}ms)
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1 font-sans">
                    <ShieldAlert className="w-4 h-4" /> 100% Packet Loss / Unreachable
                  </span>
                )}
              </div>
            )}
          </div>
          <pre className="flex-1 overflow-y-auto text-emerald-400/90 whitespace-pre-wrap leading-relaxed">
            {terminalOutput || 'Waiting for diagnostic transmission command. Select source and target, then click "Send Packet".'}
          </pre>
        </div>
      </div>
    </div>
  );
};
