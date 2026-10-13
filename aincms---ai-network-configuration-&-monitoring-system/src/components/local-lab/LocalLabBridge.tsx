import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import {
  Layers,
  Terminal,
  Download,
  CheckCircle2,
  AlertTriangle,
  Server,
  Key,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Code,
} from 'lucide-react';
import { registerLocalAgent } from '../../services/api';

export const LocalLabBridge: React.FC = () => {
  const { state, refreshState } = useNetwork();
  const [tokenInput, setTokenInput] = useState<string>('demo-agent-key-2026');
  const [simulatingConnect, setSimulatingConnect] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  if (!state) return null;

  const agentStatus = state.localAgentStatus;

  const samplePythonAgent = `#!/usr/bin/env python3
"""
AINCMS Local Lab Agent Bridge (Mode B Adapter)
Connects local Containerlab / FRRouting Docker daemon to AINCMS Web Platform.
"""

import time
import requests
import json
import subprocess

API_ENDPOINT = "http://localhost:3000/api/agent/register"
AGENT_KEY = "demo-agent-key-2026"

def check_containerlab():
    try:
        out = subprocess.check_output(["containerlab", "version"]).decode()
        return "ready", out.strip().split('\\n')[0]
    except Exception:
        return "simulated", "Containerlab v0.48.0 (Local Simulated Adapter)"

def register():
    clab_status, ver = check_containerlab()
    payload = {
        "agentKey": AGENT_KEY,
        "agentVersion": "aincms-agent-v1.0.4",
        "dockerStatus": "running",
        "containerlabStatus": clab_status,
        "nodeCount": 6
    }
    try:
        res = requests.post(API_ENDPOINT, json=payload, timeout=5)
        print(f"Agent synchronization: {res.status_code} - {res.json()}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    print("Starting AINCMS Local Lab Agent Bridge...")
    register()
`;

  const handleDownloadScript = () => {
    const blob = new Blob([samplePythonAgent], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aincms_local_agent.py';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleSimulateRegister = async () => {
    setSimulatingConnect(true);
    try {
      await registerLocalAgent(tokenInput);
      await refreshState();
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    } finally {
      setSimulatingConnect(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          Mode B: Optional Local Virtual Lab Bridge (Containerlab & FRRouting)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Architectural adapter specification for connecting local Docker, Containerlab, and Linux network namespaces.
        </p>
      </div>

      {/* Connection Status Banner */}
      <div
        className={`border rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          agentStatus.connected
            ? 'bg-purple-500/10 border-purple-500/30'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
              agentStatus.connected
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {agentStatus.connected ? <CheckCircle2 className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                {agentStatus.connected ? 'Local Agent Connected (Mode B Active)' : 'Mode A Software Simulation Active (Default)'}
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                  agentStatus.connected ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/10 text-emerald-400'
                }`}
              >
                {agentStatus.connected ? 'Containerlab Live Link' : 'Self-Contained Mode A'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{agentStatus.message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={refreshState}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
            title="Probe Agent Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Architecture Specification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {/* Layer 1: Containerlab */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Server className="w-4 h-4 text-blue-400" />
            <span>1. Containerlab Virtual Topology</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Containerlab provisions multi-vendor network topologies using containerized network operating systems (NOS) running in isolated network namespaces.
          </p>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
            name: aincms-lab<br />
            topology:<br />
            &nbsp;&nbsp;nodes:<br />
            &nbsp;&nbsp;&nbsp;&nbsp;r1: kind: linux, image: frr:latest<br />
            &nbsp;&nbsp;&nbsp;&nbsp;sw1: kind: linux, image: openvswitch
          </div>
        </div>

        {/* Layer 2: FRRouting (FRR) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Code className="w-4 h-4 text-emerald-400" />
            <span>2. FRRouting (FRR) Protocol Suite</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Free, open-source routing suite for Linux implementing actual BGP, OSPF, and IS-IS protocol daemons, eliminating proprietary Cisco licensing constraints.
          </p>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
            vtysh -c 'show ip ospf neighbor'<br />
            vtysh -c 'show ip route'<br />
            vtysh -c 'show interface brief'
          </div>
        </div>

        {/* Layer 3: Python Netmiko Bridge */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>3. Local Agent Reverse Bridge</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Because AI Studio runs in a secured cloud sandbox, an authenticated outbound agent initiates polling to avoid exposing the user's host workstation to public WAN ports.
          </p>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
            Port: Localhost:3000<br />
            Protocol: HTTPS / WebSocket<br />
            Auth: Bearer Token Secret
          </div>
        </div>
      </div>

      {/* Agent Setup & Download Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              Local Agent Python Script & Activation
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Run this script on a laptop or lab workstation with Docker to bridge Containerlab nodes with AINCMS.
            </p>
          </div>

          <button
            onClick={handleDownloadScript}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 transition shadow-md shadow-blue-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            Download aincms_local_agent.py
          </button>
        </div>

        {/* Test Connection Simulator for Demo */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Agent Handshake Verification (Token Simulation)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Agent Authorization Token"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              onClick={handleSimulateRegister}
              disabled={simulatingConnect}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              {simulatingConnect ? 'Handshaking...' : 'Trigger Handshake Test'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Default test key: <code className="text-purple-400">demo-agent-key-2026</code>. Emulates Containerlab reverse registration without local Docker installation.
          </p>
        </div>

        {/* Script Code Preview */}
        <div className="relative">
          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-emerald-400/90 font-mono text-[11px] overflow-x-auto leading-relaxed">
            {samplePythonAgent}
          </pre>
        </div>
      </div>
    </div>
  );
};
