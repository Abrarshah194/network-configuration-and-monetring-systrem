import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  Search,
  Filter,
  Check,
  CheckCheck,
  Clock,
  Trash2,
  Mail,
  Send,
  Zap,
} from 'lucide-react';
import { acknowledgeAlert, resolveAlert } from '../../services/api';
import { NetworkAlert } from '../../types/network';
import { logSystemAction } from '../../services/auditLogger';

export const AlertCenter: React.FC = () => {
  const {
    state,
    refreshState,
    userRole,
    currentUser,
    adminEmail,
    emailAlertsEnabled,
    setEmailAlertsEnabled,
    triggerEmailAlert,
  } = useNetwork();
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [search, setSearch] = useState<string>('');

  if (!state) return null;

  const alerts = state.alerts || [];

  const filteredAlerts = alerts.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.message.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = filterSeverity === 'all' || a.severity === filterSeverity;
    const matchStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'active'
        ? !a.resolved
        : filterStatus === 'acknowledged'
        ? a.acknowledged && !a.resolved
        : a.resolved;
    return matchSearch && matchSeverity && matchStatus;
  });

  const handleAcknowledge = async (id: string, title: string) => {
    await acknowledgeAlert(id);
    logSystemAction({
      user: currentUser.role,
      action: 'Acknowledge Alert',
      targetDevice: id,
      status: 'Success',
      details: `Operator acknowledged incident: ${title}`,
    });
    await refreshState();
  };

  const handleResolve = async (id: string, title: string) => {
    await resolveAlert(id);
    logSystemAction({
      user: currentUser.role,
      action: 'Resolve Alert',
      targetDevice: id,
      status: 'Success',
      details: `Operator marked alert resolved: ${title}`,
    });
    await refreshState();
  };

  const handleSimulateEmailAlert = () => {
    const highUtilAlert = alerts.find((a) => a.severity === 'critical' || a.severity === 'warning') || {
      title: 'CPU Utilization > 60% on HQ-Core-Router-01',
      deviceId: 'dev-r1',
    };
    triggerEmailAlert(highUtilAlert.title, highUtilAlert.deviceId);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
            Warning
          </span>
        );
      case 'info':
      default:
        return (
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
            Info
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header and Email Alert Simulation Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Alert & Notification Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time network event notifications, threshold violations, and automated incident lifecycle management.
          </p>
        </div>

        {/* FEATURE 4: Email Alert Simulation Toggle & Trigger */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${emailAlertsEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
              <Mail className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <span>Email Alerts</span>
                <span className="text-[10px] font-mono text-blue-400 font-normal">
                  ({adminEmail || 'abrarshah2134896@gmail.com'})
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                {emailAlertsEnabled ? 'Simulated dispatch active' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={() => setEmailAlertsEnabled(!emailAlertsEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
              emailAlertsEnabled ? 'bg-blue-600' : 'bg-slate-700'
            }`}
            title={`Toggle simulated email notifications to ${adminEmail || 'abrarshah2134896@gmail.com'}`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 left-1 ${
                emailAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>

          <div className="h-6 w-px bg-slate-800 mx-0.5" />

          {/* Simulation Trigger Button */}
          <button
            onClick={handleSimulateEmailAlert}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
            title="Simulate high utilization (>60%) trigger and dispatch email alert toast"
          >
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Email Alert</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search alerts by title or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Informational</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="active">Active Unresolved</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
              <option value="all">All Records</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Device Reference</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No alerts match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">{getSeverityBadge(alert.severity)}</td>

                    <td className="py-3 px-4 max-w-md">
                      <div className="font-semibold text-slate-200">{alert.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{alert.message}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {alert.deviceId || alert.linkId || 'General System'}
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {alert.resolved ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[10px] uppercase">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                        </span>
                      ) : alert.acknowledged ? (
                        <span className="text-blue-400 flex items-center gap-1 font-semibold text-[10px] uppercase">
                          <CheckCheck className="w-3.5 h-3.5" /> Acked
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1 font-semibold text-[10px] uppercase">
                          <AlertTriangle className="w-3.5 h-3.5" /> Unread
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!alert.acknowledged && !alert.resolved && (
                          <button
                            onClick={() => handleAcknowledge(alert.id, alert.title)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded text-xs transition"
                          >
                            Acknowledge
                          </button>
                        )}
                        {!alert.resolved && (
                          <button
                            onClick={() => handleResolve(alert.id, alert.title)}
                            className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded text-xs font-medium transition"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
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
