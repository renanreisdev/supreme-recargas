'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ClipboardList, 
  Wrench, 
  Users, 
  Printer, 
  BarChart3, 
  Receipt, 
  ShieldCheck, 
  Building2, 
  Crown,
  Zap, 
  LogOut, 
  KeyRound, 
  Check, 
  X,
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
  ArrowUpRight,
  Timer,
  Smartphone,
  Banknote,
  Mail,
  Lock
} from 'lucide-react';
import { useAuth, getBrowserDeviceDescription } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { cn, getRoleBadgeConfig } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandIcon } from '@/components/ui/brand-logo';

interface NavItem {
  title: string;
  href: string;
  icon: any;
  show: boolean;
  highlight?: boolean;
  badge?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, currentCompany, logout, changePassword, updateMyInactivityTimeout, hasPermission, impersonatedTenantId, impersonateCompany } = useAuth();
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountTab, setAccountTab] = useState<'timeout' | 'password'>('timeout');
  const [myTimeout, setMyTimeout] = useState<number>(0);
  const [timeoutSaved, setTimeoutSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordResetMode, setPasswordResetMode] = useState<'current_password' | 'email_reset'>('current_password');
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [resetEmailMessage, setResetEmailMessage] = useState('');
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState('');
  const [, setStoreVersion] = useState(0);

  useEffect(() => {
    const onStoreUpdated = () => setStoreVersion((v) => v + 1);
    window.addEventListener('supreme_store_updated', onStoreUpdated);
    return () => window.removeEventListener('supreme_store_updated', onStoreUpdated);
  }, []);

  if (!currentUser) return null;

  const roleConfig = getRoleBadgeConfig(currentUser.role);
  const isGlobalSuperAdmin = currentUser.role === 'SUPER_ADMIN' && !impersonatedTenantId;
  const companyLimits = currentCompany && !isGlobalSuperAdmin ? AppStore.getEffectiveLimits(currentCompany.id) : null;

  const handleOpenAccountModal = (tab: 'timeout' | 'password' = 'timeout') => {
    setAccountTab(tab);
    setMyTimeout(currentUser?.inactivity_timeout_minutes ?? 0);
    setPassError('');
    setPassSuccess(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordResetMode('current_password');
    setResetCodeSent(false);
    setResetCodeInput('');
    setResetEmailMessage('');
    setShowAccountModal(true);
  };

  const handleSaveTimeout = (e: React.FormEvent) => {
    e.preventDefault();
    const success = updateMyInactivityTimeout(Number(myTimeout) || 0);
    if (success) {
      setTimeoutSaved(true);
      toast.success('Configuração de logout automático salva com sucesso!');
      setTimeout(() => {
        setTimeoutSaved(false);
        setShowAccountModal(false);
      }, 1200);
    } else {
      toast.error('Erro ao salvar configuração.');
    }
  };

  const handleSendEmailResetCode = async () => {
    if (!currentUser?.email) return;
    setPassError('');
    setIsSendingResetEmail(true);
    try {
      const res = await AppStore.requestPasswordResetByEmail(currentUser.email);
      setResetCodeSent(true);
      setResetEmailMessage(res.message);
      toast.info(`Redefinição solicitada para ${res.maskedEmail}.`);
    } catch (err: any) {
      setPassError(err?.message || 'Não foi possível enviar a redefinição para o e-mail cadastrado.');
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');

    if (!newPassword || newPassword.length < 4) {
      setPassError('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('As senhas não coincidem.');
      return;
    }

    if (passwordResetMode === 'email_reset') {
      if (!resetCodeInput.trim()) {
        setPassError('Informe o código de verificação recebido no e-mail cadastrado.');
        return;
      }
      try {
        AppStore.confirmPasswordResetByEmail(currentUser.email, resetCodeInput, newPassword);
        setPassSuccess(true);
        toast.success('Senha redefinida com sucesso!');
        setTimeout(() => {
          setPassSuccess(false);
          setShowAccountModal(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setResetCodeInput('');
          setResetCodeSent(false);
        }, 1500);
      } catch (err: any) {
        setPassError(err?.message || 'Código inválido ou expirado.');
      }
      return;
    }

    if (!currentPassword.trim()) {
      setPassError('Por segurança, informe sua senha atual.');
      return;
    }

    const res = changePassword(newPassword, false, currentPassword);
    if (res.success) {
      setPassSuccess(true);
      toast.success('Senha alterada com sucesso!');
      setTimeout(() => {
        setPassSuccess(false);
        setShowAccountModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } else {
      setPassError(res.error || 'Erro ao alterar senha.');
    }
  };

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN' && !impersonatedTenantId;
  const isSupportMode = currentUser.role === 'SUPER_ADMIN' && Boolean(impersonatedTenantId);

  const navSections: NavSection[] = isSuperAdmin ? [
    {
      label: 'Administração Master SaaS',
      items: [
        {
          title: 'Central Super Admin',
          href: '/super-admin',
          icon: Crown,
          highlight: true,
          badge: 'MASTER',
          show: true
        },
        {
          title: 'Auditoria Global',
          href: '/auditoria',
          icon: ShieldCheck,
          show: true
        }
      ]
    }
  ] : [
    {
      label: 'Operacional',
      items: [
        {
          title: 'Visão Geral (Dashboard)',
          href: '/dashboard',
          icon: LayoutDashboard,
          show: true
        },
        {
          title: 'Nova Entrada / OS',
          href: '/entradas/nova',
          icon: PlusCircle,
          highlight: true,
          show: hasPermission('create_entry') && AppStore.isModuleEnabledForTenant(currentCompany.id, 'balcao_os')
        },
        {
          title: 'Frente de Caixa (PDV)',
          href: '/caixa',
          icon: Banknote,
          show: ['ADMINISTRADOR', 'ATENDENTE'].includes(currentUser.role) && AppStore.isModuleEnabledForTenant(currentCompany.id, 'frente_caixa')
        },
        {
          title: 'Bancada Técnica (Kanban)',
          href: '/bancada',
          icon: Wrench,
          show: hasPermission('technical_workbench') && AppStore.isModuleEnabledForTenant(currentCompany.id, 'bancada_kanban')
        },
        {
          title: 'Entradas & Histórico',
          href: '/entradas',
          icon: ClipboardList,
          show: hasPermission('view_entries') && AppStore.isModuleEnabledForTenant(currentCompany.id, 'balcao_os')
        }
      ]
    },
    {
      label: 'Cadastros & Atendimento',
      items: [
        {
          title: 'Clientes',
          href: '/clientes',
          icon: Users,
          show: hasPermission('view_customers') && AppStore.isModuleEnabledForTenant(currentCompany.id, 'clientes_whatsapp')
        },
        {
          title: 'Modelos & Serviços',
          href: '/modelos',
          icon: Receipt,
          show: hasPermission('manage_models') && AppStore.isModuleEnabledForTenant(currentCompany.id, 'catalogo_modelos')
        },
        {
          title: 'Impressão de Comandas',
          href: '/impressao',
          icon: Printer,
          show: hasPermission('print_ticket') && AppStore.isModuleEnabledForTenant(currentCompany.id, 'comandas_qr')
        }
      ]
    },
    {
      label: 'Gestão & Empresa',
      items: [
        {
          title: 'Relatórios & Indicadores',
          href: '/relatorios',
          icon: BarChart3,
          show: hasPermission('view_financial_reports') && AppStore.isModuleEnabledForTenant(currentCompany.id, 'relatorios_financeiros')
        },
        {
          title: 'Logs de Auditoria',
          href: '/auditoria',
          icon: ShieldCheck,
          show: hasPermission('view_audit_logs') && AppStore.isModuleEnabledForTenant(currentCompany.id, 'auditoria_lgpd')
        },
        {
          title: 'Minha Empresa & Ajustes',
          href: '/empresa',
          icon: Building2,
          show: hasPermission('manage_company')
        }
      ]
    }
  ];

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-white dark:bg-[#0c1222] text-slate-800 dark:text-slate-100 select-none font-sans border-r border-slate-200/80 dark:border-slate-800/80 transition-colors duration-150">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <BrandIcon className="w-10 h-10 shrink-0 transition-transform group-hover:scale-105" />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                Agil <span className="text-emerald-600 dark:text-emerald-400">OS</span>
              </h1>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-tight">Gestão Operacional de Assistência</p>
          </div>
        </Link>

        {isMobile && (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tenant Indicator Card */}
      <div className="p-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/20 space-y-2">
        {isSupportMode && (
          <button
            type="button"
            onClick={() => {
              impersonateCompany(null);
              if (isMobile && onMobileClose) onMobileClose();
              router.push('/super-admin');
            }}
            className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Sair do Modo Suporte</span>
          </button>
        )}
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shadow-xs">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Unidade Ativa</p>
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5" title={currentCompany.trade_name}>
              {currentCompany.trade_name}
            </span>
            {companyLimits && (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate block mt-0.5" title={companyLimits.plan.name}>
                {companyLimits.plan.name}
              </span>
            )}
          </div>
          {companyLimits ? (
            <Badge
              variant="outline"
              className={`text-[9px] font-mono px-1.5 py-0.5 shrink-0 ${
                !companyLimits.canAddUser
                  ? 'border-amber-200 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300'
              }`}
              title={`${companyLimits.usedUsers} de ${companyLimits.maxUsers} usuários ativos no plano`}
            >
              {companyLimits.usedUsers}/{companyLimits.maxUsers} usu.
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[9px] font-mono border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-1.5 py-0 shrink-0">
              Multissegmento
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation Items grouped by section */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(i => i.show);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label} className="space-y-1">
              <div className="px-2.5 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.label}
                </span>
              </div>

              {visibleItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      if (isMobile && onMobileClose) onMobileClose();
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative",
                      isActive
                        ? "bg-emerald-600 text-white shadow-xs font-bold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white",
                      item.highlight && !isActive && "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50 font-bold shadow-xs"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 shrink-0 transition-transform group-hover:scale-105",
                      isActive ? "text-white" : item.highlight ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                    )} />
                    <span className="truncate flex-1">{item.title}</span>
                    
                    {item.badge && (
                      <span className="ml-auto text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-200 dark:border-amber-500/30 font-bold">
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white ml-auto shrink-0 shadow-xs" />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer Profile & Logout Controls */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/60">
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 mb-2 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center font-extrabold text-xs shrink-0">
              {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">{currentUser.full_name}</p>
              <Badge className={cn("text-[9px] px-1.5 py-0 font-semibold mt-0.5", roleConfig.className)}>
                {roleConfig.label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleOpenAccountModal('timeout')}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-all font-medium shadow-xs"
            title="Configurar Auto-Logout e Segurança"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px]">Segurança</span>
          </button>

          <button
            type="button"
            onClick={() => logout()}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-300 hover:text-rose-700 dark:hover:text-white hover:bg-rose-50 dark:hover:bg-rose-950/70 px-2 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 transition-all shadow-xs"
            title="Sair do Sistema e Encerrar Sessão"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-[11px]">Sair</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-slate-800 shadow-2xl z-30 shrink-0 print:hidden">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex print:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onMobileClose} 
          />

          {/* Drawer Sidebar */}
          <div className="relative w-72 max-w-[82vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* MODAL: MEU PERFIL & SEGURANÇA (Auto-Logout e Senha) */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Meu Perfil & Segurança</h3>
                  <p className="text-[11px] text-slate-400">{currentUser.full_name} ({roleConfig.label})</p>
                </div>
              </div>
              <button onClick={() => setShowAccountModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setAccountTab('timeout')}
                className={cn(
                  "flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5",
                  accountTab === 'timeout' ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Auto-Logout & Sessão</span>
              </button>

              <button
                type="button"
                onClick={() => setAccountTab('password')}
                className={cn(
                  "flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5",
                  accountTab === 'password' ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Alterar Senha</span>
              </button>
            </div>

            {accountTab === 'timeout' ? (
              <form onSubmit={handleSaveTimeout} className="space-y-4">
                {/* Active Device Info */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                      <span>Sessão Atual Neste Navegador</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Ativa Agora
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Dispositivo: <strong className="text-slate-200">{getBrowserDeviceDescription()}</strong>
                  </p>
                </div>

                {/* Inactivity Timeout Config */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tempo Limite de Inatividade (Auto-Logout)</span>
                  </label>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Escolha após quanto tempo sem mexer no sistema a sua sessão deve ser encerrada por segurança:
                  </p>
                  <select
                    value={myTimeout}
                    onChange={(e) => setMyTimeout(Number(e.target.value))}
                    className="w-full h-9 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white px-3 font-semibold focus:border-emerald-500 focus:outline-none"
                  >
                    <option value={0}>0 — Desativado (Permanecer sempre conectado)</option>
                    <option value={5}>5 minutos de inatividade</option>
                    <option value={10}>10 minutos de inatividade</option>
                    <option value={15}>15 minutos de inatividade</option>
                    <option value={30}>30 minutos de inatividade</option>
                    <option value={60}>60 minutos (1 hora)</option>
                    <option value={120}>120 minutos (2 horas)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAccountModal(false)} className="text-xs border-slate-700 text-slate-300">
                    Fechar
                  </Button>
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                    Salvar Preferência
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                {passSuccess ? (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs text-center flex items-center justify-center gap-2 font-bold">
                    <Check className="w-4 h-4" /> Senha alterada com sucesso!
                  </div>
                ) : (
                  <>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                      <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        {passwordResetMode === 'current_password'
                          ? 'Por segurança, confirme sua senha atual antes de cadastrar uma nova senha.'
                          : `Redefinição via e-mail cadastrado (${currentUser.email}).`}
                      </span>
                    </div>

                    {passError && (
                      <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs">
                        {passError}
                      </div>
                    )}

                    {passwordResetMode === 'current_password' ? (
                      <div>
                        <label className="text-xs text-slate-300 mb-1 block font-semibold">Senha Atual *</label>
                        <Input
                          type="password"
                          required
                          placeholder="Digite sua senha atual"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="text-xs bg-slate-950 border-slate-700 text-white"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-emerald-400" />
                              E-mail cadastrado:
                            </span>
                            <span className="font-mono text-[11px] text-slate-200 truncate">{currentUser.email}</span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isSendingResetEmail}
                            onClick={handleSendEmailResetCode}
                            className="w-full text-xs border-emerald-700/70 text-emerald-300 hover:bg-emerald-950/50 gap-1.5"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>
                              {isSendingResetEmail
                                ? 'Enviando solicitação...'
                                : resetCodeSent
                                  ? 'Reenviar Redefinição para o E-mail'
                                  : 'Enviar Redefinição para o E-mail'}
                            </span>
                          </Button>
                          {resetEmailMessage && (
                            <p className="text-[11px] text-emerald-300 leading-relaxed bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-2">
                              {resetEmailMessage}
                            </p>
                          )}
                        </div>

                        {resetCodeSent && (
                          <div>
                            <label className="text-xs text-slate-300 mb-1 block font-semibold">Código recebido no e-mail *</label>
                            <Input
                              type="text"
                              required
                              inputMode="numeric"
                              maxLength={6}
                              placeholder="Código de 6 dígitos"
                              value={resetCodeInput}
                              onChange={(e) => setResetCodeInput(e.target.value)}
                              className="text-xs font-mono bg-slate-950 border-slate-700 text-white tracking-widest"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {(passwordResetMode === 'current_password' || resetCodeSent) && (
                      <>
                        <div>
                          <label className="text-xs text-slate-300 mb-1 block font-semibold">Nova Senha *</label>
                          <Input
                            type="password"
                            required
                            placeholder="Mínimo 4 dígitos"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="text-xs bg-slate-950 border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-300 mb-1 block font-semibold">Confirmar Nova Senha *</label>
                          <Input
                            type="password"
                            required
                            placeholder="Repita a nova senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="text-xs bg-slate-950 border-slate-700 text-white"
                          />
                        </div>
                      </>
                    )}

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPassError('');
                          setPasswordResetMode(prev => (prev === 'current_password' ? 'email_reset' : 'current_password'));
                        }}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2 font-medium"
                      >
                        {passwordResetMode === 'current_password'
                          ? `Esqueceu a senha atual? Redefinir via e-mail cadastrado`
                          : 'Voltar e informar a senha atual'}
                      </button>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowAccountModal(false)} className="text-xs border-slate-700 text-slate-300">
                        Cancelar
                      </Button>
                      {(passwordResetMode === 'current_password' || resetCodeSent) && (
                        <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                          Salvar Nova Senha
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
