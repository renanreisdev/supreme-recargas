'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Crown, 
  Building2, 
  ShieldAlert, 
  Sparkles, 
  PlusCircle, 
  CheckCircle2, 
  PauseCircle, 
  Lock, 
  Unlock, 
  Edit3, 
  Trash2, 
  Users, 
  Layers, 
  DollarSign, 
  Calculator, 
  Check, 
  X, 
  Search, 
  ShieldCheck, 
  AlertCircle, 
  Phone, 
  Mail, 
  RefreshCw, 
  Copy,
  Sliders,
  TrendingUp,
  Award,
  KeyRound,
  ExternalLink,
  Inbox,
  Wrench
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore, SEGMENT_PRESETS, BUSINESS_PRESETS } from '@/lib/store';
import { formatCurrency, formatDate, getRoleBadgeConfig, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DialogModal, DialogModalProps } from '@/components/ui/dialog-modal';
import { Company, Plan, Subscription, Profile, UserRole, BusinessSegment } from '@/types';

export default function SuperAdminPage() {
  const { currentUser } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<'tenants' | 'plans' | 'users' | 'calculator'>('tenants');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const [overview, setOverview] = useState<any>(null);

  // Modals
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [showEditTenantModal, setShowEditTenantModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const [showManagePlanModal, setShowManagePlanModal] = useState(false);
  const [tenantForPlanManage, setTenantForPlanManage] = useState<Company | null>(null);

  const [showPlanFormModal, setShowPlanFormModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [showResetUserPassModal, setShowResetUserPassModal] = useState(false);
  const [userToReset, setUserToReset] = useState<Profile | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');

  // Global Dialog Modal (Replaces browser alert & confirm)
  const [dialogModal, setDialogModal] = useState<DialogModalProps | null>(null);

  // Toast / Feedback
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // New Company Form State
  const [newCorpName, setNewCorpName] = useState('');
  const [newTradeName, setNewTradeName] = useState('');
  const [newCnpj, setNewCnpj] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('SP');
  const [newResponsible, setNewResponsible] = useState('');
  const [newBusinessSegment, setNewBusinessSegment] = useState<BusinessSegment>('RECARGA_CARTUCHOS');
  const [newPlanId, setNewPlanId] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('123456');

  // Edit Company Form State
  const [editCorpName, setEditCorpName] = useState('');
  const [editTradeName, setEditTradeName] = useState('');
  const [editCnpj, setEditCnpj] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editResponsible, setEditResponsible] = useState('');

  // Manage Tenant Subscription / Extras Form State
  const [subSelectedPlanId, setSubSelectedPlanId] = useState('');
  const [subExtraUsers, setSubExtraUsers] = useState(0);
  const [subCustomPrice, setSubCustomPrice] = useState<string>('');
  const [subCustomMaxUsers, setSubCustomMaxUsers] = useState<string>('');

  // Plan Form State (Create / Edit Plan)
  const [planName, setPlanName] = useState('');
  const [planCode, setPlanCode] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planMonthlyPrice, setPlanMonthlyPrice] = useState(0);
  const [planMaxUsers, setPlanMaxUsers] = useState(5);
  const [planExtraUserPrice, setPlanExtraUserPrice] = useState(15);
  const [planFeatures, setPlanFeatures] = useState('');

  // Calculator / Simulator State
  const [calcPlanId, setCalcPlanId] = useState('');
  const [calcExtraUsers, setCalcExtraUsers] = useState(0);
  const [calcDiscount, setCalcDiscount] = useState(0);
  const [calcCopied, setCalcCopied] = useState(false);

  // Load Data
  const loadPlatformData = () => {
    const cList = AppStore.getCompanies();
    const pList = AppStore.getPlans();
    const sList = AppStore.getSubscriptions();
    const uList = AppStore.getAllProfiles();
    const ov = AppStore.getPlatformOverview();

    setCompanies(cList);
    setPlans(pList);
    setSubscriptions(sList);
    setAllUsers(uList);
    setOverview(ov);

    if (pList.length > 0 && !newPlanId) {
      setNewPlanId(pList[0].id);
    }
    if (pList.length > 0 && !calcPlanId) {
      setCalcPlanId(pList[0].id);
    }
  };

  useEffect(() => {
    loadPlatformData();
    const handleUpdate = () => loadPlatformData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Auth Guard
  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 text-center space-y-4 max-w-lg mx-auto mt-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 rounded-full flex items-center justify-center mx-auto text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Acesso Restrito ao Super Admin SaaS</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Esta área é de uso exclusivo do administrador central da plataforma. Faça login com uma credencial autorizada (SUPER_ADMIN) para gerenciar clientes, planos e precificação.
        </p>
      </div>
    );
  }

  // Filtered Companies
  const filteredCompanies = companies.filter(c => {
    const matchQuery = (
      c.trade_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.corporate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cnpj.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!matchQuery) return false;
    if (statusFilter === 'ACTIVE') return c.is_active !== false;
    if (statusFilter === 'PAUSED') return c.is_active === false;
    return true;
  });

  // Handlers: Companies
  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTradeName || !newEmail) {
      showToast('Preencha o nome fantasia e o e-mail da empresa.', 'error');
      return;
    }

    try {
      AppStore.addCompany(
        {
          corporate_name: newCorpName || newTradeName,
          trade_name: newTradeName,
          cnpj: newCnpj || '00.000.000/0001-00',
          phone: newPhone || newWhatsapp,
          whatsapp: newWhatsapp || newPhone,
          email: newEmail,
          address: '',
          city: newCity || 'São Paulo',
          state: newState || 'SP',
          responsible_name: newResponsible || 'Responsável',
          business_segment: newBusinessSegment,
          is_active: true
        },
        newAdminEmail ? {
          fullName: newResponsible || `Admin ${newTradeName}`,
          email: newAdminEmail,
          password: newAdminPass || '123456',
          phone: newPhone || newWhatsapp
        } : undefined,
        newPlanId,
        currentUser.full_name,
        newBusinessSegment
      );

      loadPlatformData();
      setShowAddTenantModal(false);
      showToast(`Empresa "${newTradeName}" cadastrada com sucesso no segmento ${BUSINESS_PRESETS[newBusinessSegment]?.name || 'Geral'}!`);

      // Reset form
      setNewCorpName('');
      setNewTradeName('');
      setNewCnpj('');
      setNewPhone('');
      setNewWhatsapp('');
      setNewEmail('');
      setNewCity('');
      setNewResponsible('');
      setNewBusinessSegment('RECARGA_CARTUCHOS');
      setNewAdminEmail('');
      setNewAdminPass('123456');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao cadastrar empresa.', 'error');
    }
  };

  const handleOpenEditTenant = (c: Company) => {
    setSelectedCompany(c);
    setEditCorpName(c.corporate_name || '');
    setEditTradeName(c.trade_name || '');
    setEditCnpj(c.cnpj || '');
    setEditPhone(c.phone || '');
    setEditWhatsapp(c.whatsapp || '');
    setEditEmail(c.email || '');
    setEditCity(c.city || '');
    setEditState(c.state || '');
    setEditResponsible(c.responsible_name || '');
    setShowEditTenantModal(true);
  };

  const handleSaveEditTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    try {
      AppStore.updateCompany(selectedCompany.id, {
        corporate_name: editCorpName,
        trade_name: editTradeName,
        cnpj: editCnpj,
        phone: editPhone,
        whatsapp: editWhatsapp,
        email: editEmail,
        city: editCity,
        state: editState,
        responsible_name: editResponsible
      }, currentUser.full_name);

      loadPlatformData();
      setShowEditTenantModal(false);
      showToast('Dados da empresa atualizados com sucesso!');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar alterações.', 'error');
    }
  };

  const handleToggleTenantStatus = (companyId: string) => {
    try {
      const updated = AppStore.toggleCompanyStatus(companyId, currentUser.full_name);
      loadPlatformData();
      showToast(`Empresa ${updated.trade_name} agora está ${updated.is_active ? 'ATIVA' : 'SUSPENSA/BLOQUEADA'}.`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao alterar status da empresa.', 'error');
    }
  };

  const handleDeleteTenant = (companyId: string, companyName: string) => {
    setDialogModal({
      isOpen: true,
      type: 'danger',
      title: 'Excluir Empresa Permanentemente?',
      subtitle: 'Esta ação não poderá ser desfeita',
      message: `Deseja realmente EXCLUIR a empresa "${companyName}" e todas as suas configurações, usuários e dados da plataforma?`,
      confirmLabel: 'Sim, Excluir Empresa',
      cancelLabel: 'Cancelar',
      onCancel: () => setDialogModal(null),
      onConfirm: () => {
        try {
          AppStore.deleteCompany(companyId, currentUser.full_name);
          setDialogModal(null);
          loadPlatformData();
          showToast(`Empresa "${companyName}" excluída.`);
        } catch (err: any) {
          setDialogModal(null);
          showToast(err?.message || 'Erro ao excluir empresa.', 'error');
        }
      }
    });
  };

  // Handlers: Manage Plan & Extras for Company
  const handleOpenManagePlan = (c: Company) => {
    const limits = AppStore.getEffectiveLimits(c.id);
    setTenantForPlanManage(c);
    setSubSelectedPlanId(limits.subscription.plan_id || limits.plan.id);
    setSubExtraUsers(limits.subscription.extra_users || 0);
    setSubCustomPrice(limits.subscription.custom_price !== undefined ? String(limits.subscription.custom_price) : '');
    setSubCustomMaxUsers(limits.subscription.custom_max_users !== undefined ? String(limits.subscription.custom_max_users) : '');
    setShowManagePlanModal(true);
  };

  const handleSaveManagePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantForPlanManage) return;

    try {
      AppStore.assignPlanToCompany(
        tenantForPlanManage.id,
        subSelectedPlanId,
        {
          extra_users: Number(subExtraUsers) || 0,
          custom_price: subCustomPrice !== '' ? Number(subCustomPrice) : undefined,
          custom_max_users: subCustomMaxUsers !== '' ? Number(subCustomMaxUsers) : undefined
        },
        currentUser.full_name
      );

      loadPlatformData();
      setShowManagePlanModal(false);
      showToast(`Plano e limites da empresa "${tenantForPlanManage.trade_name}" atualizados com sucesso!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao atualizar plano da empresa.', 'error');
    }
  };

  // Handlers: Plans CRUD
  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanName('');
    setPlanCode('');
    setPlanDescription('');
    setPlanMonthlyPrice(79.90);
    setPlanMaxUsers(5);
    setPlanExtraUserPrice(15);
    setPlanFeatures('Emissão de Comandas\nBancada Técnica Kanban\nRelatórios Financeiros\nRastreio via QR Code');
    setShowPlanFormModal(true);
  };

  const handleOpenEditPlan = (p: Plan) => {
    setEditingPlan(p);
    setPlanName(p.name);
    setPlanCode(p.code);
    setPlanDescription(p.description || '');
    setPlanMonthlyPrice(p.monthly_price);
    setPlanMaxUsers(p.max_users || p.max_total_users || 5);
    setPlanExtraUserPrice(p.extra_user_price || 15);
    setPlanFeatures(p.features ? p.features.join('\n') : '');
    setShowPlanFormModal(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName) {
      showToast('Informe o nome do plano.', 'error');
      return;
    }

    const featureList = planFeatures
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    try {
      if (editingPlan) {
        AppStore.updatePlan(editingPlan.id, {
          name: planName,
          code: planCode || planName.toUpperCase().replace(/\s+/g, '_'),
          description: planDescription,
          monthly_price: Number(planMonthlyPrice),
          max_users: Number(planMaxUsers),
          extra_user_price: Number(planExtraUserPrice),
          features: featureList
        }, currentUser.full_name);
        showToast(`Plano "${planName}" atualizado com sucesso!`);
      } else {
        AppStore.addPlan({
          name: planName,
          code: planCode || planName.toUpperCase().replace(/\s+/g, '_'),
          description: planDescription,
          monthly_price: Number(planMonthlyPrice),
          max_users: Number(planMaxUsers),
          extra_user_price: Number(planExtraUserPrice),
          features: featureList,
          is_active: true
        }, currentUser.full_name);
        showToast(`Novo plano "${planName}" criado com sucesso!`);
      }

      loadPlatformData();
      setShowPlanFormModal(false);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar plano.', 'error');
    }
  };

  const handleDeletePlan = (planId: string, name: string) => {
    if (plans.length <= 1) {
      setDialogModal({
        isOpen: true,
        type: 'warning',
        title: 'Operação Não Permitida',
        message: 'É necessário manter ao menos um plano ativo no sistema.',
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
      return;
    }

    setDialogModal({
      isOpen: true,
      type: 'danger',
      title: 'Excluir Plano de Assinatura?',
      subtitle: 'Esta ação não poderá ser desfeita',
      message: `Deseja realmente excluir o plano "${name}"? Empresas vinculadas a este plano precisarão ser migradas.`,
      confirmLabel: 'Sim, Excluir Plano',
      cancelLabel: 'Cancelar',
      onCancel: () => setDialogModal(null),
      onConfirm: () => {
        try {
          AppStore.deletePlan(planId, currentUser.full_name);
          setDialogModal(null);
          loadPlatformData();
          showToast(`Plano "${name}" excluído.`);
        } catch (err: any) {
          setDialogModal(null);
          showToast(err?.message || 'Erro ao excluir plano.', 'error');
        }
      }
    });
  };

  // Handlers: Users Password Reset
  const handleOpenResetPass = (u: Profile) => {
    setUserToReset(u);
    setNewAdminPassword('123456');
    setShowResetUserPassModal(true);
  };

  const handleSaveResetPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToReset || !newAdminPassword) return;

    try {
      AppStore.changeUserPassword(userToReset.id, newAdminPassword, currentUser.full_name);
      loadPlatformData();
      setShowResetUserPassModal(false);
      showToast(`Senha do usuário ${userToReset.full_name} redefinida com sucesso!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao redefinir senha.', 'error');
    }
  };

  // Simulator Calculation
  const selectedCalcPlan = useMemo(() => {
    return plans.find(p => p.id === calcPlanId) || plans[0] || null;
  }, [plans, calcPlanId]);

  const calcResults = useMemo(() => {
    if (!selectedCalcPlan) return { base: 0, extraUsersCost: 0, subtotal: 0, total: 0, totalUsers: 0 };
    const base = selectedCalcPlan.monthly_price;
    const extraUsersCost = calcExtraUsers * (selectedCalcPlan.extra_user_price || 15);
    const subtotal = base + extraUsersCost;
    const total = Math.max(0, subtotal - Number(calcDiscount || 0));

    return {
      base,
      extraUsersCost,
      subtotal,
      total,
      totalUsers: (selectedCalcPlan.max_users || 5) + calcExtraUsers
    };
  }, [selectedCalcPlan, calcExtraUsers, calcDiscount]);

  const copyProposalToClipboard = () => {
    if (!selectedCalcPlan) return;
    const text = `*PROPOSTA SUPREME RECARGAS - SISTEMA OPERACIONAL*
Plano Escolhido: ${selectedCalcPlan.name}
----------------------------------------
• Mensalidade Base: ${formatCurrency(calcResults.base)}
• Usuários Inclusos: ${selectedCalcPlan.max_users || 5} usuários
${calcExtraUsers > 0 ? `• Usuários Adicionais: +${calcExtraUsers} extras (${formatCurrency(calcResults.extraUsersCost)})\n` : ''}
${calcDiscount > 0 ? `• Desconto Especial: -${formatCurrency(calcDiscount)}\n` : ''}
*VALOR TOTAL MENSAL: ${formatCurrency(calcResults.total)} / mês*
Capacidade Total: ${calcResults.totalUsers} usuários simultâneos
Incluso: Emissão de Comandas, Bancada Técnica Kanban, Rastreio e Impressão Térmica.`;

    navigator.clipboard.writeText(text);
    setCalcCopied(true);
    setTimeout(() => setCalcCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Global Dialog Modal */}
      {dialogModal && <DialogModal {...dialogModal} />}

      {/* Toast Notification */}
      {notification && (
        <div className={cn(
          "fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-3 border",
          notification.type === 'success' 
            ? "bg-emerald-950 border-emerald-700 text-emerald-200"
            : "bg-rose-950 border-rose-700 text-rose-200"
        )}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-6 md:p-8 rounded-3xl text-white shadow-2xl border border-purple-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Painel Master da Plataforma
              </span>
              <span className="text-[10px] text-purple-300 font-mono">SaaS Multi-Tenant v2.0</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Central do Super Administrador</span>
            </h1>
            <p className="text-xs md:text-sm text-purple-200/90 mt-1 max-w-2xl leading-relaxed">
              Gerencie empresas clientes (tenants), planos de assinatura, limites de operadores e técnicos, precificação de adicionais e faturamento recorrente.
            </p>
          </div>

          {/* Quick Actions Header */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setShowAddTenantModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-lg shadow-emerald-950/40"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Empresa</span>
            </Button>
            <Button
              onClick={handleOpenCreatePlan}
              variant="outline"
              className="bg-purple-900/50 hover:bg-purple-900 border-purple-700 text-purple-200 font-bold text-xs gap-1.5"
            >
              <Layers className="w-4 h-4" />
              <span>Novo Plano SaaS</span>
            </Button>
            <Button
              onClick={loadPlatformData}
              variant="outline"
              size="icon"
              title="Recarregar Dados em Tempo Real"
              className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Global SaaS Platform KPIs */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Empresas (Tenants)</span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{overview.totalCompanies}</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{overview.activeCompanies} ativas</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {overview.pausedCompanies > 0 ? `${overview.pausedCompanies} suspensas/bloqueadas` : '100% de clientes ativos'}
            </p>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">MRR Recorrente SaaS</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(overview.totalMRR)}</span>
              <span className="text-[10px] text-slate-400">/ mês</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Base de planos + usuários extras</p>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Usuários Gerenciados</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{overview.totalUsers}</span>
              <span className="text-xs font-semibold text-slate-500">em {overview.totalCompanies} empresas</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {overview.attendantsCount} atendentes | {overview.techsCount} técnicos | {overview.adminsCount} admins
            </p>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Planos & Assinaturas SaaS</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{overview.plansCount}</span>
              <span className="text-xs font-semibold text-slate-500">planos ativos</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{overview.subscriptionsCount} contratos vinculados a empresas</p>
          </Card>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('tenants')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all",
            activeTab === 'tenants'
              ? "border-purple-600 text-purple-600 dark:text-purple-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Building2 className="w-4 h-4" />
          <span>Empresas & Assinaturas ({companies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all",
            activeTab === 'plans'
              ? "border-purple-600 text-purple-600 dark:text-purple-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Layers className="w-4 h-4" />
          <span>Planos SaaS & Precificação de Extras ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all",
            activeTab === 'users'
              ? "border-purple-600 text-purple-600 dark:text-purple-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Users className="w-4 h-4" />
          <span>Visão Geral de Usuários ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all",
            activeTab === 'calculator'
              ? "border-purple-600 text-purple-600 dark:text-purple-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Calculator className="w-4 h-4" />
          <span>Simulador de Propostas SaaS</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: EMPRESAS & ASSINATURAS                                         */}
      {/* ===================================================================== */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Buscar empresa por nome, CNPJ, cidade..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500">Filtrar:</span>
              <Select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="text-xs h-9 w-40"
              >
                <option value="ALL">Todas as Empresas</option>
                <option value="ACTIVE">Apenas Ativas</option>
                <option value="PAUSED">Apenas Suspensas</option>
              </Select>
            </div>
          </div>

          {/* Tenants Table */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Empresa / Contato</th>
                    <th className="p-3.5">Plano Contratado</th>
                    <th className="p-3.5">Limites de Usuários (Ocupação)</th>
                    <th className="p-3.5">Mensalidade Total</th>
                    <th className="p-3.5">Volume</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ações do Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Nenhuma empresa encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map(c => {
                      const limits = AppStore.getEffectiveLimits(c.id);
                      const stats = AppStore.getTenantStats(c.id);
                      const isCompanyActive = c.is_active !== false;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.trade_name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">CNPJ: {c.cnpj || 'Não informado'}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                              {c.city && <span>📍 {c.city}/{c.state}</span>}
                              {c.whatsapp && (
                                <span className="text-emerald-600 font-semibold">📞 {c.whatsapp}</span>
                              )}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <Badge className="bg-purple-600/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-bold">
                              {limits.plan.name}
                            </Badge>
                            {limits.subscription.billing_cycle && (
                              <p className="text-[10px] text-slate-400 mt-1">Ciclo: Mensal</p>
                            )}
                          </td>

                          <td className="p-3.5">
                            <div className="space-y-1 max-w-[200px]">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500">Operadores Ativos:</span>
                                <span className={cn("font-bold", limits.usedUsers >= limits.maxUsers ? "text-amber-600" : "text-slate-700 dark:text-slate-300")}>
                                  {limits.usedUsers} / {limits.maxUsers}
                                  {limits.extraUsers > 0 ? ` (+${limits.extraUsers} extras)` : ''}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Capacidade unificada
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                              {formatCurrency(limits.finalMonthlyPrice)}
                            </div>
                            {limits.extraUsers > 0 && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Base: {formatCurrency(limits.plan.monthly_price)} + Extras ({limits.extraUsers}): {formatCurrency(limits.extraUserPrice * limits.extraUsers)}
                              </p>
                            )}
                          </td>

                          <td className="p-3.5">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{stats.totalItems || 0} itens</div>
                            <div className="text-[10px] text-slate-400">{stats.totalOrders || stats.totalEntries || 0} ordens</div>
                          </td>

                          <td className="p-3.5">
                            {isCompanyActive ? (
                              <Badge className="bg-emerald-600 text-white font-bold text-[10px]">ATIVA</Badge>
                            ) : (
                              <Badge variant="destructive" className="font-bold text-[10px]">BLOQUEADA</Badge>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenManagePlan(c)}
                                title="Gerenciar Plano, Usuários Extras e Limites"
                                className="h-7 text-[11px] px-2 font-bold text-purple-600 dark:text-purple-300 border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-950/50"
                              >
                                <Sliders className="w-3.5 h-3.5 mr-1" />
                                <span>Plano & Limites</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEditTenant(c)}
                                title="Editar Cadastro da Empresa"
                                className="h-7 text-[11px] px-2 text-slate-600 dark:text-slate-300"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant={isCompanyActive ? "outline" : "default"}
                                onClick={() => handleToggleTenantStatus(c.id)}
                                title={isCompanyActive ? "Bloquear acesso da empresa" : "Reativar empresa"}
                                className={cn(
                                  "h-7 text-[11px] px-2 font-bold",
                                  isCompanyActive ? "text-amber-600 border-amber-500/40 hover:bg-amber-50" : "bg-emerald-600 hover:bg-emerald-500 text-white"
                                )}
                              >
                                {isCompanyActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteTenant(c.id, c.trade_name)}
                                title="Excluir Empresa Definitivamente"
                                className="h-7 text-[11px] px-2 text-rose-600 border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
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
      )}

      {/* ===================================================================== */}
      {/* TAB 2: PLANOS SAAS & PREÇOS DE ADICIONAIS                            */}
      {/* ===================================================================== */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Catálogo de Planos & Taxas Adicionais</h2>
              <p className="text-xs text-slate-500">Configure as faixas de preço base e o valor cobrado por atendente, técnico ou admin extra contratado.</p>
            </div>
            <Button
              onClick={handleOpenCreatePlan}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Criar Novo Plano SaaS</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((p, idx) => {
              const enrolledCompanies = companies.filter(c => {
                const sub = subscriptions.find(s => s.tenant_id === c.id);
                return sub ? sub.plan_id === p.id : idx === 0;
              });

              return (
                <Card key={p.id} className="border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    {/* Plan Header */}
                    <div className="p-5 bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-purple-600/10 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold border border-purple-500/20">
                          {p.code}
                        </Badge>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {enrolledCompanies.length} {enrolledCompanies.length === 1 ? 'empresa' : 'empresas'}
                        </span>
                      </div>

                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{p.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{p.description}</p>

                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                          {p.monthly_price === 0 ? 'Gratuito' : formatCurrency(p.monthly_price)}
                        </span>
                        {p.monthly_price > 0 && <span className="text-xs text-slate-500">/ mês</span>}
                      </div>
                    </div>

                    {/* Limits Included */}
                    <div className="p-5 space-y-4">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Capacidade Inclusa</p>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
                          <div>
                            <span className="text-xs text-slate-500 block">Usuários Inclusos no Plano</span>
                            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{p.max_users || 5} usuários</span>
                          </div>
                          <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                            Sem limite por cargo
                          </Badge>
                        </div>
                      </div>

                      {/* Extra User Pricing Table */}
                      <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-200/60 dark:border-purple-900/40">
                        <p className="text-[11px] font-bold text-purple-900 dark:text-purple-300 mb-1.5 flex items-center gap-1">
                          <PlusCircle className="w-3.5 h-3.5 text-purple-600" />
                          <span>Usuário Adicional / Extra</span>
                        </p>
                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                          <span>Valor por usuário extra:</span>
                          <span className="font-bold text-emerald-600">+{formatCurrency(p.extra_user_price || 15.00)}/mês</span>
                        </div>
                      </div>

                      {/* Features List */}
                      {p.features && p.features.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recursos Inclusos</p>
                          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                            {p.features.map((feat, fIdx) => (
                              <li key={fIdx} className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Plan Actions */}
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEditPlan(p)}
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-1"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      <span>Editar Plano & Taxas</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePlan(p.id, p.name)}
                      className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: VISÃO GERAL DE USUÁRIOS                                        */}
      {/* ===================================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <Card className="p-4 border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Todos os Usuários Cadastrados na Plataforma</h3>
                <p className="text-xs text-slate-500">Visualização de credenciais, empresas vinculadas e controle de senhas de operadores.</p>
              </div>
              <Badge className="bg-blue-600 text-white font-bold text-xs">
                Total: {allUsers.length} usuários
              </Badge>
            </div>
          </Card>

          <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Nome do Usuário</th>
                    <th className="p-3.5">E-mail de Login</th>
                    <th className="p-3.5">Empresa / Unidade</th>
                    <th className="p-3.5">Papel (Role)</th>
                    <th className="p-3.5">Data Cadastro</th>
                    <th className="p-3.5 text-right">Ação Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allUsers.map(u => {
                    const roleBadge = getRoleBadgeConfig(u.role);
                    const company = companies.find(c => c.id === u.tenant_id);

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                          {u.full_name}
                          {u.phone && <span className="text-[11px] text-slate-400 font-normal block">{u.phone}</span>}
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">{u.email}</td>
                        <td className="p-3.5">
                          {u.role === 'SUPER_ADMIN' ? (
                            <span className="text-purple-600 font-bold flex items-center gap-1">
                              <Crown className="w-3.5 h-3.5" /> Antigravity Central
                            </span>
                          ) : (
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {company?.trade_name || 'Empresa Padrão'}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <Badge className={cn("text-[10px] font-bold", roleBadge.className)}>
                            {roleBadge.label}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-slate-400">{formatDate(u.created_at)}</td>
                        <td className="p-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenResetPass(u)}
                            className="h-7 text-[11px] px-2.5 font-bold text-amber-600 border-amber-500/30 hover:bg-amber-50"
                          >
                            Redefinir Senha
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: SIMULADOR DE PROPOSTAS SAAS                                    */}
      {/* ===================================================================== */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simulator Form */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-purple-600" />
                  <span>Simulador de Precificação & Usuários Extras</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Calcule valores instantâneos para apresentar propostas comerciais para assistências de qualquer porte.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">1. Selecione o Plano Base Desejado</label>
                  <Select
                    value={calcPlanId}
                    onChange={e => setCalcPlanId(e.target.value)}
                    className="text-xs"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.monthly_price === 0 ? 'Gratuito' : formatCurrency(p.monthly_price)}/mês ({p.max_users || 5} Usuários inclusos)
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    2. Contratação de Usuários Extras / Adicionais
                  </p>

                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                      + Usuários Adicionais Extras (+{formatCurrency(selectedCalcPlan?.extra_user_price || 15.00)}/mês cada)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={calcExtraUsers}
                      onChange={e => setCalcExtraUsers(Math.max(0, parseInt(e.target.value) || 0))}
                      className="text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    3. Desconto Promocional na Mensalidade (Opcional - R$)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={calcDiscount}
                    onChange={e => setCalcDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Proposal Summary & WhatsApp Card */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="bg-gradient-to-br from-slate-900 to-purple-950 text-white border-purple-800/40 shadow-xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-purple-800/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span>Resumo da Proposta</span>
                  </CardTitle>
                  <Badge className="bg-amber-400 text-slate-950 font-bold text-[10px]">
                    100% Margem de Lucro
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-purple-200">
                    <span>Plano Base ({selectedCalcPlan?.name}):</span>
                    <span className="font-bold text-white">{formatCurrency(calcResults.base)}</span>
                  </div>

                  {calcResults.extraUsersCost > 0 && (
                    <div className="flex justify-between text-purple-200">
                      <span>{calcExtraUsers} Usuário(s) Adicional(is):</span>
                      <span className="font-bold text-emerald-400">+{formatCurrency(calcResults.extraUsersCost)}</span>
                    </div>
                  )}

                  {calcDiscount > 0 && (
                    <div className="flex justify-between text-rose-300">
                      <span>Desconto Comercial Concedido:</span>
                      <span className="font-bold">-{formatCurrency(calcDiscount)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-purple-800/50 flex justify-between items-baseline">
                    <span className="font-bold text-sm text-purple-100">Total Mensalidade:</span>
                    <div className="text-right">
                      <span className="text-3xl font-black text-emerald-400">{formatCurrency(calcResults.total)}</span>
                      <span className="text-xs text-purple-300 block font-normal">/ mês</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-900/40 rounded-xl border border-purple-700/50 text-[11px] text-purple-200 space-y-1">
                  <div className="flex justify-between">
                    <span>Capacidade de Usuários:</span>
                    <span className="font-bold text-white">{calcResults.totalUsers} acessos simultâneos</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custo Operacional de Infraestrutura:</span>
                    <span className="font-bold text-emerald-400">R$ 0,00 (Plano Free)</span>
                  </div>
                </div>

                <Button
                  onClick={copyProposalToClipboard}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2 shadow-lg"
                >
                  {calcCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{calcCopied ? 'Copiado para Área de Transferência!' : 'Copiar Texto Pronto para WhatsApp'}</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CADASTRAR NOVA EMPRESA (TENANT)                                */}
      {/* ===================================================================== */}
      {showAddTenantModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Cadastrar Nova Empresa (Tenant)</h3>
              </div>
              <button onClick={() => setShowAddTenantModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Nome Fantasia *</label>
                  <Input
                    required
                    placeholder="Ex: Alfa Recargas"
                    value={newTradeName}
                    onChange={e => setNewTradeName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Razão Social</label>
                  <Input
                    placeholder="Ex: Alfa Soluções de Impressão LTDA"
                    value={newCorpName}
                    onChange={e => setNewCorpName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">CNPJ / CPF</label>
                  <Input
                    placeholder="00.000.000/0001-00"
                    value={newCnpj}
                    onChange={e => setNewCnpj(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Telefone / WhatsApp</label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={newWhatsapp}
                    onChange={e => setNewWhatsapp(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">E-mail da Empresa *</label>
                  <Input
                    type="email"
                    required
                    placeholder="contato@empresa.com.br"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Cidade</label>
                  <Input
                    placeholder="Ex: Campinas"
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Estado (UF)</label>
                  <Input
                    placeholder="SP"
                    value={newState}
                    onChange={e => setNewState(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Responsável / Gestor</label>
                  <Input
                    placeholder="Ex: Carlos Oliveira"
                    value={newResponsible}
                    onChange={e => setNewResponsible(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Ramo de Atuação / Segmento *</label>
                  <Select
                    value={newBusinessSegment}
                    onChange={e => setNewBusinessSegment(e.target.value as BusinessSegment)}
                    className="text-xs font-semibold"
                  >
                    {Object.values(BUSINESS_PRESETS).map(seg => (
                      <option key={seg.key} value={seg.key}>
                        {seg.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Plano de Assinatura Inicial *</label>
                  <Select
                    value={newPlanId}
                    onChange={e => setNewPlanId(e.target.value)}
                    className="text-xs font-semibold"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.monthly_price === 0 ? 'Gratuito' : formatCurrency(p.monthly_price)}/mês
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Initial Admin Credentials */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Criar Primeiro Usuário Administrador da Empresa</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 mb-1 block">E-mail de Login do Admin</label>
                    <Input
                      type="email"
                      placeholder="admin@empresa.com.br"
                      value={newAdminEmail}
                      onChange={e => setNewAdminEmail(e.target.value)}
                      className="text-xs bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 mb-1 block">Senha Inicial (Padrão: 123456)</label>
                    <Input
                      type="password"
                      placeholder="123456"
                      value={newAdminPass}
                      onChange={e => setNewAdminPass(e.target.value)}
                      className="text-xs bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowAddTenantModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                  Confirmar e Cadastrar Empresa
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: EDITAR DADOS CADASTRAIS DA EMPRESA                             */}
      {/* ===================================================================== */}
      {showEditTenantModal && selectedCompany && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base">Editar Empresa: {selectedCompany.trade_name}</h3>
              </div>
              <button onClick={() => setShowEditTenantModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTenant} className="space-y-3 text-xs">
              <div>
                <label className="font-bold mb-1 block">Nome Fantasia</label>
                <Input value={editTradeName} onChange={e => setEditTradeName(e.target.value)} required />
              </div>
              <div>
                <label className="font-bold mb-1 block">Razão Social</label>
                <Input value={editCorpName} onChange={e => setEditCorpName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold mb-1 block">CNPJ</label>
                  <Input value={editCnpj} onChange={e => setEditCnpj(e.target.value)} />
                </div>
                <div>
                  <label className="font-bold mb-1 block">WhatsApp</label>
                  <Input value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold mb-1 block">E-mail</label>
                  <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="font-bold mb-1 block">Responsável</label>
                  <Input value={editResponsible} onChange={e => setEditResponsible(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold mb-1 block">Cidade</label>
                  <Input value={editCity} onChange={e => setEditCity(e.target.value)} />
                </div>
                <div>
                  <label className="font-bold mb-1 block">Estado</label>
                  <Input value={editState} onChange={e => setEditState(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowEditTenantModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: GERENCIAR PLANO, EXTRAS E LIMITES DO TENANT                    */}
      {/* ===================================================================== */}
      {showManagePlanModal && tenantForPlanManage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-base">Plano & Limites Customizados</h3>
                  <p className="text-[11px] text-slate-500">{tenantForPlanManage.trade_name}</p>
                </div>
              </div>
              <button onClick={() => setShowManagePlanModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManagePlan} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Plano SaaS Atribuído</label>
                <Select
                  value={subSelectedPlanId}
                  onChange={e => setSubSelectedPlanId(e.target.value)}
                  className="text-xs font-semibold"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — Preço Base: {p.monthly_price === 0 ? 'Gratuito' : formatCurrency(p.monthly_price)}/mês
                    </option>
                  ))}
                </Select>
              </div>

              {/* Extras by Unified Users */}
              <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-200/60 dark:border-purple-900/40 space-y-3">
                <p className="font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider text-[11px]">
                  Contratação de Usuários Extras (Add-ons Mensais)
                </p>

                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                    + Usuários Adicionais Contratados
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={subExtraUsers}
                    onChange={e => setSubExtraUsers(Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-xs font-bold bg-white dark:bg-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Cada usuário adicional acrescenta o valor contratado ao faturamento mensal da empresa.
                  </p>
                </div>
              </div>

              {/* Custom Overrides */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <p className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                  Overrides Especiais (Exceções & Negociação Direta)
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                      Mensalidade Fixa Customizada (R$)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 99.90 (ou vazio)"
                      value={subCustomPrice}
                      onChange={e => setSubCustomPrice(e.target.value)}
                      className="text-xs bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                      Capacidade Máx. Customizada (Total)
                    </label>
                    <Input
                      type="number"
                      placeholder="Ex: 10 (ou vazio)"
                      value={subCustomMaxUsers}
                      onChange={e => setSubCustomMaxUsers(e.target.value)}
                      className="text-xs bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowManagePlanModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold">
                  Salvar Plano & Limites
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CRIAR / EDITAR PLANO SAAS                                      */}
      {/* ===================================================================== */}
      {showPlanFormModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base">
                  {editingPlan ? `Editar Plano: ${editingPlan.name}` : 'Criar Novo Plano SaaS'}
                </h3>
              </div>
              <button onClick={() => setShowPlanFormModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold mb-1 block">Nome do Plano *</label>
                  <Input
                    required
                    placeholder="Ex: Plano Master Oficina"
                    value={planName}
                    onChange={e => setPlanName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-bold mb-1 block">Código Identificador</label>
                  <Input
                    placeholder="Ex: MASTER"
                    value={planCode}
                    onChange={e => setPlanCode(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold mb-1 block">Descrição do Plano</label>
                <Input
                  placeholder="Ex: Para assistências com 10 a 20 atendimentos diários"
                  value={planDescription}
                  onChange={e => setPlanDescription(e.target.value)}
                />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <p className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                  Limites & Precificação do Plano
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Preço Base (R$/mês)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={planMonthlyPrice}
                      onChange={e => setPlanMonthlyPrice(parseFloat(e.target.value) || 0)}
                      className="font-bold text-emerald-600 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Capacidade de Usuários Inclusos</label>
                    <Input
                      type="number"
                      min="1"
                      value={planMaxUsers}
                      onChange={e => setPlanMaxUsers(parseInt(e.target.value) || 1)}
                      className="bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Valor por Usuário Extra (R$/mês)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={planExtraUserPrice}
                      onChange={e => setPlanExtraUserPrice(parseFloat(e.target.value) || 0)}
                      className="bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold mb-1 block">Recursos Inclusos (Um por linha)</label>
                <textarea
                  rows={4}
                  value={planFeatures}
                  onChange={e => setPlanFeatures(e.target.value)}
                  placeholder="Emissão de Comandas com QR Code&#10;Bancada Técnica Kanban&#10;Relatórios Financeiros"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowPlanFormModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold">
                  {editingPlan ? 'Salvar Alterações' : 'Criar Plano SaaS'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: REDEFINIR SENHA DE USUÁRIO                                     */}
      {/* ===================================================================== */}
      {showResetUserPassModal && userToReset && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm">Redefinir Senha de Acesso</h3>
              <button onClick={() => setShowResetUserPassModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResetPass} className="space-y-3 text-xs">
              <p className="text-slate-500">
                Usuário: <strong className="text-slate-800 dark:text-slate-200">{userToReset.full_name}</strong> ({userToReset.email})
              </p>

              <div>
                <label className="font-bold mb-1 block">Nova Senha</label>
                <Input
                  type="password"
                  required
                  placeholder="Mínimo 4 caracteres"
                  value={newAdminPassword}
                  onChange={e => setNewAdminPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowResetUserPassModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold">
                  Definir Nova Senha
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
