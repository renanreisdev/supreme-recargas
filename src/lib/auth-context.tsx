'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Profile, Company, UserRole } from '@/types';
import { MOCK_PROFILES, MOCK_COMPANY_SUPREME, AppStore } from '@/lib/store';

const AUTH_STORAGE_KEY = 'supreme_auth_user';

interface AuthContextType {
  currentUser: Profile | null;
  currentCompany: Company;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => { success: boolean; user?: Profile; error?: string };
  logout: () => void;
  changePassword: (newPassword: string) => { success: boolean; error?: string };
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

  const currentCompany: Company = React.useMemo(() => {
    if (currentUser?.tenant_id) {
      return AppStore.getCompany(currentUser.tenant_id);
    }
    return MOCK_COMPANY_SUPREME;
  }, [currentUser]);

  // Load session from localStorage on boot
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed: Profile = JSON.parse(stored);
          const all = AppStore.getAllProfiles();
          const fresh = all.find(u => u.id === parsed.id || u.email.toLowerCase() === parsed.email?.toLowerCase()) || parsed;
          if (fresh && fresh.is_active !== false) {
            setCurrentUserState(fresh);
            if (fresh.tenant_id) {
              AppStore.initRealtime(fresh.tenant_id);
            }
          } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      }
    } catch (e) {
      console.error('Error loading session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setCurrentUser = (user: Profile | null) => {
    setCurrentUserState(user);
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        if (user.tenant_id) {
          AppStore.initRealtime(user.tenant_id);
        }
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  };

  const login = (email: string, password: string): { success: boolean; user?: Profile; error?: string } => {
    try {
      const user = AppStore.authenticate(email, password);
      setCurrentUser(user);
      return { success: true, user };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Falha ao autenticar.' };
    }
  };

  const logout = () => {
    if (currentUser) {
      AppStore.logLogout(currentUser);
    }
    setCurrentUser(null);
    router.push('/login');
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



