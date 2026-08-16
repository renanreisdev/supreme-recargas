'use client';

import React, { useState } from 'react';
import { Search, PlusCircle, ExternalLink, QrCode, LogOut, Menu, Zap, Cloud, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getRoleBadgeConfig } from '@/lib/utils';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export function Header({ onToggleMobileMenu }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();
  const { currentUser, currentCompany, logout, hasPermission } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/entradas?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await AppStore.syncFromSupabase(currentCompany.id);
    setTimeout(() => setIsSyncing(false), 800);
  };

  const roleConfig = currentUser ? getRoleBadgeConfig(currentUser.role) : null;

  return (
    <header className="h-16 bg-white/90 dark:bg-[#0c1222]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs gap-3 print:hidden">
      {/* Mobile Hamburger Menu & Logo (Visible only on < lg) */}
      <div className="flex items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors shadow-xs"
          title="Abrir Menu Lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 sm:hidden">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Zap className="w-4 h-4 fill-white" />
          </div>
        </div>
      </div>

      {/* Global Omnibar Search */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-[220px] sm:max-w-xs md:max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar comanda, cliente, serial ou OS..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-14 py-2 text-xs font-medium bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 rounded-xl outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-slate-100 shadow-inner"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 pointer-events-none">
          <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-500 rounded border border-slate-300 dark:border-slate-700 font-semibold">
            ↵ Enter
          </kbd>
        </div>
      </form>

      {/* Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Cloud Sync Status Indicator */}
        <button
          type="button"
          onClick={handleManualSync}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all shadow-xs"
          title="Sincronização em nuvem ativa. Clique para atualizar agora."
        >
          <span className={`w-2 h-2 rounded-full bg-emerald-500 ${isSyncing ? 'animate-spin' : 'animate-pulse'} shadow-sm shadow-emerald-500/50`} />
          <span>{isSyncing ? 'Sincronizando...' : 'Nuvem Online'}</span>
        </button>

        {/* Public Tracking Link */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/acompanhar')}
          className="text-xs text-slate-600 dark:text-slate-300 gap-1.5 h-9 rounded-xl border-slate-200 dark:border-slate-700/80 hover:border-emerald-400 hidden md:flex font-semibold shadow-xs"
        >
          <QrCode className="w-3.5 h-3.5 text-emerald-600" />
          <span>Rastreio Online</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </Button>

        {/* Quick New Entry Primary Button */}
        {hasPermission('create_entry') && (
          <Button
            size="sm"
            onClick={() => router.push('/entradas/nova')}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs h-9 rounded-xl text-white shadow-md shadow-emerald-950/30 px-3 sm:px-4 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden md:inline">+ Nova Entrada / OS</span>
            <span className="md:hidden">+ Nova OS</span>
          </Button>
        )}

        {/* User Identity Header Pill */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="text-right hidden lg:block">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {currentUser.full_name}
              </p>
              {roleConfig && (
                <span className="text-[10px] text-slate-400 font-medium">
                  {roleConfig.label}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800/80 dark:hover:bg-rose-950/60 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center transition-all shadow-xs"
              title="Sair do Sistema (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
