'use client';

import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, ExternalLink, QrCode, LogOut, Menu, Zap, Cloud, Sparkles, Sun, Moon, CloudOff, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { AppStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getRoleBadgeConfig } from '@/lib/utils';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export function Header({ onToggleMobileMenu }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncState, setSyncState] = useState(() => AppStore.getSyncStatus());
  const router = useRouter();
  const { currentUser, currentCompany, logout, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleStatus = (e: any) => {
      if (e?.detail) {
        setSyncState(e.detail);
      } else {
        setSyncState(AppStore.getSyncStatus());
      }
    };
    window.addEventListener('supreme_sync_status_updated', handleStatus);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('supreme_sync_status_updated', handleStatus);
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/entradas?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await AppStore.flushOfflineQueue();
      if (currentCompany?.id) {
        await AppStore.syncFromSupabase(currentCompany.id);
      }
      setSyncState(AppStore.getSyncStatus());
      if (res.processed > 0) {
        toast.success(`Sincronização concluída! ${res.processed} alteração(ões) enviada(s) à nuvem.`);
      } else {
        toast.success('Dados sincronizados com o servidor!');
      }
    } catch (err) {
      toast.error('Não foi possível sincronizar no momento. Os dados seguem salvos localmente.');
    } finally {
      setIsSyncing(false);
    }
  };

  const roleConfig = currentUser ? getRoleBadgeConfig(currentUser.role) : null;

  return (
    <header className="h-16 bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs gap-3 print:hidden transition-colors duration-150">
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
        {/* Light / Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center transition-all shadow-xs"
          title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-200" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 animate-in spin-in-180 duration-200" />
          )}
        </button>

        {/* Cloud Sync Status Indicator */}
        <button
          type="button"
          onClick={handleManualSync}
          disabled={isSyncing}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-xs ${
            !syncState.isOnline
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
              : (syncState.isSyncing || isSyncing)
              ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30'
              : syncState.pendingCount > 0
              ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 hover:bg-amber-100'
              : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100'
          }`}
          title={
            !syncState.isOnline
              ? `Sem internet externa. ${syncState.pendingCount} mutações salvas localmente. Clique para tentar reconectar.`
              : (syncState.isSyncing || isSyncing)
              ? 'Transmitindo alterações para a nuvem...'
              : syncState.pendingCount > 0
              ? `${syncState.pendingCount} operações pendentes para subir. Clique para sincronizar agora.`
              : 'Nuvem conectada e sincronizada. Clique para forçar atualização imediata.'
          }
        >
          {!syncState.isOnline ? (
            <>
              <CloudOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Offline ({syncState.pendingCount})</span>
            </>
          ) : (syncState.isSyncing || isSyncing) ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 animate-spin" />
              <span>Sincronizando...</span>
            </>
          ) : syncState.pendingCount > 0 ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-sm" />
              <span>{syncState.pendingCount} Pendente{syncState.pendingCount > 1 ? 's' : ''}</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
              <span>Nuvem Online</span>
            </>
          )}
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
              onClick={() => logout()}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center transition-colors shadow-xs"
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
