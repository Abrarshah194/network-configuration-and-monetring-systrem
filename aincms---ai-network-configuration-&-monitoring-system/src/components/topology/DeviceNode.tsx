import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Router, Server, Monitor, Shield, Network, HardDrive, Cpu, AlertCircle } from 'lucide-react';
import { DeviceType, DeviceStatus } from '../../types/network';

export interface DeviceNodeData {
  id: string;
  name: string;
  type: DeviceType;
  managementIp: string;
  status: DeviceStatus;
  cpuPercent: number;
  memoryPercent: number;
  selected?: boolean;
}

const getDeviceIcon = (type: DeviceType) => {
  switch (type) {
    case 'router':
      return <Router className="w-5 h-5 text-blue-400" />;
    case 'switch_l3':
    case 'switch_l2':
      return <Network className="w-5 h-5 text-emerald-400" />;
    case 'firewall':
      return <Shield className="w-5 h-5 text-amber-400" />;
    case 'server':
      return <Server className="w-5 h-5 text-purple-400" />;
    case 'host':
    default:
      return <Monitor className="w-5 h-5 text-cyan-400" />;
  }
};

export const DeviceNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as DeviceNodeData;
  const isOnline = nodeData.status === 'online';
  const isDegraded = nodeData.status === 'degraded';

  return (
    <div
      className={`relative px-4 py-3 rounded-xl border transition-all duration-200 min-w-44 shadow-lg ${
        selected
          ? 'bg-slate-800/95 border-blue-500 ring-2 ring-blue-500/30'
          : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
      } backdrop-blur-md`}
    >
      {/* Target/Source Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-900"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-900"
      />

      {/* Node Header */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/80 shrink-0">
          {getDeviceIcon(nodeData.type)}
        </div>
        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-semibold text-slate-100 truncate max-w-[130px]" title={nodeData.name}>
              {nodeData.name}
            </h4>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : isDegraded ? 'bg-amber-400' : 'bg-rose-500'
              }`}
            />
          </div>
          <p className="text-[10px] font-mono text-slate-400">{nodeData.managementIp}</p>
        </div>
      </div>

      {/* Telemetry Chips */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Cpu className="w-3 h-3 text-slate-500" />
          {nodeData.cpuPercent}%
        </span>
        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-sans font-medium">
          {nodeData.type.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
});
DeviceNode.displayName = 'DeviceNode';
