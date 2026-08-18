'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn, getRoleBadgeConfig } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const { currentUser, currentCompany, logout, changePassword, hasPermission } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState('');

  if (!currentUser) return null;

  const roleConfig = getRoleBadgeConfig(currentUser.role);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    if (!newPassword || newPassword.length < 4) {
      setPassError('A senha deve ter no mínimo 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('As senhas não coincidem.');
      return;
    }

    const res = changePassword(newPassword);
    if (res.success) {
      setPassSuccess(true);
      setTimeout(() => {
        setPassSuccess(false);
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } else {
      setPassError(res.error || 'Erro ao alterar senha.');
    }
  };

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

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
          show: hasPermission('create_entry')
        },
        {
          title: 'Bancada Técnica (Kanban)',
          href: '/bancada',
          icon: Wrench,
          show: hasPermission('technical_workbench')
        },
        {
          title: 'Entradas & Histórico',
          href: '/entradas',
          icon: ClipboardList,
          show: hasPermission('view_entries')
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
          show: hasPermission('view_customers')
        },
        {
          title: 'Modelos & Serviços',
          href: '/modelos',
          icon: Receipt,
          show: hasPermission('manage_models')
        },
        {
          title: 'Impressão de Comandas',
          href: '/impressao',
          icon: Printer,
          show: hasPermission('print_ticket')
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
          show: hasPermission('view_financial_reports')
        },
        {
          title: 'Logs de Auditoria',
          href: '/auditoria',
          icon: ShieldCheck,
          show: hasPermission('view_audit_logs')
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
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-900/20 font-bold text-white transition-transform group-hover:scale-105">
            <Zap className="w-5 h-5 fill-white text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                Supreme <span className="text-emerald-600 dark:text-emerald-400">Recargas</span>
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
      <div className="p-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/20">
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Unidade Ativa</p>
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5" title={currentCompany.trade_name}>
              {currentCompany.trade_name}
            </span>
          </div>
          <Badge variant="outline" className="text-[9px] font-mono border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-1.5 py-0 shrink-0">
            Multissegmento
          </Badge>
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
            onClick={() => setShowPasswordModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-all font-medium shadow-xs"
            title="Alterar Minha Senha de Acesso"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px]">Senha</span>
          </button>

          <button
            type="button"
            onClick={logout}
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

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Alterar Minha Senha</h3>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {passSuccess ? (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs text-center flex items-center justify-center gap-2 font-bold">
                <Check className="w-4 h-4" /> Senha alterada com sucesso!
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                {passError && (
                  <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs">
                    {passError}
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-300 mb-1 block font-semibold">Nova Senha</label>
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
                  <label className="text-xs text-slate-300 mb-1 block font-semibold">Confirmar Nova Senha</label>
                  <Input
                    type="password"
                    required
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-xs bg-slate-950 border-slate-700 text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowPasswordModal(false)} className="text-xs border-slate-700 text-slate-300">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                    Salvar Nova Senha
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
