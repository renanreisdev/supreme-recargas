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
  X 
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

  const navSections: NavSection[] = [
    {
      label: 'Visão Geral',
      items: [
        {
          title: 'Dashboard Geral',
          href: '/dashboard',
          icon: LayoutDashboard,
          show: true
        }
      ]
    },
    {
      label: 'Atendimento & Balcão',
      items: [
        {
          title: 'Nova Entrada (Balcão)',
          href: '/entradas/nova',
          icon: PlusCircle,
          highlight: true,
          show: hasPermission('create_entry')
        },
        {
          title: 'Entradas & Entregas',
          href: '/entradas',
          icon: ClipboardList,
          show: hasPermission('view_entries')
        },
        {
          title: 'Clientes',
          href: '/clientes',
          icon: Users,
          show: hasPermission('view_customers')
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
      label: 'Oficina Técnica',
      items: [
        {
          title: 'Bancada Técnica (Kanban)',
          href: '/bancada',
          icon: Wrench,
          show: hasPermission('technical_workbench')
        }
      ]
    },
    {
      label: 'Gestão & Cadastros',
      items: [
        {
          title: 'Modelos & Preços',
          href: '/modelos',
          icon: Receipt,
          show: hasPermission('manage_models')
        },
        {
          title: 'Relatórios Financeiros',
          href: '/relatorios',
          icon: BarChart3,
          show: hasPermission('view_financial_reports')
        },
        {
          title: 'Auditoria & Logs',
          href: '/auditoria',
          icon: ShieldCheck,
          show: hasPermission('view_audit_logs')
        },
        {
          title: 'Configurações da Empresa',
          href: '/empresa',
          icon: Building2,
          show: hasPermission('manage_company')
        },
        {
          title: 'Super Admin SaaS',
          href: '/super-admin',
          icon: Crown,
          show: currentUser.role === 'SUPER_ADMIN'
        }
      ]
    }
  ];

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 select-none font-sans">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md font-bold text-white">
            <Zap className="w-5 h-5 fill-white text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1">
              Supreme <span className="text-emerald-400">Recargas</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">Sistema Operacional v2.0</p>
          </div>
        </div>

        {isMobile && (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tenant Indicator */}
      <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Empresa / Unidade</p>
            <span className="text-xs font-semibold text-slate-200 truncate block max-w-[170px]" title={currentCompany.trade_name}>
              {currentCompany.trade_name}
            </span>
          </div>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" title="Unidade Conectada" />
        </div>
      </div>

      {/* Real User Profile Identity Card */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-emerald-400 shrink-0 shadow-inner">
            {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="truncate flex-1">
            <p className="text-xs font-bold text-slate-100 truncate">{currentUser.full_name}</p>
            <Badge className={cn("text-[9px] px-1.5 py-0 font-bold mt-0.5", roleConfig.className)}>
              {roleConfig.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation Items grouped by section */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(i => i.show);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label} className="space-y-1">
              <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{section.label}</p>
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
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-all group",
                      isActive
                        ? "bg-emerald-600 text-white font-bold shadow-sm"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white",
                      item.highlight && !isActive && "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60 font-semibold"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/30 font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer Profile & Logout Controls */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowPasswordModal(true)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 px-2 py-1.5 rounded-md transition-all"
          title="Alterar Minha Senha de Acesso"
        >
          <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-medium">Senha</span>
        </button>

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 px-2.5 py-1.5 rounded-md border border-rose-900/40 transition-all shadow-sm"
          title="Sair do Sistema e Encerrar Sessão"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-[11px]">Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-slate-800 shadow-xl z-30 shrink-0">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
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
