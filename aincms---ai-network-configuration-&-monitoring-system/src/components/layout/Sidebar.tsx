import React from 'react';
import {
  LayoutDashboard,
  Network,
  Server,
  FileCode,
  Wrench,
  LineChart,
  AlertTriangle,
  Bell,
  GraduationCap,
  Bot,
  Layers,
  FileSpreadsheet,
  BookOpen,
  ScrollText,
  Cpu,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'topology'
  | 'devices'
  | 'config'
  | 'automation'
  | 'monitoring'
  | 'faults'
  | 'alerts'
  | 'logs'
  | 'future_work'
  | 'labs'
  | 'ai'
  | 'locallab'
  | 'reports'
  | 'docs';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  alertCount?: number;
  faultCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  alertCount = 0,
  faultCount = 0,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'topology', label: 'Topology Canvas', icon: Network },
    { id: 'devices', label: 'Device Inventory', icon: Server },
    { id: 'config', label: 'Config Workspace', icon: FileCode },
    { id: 'automation', label: 'Automation Center', icon: Wrench },
    { id: 'monitoring', label: 'Traffic & Metrics', icon: LineChart },
    { id: 'faults', label: 'Fault Management', icon: AlertTriangle, badge: faultCount > 0 ? faultCount : undefined, badgeColor: 'bg-rose-500' },
    { id: 'alerts', label: 'Alert Center', icon: Bell, badge: alertCount > 0 ? alertCount : undefined, badgeColor: 'bg-amber-500' },
    { id: 'logs', label: 'System Logs (/logs)', icon: ScrollText },
    { id: 'future_work', label: 'Mode B Hardware (Future)', icon: Cpu },
    { id: 'labs', label: 'Guided FYP Labs', icon: GraduationCap },
    { id: 'ai', label: 'AI Assistant', icon: Bot, isAi: true },
    { id: 'locallab', label: 'Local Lab Bridge', icon: Layers },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
    { id: 'docs', label: 'FYP Thesis & Guide', icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      {/* Brand */}
      <div className="h-16 px-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-sm">
          AI
        </div>
        <div>
          <h1 className="font-bold text-sm text-white tracking-tight">AINCMS v2.4</h1>
          <p className="text-[11px] text-slate-400">Networking FYP System</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Network Operations
        </div>
        {menuItems.slice(0, 10).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold text-white rounded-full ${
                    item.badgeColor || 'bg-blue-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Intelligence & Labs
        </div>
        {menuItems.slice(10).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                isActive
                  ? item.isAi
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? 'text-white'
                      : item.isAi
                      ? 'text-purple-400'
                      : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.isAi && (
                <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                  GEMINI
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 bg-slate-900/50">
        <p className="font-medium text-slate-400">Final Year Project</p>
        <p className="text-[10px] text-slate-500">Dept. of Computer Science</p>
        <p className="text-[9px] text-slate-600 mt-1">Autonomous Simulation Mode A</p>
      </div>
    </aside>
  );
};
