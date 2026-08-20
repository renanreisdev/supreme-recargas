'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Profile, Company, UserRole } from '@/types';
import { MOCK_PROFILES, MOCK_COMPANY_SUPREME, AppStore } from '@/lib/store';
import { toast } from '@/lib/toast';

const AUTH_STORAGE_KEY = 'supreme_auth_user';
const AUTH_SESSION_KEY = 'supreme_session_token';

export function getBrowserDeviceDescription(): string {
  if (typeof window === 'undefined') return 'Dispositivo Web';
  const ua = window.navigator.userAgent;
  let browser = 'Navegador Web';
  let os = 'Desktop';

  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS (Apple)';

  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';

  return `${os} • ${browser}`;
}

export type LogoutReason = 'manual' | 'concurrent_session' | 'inactivity';

interface AuthContextType {
  currentUser: Profile | null;
  currentCompany: Company;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: Profile; error?: string }>;
  logout: (reason?: LogoutReason) => void;
  changePassword: (newPassword: string) => { success: boolean; error?: string };
  updateMyInactivityTimeout: (minutes: number) => boolean;
  setCurrentUser: (user: Profile | null) => void;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const lastActivityRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false);

  const currentCompany: Company = React.useMemo(() => {
    if (currentUser?.tenant_id) {
      return AppStore.getCompany(currentUser.tenant_id);
    }
    return MOCK_COMPANY_SUPREME;
  }, [currentUser]);

  const setCurrentUser = useCallback((user: Profile | null) => {
    setCurrentUserState(user);
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        if (user.active_session_token) {
          localStorage.setItem(AUTH_SESSION_KEY, user.active_session_token);
        }
        if (user.tenant_id) {
          AppStore.initRealtime(user.tenant_id);
        }
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_SESSION_KEY);
      }
    }
  }, []);

  const logout = useCallback((reason: LogoutReason = 'manual') => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    if (currentUser && reason === 'manual') {
      AppStore.logLogout(currentUser);
    }

    setCurrentUser(null);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_SESSION_KEY);
    }

    if (reason === 'concurrent_session') {
      toast.warning('Esta conta foi conectada em outro dispositivo. Sessão encerrada.');
      router.push('/login?reason=concurrent_session');
    } else if (reason === 'inactivity') {
      toast.info('Sua sessão foi encerrada automaticamente por inatividade.');
      router.push('/login?reason=inactivity');
    } else {
      router.push('/login');
    }

    setTimeout(() => {
      isLoggingOutRef.current = false;
    }, 1000);
  }, [currentUser, router, setCurrentUser]);

  // Load session from localStorage on boot
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        const storedToken = localStorage.getItem(AUTH_SESSION_KEY);

        if (stored) {
          const parsed: Profile = JSON.parse(stored);
          const all = AppStore.getAllProfiles();
          const fresh = all.find(u => u.id === parsed.id || u.email.toLowerCase() === parsed.email?.toLowerCase()) || parsed;

          if (fresh && fresh.is_active !== false) {
            // Check if concurrent session invalidation occurred while offline
            if (storedToken && fresh.active_session_token && fresh.active_session_token !== storedToken) {
              localStorage.removeItem(AUTH_STORAGE_KEY);
              localStorage.removeItem(AUTH_SESSION_KEY);
              router.replace('/login?reason=concurrent_session');
              return;
            }

            // Also check remote database session token immediately
            AppStore.fetchRemoteProfileSession(fresh.id).then(remote => {
              if (remote) {
                if (remote.is_active === false) {
                  localStorage.removeItem(AUTH_STORAGE_KEY);
                  localStorage.removeItem(AUTH_SESSION_KEY);
                  router.replace('/login');
                  return;
                }
                if (storedToken && remote.active_session_token && remote.active_session_token !== storedToken) {
                  localStorage.removeItem(AUTH_STORAGE_KEY);
                  localStorage.removeItem(AUTH_SESSION_KEY);
                  router.replace('/login?reason=concurrent_session');
                }
              }
            }).catch(() => {});

            setCurrentUserState(fresh);
            if (fresh.tenant_id) {
              AppStore.initRealtime(fresh.tenant_id);
              AppStore.syncFromSupabase(fresh.tenant_id);
            } else {
              AppStore.syncFromSupabase();
            }
          } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            localStorage.removeItem(AUTH_SESSION_KEY);
          }
        }
      }
    } catch (e) {
      console.error('Error loading session:', e);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // User activity tracker for inactivity auto-logout
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const recordActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(evt => window.addEventListener(evt, recordActivity, { passive: true }));

    return () => {
      events.forEach(evt => window.removeEventListener(evt, recordActivity));
    };
  }, []);

  // Periodic Watchdog: Single Active Session Enforcement & Inactivity Timeout
  useEffect(() => {
    if (!currentUser || typeof window === 'undefined') return;

    const interval = setInterval(() => {
      if (isLoggingOutRef.current) return;

      // 1. Inactivity Timeout Check
      const timeoutMinutes = AppStore.getUserInactivityTimeout(currentUser.id);
      if (timeoutMinutes > 0) {
        const idleMs = Date.now() - lastActivityRef.current;
        const maxIdleMs = timeoutMinutes * 60 * 1000;
        if (idleMs >= maxIdleMs) {
          logout('inactivity');
          return;
        }
      }

      // 2. Single Active Session Check (Concurrent Login Detection)
      const localToken = localStorage.getItem(AUTH_SESSION_KEY);
      if (localToken) {
        // Fast in-memory check
        const all = AppStore.getAllProfiles();
        const fresh = all.find(p => p.id === currentUser.id);
        if (fresh && fresh.active_session_token && fresh.active_session_token !== localToken) {
          logout('concurrent_session');
          return;
        }

        // Direct real-time check against Supabase database
        AppStore.fetchRemoteProfileSession(currentUser.id).then(remote => {
          if (!remote) return;
          if (remote.is_active === false) {
            logout('manual');
            return;
          }
          if (remote.active_session_token && remote.active_session_token !== localToken) {
            logout('concurrent_session');
          }
        }).catch(() => {});
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [currentUser, logout]);

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: Profile; error?: string }> => {
    try {
      const deviceInfo = {
        device: getBrowserDeviceDescription()
      };
      const user = await AppStore.authenticateAsync(email, password, deviceInfo);
      setCurrentUser(user);
      lastActivityRef.current = Date.now();

      if (user.tenant_id) {
        AppStore.syncFromSupabase(user.tenant_id);
      } else {
        AppStore.syncFromSupabase();
      }
      return { success: true, user };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Falha ao autenticar.' };
    }
  };

  const changePassword = (newPassword: string): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: 'Usuário não autenticado.' };
    try {
      const updated = AppStore.changeUserPassword(currentUser.id, newPassword, currentUser.full_name);
      setCurrentUser(updated);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao alterar senha.' };
    }
  };

  const updateMyInactivityTimeout = useCallback((minutes: number): boolean => {
    if (!currentUser) return false;
    try {
      AppStore.updateUserInactivityTimeout(currentUser.id, minutes, currentUser.full_name);
      setCurrentUserState(prev => prev ? { ...prev, inactivity_timeout_minutes: minutes } : null);
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.inactivity_timeout_minutes = minutes;
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
        }
      }
      return true;
    } catch (e) {
      console.error('Error updating my inactivity timeout:', e);
      return false;
    }
  }, [currentUser]);

  const refreshUser = () => {
    if (!currentUser) return;
    try {
      const all = AppStore.getAllProfiles();
      const found = all.find(p => p.id === currentUser.id);
      if (found) {
        setCurrentUser(found);
      }
    } catch (e) {
      // fallback
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;

    // 1. Check if user has explicit granular override in custom_permissions
    if (currentUser.custom_permissions && typeof currentUser.custom_permissions[permission] === 'boolean') {
      return currentUser.custom_permissions[permission];
    }

    // 2. Check if user belongs to a permission group
    if (currentUser.group_id) {
      try {
        const groups = AppStore.getPermissionGroups(currentUser.tenant_id);
        const group = groups.find(g => g.id === currentUser.group_id);
        if (group && group.permissions && typeof group.permissions[permission] === 'boolean') {
          return group.permissions[permission];
        }
      } catch (e) {
        // fallback to role
      }
    }

    // 3. Fallback to base role permissions
    switch (permission) {
      // Admin exclusive permissions (can be granted to others via custom_permissions or group)
      case 'manage_company':
      case 'manage_users':
      case 'manage_models':
      case 'manage_services':
      case 'manage_prices':
      case 'customize_kanban':
      case 'view_financial_reports':
      case 'view_revenue_dashboard':
      case 'view_audit_logs':
      case 'reopen_entry':
      case 'delete_entry':
      case 'close_uncompleted_entry':
      case 'apply_discount_on_delivery':
      case 'change_assigned_technician':
      case 'transfer_assigned_tech_order':
      case 'edit_other_technician_orders':
        return currentUser.role === 'ADMINISTRADOR';

      // Attendant & Admin permissions (Balcão de Atendimento)
      case 'create_entry':
      case 'view_entries':
      case 'register_delivery':
      case 'print_ticket':
      case 'view_customers':
      case 'create_customer':
      case 'edit_customer':
        return ['ADMINISTRADOR', 'ATENDENTE'].includes(currentUser.role);

      // Technician & Admin permissions (Bancada Técnica)
      case 'technical_workbench':
      case 'register_weight':
      case 'register_diagnosis':
      case 'update_tech_status':
        return ['ADMINISTRADOR', 'TECNICO'].includes(currentUser.role);

      default:
        return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentCompany,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        changePassword,
        updateMyInactivityTimeout,
        setCurrentUser,
        hasPermission,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
