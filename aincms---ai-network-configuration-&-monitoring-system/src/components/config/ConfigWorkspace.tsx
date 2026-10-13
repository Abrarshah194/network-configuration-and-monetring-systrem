import React, { useState, useEffect, useRef } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import {
  FileCode,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Clock,
  Diff,
  FileCheck,
  Send,
  ShieldCheck,
  ChevronRight,
  History,
  Copy,
  Undo2,
  GitPullRequest,
  RefreshCw,
  AlertOctagon,
  ShieldAlert,
  Download,
  Upload,
  Trash2,
  Eye,
  Archive,
} from 'lucide-react';
import {
  commitDeviceConfig,
  saveDeviceConfig,
  rollbackDeviceConfig,
  fetchDeviceDrift,
  revertDeviceDrift,
} from '../../services/api';
import { NetworkDevice, ConfigVersion, DriftReport } from '../../types/network';
import { logSystemAction } from '../../services/auditLogger';

interface LocalConfigBackup {
  id: string;
  deviceId: string;
  deviceName: string;
  timestamp: string;
  config: string;
  lengthBytes: number;
  author: string;
  commitMessage: string;
}

export const ConfigWorkspace: React.FC = () => {
  const { state, refreshState, selectedDevice, setSelectedDevice, userRole, currentUser } = useNetwork();

  const [activeDeviceId, setActiveDeviceId] = useState<string>(selectedDevice?.id || (state?.devices[0]?.id || ''));
  const [candidateConfig, setCandidateConfig] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState<string>('Updated interface & routing parameters');
  const [viewMode, setViewMode] = useState<'editor' | 'diff' | 'history' | 'drift'>('editor');
  const [driftReport, setDriftReport] = useState<DriftReport | null>(null);
  const [loadingDrift, setLoadingDrift] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; warnings: string[]; errors: string[] }>({
    valid: true,
    warnings: [],
    errors: [],
  });
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Hidden file input for Upload & Restore
  const fileInputRef = useRef<HTMLInputElement>(null);

  // LocalStorage config history
  const [localHistory, setLocalHistory] = useState<LocalConfigBackup[]>(() => {
    try {
      const raw = localStorage.getItem('configHistory');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const currentDevice = state?.devices.find((d) => d.id === activeDeviceId) || state?.devices[0];

  const canCommit = currentUser.role === 'admin' && (userRole === 'super_admin' || userRole === 'network_admin');

  const loadDrift = async (devId: string) => {
    setLoadingDrift(true);
    try {
      const res = await fetchDeviceDrift(devId);
      if (res.success) {
        setDriftReport(res.data);
      }
    } catch (err) {
      console.error('Failed to load drift report', err);
    } finally {
      setLoadingDrift(false);
    }
  };

  useEffect(() => {
    if (currentDevice) {
      setCandidateConfig(currentDevice.runningConfig);
      validateSyntax(currentDevice.runningConfig);
      loadDrift(currentDevice.id);
    }
  }, [currentDevice?.id]);

  if (!state || !currentDevice) {
    return <div className="p-8 text-center text-slate-400">Loading configuration workspace...</div>;
  }

  // Save to LocalStorage configHistory
  const saveToConfigHistory = (configText: string, message: string) => {
    try {
      const raw = localStorage.getItem('configHistory');
      let currentList: LocalConfigBackup[] = raw ? JSON.parse(raw) : [];

      const newBackup: LocalConfigBackup = {
        id: `cfg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        deviceId: currentDevice.id,
        deviceName: currentDevice.name,
        timestamp: new Date().toISOString(),
        config: configText,
        lengthBytes: new Blob([configText]).size,
        author: currentUser.username,
        commitMessage: message,
      };

      const updated = [newBackup, ...currentList].slice(0, 50);
      localStorage.setItem('configHistory', JSON.stringify(updated));
      setLocalHistory(updated);
    } catch (err) {
      console.error('Failed to save configHistory to LocalStorage', err);
    }
  };

  // Rule-based syntax validator for Cisco / FRR configurations
  const validateSyntax = (text: string) => {
    const lines = text.split('\n');
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check basic hostname
    if (!text.includes('hostname')) {
      warnings.push('No "hostname" directive configured.');
    }

    // Check IP addresses and subnet masks
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('ip address')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length < 4) {
          errors.push(`Line ${idx + 1}: Incomplete "ip address" syntax.`);
        }
      }
      if (trimmed.startsWith('ip route')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length < 5) {
          errors.push(`Line ${idx + 1}: Incomplete static route declaration.`);
        }
      }
      if (trimmed.includes('shutdown') && !trimmed.includes('no shutdown')) {
        warnings.push(`Line ${idx + 1}: An interface is explicitly administratively shutdown.`);
      }
    });

    setValidationResult({
      valid: errors.length === 0,
      warnings,
      errors,
    });
  };

  const handleConfigChange = (text: string) => {
    setCandidateConfig(text);
    validateSyntax(text);
  };

  // 1. Download Running-Config as .txt
  const handleDownloadRunningConfigTxt = () => {
    const filename = `${currentDevice.name}-running-config-${Date.now()}.txt`;
    const blob = new Blob([currentDevice.runningConfig], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logSystemAction({
      user: currentUser.role,
      action: 'Download Running-Config as .txt',
      targetDevice: currentDevice.name,
      status: 'Success',
      details: `Saved text backup as ${filename}`,
    });

    setSaveSuccess(`Downloaded running-config as ${filename}`);
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  // 1. Upload & Restore
  const handleUploadAndRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content !== undefined) {
        setCandidateConfig(content);
        validateSyntax(content);
        saveToConfigHistory(content, `Uploaded & Restored from ${file.name}`);

        logSystemAction({
          user: currentUser.role,
          action: 'Upload & Restore',
          targetDevice: currentDevice.name,
          status: 'Success',
          details: `Restored candidate buffer from ${file.name} (${content.length} characters)`,
        });

        setSaveSuccess(`Uploaded & Restored from ${file.name} into candidate buffer!`);
        setTimeout(() => setSaveSuccess(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCommit = async () => {
    if (!canCommit || !validationResult.valid) return;
    setLoading(true);
    try {
      await commitDeviceConfig(currentDevice.id, candidateConfig, commitMessage, userRole);
      // Save in localStorage array configHistory on every commit
      saveToConfigHistory(candidateConfig, commitMessage);

      logSystemAction({
        user: currentUser.role,
        action: 'Commit Config',
        targetDevice: currentDevice.name,
        status: 'Success',
        details: commitMessage,
      });

      setSaveSuccess('Configuration committed to running-config and saved to LocalStorage history.');
      setTimeout(() => setSaveSuccess(null), 4000);
      await refreshState();
      await loadDrift(currentDevice.id);
    } catch (err: any) {
      logSystemAction({
        user: currentUser.role,
        action: 'Commit Config',
        targetDevice: currentDevice.name,
        status: 'Failed',
        details: err.message,
      });
      alert(`Commit failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToStartup = async () => {
    if (!canCommit) return;
    setLoading(true);
    try {
      await saveDeviceConfig(currentDevice.id);
      saveToConfigHistory(currentDevice.runningConfig, 'Saved running-config to startup-config (NVRAM)');

      logSystemAction({
        user: currentUser.role,
        action: 'Write Memory',
        targetDevice: currentDevice.name,
        status: 'Success',
        details: 'Saved running-config to startup-config NVRAM',
      });

      setSaveSuccess('Running-config written to startup-config (NVRAM).');
      setTimeout(() => setSaveSuccess(null), 4000);
      await refreshState();
      await loadDrift(currentDevice.id);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (version: number) => {
    if (!canCommit) return;
    if (confirm(`Roll back ${currentDevice.name} to configuration version ${version}?`)) {
      setLoading(true);
      try {
        await rollbackDeviceConfig(currentDevice.id, version);
        saveToConfigHistory(candidateConfig, `Rolled back to snapshot version ${version}`);

        logSystemAction({
          user: currentUser.role,
          action: 'Rollback Config',
          targetDevice: currentDevice.name,
          status: 'Success',
          details: `Reverted to version ${version}`,
        });

        setSaveSuccess(`Restored snapshot version ${version}.`);
        setTimeout(() => setSaveSuccess(null), 4000);
        await refreshState();
      } catch (err: any) {
        alert(`Rollback failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRevertDrift = async () => {
    if (!canCommit || !currentDevice) return;
    if (
      confirm(
        `Revert configuration drift on ${currentDevice.name}? Running-config will be replaced with saved startup-config.`
      )
    ) {
      setLoading(true);
      try {
        await revertDeviceDrift(currentDevice.id, userRole);
        saveToConfigHistory(currentDevice.savedConfig, 'Automated remediation: Reverted drift to startup baseline');

        logSystemAction({
          user: currentUser.role,
          action: 'Revert Drift',
          targetDevice: currentDevice.name,
          status: 'Success',
          details: 'Discarded volatile delta and aligned with startup-config',
        });

        setSaveSuccess(`Reverted configuration drift for ${currentDevice.name}. Restored certified baseline.`);
        setTimeout(() => setSaveSuccess(null), 4000);
        await refreshState();
        await loadDrift(currentDevice.id);
      } catch (err: any) {
        alert(`Drift remediation failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteHistoryEntry = (id: string) => {
    const updated = localHistory.filter((item) => item.id !== id);
    setLocalHistory(updated);
    try {
      localStorage.setItem('configHistory', JSON.stringify(updated));
    } catch {}
  };

  const handleClearHistory = () => {
    if (confirm('Clear all LocalStorage configuration backup history?')) {
      setLocalHistory([]);
      try {
        localStorage.removeItem('configHistory');
      } catch {}
    }
  };

  // Diff lines generator
  const generateDiff = () => {
    const runningLines = currentDevice.runningConfig.split('\n');
    const candidateLines = candidateConfig.split('\n');
    const max = Math.max(runningLines.length, candidateLines.length);
    const diffRows = [];

    for (let i = 0; i < max; i++) {
      const run = runningLines[i] ?? '';
      const cand = candidateLines[i] ?? '';
      const isDiff = run !== cand;
      diffRows.push({
        lineNo: i + 1,
        running: run,
        candidate: cand,
        isDiff,
      });
    }
    return diffRows;
  };

  // Quick Template Injector
  const applyTemplate = (type: string) => {
    let snippet = '';
    if (type === 'ospf') {
      snippet = `\nrouter ospf 1\n router-id 1.1.1.1\n network 10.0.1.0 0.0.0.3 area 0\n passive-interface default\n no passive-interface GigabitEthernet0/0\n!`;
    } else if (type === 'vlan') {
      snippet = `\nvlan 30\n name Guest_WiFi\n!\ninterface Vlan30\n ip address 192.168.30.1 255.255.255.0\n!`;
    } else if (type === 'acl') {
      snippet = `\nip access-list extended RESTRICT_DB\n permit tcp 192.168.10.0 0.0.0.255 host 192.168.20.10 eq 5432\n deny ip any host 192.168.20.10 log\n permit ip any any\n!`;
    }
    const updated = candidateConfig + snippet;
    handleConfigChange(updated);
  };

  const isModified = candidateConfig !== currentDevice.runningConfig;

  // Filter local history for current device
  const deviceHistory = localHistory.filter((h) => h.deviceId === currentDevice.id);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Hidden file input for Upload & Restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadAndRestore}
        accept=".txt,.cfg,.conf"
        className="hidden"
      />

      {/* Header and Device Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCode className="w-5 h-5 text-emerald-400" />
            Network Configuration Workspace
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage running-config vs candidate changes, LocalStorage backups, syntax validation, and atomic rollbacks.
          </p>
        </div>

        {/* Device Dropdown and View Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={activeDeviceId}
            onChange={(e) => setActiveDeviceId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none"
          >
            {state.devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.managementIp}) - {d.type}
              </option>
            ))}
          </select>

          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                viewMode === 'editor' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              Editor
            </button>
            <button
              onClick={() => setViewMode('diff')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                viewMode === 'diff' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Diff className="w-3.5 h-3.5" />
              Diff Viewer {isModified && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                viewMode === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Snapshots ({currentDevice.configVersions?.length || 0})
            </button>
            <button
              onClick={() => {
                setViewMode('drift');
                loadDrift(currentDevice.id);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                viewMode === 'drift' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              Drift Auditor
              {driftReport?.hasDrift && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Drift Detected" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shrink-0 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-0">
        {/* Workspace Sub-header with Download & Upload Buttons */}
        <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-200">
              {currentDevice.name} :: {currentDevice.softwareProfile}
            </span>
            {isModified && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-medium">
                Uncommitted Changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* FEATURE 1: Download Running-Config as .txt */}
            <button
              onClick={handleDownloadRunningConfigTxt}
              title="Export current running-config to text file"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              Download Running-Config as .txt
            </button>

            {/* FEATURE 1: Upload & Restore */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload text backup and restore into candidate buffer"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              Upload & Restore
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

            <span className="text-xs text-slate-400 hidden xl:inline">Templates:</span>
            <button
              onClick={() => applyTemplate('ospf')}
              className="text-[11px] bg-slate-700/80 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition hidden sm:inline"
            >
              + OSPF
            </button>
            <button
              onClick={() => applyTemplate('vlan')}
              className="text-[11px] bg-slate-700/80 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition hidden sm:inline"
            >
              + VLAN SVI
            </button>
            <button
              onClick={() => applyTemplate('acl')}
              className="text-[11px] bg-slate-700/80 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition hidden sm:inline"
            >
              + ACL
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

            <button
              onClick={handleSaveToStartup}
              disabled={loading || !canCommit}
              title="Save running configuration to startup configuration (write memory)"
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-blue-400" />
              Write Memory
            </button>
          </div>
        </div>

        {/* View Mode: Editor */}
        {viewMode === 'editor' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {/* Top Editor Area: Textarea + Validation Sidebar */}
            <div className="flex-1 flex flex-col md:flex-row min-h-[380px] border-b border-slate-800">
              {/* Editor Textarea */}
              <div className="flex-1 p-4 flex flex-col bg-slate-950 min-h-0">
                <label className="text-xs font-medium text-slate-400 mb-2 flex items-center justify-between">
                  <span>Candidate Configuration Buffer</span>
                  <span className="text-[10px] text-slate-500">Cisco IOS / FRR Syntax</span>
                </label>
                <textarea
                  value={candidateConfig}
                  onChange={(e) => handleConfigChange(e.target.value)}
                  disabled={!canCommit}
                  placeholder={canCommit ? 'Enter configuration...' : 'Read-only in Viewer Mode'}
                  className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs text-emerald-400/90 leading-relaxed focus:outline-none focus:border-blue-500 resize-none min-h-[220px]"
                  spellCheck={false}
                />
              </div>

              {/* Validation & Commit Sidebar */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 p-4 bg-slate-900 flex flex-col justify-between shrink-0">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Automated Pre-Commit Validation
                    </h4>

                    {validationResult.valid ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs p-3 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Syntax and routing statement schema validated. Ready to commit.</span>
                      </div>
                    ) : (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs p-3 rounded-lg space-y-1">
                        <div className="font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          Syntax Errors Detected ({validationResult.errors.length})
                        </div>
                        <ul className="list-disc pl-4 text-[11px] space-y-0.5">
                          {validationResult.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validationResult.warnings.length > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs p-3 rounded-lg mt-2 space-y-1">
                        <div className="font-semibold text-[11px]">Configuration Warnings:</div>
                        <ul className="list-disc pl-4 text-[11px] space-y-0.5">
                          {validationResult.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Commit Change Description
                    </label>
                    <input
                      type="text"
                      value={commitMessage}
                      disabled={!canCommit}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="Describe purpose of changes..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2">
                  {/* FEATURE 2: Hide Commit for student / Viewer Mode */}
                  {canCommit ? (
                    <button
                      onClick={handleCommit}
                      disabled={loading || !validationResult.valid || !isModified}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-md shadow-blue-600/20 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {loading ? 'Committing...' : 'Commit Configuration'}
                    </button>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-2.5 rounded-lg text-center text-xs font-semibold flex items-center justify-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      Viewer Mode: Commits Disabled
                    </div>
                  )}

                  <button
                    onClick={() => setCandidateConfig(currentDevice.runningConfig)}
                    disabled={!isModified || !canCommit}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 px-3 rounded-lg transition disabled:opacity-40"
                  >
                    Discard Candidate Buffer
                  </button>
                </div>
              </div>
            </div>

            {/* FEATURE 1: LocalStorage Config History Table Below */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Local Config Backup & Commit History (LocalStorage: <span className="font-mono text-emerald-400">configHistory</span>)
                  </h4>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                    {deviceHistory.length} saved
                  </span>
                </div>

                {localHistory.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear History
                  </button>
                )}
              </div>

              {deviceHistory.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/60 rounded-xl border border-slate-800/60">
                  No local commits recorded for <span className="text-slate-300 font-medium">{currentDevice.name}</span> yet.
                  Click <strong className="text-blue-400">Commit Configuration</strong> or <strong className="text-emerald-400">Upload & Restore</strong> to save an entry.
                </div>
              ) : (
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3">Device</th>
                          <th className="py-2.5 px-3">Commit Description / Source</th>
                          <th className="py-2.5 px-3">Size</th>
                          <th className="py-2.5 px-3">Author</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {deviceHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition text-slate-300">
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {new Date(item.timestamp).toLocaleString()}
                              </div>
                            </td>
                            <td className="py-2 px-3 font-medium text-white">{item.deviceName}</td>
                            <td className="py-2 px-3 text-slate-300">{item.commitMessage}</td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                              {(item.lengthBytes / 1024).toFixed(1)} KB
                            </td>
                            <td className="py-2 px-3">
                              <span className="text-[10px] font-mono bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded">
                                {item.author || 'admin'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    const blob = new Blob([item.config], { type: 'text/plain;charset=utf-8' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `${item.deviceName}-backup-${new Date(item.timestamp).toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`;
                                    link.click();
                                    URL.revokeObjectURL(url);
                                  }}
                                  title="Download this version as .txt"
                                  className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition"
                                >
                                  <Download className="w-3 h-3 text-blue-400" />
                                </button>
                                <button
                                  onClick={() => {
                                    setCandidateConfig(item.config);
                                    validateSyntax(item.config);
                                    setSaveSuccess(`Loaded backup from ${new Date(item.timestamp).toLocaleTimeString()} into candidate editor.`);
                                    setTimeout(() => setSaveSuccess(null), 3500);
                                  }}
                                  title="Load into candidate buffer"
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition"
                                >
                                  Restore to Buffer
                                </button>
                                <button
                                  onClick={() => handleDeleteHistoryEntry(item.id)}
                                  title="Delete snapshot"
                                  className="p-1 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Mode: Diff Viewer */}
        {viewMode === 'diff' && (
          <div className="flex-1 p-4 bg-slate-950 font-mono text-xs overflow-y-auto">
            <div className="grid grid-cols-2 pb-2 border-b border-slate-800 text-slate-400 font-sans text-xs">
              <span className="font-semibold text-slate-300">Active Running-Config</span>
              <span className="font-semibold text-slate-300">Candidate Buffer</span>
            </div>

            <div className="divide-y divide-slate-900 mt-2">
              {generateDiff().map((row) => (
                <div
                  key={row.lineNo}
                  className={`grid grid-cols-2 py-1 px-2 ${
                    row.isDiff ? 'bg-amber-500/10 text-amber-300' : 'text-slate-400'
                  }`}
                >
                  <div className="overflow-x-auto pr-2">
                    <span className="text-slate-600 select-none mr-2">{row.lineNo}</span>
                    {row.running}
                  </div>
                  <div className="overflow-x-auto pl-2">
                    <span className="text-slate-600 select-none mr-2">{row.lineNo}</span>
                    {row.candidate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Mode: Snapshots History & Rollback */}
        {viewMode === 'history' && (
          <div className="flex-1 p-6 bg-slate-950 overflow-y-auto">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              Audited Configuration Snapshots
            </h4>

            <div className="space-y-3">
              {(currentDevice.configVersions || []).length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No historical snapshots recorded for this device yet.
                </div>
              ) : (
                currentDevice.configVersions.map((ver) => (
                  <div
                    key={ver.version}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-500/20 text-blue-400 font-mono text-xs font-bold px-2 py-0.5 rounded">
                          v{ver.version}
                        </span>
                        <h5 className="text-xs font-semibold text-slate-200">{ver.description}</h5>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(ver.timestamp).toLocaleString()} • Author: {ver.author}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setCandidateConfig(ver.config);
                          setViewMode('editor');
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition"
                      >
                        Load to Editor
                      </button>
                      {canCommit && (
                        <button
                          onClick={() => handleRollback(ver.version)}
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          Roll Back
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* View Mode: Drift Auditor */}
        {viewMode === 'drift' && (
          <div className="flex-1 p-6 bg-slate-950 overflow-y-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4 text-amber-400" />
                  Configuration Drift Auditor — {currentDevice.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Compares active volatile memory (<span className="text-emerald-400 font-mono">running-config</span>)
                  against certified baseline non-volatile storage (
                  <span className="text-blue-400 font-mono">startup-config / NVRAM</span>).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadDrift(currentDevice.id)}
                  disabled={loadingDrift}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingDrift ? 'animate-spin' : ''}`} />
                  Re-audit Drift
                </button>

                {canCommit && driftReport?.hasDrift && (
                  <>
                    <button
                      onClick={handleSaveToStartup}
                      disabled={loading}
                      title="Promote running-config as the new startup baseline"
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Write Memory (Accept Changes)
                    </button>

                    <button
                      onClick={handleRevertDrift}
                      disabled={loading}
                      title="Discard unpersisted running-config changes and restore saved baseline"
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      Revert Drift to Startup
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Audit Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Audit State</div>
                <div className="mt-2 flex items-center gap-2">
                  {driftReport?.hasDrift ? (
                    <>
                      <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-sm font-bold text-amber-300">Drift Detected</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="text-sm font-bold text-emerald-300">Synchronized (Clean)</span>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Severity</div>
                <div className="mt-2">
                  <span
                    className={`text-xs font-bold uppercase px-2.5 py-1 rounded font-mono ${
                      driftReport?.severity === 'high'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : driftReport?.severity === 'medium'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : driftReport?.severity === 'low'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {driftReport?.severity || 'none'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Drift Count</div>
                <div className="mt-2 font-mono text-xl font-bold text-white">
                  {driftReport?.driftCount ?? 0}{' '}
                  <span className="text-xs text-slate-400 font-sans font-normal">lines</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Last Audited</div>
                <div className="mt-2 text-xs text-slate-300 font-mono">
                  {driftReport?.lastAudited ? new Date(driftReport.lastAudited).toLocaleTimeString() : 'Never'}
                </div>
              </div>
            </div>

            {/* Drift Differences Inspector */}
            {driftReport && driftReport.differences.length > 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-white flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-amber-400" />
                    Unpersisted Delta Statements ({driftReport.differences.length})
                  </h5>
                  <span className="text-[11px] text-slate-400">
                    + Present in running-config only | - Present in startup-config only
                  </span>
                </div>

                <div className="p-4 bg-slate-950 font-mono text-xs space-y-1 overflow-x-auto">
                  {driftReport.differences.map((diff, idx) => (
                    <div
                      key={idx}
                      className={`py-1 px-3 rounded flex items-center gap-2 ${
                        diff.type === 'added'
                          ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500'
                          : 'bg-rose-500/10 text-rose-400 border-l-2 border-rose-500'
                      }`}
                    >
                      <span className="font-bold select-none">{diff.type === 'added' ? '+' : '-'}</span>
                      <span>{diff.line}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-6 rounded-xl flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <h5 className="text-sm font-bold text-white">Device Configuration in Full Compliance</h5>
                  <p className="text-xs text-slate-300 mt-1">
                    No configuration drift detected. All running parameters on{' '}
                    <span className="font-semibold text-emerald-400">{currentDevice.name}</span> have been committed and
                    persisted to startup-config NVRAM storage. In the event of an unplanned power cycle or reboot,
                    identical state will be restored.
                  </p>
                </div>
              </div>
            )}

            {/* Academic Networking Explanation */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl text-xs space-y-2 text-slate-400">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-400" />
                Computer Science & Network Engineering Note: Configuration Drift
              </div>
              <p>
                In enterprise routing and switching (Cisco IOS, Arista EOS, FRRouting), operator changes modify the
                volatile DRAM <code className="text-emerald-400">running-config</code> immediately. If the administrator
                fails to execute <code className="text-blue-400">write memory</code> or{' '}
                <code className="text-blue-400">copy running-config startup-config</code>, any unplanned reboot will revert
                the device to the outdated NVRAM baseline.
              </p>
              <p>
                AINCMS continuously computes cryptographic line diffs across the fleet to alert administrators before
                catastrophic outage triggers during scheduled maintenance windows.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
