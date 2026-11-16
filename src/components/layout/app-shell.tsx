'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { BottomNav } from './bottom-nav';
import { MustChangePasswordModal } from '@/components/auth/MustChangePasswordModal';
import { BrandIcon } from '@/components/ui/brand-logo';
import { Zap, Crown, Megaphone, X, ArrowLeft } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, currentCompany, currentUser, impersonatedTenantId, impersonateCompany } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [platformSettings, setPlatformSettings] = useState(() => AppStore.getPlatformSettings());
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  useEffect(() => {
    const syncPlatformBanner = () => {
      setPlatformSettings(AppStore.getPlatformSettings());
      setAnnouncementDismissed(false);
    };
    window.addEventListener('supreme_store_updated', syncPlatformBanner);
    return () => window.removeEventListener('supreme_store_updated', syncPlatformBanner);
  }, []);

  const isPublicPage = pathname === '/' ||
                       pathname === '/login' ||
                       pathname === '/cadastro' ||
                       pathname?.startsWith('/acompanhar');

  // Automatically close mobile menu when navigating to a new route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Initialize Supabase Cloud Sync & Realtime Channel
  useEffect(() => {
    if (typeof window !== 'undefined' && currentCompany?.id) {
      AppStore.initRealtime(currentCompany.id);
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicPage) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, isPublicPage, router]);

  if (isPublicPage) {
    return <main className="min-h-screen bg-slate-950 text-slate-100">{children}</main>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-white">
        <BrandIcon className="w-12 h-12 animate-pulse" />
        <p className="text-xs text-slate-400 font-mono tracking-wider">Carregando Agil OS...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 print:h-auto print:min-h-0 print:overflow-visible print:bg-white print:block">
      {/* Sidebar (Desktop Sticky + Mobile Slide-Over Drawer) */}
      <Sidebar 
        mobileOpen={mobileMenuOpen} 
        onMobileClose={() => setMobileMenuOpen(false)} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:h-auto print:min-h-0 print:overflow-visible print:block">
        {/* Header with Mobile Hamburger Trigger */}
        <Header 
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} 
        />

        {/* Super Admin Support Mode Banner */}
        {currentUser?.role === 'SUPER_ADMIN' && impersonatedTenantId && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 print:hidden shadow-xs">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 shrink-0" />
              <span>
                Modo Suporte Ativo: Inspecionando loja <strong className="underline">{currentCompany.trade_name}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                impersonateCompany(null);
                router.push('/super-admin');
              }}
              className="inline-flex items-center gap-1 bg-slate-950 text-white hover:bg-slate-800 px-3 py-1 rounded-lg text-[11px] font-bold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para Central Super Admin</span>
            </button>
          </div>
        )}

        {/* Global SaaS Broadcast Announcement Banner */}
        {platformSettings.global_announcement?.trim() && !announcementDismissed && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex items-center justify-between gap-3 print:hidden border-b ${
              platformSettings.global_announcement_type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                : platformSettings.global_announcement_type === 'emerald'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 border-sky-200 dark:border-sky-800'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Megaphone className="w-4 h-4 shrink-0" />
              <span className="truncate">{platformSettings.global_announcement}</span>
            </div>
            <button
              type="button"
              onClick={() => setAnnouncementDismissed(true)}
              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
              aria-label="Fechar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Main Content with responsive padding (bottom padding on mobile for BottomNav) */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-20 lg:pb-6 print:p-0 print:m-0 print:overflow-visible print:h-auto print:block">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav 
          onToggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)} 
        />
      </div>

      {/* Mandatory Password Reset Modal on first login or after admin reset */}
      <MustChangePasswordModal />
    </div>
  );
}
