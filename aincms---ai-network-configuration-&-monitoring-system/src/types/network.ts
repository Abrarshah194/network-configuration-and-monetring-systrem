export type DeviceType = 'router' | 'switch_l2' | 'switch_l3' | 'host' | 'server' | 'firewall';
export type DeviceStatus = 'online' | 'degraded' | 'offline';

export interface DeviceInterface {
  id: string;
  name: string;
  ipAddress?: string;
  subnetMask?: string;
  macAddress: string;
  adminStatus: 'up' | 'down';
  operStatus: 'up' | 'down';
  mode?: 'access' | 'trunk';
  vlanId?: number;
  speedMbps: number;
  mtu: number;
}

export interface ConfigVersion {
  version: number;
  timestamp: string;
  description: string;
  author: string;
  config: string;
}

export interface NetworkDevice {
  id: string;
  name: string;
  type: DeviceType;
  managementIp: string;
  softwareProfile: string;
  status: DeviceStatus;
  uptimeSeconds: number;
  cpuPercent: number;
  memoryPercent: number;
  temperatureC: number;
  site: string;
  tags: string[];
  interfaces: DeviceInterface[];
  runningConfig: string;
  savedConfig: string;
  configVersions: ConfigVersion[];
}

export interface NetworkLink {
  id: string;
  sourceDeviceId: string;
  sourceInterfaceId: string;
  targetDeviceId: string;
  targetInterfaceId: string;
  bandwidthMbps: number;
  latencyMs: number;
  packetLossPercent: number;
  status: 'active' | 'degraded' | 'down';
  trafficFlowBps: number;
}

export interface NetworkAlert {
  id: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  deviceId?: string;
  linkId?: string;
  acknowledged: boolean;
  resolved: boolean;
  resolvedAt?: string;
}

export interface FaultEvent {
  id: string;
  firstDetected: string;
  lastObserved: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'link_failure' | 'high_latency' | 'packet_loss' | 'cpu_spike' | 'ip_conflict' | 'stp_loop' | 'drift';
  affectedDevices: string[];
  affectedLinks: string[];
  likelyCause: string;
  recommendedSteps: string[];
  status: 'active' | 'acknowledged' | 'resolved';
}

export interface AutomationJob {
  id: string;
  name: string;
  workflowType: string;
  status: 'pending' | 'preview' | 'running' | 'success' | 'failed' | 'rolled_back';
  createdAt: string;
  author: string;
  targetDeviceIds: string[];
  plan: string[];
  appliedChanges: { deviceId: string; diff: string }[];
  rollbackSupported: boolean;
}

export interface ProtocolStat {
  protocol: string;
  percentage: number;
  bytes: number;
}

export interface MetricSample {
  timestamp: string;
  totalThroughputMbps: number;
  avgLatencyMs: number;
  avgPacketLossPercent: number;
  activeLinksCount: number;
  devicesOnlineCount: number;
  cpuAvgPercent: number;
  memAvgPercent: number;
  protocolStats: ProtocolStat[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  details: string;
  status: 'success' | 'failure';
}

export interface LocalAgentStatus {
  connected: boolean;
  lastHeartbeat: string | null;
  agentVersion: string | null;
  dockerStatus: string;
  containerlabStatus: string;
  nodeCount: number;
  message: string;
}

export interface AppState {
  simulationMode: 'SIMULATION' | 'LOCAL_LAB';
  simulationState: 'RUNNING' | 'PAUSED';
  simulationSeed: number;
  virtualTick: number;
  clockMultiplier: number;
  activeLabId: string;
  devices: NetworkDevice[];
  links: NetworkLink[];
  alerts: NetworkAlert[];
  faults: FaultEvent[];
  automationJobs: AutomationJob[];
  auditLogs: AuditLog[];
  metricSamples: MetricSample[];
  localAgentStatus: LocalAgentStatus;
}

export type UserRole = 'super_admin' | 'network_admin' | 'viewer';

export interface RouteEntry {
  destination: string;
  netmask: string;
  nextHop: string;
  interfaceName: string;
  metric: number;
  protocol: 'C' | 'S' | 'O' | 'B'; // Connected, Static, OSPF, BGP
  description?: string;
}

export interface ArpEntry {
  ipAddress: string;
  macAddress: string;
  interfaceName: string;
  type: 'dynamic' | 'static';
  ageMinutes: number;
}

export interface MacTableEntry {
  vlanId: number;
  macAddress: string;
  port: string;
  type: 'DYNAMIC' | 'STATIC';
}

export interface NatSessionEntry {
  id: string;
  protocol: 'TCP' | 'UDP' | 'ICMP';
  insideLocal: string;
  insideGlobal: string;
  outsideLocal: string;
  outsideGlobal: string;
  state: 'ESTABLISHED' | 'TRANSLATING' | 'TIMED_OUT';
}

export interface DriftReport {
  hasDrift: boolean;
  driftCount: number;
  severity: 'none' | 'low' | 'medium' | 'high';
  differences: { type: 'added' | 'removed'; line: string }[];
  baselineTimestamp?: string;
  lastAudited: string;
}
