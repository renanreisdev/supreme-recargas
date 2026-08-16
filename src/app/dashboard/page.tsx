'use client';

import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Clock, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Package, 
  ArrowRight, 
  PlusCircle, 
  Users, 
  Printer, 
  Calendar, 
  ChevronRight, 
  ShieldCheck, 
  Zap, 
  CheckCircle, 
  CreditCard, 
  Banknote, 
  PackageCheck, 
  User,
  Search,
  Filter,
  RotateCcw,
  X,
  Sparkles,
  Activity,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { Cartridge, CartridgeEntry } from '@/types';
import { formatCurrency, getPaymentMethodLabel, getStatusBadgeConfig } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { currentCompany, currentUser, hasPermission } = useAuth();
  const [cartridges, setCartridges] = useState<Cartridge[]>([]);
  const [entries, setEntries] = useState<CartridgeEntry[]>([]);
  
  // Search & Filter State (Default: Show uncompleted / in-progress cartridges)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('NAO_FINALIZADOS');

  const loadData = () => {
    const carts = AppStore.getCartridges(currentCompany.id);
    const ents = AppStore.getEntries(currentCompany.id);
    setCartridges(carts);
    setEntries(ents);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, [currentCompany.id]);

  if (!currentUser) return null;

  // Statistics Calculations
  const receivedTotal = cartridges.length;
  const inProgress = cartridges.filter(c => ['RECEBIDO', 'AGUARDANDO_VERIFICACAO', 'EM_VERIFICACAO', 'AGUARDANDO_RECARGA', 'EM_RECARGA', 'AGUARDANDO_TESTE', 'EM_TESTE'].includes(c.status)).length;
  const waitingVerification = cartridges.filter(c => ['RECEBIDO', 'AGUARDANDO_VERIFICACAO'].includes(c.status)).length;
  const inRefill = cartridges.filter(c => ['EM_RECARGA', 'AGUARDANDO_RECARGA'].includes(c.status)).length;
  const inTest = cartridges.filter(c => ['AGUARDANDO_TESTE', 'EM_TESTE'].includes(c.status)).length;
  const readyPickup = cartridges.filter(c => c.status === 'FINALIZADO').length;
  const deliveredTotal = cartridges.filter(c => c.status === 'ENTREGUE').length;
  const withDefects = cartridges.filter(c => ['CID', 'QUEIMADO', 'COM_PROBLEMA', 'SEM_REPARO'].includes(c.result_classification) || c.status === 'COM_PROBLEMA').length;

  // Financial Stats
  const totalRevenue = entries.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const paidRevenue = entries.filter(e => e.payment_status === 'PAGO').reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const pendingRevenue = entries.filter(e => e.payment_status === 'PENDENTE').reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const ticketPerEntry = entries.length > 0 ? totalRevenue / entries.length : 0;

  // Filtered Cartridges
  const filteredCartridges = cartridges.filter(cart => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      cart.serial_number.toLowerCase().includes(query) ||
      (cart.entry_number && cart.entry_number.toLowerCase().includes(query)) ||
      cart.final_serie.toLowerCase().includes(query) ||
      (cart.customer_name && cart.customer_name.toLowerCase().includes(query)) ||
      (cart.model?.model_name && cart.model.model_name.toLowerCase().includes(query)) ||
      (cart.color && cart.color.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (statusFilter === 'NAO_FINALIZADOS') {
      return cart.status !== 'FINALIZADO' && cart.status !== 'ENTREGUE' && cart.status !== 'CANCELADO';
    }
    if (statusFilter === 'TODOS') {
      return true;
    }
    if (statusFilter === 'AGUARDANDO_ANALISE') {
      return ['RECEBIDO', 'AGUARDANDO_VERIFICACAO', 'EM_VERIFICACAO'].includes(cart.status);
    }
    if (statusFilter === 'EM_RECARGA') {
      return ['AGUARDANDO_RECARGA', 'EM_RECARGA'].includes(cart.status);
    }
    if (statusFilter === 'EM_TESTE') {
      return ['AGUARDANDO_TESTE', 'EM_TESTE'].includes(cart.status);
    }
    if (statusFilter === 'FINALIZADO') {
      return cart.status === 'FINALIZADO';
    }
    if (statusFilter === 'ENTREGUE') {
      return cart.status === 'ENTREGUE';
    }
    if (statusFilter === 'COM_PROBLEMA') {
      return ['COM_PROBLEMA', 'SEM_REPARO'].includes(cart.status) || ['CID', 'QUEIMADO', 'COM_PROBLEMA', 'SEM_REPARO'].includes(cart.result_classification);
    }

    return cart.status === statusFilter;
  });

  const filterTabs = [
    { id: 'NAO_FINALIZADOS', label: 'Em Andamento', count: inProgress, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
    { id: 'AGUARDANDO_ANALISE', label: 'Em Análise', count: waitingVerification, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' },
    { id: 'EM_RECARGA', label: 'Em Recarga', count: inRefill, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
    { id: 'EM_TESTE', label: 'Em Teste', count: inTest, color: 'text-purple-500 bg-purple-500/10 border-purple-500/30' },
    { id: 'FINALIZADO', label: 'Prontos Retirada', count: readyPickup, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
    { id: 'COM_PROBLEMA', label: 'Com Defeito', count: withDefects, color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' },
    { id: 'TODOS', label: 'Todos os Itens', count: receivedTotal, color: 'text-slate-500 bg-slate-500/10 border-slate-500/30' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg text-white">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Visão Geral & Painel de Controle
            </h1>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30 font-mono">
              {currentCompany.trade_name}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Acompanhe a recepção no balcão, fluxo na bancada técnica e entregas em tempo real com agilidade.
          </p>
        </div>

        {/* Action Shortcut Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {hasPermission('create_entry') && (
            <Link href="/entradas/nova">
              <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs gap-2 shadow-md shadow-emerald-950/40 text-white h-9 rounded-xl px-4 transition-all hover:scale-105">
                <PlusCircle className="w-4 h-4" />
                <span>+ Nova Entrada / OS</span>
              </Button>
            </Link>
          )}

          {hasPermission('technical_workbench') && (
            <Link href="/bancada">
              <Button variant="outline" className="bg-slate-800 hover:bg-slate-700 font-bold text-xs gap-2 border-slate-700 text-slate-200 h-9 rounded-xl px-3.5 shadow-xs">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Bancada Técnica</span>
              </Button>
            </Link>
          )}

          {hasPermission('view_customers') && (
            <Link href="/clientes">
              <Button variant="outline" className="bg-slate-800 hover:bg-slate-700 font-semibold text-xs gap-2 border-slate-700 text-slate-300 h-9 rounded-xl px-3 shadow-xs">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Clientes</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Modern KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Recebidos */}
        <div 
          onClick={() => setStatusFilter('TODOS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-[#0e1626] ${
            statusFilter === 'TODOS' 
              ? 'border-slate-500 shadow-md ring-2 ring-slate-500/20' 
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Recebidos</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <Inbox className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{receivedTotal}</div>
          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
            <span>Histórico total</span>
          </p>
        </div>

        {/* Em Análise */}
        <div 
          onClick={() => setStatusFilter('AGUARDANDO_ANALISE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-[#0e1626] ${
            statusFilter === 'AGUARDANDO_ANALISE' 
              ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20' 
              : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Em Análise</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-500">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{waitingVerification}</div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Aguardando bancada</p>
        </div>

        {/* Em Recarga */}
        <div 
          onClick={() => setStatusFilter('EM_RECARGA')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-[#0e1626] ${
            statusFilter === 'EM_RECARGA' 
              ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20' 
              : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Em Recarga</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-500">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{inRefill}</div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Em processamento</p>
        </div>

        {/* Prontos Retirada */}
        <div 
          onClick={() => setStatusFilter('FINALIZADO')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-[#0e1626] ${
            statusFilter === 'FINALIZADO' 
              ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20' 
              : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Prontos</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{readyPickup}</div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Avisar cliente</p>
        </div>

        {/* Entregues */}
        <div 
          onClick={() => setStatusFilter('ENTREGUE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-[#0e1626] ${
            statusFilter === 'ENTREGUE' 
              ? 'border-slate-600 shadow-md ring-2 ring-slate-600/20' 
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Entregues</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-200">{deliveredTotal}</div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Baixa concluída</p>
        </div>

        {/* Com Defeito */}
        <div 
          onClick={() => setStatusFilter('COM_PROBLEMA')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-[#0e1626] ${
            statusFilter === 'COM_PROBLEMA' 
              ? 'border-rose-500 shadow-md ring-2 ring-rose-500/20' 
              : 'border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Com Defeito</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-500">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{withDefects}</div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">CID / Queimados</p>
        </div>
      </div>

      {/* Financial Quick Overview (Admin Access) */}
      {hasPermission('view_financial_reports') && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0c1424] text-white border border-slate-800 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Resumo Financeiro & Caixa Operacional</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Valores liquidados no balcão e saldo pendente a faturar</p>
            </div>
            <Link href="/relatorios">
              <Button variant="outline" size="sm" className="text-xs h-8 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700 gap-1.5 rounded-xl">
                <span>Relatório Completo</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Recebido (Caixa)</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(paidRevenue)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">PIX, Dinheiro e Cartões</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">A Receber / Pendente</span>
              <p className="text-2xl font-black text-amber-400 mt-1">{formatCurrency(pendingRevenue)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Comandas a liquidar na entrega</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Faturamento Total</span>
              <p className="text-2xl font-black text-teal-300 mt-1">{formatCurrency(totalRevenue)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Total de {entries.length} atendimentos</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Ticket Médio</span>
              <p className="text-2xl font-black text-white mt-1">{formatCurrency(ticketPerEntry)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Média por comanda</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Operational Table with Tabbed Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Queue Table */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Fila de Cartuchos & Ordens de Serviço ({filteredCartridges.length})
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Exibição rápida da fila operacional para técnicos e atendentes
              </p>
            </div>

            {hasPermission('technical_workbench') && (
              <Link href="/bancada">
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold h-8 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl">
                  <span>Abrir Quadro Kanban</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>

          {/* Filter Pills Bar */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-xs font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  statusFilter === tab.id ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por cliente, modelo, serial ou identificador..."
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {(searchQuery || statusFilter !== 'NAO_FINALIZADOS') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('NAO_FINALIZADOS');
                }}
                className="h-8 px-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 gap-1.5 shrink-0 rounded-lg"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Limpar</span>
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Código / Serial</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Equipamento / Modelo</th>
                  <th className="p-3">Identificador</th>
                  <th className="p-3">Serviço</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredCartridges.slice(0, 10).map((cart) => {
                  const statusConfig = getStatusBadgeConfig(cart.status);
                  return (
                    <tr key={cart.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {cart.serial_number}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 max-w-[150px] truncate" title={cart.customer_name}>
                          <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{cart.customer_name || 'Cliente'}</span>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {cart.model?.model_name || 'Modelo'} <span className="text-slate-400 font-normal">({cart.color})</span>
                      </td>
                      <td className="p-3">
                        <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md font-mono font-bold border border-amber-300 dark:border-amber-800 text-[11px]">
                          {cart.final_serie}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{cart.service_requested.replace('_E_', ' + ')}</td>
                      <td className="p-3">
                        <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Link href={`/entradas?search=${cart.entry_number || cart.serial_number.split('-').slice(0, 2).join('-')}`}>
                          <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5 font-bold text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg">
                            Ver Comanda
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filteredCartridges.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 space-y-1">
                      <p className="font-semibold text-slate-600 dark:text-slate-300">Nenhum registro encontrado.</p>
                      <p className="text-[11px] text-slate-400">
                        {statusFilter === 'NAO_FINALIZADOS' 
                          ? 'Não há cartuchos pendentes na bancada no momento.' 
                          : 'Tente alterar os termos da pesquisa ou restaurar os filtros.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Shortcuts Card */}
        <div className="bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Atalhos Operacionais</h2>
            <p className="text-xs text-slate-500 mt-0.5">Ações rápidas para {currentUser.full_name}</p>
          </div>

          <div className="space-y-2.5 pt-1">
            {hasPermission('create_entry') && (
              <Link href="/entradas/nova" className="block group">
                <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl flex items-center gap-3 group-hover:border-emerald-400 transition-all cursor-pointer shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Nova Entrada no Balcão</h4>
                    <p className="text-[11px] text-slate-500">Receber cliente e registrar cartuchos</p>
                  </div>
                </div>
              </Link>
            )}

            {hasPermission('register_delivery') && (
              <Link href="/entradas" className="block group">
                <div className="p-3.5 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/50 rounded-xl flex items-center gap-3 group-hover:border-teal-400 transition-all cursor-pointer shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Baixa & Entrega de Cartuchos</h4>
                    <p className="text-[11px] text-slate-500">Registrar pagamento e quem retirou</p>
                  </div>
                </div>
              </Link>
            )}

            {hasPermission('technical_workbench') && (
              <Link href="/bancada" className="block group">
                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-xl flex items-center gap-3 group-hover:border-amber-400 transition-all cursor-pointer shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Bancada do Técnico (Kanban)</h4>
                    <p className="text-[11px] text-slate-500">Pesar, analisar e diagnosticar</p>
                  </div>
                </div>
              </Link>
            )}

            <Link href="/impressao" className="block group">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3 group-hover:border-slate-400 transition-all cursor-pointer shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Imprimir Comandas e Etiquetas</h4>
                  <p className="text-[11px] text-slate-500">Formatos 58mm / 80mm com QR Code</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
