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
  X
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { Cartridge, CartridgeEntry } from '@/types';
import { formatCurrency, getPaymentMethodLabel, getStatusBadgeConfig } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { currentCompany, currentUser, hasPermission } = useAuth();
  const [cartridges, setCartridges] = useState<Cartridge[]>([]);
  const [entries, setEntries] = useState<CartridgeEntry[]>([]);
  
  // Search & Filter State (Default: Show uncompleted / in-progress cartridges)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('NAO_FINALIZADOS');

  useEffect(() => {
    const carts = AppStore.getCartridges(currentCompany.id);
    const ents = AppStore.getEntries(currentCompany.id);
    setCartridges(carts);
    setEntries(ents);
  }, [currentCompany.id]);

  if (!currentUser) return null;

  // Statistics Calculations
  const receivedTotal = cartridges.length;
  const inProgress = cartridges.filter(c => ['RECEBIDO', 'AGUARDANDO_VERIFICACAO', 'EM_VERIFICACAO', 'AGUARDANDO_RECARGA', 'EM_RECARGA', 'AGUARDANDO_TESTE', 'EM_TESTE'].includes(c.status)).length;
  const waitingVerification = cartridges.filter(c => ['RECEBIDO', 'AGUARDANDO_VERIFICACAO'].includes(c.status)).length;
  const inRefill = cartridges.filter(c => ['EM_RECARGA', 'AGUARDANDO_RECARGA'].includes(c.status)).length;
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
    // 1. Text Search Filter (Customer, Model, Serial, Final Serie)
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      cart.serial_number.toLowerCase().includes(query) ||
      (cart.entry_number && cart.entry_number.toLowerCase().includes(query)) ||
      cart.final_serie.toLowerCase().includes(query) ||
      (cart.customer_name && cart.customer_name.toLowerCase().includes(query)) ||
      (cart.model?.model_name && cart.model.model_name.toLowerCase().includes(query)) ||
      (cart.color && cart.color.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    // 2. Status Filter (Default: NAO_FINALIZADOS)
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

  const getFilterLabel = () => {
    switch (statusFilter) {
      case 'NAO_FINALIZADOS':
        return '⏳ Em Andamento / Não Finalizados (Padrão)';
      case 'TODOS':
        return '📋 Todos os Registros';
      case 'AGUARDANDO_ANALISE':
        return '🔍 Aguardando Análise';
      case 'EM_RECARGA':
        return '⚙️ Em Recarga';
      case 'EM_TESTE':
        return '🧪 Em Teste';
      case 'FINALIZADO':
        return '✅ Prontos p/ Retirada';
      case 'ENTREGUE':
        return '📦 Já Entregues';
      case 'COM_PROBLEMA':
        return '⚠️ Com Defeito / Sem Reparo';
      default:
        return statusFilter;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Painel Principal & Indicadores</span>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-300">
              {currentCompany.trade_name}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhamento em tempo real da recepção, oficina e faturamento
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission('create_entry') && (
            <Link href="/entradas/nova">
              <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs gap-1.5 shadow-sm text-white h-9">
                <PlusCircle className="w-4 h-4" />
                <span>Nova Entrada</span>
              </Button>
            </Link>
          )}

          {hasPermission('technical_workbench') && (
            <Link href="/bancada">
              <Button className="bg-amber-600 hover:bg-amber-700 font-bold text-xs gap-1.5 shadow-sm text-white h-9">
                <Wrench className="w-4 h-4" />
                <span>Bancada Técnica</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Operational KPI Grid (Clickable to Filter Table) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card 
          onClick={() => setStatusFilter('TODOS')}
          className={`border-l-4 border-l-slate-600 shadow-sm hover:shadow transition-all cursor-pointer ${
            statusFilter === 'TODOS' ? 'ring-2 ring-slate-500 bg-slate-50 dark:bg-slate-850' : ''
          }`}
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase">Total Recebidos</span>
              <Inbox className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{receivedTotal}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Clique p/ ver todos</p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setStatusFilter('AGUARDANDO_ANALISE')}
          className={`border-l-4 border-l-amber-500 shadow-sm hover:shadow transition-all cursor-pointer ${
            statusFilter === 'AGUARDANDO_ANALISE' ? 'ring-2 ring-amber-500 bg-amber-50/50 dark:bg-amber-950/20' : ''
          }`}
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase text-amber-700 dark:text-amber-400">Em Análise</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{waitingVerification}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Aguardando bancada</p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setStatusFilter('EM_RECARGA')}
          className={`border-l-4 border-l-purple-500 shadow-sm hover:shadow transition-all cursor-pointer ${
            statusFilter === 'EM_RECARGA' ? 'ring-2 ring-purple-500 bg-purple-50/50 dark:bg-purple-950/20' : ''
          }`}
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase text-purple-700 dark:text-purple-400">Em Recarga</span>
              <Wrench className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400">{inRefill}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Na oficina técnica</p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setStatusFilter('FINALIZADO')}
          className={`border-l-4 border-l-emerald-500 shadow-sm hover:shadow transition-all cursor-pointer ${
            statusFilter === 'FINALIZADO' ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : ''
          }`}
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Prontos Retirada</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{readyPickup}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Avisar cliente</p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setStatusFilter('ENTREGUE')}
          className={`border-l-4 border-l-slate-700 shadow-sm hover:shadow transition-all cursor-pointer ${
            statusFilter === 'ENTREGUE' ? 'ring-2 ring-slate-700 bg-slate-50 dark:bg-slate-850' : ''
          }`}
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300">Entregues</span>
              <Package className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-800 dark:text-slate-200">{deliveredTotal}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Baixa concluída</p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setStatusFilter('COM_PROBLEMA')}
          className={`border-l-4 border-l-rose-500 shadow-sm hover:shadow transition-all cursor-pointer ${
            statusFilter === 'COM_PROBLEMA' ? 'ring-2 ring-rose-500 bg-rose-50/50 dark:bg-rose-950/20' : ''
          }`}
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase text-rose-700 dark:text-rose-400">Com Defeito</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{withDefects}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">CID / Queimados</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview (Visible for Admins) */}
      {hasPermission('view_financial_reports') && (
        <Card className="bg-slate-900 text-white border-slate-800 shadow-md">
          <CardHeader className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Resumo Financeiro & Caixa</span>
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Valores liquidados no balcão e créditos a receber
                </CardDescription>
              </div>
              <Link href="/relatorios">
                <Button variant="outline" size="sm" className="text-xs h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 gap-1">
                  <span>Ver Relatório Completo</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <p className="text-[11px] text-slate-400 uppercase font-bold">Total Recebido (Caixa)</p>
                <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">{formatCurrency(paidRevenue)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">PIX, Dinheiro e Cartões</p>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <p className="text-[11px] text-slate-400 uppercase font-bold">A Receber (A Prazo)</p>
                <p className="text-2xl font-bold text-amber-400 mt-0.5">{formatCurrency(pendingRevenue)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Comandas faturadas pendentes</p>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <p className="text-[11px] text-slate-400 uppercase font-bold">Faturamento Total Gerado</p>
                <p className="text-2xl font-extrabold text-teal-300 mt-0.5">{formatCurrency(totalRevenue)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Total de {entries.length} atendimentos</p>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                <p className="text-[11px] text-slate-400 uppercase font-bold">Ticket Médio p/ Comanda</p>
                <p className="text-2xl font-bold text-white mt-0.5">{formatCurrency(ticketPerEntry)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Média por atendimento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Operational Tables / Kanban Shortcut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Queue Table */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Fila de Cartuchos ({filteredCartridges.length})
                </CardTitle>
                <Badge className="bg-amber-600/90 text-white font-bold text-[10px] py-0.5 px-2">
                  {statusFilter === 'NAO_FINALIZADOS' ? 'Em Andamento (Padrão)' : getFilterLabel()}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Exibindo por padrão os cartuchos em processo na bancada / oficina
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {hasPermission('technical_workbench') && (
                <Link href="/bancada">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 text-amber-700 dark:text-amber-400 font-bold h-8">
                    <span>Abrir Kanban</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-0 space-y-3">
            {/* Search & Status Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por cliente, modelo, serial ou final de série..."
                  className="pl-8 text-xs h-8 bg-white dark:bg-slate-900"
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

              {/* Status Select Filter */}
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-56">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs h-8 bg-white dark:bg-slate-900 font-medium"
                  >
                    <option value="NAO_FINALIZADOS">⏳ Em Andamento (Padrão)</option>
                    <option value="TODOS">📋 Todos os Cartuchos</option>
                    <option value="AGUARDANDO_ANALISE">🔍 Aguardando Análise</option>
                    <option value="EM_RECARGA">⚙️ Em Recarga</option>
                    <option value="EM_TESTE">🧪 Em Teste</option>
                    <option value="FINALIZADO">✅ Prontos p/ Retirada</option>
                    <option value="ENTREGUE">📦 Já Entregues</option>
                    <option value="COM_PROBLEMA">⚠️ Com Defeito / Sem Reparo</option>
                  </Select>
                </div>

                {(searchQuery || statusFilter !== 'NAO_FINALIZADOS') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('NAO_FINALIZADOS');
                    }}
                    title="Restaurar padrão (Não Finalizados)"
                    className="h-8 px-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 gap-1 shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden sm:inline">Padrão</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Cartridges Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">Serial / Código</th>
                    <th className="p-2.5">Cliente</th>
                    <th className="p-2.5">Modelo</th>
                    <th className="p-2.5">Série Final</th>
                    <th className="p-2.5">Serviço</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 rounded-r-lg text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCartridges.slice(0, 10).map((cart) => {
                    const statusConfig = getStatusBadgeConfig(cart.status);
                    return (
                      <tr key={cart.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {cart.serial_number}
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 max-w-[150px] truncate" title={cart.customer_name}>
                            <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="truncate">{cart.customer_name || 'Cliente'}</span>
                          </div>
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                          {cart.model?.model_name || 'Modelo'} ({cart.color})
                        </td>
                        <td className="p-2.5">
                          <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-mono font-bold border border-amber-300">
                            {cart.final_serie}
                          </span>
                        </td>
                        <td className="p-2.5 font-medium">{cart.service_requested.replace('_E_', ' + ')}</td>
                        <td className="p-2.5">
                          <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                        </td>
                        <td className="p-2.5 text-right">
                          <Link href={`/entradas?search=${cart.entry_number || cart.serial_number.split('-').slice(0, 2).join('-')}`}>
                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 font-bold text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50">
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
                        <p className="font-semibold text-slate-600 dark:text-slate-300">Nenhum cartucho encontrado com os filtros selecionados.</p>
                        <p className="text-[11px] text-slate-400">
                          {statusFilter === 'NAO_FINALIZADOS' 
                            ? 'Não há cartuchos pendentes na bancada no momento.' 
                            : 'Tente alterar os termos da pesquisa ou restaurar o filtro.'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card based on Role */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">Atalhos Operacionais</CardTitle>
            <CardDescription className="text-xs">Ações rápidas para seu perfil ({currentUser.role})</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-0">
            {hasPermission('create_entry') && (
              <Link href="/entradas/nova" className="block">
                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center gap-3 hover:border-emerald-400 transition-all cursor-pointer">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
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
              <Link href="/entradas" className="block">
                <div className="p-3 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 rounded-xl flex items-center gap-3 hover:border-teal-400 transition-all cursor-pointer">
                  <div className="w-9 h-9 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold shrink-0">
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
              <Link href="/bancada" className="block">
                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-center gap-3 hover:border-amber-400 transition-all cursor-pointer">
                  <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Bancada do Técnico (Kanban)</h4>
                    <p className="text-[11px] text-slate-500">Pesar, analisar e diagnosticar</p>
                  </div>
                </div>
              </Link>
            )}

            <Link href="/impressao" className="block">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3 hover:border-slate-400 transition-all cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Imprimir Comandas e Etiquetas</h4>
                  <p className="text-[11px] text-slate-500">Formatos 58mm / 80mm com QR Code</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

