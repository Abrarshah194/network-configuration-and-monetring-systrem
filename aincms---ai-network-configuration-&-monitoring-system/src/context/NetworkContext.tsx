import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, UserRole, NetworkDevice } from '../types/network';
import { fetchAppState, controlSimulation } from '../services/api';
import { logSystemAction } from '../services/auditLogger';

export interface AuthUser {
  username: string;
  email?: string;
  role: 'admin' | 'student';
  displayName: string;
}

export interface StoredUserAccount extends AuthUser {
  password?: string;
}

interface NetworkContextType {
  state: AppState | null;
  loading: boolean;
  error: string | null;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  currentUser: AuthUser;
  adminEmail: string;
  setAdminEmail: (email: string) => void;
  registeredUsers: StoredUserAccount[];
  login: (identifier: string, password: string) => { success: boolean; error?: string };
  register: (params: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    role: 'admin' | 'student';
  }) => { success: boolean; error?: string };
  logout: () => void;
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  geminiConfigured: boolean;
  refreshState: () => Promise<void>;
  toggleSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  stepSimulation: () => Promise<void>;
  selectedDevice: NetworkDevice | null;
  setSelectedDevice: (device: NetworkDevice | null) => void;
  diagnosticModalOpen: boolean;
  setDiagnosticModalOpen: (open: boolean) => void;
  diagnosticTargetDevice: NetworkDevice | null;
  setDiagnosticTargetDevice: (device: NetworkDevice | null) => void;
  routingModalOpen: boolean;
  setRoutingModalOpen: (open: boolean) => void;
  routingTargetDevice: NetworkDevice | null;
  setRoutingTargetDevice: (device: NetworkDevice | null) => void;
  emailAlertsEnabled: boolean;
  setEmailAlertsEnabled: (enabled: boolean) => void;
  emailToastMessage: string | null;
  setEmailToastMessage: (msg: string | null) => void;
  triggerEmailAlert: (alertTitle: string, deviceId?: string) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

const DEFAULT_REGISTERED_USERS: StoredUserAccount[] = [
  {
    username: 'admin',
    email: 'abrarshah2134896@gmail.com',
    password: 'admin123',
    role: 'admin',
    displayName: 'Abrar Shah (Admin)',
  },
  {
    username: 'student',
    email: 'student@aincms.edu',
    password: 'student123',
    role: 'student',
    displayName: 'Student (Viewer Mode)',
  },
];

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Admin notification email (defaults to abrarshah2134896@gmail.com)
  const [adminEmail, setAdminEmailState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('aincms_admin_email');
      if (stored) return stored;
    } catch {}
    return 'abrarshah2134896@gmail.com';
  });

  const setAdminEmail = (newEmail: string) => {
    setAdminEmailState(newEmail);
    try {
      localStorage.setItem('aincms_admin_email', newEmail);
    } catch {}
  };

  // Registered user accounts store
  const [registeredUsers, setRegisteredUsers] = useState<StoredUserAccount[]>(() => {
    try {
      const stored = localStorage.getItem('aincms_registered_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_REGISTERED_USERS;
  });

  // Auth & RBAC State (default admin with abrarshah2134896@gmail.com or restored from localStorage)
  const [currentUser, setCurrentUser] = useState<AuthUser>(() => {
    try {
      const stored = localStorage.getItem('aincms_current_user');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      username: 'admin',
      email: 'abrarshah2134896@gmail.com',
      role: 'admin',
      displayName: 'Abrar Shah (Admin)',
    };
  });

  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    return currentUser.role === 'admin' ? 'super_admin' : 'viewer';
  });

  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Email alerts simulation state
  const [emailAlertsEnabled, setEmailAlertsEnabledState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('aincms_email_alerts_enabled');
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const [emailToastMessage, setEmailToastMessage] = useState<string | null>(null);

  const setEmailAlertsEnabled = (enabled: boolean) => {
    setEmailAlertsEnabledState(enabled);
    try {
      localStorage.setItem('aincms_email_alerts_enabled', JSON.stringify(enabled));
    } catch {}
  };

  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
    if (role === 'viewer') {
      setCurrentUser((prev) => ({ ...prev, role: 'student', displayName: 'Student / Lab User' }));
    } else {
      setCurrentUser((prev) => ({
        ...prev,
        role: 'admin',
        email: prev.email || adminEmail || 'abrarshah2134896@gmail.com',
        displayName: prev.displayName.includes('Student') ? 'Abrar Shah (Admin)' : prev.displayName,
      }));
    }
  };

  const login = (identifier: string, password: string): { success: boolean; error?: string } => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    // Check against registered accounts in state and storage
    const matched = registeredUsers.find(
      (u) =>
        (u.username.toLowerCase() === cleanId || (u.email && u.email.toLowerCase() === cleanId)) &&
        u.password === cleanPass
    );

    if (matched) {
      const user: AuthUser = {
        username: matched.username,
        email: matched.email,
        role: matched.role,
        displayName: matched.displayName,
      };
      setCurrentUser(user);
      setUserRoleState(matched.role === 'admin' ? 'super_admin' : 'viewer');
      if (matched.role === 'admin' && matched.email) {
        setAdminEmail(matched.email);
      }
      try {
        localStorage.setItem('aincms_current_user', JSON.stringify(user));
      } catch {}
      logSystemAction({
        user: matched.role,
        action: 'USER_LOGIN',
        targetDevice: 'Auth Engine',
        status: 'Success',
        details: `${matched.displayName} (${matched.email || matched.username}) signed in as ${matched.role}`,
      });
      return { success: true };
    }

    // Direct fallback for default credentials
    if (
      (cleanId === 'admin' || cleanId === 'abrarshah2134896@gmail.com') &&
      cleanPass === 'admin123'
    ) {
      const user: AuthUser = {
        username: 'admin',
        email: 'abrarshah2134896@gmail.com',
        role: 'admin',
        displayName: 'Abrar Shah (Admin)',
      };
      setCurrentUser(user);
      setUserRoleState('super_admin');
      setAdminEmail('abrarshah2134896@gmail.com');
      try {
        localStorage.setItem('aincms_current_user', JSON.stringify(user));
      } catch {}
      logSystemAction({
        user: 'admin',
        action: 'USER_LOGIN',
        targetDevice: 'Auth Engine',
        status: 'Success',
        details: 'Admin (abrarshah2134896@gmail.com) signed in with Full Access privileges',
      });
      return { success: true };
    }

    if (cleanId === 'student' && cleanPass === 'student123') {
      const user: AuthUser = {
        username: 'student',
        email: 'student@aincms.edu',
        role: 'student',
        displayName: 'Student (Viewer Mode)',
      };
      setCurrentUser(user);
      setUserRoleState('viewer');
      try {
        localStorage.setItem('aincms_current_user', JSON.stringify(user));
      } catch {}
      logSystemAction({
        user: 'student',
        action: 'USER_LOGIN',
        targetDevice: 'Auth Engine',
        status: 'Success',
        details: 'Student signed in with Read-Only Viewer Mode',
      });
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid credentials. You can also register a new account with your Gmail address.',
    };
  };

  const register = (params: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    role: 'admin' | 'student';
  }): { success: boolean; error?: string } => {
    const cleanUsername = params.username.trim().toLowerCase();
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanPass = params.password.trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please provide a valid Gmail/email address.' };
    }

    if (!cleanPass || cleanPass.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }

    const displayName =
      params.displayName?.trim() ||
      (cleanEmail === 'abrarshah2134896@gmail.com' ? 'Abrar Shah (Admin)' : cleanUsername);

    // Check if user already exists
    const existingIndex = registeredUsers.findIndex(
      (u) => u.username.toLowerCase() === cleanUsername || (u.email && u.email.toLowerCase() === cleanEmail)
    );

    let updatedUsers: StoredUserAccount[];
    const updatedAccount: StoredUserAccount = {
      username: cleanUsername,
      email: cleanEmail,
      password: cleanPass,
      role: params.role,
      displayName,
    };

    if (existingIndex >= 0) {
      updatedUsers = [...registeredUsers];
      updatedUsers[existingIndex] = updatedAccount;
    } else {
      updatedUsers = [...registeredUsers, updatedAccount];
    }

    setRegisteredUsers(updatedUsers);
    try {
      localStorage.setItem('aincms_registered_users', JSON.stringify(updatedUsers));
    } catch {}

    // Auto sign in newly registered user
    const authUser: AuthUser = {
      username: cleanUsername,
      email: cleanEmail,
      role: params.role,
      displayName,
    };
    setCurrentUser(authUser);
    setUserRoleState(params.role === 'admin' ? 'super_admin' : 'viewer');
    if (params.role === 'admin') {
      setAdminEmail(cleanEmail);
    }
    try {
      localStorage.setItem('aincms_current_user', JSON.stringify(authUser));
    } catch {}

    logSystemAction({
      user: params.role,
      action: 'USER_REGISTER',
      targetDevice: 'Auth Engine',
      status: 'Success',
      details: `Registered and authenticated ${displayName} (${cleanEmail}) as ${params.role}`,
    });

    return { success: true };
  };

  const logout = () => {
    setLoginModalOpen(true);
  };

  const triggerEmailAlert = (alertTitle: string, deviceId?: string) => {
    if (!emailAlertsEnabled) return;
    const recipient = adminEmail || 'abrarshah2134896@gmail.com';
    const msg = `Email alert sent to ${recipient} — [${alertTitle}]`;
    setEmailToastMessage(msg);

    logSystemAction({
      user: 'system',
      action: 'EMAIL_ALERT_DISPATCH',
      targetDevice: deviceId || 'Alert Dispatcher',
      status: 'Success',
      details: `SMTP notification delivered to ${recipient}: ${alertTitle}`,
    });

    // Auto dismiss toast after 5 seconds
    setTimeout(() => {
      setEmailToastMessage((curr) => (curr === msg ? null : curr));
    }, 5000);
  };

  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);

  // Diagnostic ping/traceroute modal state
  const [diagnosticModalOpen, setDiagnosticModalOpen] = useState(false);
  const [diagnosticTargetDevice, setDiagnosticTargetDevice] = useState<NetworkDevice | null>(null);

  // Routing Table & ARP modal state
  const [routingModalOpen, setRoutingModalOpen] = useState(false);
  const [routingTargetDevice, setRoutingTargetDevice] = useState<NetworkDevice | null>(null);

  const refreshState = useCallback(async () => {
    try {
      const res = await fetchAppState();
      if (res.success) {
        setState(res.data);
        setGeminiConfigured(res.geminiConfigured);
        setError(null);

        // Keep selected device reference updated
        if (selectedDevice) {
          const fresh = res.data.devices.find((d) => d.id === selectedDevice.id);
          if (fresh) setSelectedDevice(fresh);
        }
      }
    } catch (err: any) {
      console.error('Polling error:', err);
      setError('Unable to synchronize with network simulation backend.');
    } finally {
      setLoading(false);
    }
  }, [selectedDevice]);

  useEffect(() => {
    refreshState();
    const interval = setInterval(refreshState, 3000);
    return () => clearInterval(interval);
  }, [refreshState]);

  const toggleSimulation = async () => {
    if (!state) return;
    const action = state.simulationState === 'RUNNING' ? 'pause' : 'resume';
    await controlSimulation(action, undefined, undefined, userRole);
    logSystemAction({
      user: currentUser.role,
      action: `SIMULATION_${action.toUpperCase()}`,
      targetDevice: 'Virtual Clock',
      status: 'Success',
      details: `Simulation clock state toggled to ${action.toUpperCase()}`,
    });
    await refreshState();
  };

  const resetSimulation = async () => {
    await controlSimulation('reset', undefined, undefined, userRole);
    logSystemAction({
      user: currentUser.role,
      action: 'SIMULATION_RESET',
      targetDevice: 'Simulation Core',
      status: 'Success',
      details: 'Topology and state reset to deterministic baseline #42',
    });
    await refreshState();
  };

  const stepSimulation = async () => {
    await controlSimulation('step', undefined, undefined, userRole);
    logSystemAction({
      user: currentUser.role,
      action: 'SIMULATION_STEP',
      targetDevice: 'Virtual Clock',
      status: 'Success',
      details: 'Simulation manually advanced by 1 tick',
    });
    await refreshState();
  };

  return (
    <NetworkContext.Provider
      value={{
        state,
        loading,
        error,
        userRole,
        setUserRole,
        currentUser,
        adminEmail,
        setAdminEmail,
        registeredUsers,
        register,
        login,
        logout,
        loginModalOpen,
        setLoginModalOpen,
        geminiConfigured,
        refreshState,
        toggleSimulation,
        resetSimulation,
        stepSimulation,
        selectedDevice,
        setSelectedDevice,
        diagnosticModalOpen,
        setDiagnosticModalOpen,
        diagnosticTargetDevice,
        setDiagnosticTargetDevice,
        routingModalOpen,
        setRoutingModalOpen,
        routingTargetDevice,
        setRoutingTargetDevice,
        emailAlertsEnabled,
        setEmailAlertsEnabled,
        emailToastMessage,
        setEmailToastMessage,
        triggerEmailAlert,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
