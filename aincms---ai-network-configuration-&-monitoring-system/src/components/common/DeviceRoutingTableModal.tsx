import React, { useState, useEffect } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { fetchDeviceRoutes, fetchDeviceArp, fetchDeviceNat } from '../../services/api';
import { RouteEntry, ArpEntry, MacTableEntry, NatSessionEntry, NetworkDevice } from '../../types/network';
import {
  Route,
  Server,
  Network,
  Activity,
  Layers,
  Shield,
  X,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

interface DeviceRoutingTableModalProps {
  device: NetworkDevice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceRoutingTableModal: React.FC<DeviceRoutingTableModalProps> = ({
  device,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'routes' | 'arp' | 'nat' | 'interfaces'>('routes');
  const [routes, setRoutes] = useState<RouteEntry[]>([]);
  const [arpEntries, setArpEntries] = useState<ArpEntry[]>([]);
  const [macTable, setMacTable] = useState<MacTableEntry[]>([]);
  const [natSessions, setNatSessions] = useState<NatSessionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<'ALL' | 'C' | 'S' | 'O'>('ALL');

  useEffect(() => {
    if (device && isOpen) {
      loadData();
    }
  }, [device?.id, isOpen]);

  const loadData = async () => {
    if (!device) return;
    setLoading(true);
    try {
      const [rRes, aRes, nRes] = await Promise.all([
        fetchDeviceRoutes(device.id),
        fetchDeviceArp(device.id),
        fetchDeviceNat(device.id),
      ]);
      if (rRes.success) setRoutes(rRes.data);
      if (aRes.success) {
        setArpEntries(aRes.arpEntries || []);
        setMacTable(aRes.macTable || []);
      }
      if (nRes.success) setNatSessions(nRes.data || []);
    } catch (err) {
      console.error('Failed to load routing/ARP data', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !device) return null;

  const filteredRoutes = routes.filter((r) => {
    const matchSearch =
      r.destination.includes(search) ||
      r.nextHop.toLowerCase().includes(search.toLowerCase()) ||
      r.interfaceName.toLowerCase().includes(search.toLowerCase());
    const matchProto = protocolFilter === 'ALL' || r.protocol === protocolFilter;
    return matchSearch && matchProto;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-base">{device.name}</h3>
                <span className="text-[10px] bg-slate-700 font-mono text-slate-300 px-2 py-0.5 rounded uppercase">
                  {device.type}
                </span>
                <span className="text-xs font-mono text-blue-400">({device.managementIp})</span>
              </div>
              <p className="text-xs text-slate-400">
                Live Kernel Routing Table, ARP Cache & Layer 2 Forwarding State
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition"
              title="Refresh Tables"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-950 px-6 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('routes')}
            className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'routes'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Route className="w-4 h-4" />
            IPv4 Routing Table ({routes.length})
          </button>
          <button
            onClick={() => setActiveTab('arp')}
            className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'arp'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-4 h-4" />
            ARP & MAC Table ({arpEntries.length + macTable.length})
          </button>
          {(device.type === 'firewall' || natSessions.length > 0) && (
            <button
              onClick={() => setActiveTab('nat')}
              className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'nat'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              NAT / PAT Sessions ({natSessions.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('interfaces')}
            className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'interfaces'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Interfaces ({device.interfaces.length})
          </button>
        </div>

        {/* Tab 1: IPv4 Routing Table */}
        {activeTab === 'routes' && (
          <div className="p-6 flex-1 flex flex-col min-h-0 overflow-hidden space-y-4">
            {/* Search and Protocol Filter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter prefix or next-hop..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Code:</span>
                {(['ALL', 'C', 'S', 'O'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProtocolFilter(p)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition ${
                      protocolFilter === p
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {p === 'ALL' ? 'All Codes' : p === 'C' ? 'C (Connected)' : p === 'S' ? 'S (Static)' : 'O (OSPF)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto bg-slate-950 rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] border-b border-slate-800 font-sans font-semibold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Network Destination</th>
                    <th className="py-2.5 px-3">Subnet Mask</th>
                    <th className="py-2.5 px-3">Next-Hop / Gateway</th>
                    <th className="py-2.5 px-3">Interface</th>
                    <th className="py-2.5 px-3">Metric</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-sans text-xs">
                        No routes found matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRoutes.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-900 transition">
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                              r.protocol === 'C'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : r.protocol === 'S'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-purple-500/20 text-purple-400'
                            }`}
                          >
                            {r.protocol}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-200 font-bold">{r.destination}</td>
                        <td className="py-2.5 px-3 text-slate-400">{r.netmask}</td>
                        <td className="py-2.5 px-3 text-cyan-400">{r.nextHop}</td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans">{r.interfaceName}</td>
                        <td className="py-2.5 px-3 text-slate-400">{r.metric}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-4 font-mono">
              <span>Legend: [C] Connected, [S] Static, [O] OSPF Area 0, [B] BGP</span>
            </div>
          </div>
        )}

        {/* Tab 2: ARP & MAC Table */}
        {activeTab === 'arp' && (
          <div className="p-6 flex-1 flex flex-col min-h-0 overflow-y-auto space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                ARP Resolution Cache (IPv4 to Layer 2 MAC)
              </h4>
              <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] border-b border-slate-800 font-sans font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">IPv4 Address</th>
                      <th className="py-2.5 px-3">Hardware MAC Address</th>
                      <th className="py-2.5 px-3">Local Interface</th>
                      <th className="py-2.5 px-3">Entry Type</th>
                      <th className="py-2.5 px-3">Age</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {arpEntries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-500 font-sans">
                          No active ARP cache entries.
                        </td>
                      </tr>
                    ) : (
                      arpEntries.map((a, i) => (
                        <tr key={i} className="hover:bg-slate-900">
                          <td className="py-2 px-3 text-blue-400">{a.ipAddress}</td>
                          <td className="py-2 px-3 text-slate-200">{a.macAddress}</td>
                          <td className="py-2 px-3 text-slate-300 font-sans">{a.interfaceName}</td>
                          <td className="py-2 px-3 uppercase text-[10px] text-slate-400">{a.type}</td>
                          <td className="py-2 px-3 text-slate-500">{a.ageMinutes}m</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {macTable.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                  Layer 2 Switch MAC Forwarding Table
                </h4>
                <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] border-b border-slate-800 font-sans font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">VLAN ID</th>
                        <th className="py-2.5 px-3">MAC Address</th>
                        <th className="py-2.5 px-3">Egress Switchport</th>
                        <th className="py-2.5 px-3">Learning Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {macTable.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-900">
                          <td className="py-2 px-3 text-emerald-400">VLAN {m.vlanId}</td>
                          <td className="py-2 px-3 text-slate-200">{m.macAddress}</td>
                          <td className="py-2 px-3 text-slate-300 font-sans">{m.port}</td>
                          <td className="py-2 px-3 uppercase text-[10px] text-slate-400">{m.type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: NAT Sessions */}
        {activeTab === 'nat' && (
          <div className="p-6 flex-1 flex flex-col min-h-0 overflow-y-auto space-y-4">
            <div className="text-xs text-slate-400">
              Active Dynamic NAT/PAT (Port Address Translation) Overload State Engine
            </div>

            <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] border-b border-slate-800 font-sans font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Protocol</th>
                    <th className="py-2.5 px-3">Inside Local (LAN)</th>
                    <th className="py-2.5 px-3">Inside Global (WAN NAT)</th>
                    <th className="py-2.5 px-3">Outside Global (Destination)</th>
                    <th className="py-2.5 px-3">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {natSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900">
                      <td className="py-2 px-3 font-bold text-amber-400">{s.protocol}</td>
                      <td className="py-2 px-3 text-slate-300">{s.insideLocal}</td>
                      <td className="py-2 px-3 text-blue-400 font-bold">{s.insideGlobal}</td>
                      <td className="py-2 px-3 text-cyan-400">{s.outsideGlobal}</td>
                      <td className="py-2 px-3 font-sans">
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-semibold uppercase">
                          {s.state}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Interfaces */}
        {activeTab === 'interfaces' && (
          <div className="p-6 flex-1 flex flex-col min-h-0 overflow-y-auto space-y-3">
            {device.interfaces.map((intf) => (
              <div
                key={intf.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{intf.name}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        intf.operStatus === 'up'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {intf.operStatus}
                    </span>
                    {intf.mode && (
                      <span className="text-[9px] uppercase font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                        Mode: {intf.mode}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400 text-[11px] font-mono mt-1">
                    {intf.ipAddress ? `IPv4: ${intf.ipAddress} / ${intf.subnetMask}` : 'Layer 2 Unnumbered Interface'} • MAC: {intf.macAddress}
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400 font-mono">
                  <div>Speed: {intf.speedMbps} Mbps</div>
                  <div>MTU: {intf.mtu} bytes</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
