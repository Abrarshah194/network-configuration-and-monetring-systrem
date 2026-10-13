import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  Clock,
  Shield,
  FileText,
} from 'lucide-react';

export const ReportsExport: React.FC = () => {
  const { state } = useNetwork();
  const [reportType, setReportType] = useState<'inventory' | 'audit' | 'faults' | 'alerts' | 'performance'>('inventory');

  if (!state) return null;

  const devices = state.devices;
  const auditLogs = state.auditLogs;
  const faults = state.faults;
  const alerts = state.alerts;

  const handlePrint = () => {
    window.print();
  };

  const exportCurrentReportCsv = () => {
    let headers: string[] = [];
    let rows: any[][] = [];

    if (reportType === 'inventory') {
      headers = ['ID', 'Name', 'Type', 'Management IP', 'Status', 'CPU %', 'Memory %', 'Site', 'Tags'];
      rows = devices.map((d) => [d.id, d.name, d.type, d.managementIp, d.status, d.cpuPercent, d.memoryPercent, d.site, d.tags.join(';')]);
    } else if (reportType === 'audit') {
      headers = ['ID', 'Timestamp', 'Actor', 'Action', 'Resource', 'Details', 'Status'];
      rows = auditLogs.map((a) => [a.id, a.timestamp, a.actor, a.action, a.resource, `"${a.details.replace(/"/g, '""')}"`, a.status]);
    } else if (reportType === 'faults') {
      headers = ['ID', 'Detected At', 'Category', 'Severity', 'Affected Devices', 'Root Cause', 'Status'];
      rows = faults.map((f) => [f.id, f.firstDetected, f.category, f.severity, f.affectedDevices.join(';'), `"${f.likelyCause.replace(/"/g, '""')}"`, f.status]);
    } else if (reportType === 'alerts') {
      headers = ['ID', 'Timestamp', 'Severity', 'Title', 'Message', 'Device', 'Resolved'];
      rows = alerts.map((a) => [a.id, a.timestamp, a.severity, a.title, `"${a.message.replace(/"/g, '""')}"`, a.deviceId || '', a.resolved]);
    } else {
      headers = ['Timestamp', 'Throughput Mbps', 'Avg Latency ms', 'Packet Loss %', 'Active Links', 'Avg CPU %'];
      rows = (state.metricSamples || []).map((m) => [m.timestamp, m.totalThroughputMbps, m.avgLatencyMs, m.avgPacketLossPercent, m.activeLinksCount, m.cpuAvgPercent]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `aincms-report-${reportType}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const exportCurrentReportJson = () => {
    const dataObj = {
      reportType,
      generatedAt: new Date().toISOString(),
      environment: state.simulationMode,
      seed: state.simulationSeed,
      data: reportType === 'inventory' ? devices : reportType === 'audit' ? auditLogs : reportType === 'faults' ? faults : reportType === 'alerts' ? alerts : state.metricSamples,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataObj, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `aincms-report-${reportType}-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            Compliance, Audit & Analytics Reports
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Export certified operational records, device inventories, security audits, and performance telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportCurrentReportCsv}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={exportCurrentReportJson}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            Export JSON
          </button>

          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-md shadow-blue-600/20"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs overflow-x-auto print:hidden">
        {[
          { id: 'inventory', label: 'Device Inventory' },
          { id: 'audit', label: 'Security & Action Audit Logs' },
          { id: 'faults', label: 'Fault & Incident Records' },
          { id: 'alerts', label: 'System Alert Center Logs' },
          { id: 'performance', label: 'Performance Metric Samples' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              reportType === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-sm text-slate-200 print:bg-white print:text-black print:border-none print:p-0">
        {/* Document Header */}
        <div className="pb-6 border-b border-slate-800 print:border-black/20 flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white print:text-black tracking-tight">
              AINCMS Comprehensive Network Report
            </h1>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
              Department of Computer Science & Networking • Final Year Project Evaluation
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 print:text-slate-600 font-mono">
            <div>Generated: {new Date().toLocaleString()}</div>
            <div>Mode: {state.simulationMode} (Seed #{state.simulationSeed})</div>
            <div>Classification: Confirmed Deterministic Synthetic Run</div>
          </div>
        </div>

        {/* Report Content Table */}
        <div className="mt-6 overflow-x-auto">
          {reportType === 'inventory' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 print:bg-slate-100 text-slate-400 print:text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-800 print:border-slate-300 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Device Name</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Management IP</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">CPU %</th>
                  <th className="py-2.5 px-3">Memory %</th>
                  <th className="py-2.5 px-3">Site</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                {devices.map((d) => (
                  <tr key={d.id}>
                    <td className="py-2.5 px-3 font-semibold text-slate-200 print:text-black">{d.name}</td>
                    <td className="py-2.5 px-3 uppercase text-[10px]">{d.type}</td>
                    <td className="py-2.5 px-3 font-mono text-blue-400 print:text-blue-800">{d.managementIp}</td>
                    <td className="py-2.5 px-3 uppercase font-bold text-[10px]">{d.status}</td>
                    <td className="py-2.5 px-3 font-mono">{d.cpuPercent}%</td>
                    <td className="py-2.5 px-3 font-mono">{d.memoryPercent}%</td>
                    <td className="py-2.5 px-3">{d.site}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'audit' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 print:bg-slate-100 text-slate-400 print:text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-800 print:border-slate-300 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Resource</th>
                  <th className="py-2.5 px-3">Audit Details</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                {auditLogs.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2.5 px-3 font-mono text-slate-400 print:text-slate-600 text-[11px]">
                      {new Date(a.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200 print:text-black">{a.actor}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-blue-400 print:text-blue-800">{a.action}</td>
                    <td className="py-2.5 px-3 text-slate-300 print:text-slate-800">{a.resource}</td>
                    <td className="py-2.5 px-3 text-slate-400 print:text-slate-600 max-w-sm">{a.details}</td>
                    <td className="py-2.5 px-3 font-bold text-[10px] uppercase text-emerald-400 print:text-emerald-700">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'faults' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 print:bg-slate-100 text-slate-400 print:text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-800 print:border-slate-300 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Detected</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Likely Root Cause</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                {faults.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">No fault incidents registered.</td>
                  </tr>
                ) : (
                  faults.map((f) => (
                    <tr key={f.id}>
                      <td className="py-2.5 px-3 font-mono text-slate-400 print:text-slate-600">{new Date(f.firstDetected).toLocaleTimeString()}</td>
                      <td className="py-2.5 px-3 uppercase font-bold text-[10px] text-rose-400 print:text-rose-700">{f.severity}</td>
                      <td className="py-2.5 px-3 font-semibold uppercase">{f.category.replace('_', ' ')}</td>
                      <td className="py-2.5 px-3 text-slate-300 print:text-slate-800">{f.likelyCause}</td>
                      <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-emerald-400 print:text-emerald-700">{f.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {reportType === 'alerts' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 print:bg-slate-100 text-slate-400 print:text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-800 print:border-slate-300 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Message</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                {alerts.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2.5 px-3 uppercase font-bold text-[10px]">{a.severity}</td>
                    <td className="py-2.5 px-3 font-semibold">{a.title}</td>
                    <td className="py-2.5 px-3 text-slate-400 print:text-slate-600">{a.message}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">{new Date(a.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 px-3">{a.resolved ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'performance' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 print:bg-slate-100 text-slate-400 print:text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-800 print:border-slate-300 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Throughput (Mbps)</th>
                  <th className="py-2.5 px-3">Avg Latency (ms)</th>
                  <th className="py-2.5 px-3">Packet Loss (%)</th>
                  <th className="py-2.5 px-3">Active Links</th>
                  <th className="py-2.5 px-3">CPU Avg (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                {(state.metricSamples || []).map((m, i) => (
                  <tr key={i}>
                    <td className="py-2.5 px-3 font-mono text-slate-400 print:text-slate-600">{new Date(m.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 px-3 font-mono text-cyan-400 print:text-cyan-800 font-bold">{m.totalThroughputMbps}</td>
                    <td className="py-2.5 px-3 font-mono">{m.avgLatencyMs}</td>
                    <td className="py-2.5 px-3 font-mono">{m.avgPacketLossPercent}%</td>
                    <td className="py-2.5 px-3 font-mono">{m.activeLinksCount}</td>
                    <td className="py-2.5 px-3 font-mono">{m.cpuAvgPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
