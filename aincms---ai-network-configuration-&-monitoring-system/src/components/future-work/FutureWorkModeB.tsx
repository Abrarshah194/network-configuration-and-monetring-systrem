import React, { useState } from 'react';
import {
  Cpu,
  Radio,
  Server,
  Terminal,
  Lock,
  Layers,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Key,
} from 'lucide-react';

export const FutureWorkModeB: React.FC<{
  onNavigate?: (tab: any) => void;
}> = ({ onNavigate }) => {
  const [testConnecting, setTestConnecting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSimulateTest = () => {
    setTestConnecting(true);
    setTestResult(null);
    setTimeout(() => {
      setTestConnecting(false);
      setTestResult(
        'Mode B Roadmap Preview: Handshake driver validated for Cisco IOS-XR / Netmiko SSH on port 22. In Phase 2, this will stream live CLI telemetry into the AINCMS graph engine.'
      );
    }, 1200);
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
            FYP Phase 2 Roadmap
          </span>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs text-slate-400 font-mono">Future Hardware Integration</span>
        </div>
        <h2 className="text-2xl font-bold text-white mt-1 flex items-center gap-2.5">
          <Cpu className="w-6 h-6 text-purple-400" />
          Mode B: Real Hardware Integration via SSH & SNMP (/future-work)
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          While <strong className="text-emerald-400">Mode A</strong> operates purely as a deterministic software-based
          virtual network simulator, <strong className="text-purple-400">Mode B</strong> extends the AINCMS control plane to
          physically connected Cisco, Juniper, Arista, and FRRouting hardware via secure out-of-band SSH, NETCONF, and SNMP polling.
        </p>
      </div>

      {/* FEATURE 5: UI Mockup Card: Connect Real Cisco Device via SSH - Coming Soon */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-900/90 border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  Mode B: Connect Real Cisco Device via SSH — Coming Soon
                </h3>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-mono font-bold uppercase">
                  FYP Phase 2
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Out-of-band SSH & SNMP v2c/v3 telemetry driver for physical switches and enterprise edge routers.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-slate-500 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 self-start md:self-auto">
            Driver: <span className="text-purple-400">Netmiko / Python 3.11</span>
          </span>
        </div>

        {/* Disabled Input Fields Mockup */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Target Device IPv4 / Hostname <span className="text-purple-400">*</span>
              </label>
              <input
                type="text"
                disabled
                value="192.168.1.1 (Cisco Catalyst 9300)"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 font-mono cursor-not-allowed select-none opacity-80"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">OOB Management Subnet</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                SSH Port & Transport Protocol
              </label>
              <input
                type="text"
                disabled
                value="Port 22 (SSHv2 / TLS 1.3)"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 font-mono cursor-not-allowed select-none opacity-80"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">RFC 4253 Secure Shell</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Target Device OS Profile
              </label>
              <input
                type="text"
                disabled
                value="Cisco IOS-XR 7.3+ / IOS-XE 17.6"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 font-mono cursor-not-allowed select-none opacity-80"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Driver auto-detection</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                SSH Username
              </label>
              <input
                type="text"
                disabled
                value="netadmin"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 font-mono cursor-not-allowed select-none opacity-80"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Privileged AAA Account</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                SSH Password / Private Key
              </label>
              <input
                type="password"
                disabled
                value="cisco_super_secret_key"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 font-mono cursor-not-allowed select-none opacity-80"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">RSA 4096-bit Key Pair Supported</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Enable Secret (Privileged EXEC)
              </label>
              <input
                type="password"
                disabled
                value="enable_secret_token"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 font-mono cursor-not-allowed select-none opacity-80"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Level 15 EXEC elevation</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Inputs disabled during Mode A software simulation. Planned for Phase 2 hardware lab testbed.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleSimulateTest}
                disabled={testConnecting}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {testConnecting ? 'Testing Netmiko Handshake...' : 'Preview Hardware Handshake'}
              </button>
            </div>
          </div>

          {testResult && (
            <div className="bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs p-3.5 rounded-xl flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>{testResult}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mode A vs Mode B Architectural Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mode A Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-bold text-white text-base">Mode A — Software Simulation</h3>
            </div>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-semibold">
              CURRENT ACTIVE
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            The university final-year project requirement specifically mandated operation without requiring expensive
            physical equipment, proprietary Cisco IOS licenses, or physical patch cords.
          </p>

          <ul className="text-xs text-slate-400 space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Deterministic seeded PRNG (<strong className="text-slate-200">Seed #42</strong>) produces reproducible evaluations.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>In-memory and file-backed virtual router state (6 nodes, Spanning Tree loop-free).</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% reproducible for university examiner viva and grading.</span>
            </li>
          </ul>
        </div>

        {/* Mode B Column */}
        <div className="bg-slate-900 border border-purple-500/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-purple-400" />
              <h3 className="font-bold text-white text-base">Mode B — Physical & Virtual Lab</h3>
            </div>
            <span className="text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-mono font-semibold">
              FUTURE EXTENSION
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Designed as an optional second phase when physical routers or Containerlab containers become available.
          </p>

          <ul className="text-xs text-slate-400 space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Containerlab + FRRouting Linux daemons (vtysh & BGP/OSPF engines).</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span>SNMP v2c/v3 MIB-II polling (OIDs 1.3.6.1.2.1.2.2 for interface bandwidth).</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Netmiko automated CLI configuration push via SSH credentials.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Protocol Architecture Reference */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          Technical Telemetry & Polling Architecture for Mode B
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-mono text-purple-400 font-semibold text-xs block">1. SSH Netmiko Layer</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Maintains keepalive connection pools to physical switches. Executes candidate commits, retrieves running-config via
              <code className="text-slate-300 ml-1">show running-config</code>, and performs atomic diff rollbacks.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-mono text-blue-400 font-semibold text-xs block">2. SNMP Polling Daemon</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Polls interface octet counters every 5 seconds. Computes throughput:
              <code className="text-slate-300 ml-1">ΔBytes * 8 / Δt</code>, discarding 32-bit counter wraps automatically.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-mono text-emerald-400 font-semibold text-xs block">3. Digital Twin Adapter</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Feeds real hardware state directly into the existing React Flow topology canvas and Recharts monitoring dashboard without
              modifying frontend rendering code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
