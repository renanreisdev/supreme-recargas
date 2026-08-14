'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { BottomNav } from './bottom-nav';
import { Zap } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPublicPage = pathname?.startsWith('/acompanhar') || pathname === '/login';

  // Automatically close mobile menu when navigating to a new route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center animate-pulse shadow-lg shadow-emerald-900/50">
          <Zap className="w-6 h-6 fill-white" />
        </div>
        <p className="text-xs text-slate-400 font-mono tracking-wider">Carregando Supreme Recargas...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar (Desktop Sticky + Mobile Slide-Over Drawer) */}
      <Sidebar 
        mobileOpen={mobileMenuOpen} 
        onMobileClose={() => setMobileMenuOpen(false)} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header with Mobile Hamburger Trigger */}
        <Header 
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} 
        />

        {/* Scrollable Main Content with responsive padding (bottom padding on mobile for BottomNav) */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav 
          onToggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)} 
        />
      </div>
    </div>
  );
}
