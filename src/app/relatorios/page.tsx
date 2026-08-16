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
  Users, 
  Wrench, 
  Clock, 
  CheckCircle, 
  PackageCheck, 
  Calendar, 
  Search, 
  RotateCcw,
  Tag
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { ServiceOrderItem, ServiceOrder, Customer, PaymentMethod } from '@/types';
import { formatCurrency, formatDate, formatDateTime, getPaymentMethodLabel, getPaymentStatusBadge, getResultBadgeConfig } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type DatePreset = 'TODOS' | 'HOJE' | 'ONTEM' | '7_DIAS' | '30_DIAS' | 'ESTE_MES' | 'MES_ANTERIOR' | 'CUSTOM';

export default function ReportsPage() {
  const { currentCompany, currentUser } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [items, setItems] = useState<ServiceOrderItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeTab, setActiveTab] = useState<'FINANCIAL' | 'TECHNICAL'>('FINANCIAL');

  // Date Filters
  const [datePreset, setDatePreset] = useState<DatePreset>('TODOS');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Search & Filter
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadData = () => {
    setOrders(AppStore.getServiceOrders(currentCompany.id));
    setItems(AppStore.getCartridges(currentCompany.id));
    setCustomers(AppStore.getCustomers(currentCompany.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, [currentCompany.id]);

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

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDateStr = (o.opened_at || o.created_at).slice(0, 10);
      if (startDate && orderDateStr < startDate) return false;
      if (endDate && orderDateStr > endDate) return false;
      if (selectedCustomerId && o.customer_id !== selectedCustomerId) return false;
      if (selectedPaymentStatus && o.financial_status !== selectedPaymentStatus) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = 
          o.order_number.toLowerCase().includes(term) ||
          (o.customer?.name && o.customer.name.toLowerCase().includes(term)) ||
          (o.customer?.phone && o.customer.phone.includes(term));
        if (!matches) return false;
      }

      return true;
    });
  }, [orders, startDate, endDate, selectedCustomerId, selectedPaymentStatus, searchTerm]);

  // Financial Metrics
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalPaid = filteredOrders.reduce((sum, o) => sum + (o.paid_amount || 0), 0);
  const totalRemaining = Math.max(0, totalRevenue - totalPaid);
  const totalDiscounts = filteredOrders.reduce((sum, o) => sum + (o.discount_amount || 0), 0);
  const averageTicket = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <BarChart3 className="w-5 h-5" />
            </span>
            Relatórios Financeiros & Indicadores
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Análise consolidada de faturamento, tickets médios e produtividade da oficina.
          </p>
        </div>

        <Button
          onClick={() => window.print()}
          variant="outline"
          size="sm"
          className="text-xs h-9 gap-1.5 rounded-xl no-print"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir Relatório</span>
        </Button>
      </div>

      {/* Filter Card */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 p-4 space-y-3 no-print">
        <div className="flex flex-wrap gap-1.5">
          {(['TODOS', 'HOJE', 'ONTEM', '7_DIAS', '30_DIAS', 'ESTE_MES', 'MES_ANTERIOR'] as DatePreset[]).map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                datePreset === preset
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {preset === 'TODOS' ? 'Todo o Período' :
               preset === 'HOJE' ? 'Hoje' :
               preset === 'ONTEM' ? 'Ontem' :
               preset === '7_DIAS' ? 'Últimos 7 Dias' :
               preset === '30_DIAS' ? 'Últimos 30 Dias' :
               preset === 'ESTE_MES' ? 'Este Mês' : 'Mês Anterior'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] text-slate-500 block mb-1">Filtrar por Cliente:</span>
            <Select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="h-8 text-xs rounded-xl"
            >
              <option value="">Todos os Clientes</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block mb-1">Status de Pagamento:</span>
            <Select
              value={selectedPaymentStatus}
              onChange={e => setSelectedPaymentStatus(e.target.value)}
              className="h-8 text-xs rounded-xl"
            >
              <option value="">Todos os Status</option>
              <option value="PAGO">Pago</option>
              <option value="PAGO_PARCIAL">Pago Parcial</option>
              <option value="PENDENTE">Pendente</option>
            </Select>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block mb-1">Data Início:</span>
            <Input
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                setDatePreset('CUSTOM');
              }}
              className="h-8 text-xs rounded-xl"
            />
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block mb-1">Data Fim:</span>
            <Input
              type="date"
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value);
                setDatePreset('CUSTOM');
              }}
              className="h-8 text-xs rounded-xl"
            />
          </div>
        </div>
      </Card>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block">Total Faturado</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalRevenue)}
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">{filteredOrders.length} ordens emitidas</span>
        </Card>

        <Card className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block">Total Recebido (Caixa)</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totalPaid)}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">Valores quitados</span>
        </Card>

        <Card className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block">Saldo Pendente</span>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(totalRemaining)}
          </div>
          <span className="text-[10px] text-amber-600 font-semibold">A receber na retirada</span>
        </Card>

        <Card className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-xs font-bold text-slate-500 block">Ticket Médio por OS</span>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {formatCurrency(averageTicket)}
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">Descontos: {formatCurrency(totalDiscounts)}</span>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">OS</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Itens</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-right">Pago</th>
                <th className="py-3 px-4 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Nenhum registro encontrado no período selecionado.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const rem = Math.max(0, order.total_amount - (order.paid_amount || 0));
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                        {order.order_number}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(order.opened_at)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {order.customer?.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {order.items?.length || 0} item(ns)
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge className={`${getPaymentStatusBadge(order.financial_status).className} text-[10px]`}>
                          {getPaymentStatusBadge(order.financial_status).label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-600 font-bold">
                        {formatCurrency(order.paid_amount || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-600">
                        {formatCurrency(rem)}
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
