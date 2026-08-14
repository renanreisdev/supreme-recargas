'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Wrench, 
  ClipboardList, 
  Menu
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onToggleMenu: () => void;
}

export function BottomNav({ onToggleMenu }: BottomNavProps) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  const isDashboard = pathname === '/dashboard';
  const isNewEntry = pathname === '/entradas/nova';
  const isWorkbench = pathname === '/bancada';
  const isEntries = pathname === '/entradas' || (pathname.startsWith('/entradas/') && pathname !== '/entradas/nova');

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-xl px-2 py-1 flex items-center justify-around select-none">
      {/* Dashboard */}
      <Link
        href="/dashboard"
        className={cn(
          "flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors min-w-[56px]",
          isDashboard ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
        )}
      >
        <LayoutDashboard className={cn("w-5 h-5 mb-0.5", isDashboard && "stroke-[2.5px]")} />
        <span>Início</span>
      </Link>

      {/* Bancada */}
      {hasPermission('technical_workbench') && (
        <Link
          href="/bancada"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors min-w-[56px]",
            isWorkbench ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          )}
        >
          <Wrench className={cn("w-5 h-5 mb-0.5", isWorkbench && "stroke-[2.5px]")} />
          <span>Bancada</span>
        </Link>
      )}

      {/* Nova Entrada (Center Action Highlight) */}
      {hasPermission('create_entry') && (
        <Link
          href="/entradas/nova"
          className="flex flex-col items-center justify-center -mt-4"
        >
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95",
            isNewEntry 
              ? "bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950" 
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30"
          )}>
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">Nova</span>
        </Link>
      )}

      {/* Entradas */}
      {hasPermission('view_entries') && (
        <Link
          href="/entradas"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors min-w-[56px]",
            isEntries ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          )}
        >
          <ClipboardList className={cn("w-5 h-5 mb-0.5", isEntries && "stroke-[2.5px]")} />
          <span>Comandas</span>
        </Link>
      )}

      {/* Menu Drawer Toggle */}
      <button
        type="button"
        onClick={onToggleMenu}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 transition-colors min-w-[56px]"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>Menu</span>
      </button>
    </nav>
  );
}
