export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: 'admin' | 'student' | 'system';
  action: string;
  targetDevice: string;
  status: 'Success' | 'Failed';
  details?: string;
}

const STORAGE_KEY = 'aincms_system_audit_logs';

const INITIAL_LOGS: AuditLogEntry[] = [
  {
    id: 'log-seed-1',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    user: 'system',
    action: 'System Bootstrapped',
    targetDevice: 'Core Engine',
    status: 'Success',
    details: 'Initialized deterministic simulation clock tick #0 with seed #42',
  },
  {
    id: 'log-seed-2',
    timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    user: 'admin',
    action: 'Verify Topology',
    targetDevice: 'HQ-Core-Router-01',
    status: 'Success',
    details: 'Validated loop-free Spanning Tree state across 6 virtual nodes',
  },
  {
    id: 'log-seed-3',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    user: 'admin',
    action: 'Commit Config',
    targetDevice: 'HQ-Dist-Switch-01',
    status: 'Success',
    details: 'Updated VLAN 10 and VLAN 20 802.1Q trunking configuration',
  },
  {
    id: 'log-seed-4',
    timestamp: new Date(Date.now() - 3600000 * 1.2).toISOString(),
    user: 'system',
    action: 'EMAIL_ALERT_DISPATCH',
    targetDevice: 'dev-r1',
    status: 'Success',
    details: 'Dispatched SMTP notification to abrarshah2134896@gmail.com: CPU utilization alert',
  },
  {
    id: 'log-seed-5',
    timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    user: 'student',
    action: 'Diagnostic Ping',
    targetDevice: 'Staff-Workstation-PC-01',
    status: 'Success',
    details: 'Simulated ICMP Echo Request to default gateway 192.168.10.1',
  },
];

export function getAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read audit logs from localStorage', err);
    return INITIAL_LOGS;
  }
}

export function logSystemAction(entry: {
  user?: 'admin' | 'student' | 'system';
  action: string;
  targetDevice: string;
  status: 'Success' | 'Failed';
  details?: string;
}): AuditLogEntry {
  const logs = getAuditLogs();
  const currentUser = localStorage.getItem('aincms_current_user');
  let detectedUser: 'admin' | 'student' | 'system' = entry.user || 'admin';
  if (!entry.user && currentUser) {
    try {
      const parsed = JSON.parse(currentUser);
      detectedUser = parsed.role === 'student' ? 'student' : 'admin';
    } catch {}
  }

  const newLog: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    user: detectedUser,
    action: entry.action,
    targetDevice: entry.targetDevice,
    status: entry.status,
    details: entry.details,
  };

  const updated = [newLog, ...logs].slice(0, 200); // keep up to 200 entries
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save audit log to localStorage', err);
  }
  return newLog;
}

export function clearAuditLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear audit logs', err);
  }
}
