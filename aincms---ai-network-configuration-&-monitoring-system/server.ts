import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'aincms_state.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize Gemini client on server-side
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  aiClient = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Types for Backend Data
export type DeviceType = 'router' | 'switch_l2' | 'switch_l3' | 'host' | 'server' | 'firewall';
export type DeviceStatus = 'online' | 'degraded' | 'offline';

export interface DeviceInterface {
  id: string;
  name: string; // e.g. GigabitEthernet0/0, eth0
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
  configVersions: {
    version: number;
    timestamp: string;
    description: string;
    author: string;
    config: string;
  }[];
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

export interface MetricSample {
  timestamp: string;
  totalThroughputMbps: number;
  avgLatencyMs: number;
  avgPacketLossPercent: number;
  activeLinksCount: number;
  devicesOnlineCount: number;
  cpuAvgPercent: number;
  memAvgPercent: number;
  protocolStats: { protocol: string; percentage: number; bytes: number }[];
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

// Initial Sample Lab: Enterprise Small Office & Datacenter
function getInitialState(): AppState {
  const devices: NetworkDevice[] = [
    {
      id: 'dev-r1',
      name: 'HQ-Core-Router-01',
      type: 'router',
      managementIp: '192.168.100.1',
      softwareProfile: 'Simulated Cisco IOS-XR / FRR 9.1',
      status: 'online',
      uptimeSeconds: 124500,
      cpuPercent: 28,
      memoryPercent: 44,
      temperatureC: 41,
      site: 'Headquarters',
      tags: ['core', 'gateway', 'ospf-area-0'],
      interfaces: [
        {
          id: 'int-r1-g0',
          name: 'GigabitEthernet0/0',
          ipAddress: '10.0.1.1',
          subnetMask: '255.255.255.252',
          macAddress: '00:1A:2B:3C:4D:01',
          adminStatus: 'up',
          operStatus: 'up',
          speedMbps: 1000,
          mtu: 1500,
        },
        {
          id: 'int-r1-g1',
          name: 'GigabitEthernet0/1',
          ipAddress: '10.0.2.1',
          subnetMask: '255.255.255.252',
          macAddress: '00:1A:2B:3C:4D:02',
          adminStatus: 'up',
          operStatus: 'up',
          speedMbps: 1000,
          mtu: 1500,
        },
        {
          id: 'int-r1-lo0',
          name: 'Loopback0',
          ipAddress: '1.1.1.1',
          subnetMask: '255.255.255.255',
          macAddress: '00:1A:2B:3C:4D:03',
          adminStatus: 'up',
          operStatus: 'up',
          speedMbps: 10000,
          mtu: 1500,
        },
      ],
      runningConfig: `! HQ-Core-Router-01 Running Configuration
hostname HQ-Core-Router-01
!
interface Loopback0
 ip address 1.1.1.1 255.255.255.255
!
interface GigabitEthernet0/0
 description Uplink to Distribution Switch SW1
 ip address 10.0.1.1 255.255.255.252
 duplex full
 speed 1000
 no shutdown
!
interface GigabitEthernet0/1
 description Link to WAN Gateway Firewall FW1
 ip address 10.0.2.1 255.255.255.252
 duplex full
 speed 1000
 no shutdown
!
router ospf 1
 router-id 1.1.1.1
 network 10.0.1.0 0.0.0.3 area 0
 network 10.0.2.0 0.0.0.3 area 0
 network 1.1.1.1 0.0.0.0 area 0
!
ip route 0.0.0.0 0.0.0.0 10.0.2.2
!`,
      savedConfig: `! HQ-Core-Router-01 Running Configuration
hostname HQ-Core-Router-01
!
interface Loopback0
 ip address 1.1.1.1 255.255.255.255
!
interface GigabitEthernet0/0
 description Uplink to Distribution Switch SW1
 ip address 10.0.1.1 255.255.255.252
 duplex full
 speed 1000
 no shutdown
!
interface GigabitEthernet0/1
 description Link to WAN Gateway Firewall FW1
 ip address 10.0.2.1 255.255.255.252
 duplex full
 speed 1000
 no shutdown
!
router ospf 1
 router-id 1.1.1.1
 network 10.0.1.0 0.0.0.3 area 0
 network 10.0.2.0 0.0.0.3 area 0
 network 1.1.1.1 0.0.0.0 area 0
!
ip route 0.0.0.0 0.0.0.0 10.0.2.2
!`,
      configVersions: [
        {
          version: 1,
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          description: 'Initial deployment with OSPF area 0 and default route',
          author: 'abrarshah2134896@gmail.com',
          config: 'hostname HQ-Core-Router-01\n...',
        },
      ],
    },
    {
      id: 'dev-sw1',
      name: 'HQ-Dist-Switch-01',
      type: 'switch_l3',
      managementIp: '192.168.100.2',
      softwareProfile: 'Simulated Cisco Catalyst 3850 / OpenSwitch',
      status: 'online',
      uptimeSeconds: 154000,
      cpuPercent: 32,
      memoryPercent: 51,
      temperatureC: 43,
      site: 'Headquarters',
      tags: ['distribution', 'vlan-routing', 'spanning-tree'],
      interfaces: [
        {
          id: 'int-sw1-g0',
          name: 'GigabitEthernet1/0/1',
          ipAddress: '10.0.1.2',
          subnetMask: '255.255.255.252',
          macAddress: '00:1A:2B:4D:5E:01',
          adminStatus: 'up',
          operStatus: 'up',
          speedMbps: 1000,
          mtu: 1500,
        },
        {
          id: 'int-sw1-g1',
          name: 'GigabitEthernet1/0/2',
          macAddress: '00:1A:2B:4D:5E:02',
          adminStatus: 'up',
          operStatus: 'up',
          mode: 'trunk',
          speedMbps: 1000,
          mtu: 1500,
        },
        {
          id: 'int-sw1-vlan10',
          name: 'Vlan10',
          ipAddress: '192.168.10.1',
          subnetMask: '255.255.255.0',
          macAddress: '00:1A:2B:4D:5E:10',
          adminStatus: 'up',
          operStatus: 'up',
          vlanId: 10,
          speedMbps: 1000,
          mtu: 1500,
        },
        {
          id: 'int-sw1-vlan20',
          name: 'Vlan20',
          ipAddress: '192.168.20.1',
          subnetMask: '255.255.255.0',
          macAddress: '00:1A:2B:4D:5E:20',
          adminStatus: 'up',
          operStatus: 'up',
          vlanId: 20,
          speedMbps: 1000,
          mtu: 1500,
        },
      ],
      runningConfig: `! HQ-Dist-Switch-01 Running Configuration
hostname HQ-Dist-Switch-01
!
vlan 10
 name Staff_Engineering
!
vlan 20
 name Servers_Production
!
interface GigabitEthernet1/0/1
 description Link to HQ-Core-Router-01
 no switchport
 ip address 10.0.1.2 255.255.255.252
!
interface GigabitEthernet1/0/2
 description 802.1Q Trunk to Access Switch SW2
 switchport mode trunk
 switchport trunk allowed vlan 10,20
!
interface Vlan10
 description SVI Staff Gateway
 ip address 192.168.10.1 255.255.255.0
!
interface Vlan20
 description SVI Servers Gateway
 ip address 192.168.20.1 255.255.255.0
!
ip routing
router ospf 1
 network 10.0.1.0 0.0.0.3 area 0
 network 192.168.10.0 0.0.0.255 area 0
 network 192.168.20.0 0.0.0.255 area 0
!`,
      savedConfig: `! HQ-Dist-Switch-01 Running Configuration
hostname HQ-Dist-Switch-01
!
vlan 10
 name Staff_Engineering
!
vlan 20
 name Servers_Production
!
interface GigabitEthernet1/0/1
 description Link to HQ-Core-Router-01
 no switchport
 ip address 10.0.1.2 255.255.255.252
!
interface GigabitEthernet1/0/2
 description 802.1Q Trunk to Access Switch SW2
 switchport mode trunk
 switchport trunk allowed vlan 10,20
!
interface Vlan10
 description SVI Staff Gateway
 ip address 192.168.10.1 255.255.255.0
!
interface Vlan20
 description SVI Servers Gateway
 ip address 192.168.20.1 255.255.255.0
!
ip routing
router ospf 1
 network 10.0.1.0 0.0.0.3 area 0
 network 192.168.10.0 0.0.0.255 area 0
 network 192.168.20.0 0.0.0.255 area 0
!`,
      configVersions: [],
    },
    {
      id: 'dev-sw2',
      name: 'HQ-Access-Switch-02',
      type: 'switch_l2',
      managementIp: '192.168.100.3',
      softwareProfile: 'Simulated Cisco Catalyst 2960',
      status: 'online',
      uptimeSeconds: 98000,
      cpuPercent: 19,
      memoryPercent: 35,
      temperatureC: 39,
      site: 'Headquarters',
      tags: ['access', 'vlan-endpoints'],
      interfaces: [
        {
          id: 'int-sw2-uplink',
          name: 'FastEthernet0/24',
          macAddress: '00:1A:2B:5E:6F:24',
          adminStatus: 'up',
          operStatus: 'up',
          mode: 'trunk',
          speedMbps: 1000,
          mtu: 1500,
        },
        {
          id: 'int-sw2-fa1',
          name: 'FastEthernet0/1',
          macAddress: '00:1A:2B:5E:6F:01',
          adminStatus: 'up',
          operStatus: 'up',
          mode: 'access',
          vlanId: 10,
          speedMbps: 100,
          mtu: 1500,
        },
        {
          id: 'int-sw2-fa2',
          name: 'FastEthernet0/2',
          macAddress: '00:1A:2B:5E:6F:02',
          adminStatus: 'up',
          operStatus: 'up',
          mode: 'access',
          vlanId: 20,
          speedMbps: 100,
          mtu: 1500,
        },
      ],
      runningConfig: `! HQ-Access-Switch-02 Running Configuration
hostname HQ-Access-Switch-02
!
vlan 10
 name Staff_Engineering
!
vlan 20
 name Servers_Production
!
interface FastEthernet0/24
 description Trunk to Dist Switch SW1
 switchport mode trunk
!
interface FastEthernet0/1
 description Access port for Staff Workstation PC1
 switchport mode access
 switchport access vlan 10
 spanning-tree portfast
!
interface FastEthernet0/2
 description Access port for App Server SRV1
 switchport mode access
 switchport access vlan 20
 spanning-tree portfast
!`,
      savedConfig: `! HQ-Access-Switch-02 Running Configuration
hostname HQ-Access-Switch-02
!
vlan 10
 name Staff_Engineering
!
vlan 20
 name Servers_Production
!
interface FastEthernet0/24
 description Trunk to Dist Switch SW1
 switchport mode trunk
!
interface FastEthernet0/1
 description Access port for Staff Workstation PC1
 switchport mode access
 switchport access vlan 10
 spanning-tree portfast
!
interface FastEthernet0/2
 description Access port for App Server SRV1
 switchport mode access
 switchport access vlan 20
 spanning-tree portfast
!`,
      configVersions: [],
    },
    {
      id: 'dev-fw1',
      name: 'HQ-Edge-Firewall-01',
      type: 'firewall',
      managementIp: '192.168.100.254',
      softwareProfile: 'Simulated pfSense / iptables Security Gateway',
      status: 'online',
      uptimeSeconds: 210000,
      cpuPercent: 42,
      memoryPercent: 62,
      temperatureC: 45,
      site: 'Perimeter',
      tags: ['firewall', 'nat', 'acl-filtering'],
      interfaces: [
        {
          id: 'int-fw1-inside',
          name: 'eth0 (Inside)',
          ipAddress: '10.0.2.2',
          subnetMask: '255.255.255.252',
          macAddress: '00:1A:2B:7F:8A:01',
          adminStatus: 'up',
          operStatus: 'up',
          speedMbps: 1000,
          mtu: 1500,
        },
        {
          id: 'int-fw1-outside',
          name: 'eth1 (Outside WAN)',
          ipAddress: '203.0.113.10',
          subnetMask: '255.255.255.0',
          macAddress: '00:1A:2B:7F:8A:02',
          adminStatus: 'up',
          operStatus: 'up',
          speedMbps: 1000,
          mtu: 1500,
        },
      ],
      runningConfig: `! HQ-Edge-Firewall-01 Simulated Security Policy
hostname HQ-Edge-Firewall-01
!
interface eth0 inside
 ip address 10.0.2.2 255.255.255.252
!
interface eth1 outside
 ip address 203.0.113.10 255.255.255.0
!
access-list 101 permit tcp 192.168.10.0 0.0.0.255 any eq 443
access-list 101 permit tcp 192.168.10.0 0.0.0.255 any eq 80
access-list 101 permit udp 192.168.10.0 0.0.0.255 any eq 53
access-list 101 deny ip any any log
!
ip nat inside source list 101 interface eth1 overload
!`,
      savedConfig: `! HQ-Edge-Firewall-01 Simulated Security Policy
hostname HQ-Edge-Firewall-01
!
interface eth0 inside
 ip address 10.0.2.2 255.255.255.252
!
interface eth1 outside
 ip address 203.0.113.10 255.255.255.0
!
access-list 101 permit tcp 192.168.10.0 0.0.0.255 any eq 443
access-list 101 permit tcp 192.168.10.0 0.0.0.255 any eq 80
access-list 101 permit udp 192.168.10.0 0.0.0.255 any eq 53
access-list 101 deny ip any any log
!
ip nat inside source list 101 interface eth1 overload
!`,
      configVersions: [],
    },
    {
      id: 'dev-srv1',
      name: 'Prod-Database-Server-01',
      type: 'server',
      managementIp: '192.168.20.10',
      softwareProfile: 'Simulated Ubuntu 24.04 LTS (PostgreSQL / Web)',
      status: 'online',
      uptimeSeconds: 310000,
      cpuPercent: 48,
      memoryPercent: 68,
      temperatureC: 44,
      site: 'Server Room A',
      tags: ['server', 'production', 'vlan-20'],
      interfaces: [
        {
          id: 'int-srv1-eth0',
          name: 'eth0',
          ipAddress: '192.168.20.10',
          subnetMask: '255.255.255.0',
          macAddress: '00:1A:2B:99:AA:01',
          adminStatus: 'up',
          operStatus: 'up',
          speedMbps: 1000,
          mtu: 1500,
        },
      ],
      runningConfig: `# Network configuration: /etc/netplan/01-netcfg.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      addresses: [192.168.20.10/24]
      routes:
        - to: default
          via: 192.168.20.1
      nameservers:
        addresses: [1.1.1.1, 8.8.8.8]`,
      savedConfig: `# Network configuration: /etc/netplan/01-netcfg.yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      addresses: [192.168.20.10/24]
      routes:
        - to: default
          via: 192.168.20.1
      nameservers:
        addresses: [1.1.1.1, 8.8.8.8]`,
      configVersions: [],
    },
    {
      id: 'dev-pc1',
      name: 'Staff-Workstation-PC-01',
      type: 'host',
      managementIp: '192.168.10.15',
      softwareProfile: 'Simulated Windows 11 Enterprise (Client Host)',
      status: 'online',
      uptimeSeconds: 43200,
      cpuPercent: 12,
      memoryPercent: 29,
      temperatureC: 36,
      site: 'Office Floor 2',
      tags: ['client', 'vlan-10', 'engineering'],
      interfaces: [
        {
          id: 'int-pc1-eth0',
          name: 'Ethernet0',
          ipAddress: '192.168.10.15',
          subnetMask: '255.255.255.0',
          macAddress: '00:1A:2B:CC:DD:01',
          adminStatus: 'up',
          operStatus: 'up',
          speedMbps: 100,
          mtu: 1500,
        },
      ],
      runningConfig: `ipconfig /all
IPv4 Address: 192.168.10.15
Subnet Mask: 255.255.255.0
Default Gateway: 192.168.10.1
DNS Servers: 1.1.1.1, 8.8.8.8
DHCP Enabled: Yes`,
      savedConfig: `ipconfig /all
IPv4 Address: 192.168.10.15
Subnet Mask: 255.255.255.0
Default Gateway: 192.168.10.1
DNS Servers: 1.1.1.1, 8.8.8.8
DHCP Enabled: Yes`,
      configVersions: [],
    },
  ];

  const links: NetworkLink[] = [
    {
      id: 'link-r1-fw1',
      sourceDeviceId: 'dev-r1',
      sourceInterfaceId: 'int-r1-g1',
      targetDeviceId: 'dev-fw1',
      targetInterfaceId: 'int-fw1-inside',
      bandwidthMbps: 1000,
      latencyMs: 1.2,
      packetLossPercent: 0.0,
      status: 'active',
      trafficFlowBps: 18500000,
    },
    {
      id: 'link-r1-sw1',
      sourceDeviceId: 'dev-r1',
      sourceInterfaceId: 'int-r1-g0',
      targetDeviceId: 'dev-sw1',
      targetInterfaceId: 'int-sw1-g0',
      bandwidthMbps: 1000,
      latencyMs: 0.8,
      packetLossPercent: 0.0,
      status: 'active',
      trafficFlowBps: 42000000,
    },
    {
      id: 'link-sw1-sw2',
      sourceDeviceId: 'dev-sw1',
      sourceInterfaceId: 'int-sw1-g1',
      targetDeviceId: 'dev-sw2',
      targetInterfaceId: 'int-sw2-uplink',
      bandwidthMbps: 1000,
      latencyMs: 0.5,
      packetLossPercent: 0.0,
      status: 'active',
      trafficFlowBps: 24000000,
    },
    {
      id: 'link-sw2-srv1',
      sourceDeviceId: 'dev-sw2',
      sourceInterfaceId: 'int-sw2-fa2',
      targetDeviceId: 'dev-srv1',
      targetInterfaceId: 'int-srv1-eth0',
      bandwidthMbps: 100,
      latencyMs: 0.3,
      packetLossPercent: 0.0,
      status: 'active',
      trafficFlowBps: 12500000,
    },
    {
      id: 'link-sw2-pc1',
      sourceDeviceId: 'dev-sw2',
      sourceInterfaceId: 'int-sw2-fa1',
      targetDeviceId: 'dev-pc1',
      targetInterfaceId: 'int-pc1-eth0',
      bandwidthMbps: 100,
      latencyMs: 0.4,
      packetLossPercent: 0.0,
      status: 'active',
      trafficFlowBps: 6200000,
    },
  ];

  const alerts: NetworkAlert[] = [
    {
      id: 'alert-1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      severity: 'info',
      title: 'OSPF Adjacency Full',
      message: 'Neighbor 1.1.1.1 on HQ-Dist-Switch-01 transitioned to FULL state.',
      deviceId: 'dev-sw1',
      acknowledged: true,
      resolved: true,
      resolvedAt: new Date(Date.now() - 3550000).toISOString(),
    },
    {
      id: 'alert-2',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      severity: 'warning',
      title: 'Access Port Utilization Alert',
      message: 'Link between HQ-Access-Switch-02 and Staff-Workstation-PC-01 exceeded 60% burst threshold.',
      deviceId: 'dev-sw2',
      acknowledged: false,
      resolved: false,
    },
  ];

  const faults: FaultEvent[] = [];

  const automationJobs: AutomationJob[] = [
    {
      id: 'auto-job-1',
      name: 'VLAN 10 Provisioning & Security Hardening',
      workflowType: 'vlan_provisioning',
      status: 'success',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      author: 'abrarshah2134896@gmail.com',
      targetDeviceIds: ['dev-sw1', 'dev-sw2'],
      plan: [
        'Validate VLAN 10 ID and Subnet boundaries (192.168.10.0/24)',
        'Check Trunk link between SW1 and SW2 for 802.1Q encapsulation',
        'Apply SVI gateway config to HQ-Dist-Switch-01',
        'Verify Spanning-Tree PortFast on access ports',
      ],
      appliedChanges: [
        {
          deviceId: 'dev-sw1',
          diff: '+ vlan 10 name Staff_Engineering\n+ interface Vlan10 ip address 192.168.10.1 255.255.255.0',
        },
      ],
      rollbackSupported: true,
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'audit-01',
      timestamp: new Date(Date.now() - 86000000).toISOString(),
      actor: 'SuperAdmin (system)',
      action: 'INIT_SIMULATION',
      resource: 'HQ-Core-Router-01',
      details: 'Deterministic simulation engine initialized with seed #42',
      status: 'success',
    },
    {
      id: 'audit-02',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      actor: 'NetworkAdmin (abrarshah2134896@gmail.com)',
      action: 'APPLY_AUTOMATION',
      resource: 'HQ-Dist-Switch-01',
      details: 'Applied workflow: VLAN 10 Provisioning & Security Hardening',
      status: 'success',
    },
  ];

  // Seed historical metric samples
  const metricSamples: MetricSample[] = [];
  const now = Date.now();
  for (let i = 20; i >= 0; i--) {
    const t = new Date(now - i * 60000).toISOString();
    metricSamples.push({
      timestamp: t,
      totalThroughputMbps: Math.round(95 + Math.sin(i * 0.5) * 25 + (i % 3) * 5),
      avgLatencyMs: parseFloat((1.1 + Math.sin(i * 0.3) * 0.4).toFixed(2)),
      avgPacketLossPercent: 0.0,
      activeLinksCount: 5,
      devicesOnlineCount: 6,
      cpuAvgPercent: Math.round(28 + Math.cos(i * 0.4) * 8),
      memAvgPercent: 47,
      protocolStats: [
        { protocol: 'HTTPS (TCP/443)', percentage: 54, bytes: 42000000 },
        { protocol: 'DNS (UDP/53)', percentage: 14, bytes: 11000000 },
        { protocol: 'SSH (TCP/22)', percentage: 12, bytes: 9400000 },
        { protocol: 'OSPF (IP/89)', percentage: 8, bytes: 6200000 },
        { protocol: 'ICMP (Echo)', percentage: 12, bytes: 9300000 },
      ],
    });
  }

  return {
    simulationMode: 'SIMULATION', // 'SIMULATION' or 'LOCAL_LAB'
    simulationState: 'RUNNING', // 'RUNNING' | 'PAUSED'
    simulationSeed: 42,
    virtualTick: 120,
    clockMultiplier: 1,
    activeLabId: 'lab-enterprise-campus',
    devices,
    links,
    alerts,
    faults,
    automationJobs,
    auditLogs,
    metricSamples,
    localAgentStatus: {
      connected: false,
      lastHeartbeat: null,
      agentVersion: null,
      dockerStatus: 'unavailable',
      containerlabStatus: 'unavailable',
      nodeCount: 0,
      message: 'Mode A Software Simulation is active. Local Agent Bridge is disconnected.',
    },
  };
}

// State storage
let appState = getInitialState();

// Load from disk if available
if (fs.existsSync(STATE_FILE)) {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    appState = JSON.parse(raw);
    console.log('Loaded persisted simulation state from disk.');
  } catch (err) {
    console.warn('Could not parse persisted state, using initial state.', err);
  }
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(appState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save state to disk:', err);
  }
}

// Pseudo-random number generator for deterministic simulation
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

let rng = new SeededRandom(appState.simulationSeed || 42);

// Background Simulation Tick (Runs every 3 seconds)
setInterval(() => {
  if (appState.simulationState !== 'RUNNING') return;

  appState.virtualTick += 1;
  const tick = appState.virtualTick;

  // Update device metrics with bounded variance
  appState.devices.forEach((dev) => {
    if (dev.status === 'offline') {
      dev.cpuPercent = 0;
      dev.memoryPercent = 0;
      return;
    }
    dev.uptimeSeconds += 3 * (appState.clockMultiplier || 1);
    
    // CPU jitter based on role
    const baseCpu = dev.type === 'router' ? 26 : dev.type === 'firewall' ? 38 : dev.type === 'server' ? 44 : 18;
    const jitter = Math.sin(tick * 0.1 + dev.id.charCodeAt(dev.id.length - 1)) * 8;
    dev.cpuPercent = Math.min(100, Math.max(5, Math.round(baseCpu + jitter)));

    // Memory variance
    const baseMem = dev.type === 'server' ? 65 : dev.type === 'firewall' ? 58 : 42;
    dev.memoryPercent = Math.min(95, Math.max(20, Math.round(baseMem + Math.cos(tick * 0.05) * 4)));
  });

  // Evaluate Fault Engine & Link Statuses
  let totalThroughput = 0;
  let totalLatency = 0;
  let activeLinks = 0;
  let totalDrops = 0;

  appState.links.forEach((link) => {
    if (link.status === 'down') {
      link.trafficFlowBps = 0;
      link.latencyMs = 0;
      link.packetLossPercent = 100;
      return;
    }

    activeLinks += 1;
    // Bounded throughput
    const baseFlow = link.bandwidthMbps > 500 ? 35000000 : 8000000;
    const wave = Math.sin(tick * 0.2 + link.id.length) * 5000000;
    link.trafficFlowBps = Math.max(500000, Math.round(baseFlow + wave));
    totalThroughput += link.trafficFlowBps / 1000000;

    if (link.status === 'degraded') {
      link.latencyMs = parseFloat((35.0 + Math.sin(tick * 0.3) * 15).toFixed(2));
      link.packetLossPercent = parseFloat((12.5 + Math.cos(tick * 0.2) * 5).toFixed(2));
      totalDrops += 1;
    } else {
      link.latencyMs = parseFloat((0.8 + Math.sin(tick * 0.1) * 0.3).toFixed(2));
      link.packetLossPercent = 0.0;
    }
    totalLatency += link.latencyMs;
  });

  const avgLatency = activeLinks > 0 ? parseFloat((totalLatency / activeLinks).toFixed(2)) : 0;
  const avgLoss = activeLinks > 0 ? parseFloat(((totalDrops / activeLinks) * 10).toFixed(2)) : 0;

  // Add metric sample every 2 ticks (6s)
  if (tick % 2 === 0) {
    const sample: MetricSample = {
      timestamp: new Date().toISOString(),
      totalThroughputMbps: Math.round(totalThroughput),
      avgLatencyMs: avgLatency,
      avgPacketLossPercent: avgLoss,
      activeLinksCount: activeLinks,
      devicesOnlineCount: appState.devices.filter((d) => d.status === 'online').length,
      cpuAvgPercent: Math.round(appState.devices.reduce((acc, d) => acc + d.cpuPercent, 0) / appState.devices.length),
      memAvgPercent: Math.round(appState.devices.reduce((acc, d) => acc + d.memoryPercent, 0) / appState.devices.length),
      protocolStats: [
        { protocol: 'HTTPS (TCP/443)', percentage: 52 + Math.round(Math.sin(tick) * 3), bytes: Math.round(totalThroughput * 520000) },
        { protocol: 'DNS (UDP/53)', percentage: 16, bytes: Math.round(totalThroughput * 160000) },
        { protocol: 'SSH (TCP/22)', percentage: 12, bytes: Math.round(totalThroughput * 120000) },
        { protocol: 'OSPF (IP/89)', percentage: 8, bytes: Math.round(totalThroughput * 80000) },
        { protocol: 'ICMP (Echo)', percentage: 12, bytes: Math.round(totalThroughput * 120000) },
      ],
    };

    appState.metricSamples.push(sample);
    // Keep last 40 samples to bound storage
    if (appState.metricSamples.length > 40) {
      appState.metricSamples.shift();
    }
  }

  // Auto-detect threshold violations (Fault Detection Engine)
  appState.devices.forEach((dev) => {
    if (dev.cpuPercent > 88 && dev.status === 'online') {
      const existing = appState.faults.find((f) => f.category === 'cpu_spike' && f.affectedDevices.includes(dev.id) && f.status === 'active');
      if (!existing) {
        const fault: FaultEvent = {
          id: `fault-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          firstDetected: new Date().toISOString(),
          lastObserved: new Date().toISOString(),
          severity: 'warning',
          category: 'cpu_spike',
          affectedDevices: [dev.id],
          affectedLinks: [],
          likelyCause: `CPU threshold exceeded (${dev.cpuPercent}%). High packet inspection or process runaway on ${dev.name}.`,
          recommendedSteps: ['Inspect top running processes via CLI', 'Check control plane traffic rate', 'Consider QoS rate-limiting'],
          status: 'active',
        };
        appState.faults.unshift(fault);

        appState.alerts.unshift({
          id: `alert-${Date.now()}`,
          timestamp: new Date().toISOString(),
          severity: 'warning',
          title: `CPU Utilization Spike on ${dev.name}`,
          message: `Device reported ${dev.cpuPercent}% CPU load exceeding 85% warning threshold.`,
          deviceId: dev.id,
          acknowledged: false,
          resolved: false,
        });
      }
    }
  });
}, 3000);

// Network Calculation Helpers (Routing Table, ARP, NAT, Drift)
function getNetworkPrefix(ip: string, mask: string): string {
  try {
    const ipParts = ip.split('.').map(Number);
    const maskParts = mask.split('.').map(Number);
    const netParts = ipParts.map((p, idx) => p & (maskParts[idx] ?? 255));
    return netParts.join('.');
  } catch {
    return ip;
  }
}

function getDeviceRoutingTable(dev: NetworkDevice, allDevices: NetworkDevice[], links: NetworkLink[]) {
  const routes: any[] = [];

  // Directly connected routes (protocol 'C')
  dev.interfaces.forEach((intf) => {
    if (intf.ipAddress && intf.subnetMask && intf.operStatus === 'up') {
      const prefix = getNetworkPrefix(intf.ipAddress, intf.subnetMask);
      routes.push({
        destination: prefix,
        netmask: intf.subnetMask,
        nextHop: 'Directly Connected',
        interfaceName: intf.name,
        metric: 0,
        protocol: 'C',
        description: `Directly connected via ${intf.name}`,
      });
    }
  });

  // Static routes parsed from runningConfig: 'ip route <dest> <mask> <nextHop>'
  const staticMatches = dev.runningConfig.matchAll(/ip\s+route\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)/g);
  for (const match of staticMatches) {
    routes.push({
      destination: match[1],
      netmask: match[2],
      nextHop: match[3],
      interfaceName: dev.interfaces[0]?.name || 'eth0',
      metric: 1,
      protocol: 'S',
      description: 'Static Route',
    });
  }

  // OSPF dynamic routes (protocol 'O')
  if (dev.runningConfig.includes('router ospf')) {
    const neighborLinks = links.filter(
      (l) => (l.sourceDeviceId === dev.id || l.targetDeviceId === dev.id) && l.status === 'active'
    );
    neighborLinks.forEach((link) => {
      const neighborId = link.sourceDeviceId === dev.id ? link.targetDeviceId : link.sourceDeviceId;
      const neighbor = allDevices.find((d) => d.id === neighborId);
      if (neighbor && neighbor.runningConfig.includes('router ospf')) {
        neighbor.interfaces.forEach((nIntf) => {
          if (nIntf.ipAddress && nIntf.subnetMask) {
            const nPrefix = getNetworkPrefix(nIntf.ipAddress, nIntf.subnetMask);
            const exists = routes.some((r) => r.destination === nPrefix);
            if (!exists) {
              const myIntfId = link.sourceDeviceId === dev.id ? link.sourceInterfaceId : link.targetInterfaceId;
              const myIntf = dev.interfaces.find((i) => i.id === myIntfId);
              routes.push({
                destination: nPrefix,
                netmask: nIntf.subnetMask,
                nextHop: nIntf.ipAddress,
                interfaceName: myIntf?.name || 'GigabitEthernet0/0',
                metric: 110,
                protocol: 'O',
                description: `OSPF Intra-Area (Neighbor: ${neighbor.name})`,
              });
            }
          }
        });
      }
    });
  }

  return routes;
}

function getDeviceArpTable(dev: NetworkDevice, allDevices: NetworkDevice[], links: NetworkLink[]) {
  const arpEntries: any[] = [];
  const connectedLinks = links.filter(
    (l) => (l.sourceDeviceId === dev.id || l.targetDeviceId === dev.id) && l.status !== 'down'
  );

  connectedLinks.forEach((link) => {
    const peerId = link.sourceDeviceId === dev.id ? link.targetDeviceId : link.sourceDeviceId;
    const peer = allDevices.find((d) => d.id === peerId);
    if (peer) {
      peer.interfaces.forEach((pi) => {
        if (pi.ipAddress) {
          const localIntfId = link.sourceDeviceId === dev.id ? link.sourceInterfaceId : link.targetInterfaceId;
          const localIntf = dev.interfaces.find((i) => i.id === localIntfId);
          arpEntries.push({
            ipAddress: pi.ipAddress,
            macAddress: pi.macAddress,
            interfaceName: localIntf?.name || 'GigabitEthernet0/0',
            type: 'dynamic',
            ageMinutes: Math.floor(Math.random() * 12) + 2,
          });
        }
      });
    }
  });

  const macTable: any[] = [];
  if (dev.type.startsWith('switch')) {
    allDevices.forEach((otherDev) => {
      if (otherDev.id !== dev.id) {
        otherDev.interfaces.forEach((oi) => {
          macTable.push({
            vlanId: oi.vlanId || (dev.id === 'dev-sw2' && oi.name.includes('fa2') ? 20 : 10),
            macAddress: oi.macAddress,
            port: dev.interfaces[0]?.name || 'FastEthernet0/1',
            type: 'DYNAMIC',
          });
        });
      }
    });
  }

  return { arpEntries, macTable };
}

function getDeviceNatSessions(dev: NetworkDevice) {
  if (dev.type !== 'firewall' && !dev.runningConfig.includes('nat')) {
    return [];
  }
  return [
    {
      id: 'nat-sess-1',
      protocol: 'TCP',
      insideLocal: '192.168.10.15:52410',
      insideGlobal: '203.0.113.10:52410',
      outsideLocal: '1.1.1.1:443',
      outsideGlobal: '1.1.1.1:443',
      state: 'ESTABLISHED',
    },
    {
      id: 'nat-sess-2',
      protocol: 'UDP',
      insideLocal: '192.168.10.15:53001',
      insideGlobal: '203.0.113.10:53001',
      outsideLocal: '8.8.8.8:53',
      outsideGlobal: '8.8.8.8:53',
      state: 'TRANSLATING',
    },
    {
      id: 'nat-sess-3',
      protocol: 'TCP',
      insideLocal: '192.168.20.10:80',
      insideGlobal: '203.0.113.10:8080',
      outsideLocal: '198.51.100.4:41200',
      outsideGlobal: '198.51.100.4:41200',
      state: 'ESTABLISHED',
    },
  ];
}

function getDeviceDrift(dev: NetworkDevice) {
  const runningLines = dev.runningConfig.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('!'));
  const savedLines = (dev.savedConfig || '').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('!'));

  const runningSet = new Set(runningLines);
  const savedSet = new Set(savedLines);

  const added = runningLines.filter((l) => !savedSet.has(l)).map((line) => ({ type: 'added' as const, line }));
  const removed = savedLines.filter((l) => !runningSet.has(l)).map((line) => ({ type: 'removed' as const, line }));
  const differences = [...added, ...removed];

  const hasDrift = differences.length > 0;
  const driftCount = differences.length;
  const severity = driftCount === 0 ? 'none' : driftCount > 4 ? 'high' : driftCount > 1 ? 'medium' : 'low';

  return {
    hasDrift,
    driftCount,
    severity,
    differences,
    lastAudited: new Date().toISOString(),
  };
}

// Set up Express app
async function createServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Role-Based Access Control Authorization Middleware
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const role = (req.headers['x-user-role'] as string) || 'super_admin';
    if (role === 'viewer') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Read-Only Viewer role is not authorized to modify network devices, configurations, or simulation state.',
      });
    }
    next();
  };

  // REST API Routes
  const router = express.Router();

  // GET /api/state - Full State for Client
  router.get('/state', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: appState,
      geminiConfigured: !!geminiApiKey,
    });
  });

  // POST /api/simulation/control - Pause/Resume/Reset/Seed
  router.post('/simulation/control', (req: Request, res: Response) => {
    const role = (req.headers['x-user-role'] as string) || 'super_admin';
    const { action, seed, multiplier } = req.body;

    if ((action === 'reset' || seed !== undefined) && role === 'viewer') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Viewers cannot reset or reseed the simulation core.',
      });
    }

    if (action === 'pause') {
      appState.simulationState = 'PAUSED';
    } else if (action === 'resume') {
      appState.simulationState = 'RUNNING';
    } else if (action === 'reset') {
      appState = getInitialState();
      rng = new SeededRandom(appState.simulationSeed);
      saveState();
    } else if (action === 'step') {
      appState.virtualTick += 1;
    }
    if (seed !== undefined) {
      appState.simulationSeed = Number(seed);
      rng = new SeededRandom(Number(seed));
    }
    if (multiplier !== undefined) {
      appState.clockMultiplier = Number(multiplier);
    }

    appState.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Admin',
      action: 'SIMULATION_CONTROL',
      resource: 'Engine',
      details: `Action: ${action}, Seed: ${appState.simulationSeed}, Multiplier: ${appState.clockMultiplier}`,
      status: 'success',
    });

    saveState();
    res.json({ success: true, state: appState.simulationState, seed: appState.simulationSeed });
  });

  // DEVICE CRUD
  router.get('/devices', (req: Request, res: Response) => {
    res.json({ success: true, data: appState.devices });
  });

  router.post('/devices', requireAdmin, (req: Request, res: Response) => {
    const device: NetworkDevice = req.body;
    if (!device.name || !device.managementIp) {
      return res.status(400).json({ success: false, error: 'Name and Management IP are required' });
    }

    // Check duplicate IP or ID
    if (appState.devices.some((d) => d.id === device.id || d.managementIp === device.managementIp)) {
      return res.status(400).json({ success: false, error: 'Device ID or Management IP already exists' });
    }

    device.uptimeSeconds = 0;
    device.cpuPercent = 15;
    device.memoryPercent = 30;
    device.temperatureC = 38;
    device.status = 'online';
    device.configVersions = [
      {
        version: 1,
        timestamp: new Date().toISOString(),
        description: 'Initial device creation',
        author: 'Administrator',
        config: device.runningConfig || `hostname ${device.name}\n!`,
      },
    ];

    appState.devices.push(device);
    appState.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: (req.headers['x-user-role'] as string) || 'Admin',
      action: 'CREATE_DEVICE',
      resource: device.name,
      details: `Created ${device.type} with management IP ${device.managementIp}`,
      status: 'success',
    });

    saveState();
    res.status(201).json({ success: true, data: device });
  });

  // BULK IMPORT DEVICES
  router.post('/devices/bulk-import', requireAdmin, (req: Request, res: Response) => {
    const { devices } = req.body;
    if (!Array.isArray(devices) || devices.length === 0) {
      return res.status(400).json({ success: false, error: 'Expected non-empty array of devices' });
    }

    let addedCount = 0;
    const errors: string[] = [];

    devices.forEach((dev: any) => {
      if (!dev.name || !dev.managementIp) {
        errors.push(`Skipped device: missing name or management IP`);
        return;
      }
      if (appState.devices.some((d) => d.id === dev.id || d.managementIp === dev.managementIp)) {
        errors.push(`Skipped ${dev.name}: duplicate ID (${dev.id}) or IP (${dev.managementIp})`);
        return;
      }

      const newDev: NetworkDevice = {
        id: dev.id || `dev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: dev.name,
        type: dev.type || 'host',
        managementIp: dev.managementIp,
        softwareProfile: dev.softwareProfile || 'Simulated Linux Host',
        status: dev.status || 'online',
        uptimeSeconds: 0,
        cpuPercent: 12,
        memoryPercent: 25,
        temperatureC: 37,
        site: dev.site || 'Datacenter',
        tags: Array.isArray(dev.tags) ? dev.tags : ['imported'],
        interfaces: Array.isArray(dev.interfaces) && dev.interfaces.length > 0 ? dev.interfaces : [
          {
            id: `int-${dev.id || 'dev'}-eth0`,
            name: 'eth0',
            ipAddress: dev.managementIp,
            subnetMask: '255.255.255.0',
            macAddress: `00:1A:2B:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:01`,
            adminStatus: 'up',
            operStatus: 'up',
            speedMbps: 1000,
            mtu: 1500,
          }
        ],
        runningConfig: dev.runningConfig || `hostname ${dev.name}\n!`,
        savedConfig: dev.savedConfig || `hostname ${dev.name}\n!`,
        configVersions: [],
      };

      appState.devices.push(newDev);
      addedCount++;
    });

    appState.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: (req.headers['x-user-role'] as string) || 'Admin',
      action: 'BULK_IMPORT',
      resource: 'DeviceInventory',
      details: `Bulk imported ${addedCount} devices (${errors.length} skipped)`,
      status: 'success',
    });

    saveState();
    res.json({ success: true, addedCount, errors });
  });

  router.put('/devices/:id', requireAdmin, (req: Request, res: Response) => {
    const id = req.params.id;
    const index = appState.devices.findIndex((d) => d.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    const current = appState.devices[index];
    const updated = { ...current, ...req.body, id: current.id };
    appState.devices[index] = updated;

    appState.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: (req.headers['x-user-role'] as string) || 'Admin',
      action: 'UPDATE_DEVICE',
      resource: current.name,
      details: `Updated parameters for device ${current.name}`,
      status: 'success',
    });

    saveState();
    res.json({ success: true, data: updated });
  });

  router.delete('/devices/:id', requireAdmin, (req: Request, res: Response) => {
    const id = req.params.id;
    const device = appState.devices.find((d) => d.id === id);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    // Remove connected links
    appState.links = appState.links.filter((l) => l.sourceDeviceId !== id && l.targetDeviceId !== id);
    // Remove device
    appState.devices = appState.devices.filter((d) => d.id !== id);

    appState.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: (req.headers['x-user-role'] as string) || 'Admin',
      action: 'DELETE_DEVICE',
      resource: device.name,
      details: `Removed device ${device.name} and cascaded associated links`,
      status: 'success',
    });

    saveState();
    res.json({ success: true, message: `Device ${device.name} removed successfully` });
  });

  // ROUTING TABLE VIEWER
  router.get('/devices/:id/routes', (req: Request, res: Response) => {
    const id = req.params.id;
    const device = appState.devices.find((d) => d.id === id);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    const routes = getDeviceRoutingTable(device, appState.devices, appState.links);
    res.json({ success: true, data: routes, deviceName: device.name });
  });

  // ARP TABLE & MAC FORWARDING VIEWER
  router.get('/devices/:id/arp', (req: Request, res: Response) => {
    const id = req.params.id;
    const device = appState.devices.find((d) => d.id === id);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    const { arpEntries, macTable } = getDeviceArpTable(device, appState.devices, appState.links);
    res.json({ success: true, arpEntries, macTable, deviceName: device.name });
  });

  // NAT/PAT TRANSLATIONS VIEWER
  router.get('/devices/:id/nat', (req: Request, res: Response) => {
    const id = req.params.id;
    const device = appState.devices.find((d) => d.id === id);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    const sessions = getDeviceNatSessions(device);
    res.json({ success: true, data: sessions, deviceName: device.name });
  });

  // CONFIGURATION DRIFT DETECTION
  router.get('/devices/:id/drift', (req: Request, res: Response) => {
    const id = req.params.id;
    const device = appState.devices.find((d) => d.id === id);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    const report = getDeviceDrift(device);
    res.json({ success: true, data: report, deviceName: device.name });
  });

  // REVERT CONFIGURATION DRIFT
  router.post('/devices/:id/revert-drift', requireAdmin, (req: Request, res: Response) => {
    const id = req.params.id;
    const device = appState.devices.find((d) => d.id === id);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    device.runningConfig = device.savedConfig;
    device.configVersions.unshift({
      version: (device.configVersions?.length || 0) + 1,
      timestamp: new Date().toISOString(),
      description: 'Automated drift remediation: reverted running-config to saved startup-config',
      author: (req.headers['x-user-role'] as string) || 'Admin',
      config: device.savedConfig,
    });

    appState.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: (req.headers['x-user-role'] as string) || 'Admin',
      action: 'REVERT_DRIFT',
      resource: device.name,
      details: 'Overwrote drifted running-config with certified startup baseline',
      status: 'success',
    });

    saveState();
    res.json({ success: true, device });
  });

  // LINK CRUD
  router.get('/links', (req: Request, res: Response) => {
    res.json({ success: true, data: appState.links });
  });

  router.post('/links', requireAdmin, (req: Request, res: Response) => {
    const link: NetworkLink = req.body;
    if (!link.sourceDeviceId || !link.targetDeviceId) {
      return res.status(400).json({ success: false, error: 'Source and target devices are required' });
    }
    link.id = link.id || `link-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    link.status = link.status || 'active';
    link.latencyMs = link.latencyMs || 0.8;
    link.bandwidthMbps = link.bandwidthMbps || 1000;
    link.packetLossPercent = 0.0;
    link.trafficFlowBps = 10000000;

    appState.links.push(link);
    saveState();
    res.status(201).json({ success: true, data: link });
  });

  router.put('/links/:id', requireAdmin, (req: Request, res: Response) => {
    const id = req.params.id;
    const index = appState.links.findIndex((l) => l.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }

    appState.links[index] = { ...appState.links[index], ...req.body, id };
    saveState();
    res.json({ success: true, data: appState.links[index] });
  });

  router.delete('/links/:id', requireAdmin, (req: Request, res: Response) => {
    const id = req.params.id;
    appState.links = appState.links.filter((l) => l.id !== id);
    saveState();
    res.json({ success: true });
  });

  // LOAD PRESET TOPOLOGY
  router.post('/topology/load-preset', requireAdmin, (req: Request, res: Response) => {
    const { presetId } = req.body;
    if (presetId === 'ospf-triangle') {
      // 3-Router OSPF Ring
      appState.devices = [
        {
          id: 'dev-ospf-r1',
          name: 'OSPF-Router-A',
          type: 'router',
          managementIp: '10.255.0.1',
          softwareProfile: 'Simulated Cisco IOS-XR / FRR 9.1',
          status: 'online',
          uptimeSeconds: 72000,
          cpuPercent: 22,
          memoryPercent: 38,
          temperatureC: 39,
          site: 'POP-East',
          tags: ['ospf', 'area-0', 'backbone'],
          interfaces: [
            { id: 'int-r1-g0', name: 'Gi0/0', ipAddress: '10.0.1.1', subnetMask: '255.255.255.252', macAddress: '00:1A:2B:A1:01:01', adminStatus: 'up', operStatus: 'up', speedMbps: 1000, mtu: 1500 },
            { id: 'int-r1-g1', name: 'Gi0/1', ipAddress: '10.0.3.1', subnetMask: '255.255.255.252', macAddress: '00:1A:2B:A1:01:02', adminStatus: 'up', operStatus: 'up', speedMbps: 1000, mtu: 1500 },
            { id: 'int-r1-lo0', name: 'Loopback0', ipAddress: '1.1.1.1', subnetMask: '255.255.255.255', macAddress: '00:1A:2B:A1:01:03', adminStatus: 'up', operStatus: 'up', speedMbps: 10000, mtu: 1500 },
          ],
          runningConfig: `hostname OSPF-Router-A\ninterface Loopback0\n ip address 1.1.1.1 255.255.255.255\n!\ninterface Gi0/0\n ip address 10.0.1.1 255.255.255.252\n no shutdown\n!\ninterface Gi0/1\n ip address 10.0.3.1 255.255.255.252\n no shutdown\n!\nrouter ospf 1\n router-id 1.1.1.1\n network 10.0.1.0 0.0.0.3 area 0\n network 10.0.3.0 0.0.0.3 area 0\n network 1.1.1.1 0.0.0.0 area 0\n!`,
          savedConfig: `hostname OSPF-Router-A\ninterface Loopback0\n ip address 1.1.1.1 255.255.255.255\n!\ninterface Gi0/0\n ip address 10.0.1.1 255.255.255.252\n no shutdown\n!\ninterface Gi0/1\n ip address 10.0.3.1 255.255.255.252\n no shutdown\n!\nrouter ospf 1\n router-id 1.1.1.1\n network 10.0.1.0 0.0.0.3 area 0\n network 10.0.3.0 0.0.0.3 area 0\n network 1.1.1.1 0.0.0.0 area 0\n!`,
          configVersions: [],
        },
        {
          id: 'dev-ospf-r2',
          name: 'OSPF-Router-B',
          type: 'router',
          managementIp: '10.255.0.2',
          softwareProfile: 'Simulated Cisco IOS-XR / FRR 9.1',
          status: 'online',
          uptimeSeconds: 72000,
          cpuPercent: 24,
          memoryPercent: 41,
          temperatureC: 40,
          site: 'POP-West',
          tags: ['ospf', 'area-0', 'backbone'],
          interfaces: [
            { id: 'int-r2-g0', name: 'Gi0/0', ipAddress: '10.0.1.2', subnetMask: '255.255.255.252', macAddress: '00:1A:2B:B2:02:01', adminStatus: 'up', operStatus: 'up', speedMbps: 1000, mtu: 1500 },
            { id: 'int-r2-g1', name: 'Gi0/1', ipAddress: '10.0.2.1', subnetMask: '255.255.255.252', macAddress: '00:1A:2B:B2:02:02', adminStatus: 'up', operStatus: 'up', speedMbps: 1000, mtu: 1500 },
            { id: 'int-r2-lo0', name: 'Loopback0', ipAddress: '2.2.2.2', subnetMask: '255.255.255.255', macAddress: '00:1A:2B:B2:02:03', adminStatus: 'up', operStatus: 'up', speedMbps: 10000, mtu: 1500 },
          ],
          runningConfig: `hostname OSPF-Router-B\ninterface Loopback0\n ip address 2.2.2.2 255.255.255.255\n!\ninterface Gi0/0\n ip address 10.0.1.2 255.255.255.252\n no shutdown\n!\ninterface Gi0/1\n ip address 10.0.2.1 255.255.255.252\n no shutdown\n!\nrouter ospf 1\n router-id 2.2.2.2\n network 10.0.1.0 0.0.0.3 area 0\n network 10.0.2.0 0.0.0.3 area 0\n network 2.2.2.2 0.0.0.0 area 0\n!`,
          savedConfig: `hostname OSPF-Router-B\ninterface Loopback0\n ip address 2.2.2.2 255.255.255.255\n!\ninterface Gi0/0\n ip address 10.0.1.2 255.255.255.252\n no shutdown\n!\ninterface Gi0/1\n ip address 10.0.2.1 255.255.255.252\n no shutdown\n!\nrouter ospf 1\n router-id 2.2.2.2\n network 10.0.1.0 0.0.0.3 area 0\n network 10.0.2.0 0.0.0.3 area 0\n network 2.2.2.2 0.0.0.0 area 0\n!`,
          configVersions: [],
        },
        {
          id: 'dev-ospf-r3',
          name: 'OSPF-Router-C',
          type: 'router',
          managementIp: '10.255.0.3',
          softwareProfile: 'Simulated Cisco IOS-XR / FRR 9.1',
          status: 'online',
          uptimeSeconds: 72000,
          cpuPercent: 21,
          memoryPercent: 39,
          temperatureC: 38,
          site: 'POP-Central',
          tags: ['ospf', 'area-0', 'backbone'],
          interfaces: [
            { id: 'int-r3-g0', name: 'Gi0/0', ipAddress: '10.0.2.2', subnetMask: '255.255.255.252', macAddress: '00:1A:2B:C3:03:01', adminStatus: 'up', operStatus: 'up', speedMbps: 1000, mtu: 1500 },
            { id: 'int-r3-g1', name: 'Gi0/1', ipAddress: '10.0.3.2', subnetMask: '255.255.255.252', macAddress: '00:1A:2B:C3:03:02', adminStatus: 'up', operStatus: 'up', speedMbps: 1000, mtu: 1500 },
            { id: 'int-r3-lo0', name: 'Loopback0', ipAddress: '3.3.3.3', subnetMask: '255.255.255.255', macAddress: '00:1A:2B:C3:03:03', adminStatus: 'up', operStatus: 'up', speedMbps: 10000, mtu: 1500 },
          ],
          runningConfig: `hostname OSPF-Router-C\ninterface Loopback0\n ip address 3.3.3.3 255.255.255.255\n!\ninterface Gi0/0\n ip address 10.0.2.2 255.255.255.252\n no shutdown\n!\ninterface Gi0/1\n ip address 10.0.3.2 255.255.255.252\n no shutdown\n!\nrouter ospf 1\n router-id 3.3.3.3\n network 10.0.2.0 0.0.0.3 area 0\n network 10.0.3.0 0.0.0.3 area 0\n network 3.3.3.3 0.0.0.0 area 0\n!`,
          savedConfig: `hostname OSPF-Router-C\ninterface Loopback0\n ip address 3.3.3.3 255.255.255.255\n!\ninterface Gi0/0\n ip address 10.0.2.2 255.255.255.252\n no shutdown\n!\ninterface Gi0/1\n ip address 10.0.3.2 255.255.255.252\n no shutdown\n!\nrouter ospf 1\n router-id 3.3.3.3\n network 10.0.2.0 0.0.0.3 area 0\n network 10.0.3.0 0.0.0.3 area 0\n network 3.3.3.3 0.0.0.0 area 0\n!`,
          configVersions: [],
        },
      ];

      appState.links = [
        { id: 'link-ab', sourceDeviceId: 'dev-ospf-r1', sourceInterfaceId: 'int-r1-g0', targetDeviceId: 'dev-ospf-r2', targetInterfaceId: 'int-r2-g0', bandwidthMbps: 1000, latencyMs: 1.1, packetLossPercent: 0, status: 'active', trafficFlowBps: 28000000 },
        { id: 'link-bc', sourceDeviceId: 'dev-ospf-r2', sourceInterfaceId: 'int-r2-g1', targetDeviceId: 'dev-ospf-r3', targetInterfaceId: 'int-r3-g0', bandwidthMbps: 1000, latencyMs: 0.9, packetLossPercent: 0, status: 'active', trafficFlowBps: 24000000 },
        { id: 'link-ca', sourceDeviceId: 'dev-ospf-r3', sourceInterfaceId: 'int-r3-g1', targetDeviceId: 'dev-ospf-r1', targetInterfaceId: 'int-r1-g1', bandwidthMbps: 1000, latencyMs: 1.0, packetLossPercent: 0, status: 'active', trafficFlowBps: 26000000 },
      ];
      appState.activeLabId = 'ospf-triangle';
    } else {
      // Default Campus Lab
      appState = getInitialState();
    }

    appState.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: (req.headers['x-user-role'] as string) || 'Admin',
      action: 'LOAD_PRESET',
      resource: 'TopologyCanvas',
      details: `Loaded preset topology scenario: ${presetId}`,
      status: 'success',
    });

    saveState();
    res.json({ success: true, message: `Loaded preset ${presetId}` });
  });

  // CONFIGURATION MANAGEMENT
  router.post('/devices/:id/config', requireAdmin, (req: Request, res: Response) => {
    const id = req.params.id;
    const { config, description, author } = req.body;
    const device = appState.devices.find((d) => d.id === id);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    const newVersion = (device.configVersions?.length || 0) + 1;
    device.configVersions = device.configVersions || [];
    device.configVersions.unshift({
      version: newVersion,
      timestamp: new Date().toISOString(),
      description: description || `Configuration update v${newVersion}`,
      author: author || (req.headers['x-user-role'] as string) || 'Admin',
      config: device.runningConfig,
    });

    device.runningConfig = config;

    appState.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: author || (req.headers['x-user-role'] as string) || 'Admin',
      action: 'COMMIT_CONFIG',
      resource: device.name,
      details: description || `Committed candidate configuration version ${newVersion}`,
      status: 'success',
    });

    saveState();
    res.json({ success: true, device });
  });

  router.post('/devices/:id/save-config', requireAdmin, (req: Request, res: Response) => {
    const id = req.params.id;
    const device = appState.devices.find((d) => d.id === id);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    device.savedConfig = device.runningConfig;
    appState.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: (req.headers['x-user-role'] as string) || 'Admin',
      action: 'SAVE_CONFIG',
      resource: device.name,
      details: 'Copied running-config to startup-config (write memory)',
      status: 'success',
    });

    saveState();
    res.json({ success: true, message: 'Configuration saved successfully' });
  });

  router.post('/devices/:id/rollback-config', requireAdmin, (req: Request, res: Response) => {
    const id = req.params.id;
    const { version } = req.body;
    const device = appState.devices.find((d) => d.id === id);
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    const targetVer = device.configVersions.find((v) => v.version === Number(version));
    if (!targetVer) {
      return res.status(404).json({ success: false, error: 'Target version not found' });
    }

    const previousRunning = device.runningConfig;
    device.runningConfig = targetVer.config;

    // Record rollback version
    device.configVersions.unshift({
      version: device.configVersions.length + 1,
      timestamp: new Date().toISOString(),
      description: `Rollback to version ${version}`,
      author: (req.headers['x-user-role'] as string) || 'Admin (Rollback)',
      config: previousRunning,
    });

    appState.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: (req.headers['x-user-role'] as string) || 'Admin',
      action: 'ROLLBACK_CONFIG',
      resource: device.name,
      details: `Rolled back configuration to snapshot v${version}`,
      status: 'success',
    });

    saveState();
    res.json({ success: true, device });
  });

  // FAULT INJECTION & RECOVERY
  router.post('/faults/inject', requireAdmin, (req: Request, res: Response) => {
    const { type, targetId, severity } = req.body;
    const faultId = `fault-${Date.now()}`;

    let affectedDevs: string[] = [];
    let affectedLnks: string[] = [];
    let likelyCause = '';
    let steps: string[] = [];

    if (type === 'link_failure') {
      const link = appState.links.find((l) => l.id === targetId);
      if (link) {
        link.status = 'down';
        affectedLnks.push(link.id);
        affectedDevs.push(link.sourceDeviceId, link.targetDeviceId);
        likelyCause = `Physical link failure or SFP transceiver signal loss between ${link.sourceDeviceId} and ${link.targetDeviceId}`;
        steps = ['Verify physical/optical cabling', 'Check interface admin status', 'Verify remote peer optical levels'];
      }
    } else if (type === 'high_latency') {
      const link = appState.links.find((l) => l.id === targetId);
      if (link) {
        link.status = 'degraded';
        link.latencyMs = 85.0;
        link.packetLossPercent = 14.5;
        affectedLnks.push(link.id);
        likelyCause = `Buffer congestion or interface queuing latency on link ${link.id}`;
        steps = ['Analyze top bandwidth consumers', 'Verify QoS queue drops', 'Increase link capacity'];
      }
    } else if (type === 'cpu_spike') {
      const dev = appState.devices.find((d) => d.id === targetId);
      if (dev) {
        dev.cpuPercent = 96;
        affectedDevs.push(dev.id);
        likelyCause = `High control plane utilization / process storm on ${dev.name}`;
        steps = ['Check routing protocol convergence state', 'Verify ACL punt rate', 'Restart offending daemon'];
      }
    } else if (type === 'device_offline') {
      const dev = appState.devices.find((d) => d.id === targetId);
      if (dev) {
        dev.status = 'offline';
        dev.cpuPercent = 0;
        dev.memoryPercent = 0;
        affectedDevs.push(dev.id);
        // Set connected links down
        appState.links.forEach((l) => {
          if (l.sourceDeviceId === dev.id || l.targetDeviceId === dev.id) {
            l.status = 'down';
            affectedLnks.push(l.id);
          }
        });
        likelyCause = `Power supply outage or kernel panic on ${dev.name}`;
        steps = ['Check PSU power input rails', 'Inspect out-of-band console log', 'Initiate cold hardware reboot'];
      }
    }

    const fault: FaultEvent = {
      id: faultId,
      firstDetected: new Date().toISOString(),
      lastObserved: new Date().toISOString(),
      severity: severity || 'critical',
      category: type,
      affectedDevices: affectedDevs,
      affectedLinks: affectedLnks,
      likelyCause,
      recommendedSteps: steps,
      status: 'active',
    };

    appState.faults.unshift(fault);

    appState.alerts.unshift({
      id: `alert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: severity || 'critical',
      title: `Fault Injected: ${type.toUpperCase()}`,
      message: likelyCause,
      deviceId: affectedDevs[0],
      linkId: affectedLnks[0],
      acknowledged: false,
      resolved: false,
    });

    appState.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Admin',
      action: 'INJECT_FAULT',
      resource: targetId,
      details: `Manually triggered synthetic fault: ${type}`,
      status: 'success',
    });

    saveState();
    res.json({ success: true, fault });
  });

  router.post('/faults/:id/resolve', requireAdmin, (req: Request, res: Response) => {
    const id = req.params.id;
    const fault = appState.faults.find((f) => f.id === id);
    if (!fault) {
      return res.status(404).json({ success: false, error: 'Fault not found' });
    }

    fault.status = 'resolved';

    // Restore affected links and devices
    fault.affectedLinks.forEach((lId) => {
      const l = appState.links.find((x) => x.id === lId);
      if (l) {
        l.status = 'active';
        l.latencyMs = 0.8;
        l.packetLossPercent = 0;
      }
    });

    fault.affectedDevices.forEach((dId) => {
      const d = appState.devices.find((x) => x.id === dId);
      if (d) {
        d.status = 'online';
        d.cpuPercent = 25;
      }
    });

    // Mark matching alerts as resolved
    appState.alerts.forEach((a) => {
      if (fault.affectedDevices.includes(a.deviceId || '') || fault.affectedLinks.includes(a.linkId || '')) {
        a.resolved = true;
        a.resolvedAt = new Date().toISOString();
      }
    });

    appState.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: (req.headers['x-user-role'] as string) || 'Admin',
      action: 'RESOLVE_FAULT',
      resource: fault.id,
      details: `Resolved fault: ${fault.likelyCause}`,
      status: 'success',
    });

    saveState();
    res.json({ success: true, fault });
  });

  // ALERTS ACKNOWLEDGE / RESOLVE
  router.post('/alerts/:id/acknowledge', requireAdmin, (req: Request, res: Response) => {
    const id = req.params.id;
    const alert = appState.alerts.find((a) => a.id === id);
    if (alert) {
      alert.acknowledged = true;
      saveState();
    }
    res.json({ success: true });
  });

  router.post('/alerts/:id/resolve', requireAdmin, (req: Request, res: Response) => {
    const id = req.params.id;
    const alert = appState.alerts.find((a) => a.id === id);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      saveState();
    }
    res.json({ success: true });
  });

  // AUTOMATION WORKFLOW RUNNER
  router.post('/automation/execute', requireAdmin, (req: Request, res: Response) => {
    const { workflowType, params, targetDeviceIds } = req.body;
    const jobId = `job-${Date.now()}`;

    let plan: string[] = [];
    let diffs: { deviceId: string; diff: string }[] = [];

    if (workflowType === 'vlan_port_assign') {
      plan = [
        `Verify VLAN ${params.vlanId} existence in topology database`,
        `Inspect target interface ${params.interfaceName} on selected switches`,
        `Switch port mode to access and apply VLAN tag ${params.vlanId}`,
        `Verify STP PortFast protection and loop prevention`,
      ];
      targetDeviceIds.forEach((devId: string) => {
        diffs.push({
          deviceId: devId,
          diff: `+ vlan ${params.vlanId}\n+ interface ${params.interfaceName}\n+  switchport mode access\n+  switchport access vlan ${params.vlanId}`,
        });
      });
    } else if (workflowType === 'add_static_route') {
      plan = [
        `Validate route destination CIDR ${params.destinationNetwork}`,
        `Verify next-hop reachability via ARP/routing lookup: ${params.nextHop}`,
        `Inject static route statement into running configuration`,
        `Perform synthetic routing lookup verification`,
      ];
      targetDeviceIds.forEach((devId: string) => {
        diffs.push({
          deviceId: devId,
          diff: `+ ip route ${params.destinationNetwork} ${params.nextHop}`,
        });
      });
    } else if (workflowType === 'interface_toggle') {
      plan = [
        `Query current administrative status of interface ${params.interfaceName}`,
        `Submit state change: ${params.adminStatus.toUpperCase()}`,
        `Trigger Spanning-Tree topology recalculation and link state notification`,
      ];
      targetDeviceIds.forEach((devId: string) => {
        diffs.push({
          deviceId: devId,
          diff: `interface ${params.interfaceName}\n${params.adminStatus === 'down' ? '+ shutdown' : '+ no shutdown'}`,
        });
      });
    } else {
      plan = ['Validate workflow schema', 'Execute template transformation', 'Verify device responses'];
    }

    const job: AutomationJob = {
      id: jobId,
      name: params.jobName || `Automation Job - ${workflowType}`,
      workflowType,
      status: 'success',
      createdAt: new Date().toISOString(),
      author: 'NetworkAdmin',
      targetDeviceIds,
      plan,
      appliedChanges: diffs,
      rollbackSupported: true,
    };

    appState.automationJobs.unshift(job);

    appState.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'NetworkAdmin',
      action: 'AUTOMATION_RUN',
      resource: job.name,
      details: `Executed ${workflowType} across ${targetDeviceIds.length} target devices`,
      status: 'success',
    });

    saveState();
    res.json({ success: true, job });
  });

  // DIAGNOSTIC PING & TRACEROUTE SIMULATOR
  router.post('/diagnostics/ping', (req: Request, res: Response) => {
    const { sourceDeviceId, targetIp, count = 4 } = req.body;
    const sourceDev = appState.devices.find((d) => d.id === sourceDeviceId);

    if (!sourceDev) {
      return res.status(404).json({ success: false, error: 'Source device not found' });
    }

    if (sourceDev.status === 'offline') {
      return res.json({
        success: true,
        reachable: false,
        summary: 'Source device is offline. Interface cannot transmit packets.',
        output: `ping ${targetIp}\nDestination host unreachable: Local device ${sourceDev.name} is powered off or disabled.\n0 packets transmitted, 0 received, 100% packet loss.`,
      });
    }

    // Find if target IP belongs to any device interface or management IP
    let targetDev = appState.devices.find(
      (d) => d.managementIp === targetIp || d.interfaces.some((i) => i.ipAddress === targetIp)
    );

    // If external or simulated gateway
    const isGateway = targetIp === '1.1.1.1' || targetIp === '8.8.8.8' || targetIp === '203.0.113.10';

    // Check link connectivity between source and target
    let linkDown = false;
    if (targetDev && targetDev.status === 'offline') {
      linkDown = true;
    }

    // Check if any link in path is down
    const downLinks = appState.links.filter((l) => l.status === 'down');
    if (downLinks.length > 0 && targetDev) {
      // If either source or target is attached to down link
      const sourceCut = downLinks.some((l) => l.sourceDeviceId === sourceDev.id || l.targetDeviceId === sourceDev.id);
      const targetCut = downLinks.some((l) => l.sourceDeviceId === targetDev.id || l.targetDeviceId === targetDev.id);
      if (sourceCut || targetCut) {
        linkDown = true;
      }
    }

    if (linkDown) {
      const output = [
        `PING ${targetIp} (${targetIp}) 56(84) bytes of data.`,
        `From ${sourceDev.managementIp} icmp_seq=1 Destination Host Unreachable`,
        `From ${sourceDev.managementIp} icmp_seq=2 Request timed out.`,
        `From ${sourceDev.managementIp} icmp_seq=3 Destination Host Unreachable`,
        `From ${sourceDev.managementIp} icmp_seq=4 Request timed out.`,
        `--- ${targetIp} ping statistics ---`,
        `${count} packets transmitted, 0 received, +2 errors, 100% packet loss, time ${count * 1000}ms`,
      ].join('\n');

      return res.json({
        success: true,
        reachable: false,
        packetLoss: 100,
        avgLatencyMs: 0,
        output,
      });
    }

    // Successful ping
    const rtts = [0.92, 1.15, 0.88, 1.02].slice(0, count);
    const avgRtt = (rtts.reduce((a, b) => a + b, 0) / rtts.length).toFixed(3);
    const minRtt = Math.min(...rtts).toFixed(3);
    const maxRtt = Math.max(...rtts).toFixed(3);

    const output = [
      `PING ${targetIp} (${targetIp}) 56(84) bytes of data.`,
      ...rtts.map((rtt, idx) => `64 bytes from ${targetIp}: icmp_seq=${idx + 1} ttl=64 time=${rtt} ms`),
      `--- ${targetIp} ping statistics ---`,
      `${count} packets transmitted, ${count} received, 0% packet loss, time ${count * 1000}ms`,
      `rtt min/avg/max = ${minRtt}/${avgRtt}/${maxRtt} ms`,
    ].join('\n');

    res.json({
      success: true,
      reachable: true,
      packetLoss: 0,
      avgLatencyMs: parseFloat(avgRtt),
      output,
    });
  });

  router.post('/diagnostics/traceroute', (req: Request, res: Response) => {
    const { sourceDeviceId, targetIp } = req.body;
    const sourceDev = appState.devices.find((d) => d.id === sourceDeviceId);

    if (!sourceDev) {
      return res.status(404).json({ success: false, error: 'Source device not found' });
    }

    const hops = [
      { hop: 1, host: 'HQ-Dist-Switch-01 (192.168.10.1)', ip: '192.168.10.1', rtt: '0.412 ms' },
      { hop: 2, host: 'HQ-Core-Router-01 (10.0.1.1)', ip: '10.0.1.1', rtt: '0.884 ms' },
      { hop: 3, host: 'HQ-Edge-Firewall-01 (10.0.2.2)', ip: '10.0.2.2', rtt: '1.240 ms' },
      { hop: 4, host: `Target (${targetIp})`, ip: targetIp, rtt: '2.105 ms' },
    ];

    const output = [
      `traceroute to ${targetIp} (${targetIp}), 30 hops max, 60 byte packets`,
      ...hops.map((h) => ` ${h.hop}  ${h.host}  ${h.rtt}  ${h.rtt}  ${h.rtt}`),
    ].join('\n');

    res.json({ success: true, hops, output });
  });

  // GEMINI AI ASSISTANT ENDPOINT
  router.post('/ai/chat', async (req: Request, res: Response) => {
    const { prompt, contextType, selectedDeviceId } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    // Build context regarding current network state
    const targetDev = selectedDeviceId ? appState.devices.find((d) => d.id === selectedDeviceId) : null;
    const activeFaults = appState.faults.filter((f) => f.status === 'active');
    const degradedLinks = appState.links.filter((l) => l.status !== 'active');

    const networkSummary = {
      deviceCount: appState.devices.length,
      devices: appState.devices.map((d) => ({
        name: d.name,
        type: d.type,
        ip: d.managementIp,
        status: d.status,
        cpu: `${d.cpuPercent}%`,
        mem: `${d.memoryPercent}%`,
      })),
      linkCount: appState.links.length,
      activeFaults: activeFaults.map((f) => ({
        category: f.category,
        severity: f.severity,
        affectedDevices: f.affectedDevices,
        likelyCause: f.likelyCause,
      })),
      degradedLinks: degradedLinks.map((l) => ({
        id: l.id,
        source: l.sourceDeviceId,
        target: l.targetDeviceId,
        status: l.status,
        loss: `${l.packetLossPercent}%`,
        latency: `${l.latencyMs}ms`,
      })),
      selectedDevice: targetDev
        ? {
            name: targetDev.name,
            type: targetDev.type,
            ip: targetDev.managementIp,
            runningConfig: targetDev.runningConfig,
          }
        : null,
    };

    // If Gemini is configured, use server-side @google/genai
    if (aiClient) {
      try {
        const systemPrompt = `You are the AI Network Engineering Copilot for the AINCMS (AI-Powered Network Configuration and Monitoring System).
You assist network administrators with real-time diagnostics, Cisco/FRR configuration reviews, root cause analysis, VLANs, OSPF routing, ACLs, and automated troubleshooting.

CURRENT NETWORK STATE SNAPSHOT:
${JSON.stringify(networkSummary, null, 2)}

GUIDELINES:
1. Always base recommendations on the actual topology, devices, and faults in the state snapshot.
2. If the user asks for a configuration, format it cleanly in code blocks (e.g. \`\`\`cisco or \`\`\`bash).
3. Clearly distinguish verified simulated topology observations from speculative hypotheses.
4. Provide structured, actionable, and safe step-by-step troubleshooting suggestions.
5. Emphasize that all proposed CLI changes require administrator review and approval.`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
          },
        });

        const reply = response.text || 'No response generated from Gemini.';
        return res.json({
          success: true,
          provider: 'gemini-3.8-flash',
          reply,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error('Gemini API call failed, falling back to rule-based assistant:', err);
        // Fallback gracefully below
      }
    }

    // Non-AI Fallback: Rule-Based Intelligent Network Diagnostics
    const reply = generateRuleBasedAnswer(prompt, networkSummary, targetDev);
    res.json({
      success: true,
      provider: 'rule-based-fallback',
      reply,
      note: 'Operating in heuristic diagnostic mode. To enable real-time Gemini LLM reasoning, provide a GEMINI_API_KEY.',
      timestamp: new Date().toISOString(),
    });
  });

  // LOCAL AGENT BRIDGE (Mode B)
  router.get('/agent/status', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: appState.localAgentStatus,
      instructions: {
        title: 'Containerlab & FRRouting Local Agent Setup',
        command: 'curl -sSL https://raw.githubusercontent.com/aincms/local-agent/main/install.sh | bash',
        requirements: ['Docker Engine 24.0+', 'Containerlab v0.48+', 'Python 3.10+ with Netmiko'],
      },
    });
  });

  router.post('/agent/register', (req: Request, res: Response) => {
    const { agentKey, agentVersion, dockerStatus, containerlabStatus, nodeCount } = req.body;
    if (agentKey !== 'demo-agent-key-2026' && agentKey !== process.env.LOCAL_AGENT_KEY) {
      return res.status(401).json({ success: false, error: 'Invalid Local Agent Security Token' });
    }

    appState.localAgentStatus = {
      connected: true,
      lastHeartbeat: new Date().toISOString(),
      agentVersion: agentVersion || 'v1.0.0',
      dockerStatus: dockerStatus || 'running',
      containerlabStatus: containerlabStatus || 'ready',
      nodeCount: nodeCount || 4,
      message: 'Local Agent Bridge connected. Containerlab virtualization environment verified.',
    };

    appState.simulationMode = 'LOCAL_LAB';
    saveState();
    res.json({ success: true, message: 'Agent registered and synchronized successfully' });
  });

  // Mount API router
  app.use('/api', router);

  // Serve static dist in production, or mount Vite middleware in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AINCMS Server running on http://0.0.0.0:${PORT}`);
    console.log(`Simulation Mode: ${appState.simulationMode} (Virtual Clock Seed #${appState.simulationSeed})`);
  });
}

// Non-AI Heuristic Network Assistant fallback
function generateRuleBasedAnswer(prompt: string, summary: any, targetDev: any): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('health') || lower.includes('status') || lower.includes('overview')) {
    const activeFaults = summary.activeFaults;
    const degraded = summary.degradedLinks;
    let faultText = activeFaults.length
      ? activeFaults.map((f: any) => `- **${f.severity.toUpperCase()}**: ${f.likelyCause}`).join('\n')
      : 'All monitored devices and links are operating within nominal parameters.';

    return `### Network Health Summary
- **Total Devices Monitored**: ${summary.deviceCount}
- **Active Links**: ${summary.linkCount} (${degraded.length} degraded/down)
- **Active Fault Events**: ${activeFaults.length}

#### Critical Findings:
${faultText}

#### Recommended Next Steps:
1. Review the **Fault Management** tab to inspect affected interfaces.
2. Run diagnostic ICMP ping tests from endpoints toward default gateways.
3. Verify routing protocol adjacencies (OSPF/BGP) on core distribution switches.`;
  }

  if (lower.includes('ospf') || lower.includes('routing')) {
    return `### OSPF Routing Architecture Guide
In this topology, **HQ-Core-Router-01** and **HQ-Dist-Switch-01** participate in **OSPF Area 0 (Backbone)**.

\`\`\`cisco
! OSPF Configuration on Core Router
router ospf 1
 router-id 1.1.1.1
 network 10.0.1.0 0.0.0.3 area 0
 network 10.0.2.0 0.0.0.3 area 0
 network 1.1.1.1 0.0.0.0 area 0
 passive-interface default
 no passive-interface GigabitEthernet0/0
\`\`\`

**Key Verification Commands:**
- \`show ip ospf neighbor\` (Neighbor state should be **FULL**)
- \`show ip route ospf\` (Verify inter-subnet route propagation)
- \`show ip ospf interface brief\` (Verify Hello/Dead intervals match)`;
  }

  if (lower.includes('vlan') || lower.includes('trunk')) {
    return `### VLAN & 802.1Q Trunking Architecture
In your topology:
- **VLAN 10**: Staff & Engineering Subnet (\`192.168.10.0/24\`)
- **VLAN 20**: Production Servers Subnet (\`192.168.20.0/24\`)
- **Inter-VLAN Gateway**: Configured as Switched Virtual Interfaces (SVI) on **HQ-Dist-Switch-01**

\`\`\`cisco
! Access Switch Trunk Port
interface GigabitEthernet1/0/2
 description Trunk uplink to Dist Switch
 switchport mode trunk
 switchport trunk encapsulation dot1q
 switchport trunk allowed vlan 10,20
!
! Access Port for End Host
interface FastEthernet0/1
 description Workstation endpoint
 switchport mode access
 switchport access vlan 10
 spanning-tree portfast
\`\`\``;
  }

  if (lower.includes('acl') || lower.includes('security') || lower.includes('firewall')) {
    return `### Access Control List (ACL) Recommendations
Best practice for edge perimeter filtering on **HQ-Edge-Firewall-01**:
1. Implement implicit deny with explicit permit logging.
2. Permit essential outbound services: HTTP/HTTPS (TCP 80/443), DNS (UDP 53), NTP (UDP 123).
3. Restrict internal database port access (e.g., PostgreSQL TCP 5432) strictly to the application server tier.

\`\`\`cisco
ip access-list extended PERIMETER_INBOUND
 permit tcp any host 203.0.113.10 eq 443
 permit icmp any host 203.0.113.10 echo-reply
 deny ip any any log
\`\`\``;
  }

  return `### Network Diagnostic Insight
I have reviewed your query against the simulated network state.

- **Current Monitored Devices**: ${summary.devices.map((d: any) => `${d.name} (${d.ip})`).join(', ')}
- **Operational Status**: ${summary.devices.every((d: any) => d.status === 'online') ? 'All nodes reporting online' : 'Attention required: node degradation detected'}

**Troubleshooting Advice:**
1. Check interface counters for CRC errors and frame discards.
2. Inspect the **Topology Editor** to verify physical loop boundaries and STP blocked ports.
3. Use the **Diagnostic Ping & Traceroute** tool to locate the hop where packet latency or loss spikes.`;
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
