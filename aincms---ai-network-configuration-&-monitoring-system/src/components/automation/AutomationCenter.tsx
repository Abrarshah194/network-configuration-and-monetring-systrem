import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import {
  Wrench,
  Play,
  Eye,
  CheckCircle2,
  AlertTriangle,
  History,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { runAutomation } from '../../services/api';
import { AutomationJob } from '../../types/network';

export const AutomationCenter: React.FC = () => {
  const { state, refreshState, userRole } = useNetwork();

  const [workflowType, setWorkflowType] = useState<string>('vlan_port_assign');
  const [selectedDevices, setSelectedDevices] = useState<string[]>(['dev-sw1', 'dev-sw2']);

  // Workflow Form Parameters
  const [vlanId, setVlanId] = useState<number>(30);
  const [vlanName, setVlanName] = useState<string>('Engineering_Lab');
  const [interfaceName, setInterfaceName] = useState<string>('GigabitEthernet1/0/3');
  const [destNetwork, setDestNetwork] = useState<string>('172.16.0.0 255.255.0.0');
  const [nextHop, setNextHop] = useState<string>('10.0.1.2');
  const [adminStatus, setAdminStatus] = useState<'up' | 'down'>('up');

  // Multi-step Execution State
  const [step, setStep] = useState<'config' | 'preview' | 'running' | 'completed'>('config');
  const [dryRunPlan, setDryRunPlan] = useState<string[]>([]);
  const [lastExecutedJob, setLastExecutedJob] = useState<AutomationJob | null>(null);

  if (!state) return null;

  const canExecute = userRole === 'super_admin' || userRole === 'network_admin';

  const generatePlan = () => {
    if (workflowType === 'vlan_port_assign') {
      return [
        `[Phase 1: Pre-Validation] Verify VLAN ${vlanId} is within valid 802.1Q IEEE range (1-4094)`,
        `[Phase 2: Database Check] Ensure subnet mask boundaries do not conflict with existing SVIs`,
        `[Phase 3: Change Formulation] Generate switchport access vlan ${vlanId} for port ${interfaceName}`,
        `[Phase 4: Spanning-Tree Guard] Enable STP PortFast and BPDU Guard on target access interfaces`,
        `[Phase 5: Target Execution] Push candidate delta to ${selectedDevices.join(', ')}`,
        `[Phase 6: Post-Verification] Query ARP table and MAC address forwarding database`,
      ];
    } else if (workflowType === 'add_static_route') {
      return [
        `[Phase 1: CIDR Validation] Check destination network syntax: ${destNetwork}`,
        `[Phase 2: Next-Hop Verification] Simulate recursive route lookup for next-hop ${nextHop}`,
        `[Phase 3: Adjacency Test] Verify Layer 3 ARP reachability across OSPF backbone`,
        `[Phase 4: Route Injection] Apply 'ip route ${destNetwork} ${nextHop}' to routing table`,
        `[Phase 5: Post-Verification] Verify metric cost and loop freedom via Dijkstra algorithm`,
      ];
    } else if (workflowType === 'interface_toggle') {
      return [
        `[Phase 1: Topology Query] Locate physical link attached to ${interfaceName}`,
        `[Phase 2: Operational Flip] Submit administrative status: ${adminStatus.toUpperCase()}`,
        `[Phase 3: Failure Simulation] Trigger Spanning-Tree topology recalculation and link metric update`,
        `[Phase 4: Alert Dispatch] Broadcast interface state change event to Alert Center`,
      ];
    } else {
      return [
        `[Phase 1: Audit Scan] Compare active running-config against golden baseline in NVRAM`,
        `[Phase 2: Drift Calculation] Generate diff delta of unauthorized manual CLI modifications`,
        `[Phase 3: Auto-Remediation] Overwrite drift delta with approved baseline template`,
      ];
    }
  };

  const handleStartDryRun = () => {
    const plan = generatePlan();
    setDryRunPlan(plan);
    setStep('preview');
  };

  const handleExecute = async () => {
    if (!canExecute) return;
    setStep('running');
    try {
      const params = {
        vlanId,
        vlanName,
        interfaceName,
        destinationNetwork: destNetwork,
        nextHop,
        adminStatus,
        jobName: `${workflowType.replace('_', ' ').toUpperCase()} on ${selectedDevices.length} node(s)`,
      };
      const res = await runAutomation(workflowType, params, selectedDevices);
      if (res.success) {
        setLastExecutedJob(res.job);
        setStep('completed');
        await refreshState();
      }
    } catch (err: any) {
      alert(`Automation execution error: ${err.message}`);
      setStep('config');
    }
  };

  const toggleDeviceSelection = (id: string) => {
    if (selectedDevices.includes(id)) {
      setSelectedDevices(selectedDevices.filter((d) => d !== id));
    } else {
      setSelectedDevices([...selectedDevices, id]);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wrench className="w-5 h-5 text-blue-400" />
          Automated Network Configuration Center
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Declarative rule-based network automation workflows with dry-run previews, approval controls, and verification.
        </p>
      </div>

      {/* Main Automation Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        {step === 'config' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Select Workflow */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  1. Select Workflow Template
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'vlan_port_assign',
                      title: 'VLAN Provisioning & Access Port Assignment',
                      desc: 'Create an 802.1Q VLAN and assign an access port with STP protection',
                    },
                    {
                      id: 'add_static_route',
                      title: 'Inject Static Route & Verify Next-Hop',
                      desc: 'Add an IPv4 prefix with recursive next-hop adjacency validation',
                    },
                    {
                      id: 'interface_toggle',
                      title: 'Toggle Administrative Port State (Up/Down)',
                      desc: 'Bring a simulated interface up or down and test Spanning-Tree failover',
                    },
                    {
                      id: 'drift_remediate',
                      title: 'Configuration Drift Audit & Auto-Remediation',
                      desc: 'Compare running-config against baseline and revert unauthorized deviations',
                    },
                  ].map((wf) => (
                    <div
                      key={wf.id}
                      onClick={() => setWorkflowType(wf.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        workflowType === wf.id
                          ? 'bg-blue-600/10 border-blue-500 text-white'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-semibold text-xs flex items-center justify-between">
                        <span>{wf.title}</span>
                        {workflowType === wf.id && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{wf.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Devices Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  2. Select Target Devices
                </label>
                <div className="space-y-1.5 max-h-60 overflow-y-auto bg-slate-950 p-2 rounded-lg border border-slate-800">
                  {state.devices.map((d) => {
                    const isSelected = selectedDevices.includes(d.id);
                    return (
                      <div
                        key={d.id}
                        onClick={() => toggleDeviceSelection(d.id)}
                        className={`p-2 rounded-md flex items-center justify-between cursor-pointer text-xs transition ${
                          isSelected ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-700 bg-slate-800 text-blue-600"
                          />
                          <span className="font-medium text-slate-200">{d.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">{d.managementIp}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Workflow Specific Inputs */}
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    3. Workflow Parameters
                  </label>

                  {workflowType === 'vlan_port_assign' && (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400">VLAN ID (1-4094):</span>
                        <input
                          type="number"
                          value={vlanId}
                          onChange={(e) => setVlanId(Number(e.target.value))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400">Target Interface:</span>
                        <input
                          type="text"
                          value={interfaceName}
                          onChange={(e) => setInterfaceName(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {workflowType === 'add_static_route' && (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400">Destination Prefix:</span>
                        <input
                          type="text"
                          value={destNetwork}
                          onChange={(e) => setDestNetwork(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400">Next-Hop IP:</span>
                        <input
                          type="text"
                          value={nextHop}
                          onChange={(e) => setNextHop(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {workflowType === 'interface_toggle' && (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400">Target Interface:</span>
                        <input
                          type="text"
                          value={interfaceName}
                          onChange={(e) => setInterfaceName(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400">Action:</span>
                        <select
                          value={adminStatus}
                          onChange={(e) => setAdminStatus(e.target.value as 'up' | 'down')}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 mt-1"
                        >
                          <option value="up">No Shutdown (UP)</option>
                          <option value="down">Shutdown (DOWN)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleStartDryRun}
                disabled={selectedDevices.length === 0}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-5 rounded-lg flex items-center gap-2 transition shadow-md shadow-blue-600/20 disabled:opacity-40"
              >
                <Eye className="w-4 h-4" />
                Generate Dry-Run Plan
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Dry Run Preview & Plan */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Dry-Run Execution Plan Preview
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review calculated atomic operations before applying them to simulated devices.
                </p>
              </div>
              <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                Target Nodes: {selectedDevices.length}
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
              {dryRunPlan.map((stepText, idx) => (
                <div key={idx} className="flex items-start gap-2 text-emerald-400/90 leading-relaxed">
                  <span className="text-slate-600 select-none">[{idx + 1}]</span>
                  <span>{stepText}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={() => setStep('config')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition"
              >
                Back to Parameters
              </button>

              <button
                onClick={handleExecute}
                disabled={!canExecute}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 px-6 rounded-lg flex items-center gap-2 transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                Confirm & Execute Automation
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Completed */}
        {step === 'completed' && lastExecutedJob && (
          <div className="space-y-4 text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Automation Executed Successfully</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Workflow "{lastExecutedJob.name}" completed across {lastExecutedJob.targetDeviceIds.length} target node(s). Audit record logged.
            </p>

            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={() => setStep('config')}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
              >
                Run Another Workflow
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Workflow History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-slate-400" />
          Automation Job Execution Audit History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Job Name</th>
                <th className="py-2.5 px-4">Workflow</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Target Nodes</th>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Author</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {state.automationJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-semibold text-slate-200">{job.name}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-400">{job.workflowType}</td>
                  <td className="py-2.5 px-4">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
                      {job.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">{job.targetDeviceIds.join(', ')}</td>
                  <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">{job.author}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
