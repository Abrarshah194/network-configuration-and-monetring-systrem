import {
  AppState,
  NetworkDevice,
  NetworkLink,
  FaultEvent,
  AutomationJob,
  RouteEntry,
  ArpEntry,
  MacTableEntry,
  NatSessionEntry,
  DriftReport,
  UserRole,
} from '../types/network';

// Default role header helper
function getHeaders(userRole: UserRole = 'super_admin', extra?: Record<string, string>) {
  return {
    'Content-Type': 'application/json',
    'x-user-role': userRole,
    ...extra,
  };
}

export async function fetchAppState(): Promise<{ success: boolean; data: AppState; geminiConfigured: boolean }> {
  const res = await fetch('/api/state');
  if (!res.ok) throw new Error('Failed to fetch application state');
  return res.json();
}

export async function controlSimulation(
  action: 'pause' | 'resume' | 'reset' | 'step',
  seed?: number,
  multiplier?: number,
  userRole: UserRole = 'super_admin'
) {
  const res = await fetch('/api/simulation/control', {
    method: 'POST',
    headers: getHeaders(userRole),
    body: JSON.stringify({ action, seed, multiplier }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Simulation control failed with status ${res.status}`);
  }
  return res.json();
}

export async function createDevice(device: Partial<NetworkDevice>, userRole: UserRole = 'super_admin') {
  const res = await fetch('/api/devices', {
    method: 'POST',
    headers: getHeaders(userRole),
    body: JSON.stringify(device),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create device');
  }
  return res.json();
}

export async function bulkImportDevices(devices: Partial<NetworkDevice>[], userRole: UserRole = 'super_admin') {
  const res = await fetch('/api/devices/bulk-import', {
    method: 'POST',
    headers: getHeaders(userRole),
    body: JSON.stringify({ devices }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to bulk import devices');
  }
  return res.json();
}

export async function updateDevice(id: string, updates: Partial<NetworkDevice>, userRole: UserRole = 'super_admin') {
  const res = await fetch(`/api/devices/${id}`, {
    method: 'PUT',
    headers: getHeaders(userRole),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update device');
  }
  return res.json();
}

export async function deleteDevice(id: string, userRole: UserRole = 'super_admin') {
  const res = await fetch(`/api/devices/${id}`, {
    method: 'DELETE',
    headers: getHeaders(userRole),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete device');
  }
  return res.json();
}

export async function fetchDeviceRoutes(deviceId: string): Promise<{ success: boolean; data: RouteEntry[]; deviceName: string }> {
  const res = await fetch(`/api/devices/${deviceId}/routes`);
  if (!res.ok) throw new Error('Failed to fetch routing table');
  return res.json();
}

export async function fetchDeviceArp(
  deviceId: string
): Promise<{ success: boolean; arpEntries: ArpEntry[]; macTable: MacTableEntry[]; deviceName: string }> {
  const res = await fetch(`/api/devices/${deviceId}/arp`);
  if (!res.ok) throw new Error('Failed to fetch ARP/MAC table');
  return res.json();
}

export async function fetchDeviceNat(deviceId: string): Promise<{ success: boolean; data: NatSessionEntry[]; deviceName: string }> {
  const res = await fetch(`/api/devices/${deviceId}/nat`);
  if (!res.ok) throw new Error('Failed to fetch NAT sessions');
  return res.json();
}

export async function fetchDeviceDrift(deviceId: string): Promise<{ success: boolean; data: DriftReport; deviceName: string }> {
  const res = await fetch(`/api/devices/${deviceId}/drift`);
  if (!res.ok) throw new Error('Failed to fetch configuration drift report');
  return res.json();
}

export async function revertDeviceDrift(deviceId: string, userRole: UserRole = 'super_admin') {
  const res = await fetch(`/api/devices/${deviceId}/revert-drift`, {
    method: 'POST',
    headers: getHeaders(userRole),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to revert configuration drift');
  }
  return res.json();
}

export async function loadPresetTopology(presetId: string, userRole: UserRole = 'super_admin') {
  const res = await fetch('/api/topology/load-preset', {
    method: 'POST',
    headers: getHeaders(userRole),
    body: JSON.stringify({ presetId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load preset topology');
  }
  return res.json();
}

export async function createLink(link: Partial<NetworkLink>, userRole: UserRole = 'super_admin') {
  const res = await fetch('/api/links', {
    method: 'POST',
    headers: getHeaders(userRole),
    body: JSON.stringify(link),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create link');
  }
  return res.json();
}

export async function updateLink(id: string, updates: Partial<NetworkLink>, userRole: UserRole = 'super_admin') {
  const res = await fetch(`/api/links/${id}`, {
    method: 'PUT',
    headers: getHeaders(userRole),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update link');
  }
  return res.json();
}

export async function deleteLink(id: string, userRole: UserRole = 'super_admin') {
  const res = await fetch(`/api/links/${id}`, {
    method: 'DELETE',
    headers: getHeaders(userRole),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete link');
  }
  return res.json();
}

export async function commitDeviceConfig(
  id: string,
  config: string,
  description: string,
  author: string,
  userRole: UserRole = 'super_admin'
) {
  const res = await fetch(`/api/devices/${id}/config`, {
    method: 'POST',
    headers: getHeaders(userRole),
    body: JSON.stringify({ config, description, author }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to commit device configuration');
  }
  return res.json();
}

export async function saveDeviceConfig(id: string, userRole: UserRole = 'super_admin') {
  const res = await fetch(`/api/devices/${id}/save-config`, {
    method: 'POST',
    headers: getHeaders(userRole),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save configuration');
  }
  return res.json();
}

export async function rollbackDeviceConfig(id: string, version: number, userRole: UserRole = 'super_admin') {
  const res = await fetch(`/api/devices/${id}/rollback-config`, {
    method: 'POST',
    headers: getHeaders(userRole),
    body: JSON.stringify({ version }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to rollback configuration');
  }
  return res.json();
}

export async function injectFault(type: string, targetId: string, severity?: string, userRole: UserRole = 'super_admin') {
  const res = await fetch('/api/faults/inject', {
    method: 'POST',
    headers: getHeaders(userRole),
    body: JSON.stringify({ type, targetId, severity }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to inject fault');
  }
  return res.json();
}

export async function resolveFault(id: string, userRole: UserRole = 'super_admin') {
  const res = await fetch(`/api/faults/${id}/resolve`, {
    method: 'POST',
    headers: getHeaders(userRole),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to resolve fault');
  }
  return res.json();
}

export async function acknowledgeAlert(id: string, userRole: UserRole = 'super_admin') {
  const res = await fetch(`/api/alerts/${id}/acknowledge`, {
    method: 'POST',
    headers: getHeaders(userRole),
  });
  return res.json();
}

export async function resolveAlert(id: string, userRole: UserRole = 'super_admin') {
  const res = await fetch(`/api/alerts/${id}/resolve`, {
    method: 'POST',
    headers: getHeaders(userRole),
  });
  return res.json();
}

export async function runAutomation(
  workflowType: string,
  params: any,
  targetDeviceIds: string[],
  userRole: UserRole = 'super_admin'
) {
  const res = await fetch('/api/automation/execute', {
    method: 'POST',
    headers: getHeaders(userRole),
    body: JSON.stringify({ workflowType, params, targetDeviceIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Automation execution failed');
  }
  return res.json();
}

export async function runDiagnosticPing(sourceDeviceId: string, targetIp: string, count?: number) {
  const res = await fetch('/api/diagnostics/ping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceDeviceId, targetIp, count }),
  });
  return res.json();
}

export async function runDiagnosticTraceroute(sourceDeviceId: string, targetIp: string) {
  const res = await fetch('/api/diagnostics/traceroute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceDeviceId, targetIp }),
  });
  return res.json();
}

export async function askGeminiAssistant(prompt: string, selectedDeviceId?: string) {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, selectedDeviceId }),
  });
  return res.json();
}

export async function registerLocalAgent(token: string) {
  const res = await fetch('/api/agent/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentKey: token }),
  });
  return res.json();
}
