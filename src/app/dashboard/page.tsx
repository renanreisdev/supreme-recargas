'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  TrendingUp, 
  DollarSign, 
  ArrowRight, 
  PlusCircle, 
  Users, 
  Printer, 
  Calendar, 
  ChevronRight, 
  ShieldCheck, 
  Zap, 
  CreditCard, 
  Banknote, 
  PackageCheck, 
  User,
  Search,
  Layers,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { ServiceOrderItem, ServiceOrder } from '@/types';
import { formatCurrency, formatDateTime, getStatusBadgeConfig } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { currentCompany, currentUser, hasPermission } = useAuth();
  const [items, setItems] = useState<ServiceOrderItem[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('NAO_FINALIZADOS');

  const loadData = () => {
    const allItems = AppStore.getCartridges(currentCompany.id);
    const allOrders = AppStore.getServiceOrders(currentCompany.id);
    setItems(allItems);
    setOrders(allOrders);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, [currentCompany.id]);

  if (!currentUser) return null;

  // Stats
  const totalItems = items.length;
  const inProgress = items.filter(it => !['FINALIZADO', 'PRONTA', 'ENTREGUE', 'CANCELADO', 'CANCELADA'].includes(it.status)).length;
  const readyPickup = items.filter(it => ['FINALIZADO', 'PRONTA'].includes(it.status)).length;
  const deliveredTotal = items.filter(it => it.status === 'ENTREGUE').length;

  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const paidRevenue = orders.reduce((acc, curr) => acc + (curr.paid_amount || 0), 0);
  const pendingRevenue = Math.max(0, totalRevenue - paidRevenue);

  // Filtered items list
  const filteredItems = items.filter(it => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      it.internal_identifier.toLowerCase().includes(query) ||
      (it.order_number && it.order_number.toLowerCase().includes(query)) ||
      (it.customer_name && it.customer_name.toLowerCase().includes(query)) ||
      (it.model?.name && it.model.name.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (statusFilter === 'NAO_FINALIZADOS') {
      return it.status !== 'FINALIZADO' && it.status !== 'ENTREGUE' && it.status !== 'CANCELADO';
    }
    if (statusFilter === 'TODOS') return true;
    if (statusFilter === 'FINALIZADO') return it.status === 'FINALIZADO' || it.status === 'PRONTA';
    if (statusFilter === 'ENTREGUE') return it.status === 'ENTREGUE';

    return it.status === statusFilter;
  });

  const filterTabs = [
    { id: 'NAO_FINALIZADOS', label: 'Na Bancada / Em Andamento', count: inProgress, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
    { id: 'FINALIZADO', label: 'Prontos p/ Retirada', count: readyPickup, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
    { id: 'ENTREGUE', label: 'Entregues ao Cliente', count: deliveredTotal, color: 'text-slate-500 bg-slate-500/10 border-slate-500/30' },
    { id: 'TODOS', label: 'Todos os Itens', count: totalItems, color: 'text-slate-500 bg-slate-500/10 border-slate-500/30' }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#0e1626] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-900 dark:text-white transition-colors duration-150">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Visão Geral & Painel Operacional
            </h1>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200 dark:border-emerald-500/30 font-mono">
              {currentCompany.trade_name}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Acompanhe o fluxo da bancada técnica, ordens de serviço e faturamento em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/entradas/nova">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-10 px-4 gap-2 shadow-lg shadow-emerald-600/20">
              <PlusCircle className="w-4 h-4" />
              <span>Nova Ordem de Serviço</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Na Bancada Técnica</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {inProgress}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Itens em execução</span>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Prontos p/ Retirada</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {readyPickup}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">Aguardando cliente</span>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Receita Realizada</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
            {formatCurrency(paidRevenue)}
          </div>
          <span className="text-[11px] text-slate-500">Total pago / recebido</span>
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Saldo Pendente</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(pendingRevenue)}
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">A receber na baixa</span>
        </Card>
      </div>

      {/* Workbench Queue Quick Filter */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Fila Operacional da Oficina
            </h3>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar por serial, OS ou cliente..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-2">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">OS</th>
                <th className="py-3 px-4">Identificador</th>
                <th className="py-3 px-4">Modelo / Equipamento</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Etapa Atual</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum item na fila para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const statusConfig = getStatusBadgeConfig(item.status);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                        {item.order_number}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {item.internal_identifier}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {item.model?.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {item.customer_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge className={`${statusConfig.className} text-[10px] font-bold`}>
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href="/bancada">
                          <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg px-2">
                            Ver na Bancada <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
