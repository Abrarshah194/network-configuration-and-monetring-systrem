import React, { useState, useEffect } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Shield,
  Eye,
  Cpu,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { getAuditLogs, clearAuditLogs, logSystemAction, AuditLogEntry } from '../../services/auditLogger';

export const SystemLogs: React.FC = () => {
  const { currentUser } = useNetwork();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'admin' | 'student' | 'system'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Success' | 'Failed'>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadLogs = () => {
    const list = getAuditLogs();
    setLogs(list);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the entire audit trail from LocalStorage?')) {
      clearAuditLogs();
      setLogs([]);
      setActionNotice('Audit trail cleared from LocalStorage.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleAddSampleLog = () => {
    logSystemAction({
      user: currentUser.role,
      action: 'Administrative Health Check',
      targetDevice: 'System Diagnostics',
      status: 'Success',
      details: 'Manual verification of telemetry pipeline and local event bus',
    });
    loadLogs();
    setActionNotice('Generated new verification log entry.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aincms-audit-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Timestamp', 'User', 'Action', 'TargetDevice', 'Status', 'Details'];
    const rows = logs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      l.user,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.targetDevice.replace(/"/g, '""')}"`,
      l.status,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aincms-audit-logs-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.targetDevice.toLowerCase().includes(search.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(search.toLowerCase()));
    const matchesUser = userFilter === 'all' || l.user === userFilter;
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesUser && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-blue-400" />
            System Audit Trail & Security Logs (/logs)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Chronological audit log persisted in LocalStorage tracking all configuration commits, fault injections, alerts, and user operations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAddSampleLog}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
            Add Test Event
          </button>
          <button
            onClick={handleExportJson}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export JSON
          </button>
          <button
            onClick={handleExportCsv}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            Export CSV
          </button>
          <button
            onClick={handleClear}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Trail
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, device or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Filter by User */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>Filter by User:</span>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none font-medium"
            >
              <option value="all">All Users ({logs.length})</option>
              <option value="admin">admin ({logs.filter((l) => l.user === 'admin').length})</option>
              <option value="student">student ({logs.filter((l) => l.user === 'student').length})</option>
              <option value="system">system ({logs.filter((l) => l.user === 'system').length})</option>
            </select>
          </div>

          {/* Filter by Status */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="Success">Success Only</option>
              <option value="Failed">Failed Only</option>
            </select>
          </div>

          <button
            onClick={loadLogs}
            title="Reload from LocalStorage"
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Device</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    No system audit logs found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {log.user === 'admin' ? (
                        <span className="bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-mono font-semibold text-[10px] inline-flex items-center gap-1">
                          <Shield className="w-3 h-3 text-blue-400" />
                          admin
                        </span>
                      ) : log.user === 'student' ? (
                        <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-semibold text-[10px] inline-flex items-center gap-1">
                          <Eye className="w-3 h-3 text-amber-400" />
                          student
                        </span>
                      ) : (
                        <span className="bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-mono font-semibold text-[10px] inline-flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-purple-400" />
                          system
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200">{log.action}</span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {log.targetDevice}
                    </td>

                    <td className="py-3 px-4">
                      {log.status === 'Success' ? (
                        <span className="text-emerald-400 font-semibold inline-flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Success
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold inline-flex items-center gap-1 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Failed
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-400 max-w-md">
                      <span className="line-clamp-2">{log.details || '—'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
