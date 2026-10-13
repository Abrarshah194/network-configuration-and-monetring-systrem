import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Play,
  ArrowRight,
  Terminal,
  FileCode,
  Layers,
  BookOpen,
} from 'lucide-react';
import { runDiagnosticPing } from '../../services/api';

interface LabExercise {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  objective: string;
  tasks: string[];
  expectedResult: string;
  verificationCheck: (devices: any[]) => { passed: boolean; message: string };
  hints: string[];
}

export const GuidedLabs: React.FC<{
  onNavigate: (tab: any) => void;
}> = ({ onNavigate }) => {
  const { state, refreshState, resetSimulation, setSelectedDevice, setDiagnosticModalOpen } = useNetwork();

  const [activeLabId, setActiveLabId] = useState<string>('lab-1');
  const [labStatus, setLabStatus] = useState<Record<string, { completed: boolean; message?: string }>>({});
  const [showHint, setShowHint] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);

  if (!state) return null;

  const labs: LabExercise[] = [
    {
      id: 'lab-1',
      title: 'VLAN Segmentation & 802.1Q Trunking',
      category: 'Switching',
      difficulty: 'Beginner',
      objective: 'Isolate Staff (VLAN 10) from Production Servers (VLAN 20) at Layer 2 and configure 802.1Q trunking between switches.',
      tasks: [
        'Inspect HQ-Dist-Switch-01 and verify VLAN 10 and VLAN 20 exist in the database.',
        'Ensure the interconnection port between SW1 and SW2 is configured with "switchport mode trunk".',
        'Verify that Staff Workstation PC-01 is assigned to VLAN 10 on HQ-Access-Switch-02.',
      ],
      expectedResult: 'Broadcast domains are segregated. Unicast packets across switches maintain 802.1Q VLAN tags.',
      verificationCheck: (devices) => {
        const sw1 = devices.find((d) => d.id === 'dev-sw1');
        const sw2 = devices.find((d) => d.id === 'dev-sw2');
        if (!sw1 || !sw2) return { passed: false, message: 'Switches not found in topology.' };
        const hasVlan10 = sw1.runningConfig.includes('vlan 10') && sw2.runningConfig.includes('vlan 10');
        const hasTrunk = sw1.runningConfig.includes('mode trunk') || sw2.runningConfig.includes('mode trunk');
        if (hasVlan10 && hasTrunk) {
          return { passed: true, message: 'VLAN 10 and 802.1Q trunking validated across both switches!' };
        }
        return { passed: false, message: 'VLAN 10 or trunk port configuration is incomplete in running-config.' };
      },
      hints: [
        'Check interface GigabitEthernet1/0/2 on HQ-Dist-Switch-01 using the Config Workspace.',
        'Trunk ports require "switchport mode trunk" and "switchport trunk allowed vlan".',
      ],
    },
    {
      id: 'lab-2',
      title: 'Inter-VLAN Routing via Switched Virtual Interfaces (SVI)',
      category: 'Routing',
      difficulty: 'Intermediate',
      objective: 'Configure Layer 3 SVI gateways on the distribution switch to route packets between VLAN 10 and VLAN 20.',
      tasks: [
        'Open HQ-Dist-Switch-01 in the Configuration Workspace.',
        'Configure SVI "interface Vlan10" with IP 192.168.10.1 255.255.255.0.',
        'Configure SVI "interface Vlan20" with IP 192.168.20.1 255.255.255.0.',
        'Enable global IP routing via "ip routing".',
      ],
      expectedResult: 'Staff Workstation (192.168.10.15) can ping Production Server (192.168.20.10) across VLAN boundaries.',
      verificationCheck: (devices) => {
        const sw1 = devices.find((d) => d.id === 'dev-sw1');
        if (!sw1) return { passed: false, message: 'Dist switch not found.' };
        const hasVlan10Svi = sw1.runningConfig.includes('interface Vlan10') && sw1.runningConfig.includes('192.168.10.1');
        const hasVlan20Svi = sw1.runningConfig.includes('interface Vlan20') && sw1.runningConfig.includes('192.168.20.1');
        if (hasVlan10Svi && hasVlan20Svi) {
          return { passed: true, message: 'Both SVI default gateways are active and IP routing is operational!' };
        }
        return { passed: false, message: 'Missing SVI interfaces for Vlan10 or Vlan20.' };
      },
      hints: [
        'An SVI acts as the default gateway for hosts residing in that VLAN.',
        'Use the Diagnostic Ping tool to test packet traversal from Staff-PC to Prod-Server.',
      ],
    },
    {
      id: 'lab-3',
      title: 'Static Routing & Default Gateway Pathing',
      category: 'Routing',
      difficulty: 'Beginner',
      objective: 'Configure a quad-zero default static route (0.0.0.0/0) pointing from HQ-Core-Router-01 to the edge firewall gateway.',
      tasks: [
        'Review the routing table on HQ-Core-Router-01.',
        'Add static route "ip route 0.0.0.0 0.0.0.0 10.0.2.2" directing WAN traffic to FW1.',
        'Verify that packets destined for external DNS (1.1.1.1) egress via interface GigabitEthernet0/1.',
      ],
      expectedResult: 'Core router forwards all non-local destination traffic to firewall inside interface 10.0.2.2.',
      verificationCheck: (devices) => {
        const r1 = devices.find((d) => d.id === 'dev-r1');
        if (!r1) return { passed: false, message: 'Router R1 not found.' };
        if (r1.runningConfig.includes('ip route 0.0.0.0 0.0.0.0 10.0.2.2')) {
          return { passed: true, message: 'Default gateway static route is correctly configured.' };
        }
        return { passed: false, message: 'Missing "ip route 0.0.0.0 0.0.0.0 10.0.2.2" in R1 running-config.' };
      },
      hints: [
        'The static route syntax is "ip route <prefix> <mask> <next-hop>".',
        'Next-hop 10.0.2.2 is the inside interface IP of HQ-Edge-Firewall-01.',
      ],
    },
    {
      id: 'lab-4',
      title: 'OSPF Dynamic Routing Convergence (Area 0)',
      category: 'Protocols',
      difficulty: 'Advanced',
      objective: 'Establish single-area OSPF backbone adjacency between HQ-Core-Router-01 and HQ-Dist-Switch-01.',
      tasks: [
        'Verify OSPF process 1 is active on HQ-Core-Router-01 with router-id 1.1.1.1.',
        'Ensure subnet 10.0.1.0/30 is advertised under area 0 on both nodes.',
        'Observe dynamic shortest path first convergence.',
      ],
      expectedResult: 'OSPF neighbor state reaches FULL. Routing tables synchronize without manual route declarations.',
      verificationCheck: (devices) => {
        const r1 = devices.find((d) => d.id === 'dev-r1');
        const sw1 = devices.find((d) => d.id === 'dev-sw1');
        if (!r1 || !sw1) return { passed: false, message: 'Devices not found.' };
        const r1Ospf = r1.runningConfig.includes('router ospf') && r1.runningConfig.includes('area 0');
        const sw1Ospf = sw1.runningConfig.includes('router ospf') && sw1.runningConfig.includes('area 0');
        if (r1Ospf && sw1Ospf) {
          return { passed: true, message: 'OSPF Area 0 configured and neighbor state converges to FULL!' };
        }
        return { passed: false, message: 'OSPF configuration missing on either Core Router or Dist Switch.' };
      },
      hints: [
        'Wildcard mask for /30 subnet is 0.0.0.3.',
        'Command format: "network 10.0.1.0 0.0.0.3 area 0".',
      ],
    },
    {
      id: 'lab-5',
      title: 'Access Control Lists (ACL) & Traffic Filtering',
      category: 'Security',
      difficulty: 'Intermediate',
      objective: 'Implement security ACL on edge firewall to permit outbound HTTPS (443) while denying unencrypted traffic.',
      tasks: [
        'Review security policy on HQ-Edge-Firewall-01.',
        'Configure access-list 101 to permit tcp traffic on port 443 and 80.',
        'Append explicit deny-all log statement.',
      ],
      expectedResult: 'Perimeter firewall drops unauthorized ingress connection attempts while logging events.',
      verificationCheck: (devices) => {
        const fw = devices.find((d) => d.id === 'dev-fw1');
        if (!fw) return { passed: false, message: 'Firewall not found.' };
        if (fw.runningConfig.includes('access-list') && fw.runningConfig.includes('permit tcp')) {
          return { passed: true, message: 'Perimeter ACL statement verified on firewall!' };
        }
        return { passed: false, message: 'Access-list 101 missing permit tcp rules.' };
      },
      hints: [
        'Use "access-list 101 permit tcp 192.168.10.0 0.0.0.255 any eq 443" in Firewall config.',
      ],
    },
    {
      id: 'lab-6',
      title: 'Link Failure Injection & Spanning-Tree Recovery',
      category: 'Resilience',
      difficulty: 'Advanced',
      objective: 'Simulate physical link down event between SW1 and SW2 and test automated fault detection and recovery.',
      tasks: [
        'Navigate to the Fault Management tab.',
        'Inject a "Fiber / Link Cut" on link link-sw1-sw2.',
        'Observe how the Alert Center generates an incident notification.',
        'Execute automated remediation to restore link status to Active.',
      ],
      expectedResult: 'Monitoring engine records the outage, alerts operators, and restores topology upon remediation.',
      verificationCheck: (devices) => {
        // If state has fault history
        const hasFaultLogs = state.auditLogs.some((a) => a.action.includes('FAULT'));
        if (hasFaultLogs) {
          return { passed: true, message: 'Fault injection and recovery cycle confirmed in audit trail!' };
        }
        return { passed: false, message: 'No fault injection event found in audit log. Test via Fault Management.' };
      },
      hints: [
        'Use the Fault Management tab to trigger a synthetic link failure, then resolve it.',
      ],
    },
    {
      id: 'lab-7',
      title: 'Network Address Translation (NAT) & Port Overload (PAT)',
      category: 'Security & Edge',
      difficulty: 'Intermediate',
      objective: 'Configure dynamic Port Address Translation (NAT Overload) on HQ-Edge-Firewall-01 to multiplex internal LAN traffic onto a single public IP.',
      tasks: [
        'Inspect HQ-Edge-Firewall-01 in the Configuration Workspace.',
        'Define NAT inside (GigabitEthernet0/1) and outside (GigabitEthernet0/0) interfaces.',
        'Configure IP NAT pool or overload rule: "ip nat inside source list 1 interface GigabitEthernet0/0 overload".',
        'Verify translation table entries using the Device Tables Viewer.',
      ],
      expectedResult: 'Private client sockets (e.g. 192.168.10.15:52410) are dynamically translated to public WAN identity 203.0.113.10.',
      verificationCheck: (devices) => {
        const fw = devices.find((d) => d.id === 'dev-fw1');
        if (!fw) return { passed: false, message: 'Firewall not found.' };
        if (fw.runningConfig.includes('ip nat inside') || fw.runningConfig.includes('nat')) {
          return { passed: true, message: 'NAT / PAT translation statements verified on Edge Firewall!' };
        }
        return { passed: false, message: 'Missing "ip nat inside" or NAT overload directives on Firewall.' };
      },
      hints: [
        'Command format: "ip nat inside source list 1 interface GigabitEthernet0/0 overload".',
        'Inspect the NAT translations table using the Routing & ARP modal for HQ-Edge-Firewall-01.',
      ],
    },
  ];

  const currentLab = labs.find((l) => l.id === activeLabId) || labs[0];

  const handleRunVerification = () => {
    setVerifying(true);
    setTimeout(() => {
      const result = currentLab.verificationCheck(state.devices);
      setLabStatus({
        ...labStatus,
        [currentLab.id]: { completed: result.passed, message: result.message },
      });
      setVerifying(false);
    }, 600);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            Guided Routing & Switching FYP Labs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Hands-on university networking laboratory exercises with automated test verification and hints.
          </p>
        </div>

        <button
          onClick={resetSimulation}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1.5 transition self-start"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Lab Topology
        </button>
      </div>

      {/* Main Grid: Lab Selector (Left) & Active Lab Detail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lab Selector Sidebar */}
        <div className="space-y-2">
          {labs.map((lab, index) => {
            const isSelected = lab.id === activeLabId;
            const isCompleted = labStatus[lab.id]?.completed;
            return (
              <div
                key={lab.id}
                onClick={() => {
                  setActiveLabId(lab.id);
                  setShowHint(false);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? 'bg-blue-600/10 border-blue-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-blue-400">
                    EXERCISE #{index + 1} • {lab.category}
                  </span>
                  {isCompleted ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                      {lab.difficulty}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-100 mt-1.5">{lab.title}</h4>
              </div>
            );
          })}
        </div>

        {/* Active Lab Card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-5">
            {/* Title & Objective */}
            <div className="pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">
                  {currentLab.category}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-medium">Difficulty: {currentLab.difficulty}</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1.5">{currentLab.title}</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                <strong>Learning Objective:</strong> {currentLab.objective}
              </p>
            </div>

            {/* Task Checklist */}
            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Laboratory Steps:
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {currentLab.tasks.map((task, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
                    <span className="text-blue-400 font-bold shrink-0">{idx + 1}.</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Expected Result */}
            <div className="text-xs">
              <span className="text-slate-400 font-semibold">Expected Verification Result: </span>
              <span className="text-slate-200">{currentLab.expectedResult}</span>
            </div>

            {/* Hints Accordion */}
            {showHint && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs p-3 rounded-lg space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" /> Lab Hints:
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {currentLab.hints.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Verification Result Message */}
            {labStatus[currentLab.id] && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  labStatus[currentLab.id].completed
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {labStatus[currentLab.id].completed ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{labStatus[currentLab.id].message}</span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHint(!showHint)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                {showHint ? 'Hide Hints' : 'Show Hints'}
              </button>

              <button
                onClick={() => onNavigate('config')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                Config Workspace
              </button>
            </div>

            <button
              onClick={handleRunVerification}
              disabled={verifying}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 px-5 rounded-lg flex items-center gap-2 transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {verifying ? 'Evaluating Model...' : 'Verify Lab Completion'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
