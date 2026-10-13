import React, { useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import {
  Shield,
  Eye,
  Lock,
  User,
  X,
  CheckCircle2,
  AlertCircle,
  Mail,
  UserPlus,
  LogIn,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, register, currentUser, adminEmail, registeredUsers } = useNetwork();
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Sign In form fields
  const [signInIdentifier, setSignInIdentifier] = useState('admin');
  const [signInPassword, setSignInPassword] = useState('admin123');

  // Register form fields
  const [regFullName, setRegFullName] = useState('Abrar Shah');
  const [regEmail, setRegEmail] = useState('abrarshah2134896@gmail.com');
  const [regUsername, setRegUsername] = useState('abrarshah');
  const [regPassword, setRegPassword] = useState('admin123');
  const [regRole, setRegRole] = useState<'admin' | 'student'>('admin');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const res = login(signInIdentifier.trim(), signInPassword.trim());
    if (res.success) {
      setSuccessMsg(`Authenticated successfully as ${signInIdentifier.trim()}`);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 700);
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const res = register({
      username: regUsername.trim(),
      email: regEmail.trim(),
      password: regPassword.trim(),
      displayName: regFullName.trim() || regUsername.trim(),
      role: regRole,
    });

    if (res.success) {
      setSuccessMsg(
        `Account registered successfully! Signed in as ${regFullName.trim() || regUsername.trim()} (${regRole === 'admin' ? 'Administrator' : 'Student'})`
      );
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 800);
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  const setSignInPreset = (identifier: string, pass: string) => {
    setSignInIdentifier(identifier);
    setSignInPassword(pass);
    setError(null);
  };

  const prefillAdminGmail = () => {
    setAuthMode('register');
    setRegFullName('Abrar Shah');
    setRegEmail('abrarshah2134896@gmail.com');
    setRegUsername('abrarshah');
    setRegPassword('admin123');
    setRegRole('admin');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AINCMS User Access & Registration</h3>
              <p className="text-[11px] text-slate-400">Authenticate or register with your Gmail account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons (Sign In vs Register) */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-800 flex items-center gap-2 bg-slate-900/60 shrink-0">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
              authMode === 'signin'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
              authMode === 'register'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register with Gmail</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {authMode === 'signin' ? (
            /* ================= SIGN IN TAB ================= */
            <>
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                  Quick Access Accounts
                </span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSignInPreset('admin', 'admin123')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      signInIdentifier === 'admin' || signInIdentifier === 'abrarshah2134896@gmail.com'
                        ? 'bg-blue-600/15 border-blue-500 text-blue-200 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-white">
                        <Shield className="w-3.5 h-3.5 text-blue-400" />
                        Admin (Abrar)
                      </span>
                      <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono font-medium">
                        Full Control
                      </span>
                    </div>
                    <span className="text-[10px] text-blue-400/90 font-mono truncate">
                      {adminEmail || 'abrarshah2134896@gmail.com'}
                    </span>
                    <span className="text-[9px] text-slate-500">Commit, add devices & inject faults</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignInPreset('student', 'student123')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      signInIdentifier === 'student'
                        ? 'bg-amber-600/15 border-amber-500 text-amber-200 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-white">
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        Student
                      </span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-medium">
                        Viewer Mode
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-400/90 font-mono">student@aincms.edu</span>
                    <span className="text-[9px] text-slate-500">Read-only. Buttons hidden & protected</span>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSignInSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Username or Email Address
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="admin or abrarshah2134896@gmail.com"
                      value={signInIdentifier}
                      onChange={(e) => setSignInIdentifier(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-2.5 rounded-lg flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-2.5 rounded-lg flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                  >
                    <span>Need to register with Gmail?</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition shadow-md shadow-blue-600/20 text-xs flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* ================= REGISTER TAB ================= */
            <>
              {/* Quick prefill helper */}
              <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-blue-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Register Admin with abrarshah2134896@gmail.com</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    1-click prefill with your Gmail address & admin privileges
                  </p>
                </div>
                <button
                  type="button"
                  onClick={prefillAdminGmail}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] rounded-lg transition shrink-0"
                >
                  Prefill
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="Abrar Shah"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="abrarshah"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Gmail / Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-blue-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="abrarshah2134896@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    All network alerts and system notifications will be dispatched to this address.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      placeholder="Create password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                    Select Account Role & Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole('admin')}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                        regRole === 'admin'
                          ? 'bg-blue-600/15 border-blue-500 text-blue-200 shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5 text-white text-xs">
                          <Shield className="w-3.5 h-3.5 text-blue-400" />
                          Administrator
                        </span>
                        {regRole === 'admin' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Full read/write control: config candidate buffer, commit, add devices, faults
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('student')}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                        regRole === 'student'
                          ? 'bg-amber-600/15 border-amber-500 text-amber-200 shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5 text-white text-xs">
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          Student
                        </span>
                        {regRole === 'student' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Viewer mode: topology exploration, telemetry observation, guided labs
                      </span>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-2.5 rounded-lg flex items-center gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-2.5 rounded-lg flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className="text-[11px] text-slate-400 hover:text-white transition"
                  >
                    Already have an account? Sign In →
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition shadow-md shadow-blue-600/20 text-xs flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register & Sign In</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer: Current active session */}
        <div className="bg-slate-800/80 px-6 py-3 border-t border-slate-800 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold text-[10px]">
              {currentUser.username[0]?.toUpperCase()}
            </div>
            <div>
              <span className="text-slate-300 font-medium">{currentUser.displayName}</span>
              {currentUser.email && (
                <span className="text-[10px] text-blue-400 font-mono ml-2">
                  ({currentUser.email})
                </span>
              )}
            </div>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
              currentUser.role === 'admin'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {currentUser.role === 'admin' ? 'Administrator' : 'Student (Viewer)'}
          </span>
        </div>
      </div>
    </div>
  );
};
