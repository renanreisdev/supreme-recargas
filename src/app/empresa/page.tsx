'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Crown, 
  Shield, 
  PlusCircle, 
  CheckCircle2, 
  Sliders, 
  Edit, 
  KeyRound, 
  Check, 
  X, 
  ShieldAlert, 
  Lock,
  Smartphone, 
  Wrench, 
  Printer, 
  Layers,
  Trash2,
  Settings,
  Sparkles,
  Info,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore, MOCK_PLANS, SEGMENT_PRESETS, DEFAULT_PERMISSION_GROUPS, BUSINESS_PRESETS } from '@/lib/store';
import { formatCurrency, getRoleBadgeConfig } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Profile, UserRole, CompanySettings, BusinessSegment, SegmentCustomization, PermissionGroup } from '@/types';

interface PermissionOption {
  key: string;
  label: string;
  description: string;
  category: 'Balcão' | 'Oficina' | 'Gestão';
}

const AVAILABLE_PERMISSIONS: PermissionOption[] = [
  { key: 'create_entry', label: 'Criar Nova Entrada no Balcão', description: 'Permite receber novos itens/cartuchos e emitir comandas', category: 'Balcão' },
  { key: 'view_entries', label: 'Entradas & Entregas (Listar Comandas)', description: 'Permite acessar a lista geral de comandas e conferência', category: 'Balcão' },
  { key: 'register_delivery', label: 'Registrar Baixa Financeira & Entrega', description: 'Permite receber pagamentos e concluir entregas de itens', category: 'Balcão' },
  { key: 'close_uncompleted_entry', label: 'Encerrar Comanda sem Conclusão Técnica (Desistência)', description: 'Permite dar baixa ou finalizar comandas mesmo com itens não finalizados na bancada técnica (desistência ou devolução)', category: 'Balcão' },
  { key: 'apply_discount_on_delivery', label: 'Conceder Desconto na Baixa / Pagamento', description: 'Permite receber valor menor do que o total da comanda e aplicar a diferença como desconto financeiro', category: 'Balcão' },
  { key: 'print_ticket', label: 'Impressão de Comandas Térmicas', description: 'Permite imprimir comandas e etiquetas térmicas em 58mm/80mm', category: 'Balcão' },
  { key: 'view_customers', label: 'Ver Clientes', description: 'Permite visualizar o catálogo de clientes e telefones', category: 'Balcão' },
  { key: 'create_customer', label: 'Cadastrar Novos Clientes', description: 'Permite cadastrar novos clientes no balcão e na recepção', category: 'Balcão' },
  { key: 'edit_customer', label: 'Editar Clientes Existentes', description: 'Permite alterar nome, telefone, documento e dados cadastrais de clientes', category: 'Balcão' },
  { key: 'technical_workbench', label: 'Bancada Técnica (Oficina)', description: 'Permite acessar a fila de itens e realizar diagnósticos', category: 'Oficina' },
  { key: 'update_tech_status', label: 'Salvar Testes Técnicos & Pesagem', description: 'Permite registrar peso injetado e aprovar/condenar itens', category: 'Oficina' },
  { key: 'customize_kanban', label: 'Personalizar Colunas do Kanban', description: 'Permite editar nomes, cores e etapas das colunas da bancada', category: 'Oficina' },
  { key: 'reopen_entry', label: 'Reabrir Comandas Finalizadas/Entregues', description: 'Permite reverter o status de comandas entregues ou pagas para novo processamento', category: 'Gestão' },
  { key: 'delete_entry', label: 'Excluir Comandas', description: 'Permite excluir permanentemente comandas e seus itens do sistema', category: 'Gestão' },
  { key: 'manage_models', label: 'Gerenciar Catálogo & Preços', description: 'Permite cadastrar modelos e alterar preços padrão', category: 'Gestão' },
  { key: 'manage_services', label: 'Gerenciar Serviços & Procedimentos', description: 'Permite criar, editar e precificar serviços solicitados da oficina', category: 'Gestão' },
  { key: 'view_financial_reports', label: 'Relatórios Financeiros', description: 'Permite visualizar faturamento e formas de pagamento', category: 'Gestão' },
  { key: 'view_audit_logs', label: 'Auditoria de Ações', description: 'Permite consultar o registro histórico de operações de todos os usuários', category: 'Gestão' },
  { key: 'manage_company', label: 'Gerenciar Empresa & Permissões', description: 'Permite alterar dados da empresa e permissões dos usuários', category: 'Gestão' },
];

export default function CompanySettingsPage() {
  const { currentCompany, currentUser, hasPermission, refreshUser } = useAuth();
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'equipe' | 'grupos' | 'segmento' | 'regras'>('equipe');

  const [users, setUsers] = useState<Profile[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});

  // Group Modal State
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PermissionGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupDefaultRole, setGroupDefaultRole] = useState<UserRole>('ATENDENTE');
  const [groupPermissions, setGroupPermissions] = useState<Record<string, boolean>>({});

  // Add User Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('123456');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('default-attendant-group');

  // Company Settings & Validation Policies State
  const [settings, setSettings] = useState<CompanySettings>(AppStore.getSettings(currentCompany.id));
  const [segmentConfig, setSegmentConfig] = useState<SegmentCustomization>(AppStore.getSegmentConfig(currentCompany.id));
  const [requireCustomerDocument, setRequireCustomerDocument] = useState<boolean>(settings.require_customer_document ?? false);
  const [requireCartridgeSerial, setRequireCartridgeSerial] = useState<boolean>(settings.require_cartridge_serial ?? true);
  const [customChecklist, setCustomChecklist] = useState<string[]>(settings.custom_checklist_items || segmentConfig.defaultChecklistItems || []);
  const [newChecklistInput, setNewChecklistInput] = useState('');
  const [policySaveSuccess, setPolicySaveSuccess] = useState(false);
  const [segmentSaveSuccess, setSegmentSaveSuccess] = useState(false);

  // Reset Password Modal State
  const [userToResetPass, setUserToResetPass] = useState<Profile | null>(null);
  const [adminNewPass, setAdminNewPass] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const limits = AppStore.getEffectiveLimits(currentCompany.id);
  const currentPlan = limits.plan;

  const loadData = () => {
    const dataUsers = AppStore.getUsers(currentCompany.id);
    const dataGroups = AppStore.getPermissionGroups(currentCompany.id);
    const sets = AppStore.getSettings(currentCompany.id);
    const seg = AppStore.getSegmentConfig(currentCompany.id);
    setUsers(dataUsers);
    setPermissionGroups(dataGroups);
    setSettings(sets);
    setSegmentConfig(seg);
    setRequireCustomerDocument(sets.require_customer_document ?? false);
    setRequireCartridgeSerial(sets.require_cartridge_serial ?? true);
    setCustomChecklist(sets.custom_checklist_items || seg.defaultChecklistItems || []);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, [currentCompany.id]);

  const handleSegmentSwitch = (newSegment: BusinessSegment) => {
    AppStore.setCompanySegment(currentCompany.id, newSegment, currentUser?.full_name || 'Administrador');
    setSegmentConfig(AppStore.getSegmentConfig(currentCompany.id));
    setSegmentSaveSuccess(true);
    setTimeout(() => setSegmentSaveSuccess(false), 3500);
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistInput.trim()) return;
    const updatedList = [...customChecklist, newChecklistInput.trim()];
    setCustomChecklist(updatedList);
    setNewChecklistInput('');
    AppStore.updateSettings(currentCompany.id, { custom_checklist_items: updatedList }, currentUser?.full_name);
  };

  const handleRemoveChecklistItem = (idx: number) => {
    const updatedList = customChecklist.filter((_, i) => i !== idx);
    setCustomChecklist(updatedList);
    AppStore.updateSettings(currentCompany.id, { custom_checklist_items: updatedList }, currentUser?.full_name);
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = AppStore.updateSettings(currentCompany.id, {
      require_customer_document: requireCustomerDocument,
      require_cartridge_serial: requireCartridgeSerial,
      custom_checklist_items: customChecklist
    }, currentUser?.full_name || 'Administrador');
    setSettings(updated);
    setPolicySaveSuccess(true);
    setTimeout(() => setPolicySaveSuccess(false), 3500);
  };

  if (!currentUser) return null;

  // Add User Handler with Group Association
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    const group = permissionGroups.find(g => g.id === selectedGroupId) || permissionGroups[0];
    const userRole: UserRole = group?.default_role || 'ATENDENTE';

    try {
      AppStore.addUser({
        tenant_id: currentCompany.id,
        full_name: fullName,
        email,
        phone,
        password: password || '123456',
        role: userRole,
        group_id: group?.id,
        group_name: group?.name,
        is_active: true
      }, currentUser.full_name);

      loadData();
      setShowAddModal(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('123456');
    } catch (err: any) {
      alert(err?.message || 'Erro ao cadastrar usuário.');
    }
  };

  // Group Create/Edit Handler
  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupName('');
    setGroupDescription('');
    setGroupDefaultRole('ATENDENTE');
    
    // Default checked permissions for attendant
    const initialPerms: Record<string, boolean> = {
      create_entry: true,
      view_entries: true,
      register_delivery: true,
      print_ticket: true,
      view_customers: true,
      create_customer: true,
      edit_customer: true
    };
    setGroupPermissions(initialPerms);
    setShowGroupModal(true);
  };

  const handleOpenEditGroup = (group: PermissionGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || '');
    setGroupDefaultRole(group.default_role);
    setGroupPermissions({ ...(group.permissions || {}) });
    setShowGroupModal(true);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      if (editingGroup) {
        AppStore.updatePermissionGroup(editingGroup.id, {
          name: groupName.trim(),
          description: groupDescription.trim(),
          default_role: groupDefaultRole,
          permissions: groupPermissions
        }, currentUser.full_name);
      } else {
        AppStore.addPermissionGroup({
          tenant_id: currentCompany.id,
          name: groupName.trim(),
          description: groupDescription.trim(),
          default_role: groupDefaultRole,
          permissions: groupPermissions
        }, currentUser.full_name);
      }

      loadData();
      setShowGroupModal(false);
    } catch (err: any) {
      alert(err?.message || 'Erro ao salvar grupo.');
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!confirm('Tem certeza que deseja excluir este grupo de permissões?')) return;
    try {
      AppStore.deletePermissionGroup(groupId, currentUser.full_name);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Erro ao excluir grupo.');
    }
  };

  const toggleGroupPermission = (key: string) => {
    setGroupPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectAllGroupPermissions = (grant: boolean) => {
    const updated: Record<string, boolean> = {};
    AVAILABLE_PERMISSIONS.forEach(p => {
      updated[p.key] = grant;
    });
    setGroupPermissions(updated);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToResetPass || !adminNewPass) return;

    AppStore.changeUserPassword(userToResetPass.id, adminNewPass, currentUser.full_name);
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
      setUserToResetPass(null);
      setAdminNewPass('');
      loadData();
    }, 1500);
  };

  // Open Individual Permissions Modal
  const handleOpenPermissions = (u: Profile) => {
    setEditingUser(u);
    
    // Find associated group permissions
    const userGroup = permissionGroups.find(g => g.id === u.group_id);
    const groupPerms = userGroup?.permissions || {};

    const initialPerms: Record<string, boolean> = {};
    AVAILABLE_PERMISSIONS.forEach(p => {
      if (u.custom_permissions && typeof u.custom_permissions[p.key] === 'boolean') {
        initialPerms[p.key] = u.custom_permissions[p.key];
      } else if (typeof groupPerms[p.key] === 'boolean') {
        initialPerms[p.key] = groupPerms[p.key];
      } else {
        if (u.role === 'ADMINISTRADOR' || u.role === 'SUPER_ADMIN') {
          initialPerms[p.key] = true;
        } else if (u.role === 'ATENDENTE') {
          initialPerms[p.key] = ['create_entry', 'view_entries', 'register_delivery', 'print_ticket', 'view_customers', 'create_customer', 'edit_customer'].includes(p.key);
        } else if (u.role === 'TECNICO') {
          initialPerms[p.key] = ['technical_workbench', 'register_weight', 'register_diagnosis', 'update_tech_status'].includes(p.key);
        }
      }
    });

    setUserPermissions(initialPerms);
    setShowPermissionsModal(true);
  };

  const handleSavePermissions = () => {
    if (!editingUser) return;
    AppStore.updateUserPermissions(editingUser.id, userPermissions, currentUser.full_name);
    loadData();
    refreshUser();
    setShowPermissionsModal(false);
    setEditingUser(null);
  };

  const togglePermission = (key: string) => {
    setUserPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getGroupNameForUser = (u: Profile) => {
    if (u.group_id) {
      const g = permissionGroups.find(x => x.id === u.group_id);
      if (g) return g.name;
    }
    if (u.group_name) return u.group_name;
    if (u.role === 'ADMINISTRADOR') return 'Administrador';
    if (u.role === 'TECNICO') return 'Técnico';
    return 'Atendente';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner & Plan Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0e1626] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              Gestão de Equipe & Controle de Acesso
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Empresa: <strong className="text-slate-800 dark:text-slate-200">{currentCompany.trade_name}</strong> • Controle unificado de usuários, grupos e permissões
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold px-3 py-1.5 text-xs rounded-xl shadow-xs">
            Plano: {currentPlan.name}
          </Badge>
        </div>
      </div>

      {/* Unified User Capacity Summary Card */}
      <div className="bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Capacidade Total de Usuários
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Contagem total única por empresa (sem distinção de limite por função)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {limits.usedUsers} / {limits.maxUsers} usuários ativos
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
              limits.availableUsers > 0 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300'
            }`}>
              {limits.availableUsers > 0 ? `${limits.availableUsers} vaga(s) disponível(is)` : 'Limite atingido'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 rounded-full ${
              (limits.usedUsers / limits.maxUsers) >= 1 ? 'bg-amber-500' : 'bg-emerald-600'
            }`} 
            style={{ width: `${Math.min(100, (limits.usedUsers / limits.maxUsers) * 100)}%` }} 
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Usuário adicional padrão: <strong>{formatCurrency(limits.extraUserPrice || 15)}/mês</strong></span>
          <span>Admins: <strong>{limits.usedAdmins}</strong> • Atendentes: <strong>{limits.usedAttendants}</strong> • Técnicos: <strong>{limits.usedTechs}</strong></span>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('equipe')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'equipe'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários & Equipe ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('grupos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'grupos'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Grupos de Permissões ({permissionGroups.length})</span>
        </button>

        {hasPermission('manage_company') && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('segmento')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'segmento'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Ramo & Checklist</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('regras')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'regras'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Políticas & Validação</span>
            </button>
          </>
        )}
      </div>

      {/* TAB 1: USUÁRIOS & EQUIPE */}
      {activeTab === 'equipe' && (
        <div className="bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Colaboradores Cadastrados ({users.length})
              </h3>
              <p className="text-xs text-slate-500">
                Atribua grupos de permissão pré-definidos ou ajuste permissões individualmente
              </p>
            </div>
            <Button 
              onClick={() => setShowAddModal(true)} 
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-bold rounded-xl h-9 shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Adicionar Usuário</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3 rounded-l-xl">Nome do Colaborador</th>
                  <th className="p-3">E-mail</th>
                  <th className="p-3">Telefone</th>
                  <th className="p-3">Grupo / Papel</th>
                  <th className="p-3">Ajuste Individual</th>
                  <th className="p-3 rounded-r-xl text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {users.map(u => {
                  const roleConfig = getRoleBadgeConfig(u.role);
                  const groupName = getGroupNameForUser(u);
                  const hasCustom = u.custom_permissions && Object.keys(u.custom_permissions).length > 0;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                        {u.full_name}
                        {u.id === currentUser.id && (
                          <span className="ml-2 text-[10px] text-emerald-600 font-mono font-bold">(Você)</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 font-medium">{u.email}</td>
                      <td className="p-3 text-slate-500 font-mono">{u.phone || '—'}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          <span>{groupName}</span>
                        </span>
                      </td>
                      <td className="p-3">
                        {hasCustom ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800">
                            <Sliders className="w-3 h-3" />
                            Personalizado
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Padrão do Grupo</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        <Button
                          onClick={() => {
                            setUserToResetPass(u);
                            setAdminNewPass('');
                          }}
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 gap-1 font-medium rounded-xl border-slate-200 dark:border-slate-700 hover:border-amber-400"
                          title="Redefinir Senha deste Usuário"
                        >
                          <Lock className="w-3 h-3 text-amber-500" />
                          <span>Senha</span>
                        </Button>

                        <Button
                          onClick={() => handleOpenPermissions(u)}
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 gap-1 font-medium rounded-xl border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200"
                        >
                          <KeyRound className="w-3 h-3 text-emerald-600" />
                          <span>Permissões</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GRUPOS DE PERMISSÕES */}
      {activeTab === 'grupos' && (
        <div className="bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Grupos & Perfis de Permissões Pré-definidas
              </h3>
              <p className="text-xs text-slate-500">
                Crie grupos personalizados ou utilize os grupos padrões (Administrador, Atendente, Técnico)
              </p>
            </div>
            {hasPermission('manage_company') && (
              <Button 
                onClick={handleOpenCreateGroup} 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-bold rounded-xl h-9 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Novo Grupo de Permissões</span>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {permissionGroups.map(group => {
              const enabledPermsCount = Object.values(group.permissions || {}).filter(Boolean).length;
              const usersInGroup = users.filter(u => u.group_id === group.id || (!u.group_id && (
                (group.id === 'default-admin-group' && u.role === 'ADMINISTRADOR') ||
                (group.id === 'default-tech-group' && u.role === 'TECNICO') ||
                (group.id === 'default-attendant-group' && u.role === 'ATENDENTE')
              ))).length;

              return (
                <div 
                  key={group.id} 
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>{group.name}</span>
                      </span>

                      {group.is_system_default ? (
                        <Badge className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-bold">
                          Padrão do Sistema
                        </Badge>
                      ) : (
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[9px] font-bold">
                          Customizado
                        </Badge>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed min-h-[32px]">
                      {group.description || 'Sem descrição cadastrada.'}
                    </p>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span><strong>{enabledPermsCount}</strong> de {AVAILABLE_PERMISSIONS.length} permissões</span>
                      <span><strong>{usersInGroup}</strong> usuário(s)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                    <Button 
                      onClick={() => handleOpenEditGroup(group)} 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-7 gap-1 rounded-lg border-slate-200 dark:border-slate-700"
                    >
                      <Edit className="w-3 h-3" />
                      <span>{group.is_system_default ? 'Ver / Clonar' : 'Editar'}</span>
                    </Button>

                    {!group.is_system_default && (
                      <Button 
                        onClick={() => handleDeleteGroup(group.id)} 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7 gap-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border-rose-200 dark:border-rose-900/40"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Excluir</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: RAMO DE ATUAÇÃO & CHECKLIST */}
      {activeTab === 'segmento' && hasPermission('manage_company') && (
        <div className="bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Ramo de Atuação & Customização de Segmento</span>
              </h3>
              <p className="text-xs text-slate-500">
                Selecione o segmento do seu negócio para adaptar as nomenclaturas, regras de bancada e checklists
              </p>
            </div>

            <Badge className="bg-emerald-600 text-white font-bold text-xs">
              Segmento Ativo: {segmentConfig.segmentName}
            </Badge>
          </div>

          {segmentSaveSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Segmento do negócio atualizado com sucesso! Toda a interface foi reconfigurada.</span>
            </div>
          )}

          {/* 5 Segment Presets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {Object.values(BUSINESS_PRESETS).map((seg) => {
              const isCurrent = (currentCompany.active_template_keys || []).includes(seg.key);
              return (
                <div
                  key={seg.key}
                  onClick={() => handleSegmentSwitch(seg.key as any)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isCurrent
                      ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isCurrent ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {seg.icon === 'Printer' && <Printer className="w-4 h-4" />}
                        {seg.icon === 'Smartphone' && <Smartphone className="w-4 h-4" />}
                        {seg.icon === 'Wrench' && <Wrench className="w-4 h-4" />}
                        {seg.icon === 'Layers' && <Layers className="w-4 h-4" />}
                        {!['Printer', 'Smartphone', 'Wrench', 'Layers'].includes(seg.icon || '') && <Layers className="w-4 h-4" />}
                      </div>

                      {isCurrent ? (
                        <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Ativo</Badge>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-slate-500 hover:text-emerald-600">
                          Habilitar
                        </Button>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{seg.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {seg.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>{seg.fieldDefinitions && seg.fieldDefinitions.length > 0 ? '⚖️ Campos Especiais' : '📋 Padrão'}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{seg.categories.length} categorias</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checklist Customizer */}
          {segmentConfig.hasChecklist && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Checklist de Recepção & Inspeção de Entrada</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Itens verificados pelo atendente no momento em que o cliente entrega o {segmentConfig.itemLabelSingular.toLowerCase()}
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Cabo de força, Risco na carcaça, etc."
                  value={newChecklistInput}
                  onChange={(e) => setNewChecklistInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistItem(); } }}
                  className="text-xs h-9 bg-white dark:bg-slate-900 rounded-xl"
                />
                <Button
                  type="button"
                  onClick={handleAddChecklistItem}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-3 gap-1 shrink-0 rounded-xl"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {customChecklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(idx)}
                      className="text-slate-400 hover:text-rose-500 transition-colors ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REGRAS & POLÍTICAS DE VALIDAÇÃO */}
      {activeTab === 'regras' && hasPermission('manage_company') && (
        <div className="bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Políticas de Validação & Regras Operacionais</span>
            </h3>
            <p className="text-xs text-slate-500">
              Defina os campos de preenchimento obrigatório para a equipe de balcão e recepção
            </p>
          </div>

          <form onSubmit={handleSavePolicies} className="space-y-4">
            {policySaveSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Políticas e regras de validação da empresa atualizadas com sucesso!</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CPF / CNPJ Required Policy */}
              <div className={`p-4 rounded-2xl border transition-all ${
                requireCustomerDocument 
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' 
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="require_doc_toggle"
                    checked={requireCustomerDocument}
                    onChange={(e) => setRequireCustomerDocument(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="require_doc_toggle" className="cursor-pointer space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        Exigir CPF / CNPJ no Cadastro de Clientes
                      </span>
                      <Badge className={requireCustomerDocument ? 'bg-emerald-600 text-white text-[10px]' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px]'}>
                        {requireCustomerDocument ? 'Obrigatório' : 'Opcional'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {requireCustomerDocument 
                        ? 'Os atendentes serão obrigados a preencher o CPF ou CNPJ para cadastrar ou editar qualquer cliente.' 
                        : 'O CPF ou CNPJ é opcional. Os atendentes podem cadastrar clientes informando apenas Nome e Telefone.'}
                    </p>
                  </label>
                </div>
              </div>

              {/* Cartridge Serial Required Policy */}
              <div className={`p-4 rounded-2xl border transition-all ${
                requireCartridgeSerial 
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' 
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="require_serial_toggle"
                    checked={requireCartridgeSerial}
                    onChange={(e) => setRequireCartridgeSerial(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="require_serial_toggle" className="cursor-pointer space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        Exigir Identificador / Nº de Série do Item
                      </span>
                      <Badge className={requireCartridgeSerial ? 'bg-emerald-600 text-white text-[10px]' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px]'}>
                        {requireCartridgeSerial ? 'Obrigatório' : 'Opcional (S/N)'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {requireCartridgeSerial 
                        ? 'Cada item recebido na comanda exige o preenchimento do final de série ou IMEI para identificação física.' 
                        : 'O final de série é opcional no balcão. Se deixado em branco, o sistema atribui "S/N" automaticamente.'}
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white gap-1.5 rounded-xl h-9 shadow-xs">
                <Check className="w-4 h-4" />
                <span>Salvar Regras de Validação</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADICIONAR NOVO USUÁRIO */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Cadastrar Novo Usuário</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowAddModal(false)} className="h-8 w-8 p-0 text-slate-400">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Nome Completo *</label>
                <Input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ex: Roberto Técnico" className="text-xs rounded-xl" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">E-mail Corporativo *</label>
                  <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@supreme.com.br" className="text-xs rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Senha Inicial *</label>
                  <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 4 dígitos" className="text-xs rounded-xl" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Telefone / WhatsApp</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="text-xs rounded-xl" />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Grupo de Permissões *</label>
                <Select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="text-xs rounded-xl">
                  {permissionGroups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} {g.is_system_default ? '(Padrão)' : '(Customizado)'}
                    </option>
                  ))}
                </Select>
                <p className="text-[11px] text-slate-400 mt-1">
                  O usuário herdará todas as permissões ativas deste grupo. Você também poderá ajustar permissões individuais a qualquer momento.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)} className="text-xs rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs rounded-xl text-white">
                  Cadastrar Usuário
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR GRUPO DE PERMISSÕES */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <span>{editingGroup ? `Editar Grupo: ${editingGroup.name}` : 'Criar Novo Grupo de Permissões'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Defina o nome do grupo e marque quais recursos os membros poderão acessar
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowGroupModal(false)} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Nome do Grupo *</label>
                  <Input 
                    required 
                    value={groupName} 
                    onChange={e => setGroupName(e.target.value)} 
                    placeholder="Ex: Gerente de Loja, Atendente Júnior" 
                    className="text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Papel Base Compatível *</label>
                  <Select value={groupDefaultRole} onChange={e => setGroupDefaultRole(e.target.value as UserRole)} className="text-xs rounded-xl">
                    <option value="ATENDENTE">Atendente (Balcão de Atendimento)</option>
                    <option value="TECNICO">Técnico (Oficina / Bancada)</option>
                    <option value="ADMINISTRADOR">Administrador (Gestão Geral)</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Descrição do Grupo</label>
                <Input 
                  value={groupDescription} 
                  onChange={e => setGroupDescription(e.target.value)} 
                  placeholder="Ex: Permite abrir comandas e consultar relatórios operacionais" 
                  className="text-xs rounded-xl"
                />
              </div>

              {/* Permissions Checkbox Matrix */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Matriz de Permissões do Grupo
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => handleSelectAllGroupPermissions(true)}
                      className="text-[11px] font-semibold text-emerald-600 hover:underline"
                    >
                      Marcar Todas
                    </button>
                    <span className="text-slate-300">•</span>
                    <button 
                      type="button" 
                      onClick={() => handleSelectAllGroupPermissions(false)}
                      className="text-[11px] font-semibold text-slate-400 hover:underline"
                    >
                      Desmarcar Todas
                    </button>
                  </div>
                </div>

                {['Balcão', 'Oficina', 'Gestão'].map((cat) => {
                  const catPermissions = AVAILABLE_PERMISSIONS.filter(p => p.category === cat);

                  return (
                    <div key={cat} className="space-y-2">
                      <h5 className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1">
                        {cat === 'Balcão' ? '📥 Recepção & Atendimento' : cat === 'Oficina' ? '🛠️ Oficina & Bancada Técnica' : '⚙️ Gestão, Relatórios & Empresa'}
                      </h5>

                      <div className="grid grid-cols-1 gap-2">
                        {catPermissions.map((perm) => {
                          const isChecked = !!groupPermissions[perm.key];

                          return (
                            <div
                              key={perm.key}
                              onClick={() => toggleGroupPermission(perm.key)}
                              className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                isChecked 
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800' 
                                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-75'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                              />
                              <div className="flex-1">
                                <p className={`text-xs font-bold ${isChecked ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                  {perm.label}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {perm.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowGroupModal(false)} className="text-xs rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs rounded-xl text-white gap-1">
                  <Check className="w-4 h-4" />
                  <span>Salvar Grupo</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REDEFINIR SENHA DO USUÁRIO */}
      {userToResetPass && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Redefinir Senha</span>
            </h3>
            <p className="text-xs text-slate-500">
              Defina uma nova senha para <strong>{userToResetPass.full_name}</strong> ({userToResetPass.email}).
            </p>

            {resetSuccess ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs text-center font-bold">
                Senha redefinida com sucesso!
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Nova Senha *</label>
                  <Input 
                    type="password" 
                    required 
                    value={adminNewPass} 
                    onChange={e => setAdminNewPass(e.target.value)} 
                    placeholder="Digite a nova senha" 
                    className="text-xs rounded-xl" 
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button type="button" variant="outline" size="sm" onClick={() => setUserToResetPass(null)} className="text-xs rounded-xl">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl">
                    Salvar Senha
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: AJUSTE INDIVIDUAL DE PERMISSÕES DO USUÁRIO */}
      {showPermissionsModal && editingUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Permissões: {editingUser.full_name}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Grupo base: <strong className="text-slate-800 dark:text-slate-200">{getGroupNameForUser(editingUser)}</strong> ({editingUser.email})
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowPermissionsModal(false)} className="h-8 w-8 p-0 rounded-xl">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Ajuste permissões individualmente para este colaborador. Ele manterá as permissões do grupo e essas exceções terão prioridade:
              </p>

              {['Balcão', 'Oficina', 'Gestão'].map((cat) => {
                const catPermissions = AVAILABLE_PERMISSIONS.filter(p => p.category === cat);

                return (
                  <div key={cat} className="space-y-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[11px] tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1">
                      <span>{cat === 'Balcão' ? '📥 Atendimento & Balcão' : cat === 'Oficina' ? '🛠️ Oficina Técnica' : '⚙️ Gestão & Finanças'}</span>
                    </h4>

                    <div className="grid grid-cols-1 gap-2">
                      {catPermissions.map((perm) => {
                        const isGranted = !!userPermissions[perm.key];

                        return (
                          <div
                            key={perm.key}
                            onClick={() => togglePermission(perm.key)}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              isGranted 
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800' 
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-75'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isGranted}
                              onChange={() => {}}
                              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                            />
                            <div className="flex-1">
                              <p className={`font-bold ${isGranted ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                {perm.label}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {perm.description}
                              </p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                              isGranted ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              {isGranted ? 'Permitido' : 'Bloqueado'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Restore group defaults
                  const userGroup = permissionGroups.find(g => g.id === editingUser.group_id);
                  const groupPerms = userGroup?.permissions || {};
                  const resetPerms: Record<string, boolean> = {};

                  AVAILABLE_PERMISSIONS.forEach(p => {
                    if (typeof groupPerms[p.key] === 'boolean') {
                      resetPerms[p.key] = groupPerms[p.key];
                    } else if (editingUser.role === 'ADMINISTRADOR') {
                      resetPerms[p.key] = true;
                    } else if (editingUser.role === 'ATENDENTE') {
                      resetPerms[p.key] = ['create_entry', 'view_entries', 'register_delivery', 'print_ticket', 'view_customers', 'create_customer', 'edit_customer'].includes(p.key);
                    } else if (editingUser.role === 'TECNICO') {
                      resetPerms[p.key] = ['technical_workbench', 'register_weight', 'register_diagnosis', 'update_tech_status'].includes(p.key);
                    }
                  });
                  setUserPermissions(resetPerms);
                }}
                className="text-xs rounded-xl"
              >
                Restaurar Padrão do Grupo
              </Button>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPermissionsModal(false)} className="text-xs rounded-xl">
                  Cancelar
                </Button>
                <Button type="button" size="sm" onClick={handleSavePermissions} className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs gap-1.5 rounded-xl text-white">
                  <Check className="w-4 h-4" />
                  <span>Salvar Permissões</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
