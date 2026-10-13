import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import {
  Server,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Copy,
  Trash2,
  Edit2,
  Terminal,
  FileCode,
  Shield,
  Activity,
  Layers,
  CheckCircle2,
  X,
  Route,
} from 'lucide-react';
import { createDevice, updateDevice, deleteDevice } from '../../services/api';
import { DeviceType, NetworkDevice, DeviceInterface } from '../../types/network';

export const DeviceInventory: React.FC<{
  onNavigate: (tab: any) => void;
}> = ({ onNavigate }) => {
  const {
    state,
    refreshState,
    userRole,
    setSelectedDevice,
    setDiagnosticTargetDevice,
    setDiagnosticModalOpen,
    setRoutingTargetDevice,
    setRoutingModalOpen,
  } = useNetwork();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState<DeviceType>('router');
  const [managementIp, setManagementIp] = useState('');
  const [softwareProfile, setSoftwareProfile] = useState('Simulated Cisco IOS-XR / FRR 9.1');
  const [site, setSite] = useState('Headquarters');
  const [tagsStr, setTagsStr] = useState('core, gateway');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canEdit = userRole === 'super_admin' || userRole === 'network_admin';

  if (!state) return null;

  // Filter devices
  const filteredDevices = state.devices.filter((dev) => {
    const matchesSearch =
      dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.managementIp.includes(searchQuery) ||
      dev.softwareProfile.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || dev.type === filterType;
    const matchesStatus = filterStatus === 'all' || dev.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setName(`Node-Router-${state.devices.length + 1}`);
    setType('router');
    setManagementIp(`192.168.100.${state.devices.length + 10}`);
    setSoftwareProfile('Simulated Cisco IOS-XR / FRR 9.1');
    setSite('Headquarters');
    setTagsStr('backbone, simulated');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (dev: NetworkDevice) => {
    setIsEditing(true);
    setEditingId(dev.id);
    setName(dev.name);
    setType(dev.type);
    setManagementIp(dev.managementIp);
    setSoftwareProfile(dev.softwareProfile);
    setSite(dev.site);
    setTagsStr(dev.tags.join(', '));
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleDuplicate = async (dev: NetworkDevice) => {
    if (!canEdit) return;
    const newId = `dev-${Date.now()}`;
    const newIpParts = dev.managementIp.split('.');
    newIpParts[3] = `${parseInt(newIpParts[3] || '1', 10) + 1}`;
    const duplicated: Partial<NetworkDevice> = {
      id: newId,
      name: `${dev.name}-Copy`,
      type: dev.type,
      managementIp: newIpParts.join('.'),
      softwareProfile: dev.softwareProfile,
      site: dev.site,
      tags: [...dev.tags, 'clone'],
      interfaces: dev.interfaces.map((i, idx) => ({
        ...i,
        id: `int-${newId}-${idx}`,
      })),
      runningConfig: dev.runningConfig.replace(dev.name, `${dev.name}-Copy`),
      savedConfig: dev.savedConfig.replace(dev.name, `${dev.name}-Copy`),
    };
    await createDevice(duplicated);
    await refreshState();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!canEdit) return;
    if (confirm(`Are you sure you want to remove virtual node ${name}? Connected links will be severed.`)) {
      await deleteDevice(id);
      await refreshState();
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(managementIp)) {
      setErrorMsg('Invalid IPv4 address format.');
      return;
    }

    const tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean);

    try {
      if (isEditing && editingId) {
        const res = await updateDevice(editingId, {
          name,
          type,
          managementIp,
          softwareProfile,
          site,
          tags,
        });
        if (!res.success) throw new Error(res.error || 'Update failed');
      } else {
        const id = `dev-${type.substring(0, 3)}-${Date.now()}`;
        const defaultInterfaces: DeviceInterface[] = [
          {
            id: `int-${id}-g0`,
            name: type.startsWith('switch') ? 'GigabitEthernet1/0/1' : 'GigabitEthernet0/0',
            ipAddress: managementIp,
            subnetMask: '255.255.255.0',
            macAddress: `00:1A:2B:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:01`,
            adminStatus: 'up',
            operStatus: 'up',
            speedMbps: 1000,
            mtu: 1500,
          },
        ];

        const res = await createDevice({
          id,
          name,
          type,
          managementIp,
          softwareProfile,
          site,
          tags,
          interfaces: defaultInterfaces,
          runningConfig: `! ${name} Configuration\nhostname ${name}\ninterface GigabitEthernet0/0\n ip address ${managementIp} 255.255.255.0\n no shutdown\n!`,
          savedConfig: `! ${name} Configuration\nhostname ${name}\n!`,
        });
        if (!res.success) throw new Error(res.error || 'Create failed');
      }
      setModalOpen(false);
      await refreshState();
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Name', 'Type', 'Management IP', 'Software Profile', 'Status', 'CPU %', 'Memory %', 'Site', 'Tags'];
    const rows = state.devices.map((d) => [
      d.id,
      d.name,
      d.type,
      d.managementIp,
      `"${d.softwareProfile}"`,
      d.status,
      d.cpuPercent,
      d.memoryPercent,
      d.site,
      `"${d.tags.join(';')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aincms-inventory-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            Virtual Device Inventory
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage software-simulated routers, layer 2/3 switches, firewalls, and endpoints.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              Add Virtual Device
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, IP, or software..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">All Device Types</option>
              <option value="router">Routers</option>
              <option value="switch_l3">Layer 3 Switches</option>
              <option value="switch_l2">Layer 2 Switches</option>
              <option value="firewall">Firewalls</option>
              <option value="server">Servers</option>
              <option value="host">Client Hosts</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="online">Online</option>
              <option value="degraded">Degraded</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Device Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Management IP</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">CPU / RAM</th>
                <th className="py-3 px-4">Interfaces</th>
                <th className="py-3 px-4">Site / Tags</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredDevices.map((dev) => (
                <tr key={dev.id} className="hover:bg-slate-800/40 transition">
                  {/* Name */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">{dev.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]">
                      {dev.softwareProfile}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3 px-4">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] uppercase font-semibold">
                      {dev.type.replace('_', ' ')}
                    </span>
                  </td>

                  {/* IP */}
                  <td className="py-3 px-4 font-mono text-blue-400">
                    {dev.managementIp}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        dev.status === 'online'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : dev.status === 'degraded'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          dev.status === 'online'
                            ? 'bg-emerald-400'
                            : dev.status === 'degraded'
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                        }`}
                      />
                      {dev.status}
                    </span>
                  </td>

                  {/* CPU / RAM */}
                  <td className="py-3 px-4 font-mono text-slate-300">
                    <div>CPU: {dev.cpuPercent}%</div>
                    <div className="text-[10px] text-slate-500">RAM: {dev.memoryPercent}%</div>
                  </td>

                  {/* Interfaces */}
                  <td className="py-3 px-4">
                    <span className="text-slate-300 font-medium">
                      {dev.interfaces.length} port{dev.interfaces.length !== 1 ? 's' : ''}
                    </span>
                    <div className="text-[10px] text-slate-500">
                      {dev.interfaces.filter((i) => i.operStatus === 'up').length} active
                    </div>
                  </td>

                  {/* Site & Tags */}
                  <td className="py-3 px-4">
                    <div className="text-slate-300">{dev.site}</div>
                    <div className="flex gap-1 flex-wrap mt-0.5">
                      {dev.tags.map((t) => (
                        <span key={t} className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setDiagnosticTargetDevice(dev);
                          setDiagnosticModalOpen(true);
                        }}
                        title="Run Diagnostic Ping"
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setRoutingTargetDevice(dev);
                          setRoutingModalOpen(true);
                        }}
                        title="View Routing Table, ARP Cache & NAT"
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition"
                      >
                        <Route className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedDevice(dev);
                          onNavigate('config');
                        }}
                        title="Configuration Workspace"
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                      </button>

                      {canEdit && (
                        <>
                          <button
                            onClick={() => handleDuplicate(dev)}
                            title="Duplicate Virtual Node"
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(dev)}
                            title="Edit Parameters"
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(dev.id, dev.name)}
                            title="Delete Node"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">
                {isEditing ? 'Edit Virtual Device Parameters' : 'Deploy New Virtual Device'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Device Hostname</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Device Class</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as DeviceType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="router">Router (OSPF/Static)</option>
                    <option value="switch_l3">Layer 3 Switch (SVI)</option>
                    <option value="switch_l2">Layer 2 Switch (VLAN)</option>
                    <option value="firewall">Firewall (Perimeter)</option>
                    <option value="server">Server</option>
                    <option value="host">Client Host</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Management IPv4</label>
                  <input
                    type="text"
                    required
                    value={managementIp}
                    onChange={(e) => setManagementIp(e.target.value)}
                    placeholder="192.168.100.X"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Software Profile</label>
                <input
                  type="text"
                  value={softwareProfile}
                  onChange={(e) => setSoftwareProfile(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Site / Datacenter</label>
                  <input
                    type="text"
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tagsStr}
                    onChange={(e) => setTagsStr(e.target.value)}
                    placeholder="core, vlan-10, ospf"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-md"
                >
                  {isEditing ? 'Save Changes' : 'Deploy Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
