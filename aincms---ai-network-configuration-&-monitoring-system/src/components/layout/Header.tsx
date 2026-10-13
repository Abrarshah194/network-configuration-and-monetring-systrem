import React from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { Play, Pause, RotateCcw, FastForward, Shield, Terminal, Clock, Zap, Eye, User, Key } from 'lucide-react';
import { UserRole } from '../../types/network';

export const Header: React.FC = () => {
  const {
    state,
    userRole,
    setUserRole,
    currentUser,
    setLoginModalOpen,
    toggleSimulation,
    resetSimulation,
    stepSimulation,
    setDiagnosticModalOpen,
  } = useNetwork();

  const isRunning = state?.simulationState === 'RUNNING';
  const isViewer = currentUser.role === 'student' || userRole === 'viewer';

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Simulation Engine Status Banner */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-100">AINCMS Platform</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border ${
                  state?.simulationMode === 'LOCAL_LAB'
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {state?.simulationMode === 'LOCAL_LAB' ? 'Containerlab Live Lab' : 'Deterministic Simulator (Mode A)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Tick: #{state?.virtualTick || 0}</span>
              <span className="text-slate-600">•</span>
              <span>Seed: #{state?.simulationSeed || 42}</span>
            </p>
          </div>
        </div>

        {/* Engine Controls */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700/80">
          <button
            onClick={toggleSimulation}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
              isRunning
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
            }`}
            title={isRunning ? 'Pause Simulation' : 'Resume Simulation'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'Pause' : 'Resume'}
          </button>

          <button
            onClick={stepSimulation}
            className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white transition flex items-center gap-1"
            title="Step One Simulation Tick"
          >
            <FastForward className="w-3.5 h-3.5" />
            Step
          </button>

          <button
            onClick={resetSimulation}
            className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white transition flex items-center gap-1"
            title="Reset Simulation State to Baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Right: Quick Tools, Viewer Mode Badge & Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Packet Ping Trigger */}
        <button
          onClick={() => setDiagnosticModalOpen(true)}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition shadow-sm hidden sm:flex"
        >
          <Terminal className="w-3.5 h-3.5 text-blue-400" />
          <span>Diagnostic Ping & Trace</span>
        </button>

        {/* RBAC Mode Badge (Viewer Mode vs Admin Mode) */}
        {isViewer ? (
          <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-sm animate-in fade-in duration-200">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Viewer Mode</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/40 text-blue-300 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-sm hidden sm:flex">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Admin Mode</span>
          </div>
        )}

        {/* User Account Button with Switcher */}
        <button
          onClick={() => setLoginModalOpen(true)}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-xs transition shadow-sm max-w-[220px]"
          title={`Active User: ${currentUser.displayName} (${currentUser.email || currentUser.username}) — Click to sign in or register with Gmail`}
        >
          <div className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold text-[10px] shrink-0">
            {(currentUser.displayName || currentUser.username)[0]?.toUpperCase()}
          </div>
          <div className="flex flex-col text-left truncate">
            <span className="text-white font-medium leading-none truncate">
              {currentUser.displayName || currentUser.username}
            </span>
            <span className="text-[10px] text-blue-400/90 leading-none mt-0.5 font-mono truncate">
              {currentUser.email || (currentUser.role === 'admin' ? 'abrarshah2134896@gmail.com' : 'student@aincms.edu')}
            </span>
          </div>
          <Key className="w-3 h-3 text-slate-400 ml-0.5 shrink-0" />
        </button>
      </div>
    </header>
  );
};
