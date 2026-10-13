import React, { useState } from 'react';
import { NetworkProvider, useNetwork } from './context/NetworkContext';
import { Header } from './components/layout/Header';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { TopologyCanvas } from './components/topology/TopologyCanvas';
import { DeviceInventory } from './components/devices/DeviceInventory';
import { ConfigWorkspace } from './components/config/ConfigWorkspace';
import { AutomationCenter } from './components/automation/AutomationCenter';
import { MonitoringAnalytics } from './components/monitoring/MonitoringAnalytics';
import { FaultManagement } from './components/faults/FaultManagement';
import { AlertCenter } from './components/alerts/AlertCenter';
import { SystemLogs } from './components/logs/SystemLogs';
import { FutureWorkModeB } from './components/future-work/FutureWorkModeB';
import { GuidedLabs } from './components/labs/GuidedLabs';
import { AiAssistant } from './components/ai/AiAssistant';
import { LocalLabBridge } from './components/local-lab/LocalLabBridge';
import { ReportsExport } from './components/reports/ReportsExport';
import { FypDocumentation } from './components/documentation/FypDocumentation';
import { DiagnosticToolsModal } from './components/common/DiagnosticToolsModal';
import { DeviceRoutingTableModal } from './components/common/DeviceRoutingTableModal';
import { LoginModal } from './components/common/LoginModal';
import { Mail, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    state,
    loading,
    error,
    routingModalOpen,
    setRoutingModalOpen,
    routingTargetDevice,
    loginModalOpen,
    setLoginModalOpen,
    emailToastMessage,
    setEmailToastMessage,
  } = useNetwork();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  if (loading && !state) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Bootstrapping AINCMS Simulation Core...</p>
      </div>
    );
  }

  const unacknowledgedAlerts = state?.alerts.filter((a) => !a.acknowledged && !a.resolved).length || 0;
  const activeFaults = state?.faults.filter((f) => f.status === 'active').length || 0;

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={unacknowledgedAlerts}
        faultCount={activeFaults}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto bg-slate-950">
          {error && (
            <div className="m-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'dashboard' && <DashboardOverview onNavigate={setActiveTab} />}
          {activeTab === 'topology' && <TopologyCanvas onNavigate={setActiveTab} />}
          {activeTab === 'devices' && <DeviceInventory onNavigate={setActiveTab} />}
          {activeTab === 'config' && <ConfigWorkspace />}
          {activeTab === 'automation' && <AutomationCenter />}
          {activeTab === 'monitoring' && <MonitoringAnalytics />}
          {activeTab === 'faults' && <FaultManagement onNavigate={setActiveTab} />}
          {activeTab === 'alerts' && <AlertCenter />}
          {activeTab === 'logs' && <SystemLogs />}
          {activeTab === 'future_work' && <FutureWorkModeB onNavigate={setActiveTab} />}
          {activeTab === 'labs' && <GuidedLabs onNavigate={setActiveTab} />}
          {activeTab === 'ai' && <AiAssistant />}
          {activeTab === 'locallab' && <LocalLabBridge />}
          {activeTab === 'reports' && <ReportsExport />}
          {activeTab === 'docs' && <FypDocumentation />}
        </main>
      </div>

      {/* Global Interactive Diagnostic Tools Modal */}
      <DiagnosticToolsModal />

      {/* Global Interactive Routing Table, ARP Cache & NAT Modal */}
      <DeviceRoutingTableModal
        isOpen={routingModalOpen}
        device={routingTargetDevice}
        onClose={() => setRoutingModalOpen(false)}
      />

      {/* RBAC Login / Switch User Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      {/* FEATURE 4: Simulated Email Alert Toast Notification Banner */}
      {emailToastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-blue-500/40 text-slate-100 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 max-w-md">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg shrink-0">
            <Mail className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-white flex items-center gap-2">
              <span>SMTP Email Notification</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono font-medium">
                Simulated
              </span>
            </div>
            <p className="text-slate-300 mt-0.5 leading-relaxed">{emailToastMessage}</p>
          </div>
          <button
            onClick={() => setEmailToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <NetworkProvider>
      <MainLayout />
    </NetworkProvider>
  );
}
