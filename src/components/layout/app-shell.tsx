'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AppStore, SYSTEM_MODULES } from '@/lib/store';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { BottomNav } from './bottom-nav';
import { MustChangePasswordModal } from '@/components/auth/MustChangePasswordModal';
import { PresetCatalogWizard } from '@/components/presets/PresetCatalogWizard';
import { BrandIcon } from '@/components/ui/brand-logo';
import { Zap, Crown, Megaphone, X, ArrowLeft, Lock, Sparkles } from 'lucide-react';

const ROUTE_MODULE_MAP: Array<{ prefix: string; moduleKey: string }> = [
  { prefix: '/entradas', moduleKey: 'balcao_os' },
  { prefix: '/caixa', moduleKey: 'frente_caixa' },
  { prefix: '/bancada', moduleKey: 'bancada_kanban' },
  { prefix: '/clientes', moduleKey: 'clientes_whatsapp' },
  { prefix: '/modelos', moduleKey: 'catalogo_modelos' },
  { prefix: '/impressao', moduleKey: 'comandas_qr' },
  { prefix: '/relatorios', moduleKey: 'relatorios_financeiros' },
  { prefix: '/auditoria', moduleKey: 'auditoria_lgpd' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, currentCompany, currentUser, impersonatedTenantId, impersonateCompany } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [platformSettings, setPlatformSettings] = useState(() => AppStore.getPlatformSettings());
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [showPresetWizard, setShowPresetWizard] = useState(false);
  const [, setStoreVersion] = useState(0);

  useEffect(() => {
    const syncPlatformBanner = () => {
      setPlatformSettings(AppStore.getPlatformSettings());
      setAnnouncementDismissed(false);
      setStoreVersion((v) => v + 1);
    };
    window.addEventListener('supreme_store_updated', syncPlatformBanner);
    return () => window.removeEventListener('supreme_store_updated', syncPlatformBanner);
  }, []);

  const isGlobalSuperAdmin = currentUser?.role === 'SUPER_ADMIN' && !impersonatedTenantId;
  const matchedRouteRule = pathname
    ? ROUTE_MODULE_MAP.find((rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`))
    : undefined;
  const isRouteModuleBlocked = Boolean(
    matchedRouteRule &&
      currentCompany &&
      currentUser &&
      !isGlobalSuperAdmin &&
      !AppStore.isModuleEnabledForTenant(currentCompany.id, matchedRouteRule.moduleKey)
  );
  const blockedModuleDef = isRouteModuleBlocked && matchedRouteRule
    ? SYSTEM_MODULES.find((mod) => mod.key === matchedRouteRule.moduleKey)
    : undefined;
  const blockedTenantPlan = isRouteModuleBlocked && currentCompany
    ? AppStore.getEffectiveLimits(currentCompany.id).plan
    : undefined;

  const isPublicPage = pathname === '/' ||
                       pathname === '/login' ||
                       pathname === '/cadastro' ||
                       pathname?.startsWith('/acompanhar');

  // Automatically close mobile menu when navigating to a new route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Initialize Supabase Cloud Sync, LAN Hub & Realtime Channel + Offline PWA Service Worker
  useEffect(() => {
    if (typeof window !== 'undefined' && currentCompany?.id) {
      AppStore.initRealtime(currentCompany.id);
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
    ) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicPage) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, isPublicPage, router]);

  // Trigger Flexible Catalog Presets Wizard on Administrator's 1st access for clean stores
  useEffect(() => {
    if (
      isLoading ||
      !isAuthenticated ||
      isPublicPage ||
      currentUser?.role !== 'ADMINISTRADOR' ||
      currentUser?.must_change_password ||
      impersonatedTenantId ||
      !currentCompany?.id
    ) {
      setShowPresetWizard(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await AppStore.syncFromSupabase(currentCompany.id).catch(() => null);
        if (cancelled) return;
        const freshComp = AppStore.getCompany(currentCompany.id);
        if (freshComp.presets_configured_at || freshComp.presets_dismissed_at) {
          setShowPresetWizard(false);
          return;
        }
        const hasCatalog =
          AppStore.getCategories(currentCompany.id).length > 0 ||
          AppStore.getBrands(currentCompany.id).length > 0 ||
          AppStore.getServices(currentCompany.id).length > 0 ||
          AppStore.getModels(currentCompany.id).length > 0;

        if (!hasCatalog) {
          setShowPresetWizard(true);
        }
      } catch {
        // Ignore silent background sync errors
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isLoading,
    isAuthenticated,
    isPublicPage,
    currentUser?.id,
    currentUser?.role,
    currentUser?.must_change_password,
    impersonatedTenantId,
    currentCompany?.id
  ]);

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
          {isRouteModuleBlocked ? (
            <div className="max-w-xl mx-auto mt-10 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Módulo não incluído no {blockedTenantPlan?.name || 'plano atual'}
                </p>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  {blockedModuleDef?.label || 'Recurso exclusivo de planos superiores'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {blockedModuleDef?.description ||
                    'A assinatura ativa desta empresa não contempla o acesso direto a este módulo.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <Link
                  href="/empresa?tab=assinatura"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Ver Planos &amp; Upgrade
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao Painel
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav 
          onToggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)} 
        />
      </div>

      {/* Mandatory Password Reset Modal on first login or after admin reset */}
      <MustChangePasswordModal />

      {/* First-Access Flexible Presets Wizard (Administrator Only) */}
      <PresetCatalogWizard
        mode="modal"
        isOpen={showPresetWizard}
        isFirstAccess={true}
        onClose={() => setShowPresetWizard(false)}
        onComplete={() => setShowPresetWizard(false)}
      />
    </div>
  );
}
