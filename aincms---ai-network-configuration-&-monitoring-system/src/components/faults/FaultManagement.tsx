import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Play,
  RotateCcw,
  Zap,
  Activity,
  Server,
  Layers,
  Clock,
  HelpCircle,
  Terminal,
  Eye,
} from 'lucide-react';
import { injectFault, resolveFault } from '../../services/api';
import { FaultEvent } from '../../types/network';
import { logSystemAction } from '../../services/auditLogger';

export const FaultManagement: React.FC<{
  onNavigate: (tab: any) => void;
}> = ({ onNavigate }) => {
  const { state, refreshState, userRole, currentUser, setDiagnosticModalOpen, setDiagnosticTargetDevice } = useNetwork();

  const [selectedFaultCategory, setSelectedFaultCategory] = useState<string>('link_failure');
  const [targetId, setTargetId] = useState<string>(state?.links[0]?.id || '');
  const [severity, setSeverity] = useState<'critical' | 'warning' | 'info'>('critical');
  const [loading, setLoading] = useState(false);

  if (!state) return null;

  const canInject = currentUser.role === 'admin' && (userRole === 'super_admin' || userRole === 'network_admin');
  const faults = state.faults || [];

  const handleInject = async () => {
    if (!canInject || !targetId) return;
    setLoading(true);
    try {
      await injectFault(selectedFaultCategory, targetId, severity);
      logSystemAction({
        user: currentUser.role,
        action: 'Inject Fault',
        targetDevice: targetId,
        status: 'Success',
        details: `Injected synthetic ${selectedFaultCategory} (Severity: ${severity})`,
      });
      await refreshState();
    } catch (err: any) {
      logSystemAction({
        user: currentUser.role,
        action: 'Inject Fault',
        targetDevice: targetId,
        status: 'Failed',
        details: err.message,
      });
      alert(`Fault injection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    if (!canInject) return;
    setLoading(true);
    try {
      await resolveFault(id);
      logSystemAction({
        user: currentUser.role,
        action: 'Resolve Fault',
        targetDevice: id,
        status: 'Success',
        details: 'Resolved active fault condition',
      });
      await refreshState();
    } catch (err: any) {
      alert(`Resolution error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          Network Fault Detection & Recovery Engine
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Automated heuristic rule evaluation for link cuts, control plane overloads, packet loss, and simulated hardware failures.
        </p>
      </div>

      {/* Fault Injection Panel */}
      {canInject ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Simulated Fault Injection Simulator</h3>
            </div>
            <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
              Academic FYP Scenario Testing
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Fault Type */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Fault Type</label>
              <select
                value={selectedFaultCategory}
                onChange={(e) => {
                  setSelectedFaultCategory(e.target.value);
                  if (e.target.value.includes('link')) {
                    setTargetId(state.links[0]?.id || '');
                  } else {
                    setTargetId(state.devices[0]?.id || '');
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
              >
                <option value="link_failure">Fiber / Link Cut (Operational Down)</option>
                <option value="high_latency">Buffer Congestion & High Latency</option>
                <option value="cpu_spike">Control Plane CPU Overload (&gt;90%)</option>
                <option value="device_offline">Total Device Power Failure (Crash)</option>
              </select>
            </div>

            {/* Target Selection */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Target Node / Link</label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none font-mono"
              >
                {selectedFaultCategory.includes('link')
                  ? state.links.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.id} ({l.sourceDeviceId} ⟷ {l.targetDeviceId})
                      </option>
                    ))
                  : state.devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.managementIp})
                      </option>
                    ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
              >
                <option value="critical">Critical (Service Impairment)</option>
                <option value="warning">Warning (Degraded SLA)</option>
                <option value="info">Informational</option>
              </select>
            </div>

            {/* Trigger Button */}
            <div className="flex items-end">
              <button
                onClick={handleInject}
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                {loading ? 'Injecting...' : 'Inject Synthetic Fault'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Viewer Mode (Student):</strong> Simulated fault injection controls are disabled for read-only accounts. Sign in as <strong>admin</strong> to inject synthetic link cuts and CPU spikes.
            </span>
          </div>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded font-mono font-semibold uppercase shrink-0">
            Read-Only
          </span>
        </div>
      )}

      {/* Detected Fault Events List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center justify-between">
          <span>Detected Fault Incidents ({faults.length})</span>
          <span className="text-xs text-slate-400 font-normal">
            Active: {faults.filter((f) => f.status === 'active').length}
          </span>
        </h3>

        <div className="space-y-4">
          {faults.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/40" />
              <span>No fault events recorded. Network operating at 100% simulated fidelity.</span>
            </div>
          ) : (
            faults.map((fault) => {
              const isActive = fault.status === 'active';
              return (
                <div
                  key={fault.id}
                  className={`border rounded-xl p-4 transition ${
                    isActive
                      ? fault.severity === 'critical'
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-slate-800/40 border-slate-800 opacity-70'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          fault.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {fault.severity}
                      </span>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                        {fault.category.replace('_', ' ')}
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
                          isActive ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {fault.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Detected: {new Date(fault.firstDetected).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs space-y-2">
                    <div>
                      <span className="text-slate-400 font-medium">Likely Root Cause: </span>
                      <span className="text-slate-200">{fault.likelyCause}</span>
                    </div>

                    {fault.affectedDevices.length > 0 && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-slate-400">Affected Devices:</span>
                        <div className="flex gap-1">
                          {fault.affectedDevices.map((dId) => (
                            <span key={dId} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                              {dId}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {fault.recommendedSteps.length > 0 && (
                      <div className="mt-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                        <div className="font-semibold text-slate-300 text-[11px] mb-1">
                          Recommended Troubleshooting Steps:
                        </div>
                        <ul className="list-disc pl-4 text-[11px] text-slate-400 space-y-0.5">
                          {fault.recommendedSteps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {isActive && canInject && (
                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                      <button
                        onClick={() => {
                          const dev = state.devices.find((d) => fault.affectedDevices.includes(d.id));
                          if (dev) setDiagnosticTargetDevice(dev);
                          setDiagnosticModalOpen(true);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        Run Diagnostic Ping Verification
                      </button>

                      <button
                        onClick={() => handleResolve(fault.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-1.5 px-4 rounded-lg flex items-center gap-1.5 transition shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Execute Remediation & Resolve
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
