import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useNetwork } from '../../context/NetworkContext';
import { DeviceNode } from './DeviceNode';
import {
  Plus,
  Trash2,
  Activity,
  AlertTriangle,
  RotateCcw,
  Download,
  Info,
  CheckCircle2,
  Terminal,
  FileCode,
  ShieldAlert,
  Zap,
  Route,
  Layers,
  X,
  Sparkles,
} from 'lucide-react';
import {
  createLink,
  deleteLink,
  updateLink,
  createDevice,
  deleteDevice,
  loadPresetTopology,
} from '../../services/api';
import { DeviceType, NetworkDevice, NetworkLink } from '../../types/network';

const nodeTypes = {
  deviceNode: DeviceNode,
};

const DEFAULT_COORDS: Record<string, { x: number; y: number }> = {
  'dev-r1': { x: 380, y: 40 },
  'dev-fw1': { x: 680, y: 40 },
  'dev-sw1': { x: 380, y: 190 },
  'dev-sw2': { x: 380, y: 340 },
  'dev-pc1': { x: 180, y: 480 },
  'dev-srv1': { x: 580, y: 480 },
  'dev-ospf-r1': { x: 400, y: 50 },
  'dev-ospf-r2': { x: 650, y: 350 },
  'dev-ospf-r3': { x: 150, y: 350 },
};

export const TopologyCanvas: React.FC<{
  onNavigate: (tab: any) => void;
}> = ({ onNavigate }) => {
  const {
    state,
    refreshState,
    userRole,
    setSelectedDevice,
    setDiagnosticModalOpen,
    setDiagnosticTargetDevice,
    setRoutingModalOpen,
    setRoutingTargetDevice,
  } = useNetwork();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Modal State for adding a node directly on the canvas
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<DeviceType>('router');
  const [newNodeIp, setNewNodeIp] = useState('192.168.100.50');
  const [loadingAction, setLoadingAction] = useState(false);

  const canEdit = userRole === 'super_admin' || userRole === 'network_admin';

  // Convert state devices into React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    if (!state) return [];
    return state.devices.map((dev, idx) => {
      const pos = DEFAULT_COORDS[dev.id] || { x: 150 + (idx % 3) * 260, y: 100 + Math.floor(idx / 3) * 180 };
      return {
        id: dev.id,
        type: 'deviceNode',
        position: pos,
        data: {
          id: dev.id,
          name: dev.name,
          type: dev.type,
          managementIp: dev.managementIp,
          status: dev.status,
          cpuPercent: dev.cpuPercent,
          memoryPercent: dev.memoryPercent,
        },
      };
    });
  }, [state?.devices]);

  // Convert state links into React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    if (!state) return [];
    return state.links.map((link) => {
      const isDown = link.status === 'down';
      const isDegraded = link.status === 'degraded';

      let strokeColor = '#3b82f6';
      if (isDown) strokeColor = '#f43f5e';
      else if (isDegraded) strokeColor = '#f59e0b';

      return {
        id: link.id,
        source: link.sourceDeviceId,
        target: link.targetDeviceId,
        animated: link.status === 'active',
        style: {
          stroke: strokeColor,
          strokeWidth: isDown ? 3 : 2,
          strokeDasharray: isDown ? '5 5' : undefined,
        },
        label: `${link.bandwidthMbps}M • ${link.latencyMs}ms`,
        labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 500 },
        labelBgStyle: { fill: '#0f172a', fillOpacity: 0.9, stroke: '#334155', strokeWidth: 1 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 15,
          height: 15,
        },
      };
    });
  }, [state?.links]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Handle new edge connection
  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!canEdit) {
        alert('Permission Denied: Read-only viewers cannot create links.');
        return;
      }
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;

      const sourceDev = state?.devices.find((d) => d.id === connection.source);
      const targetDev = state?.devices.find((d) => d.id === connection.target);
      if (!sourceDev || !targetDev) return;

      const newLink: Partial<NetworkLink> = {
        sourceDeviceId: connection.source,
        sourceInterfaceId: sourceDev.interfaces[0]?.id || `int-${connection.source}-eth0`,
        targetDeviceId: connection.target,
        targetInterfaceId: targetDev.interfaces[0]?.id || `int-${connection.target}-eth0`,
        bandwidthMbps: 1000,
        latencyMs: 1.0,
        packetLossPercent: 0,
        status: 'active',
      };

      await createLink(newLink, userRole);
      await refreshState();
    },
    [state?.devices, canEdit, userRole, refreshState]
  );

  const selectedDevice = useMemo(() => {
    return state?.devices.find((d) => d.id === selectedNodeId) || null;
  }, [state?.devices, selectedNodeId]);

  const selectedLink = useMemo(() => {
    return state?.links.find((l) => l.id === selectedEdgeId) || null;
  }, [state?.links, selectedEdgeId]);

  const disconnectedNodes = useMemo(() => {
    if (!state) return [];
    const connectedIds = new Set<string>();
    state.links.forEach((l) => {
      connectedIds.add(l.sourceDeviceId);
      connectedIds.add(l.targetDeviceId);
    });
    return state.devices.filter((d) => !connectedIds.has(d.id));
  }, [state?.devices, state?.links]);

  const hasTopologyLoops = useMemo(() => {
    if (!state || state.links.length < 3) return false;
    return state.links.length >= state.devices.length;
  }, [state?.devices, state?.links]);

  const toggleLinkStatus = async (link: NetworkLink) => {
    if (!canEdit) return;
    const nextStatus = link.status === 'active' ? 'down' : 'active';
    await updateLink(link.id, { status: nextStatus }, userRole);
    await refreshState();
  };

  const handleDeleteSelectedNode = async () => {
    if (!selectedDevice || !canEdit) return;
    if (confirm(`Remove virtual node "${selectedDevice.name}" from the topology?`)) {
      setLoadingAction(true);
      try {
        await deleteDevice(selectedDevice.id, userRole);
        setSelectedNodeId(null);
        await refreshState();
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoadingAction(false);
      }
    }
  };

  const handleDeleteSelectedLink = async () => {
    if (!selectedLink || !canEdit) return;
    if (confirm(`Delete link between ${selectedLink.sourceDeviceId} and ${selectedLink.targetDeviceId}?`)) {
      setLoadingAction(true);
      try {
        await deleteLink(selectedLink.id, userRole);
        setSelectedEdgeId(null);
        await refreshState();
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoadingAction(false);
      }
    }
  };

  const handleCreateNodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setLoadingAction(true);
    try {
      const id = `dev-${newNodeType.substring(0, 3)}-${Date.now()}`;
      await createDevice(
        {
          id,
          name: newNodeName,
          type: newNodeType,
          managementIp: newNodeIp,
          softwareProfile: newNodeType === 'router' ? 'Simulated Cisco IOS-XR / FRR 9.1' : 'Simulated Layer 2/3 Switch',
          site: 'Headquarters',
          tags: ['canvas-added'],
          interfaces: [
            {
              id: `int-${id}-g0`,
              name: newNodeType.startsWith('switch') ? 'GigabitEthernet1/0/1' : 'GigabitEthernet0/0',
              ipAddress: newNodeIp,
              subnetMask: '255.255.255.0',
              macAddress: `00:1A:2B:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:01`,
              adminStatus: 'up',
              operStatus: 'up',
              speedMbps: 1000,
              mtu: 1500,
            },
          ],
          runningConfig: `hostname ${newNodeName}\ninterface GigabitEthernet0/0\n ip address ${newNodeIp} 255.255.255.0\n no shutdown\n!`,
          savedConfig: `hostname ${newNodeName}\n!`,
        },
        userRole
      );
      setShowAddNodeModal(false);
      await refreshState();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleLoadPreset = async (presetId: string) => {
    if (!canEdit) return;
    setLoadingAction(true);
    try {
      await loadPresetTopology(presetId, userRole);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      await refreshState();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleExportTopology = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ devices: state?.devices, links: state?.links }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aincms-topology-export-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* Center: Topology Canvas */}
      <div className="flex-1 relative flex flex-col">
        {/* Top Floating Control Bar */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-2 rounded-xl shadow-xl flex-wrap">
          {canEdit && (
            <button
              onClick={() => {
                setNewNodeName(`Router-${(state?.devices.length || 0) + 1}`);
                setNewNodeIp(`192.168.100.${(state?.devices.length || 0) + 10}`);
                setShowAddNodeModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Node
            </button>
          )}

          {/* Load Preset Scenarios */}
          {canEdit && (
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="text-[11px] text-slate-400 hidden sm:inline">Scenario:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) handleLoadPreset(e.target.value);
                }}
                defaultValue=""
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none"
              >
                <option value="" disabled>Load Preset Lab...</option>
                <option value="campus">Campus Network (Default)</option>
                <option value="ospf-triangle">3-Router OSPF Ring Lab</option>
              </select>
            </div>
          )}

          <button
            onClick={handleExportTopology}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {disconnectedNodes.length > 0 && (
            <span className="text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-1 rounded-md flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3 h-3" />
              {disconnectedNodes.length} Isolated Node(s)
            </span>
          )}

          {hasTopologyLoops ? (
            <span className="text-[11px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded-md flex items-center gap-1 font-medium">
              <Zap className="w-3 h-3 text-purple-400" />
              STP Loop Guard Active
            </span>
          ) : (
            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-md flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              Loop-Free Graph
            </span>
          )}
        </div>

        {/* React Flow Editor */}
        <div className="flex-1 w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => {
              setSelectedNodeId(node.id);
              setSelectedEdgeId(null);
            }}
            onEdgeClick={(_, edge) => {
              setSelectedEdgeId(edge.id);
              setSelectedNodeId(null);
            }}
            fitView
            className="bg-slate-950"
          >
            <Background color="#1e293b" gap={20} size={1} />
            <Controls className="!bg-slate-900 !border-slate-800 !fill-slate-200" />
            <MiniMap
              className="!bg-slate-900 !border-slate-800"
              nodeColor={(n) => (n.data?.status === 'online' ? '#10b981' : '#f43f5e')}
            />
          </ReactFlow>
        </div>
      </div>

      {/* Right: Inspector Sidebar Panel */}
      <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Topology Inspector
          </h3>
          <span className="text-[11px] text-slate-400">
            {selectedDevice ? 'Node Selected' : selectedLink ? 'Link Selected' : 'Click Item to Inspect'}
          </span>
        </div>

        {/* Inspect Device */}
        {selectedDevice && (
          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{selectedDevice.name}</h4>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
                    selectedDevice.status === 'online'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {selectedDevice.status}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">{selectedDevice.managementIp}</p>
              <p className="text-xs text-slate-400">{selectedDevice.softwareProfile}</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setDiagnosticTargetDevice(selectedDevice);
                  setDiagnosticModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Terminal className="w-3.5 h-3.5" />
                Ping / Trace
              </button>

              <button
                onClick={() => {
                  setRoutingTargetDevice(selectedDevice);
                  setRoutingModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Route className="w-3.5 h-3.5" />
                Routing & ARP
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setSelectedDevice(selectedDevice);
                  onNavigate('config');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition border border-slate-700"
              >
                <FileCode className="w-3.5 h-3.5" />
                Edit Config
              </button>

              {canEdit && (
                <button
                  onClick={handleDeleteSelectedNode}
                  disabled={loadingAction}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Node
                </button>
              )}
            </div>

            {/* Telemetry Status */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>CPU Load:</span>
                <span className="font-mono text-slate-200">{selectedDevice.cpuPercent}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Memory Allocation:</span>
                <span className="font-mono text-slate-200">{selectedDevice.memoryPercent}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Uptime:</span>
                <span className="font-mono text-slate-200">
                  {Math.floor(selectedDevice.uptimeSeconds / 3600)}h{' '}
                  {Math.floor((selectedDevice.uptimeSeconds % 3600) / 60)}m
                </span>
              </div>
            </div>

            {/* Interfaces List */}
            <div>
              <h5 className="text-xs font-semibold text-slate-300 mb-2">
                Interfaces ({selectedDevice.interfaces.length})
              </h5>
              <div className="space-y-1.5">
                {selectedDevice.interfaces.map((intf) => (
                  <div
                    key={intf.id}
                    className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/60 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-slate-200">{intf.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {intf.ipAddress ? `${intf.ipAddress}` : intf.mode ? `Mode: ${intf.mode}` : 'Layer 2'}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                        intf.operStatus === 'up'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {intf.operStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Inspect Link */}
        {selectedLink && (
          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Virtual Link</h4>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
                    selectedLink.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : selectedLink.status === 'degraded'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {selectedLink.status}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">
                {selectedLink.sourceDeviceId} ⟷ {selectedLink.targetDeviceId}
              </p>
            </div>

            {/* Link Telemetry */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Bandwidth:</span>
                <span className="font-mono text-slate-200">{selectedLink.bandwidthMbps} Mbps</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Simulated Latency:</span>
                <span className="font-mono text-slate-200">{selectedLink.latencyMs} ms</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Packet Loss:</span>
                <span className="font-mono text-slate-200">{selectedLink.packetLossPercent}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Current Flow:</span>
                <span className="font-mono text-cyan-400">
                  {(selectedLink.trafficFlowBps / 1000000).toFixed(2)} Mbps
                </span>
              </div>
            </div>

            {/* Actions for Link */}
            {canEdit && (
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => toggleLinkStatus(selectedLink)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    selectedLink.status === 'active'
                      ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                  }`}
                >
                  {selectedLink.status === 'active' ? (
                    <>
                      <ShieldAlert className="w-4 h-4" />
                      Simulate Link Cut (Shutdown)
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4" />
                      Restore Link Connectivity
                    </>
                  )}
                </button>

                <button
                  onClick={handleDeleteSelectedLink}
                  disabled={loadingAction}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition border border-slate-700"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  Sever / Delete Link
                </button>
              </div>
            )}
          </div>
        )}

        {!selectedDevice && !selectedLink && (
          <div className="p-6 text-center text-slate-500 text-xs space-y-3">
            <Info className="w-8 h-8 mx-auto text-slate-600" />
            <p>
              Click any router, switch, or link on the canvas to inspect real-time interface telemetry, view kernel
              routing tables, or simulate link cuts.
            </p>
            <p className="text-[11px] text-slate-600">
              Drag from any node connector handle to connect virtual links.
            </p>
          </div>
        )}
      </div>

      {/* In-Place Add Node Modal */}
      {showAddNodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Add Node to Topology</h3>
              <button
                onClick={() => setShowAddNodeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNodeSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Device Name</label>
                <input
                  type="text"
                  required
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Device Type</label>
                <select
                  value={newNodeType}
                  onChange={(e) => setNewNodeType(e.target.value as DeviceType)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="router">Router (OSPF / Static)</option>
                  <option value="switch_l3">Layer 3 Switch (SVI)</option>
                  <option value="switch_l2">Layer 2 Switch (VLAN)</option>
                  <option value="firewall">Firewall Gateway (NAT)</option>
                  <option value="server">Linux Server</option>
                  <option value="host">Client Host</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Management IPv4</label>
                <input
                  type="text"
                  required
                  value={newNodeIp}
                  onChange={(e) => setNewNodeIp(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddNodeModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition shadow-md disabled:opacity-50"
                >
                  {loadingAction ? 'Adding...' : 'Add to Canvas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
