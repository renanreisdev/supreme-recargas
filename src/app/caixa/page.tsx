'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Lock, 
  Unlock, 
  Printer, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Banknote, 
  CreditCard, 
  Receipt, 
  PlusCircle, 
  MinusCircle, 
  Layers, 
  TrendingUp,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { CashRegisterSession, CashRegisterMovement, PaymentMethod } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';

export default function CaixaPage() {
  const { currentCompany, currentUser } = useAuth();

  const [activeRegister, setActiveRegister] = useState<CashRegisterSession | null>(null);
  const [history, setHistory] = useState<CashRegisterSession[]>([]);

  // Modals
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [initialAmount, setInitialAmount] = useState('100.00');
  const [openNotes, setOpenNotes] = useState('');

  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<'SANGRIA' | 'SUPRIMENTO'>('SANGRIA');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [countedCash, setCountedCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const [selectedHistoryRegister, setSelectedHistoryRegister] = useState<CashRegisterSession | null>(null);

  const loadData = () => {
    const active = AppStore.getActiveCashRegister(currentCompany.id);
    const hist = AppStore.getCashRegisterHistory(currentCompany.id);
    setActiveRegister(active);
    setHistory(hist);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, [currentCompany.id]);

  if (!currentUser) return null;

  // Calculations for active register
  const initialCash = activeRegister?.initial_amount || 0;
  let totalCashSales = 0;
  let totalPixSales = 0;
  let totalCardSales = 0;
  let totalSangrias = 0;
  let totalSuprimentos = 0;

  (activeRegister?.movements || []).forEach(mov => {
    if (mov.type === 'VENDA_ORDEM') {
      if (mov.payment_method === 'DINHEIRO') totalCashSales += mov.amount;
      else if (mov.payment_method === 'PIX') totalPixSales += mov.amount;
      else totalCardSales += mov.amount;
    } else if (mov.type === 'SANGRIA') {
      totalSangrias += mov.amount;
    } else if (mov.type === 'SUPRIMENTO') {
      totalSuprimentos += mov.amount;
    }
  });

  const currentDrawerCash = initialCash + totalCashSales + totalSuprimentos - totalSangrias;
  const totalRevenue = totalCashSales + totalPixSales + totalCardSales;

  // Handlers
  const handleOpenRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(initialAmount) || 0;
    try {
      AppStore.openCashRegister(
        currentCompany.id,
        amountNum,
        currentUser.id,
        currentUser.full_name,
        openNotes.trim()
      );
      toast.success('Caixa aberto com sucesso!');
      setShowOpenModal(false);
      setOpenNotes('');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao abrir caixa.');
    }
  };

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(movementAmount);
    if (!amountNum || amountNum <= 0) {
      toast.warning('Informe um valor válido.');
      return;
    }
    if (!movementDescription.trim()) {
      toast.warning('Informe a justificativa ou descrição.');
      return;
    }

    try {
      AppStore.addCashRegisterMovement(
        currentCompany.id,
        movementType,
        amountNum,
        movementDescription.trim(),
        currentUser.id,
        currentUser.full_name
      );
      toast.success(`${movementType === 'SANGRIA' ? 'Sangria' : 'Suprimento'} registrada com sucesso!`);
      setShowMovementModal(false);
      setMovementAmount('');
      setMovementDescription('');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao registrar movimentação.');
    }
  };

  const handleCloseRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const countedNum = parseFloat(countedCash);
    if (isNaN(countedNum)) {
      toast.warning('Informe o valor total contado em dinheiro na gaveta.');
      return;
    }

    try {
      const closed = AppStore.closeCashRegister(
        currentCompany.id,
        countedNum,
        currentUser.id,
        currentUser.full_name,
        closeNotes.trim()
      );

      const diff = closed.closing_difference || 0;
      if (diff === 0) {
        toast.success('Caixa fechado com sucesso! Saldo 100% exato.');
      } else if (diff > 0) {
        toast.success(`Caixa fechado com SOBRA de ${formatCurrency(diff)}.`);
      } else {
        toast.warning(`Caixa fechado com FALTA de ${formatCurrency(Math.abs(diff))}.`);
      }

      setShowCloseModal(false);
      setCountedCash('');
      setCloseNotes('');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao fechar caixa.');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#0e1626] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-900 dark:text-white transition-colors duration-150">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                Frente de Caixa & Controle Diário
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Abertura, sangrias, suprimentos e fechamento de caixa cego com conferência de saldo
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeRegister ? (
            <>
              <Button
                onClick={() => {
                  setMovementType('SUPRIMENTO');
                  setShowMovementModal(true);
                }}
                variant="outline"
                className="text-xs font-bold gap-1.5 border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 h-10"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Suprimento (Entrada)</span>
              </Button>

              <Button
                onClick={() => {
                  setMovementType('SANGRIA');
                  setShowMovementModal(true);
                }}
                variant="outline"
                className="text-xs font-bold gap-1.5 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-10"
              >
                <MinusCircle className="w-4 h-4" />
                <span>- Sangria (Retirada)</span>
              </Button>

              <Button
                onClick={() => setShowCloseModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 h-10 shadow-sm"
              >
                <Lock className="w-4 h-4" />
                <span>Fechar Caixa</span>
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setShowOpenModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs gap-1.5 h-10 shadow-md shadow-emerald-950/30"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Caixa do Dia</span>
            </Button>
          )}
        </div>
      </div>

      {/* Active Cash Register Display */}
      {activeRegister ? (
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-700 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <strong>Caixa Ativo Aberto</strong>
              <span>por {activeRegister.opened_by_name} desde {formatDateTime(activeRegister.opened_at)}</span>
            </div>
            <div className="font-mono font-bold">
              Fundo de Troco Inicial: {formatCurrency(activeRegister.initial_amount)}
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Dinheiro na Gaveta */}
            <Card className="bg-white dark:bg-[#0e1626] border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
                  <span>Dinheiro Físico (Gaveta)</span>
                  <Banknote className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency(currentDrawerCash)}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Troco ({formatCurrency(initialCash)}) + Vendas - Sangrias
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Vendas do Caixa */}
            <Card className="bg-white dark:bg-[#0e1626] border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
                  <span>Vendas em Ordens de Serviço</span>
                  <Receipt className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {formatCurrency(totalRevenue)}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Total recebido nas comandas deste turno
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Pix & Cartões */}
            <Card className="bg-white dark:bg-[#0e1626] border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
                  <span>PIX & Cartão</span>
                  <CreditCard className="w-4 h-4 text-teal-500" />
                </div>
                <div className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono">
                  {formatCurrency(totalPixSales + totalCardSales)}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  PIX: {formatCurrency(totalPixSales)} • Cartão: {formatCurrency(totalCardSales)}
                </p>
              </CardContent>
            </Card>

            {/* Card 4: Sangrias do Dia */}
            <Card className="bg-white dark:bg-[#0e1626] border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
                  <span>Retiradas (Sangrias)</span>
                  <ArrowDownCircle className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  {formatCurrency(totalSangrias)}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Suprimentos recebidos: {formatCurrency(totalSuprimentos)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Movements Table */}
          <Card className="bg-white dark:bg-[#0e1626] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Movimentações do Caixa Aberto</span>
                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                  {activeRegister.movements.length} lançamentos
                </Badge>
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Horário</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Descrição / OS</th>
                    <th className="py-3 px-4">Método</th>
                    <th className="py-3 px-4">Operador</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {activeRegister.movements.map((mov) => {
                    const isPositive = mov.type === 'ABERTURA' || mov.type === 'SUPRIMENTO' || mov.type === 'VENDA_ORDEM';
                    return (
                      <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(mov.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-3 px-4">
                          {mov.type === 'ABERTURA' && (
                            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold">
                              Abertura
                            </Badge>
                          )}
                          {mov.type === 'VENDA_ORDEM' && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                              Venda / OS
                            </Badge>
                          )}
                          {mov.type === 'SANGRIA' && (
                            <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] font-bold">
                              Sangria
                            </Badge>
                          )}
                          {mov.type === 'SUPRIMENTO' && (
                            <Badge className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 text-[10px] font-bold">
                              Suprimento
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {mov.description}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {mov.payment_method || 'DINHEIRO'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {mov.performed_by_name}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${
                          mov.type === 'SANGRIA' ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {mov.type === 'SANGRIA' ? `- ${formatCurrency(mov.amount)}` : `+ ${formatCurrency(mov.amount)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        /* Empty State: Caixa Fechado */
        <Card className="bg-white dark:bg-[#0e1626] border-slate-200 dark:border-slate-800 shadow-sm text-center p-8 sm:p-12 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              O Caixa está Fechado no momento
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Abra o caixa informando o saldo inicial de troco para começar a registrar recebimentos e movimentações do dia.
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={() => setShowOpenModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-10 px-6 rounded-xl shadow-md gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Caixa Agora</span>
            </Button>
          </div>
        </Card>
      )}

      {/* History of Closed Registers */}
      <Card className="bg-white dark:bg-[#0e1626] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>Histórico de Fechamentos Anteriores</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Registro dos caixas encerrados com auditoria de conferência cega
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          {history.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhum caixa encerrado anteriormente registrado.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Abertura</th>
                  <th className="py-3 px-4">Fechamento</th>
                  <th className="py-3 px-4">Aberto por</th>
                  <th className="py-3 px-4">Fechado por</th>
                  <th className="py-3 px-4 text-right">Saldo Calculado</th>
                  <th className="py-3 px-4 text-right">Contagem Cega</th>
                  <th className="py-3 px-4 text-right">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {history.map((reg) => {
                  const diff = reg.closing_difference || 0;
                  return (
                    <tr key={reg.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDateTime(reg.opened_at)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {reg.closed_at ? formatDateTime(reg.closed_at) : 'Em Aberto'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                        {reg.opened_by_name}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {reg.closed_by_name || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(reg.closing_calculated_cash || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(reg.closing_counted_cash || 0)}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${
                        diff === 0 ? 'text-slate-400' : diff > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {diff === 0 ? 'OK (Exato)' : diff > 0 ? `+ ${formatCurrency(diff)}` : `- ${formatCurrency(Math.abs(diff))}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* MODAL: ABRIR CAIXA */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Unlock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Abrir Caixa do Dia</h3>
              </div>
              <button onClick={() => setShowOpenModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOpenRegister} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Valor Inicial de Troco (Fundo de Gaveta em R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="100.00"
                    value={initialAmount}
                    onChange={e => setInitialAmount(e.target.value)}
                    className="pl-9 font-mono font-bold text-sm h-10"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Informe o valor em dinheiro e moedas deixado para dar troco.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Observações de Abertura (Opcional)
                </label>
                <Input
                  placeholder="Ex: Turno da manhã, operador Carlos"
                  value={openNotes}
                  onChange={e => setOpenNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowOpenModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  Confirmar e Abrir Caixa
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SANGRIA / SUPRIMENTO */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${
                  movementType === 'SANGRIA' ? 'bg-rose-500/10 text-rose-600' : 'bg-teal-500/10 text-teal-600'
                }`}>
                  {movementType === 'SANGRIA' ? <MinusCircle className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {movementType === 'SANGRIA' ? 'Lançar Sangria (Retirada)' : 'Lançar Suprimento (Entrada)'}
                </h3>
              </div>
              <button onClick={() => setShowMovementModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMovement} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Valor da Movimentação (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={movementAmount}
                    onChange={e => setMovementAmount(e.target.value)}
                    className="pl-9 font-mono font-bold text-sm h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Motivo / Justificativa *
                </label>
                <Input
                  required
                  placeholder={movementType === 'SANGRIA' ? 'Ex: Depósito bancário, pagamento almoço' : 'Ex: Troco adicional'}
                  value={movementDescription}
                  onChange={e => setMovementDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowMovementModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className={`font-bold text-white ${
                  movementType === 'SANGRIA' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-teal-600 hover:bg-teal-700'
                }`}>
                  Salvar Movimentação
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FECHAR CAIXA */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Fechamento Cego de Caixa</h3>
              </div>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseRegister} className="space-y-4 text-xs">
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Conte todas as cédulas e moedas físicas presentes na gaveta e digite o valor abaixo para conferência cega do sistema.
              </p>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Valor Total Contado em Dinheiro (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={countedCash}
                    onChange={e => setCountedCash(e.target.value)}
                    className="pl-9 font-mono font-bold text-sm h-10 border-amber-500 focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Observações de Fechamento (Opcional)
                </label>
                <Input
                  placeholder="Ex: Tudo conferido e separado para o cofre"
                  value={closeNotes}
                  onChange={e => setCloseNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowCloseModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                  Concluir Fechamento
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
