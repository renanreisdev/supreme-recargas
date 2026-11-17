'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowDownCircle,
  Lock,
  Unlock,
  Clock,
  Users,
  Banknote,
  CreditCard,
  Receipt,
  PlusCircle,
  MinusCircle,
  X,
  Eye,
  Settings,
  Filter,
  ShoppingBag,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { CashRegisterSession, PaymentMethod } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';

interface OperatorBreakdown {
  operatorKey: string;
  operatorName: string;
  txCount: number;
  openingAmount: number;
  cashSales: number;
  pixSales: number;
  cardSales: number;
  suprimentos: number;
  sangrias: number;
  totalSales: number;
  netCashImpact: number;
}

interface RegisterSummary {
  initialCash: number;
  totalCashSales: number;
  totalPixSales: number;
  totalCardSales: number;
  totalOsSales: number;
  totalAvulsaSales: number;
  totalSangrias: number;
  totalSuprimentos: number;
  expectedDrawerCash: number;
  totalRevenue: number;
  byOperator: OperatorBreakdown[];
}

function summarizeRegisterSession(session: CashRegisterSession | null): RegisterSummary {
  if (!session) {
    return {
      initialCash: 0,
      totalCashSales: 0,
      totalPixSales: 0,
      totalCardSales: 0,
      totalOsSales: 0,
      totalAvulsaSales: 0,
      totalSangrias: 0,
      totalSuprimentos: 0,
      expectedDrawerCash: 0,
      totalRevenue: 0,
      byOperator: []
    };
  }

  const initialCash = session.initial_amount || 0;
  let totalCashSales = 0;
  let totalPixSales = 0;
  let totalCardSales = 0;
  let totalOsSales = 0;
  let totalAvulsaSales = 0;
  let totalSangrias = 0;
  let totalSuprimentos = 0;

  const operatorMap = new Map<string, OperatorBreakdown>();

  for (const mov of session.movements || []) {
    const opKey = mov.performed_by || mov.performed_by_name || 'sistema';
    const opName = mov.performed_by_name || 'Operador';
    let entry = operatorMap.get(opKey);
    if (!entry) {
      entry = {
        operatorKey: opKey,
        operatorName: opName,
        txCount: 0,
        openingAmount: 0,
        cashSales: 0,
        pixSales: 0,
        cardSales: 0,
        suprimentos: 0,
        sangrias: 0,
        totalSales: 0,
        netCashImpact: 0
      };
      operatorMap.set(opKey, entry);
    }

    entry.txCount += 1;

    if (mov.type === 'ABERTURA') {
      entry.openingAmount += mov.amount;
      entry.netCashImpact += mov.amount;
    } else if (mov.type === 'VENDA_ORDEM' || mov.type === 'VENDA_AVULSA') {
      if (mov.type === 'VENDA_ORDEM') totalOsSales += mov.amount;
      else totalAvulsaSales += mov.amount;

      if (mov.payment_method === 'DINHEIRO') {
        totalCashSales += mov.amount;
        entry.cashSales += mov.amount;
        entry.netCashImpact += mov.amount;
      } else if (mov.payment_method === 'PIX') {
        totalPixSales += mov.amount;
        entry.pixSales += mov.amount;
      } else {
        totalCardSales += mov.amount;
        entry.cardSales += mov.amount;
      }
      entry.totalSales += mov.amount;
    } else if (mov.type === 'SUPRIMENTO') {
      totalSuprimentos += mov.amount;
      entry.suprimentos += mov.amount;
      entry.netCashImpact += mov.amount;
    } else if (mov.type === 'SANGRIA') {
      totalSangrias += mov.amount;
      entry.sangrias += mov.amount;
      entry.netCashImpact -= mov.amount;
    }
  }

  const byOperator = Array.from(operatorMap.values()).sort(
    (a, b) => b.totalSales - a.totalSales || a.operatorName.localeCompare(b.operatorName)
  );

  return {
    initialCash,
    totalCashSales,
    totalPixSales,
    totalCardSales,
    totalOsSales,
    totalAvulsaSales,
    totalSangrias,
    totalSuprimentos,
    expectedDrawerCash: initialCash + totalCashSales + totalSuprimentos - totalSangrias,
    totalRevenue: totalCashSales + totalPixSales + totalCardSales,
    byOperator
  };
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'PIX',
  CARTAO_DEBITO: 'Cartão Débito',
  CARTAO_CREDITO: 'Cartão Crédito',
  TRANSFERENCIA: 'Transferência',
  BOLETO: 'Boleto',
  OUTRO: 'Outro'
};

export default function CaixaPage() {
  const { currentCompany, currentUser, hasPermission } = useAuth();

  const [openRegisters, setOpenRegisters] = useState<CashRegisterSession[]>([]);
  const [selectedRegisterId, setSelectedRegisterId] = useState<string | null>(null);
  const [history, setHistory] = useState<CashRegisterSession[]>([]);
  const [cashMode, setCashMode] = useState<'SHARED' | 'PER_OPERATOR'>('SHARED');
  const [cashPolicy, setCashPolicy] = useState<'AUTO_OPEN' | 'REQUIRE_OPEN' | 'OPTIONAL'>('AUTO_OPEN');
  const [defaultFloat, setDefaultFloat] = useState<number>(0);

  // Filters on movements table
  const [filterOperator, setFilterOperator] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');

  // Modals
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [initialAmount, setInitialAmount] = useState('100.00');
  const [openNotes, setOpenNotes] = useState('');

  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<'SANGRIA' | 'SUPRIMENTO' | 'VENDA_AVULSA'>('SANGRIA');
  const [movementPaymentMethod, setMovementPaymentMethod] = useState<PaymentMethod>('DINHEIRO');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [countedCash, setCountedCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const [selectedHistoryRegister, setSelectedHistoryRegister] = useState<CashRegisterSession | null>(null);

  const canOperate = hasPermission('cash_register_operate');
  const canSangria = hasPermission('cash_register_sangria');
  const canClose = hasPermission('cash_register_close');
  const canViewExpected = hasPermission('cash_register_view_expected');
  const canManageCompany = hasPermission('manage_company');

  const loadData = () => {
    const sets = AppStore.getSettings(currentCompany.id);
    const mode = sets.cash_register_mode || 'SHARED';
    const policy = sets.cash_register_policy || 'AUTO_OPEN';
    const floatVal = Number(sets.default_cash_register_float ?? 0);

    setCashMode(mode);
    setCashPolicy(policy);
    setDefaultFloat(floatVal);
    if (!showOpenModal) {
      setInitialAmount(floatVal > 0 ? floatVal.toFixed(2) : '100.00');
    }

    const activeList = AppStore.getActiveCashRegisters(currentCompany.id);
    const hist = AppStore.getCashRegisterHistory(currentCompany.id);
    setOpenRegisters(activeList);
    setHistory(hist);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, [currentCompany.id]);

  if (!currentUser) return null;

  // Resolve active register for viewing/operating
  const myOpenRegister = openRegisters.find(r => r.opened_by === currentUser.id) || null;
  const activeRegister: CashRegisterSession | null =
    (selectedRegisterId ? openRegisters.find(r => r.id === selectedRegisterId) : null) ||
    (cashMode === 'PER_OPERATOR' ? myOpenRegister : openRegisters[0]) ||
    null;

  const summary = summarizeRegisterSession(activeRegister);
  const historySummary = summarizeRegisterSession(selectedHistoryRegister);

  const filteredMovements = (activeRegister?.movements || []).filter(mov => {
    const opKey = mov.performed_by || mov.performed_by_name || 'sistema';
    if (filterOperator !== 'ALL' && opKey !== filterOperator) return false;
    if (filterType !== 'ALL' && mov.type !== filterType) return false;
    if (filterMethod !== 'ALL' && (mov.payment_method || 'DINHEIRO') !== filterMethod) return false;
    return true;
  });

  const hasActiveFilters = filterOperator !== 'ALL' || filterType !== 'ALL' || filterMethod !== 'ALL';

  const openMovementDialog = (type: 'SANGRIA' | 'SUPRIMENTO' | 'VENDA_AVULSA') => {
    setMovementType(type);
    setMovementPaymentMethod('DINHEIRO');
    setMovementAmount('');
    setMovementDescription('');
    setShowMovementModal(true);
  };

  // Handlers
  const handleOpenRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(initialAmount) || 0;
    try {
      const created = AppStore.openCashRegister(
        currentCompany.id,
        amountNum,
        currentUser.id,
        currentUser.full_name,
        openNotes.trim() || undefined
      );
      toast.success('Caixa aberto com sucesso!');
      setSelectedRegisterId(created.id);
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
        currentUser.full_name,
        movementPaymentMethod,
        activeRegister?.id
      );
      const label =
        movementType === 'SANGRIA'
          ? 'Sangria'
          : movementType === 'SUPRIMENTO'
            ? 'Suprimento'
            : 'Venda avulsa';
      toast.success(`${label} registrada com sucesso!`);
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
        closeNotes.trim(),
        activeRegister?.id
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
      setSelectedRegisterId(null);
      setFilterOperator('ALL');
      setFilterType('ALL');
      setFilterMethod('ALL');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao fechar caixa.');
    }
  };

  const policyBadgeText =
    cashPolicy === 'AUTO_OPEN'
      ? 'Abertura Automática'
      : cashPolicy === 'REQUIRE_OPEN'
        ? 'Exige Caixa Aberto'
        : 'Caixa Opcional';

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#0e1626] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-900 dark:text-white transition-colors duration-150">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                Frente de Caixa & Controle Diário
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Caixa universal com prestação de contas por operador, vendas avulsas e auditoria de fechamento
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
              {cashMode === 'SHARED' ? 'Modo: Caixa Único Compartilhado' : 'Modo: Caixa Individual por Operador'}
            </Badge>
            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold">
              Política: {policyBadgeText}
            </Badge>
            {canManageCompany && (
              <Link
                href="/empresa?tab=regras"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline ml-1"
              >
                <Settings className="w-3 h-3" />
                <span>Configurar Regras de Caixa</span>
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeRegister ? (
            <>
              {canOperate && (
                <Button
                  onClick={() => openMovementDialog('VENDA_AVULSA')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-10 shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>+ Venda Avulsa</span>
                </Button>
              )}

              {canOperate && (
                <Button
                  onClick={() => openMovementDialog('SUPRIMENTO')}
                  variant="outline"
                  className="text-xs font-bold gap-1.5 border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 h-10"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Suprimento</span>
                </Button>
              )}

              {canSangria && (
                <Button
                  onClick={() => openMovementDialog('SANGRIA')}
                  variant="outline"
                  className="text-xs font-bold gap-1.5 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-10"
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>- Sangria</span>
                </Button>
              )}

              {canClose && (
                <Button
                  onClick={() => setShowCloseModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 h-10 shadow-sm"
                >
                  <Lock className="w-4 h-4" />
                  <span>Fechar Caixa</span>
                </Button>
              )}
            </>
          ) : canOperate ? (
            <Button
              onClick={() => {
                setInitialAmount(defaultFloat > 0 ? defaultFloat.toFixed(2) : '100.00');
                setShowOpenModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs gap-1.5 h-10 shadow-md shadow-emerald-950/30"
            >
              <Unlock className="w-4 h-4" />
              <span>{cashMode === 'PER_OPERATOR' ? 'Abrir Meu Caixa' : 'Abrir Caixa do Dia'}</span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Multi-Register Switcher when PER_OPERATOR or multiple open registers */}
      {(cashMode === 'PER_OPERATOR' || openRegisters.length > 1) && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0e1626] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
              Caixas Abertos ({openRegisters.length}):
            </span>
            {openRegisters.map(reg => {
              const isSelected = activeRegister?.id === reg.id;
              const isMine = reg.opened_by === currentUser.id;
              return (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => {
                    setSelectedRegisterId(reg.id);
                    setFilterOperator('ALL');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                  <span>{isMine ? `Meu Caixa (${reg.opened_by_name})` : `Caixa de ${reg.opened_by_name}`}</span>
                </button>
              );
            })}
            {openRegisters.length === 0 && (
              <span className="text-xs text-slate-400">Nenhum caixa aberto no momento.</span>
            )}
          </div>

          {!myOpenRegister && canOperate && (
            <Button
              size="sm"
              onClick={() => {
                setInitialAmount(defaultFloat > 0 ? defaultFloat.toFixed(2) : '100.00');
                setShowOpenModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 gap-1.5 rounded-xl"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>+ Abrir Meu Próprio Caixa</span>
            </Button>
          )}
        </div>
      )}

      {/* Active Cash Register Display */}
      {activeRegister ? (
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-700 dark:text-emerald-300">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <strong>{cashMode === 'SHARED' ? 'Caixa Compartilhado Aberto' : `Caixa de ${activeRegister.opened_by_name}`}</strong>
              <span>— aberto por {activeRegister.opened_by_name} desde {formatDateTime(activeRegister.opened_at)}</span>
              {summary.byOperator.length > 1 && (
                <Badge className="bg-emerald-600 text-white text-[10px]">
                  {summary.byOperator.length} operadores atuando
                </Badge>
              )}
            </div>
            <div className="font-mono font-bold">
              Fundo de Troco Inicial: {formatCurrency(activeRegister.initial_amount)}
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Dinheiro na Gaveta */}
            <Card className="bg-white dark:bg-[#0e1626] border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
                  <span>Dinheiro Físico (Gaveta)</span>
                  <Banknote className="w-4 h-4 text-emerald-500" />
                </div>
                {canViewExpected ? (
                  <>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(summary.expectedDrawerCash)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Troco ({formatCurrency(summary.initialCash)}) + Dinheiro ({formatCurrency(summary.totalCashSales)}) + Sup. - Sangrias
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-xl font-black text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <span>Conferência Cega</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Saldo esperado oculto até a contagem no fechamento.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Card 2: Total Recebido (OS + Avulsas) */}
            <Card className="bg-white dark:bg-[#0e1626] border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
                  <span>Recebimentos & Vendas</span>
                  <Receipt className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {formatCurrency(summary.totalRevenue)}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  OS: {formatCurrency(summary.totalOsSales)} • Avulsas: {formatCurrency(summary.totalAvulsaSales)}
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
                  {formatCurrency(summary.totalPixSales + summary.totalCardSales)}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  PIX: {formatCurrency(summary.totalPixSales)} • Cartão/Outros: {formatCurrency(summary.totalCardSales)}
                </p>
              </CardContent>
            </Card>

            {/* Card 4: Sangrias & Suprimentos */}
            <Card className="bg-white dark:bg-[#0e1626] border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
                  <span>Retiradas (Sangrias)</span>
                  <ArrowDownCircle className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  {formatCurrency(summary.totalSangrias)}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Suprimentos recebidos: {formatCurrency(summary.totalSuprimentos)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Prestação de Contas por Operador */}
          <Card className="bg-white dark:bg-[#0e1626] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>Prestação de Contas por Operador</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Resumo individual de cada usuário neste caixa. Clique em um operador para filtrar suas movimentações abaixo.
                </CardDescription>
              </div>
              {filterOperator !== 'ALL' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFilterOperator('ALL')}
                  className="text-xs h-8 rounded-xl"
                >
                  Mostrar todos os operadores
                </Button>
              )}
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-4">Operador</th>
                    <th className="py-2.5 px-4 text-center">Lançamentos</th>
                    <th className="py-2.5 px-4 text-right">Dinheiro (Vendas)</th>
                    <th className="py-2.5 px-4 text-right">PIX</th>
                    <th className="py-2.5 px-4 text-right">Cartão / Outros</th>
                    <th className="py-2.5 px-4 text-right">Suprimentos</th>
                    <th className="py-2.5 px-4 text-right">Sangrias</th>
                    <th className="py-2.5 px-4 text-right">Total Recebido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {summary.byOperator.map(op => {
                    const isFiltered = filterOperator === op.operatorKey;
                    return (
                      <tr
                        key={op.operatorKey}
                        onClick={() => setFilterOperator(isFiltered ? 'ALL' : op.operatorKey)}
                        className={`cursor-pointer transition-colors ${
                          isFiltered
                            ? 'bg-emerald-500/10 dark:bg-emerald-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-900/30'
                        }`}
                      >
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span>{op.operatorName}</span>
                          {op.operatorKey === currentUser.id && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px]">Você</Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-slate-500">{op.txCount}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          {formatCurrency(op.cashSales)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-teal-600 dark:text-teal-400">
                          {formatCurrency(op.pixSales)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          {formatCurrency(op.cardSales)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-teal-600 dark:text-teal-400">
                          {op.suprimentos > 0 ? `+ ${formatCurrency(op.suprimentos)}` : 'R$ 0,00'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-rose-600">
                          {op.sangrias > 0 ? `- ${formatCurrency(op.sangrias)}` : 'R$ 0,00'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(op.totalSales)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Movements Table with Filters */}
          <Card className="bg-white dark:bg-[#0e1626] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Movimentações do Caixa Aberto</span>
                  <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                    {filteredMovements.length}
                    {hasActiveFilters ? ` de ${activeRegister.movements.length}` : ''} lançamentos
                  </Badge>
                </CardTitle>

                {hasActiveFilters && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setFilterOperator('ALL');
                      setFilterType('ALL');
                      setFilterMethod('ALL');
                    }}
                    className="text-xs text-slate-500 h-7 px-2"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <Select
                    value={filterOperator}
                    onChange={e => setFilterOperator(e.target.value)}
                    className="text-xs h-8 rounded-xl"
                  >
                    <option value="ALL">Todos os operadores</option>
                    {summary.byOperator.map(op => (
                      <option key={op.operatorKey} value={op.operatorKey}>
                        {op.operatorName} ({op.txCount})
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="text-xs h-8 rounded-xl"
                  >
                    <option value="ALL">Todos os tipos</option>
                    <option value="VENDA_ORDEM">Venda / OS</option>
                    <option value="VENDA_AVULSA">Venda Avulsa</option>
                    <option value="SUPRIMENTO">Suprimento</option>
                    <option value="SANGRIA">Sangria</option>
                    <option value="ABERTURA">Abertura</option>
                  </Select>
                </div>

                <div>
                  <Select
                    value={filterMethod}
                    onChange={e => setFilterMethod(e.target.value)}
                    className="text-xs h-8 rounded-xl"
                  >
                    <option value="ALL">Todas as formas de pagamento</option>
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="CARTAO_DEBITO">Cartão Débito</option>
                    <option value="CARTAO_CREDITO">Cartão Crédito</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                    <option value="BOLETO">Boleto</option>
                  </Select>
                </div>
              </div>
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
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                        Nenhuma movimentação encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map(mov => (
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
                          {mov.type === 'VENDA_AVULSA' && (
                            <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px] font-bold">
                              Venda Avulsa
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
                          {PAYMENT_METHOD_LABELS[mov.payment_method || 'DINHEIRO'] || mov.payment_method || 'DINHEIRO'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-300 font-medium text-[11px]">
                          {mov.performed_by_name}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${
                          mov.type === 'SANGRIA' ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {mov.type === 'SANGRIA' ? `- ${formatCurrency(mov.amount)}` : `+ ${formatCurrency(mov.amount)}`}
                        </td>
                      </tr>
                    ))
                  )}
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
              {cashMode === 'PER_OPERATOR'
                ? 'Você não possui um Caixa aberto no momento'
                : 'O Caixa está Fechado no momento'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {cashPolicy === 'AUTO_OPEN'
                ? 'A política da empresa está em Abertura Automática: ao receber qualquer pagamento em OS, o caixa será aberto sozinho — ou você pode abrir manualmente abaixo com seu fundo de troco.'
                : cashPolicy === 'REQUIRE_OPEN'
                  ? 'A política da empresa exige Caixa Aberto antes de receber qualquer pagamento em OS. Abra o caixa abaixo para liberar recebimentos.'
                  : 'Abra o caixa informando o saldo inicial de troco caso deseje controlar entradas, saídas avulsas e fechamento da gaveta.'}
            </p>
          </div>
          {canOperate && (
            <div className="pt-2">
              <Button
                onClick={() => {
                  setInitialAmount(defaultFloat > 0 ? defaultFloat.toFixed(2) : '100.00');
                  setShowOpenModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-10 px-6 rounded-xl shadow-md gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>{cashMode === 'PER_OPERATOR' ? 'Abrir Meu Caixa Agora' : 'Abrir Caixa Agora'}</span>
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* History of Registers */}
      <Card className="bg-white dark:bg-[#0e1626] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>Histórico de Turnos e Fechamentos</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Clique em qualquer turno para auditar movimentações, faturamento e conferência cega por operador
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          {history.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhum turno de caixa registrado até o momento.
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
                  <th className="py-3 px-4 text-center">Extrato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {history.map(reg => {
                  const diff = reg.closing_difference || 0;
                  const isClosed = reg.status === 'FECHADO';
                  return (
                    <tr
                      key={reg.id}
                      onClick={() => setSelectedHistoryRegister(reg)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDateTime(reg.opened_at)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {reg.closed_at ? (
                          <span className="text-slate-500">{formatDateTime(reg.closed_at)}</span>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                            Em Aberto
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                        {reg.opened_by_name}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {reg.closed_by_name || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {isClosed ? formatCurrency(reg.closing_calculated_cash || 0) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {isClosed ? formatCurrency(reg.closing_counted_cash || 0) : '-'}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${
                        !isClosed
                          ? 'text-slate-400'
                          : diff === 0
                            ? 'text-slate-400'
                            : diff > 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                      }`}>
                        {!isClosed
                          ? 'Ativo'
                          : diff === 0
                            ? 'OK (Exato)'
                            : diff > 0
                              ? `+ ${formatCurrency(diff)}`
                              : `- ${formatCurrency(Math.abs(diff))}`}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedHistoryRegister(reg);
                          }}
                          className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Auditar</span>
                        </Button>
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
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {cashMode === 'PER_OPERATOR' ? 'Abrir Meu Caixa' : 'Abrir Caixa Compartilhado'}
                </h3>
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
                  placeholder="Ex: Turno da manhã, gaveta principal"
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

      {/* MODAL: VENDA AVULSA / SANGRIA / SUPRIMENTO */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${
                  movementType === 'SANGRIA'
                    ? 'bg-rose-500/10 text-rose-600'
                    : movementType === 'VENDA_AVULSA'
                      ? 'bg-purple-500/10 text-purple-600'
                      : 'bg-teal-500/10 text-teal-600'
                }`}>
                  {movementType === 'SANGRIA' ? (
                    <MinusCircle className="w-5 h-5" />
                  ) : movementType === 'VENDA_AVULSA' ? (
                    <ShoppingBag className="w-5 h-5" />
                  ) : (
                    <PlusCircle className="w-5 h-5" />
                  )}
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {movementType === 'SANGRIA'
                    ? 'Lançar Sangria (Retirada)'
                    : movementType === 'VENDA_AVULSA'
                      ? 'Registrar Venda / Entrada Avulsa'
                      : 'Lançar Suprimento (Entrada de Troco)'}
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

              {movementType === 'VENDA_AVULSA' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Forma de Pagamento *
                  </label>
                  <Select
                    value={movementPaymentMethod}
                    onChange={e => setMovementPaymentMethod(e.target.value as PaymentMethod)}
                    className="text-xs h-10 rounded-xl"
                  >
                    <option value="DINHEIRO">Dinheiro (entra na gaveta)</option>
                    <option value="PIX">PIX</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Descrição / Justificativa *
                </label>
                <Input
                  required
                  placeholder={
                    movementType === 'SANGRIA'
                      ? 'Ex: Depósito bancário, pagamento motoboy'
                      : movementType === 'VENDA_AVULSA'
                        ? 'Ex: Venda de cabo USB / folha sulfite'
                        : 'Ex: Troco adicional'
                  }
                  value={movementDescription}
                  onChange={e => setMovementDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowMovementModal(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className={`font-bold text-white ${
                    movementType === 'SANGRIA'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : movementType === 'VENDA_AVULSA'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-teal-600 hover:bg-teal-700'
                  }`}
                >
                  Salvar Movimentação
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FECHAR CAIXA */}
      {showCloseModal && activeRegister && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {canViewExpected ? 'Fechamento & Conferência de Caixa' : 'Fechamento Cego de Caixa'}
                </h3>
              </div>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseRegister} className="space-y-4 text-xs">
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Conte todas as cédulas e moedas físicas presentes na gaveta ({activeRegister.opened_by_name}) e informe o valor abaixo para encerramento do turno.
              </p>

              {canViewExpected && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">
                    Saldo esperado em dinheiro:
                  </span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCurrency(summary.expectedDrawerCash)}
                  </span>
                </div>
              )}

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

              {canViewExpected && countedCash !== '' && !isNaN(parseFloat(countedCash)) && (
                (() => {
                  const diffPreview = parseFloat(countedCash) - summary.expectedDrawerCash;
                  return (
                    <div className={`p-2.5 rounded-xl text-[11px] font-bold flex items-center justify-between ${
                      diffPreview === 0
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : diffPreview > 0
                          ? 'bg-teal-500/10 text-teal-600'
                          : 'bg-rose-500/10 text-rose-600'
                    }`}>
                      <span>Diferença estimada:</span>
                      <span className="font-mono">
                        {diffPreview === 0
                          ? 'OK (Exato)'
                          : diffPreview > 0
                            ? `+ ${formatCurrency(diffPreview)} (Sobra)`
                            : `- ${formatCurrency(Math.abs(diffPreview))} (Falta)`}
                      </span>
                    </div>
                  );
                })()
              )}

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

      {/* MODAL: AUDITORIA DETALHADA DE TURNO DO HISTÓRICO */}
      {selectedHistoryRegister && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-5">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>Auditoria de Turno — Caixa aberto por {selectedHistoryRegister.opened_by_name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Abertura: {formatDateTime(selectedHistoryRegister.opened_at)}
                  {selectedHistoryRegister.closed_at
                    ? ` • Fechamento: ${formatDateTime(selectedHistoryRegister.closed_at)} por ${selectedHistoryRegister.closed_by_name || '-'}`
                    : ' • Turno em aberto'}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistoryRegister(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Recebido em Vendas</span>
                  <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                    {formatCurrency(historySummary.totalRevenue)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Dinheiro / PIX / Cartão</span>
                  <span className="text-[11px] font-mono font-bold text-teal-600 dark:text-teal-400 block mt-0.5">
                    Din: {formatCurrency(historySummary.totalCashSales)} | PIX: {formatCurrency(historySummary.totalPixSales)}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Cartão: {formatCurrency(historySummary.totalCardSales)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Calculado vs Contado</span>
                  <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                    Calc: {formatCurrency(selectedHistoryRegister.closing_calculated_cash ?? historySummary.expectedDrawerCash)}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    Cont: {selectedHistoryRegister.status === 'FECHADO' ? formatCurrency(selectedHistoryRegister.closing_counted_cash || 0) : '-'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Sangrias / Diferença</span>
                  <span className="text-[11px] font-mono font-bold text-rose-600 block mt-0.5">
                    Sangrias: {formatCurrency(historySummary.totalSangrias)}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
                    Dif: {selectedHistoryRegister.status === 'FECHADO'
                      ? formatCurrency(selectedHistoryRegister.closing_difference || 0)
                      : 'Em Aberto'}
                  </span>
                </div>
              </div>

              {selectedHistoryRegister.notes && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
                  <strong>Observações do turno:</strong> {selectedHistoryRegister.notes}
                </div>
              )}

              <div>
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-2">
                  Resumo por Operador ({historySummary.byOperator.length})
                </h4>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2 px-3">Operador</th>
                        <th className="py-2 px-3 text-right">Dinheiro</th>
                        <th className="py-2 px-3 text-right">PIX</th>
                        <th className="py-2 px-3 text-right">Cartão</th>
                        <th className="py-2 px-3 text-right">Sangrias</th>
                        <th className="py-2 px-3 text-right">Total Vendas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {historySummary.byOperator.map(op => (
                        <tr key={op.operatorKey}>
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{op.operatorName}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatCurrency(op.cashSales)}</td>
                          <td className="py-2 px-3 text-right font-mono text-teal-600">{formatCurrency(op.pixSales)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatCurrency(op.cardSales)}</td>
                          <td className="py-2 px-3 text-right font-mono text-rose-600">{formatCurrency(op.sangrias)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">{formatCurrency(op.totalSales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-2">
                  Extrato Completo de Lançamentos ({selectedHistoryRegister.movements?.length || 0})
                </h4>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2 px-3">Horário</th>
                        <th className="py-2 px-3">Tipo</th>
                        <th className="py-2 px-3">Descrição</th>
                        <th className="py-2 px-3">Método</th>
                        <th className="py-2 px-3">Operador</th>
                        <th className="py-2 px-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(selectedHistoryRegister.movements || []).map(mov => (
                        <tr key={mov.id}>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                            {new Date(mov.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2 px-3 font-semibold">{mov.type}</td>
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{mov.description}</td>
                          <td className="py-2 px-3 text-slate-500">
                            {PAYMENT_METHOD_LABELS[mov.payment_method || 'DINHEIRO'] || mov.payment_method}
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{mov.performed_by_name}</td>
                          <td className={`py-2 px-3 text-right font-mono font-bold ${
                            mov.type === 'SANGRIA' ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            {mov.type === 'SANGRIA' ? `- ${formatCurrency(mov.amount)}` : `+ ${formatCurrency(mov.amount)}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setSelectedHistoryRegister(null)}>
                Fechar Auditoria
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
