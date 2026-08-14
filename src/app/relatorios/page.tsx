'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Filter, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Wrench,
  Download,
  CreditCard,
  Banknote,
  Zap,
  Clock,
  CheckCircle,
  PackageCheck,
  Calendar,
  Search,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { Cartridge, CartridgeEntry, Customer, PaymentMethod } from '@/types';
import { formatCurrency, formatDate, formatDateTime, formatWeight, getPaymentMethodLabel, getPaymentStatusBadge, getResultBadgeConfig } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type DatePreset = 'TODOS' | 'HOJE' | 'ONTEM' | '7_DIAS' | '30_DIAS' | 'ESTE_MES' | 'MES_ANTERIOR' | 'CUSTOM';

export default function ReportsPage() {
  const { currentCompany } = useAuth();
  const [entries, setEntries] = useState<CartridgeEntry[]>([]);
  const [cartridges, setCartridges] = useState<Cartridge[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeTab, setActiveTab] = useState<'FINANCIAL' | 'TECHNICAL'>('FINANCIAL');

  // Date Filters State
  const [datePreset, setDatePreset] = useState<DatePreset>('TODOS');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Other Filters
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('');
  const [selectedResult, setSelectedResult] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadData = () => {
    setEntries(AppStore.getEntries(currentCompany.id));
    setCartridges(AppStore.getCartridges(currentCompany.id));
    setCustomers(AppStore.getCustomers(currentCompany.id));
  };

  useEffect(() => {
    loadData();
  }, [currentCompany.id]);

  // Handle Preset Changes
  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    const formatDateInput = (d: Date) => d.toISOString().slice(0, 10);

    if (preset === 'TODOS') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'HOJE') {
      setStartDate(formatDateInput(today));
      setEndDate(formatDateInput(today));
    } else if (preset === 'ONTEM') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      setStartDate(formatDateInput(yesterday));
      setEndDate(formatDateInput(yesterday));
    } else if (preset === '7_DIAS') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      setStartDate(formatDateInput(past7));
      setEndDate(formatDateInput(today));
    } else if (preset === '30_DIAS') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      setStartDate(formatDateInput(past30));
      setEndDate(formatDateInput(today));
    } else if (preset === 'ESTE_MES') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartDate(formatDateInput(firstDay));
      setEndDate(formatDateInput(lastDay));
    } else if (preset === 'MES_ANTERIOR') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(formatDateInput(firstDay));
      setEndDate(formatDateInput(lastDay));
    }
  };

  // Filtered Entries based on Date Range and Criteria
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      // Date Filter
      const entryDateStr = (e.entry_date || e.created_at).slice(0, 10);
      if (startDate && entryDateStr < startDate) return false;
      if (endDate && entryDateStr > endDate) return false;

      // Customer Filter
      if (selectedCustomerId && e.customer_id !== selectedCustomerId) return false;

      // Payment Status Filter
      if (selectedPaymentStatus && e.payment_status !== selectedPaymentStatus) return false;

      // Payment Method Filter
      if (selectedPaymentMethod) {
        const hasMethod = e.payment_method === selectedPaymentMethod || 
          (e.payments && e.payments.some(p => p.method === selectedPaymentMethod));
        if (!hasMethod) return false;
      }

      // Search Filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = 
          e.entry_number.toLowerCase().includes(term) ||
          (e.customer?.name && e.customer.name.toLowerCase().includes(term)) ||
          (e.customer?.phone && e.customer.phone.includes(term)) ||
          (e.delivery_info?.receiver_name && e.delivery_info.receiver_name.toLowerCase().includes(term));
        if (!matches) return false;
      }

      return true;
    });
  }, [entries, startDate, endDate, selectedCustomerId, selectedPaymentStatus, selectedPaymentMethod, searchTerm]);

  // Filtered Cartridges for Technical Tab
  const filteredCartridges = useMemo(() => {
    return cartridges.filter(c => {
      const cDateStr = (c.created_at || '').slice(0, 10);
      if (startDate && cDateStr < startDate) return false;
      if (endDate && cDateStr > endDate) return false;
      if (selectedResult && c.result_classification !== selectedResult) return false;
      return true;
    });
  }, [cartridges, startDate, endDate, selectedResult]);

  // Dynamic Financial Calculations based on Filtered Entries
  const paidEntries = filteredEntries.filter(e => e.payment_status === 'PAGO');
  const pendingEntries = filteredEntries.filter(e => e.payment_status === 'PENDENTE');

  const totalGrossRevenue = filteredEntries.reduce((acc, curr) => acc + curr.subtotal_amount, 0);
  const totalDiscounts = filteredEntries.reduce((acc, curr) => acc + curr.discount_amount, 0);
  const totalNetRevenue = filteredEntries.reduce((acc, curr) => acc + curr.total_amount, 0);

  const totalReceived = paidEntries.reduce((acc, curr) => acc + curr.total_amount, 0);
  const totalPending = pendingEntries.reduce((acc, curr) => acc + curr.total_amount, 0);

  // By Payment Method (supporting multi-payment splits)
  let totalPix = 0, countPix = 0;
  let totalCash = 0, countCash = 0;
  let totalCards = 0, countCards = 0;
  let totalAPrazo = 0, countAPrazo = 0;

  filteredEntries.forEach(e => {
    if (e.payment_status === 'PAGO') {
      if (e.payments && e.payments.length > 0) {
        e.payments.forEach(p => {
          if (p.method === 'PIX') { totalPix += p.amount; countPix++; }
          else if (p.method === 'DINHEIRO') { totalCash += p.amount; countCash++; }
          else if (['CARTAO_DEBITO', 'CARTAO_CREDITO'].includes(p.method)) { totalCards += p.amount; countCards++; }
          else if (p.method === 'A_PRAZO') { totalAPrazo += p.amount; countAPrazo++; }
        });
      } else {
        if (e.payment_method === 'PIX') { totalPix += e.total_amount; countPix++; }
        else if (e.payment_method === 'DINHEIRO') { totalCash += e.total_amount; countCash++; }
        else if (['CARTAO_DEBITO', 'CARTAO_CREDITO'].includes(e.payment_method || '')) { totalCards += e.total_amount; countCards++; }
        else if (e.payment_method === 'A_PRAZO') { totalAPrazo += e.total_amount; countAPrazo++; }
      }
    } else if (e.payment_status === 'PENDENTE') {
      totalAPrazo += e.total_amount;
      countAPrazo++;
    }
  });

  // Export CSV
  const handleExportFinancialCSV = () => {
    let csv = 'Comanda;DataEntrada;DataPagamento;Cliente;Telefone;FormasPagamento;StatusPagamento;ValorTotal;QuemRetirou;Documento;Relacao;Atendente\n';
    filteredEntries.forEach(e => {
      const pDate = e.paid_at ? new Date(e.paid_at).toLocaleString('pt-BR') : 'N/A';
      const eDate = new Date(e.entry_date).toLocaleString('pt-BR');
      const receiver = e.delivery_info?.receiver_name || (e.cartridges?.every(c => c.status === 'ENTREGUE') ? 'Cliente' : 'Pendente Retirada');
      const doc = e.delivery_info?.receiver_document || '';
      const rel = e.delivery_info?.receiver_relation || '';
      const att = e.delivery_info?.attendant_name || '';

      const paymentSummary = e.payments && e.payments.length > 1
        ? e.payments.map(p => `${p.method}: R$ ${p.amount.toFixed(2)}`).join(' + ')
        : getPaymentMethodLabel(e.payment_method);

      csv += `"${e.entry_number}";"${eDate}";"${pDate}";"${e.customer?.name || ''}";"${e.customer?.phone || ''}";"${paymentSummary}";"${e.payment_status}";"${e.total_amount}";"${receiver}";"${doc}";"${rel}";"${att}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-financeiro-${startDate || 'inicio'}-a-${endDate || 'fim'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>Relatórios Financeiros & Fechamento de Caixa</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Filtros por período, demonstrativo por forma de pagamento, baixas de entrega e auditoria de caixa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleExportFinancialCSV} variant="outline" size="sm" className="gap-1.5 text-xs font-semibold h-9">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </Button>

          <Button onClick={handlePrintPDF} size="sm" className="bg-slate-900 hover:bg-slate-800 text-white gap-1.5 text-xs font-semibold h-9">
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório</span>
          </Button>
        </div>
      </div>

      {/* Date & Period Filter Card */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 print:hidden">
        <CardContent className="py-3.5 space-y-3">
          {/* Quick Date Presets */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Período de Análise:</span>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: 'TODOS', label: 'Todo o Histórico' },
                { id: 'HOJE', label: 'Hoje' },
                { id: 'ONTEM', label: 'Ontem' },
                { id: '7_DIAS', label: 'Últimos 7 dias' },
                { id: '30_DIAS', label: 'Últimos 30 dias' },
                { id: 'ESTE_MES', label: 'Este Mês' },
                { id: 'MES_ANTERIOR', label: 'Mês Anterior' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id as DatePreset)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    datePreset === p.id 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Inputs + Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-1 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5 block">
                Data Inicial
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                className="text-xs h-8"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5 block">
                Data Final
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                className="text-xs h-8"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5 block">
                Forma de Pagamento
              </label>
              <Select value={selectedPaymentMethod} onChange={e => setSelectedPaymentMethod(e.target.value)} className="text-xs h-8">
                <option value="">-- Todas as Formas --</option>
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="A_PRAZO">A Prazo</option>
                <option value="ISENTO">Isento / Garantia</option>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5 block">
                Status Financeiro
              </label>
              <Select value={selectedPaymentStatus} onChange={e => setSelectedPaymentStatus(e.target.value)} className="text-xs h-8">
                <option value="">-- Todos os Status --</option>
                <option value="PAGO">Pago (Liquidado)</option>
                <option value="PENDENTE">Pendente (A Prazo / Em Aberto)</option>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5 block">
                Busca Rápida
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Comanda ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Top Summary Cards (Recalculated dynamically) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-slate-900 text-white p-4 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Liquidado (Caixa)</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{formatCurrency(totalReceived)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{paidEntries.length} comandas liquidadas no período</p>
        </Card>

        <Card className="bg-slate-900 text-white p-4 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">A Receber (A Prazo)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-1">{formatCurrency(totalPending)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{pendingEntries.length} comandas pendentes</p>
        </Card>

        <Card className="bg-slate-900 text-white p-4 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Faturamento Total Gerado</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-extrabold text-teal-300 mt-1">{formatCurrency(totalNetRevenue)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{filteredEntries.length} atendimentos filtrados</p>
        </Card>

        <Card className="bg-slate-900 text-white p-4 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Descontos Concedidos</span>
            <DollarSign className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-1">{formatCurrency(totalDiscounts)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Subtotal bruto: {formatCurrency(totalGrossRevenue)}</p>
        </Card>
      </div>

      {/* Cash Breakdown by Payment Method */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* PIX */}
        <Card className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>PIX Instantâneo</span>
            </span>
            <Badge className="bg-emerald-700 text-white text-[10px]">{countPix} recebimentos</Badge>
          </div>
          <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2">{formatCurrency(totalPix)}</p>
        </Card>

        {/* Dinheiro */}
        <Card className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-amber-600" />
              <span>Dinheiro em Espécie</span>
            </span>
            <Badge className="bg-amber-700 text-white text-[10px]">{countCash} recebimentos</Badge>
          </div>
          <p className="text-xl font-extrabold text-amber-800 dark:text-amber-300 mt-2">{formatCurrency(totalCash)}</p>
        </Card>

        {/* Cartões Débito / Crédito */}
        <Card className="p-3.5 bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Cartões (Débito/Crédito)</span>
            </span>
            <Badge className="bg-blue-700 text-white text-[10px]">{countCards} recebimentos</Badge>
          </div>
          <p className="text-xl font-extrabold text-blue-800 dark:text-blue-300 mt-2">{formatCurrency(totalCards)}</p>
        </Card>

        {/* A Prazo / Faturado */}
        <Card className="p-3.5 bg-purple-50/70 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>A Prazo / A Faturar</span>
            </span>
            <Badge className="bg-purple-700 text-white text-[10px]">{countAPrazo} pendentes</Badge>
          </div>
          <p className="text-xl font-extrabold text-purple-800 dark:text-purple-300 mt-2">{formatCurrency(totalAPrazo)}</p>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 print:hidden">
        <button
          onClick={() => setActiveTab('FINANCIAL')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${activeTab === 'FINANCIAL' ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Extrato Financeiro & Baixas de Entrega ({filteredEntries.length})
        </button>
        <button
          onClick={() => setActiveTab('TECHNICAL')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${activeTab === 'TECHNICAL' ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Auditoria Técnica da Oficina ({filteredCartridges.length})
        </button>
      </div>

      {/* Extrato Financeiro Table */}
      {activeTab === 'FINANCIAL' && (
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Extrato Detalhado de Baixas, Pagamentos e Entregas
                </CardTitle>
                <CardDescription className="text-xs">
                  Relatório auditável de comandas, meios de pagamento e identificação de quem retirou
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">N° Comanda</th>
                    <th className="p-2.5">Data / Hora</th>
                    <th className="p-2.5">Cliente</th>
                    <th className="p-2.5">Forma Pagamento</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Valor Pago</th>
                    <th className="p-2.5">Quem Retirou</th>
                    <th className="p-2.5 rounded-r-lg text-right">Atendente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEntries.map((e) => {
                    const paymentBadge = getPaymentStatusBadge(e.payment_status || 'PENDENTE');
                    const paymentSummary = e.payments && e.payments.length > 1
                      ? e.payments.map(p => `${getPaymentMethodLabel(p.method)} (R$ ${p.amount.toFixed(2)})`).join(' + ')
                      : getPaymentMethodLabel(e.payment_method);

                    return (
                      <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {e.entry_number}
                        </td>
                        <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                          {e.paid_at ? formatDateTime(e.paid_at) : formatDateTime(e.entry_date)}
                        </td>
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{e.customer?.name}</div>
                          <div className="text-[10px] text-slate-400">{e.customer?.phone}</div>
                        </td>
                        <td className="p-2.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                            {paymentSummary}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${paymentBadge.className}`}>
                            {e.payment_status === 'PAGO' ? '✓ Liquidado' : 'Pendente'}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(e.total_amount)}
                        </td>
                        <td className="p-2.5">
                          {e.delivery_info ? (
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                                {e.delivery_info.receiver_name}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                ({e.delivery_info.receiver_relation || 'Cliente'})
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Aguardando Retirada</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {e.delivery_info?.attendant_name || e.attendant?.full_name || 'Balcão'}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredEntries.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                        Nenhuma movimentação financeira encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auditoria Técnica Table */}
      {activeTab === 'TECHNICAL' && (
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Auditoria de Pesagens e Diagnósticos Técnicos da Bancada
            </CardTitle>
            <CardDescription className="text-xs">
              Rastreamento de gramas de tinta injetadas, peso de entrada/saída e classificação elétrica
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">Serial</th>
                    <th className="p-2.5">Modelo</th>
                    <th className="p-2.5">Série Final</th>
                    <th className="p-2.5">Peso Entrada</th>
                    <th className="p-2.5">Peso Saída</th>
                    <th className="p-2.5">Delta Tinta</th>
                    <th className="p-2.5">Diagnóstico</th>
                    <th className="p-2.5 rounded-r-lg text-right">Técnico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCartridges.map((c) => {
                    const resultBadge = getResultBadgeConfig(c.result_classification);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {c.serial_number}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                          {c.model?.brand_name} {c.model?.model_name} ({c.color})
                        </td>
                        <td className="p-2.5 font-mono font-bold text-amber-800 dark:text-amber-300">
                          {c.final_serie}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300 font-mono">
                          {c.input_weight_grams ? `${c.input_weight_grams}g` : '-'}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300 font-mono">
                          {c.output_weight_grams ? `${c.output_weight_grams}g` : '-'}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {c.weight_diff_grams ? `+${c.weight_diff_grams}g` : '-'}
                        </td>
                        <td className="p-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${resultBadge.className}`}>
                            {resultBadge.label}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {c.technician?.full_name || 'Marcos Técnico'}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredCartridges.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                        Nenhum registro técnico encontrado para o período selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
