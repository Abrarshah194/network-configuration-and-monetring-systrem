import React from 'react';
import {
  BookOpen,
  GraduationCap,
  Layers,
  Database,
  Cpu,
  Shield,
  Code,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Terminal,
} from 'lucide-react';

export const FypDocumentation: React.FC = () => {
  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto text-slate-200">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-semibold uppercase tracking-wider mb-1">
          <GraduationCap className="w-4 h-4" /> Academic Final Year Project (FYP) Documentation
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          AI-Powered Network Configuration and Monitoring System (AINCMS)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Comprehensive project report guide, architectural design, simulation formulation, and defense preparation.
        </p>
      </div>

      {/* 1. Abstract & Objectives */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          1. Abstract & Academic Problem Statement
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Traditional computer networking education and enterprise testbed staging suffer from severe equipment bottlenecks: commercial routers and multilayer switches are expensive, proprietary Cisco IOS images require vendor licensing, and cloud testbeds introduce unpredictable networking latency.
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>AINCMS</strong> solves this by delivering an end-to-end, full-stack, software-based network configuration, deterministic simulation, and real-time monitoring suite. The system provides:
        </p>
        <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1">
          <li><strong>Autonomous Software Simulation (Mode A)</strong>: A deterministic mathematical state engine operating via linear congruential generator (LCG) pseudo-randomness, enabling fully reproducible experiments.</li>
          <li><strong>Interactive Topology Graph</strong>: Built with React Flow (@xyflow/react), providing interactive port linking, live packet animations, and loop detection.</li>
          <li><strong>Declarative Automation Center</strong>: Multi-step workflows for VLAN provisioning, static route injection, interface toggling, and drift auto-remediation.</li>
          <li><strong>Server-Side Gemini 3.8 Flash Copilot</strong>: Live network diagnostics, root-cause hypothesis generation, and configuration auditing grounded directly on the current topology state.</li>
        </ul>
      </section>

      {/* 2. System Architecture */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          2. Multi-Tiered System Architecture
        </h2>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto">
{`+-----------------------------------------------------------------------------------+
|                           PRESENTATION TIER (React 19 + Tailwind v4)              |
|   Dashboard | React Flow Topology | Config Workspace | Alerts | Guided FYP Labs   |
+-----------------------------------------------------------------------------------+
                                        |  REST API (/api/*)
+-----------------------------------------------------------------------------------+
|                        APPLICATION & ENGINE TIER (Express + TS)                   |
|                                                                                   |
|  +---------------------------+   +------------------------+   +----------------+  |
|  | Deterministic Simulation  |   | Rule Automation Engine |   | Gemini Flash   |  |
|  | - Seeded LCG Clock        |   | - Dry-run Planner      |   | - Server Agent |  |
|  | - Packet Loss & Latency   |   | - Rollback Snapshots   |   | - Root Cause   |  |
|  +---------------------------+   +------------------------+   +----------------+  |
+-----------------------------------------------------------------------------------+
        |                                                |
+------------------------------------+   +------------------------------------------+
| DATA REPOSITORY TIER               |   | MODE B ADAPTER TIER (Optional)           |
| - JSON Disk State Cache            |   | - Docker Daemon Reverse Socket           |
| - Cloud Firestore Schema & Rules   |   | - Containerlab v0.48+ / FRRouting 9.1    |
+------------------------------------+   +------------------------------------------+`}
        </div>
      </section>

      {/* 3. Mathematical Formulation */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          3. Mathematical Formulation of Deterministic Simulation
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          To ensure lab exercises yield 100% reproducible results for academic evaluation, AINCMS avoids unseeded <code className="text-cyan-400 font-mono">Math.random()</code> calls. Instead, state transitions rely on a Linear Congruential Generator (LCG):
        </p>
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-cyan-400">
          X_(n+1) = (a * X_n + c) mod m<br />
          Where: a = 9301, c = 49297, m = 233280, Seed = 42
        </div>
        <p className="text-xs text-slate-400">
          Simulated link latency <span className="font-mono text-slate-300">L(t)</span> is bounded:
        </p>
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300">
          L(t) = L_base + sin(omega * t + delta) * A_jitter + degradation(link.status)
        </div>
      </section>

      {/* 4. Firestore / Relational Data Model */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-400" />
          4. Document & Database Schema (Firestore & JSON)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="font-semibold text-white">Collection: devices</span>
            <p className="text-slate-400 text-[11px]">id, name, type, managementIp, status, runningConfig, savedConfig, configVersions[], interfaces[]</p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="font-semibold text-white">Collection: links</span>
            <p className="text-slate-400 text-[11px]">id, sourceDeviceId, sourceInterfaceId, targetDeviceId, targetInterfaceId, bandwidthMbps, latencyMs, status</p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="font-semibold text-white">Collection: faults</span>
            <p className="text-slate-400 text-[11px]">id, category, severity, affectedDevices[], affectedLinks[], likelyCause, recommendedSteps[], status</p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="font-semibold text-white">Collection: auditLogs</span>
            <p className="text-slate-400 text-[11px]">id, timestamp, actor, action, resource, details, status</p>
          </div>
        </div>
      </section>

      {/* 5. Defense / Viva Q&A Guide */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          5. Academic Viva / Defense Preparation Guide
        </h2>
        <div className="space-y-3 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <h4 className="font-bold text-white mb-1">
              Q: Does this application execute real packets or is it purely simulated?
            </h4>
            <p className="text-slate-300">
              <strong>Answer:</strong> AINCMS features a strict dual-mode architecture. In <em>Mode A</em>, it executes a deterministic, stateful software simulation engine that calculates ARP, Spanning-Tree loops, and OSPF adjacencies. In <em>Mode B</em>, it connects via an authenticated local bridge to real Containerlab and FRRouting Linux network namespaces. The UI never mislabels synthetic metrics as physical hardware readings.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <h4 className="font-bold text-white mb-1">
              Q: How is AI safety ensured when generating device configurations?
            </h4>
            <p className="text-slate-300">
              <strong>Answer:</strong> AI calls are routed strictly through the backend Express server using <code className="text-purple-400 font-mono">gemini-3.8-flash</code> with zero API key exposure to clients. The AI has read-only context and cannot directly commit changes to devices. All generated CLI configurations require explicit dry-run inspection, validation, and manual administrator approval.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <h4 className="font-bold text-white mb-1">
              Q: What are the current limitations and future scope?
            </h4>
            <p className="text-slate-300">
              <strong>Answer:</strong> Current limitations include software simulation scaling beyond 50 nodes and protocol support focused on IPv4, OSPF, and 802.1Q VLANs. Future work involves extending the Containerlab adapter to BGP EVPN/VXLAN fabrics and integrating automated Netmiko SSH push into physical lab hardware.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
