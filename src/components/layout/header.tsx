'use client';

import React, { useState } from 'react';
import { Search, PlusCircle, ExternalLink, QrCode, LogOut, Menu, Zap } from 'lucide-react';
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
  const router = useRouter();
  const { currentUser, currentCompany, logout, hasPermission } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/entradas?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const roleConfig = currentUser ? getRoleBadgeConfig(currentUser.role) : null;

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm gap-2 print:hidden">
      {/* Mobile Hamburger Menu & Logo (Visible only on < lg) */}
      <div className="flex items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors"
          title="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 sm:hidden">
          <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white">
            <Zap className="w-4 h-4 fill-white" />
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-[200px] sm:max-w-xs md:max-w-md">
        <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Busca rápida..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 rounded-lg outline-none transition-all placeholder:text-slate-400"
        />
      </form>

      {/* Header Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Cloud Sync Status Indicator */}
        <button
          type="button"
          onClick={() => {
            AppStore.syncFromSupabase(currentCompany.id);
          }}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-colors shadow-xs"
          title="Banco de dados em nuvem ativo (Supabase). Clique para sincronizar."
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Nuvem Ativa</span>
        </button>

        {/* Quick Link to Demo Public Tracking */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/acompanhar/trk-2026000001-abc1')}
          className="text-xs text-slate-600 dark:text-slate-300 gap-1.5 h-8 hidden md:flex"
        >
          <QrCode className="w-3.5 h-3.5 text-emerald-600" />
          <span>Rastreio Público</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </Button>

        {/* Quick New Entry */}
        {hasPermission('create_entry') && (
          <Button
            size="sm"
            onClick={() => router.push('/entradas/nova')}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs h-8 text-white shadow-sm px-2.5 sm:px-3 hidden sm:flex"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Nova Entrada Balcão</span>
            <span className="md:hidden">Nova Entrada</span>
          </Button>
        )}

        {/* User Identity Header Pill */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="text-right hidden lg:block">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
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
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all"
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
