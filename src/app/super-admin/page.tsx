'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Wrench,
  Smartphone,
  LogOut,
  Eye,
  CalendarClock,
  Download,
  FileSpreadsheet,
  Settings,
  Megaphone,
  UserPlus,
  Ban,
  BarChart3,
  Activity,
  ArrowUpRight,
  Timer
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore, SEGMENT_PRESETS, BUSINESS_PRESETS, SYSTEM_MODULES } from '@/lib/store';
import { formatCurrency, formatDate, getRoleBadgeConfig, cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DialogModal, DialogModalProps } from '@/components/ui/dialog-modal';
import { Company, Plan, Subscription, Profile, UserRole, BusinessSegment, SubscriptionStatus, PlatformSaasSettings } from '@/types';

export default function SuperAdminPage() {
  const router = useRouter();
  const { currentUser, impersonateCompany } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<'tenants' | 'plans' | 'users' | 'calculator' | 'settings'>('tenants');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'PAUSED'>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');
  const [segmentFilter, setSegmentFilter] = useState<string>('ALL');
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState<boolean>(false);
  const [overview, setOverview] = useState<any>(null);

  // Global Users Filter & CRUD State
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userCompanyFilter, setUserCompanyFilter] = useState<string>('ALL');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ONLINE' | 'ACTIVE' | 'BLOCKED'>('ALL');
  const [showUserFormModal, setShowUserFormModal] = useState(false);
  const [editingGlobalUser, setEditingGlobalUser] = useState<Profile | null>(null);
  const [userFormName, setUserFormName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormPhone, setUserFormPhone] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormRole, setUserFormRole] = useState<UserRole>('ATENDENTE');
  const [userFormTenantId, setUserFormTenantId] = useState('');
  const [userFormMustChange, setUserFormMustChange] = useState<boolean>(true);
  const [userFormActive, setUserFormActive] = useState<boolean>(true);

  // Modals
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [showEditTenantModal, setShowEditTenantModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [xrayCompany, setXrayCompany] = useState<Company | null>(null);

  const [showManagePlanModal, setShowManagePlanModal] = useState(false);
  const [tenantForPlanManage, setTenantForPlanManage] = useState<Company | null>(null);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus>('ACTIVE');
  const [subExpiresAt, setSubExpiresAt] = useState<string>('');
  const [subBillingCycle, setSubBillingCycle] = useState<'MONTHLY' | 'ANNUAL' | 'CUSTOM'>('MONTHLY');

  const [showPlanFormModal, setShowPlanFormModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [showResetUserPassModal, setShowResetUserPassModal] = useState(false);
  const [userToReset, setUserToReset] = useState<Profile | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');

  // Platform Settings State (Tab 5)
  const [platformSettings, setPlatformSettings] = useState<PlatformSaasSettings>(() => AppStore.getPlatformSettings());

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
  const [newAdminPass, setNewAdminPass] = useState('Mudar@123');

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
  const [selectedPlanModules, setSelectedPlanModules] = useState<string[]>([
    'balcao_os',
    'comandas_qr',
    'clientes_whatsapp',
    'catalogo_modelos',
    'bancada_kanban'
  ]);
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
    setPlatformSettings(AppStore.getPlatformSettings());

    if (pList.length > 0 && !newPlanId) {
      setNewPlanId(pList[0].id);
    }
    if (pList.length > 0 && !calcPlanId) {
      setCalcPlanId(pList[0].id);
    }
  };

  useEffect(() => {
    loadPlatformData();
    AppStore.syncFromSupabase().then(() => loadPlatformData()).catch(() => {});
    const handleUpdate = () => loadPlatformData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error') {
      toast.error(message);
    } else {
      toast.success(message);
    }
  };

  // Simulator Calculation (Declared before early return to follow React Rules of Hooks)
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

    const limits = AppStore.getEffectiveLimits(c.id);
    const subStatus = limits.subscription?.status || 'ACTIVE';
    const isExpired = subStatus === 'EXPIRED' || (limits.subscription?.expires_at ? new Date(limits.subscription.expires_at).getTime() < Date.now() : false);

    if (statusFilter === 'ACTIVE' && (c.is_active === false || subStatus === 'TRIAL' || isExpired)) return false;
    if (statusFilter === 'TRIAL' && (c.is_active === false || subStatus !== 'TRIAL')) return false;
    if (statusFilter === 'EXPIRED' && !isExpired) return false;
    if (statusFilter === 'PAUSED' && c.is_active !== false) return false;

    if (planFilter !== 'ALL' && limits.plan.id !== planFilter) return false;
    const compSegment = c.business_segment || c.active_template_keys?.[0] || 'RECARGA_CARTUCHOS';
    if (segmentFilter !== 'ALL' && compSegment !== segmentFilter) return false;

    return true;
  });

  // Filtered Global Users
  const filteredUsers = allUsers.filter(u => {
    const q = userSearchTerm.trim().toLowerCase();
    if (q) {
      const match =
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (userCompanyFilter !== 'ALL' && u.tenant_id !== userCompanyFilter) return false;
    if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;

    const isOnline = Boolean(u.active_session_token);
    if (userStatusFilter === 'ONLINE' && !isOnline) return false;
    if (userStatusFilter === 'ACTIVE' && u.is_active === false) return false;
    if (userStatusFilter === 'BLOCKED' && u.is_active !== false) return false;

    return true;
  });

  // Handlers: Support Mode, Renewal, X-Ray, WhatsApp Billing
  const handleEnterSupportMode = (c: Company) => {
    impersonateCompany(c.id);
    showToast(`Modo Suporte ativado para a loja "${c.trade_name}".`);
    router.push('/dashboard');
  };

  const handleRenewSubscriptionQuick = (c: Company, days: number = 30) => {
    try {
      AppStore.renewSubscription(c.id, days, currentUser.full_name);
      loadPlatformData();
      showToast(`Assinatura de "${c.trade_name}" renovada por +${days} dias!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao renovar assinatura.', 'error');
    }
  };

  const handleExtendTrialQuick = (c: Company, days: number = 7) => {
    try {
      AppStore.extendTrialSubscription(c.id, days, currentUser.full_name);
      loadPlatformData();
      showToast(`Trial de "${c.trade_name}" estendido por +${days} dias!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao estender trial.', 'error');
    }
  };

  const getCompanyBillingWhatsAppUrl = (c: Company) => {
    const limits = AppStore.getEffectiveLimits(c.id);
    const rawPhone = (c.whatsapp || c.phone || '').replace(/\D/g, '');
    const waPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
    const expText = limits.subscription?.expires_at
      ? new Date(limits.subscription.expires_at).toLocaleDateString('pt-BR')
      : 'este mês';
    const msg = `Olá *${c.responsible_name || c.trade_name}*!\n\nAqui é da equipe *${platformSettings.platform_name || 'Agil OS'}*.\n\nPassando para alinhar a assinatura do plano *${limits.plan.name}* (${formatCurrency(limits.finalMonthlyPrice)}/mês • vencimento ${expText}).\n\nChave Pix para renovação:\n*${platformSettings.pix_key}*\nFavorecido: ${platformSettings.pix_beneficiary}\n\nQualquer dúvida, estamos à disposição!`;
    return `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;
  };

  // Handlers: Global Users CRUD
  const handleOpenCreateGlobalUser = () => {
    setEditingGlobalUser(null);
    setUserFormName('');
    setUserFormEmail('');
    setUserFormPhone('');
    setUserFormPassword('Mudar@123');
    setUserFormRole('ATENDENTE');
    setUserFormTenantId(companies[0]?.id || '');
    setUserFormMustChange(true);
    setUserFormActive(true);
    setShowUserFormModal(true);
  };

  const handleOpenEditGlobalUser = (u: Profile) => {
    setEditingGlobalUser(u);
    setUserFormName(u.full_name);
    setUserFormEmail(u.email);
    setUserFormPhone(u.phone || '');
    setUserFormPassword('');
    setUserFormRole(u.role);
    setUserFormTenantId(u.tenant_id || companies[0]?.id || '');
    setUserFormMustChange(Boolean(u.must_change_password));
    setUserFormActive(u.is_active !== false);
    setShowUserFormModal(true);
  };

  const handleSaveGlobalUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormName.trim() || !userFormEmail.trim()) {
      showToast('Preencha o nome e o e-mail do usuário.', 'error');
      return;
    }

    try {
      if (editingGlobalUser) {
        AppStore.updateUser(
          editingGlobalUser.id,
          {
            full_name: userFormName.trim(),
            email: userFormEmail.trim(),
            phone: userFormPhone.trim() || undefined,
            role: userFormRole,
            tenant_id: userFormTenantId || editingGlobalUser.tenant_id,
            must_change_password: userFormMustChange,
            is_active: userFormActive
          },
          currentUser.full_name
        );
        showToast(`Usuário "${userFormName.trim()}" atualizado com sucesso!`);
      } else {
        if (!userFormPassword || userFormPassword.length < 8) {
          showToast('A senha inicial deve ter no mínimo 8 caracteres.', 'error');
          return;
        }
        AppStore.addUser(
          {
            tenant_id: userFormTenantId || companies[0]?.id || '',
            full_name: userFormName.trim(),
            email: userFormEmail.trim(),
            phone: userFormPhone.trim() || undefined,
            password: userFormPassword,
            role: userFormRole,
            must_change_password: userFormMustChange,
            is_active: userFormActive
          },
          currentUser.full_name
        );
        showToast(`Novo usuário "${userFormName.trim()}" cadastrado!`);
      }
      loadPlatformData();
      setShowUserFormModal(false);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar usuário.', 'error');
    }
  };

  const handleToggleUserStatus = (u: Profile) => {
    if (u.id === currentUser.id) {
      showToast('Você não pode bloquear sua própria conta.', 'error');
      return;
    }
    try {
      const nextActive = u.is_active === false;
      AppStore.updateUser(u.id, { is_active: nextActive }, currentUser.full_name);
      loadPlatformData();
      showToast(`Usuário "${u.full_name}" ${nextActive ? 'reativado' : 'bloqueado'} com sucesso!`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao alterar status do usuário.', 'error');
    }
  };

  const handleToggleForcePassChange = (u: Profile) => {
    try {
      const next = !u.must_change_password;
      AppStore.updateUser(u.id, { must_change_password: next }, currentUser.full_name);
      loadPlatformData();
      showToast(
        next
          ? `"${u.full_name}" será obrigado a alterar a senha no próximo login.`
          : `Obrigatoriedade de troca de senha removida para "${u.full_name}".`
      );
    } catch (err: any) {
      showToast(err?.message || 'Erro ao atualizar configuração de senha.', 'error');
    }
  };

  const handleDeleteGlobalUser = (u: Profile) => {
    if (u.id === currentUser.id) {
      showToast('Você não pode excluir sua própria conta.', 'error');
      return;
    }
    setDialogModal({
      isOpen: true,
      type: 'danger',
      title: 'Excluir Usuário Permanentemente?',
      message: `Deseja excluir a conta de "${u.full_name}" (${u.email})? Esta ação não poderá ser desfeita.`,
      confirmLabel: 'Sim, Excluir Usuário',
      cancelLabel: 'Cancelar',
      onCancel: () => setDialogModal(null),
      onConfirm: () => {
        try {
          AppStore.deleteUser(u.id, currentUser.full_name);
          loadPlatformData();
          showToast(`Usuário "${u.full_name}" excluído.`);
        } catch (err: any) {
          showToast(err?.message || 'Erro ao excluir usuário.', 'error');
        } finally {
          setDialogModal(null);
        }
      }
    });
  };

  // Handlers: Platform Settings & Export
  const handleSavePlatformSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = AppStore.updatePlatformSettings(platformSettings, currentUser.full_name);
      setPlatformSettings(saved);
      showToast('Configurações globais do SaaS salvas com sucesso!');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar configurações da plataforma.', 'error');
    }
  };

  const handleExportTenantsCsv = () => {
    const headers = [
      'Empresa',
      'Razao_Social',
      'CNPJ',
      'Segmento',
      'Plano',
      'Status_Empresa',
      'Status_Assinatura',
      'Vencimento',
      'Usuarios_Usados',
      'Limite_Usuarios',
      'Mensalidade_R$',
      'Total_OS',
      'WhatsApp',
      'Email'
    ];
    const rows = companies.map(c => {
      const limits = AppStore.getEffectiveLimits(c.id);
      const stats = AppStore.getTenantStats(c.id);
      const seg = c.business_segment || c.active_template_keys?.[0] || 'RECARGA_CARTUCHOS';
      return [
        `"${(c.trade_name || '').replace(/"/g, '""')}"`,
        `"${(c.corporate_name || '').replace(/"/g, '""')}"`,
        `"${c.cnpj || ''}"`,
        seg,
        `"${limits.plan.name}"`,
        c.is_active !== false ? 'ATIVA' : 'BLOQUEADA',
        limits.subscription?.status || 'ACTIVE',
        limits.subscription?.expires_at ? new Date(limits.subscription.expires_at).toLocaleDateString('pt-BR') : 'Sem vencimento',
        limits.usedUsers,
        limits.maxUsers,
        limits.finalMonthlyPrice.toFixed(2),
        stats.totalOrders || 0,
        `"${c.whatsapp || c.phone || ''}"`,
        `"${c.email || ''}"`
      ].join(';');
    });
    const csv = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agilos_empresas_mrr_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exportadas ${companies.length} empresa(s) para CSV!`);
  };

  const handleExportPlatformJson = () => {
    const safeUsers = allUsers.map(({ password: _p, ...rest }) => rest);
    const payload = {
      exported_at: new Date().toISOString(),
      platform: platformSettings.platform_name || 'Agil OS',
      overview,
      platformSettings,
      plans,
      companies,
      subscriptions,
      users: safeUsers
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agilos_backup_master_saas_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Backup Master da Plataforma (JSON) gerado com sucesso!');
  };

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
          password: newAdminPass || 'Mudar@123',
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
      setNewAdminPass('Mudar@123');
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
    setSubExtraUsers(Number(limits.subscription.extra_users) || 0);
    setSubCustomPrice(
      limits.subscription.custom_price !== undefined &&
      limits.subscription.custom_price !== null &&
      String(limits.subscription.custom_price).trim() !== ''
        ? String(limits.subscription.custom_price)
        : ''
    );
    setSubCustomMaxUsers(
      limits.subscription.custom_max_users !== undefined &&
      limits.subscription.custom_max_users !== null &&
      String(limits.subscription.custom_max_users).trim() !== ''
        ? String(limits.subscription.custom_max_users)
        : ''
    );
    setSubStatus(limits.subscription.status || 'ACTIVE');
    setSubExpiresAt(
      limits.subscription.expires_at
        ? new Date(limits.subscription.expires_at).toISOString().slice(0, 10)
        : ''
    );
    setSubBillingCycle(limits.subscription.billing_cycle || 'MONTHLY');
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
          status: subStatus,
          expires_at: subExpiresAt ? new Date(`${subExpiresAt}T23:59:59Z`).toISOString() : undefined,
          billing_cycle: subBillingCycle,
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
  const ESSENTIAL_KEYS = ['balcao_os', 'comandas_qr', 'clientes_whatsapp', 'catalogo_modelos', 'bancada_kanban'];
  const BASIC_KEYS = [...ESSENTIAL_KEYS, 'pesagem_precisao', 'frente_caixa', 'relatorios_financeiros'];

  const togglePlanModule = (moduleKey: string) => {
    setSelectedPlanModules(prev =>
      prev.includes(moduleKey) ? prev.filter(k => k !== moduleKey) : [...prev, moduleKey]
    );
  };

  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanName('');
    setPlanCode('');
    setPlanDescription('');
    setPlanMonthlyPrice(79.90);
    setPlanMaxUsers(5);
    setPlanExtraUserPrice(15);
    setSelectedPlanModules(ESSENTIAL_KEYS);
    setPlanFeatures('');
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
    const { moduleKeys, extraFeatures } = AppStore.extractPlanModules(p.features);
    setSelectedPlanModules(moduleKeys.length > 0 ? moduleKeys : ESSENTIAL_KEYS);
    setPlanFeatures(extraFeatures.join('\n'));
    setShowPlanFormModal(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName) {
      showToast('Informe o nome do plano.', 'error');
      return;
    }
    if (selectedPlanModules.length === 0) {
      showToast('Selecione ao menos um módulo para o plano.', 'error');
      return;
    }

    const moduleLabels = SYSTEM_MODULES
      .filter(m => selectedPlanModules.includes(m.key))
      .map(m => m.label);

    const extraFeatureList = planFeatures
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    const featureList = [...moduleLabels, ...extraFeatureList];

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

  const handleTerminateSessionSuperAdmin = (u: Profile) => {
    setDialogModal({
      isOpen: true,
      title: 'Desconectar Usuário Remotamente',
      message: `Deseja forçar o encerramento da sessão ativa do usuário "${u.full_name}" no dispositivo "${u.active_session_device || 'Web'}"?`,
      confirmLabel: 'Sim, Desconectar',
      cancelLabel: 'Cancelar',
      type: 'danger',
      onConfirm: () => {
        try {
          AppStore.terminateUserSession(u.id, currentUser?.full_name || 'Super Administrador');
          loadPlatformData();
          showToast(`Sessão do usuário "${u.full_name}" encerrada com sucesso!`);
        } catch (err: any) {
          showToast(err?.message || 'Erro ao encerrar sessão.', 'error');
        } finally {
          setDialogModal(null);
        }
      }
    });
  };

  const copyProposalToClipboard = () => {
    if (!selectedCalcPlan) return;
    const text = `*PROPOSTA AGIL OS - SISTEMA OPERACIONAL*
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

  if (currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Acesso Restrito: Super Administrador</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Esta área é de acesso exclusivo para a gestão da infraestrutura SaaS da plataforma. Seu usuário ({currentUser?.full_name || 'Desconhecido'}) possui o papel <strong>{currentUser?.role || 'Não Autenticado'}</strong> e não tem permissão para acessar esta página.
        </p>
        <div className="pt-4">
          <Link href="/dashboard">
            <Button className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl px-6">
              Voltar ao Painel Principal
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Global Dialog Modal */}
      {dialogModal && <DialogModal {...dialogModal} />}

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-slate-900 dark:bg-[#0c121e] p-6 md:p-8 rounded-3xl text-white shadow-sm border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-400/10 text-amber-300 border border-amber-400/20 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Painel Master da Plataforma
              </span>
              <span className="text-[10px] text-slate-400 font-mono">SaaS Multi-Tenant v2.0</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Central do Super Administrador</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
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

      {/* Global SaaS Platform KPIs (6 Executive Metrics) */}
      {overview && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                {overview.trialCompanies || 0} em trial • {overview.pausedCompanies > 0 ? `${overview.pausedCompanies} suspensas` : '0 suspensas'}
              </p>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">MRR & ARR Projetado</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(overview.totalMRR)}</span>
                <span className="text-[10px] text-slate-400">/ mês</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                ARR: <strong className="text-slate-600 dark:text-slate-300">{formatCurrency(overview.totalARR || 0)}</strong>/ano ({overview.paidCompanies || 0} pagantes)
              </p>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ticket Médio (ARPU)</span>
                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{formatCurrency(overview.arpu || 0)}</span>
                <span className="text-[10px] text-slate-400">/ loja ativa</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Base de planos + adicionais contratados</p>
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
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {overview.onlineUsersCount || 0} online agora
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {overview.adminsCount || 0} admins • {overview.attendantsCount || 0} atend. • {overview.techsCount || 0} técnicos
              </p>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Planos & Contratos</span>
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{overview.plansCount || plans.length}</span>
                <span className="text-xs font-semibold text-slate-500">planos ativos</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {overview.subscriptionsCount || 0} assinaturas • {overview.expiredCompanies > 0 ? (
                  <span className="text-rose-600 font-bold">{overview.expiredCompanies} vencida(s)</span>
                ) : '0 vencidas'}
              </p>
            </Card>

            <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Movimentação Global (GMV)</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{formatCurrency(overview.totalGMVGlobal || 0)}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {overview.totalOrdersGlobal || 0} OS emitidas • {overview.totalItemsGlobal || 0} itens processados
              </p>
            </Card>
          </div>

          {/* Toggle Analytics Distribution Strip */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span>Distribuição Executiva (Receita por Plano & Lojas por Segmento)</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAnalyticsPanel(!showAnalyticsPanel)}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 h-7"
            >
              {showAnalyticsPanel ? 'Ocultar Gráficos' : 'Expandir Gráficos'}
            </Button>
          </div>

          {showAnalyticsPanel && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in">
              <Card className="p-4 border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Receita Recorrente (MRR) por Plano</h3>
                <div className="space-y-3">
                  {(overview.planDistribution || []).map((pd: any) => {
                    const pct = overview.totalMRR > 0 ? Math.round((pd.mrr / overview.totalMRR) * 100) : 0;
                    return (
                      <div key={pd.id} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {pd.name} <span className="text-[10px] font-normal text-slate-400">({pd.count} loja(s))</span>
                          </span>
                          <span className="font-extrabold text-emerald-600">{formatCurrency(pd.mrr)} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.max(4, pct)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-4 border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lojas por Segmento de Atuação</h3>
                <div className="space-y-3">
                  {(overview.segmentDistribution || []).map((sd: any) => {
                    const pct = overview.totalCompanies > 0 ? Math.round((sd.count / overview.totalCompanies) * 100) : 0;
                    return (
                      <div key={sd.key} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{sd.name}</span>
                          <span className="font-extrabold text-purple-600 dark:text-purple-400">{sd.count} loja(s) ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${Math.max(4, pct)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-1 sm:gap-2">
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
          <span>Planos & Módulos ({plans.length})</span>
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
          <span>Usuários Globais ({allUsers.length})</span>
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
          <span>Simulador SaaS</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all",
            activeTab === 'settings'
              ? "border-purple-600 text-purple-600 dark:text-purple-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Settings className="w-4 h-4" />
          <span>Configurações SaaS & Pix</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: EMPRESAS & ASSINATURAS                                         */}
      {/* ===================================================================== */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          {/* Search & Multi Filters */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Buscar empresa, CNPJ, cidade, e-mail..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="text-xs h-9 w-40"
              >
                <option value="ALL">Todos os Status</option>
                <option value="ACTIVE">Pagantes Ativas</option>
                <option value="TRIAL">Em Trial (Teste)</option>
                <option value="EXPIRED">Vencidas / Expiradas</option>
                <option value="PAUSED">Suspensas / Bloqueadas</option>
              </Select>

              <Select
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value)}
                className="text-xs h-9 w-40"
              >
                <option value="ALL">Todos os Planos</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>

              <Select
                value={segmentFilter}
                onChange={e => setSegmentFilter(e.target.value)}
                className="text-xs h-9 w-44"
              >
                <option value="ALL">Todos os Segmentos</option>
                {Object.values(BUSINESS_PRESETS).map(seg => (
                  <option key={seg.key} value={seg.key}>{seg.name}</option>
                ))}
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
                    <th className="p-3.5">Assinatura & Vencimento</th>
                    <th className="p-3.5">Usuários</th>
                    <th className="p-3.5">Mensalidade</th>
                    <th className="p-3.5">Volume</th>
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
                      const subStatus = limits.subscription?.status || 'ACTIVE';
                      const expiresAt = limits.subscription?.expires_at ? new Date(limits.subscription.expires_at) : null;
                      const daysRemaining = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400000) : null;
                      const isExpired = subStatus === 'EXPIRED' || (daysRemaining !== null && daysRemaining < 0);
                      const segKey = c.business_segment || c.active_template_keys?.[0] || 'RECARGA_CARTUCHOS';
                      const segName = (BUSINESS_PRESETS as any)[segKey]?.name || segKey;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.trade_name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">CNPJ: {c.cnpj || 'Não informado'}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                              <span className="text-purple-600 dark:text-purple-400 font-semibold">{segName}</span>
                              {c.city && <span>• {c.city}/{c.state}</span>}
                              {c.whatsapp && <span className="text-emerald-600 font-semibold">• {c.whatsapp}</span>}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <Badge className="bg-purple-600/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-bold">
                              {limits.plan.name}
                            </Badge>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Ciclo: {limits.subscription?.billing_cycle === 'ANNUAL' ? 'Anual' : limits.subscription?.billing_cycle === 'CUSTOM' ? 'Custom' : 'Mensal'}
                            </p>
                          </td>

                          <td className="p-3.5">
                            <div className="space-y-1">
                              {!isCompanyActive ? (
                                <Badge variant="destructive" className="font-bold text-[10px]">BLOQUEADA</Badge>
                              ) : isExpired ? (
                                <Badge className="bg-rose-600 text-white font-bold text-[10px]">VENCIDA</Badge>
                              ) : subStatus === 'TRIAL' ? (
                                <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px]">EM TRIAL</Badge>
                              ) : (
                                <Badge className="bg-emerald-600 text-white font-bold text-[10px]">ATIVA</Badge>
                              )}
                              {expiresAt ? (
                                <p className={cn(
                                  "text-[10px] font-medium",
                                  daysRemaining !== null && daysRemaining <= 3 ? "text-rose-600 font-bold" : "text-slate-400"
                                )}>
                                  Vence {expiresAt.toLocaleDateString('pt-BR')} (
                                  {daysRemaining === 0
                                    ? 'Hoje'
                                    : daysRemaining && daysRemaining > 0
                                    ? `faltam ${daysRemaining}d`
                                    : `há ${Math.abs(daysRemaining || 0)}d`}
                                  )
                                </p>
                              ) : (
                                <p className="text-[10px] text-slate-400">Recorrente contínua</p>
                              )}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span className={cn("font-bold text-xs", limits.usedUsers >= limits.maxUsers ? "text-amber-600" : "text-slate-700 dark:text-slate-300")}>
                              {limits.usedUsers} / {limits.maxUsers}
                            </span>
                            {limits.extraUsers > 0 && (
                              <span className="block text-[10px] text-purple-600 font-semibold">+{limits.extraUsers} extras</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                              {formatCurrency(limits.finalMonthlyPrice)}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{stats.totalOrders || stats.totalEntries || 0} OS</div>
                            <div className="text-[10px] text-slate-400">{stats.totalItems || 0} itens • {stats.totalCustomers || 0} cli.</div>
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEnterSupportMode(c)}
                                title="Acessar painel operacional desta loja (Modo Suporte)"
                                className="h-7 text-[11px] px-2 font-bold text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                                <span>Acessar</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setXrayCompany(c)}
                                title="Raio-X 360º da Empresa"
                                className="h-7 text-[11px] px-2 font-bold text-slate-700 dark:text-slate-200"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRenewSubscriptionQuick(c, 30)}
                                title="Dar baixa e renovar assinatura +30 dias"
                                className="h-7 text-[11px] px-2 font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              >
                                <CalendarClock className="w-3.5 h-3.5 mr-0.5" />
                                <span>+30d</span>
                              </Button>

                              {(c.whatsapp || c.phone) && (
                                <a
                                  href={getCompanyBillingWhatsAppUrl(c)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Enviar cobrança / contato no WhatsApp"
                                  className="inline-flex items-center justify-center h-7 px-2 rounded-md border border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                >
                                  <Smartphone className="w-3.5 h-3.5" />
                                </a>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenManagePlan(c)}
                                title="Gerenciar Plano, Vencimento e Limites"
                                className="h-7 text-[11px] px-2 font-bold text-purple-600 dark:text-purple-300 border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-950/50"
                              >
                                <Sliders className="w-3.5 h-3.5" />
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

                      {/* Modules & Features List */}
                      {p.features && p.features.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Módulos Contemplados ({AppStore.extractPlanModules(p.features).moduleKeys.length}/{SYSTEM_MODULES.length})
                          </p>
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
      {/* TAB 3: GESTÃO COMPLETA DE USUÁRIOS GLOBAIS                            */}
      {/* ===================================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <Card className="p-4 border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Gestão Global de Usuários da Plataforma</h3>
                <p className="text-xs text-slate-500">Crie, edite cargos, bloqueie acessos, force troca de senha e desconecte sessões em tempo real.</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 text-white font-bold text-xs">
                  {filteredUsers.length} de {allUsers.length} usuários
                </Badge>
                <Button
                  size="sm"
                  onClick={handleOpenCreateGlobalUser}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Criar Usuário Global</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  placeholder="Buscar por nome, e-mail ou telefone..."
                  value={userSearchTerm}
                  onChange={e => setUserSearchTerm(e.target.value)}
                  className="pl-9 text-xs h-9"
                />
              </div>

              <Select
                value={userCompanyFilter}
                onChange={e => setUserCompanyFilter(e.target.value)}
                className="text-xs h-9"
              >
                <option value="ALL">Todas as Empresas</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.trade_name}</option>
                ))}
              </Select>

              <Select
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
                className="text-xs h-9"
              >
                <option value="ALL">Todos os Cargos</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMINISTRADOR">Administrador</option>
                <option value="ATENDENTE">Atendente</option>
                <option value="TECNICO">Técnico</option>
              </Select>

              <Select
                value={userStatusFilter}
                onChange={e => setUserStatusFilter(e.target.value as any)}
                className="text-xs h-9"
              >
                <option value="ALL">Todos os Status</option>
                <option value="ONLINE">Online Agora</option>
                <option value="ACTIVE">Contas Ativas</option>
                <option value="BLOCKED">Contas Bloqueadas</option>
              </Select>
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
                    <th className="p-3.5">Papel & Segurança</th>
                    <th className="p-3.5">Sessão / Status</th>
                    <th className="p-3.5">Cadastro</th>
                    <th className="p-3.5 text-right">Ações Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Nenhum usuário encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => {
                      const roleBadge = getRoleBadgeConfig(u.role);
                      const company = companies.find(c => c.id === u.tenant_id);
                      const isOnline = Boolean(u.active_session_token);
                      const isUserActive = u.is_active !== false;

                      return (
                        <tr key={u.id} className={cn("hover:bg-slate-50 dark:hover:bg-slate-800/40", !isUserActive && "opacity-65")}>
                          <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                            {u.full_name}
                            {u.phone && <span className="text-[11px] text-slate-400 font-normal block">{u.phone}</span>}
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">{u.email}</td>
                          <td className="p-3.5">
                            {u.role === 'SUPER_ADMIN' ? (
                              <span className="text-purple-600 font-bold flex items-center gap-1">
                                <Crown className="w-3.5 h-3.5" /> Central Agil OS
                              </span>
                            ) : (
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {company?.trade_name || 'Empresa Padrão'}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 space-y-1">
                            <Badge className={cn("text-[10px] font-bold", roleBadge.className)}>
                              {roleBadge.label}
                            </Badge>
                            {u.must_change_password && (
                              <span className="block text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                Troca de senha pendente
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 space-y-1">
                            {!isUserActive ? (
                              <Badge variant="destructive" className="text-[10px] font-bold">Bloqueado</Badge>
                            ) : isOnline ? (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Online
                                </span>
                                <span className="text-[10px] text-slate-400 max-w-[110px] truncate" title={u.active_session_device}>
                                  {u.active_session_device || 'Web'}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                Offline
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-400">{formatDate(u.created_at)}</td>
                          <td className="p-3.5 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEditGlobalUser(u)}
                                title="Editar nome, cargo e empresa"
                                className="h-7 text-[11px] px-2 text-slate-700 dark:text-slate-200"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleForcePassChange(u)}
                                title={u.must_change_password ? "Remover troca obrigatória de senha" : "Exigir troca de senha no próximo login"}
                                className={cn(
                                  "h-7 text-[11px] px-2 font-bold",
                                  u.must_change_password
                                    ? "bg-amber-50 text-amber-700 border-amber-400"
                                    : "text-slate-600 dark:text-slate-300"
                                )}
                              >
                                <KeyRound className="w-3 h-3" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                disabled={u.id === currentUser.id}
                                onClick={() => handleToggleUserStatus(u)}
                                title={isUserActive ? "Bloquear usuário" : "Reativar usuário"}
                                className={cn(
                                  "h-7 text-[11px] px-2 font-bold",
                                  isUserActive ? "text-amber-600 border-amber-500/30" : "text-emerald-600 border-emerald-500/30"
                                )}
                              >
                                {isUserActive ? <Ban className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                              </Button>

                              {isOnline && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleTerminateSessionSuperAdmin(u)}
                                  className="h-7 text-[11px] px-2 font-bold text-rose-600 border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                  title="Desconectar sessão ativa remotamente"
                                >
                                  <LogOut className="w-3 h-3" />
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenResetPass(u)}
                                className="h-7 text-[11px] px-2 font-bold text-amber-600 border-amber-500/30 hover:bg-amber-50"
                              >
                                Senha
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                disabled={u.id === currentUser.id}
                                onClick={() => handleDeleteGlobalUser(u)}
                                title="Excluir usuário"
                                className="h-7 text-[11px] px-2 text-rose-600 border-rose-500/30 hover:bg-rose-50"
                              >
                                <Trash2 className="w-3 h-3" />
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
            <Card className="bg-slate-900 text-white border-slate-800 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span>Resumo da Proposta</span>
                  </CardTitle>
                  <Badge className="bg-amber-400 text-amber-950 font-bold text-[10px]">
                    100% Margem de Lucro
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Plano Base ({selectedCalcPlan?.name}):</span>
                    <span className="font-bold text-white">{formatCurrency(calcResults.base)}</span>
                  </div>

                  {calcResults.extraUsersCost > 0 && (
                    <div className="flex justify-between text-slate-300">
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
      {/* ABA 5: CONFIGURAÇÕES SAAS, PIX, COMUNICADOS E EXPORTAÇÃO              */}
      {/* ===================================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header & Export Quick Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Configurações Globais do SaaS & Recebimento Pix
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Defina os dados oficiais de cobrança Pix exibidos no painel das lojas, publique avisos globais em tempo real e exporte relatórios gerenciais.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleExportTenantsCsv}
                className="text-xs font-bold gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar Empresas (CSV)</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleExportPlatformJson}
                className="text-xs font-bold gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
              >
                <Download className="w-4 h-4" />
                <span>Backup Completo (JSON)</span>
              </Button>
            </div>
          </div>

          <form onSubmit={handleSavePlatformSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna 1 & 2: Pix, Suporte e Regras Comerciais */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Recebimento Pix & Canais Oficiais</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Esses dados alimentam automaticamente o QR Code Pix EMV na aba Assinatura de cada empresa e os links de cobrança no WhatsApp.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Nome Oficial da Plataforma
                    </label>
                    <Input
                      required
                      value={platformSettings.platform_name}
                      onChange={e => setPlatformSettings(prev => ({ ...prev, platform_name: e.target.value }))}
                      placeholder="Ex: Agil OS"
                      className="text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Chave Pix Oficial (E-mail, CNPJ, Celular ou EVP)
                    </label>
                    <Input
                      required
                      value={platformSettings.pix_key}
                      onChange={e => setPlatformSettings(prev => ({ ...prev, pix_key: e.target.value }))}
                      placeholder="pix@supremeapps.com.br"
                      className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Favorecido Pix (Nome no Comprovante / QR Code)
                    </label>
                    <Input
                      required
                      value={platformSettings.pix_beneficiary}
                      onChange={e => setPlatformSettings(prev => ({ ...prev, pix_beneficiary: e.target.value }))}
                      placeholder="SUPREME INFORMATICA"
                      className="text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Cidade do Recebedor Pix (Sem acentos no BRCode)
                    </label>
                    <Input
                      required
                      value={platformSettings.pix_city}
                      onChange={e => setPlatformSettings(prev => ({ ...prev, pix_city: e.target.value }))}
                      placeholder="SAO PAULO"
                      className="text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      WhatsApp Comercial / Suporte (com DDI 55)
                    </label>
                    <Input
                      value={platformSettings.support_whatsapp}
                      onChange={e => setPlatformSettings(prev => ({ ...prev, support_whatsapp: e.target.value }))}
                      placeholder="5511999999999"
                      className="text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      E-mail de Suporte Técnico & Financeiro
                    </label>
                    <Input
                      type="email"
                      value={platformSettings.support_email}
                      onChange={e => setPlatformSettings(prev => ({ ...prev, support_email: e.target.value }))}
                      placeholder="suporte@supremeapps.com.br"
                      className="text-xs"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-amber-500" />
                    <span>Aviso Global em Broadcast (Banner no Topo das Lojas)</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Publique comunicados importantes (manutenções, novidades, promoções) para todas as lojas conectadas no painel. Deixe em branco para ocultar o banner.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5 space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                        Mensagem do Comunicado Global
                      </label>
                      <Input
                        value={platformSettings.global_announcement}
                        onChange={e => setPlatformSettings(prev => ({ ...prev, global_announcement: e.target.value }))}
                        placeholder="Ex: Nova integração de WhatsApp automático liberada no módulo Clientes!"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                        Estilo Visual do Banner
                      </label>
                      <Select
                        value={platformSettings.global_announcement_type}
                        onChange={e => setPlatformSettings(prev => ({
                          ...prev,
                          global_announcement_type: e.target.value as 'info' | 'warning' | 'emerald'
                        }))}
                        className="text-xs font-semibold"
                      >
                        <option value="info">Informativo (Azul)</option>
                        <option value="warning">Alerta / Manutenção (Âmbar)</option>
                        <option value="emerald">Novidade / Sucesso (Verde)</option>
                      </Select>
                    </div>
                  </div>

                  {platformSettings.global_announcement?.trim() && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Pré-visualização do Banner nos Painéis
                        </span>
                        <button
                          type="button"
                          onClick={() => setPlatformSettings(prev => ({ ...prev, global_announcement: '' }))}
                          className="text-[11px] font-semibold text-rose-600 hover:underline"
                        >
                          Limpar Aviso
                        </button>
                      </div>
                      <div className={cn(
                        'px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2',
                        platformSettings.global_announcement_type === 'warning'
                          ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/60 dark:border-amber-900/50 dark:text-amber-200'
                          : platformSettings.global_announcement_type === 'emerald'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-900/50 dark:text-emerald-200'
                            : 'bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-950/60 dark:border-sky-900/50 dark:text-sky-200'
                      )}>
                        <Megaphone className="w-4 h-4 shrink-0" />
                        <span>{platformSettings.global_announcement}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coluna 3: Regras Comerciais & Resumo */}
            <div className="space-y-6">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Timer className="w-4 h-4 text-purple-600" />
                    <span>Políticas de Trial & Ciclo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Dias de Trial Padrão para Novas Empresas
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      value={platformSettings.default_trial_days}
                      onChange={e => setPlatformSettings(prev => ({
                        ...prev,
                        default_trial_days: Math.max(1, parseInt(e.target.value, 10) || 14)
                      }))}
                      className="text-xs font-bold"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Aplicado no onboarding automático e atalhos de extensão de teste.
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Desconto Padrão no Plano Anual (%)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={80}
                      value={platformSettings.annual_discount_percent}
                      onChange={e => setPlatformSettings(prev => ({
                        ...prev,
                        annual_discount_percent: Math.max(0, Math.min(80, parseInt(e.target.value, 10) || 0))
                      }))}
                      className="text-xs font-bold"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Resumo da Base SaaS</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Empresas Cadastradas</span>
                      <span className="font-bold">{companies.length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Usuários Globais</span>
                      <span className="font-bold">{allUsers.length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Planos Configurados</span>
                      <span className="font-bold">{plans.length}</span>
                    </div>
                    {platformSettings.updated_at && (
                      <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                        Última atualização: {formatDate(platformSettings.updated_at)}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-2 py-2.5 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Salvar Configurações Globais SaaS</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </form>
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
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                    <span>Nome Fantasia</span>
                    <span className="text-red-500 font-bold ml-1">*</span>
                  </label>
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
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                    <span>E-mail da Empresa</span>
                    <span className="text-red-500 font-bold ml-1">*</span>
                  </label>
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
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                    <span>Ramo de Atuação / Segmento</span>
                    <span className="text-red-500 font-bold ml-1">*</span>
                  </label>
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
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                    <span>Plano de Assinatura Inicial</span>
                    <span className="text-red-500 font-bold ml-1">*</span>
                  </label>
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
                    <label className="text-[11px] text-slate-500 mb-1 block">Senha Inicial (Padrão: Mudar@123)</label>
                    <Input
                      type="password"
                      placeholder="Mudar@123"
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

              {/* Lifecycle & Expiration Controls */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/70 dark:border-indigo-900/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span>Ciclo de Vida, Status & Vencimento</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(Date.now() + 7 * 86400000);
                        setSubStatus('TRIAL');
                        setSubExpiresAt(d.toISOString().slice(0, 10));
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-950/70 dark:text-sky-300"
                    >
                      +7d Trial
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const baseMs = subExpiresAt ? Math.max(Date.now(), new Date(`${subExpiresAt}T23:59:59Z`).getTime()) : Date.now();
                        const d = new Date(baseMs + 30 * 86400000);
                        setSubStatus('ACTIVE');
                        setSubBillingCycle('MONTHLY');
                        setSubExpiresAt(d.toISOString().slice(0, 10));
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300"
                    >
                      +30d Ativo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const baseMs = subExpiresAt ? Math.max(Date.now(), new Date(`${subExpiresAt}T23:59:59Z`).getTime()) : Date.now();
                        const d = new Date(baseMs + 365 * 86400000);
                        setSubStatus('ACTIVE');
                        setSubBillingCycle('ANNUAL');
                        setSubExpiresAt(d.toISOString().slice(0, 10));
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300"
                    >
                      +1 Ano Ativo
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubExpiresAt('')}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-200/80 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
                    >
                      Sem Vencimento
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                      Status da Assinatura
                    </label>
                    <Select
                      value={subStatus}
                      onChange={e => setSubStatus(e.target.value as SubscriptionStatus)}
                      className="text-xs font-semibold bg-white dark:bg-slate-900"
                    >
                      <option value="ACTIVE">Ativa (ACTIVE)</option>
                      <option value="TRIAL">Período Trial (TRIAL)</option>
                      <option value="PAUSED">Pausada (PAUSED)</option>
                      <option value="EXPIRED">Expirada (EXPIRED)</option>
                      <option value="CANCELLED">Cancelada (CANCELLED)</option>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                      Ciclo de Cobrança
                    </label>
                    <Select
                      value={subBillingCycle}
                      onChange={e => setSubBillingCycle(e.target.value as 'MONTHLY' | 'ANNUAL' | 'CUSTOM')}
                      className="text-xs font-semibold bg-white dark:bg-slate-900"
                    >
                      <option value="MONTHLY">Mensal</option>
                      <option value="ANNUAL">Anual</option>
                      <option value="CUSTOM">Negociação Custom</option>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mb-1 block">
                      Data de Vencimento
                    </label>
                    <Input
                      type="date"
                      value={subExpiresAt}
                      onChange={e => setSubExpiresAt(e.target.value)}
                      className="text-xs font-semibold bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
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
                  <label className="font-bold mb-1 flex items-center">
                    <span>Nome do Plano</span>
                    <span className="text-red-500 font-bold ml-1">*</span>
                  </label>
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

              {/* Modules Selection */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
                      <span>Módulos do Sistema Contemplados no Plano</span>
                      <Badge className="bg-purple-600 text-white text-[10px]">
                        {selectedPlanModules.length} de {SYSTEM_MODULES.length} módulos ativos
                      </Badge>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Define quais funcionalidades as empresas assinantes deste plano terão acesso no menu e operação.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPlanModules(ESSENTIAL_KEYS)}
                      className="h-7 px-2 text-[10px] font-bold"
                    >
                      Essencial (5)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPlanModules(BASIC_KEYS)}
                      className="h-7 px-2 text-[10px] font-bold"
                    >
                      Básico (8)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPlanModules(SYSTEM_MODULES.map(m => m.key))}
                      className="h-7 px-2 text-[10px] font-bold text-emerald-600 border-emerald-500/40"
                    >
                      Completo (12)
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {(['Atendimento & Balcão', 'Oficina & Bancada', 'Financeiro & Gestão', 'Segurança & Multi-Loja'] as const).map(cat => {
                    const catModules = SYSTEM_MODULES.filter(m => m.category === cat);
                    return (
                      <div key={cat} className="space-y-1.5">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          {cat}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {catModules.map(mod => {
                            const checked = selectedPlanModules.includes(mod.key);
                            return (
                              <label
                                key={mod.key}
                                className={cn(
                                  "flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all select-none",
                                  checked
                                    ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePlanModule(mod.key)}
                                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <div className="min-w-0">
                                  <span className="font-bold text-[11px] text-slate-800 dark:text-slate-100 block leading-tight">
                                    {mod.label}
                                  </span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                                    {mod.description}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-bold mb-1 block">Diferenciais / Benefícios Extras (Opcional — 1 por linha)</label>
                <textarea
                  rows={3}
                  value={planFeatures}
                  onChange={e => setPlanFeatures(e.target.value)}
                  placeholder="Ex: Treinamento de equipe por vídeo&#10;Suporte VIP via WhatsApp&#10;Migração assistida de dados"
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
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
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

      {/* ===================================================================== */}
      {/* MODAL: RAIO-X 360º DA EMPRESA (TENANT)                                */}
      {/* ===================================================================== */}
      {xrayCompany && (() => {
        const limits = AppStore.getEffectiveLimits(xrayCompany.id);
        const stats = AppStore.getTenantStats(xrayCompany.id);
        const companyUsers = allUsers.filter(u => u.tenant_id === xrayCompany.id);
        const segKey = xrayCompany.business_segment || xrayCompany.active_template_keys?.[0] || 'RECARGA_CARTUCHOS';
        const segName = (BUSINESS_PRESETS as any)[segKey]?.name || segKey;
        const subStatus = limits.subscription?.status || 'ACTIVE';
        const enabledModules = SYSTEM_MODULES.filter(m => AppStore.isModuleEnabledForTenant(xrayCompany.id, m.key));

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 my-8 animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {xrayCompany.trade_name}
                      </h3>
                      <Badge className={cn(
                        'text-[10px] font-bold',
                        xrayCompany.is_active !== false
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                      )}>
                        {xrayCompany.is_active !== false ? 'Loja Ativa' : 'Bloqueada'}
                      </Badge>
                      <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                        Assinatura: {subStatus}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {xrayCompany.corporate_name} • CNPJ: {xrayCompany.cnpj || 'Não informado'} • {segName}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {xrayCompany.city || 'Cidade N/I'}{xrayCompany.state ? `/${xrayCompany.state}` : ''} • E-mail: {xrayCompany.email || '—'} • WhatsApp: {xrayCompany.whatsapp || xrayCompany.phone || '—'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setXrayCompany(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Strip */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const target = xrayCompany;
                    setXrayCompany(null);
                    handleEnterSupportMode(target);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Entrar em Modo Suporte</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const target = xrayCompany;
                    setXrayCompany(null);
                    handleOpenManagePlan(target);
                  }}
                  className="text-xs font-bold gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-600" />
                  <span>Gerenciar Plano & Vencimento</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleRenewSubscriptionQuick(xrayCompany, 30)}
                  className="text-xs font-bold gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Renovar +30d</span>
                </Button>
                {(xrayCompany.whatsapp || xrayCompany.phone) && (
                  <a
                    href={getCompanyBillingWhatsAppUrl(xrayCompany)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Cobrar via WhatsApp</span>
                  </a>
                )}
              </div>

              {/* 4 KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Plano & MRR</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">{limits.plan.name}</p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {limits.finalMonthlyPrice === 0 ? 'Gratuito' : `${formatCurrency(limits.finalMonthlyPrice)}/mês`}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vencimento & Ciclo</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                    {limits.subscription?.expires_at ? formatDate(limits.subscription.expires_at) : 'Contínuo'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Ciclo: {limits.subscription?.billing_cycle || 'MONTHLY'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Equipe & Assentos</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                    {limits.usedUsers} / {limits.maxUsers} ativos
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {limits.usedAdmins} Adm • {limits.usedAttendants} Atd • {limits.usedTechs} Téc
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operação da Loja</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                    {stats.totalOrders} OS ({stats.totalItems} itens)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {stats.totalCustomers} clientes • {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
              </div>

              {/* Enabled Modules */}
              <div className="space-y-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  <span>Módulos Liberados ({enabledModules.length}/{SYSTEM_MODULES.length})</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {enabledModules.map(mod => (
                    <Badge
                      key={mod.key}
                      className="bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60 text-[10px] font-semibold"
                    >
                      {mod.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Company Users */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    <span>Usuários da Empresa ({companyUsers.length})</span>
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const targetId = xrayCompany.id;
                      setXrayCompany(null);
                      setEditingGlobalUser(null);
                      setUserFormName('');
                      setUserFormEmail('');
                      setUserFormPhone('');
                      setUserFormPassword('Mudar@123');
                      setUserFormRole('ATENDENTE');
                      setUserFormTenantId(targetId);
                      setUserFormMustChange(true);
                      setUserFormActive(true);
                      setShowUserFormModal(true);
                    }}
                    className="h-7 px-2.5 text-[11px] font-bold gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Adicionar nesta Loja</span>
                  </Button>
                </div>

                {companyUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    Nenhum usuário vinculado a esta empresa.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {companyUsers.map(u => {
                      const roleCfg = getRoleBadgeConfig(u.role);
                      return (
                        <div key={u.id} className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs bg-white dark:bg-slate-900">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white truncate">{u.full_name}</span>
                              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', roleCfg.className)}>
                                {roleCfg.label}
                              </span>
                              {u.active_session_token && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Online
                                </span>
                              )}
                              {u.is_active === false && (
                                <Badge className="bg-rose-500/15 text-rose-600 text-[10px]">Bloqueado</Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{u.email}{u.phone ? ` • ${u.phone}` : ''}</p>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setXrayCompany(null);
                                handleOpenEditGlobalUser(u);
                              }}
                              className="h-7 px-2 text-[11px]"
                              title="Editar usuário"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenResetPass(u)}
                              className="h-7 px-2 text-[11px] text-amber-600"
                              title="Redefinir senha"
                            >
                              <KeyRound className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* MODAL: CRIAR / EDITAR USUÁRIO GLOBAL                                  */}
      {/* ===================================================================== */}
      {showUserFormModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm">
                  {editingGlobalUser ? `Editar Usuário: ${editingGlobalUser.full_name}` : 'Novo Usuário Global na Plataforma'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUserFormModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGlobalUser} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Empresa / Loja Vinculada *
                </label>
                <Select
                  required
                  value={userFormTenantId}
                  onChange={e => setUserFormTenantId(e.target.value)}
                  className="text-xs font-semibold"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.trade_name} ({c.cnpj || 'Sem CNPJ'})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Nome Completo *</label>
                  <Input
                    required
                    value={userFormName}
                    onChange={e => setUserFormName(e.target.value)}
                    placeholder="Ex: Maria Oliveira"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">E-mail de Acesso *</label>
                  <Input
                    type="email"
                    required
                    value={userFormEmail}
                    onChange={e => setUserFormEmail(e.target.value)}
                    placeholder="maria@empresa.com.br"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Telefone / WhatsApp</label>
                  <Input
                    value={userFormPhone}
                    onChange={e => setUserFormPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Perfil de Permissão *</label>
                  <Select
                    value={userFormRole}
                    onChange={e => setUserFormRole(e.target.value as UserRole)}
                    className="text-xs font-semibold"
                  >
                    <option value="ADMINISTRADOR">Administrador da Loja</option>
                    <option value="ATENDENTE">Atendente / Balcão</option>
                    <option value="TECNICO">Técnico / Bancada</option>
                    <option value="SUPER_ADMIN">Super Administrador (SaaS)</option>
                  </Select>
                </div>
              </div>

              {!editingGlobalUser && (
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Senha Inicial (mínimo 8 caracteres) *
                  </label>
                  <Input
                    type="password"
                    required
                    minLength={8}
                    value={userFormPassword}
                    onChange={e => setUserFormPassword(e.target.value)}
                    placeholder="Mudar@123"
                    className="text-xs"
                  />
                </div>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={userFormMustChange}
                    onChange={e => setUserFormMustChange(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Obrigar troca de senha no próximo login</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={userFormActive}
                    onChange={e => setUserFormActive(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Conta ativa (permite autenticação no sistema)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowUserFormModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                  {editingGlobalUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
