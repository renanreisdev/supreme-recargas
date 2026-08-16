'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Users, Crown, Shield, PlusCircle, CheckCircle2, Sliders, Edit, KeyRound, Check, X, ShieldAlert, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore, MOCK_PLANS, SEGMENT_PRESETS } from '@/lib/store';
import { formatCurrency, getRoleBadgeConfig } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Profile, UserRole, CompanySettings, BusinessSegment, SegmentCustomization } from '@/types';
import { Smartphone, Wrench, Printer, Layers } from 'lucide-react';

interface PermissionOption {
  key: string;
  label: string;
  description: string;
  category: 'Balcão' | 'Oficina' | 'Gestão';
}

const AVAILABLE_PERMISSIONS: PermissionOption[] = [
  { key: 'create_entry', label: 'Criar Nova Entrada no Balcão', description: 'Permite receber novos cartuchos e emitir comandas', category: 'Balcão' },
  { key: 'view_entries', label: 'Entradas & Entregas (Listar Comandas)', description: 'Permite acessar a lista geral de comandas e conferência', category: 'Balcão' },
  { key: 'register_delivery', label: 'Registrar Baixa Financeira & Entrega', description: 'Permite receber pagamentos e concluir entregas de cartuchos', category: 'Balcão' },
  { key: 'close_uncompleted_entry', label: 'Encerrar Comanda sem Conclusão Técnica (Desistência)', description: 'Permite dar baixa ou finalizar comandas mesmo com cartuchos não finalizados na bancada técnica (desistência ou devolução)', category: 'Balcão' },
  { key: 'apply_discount_on_delivery', label: 'Conceder Desconto na Baixa / Pagamento', description: 'Permite receber valor menor do que o total da comanda e aplicar a diferença como desconto financeiro', category: 'Balcão' },
  { key: 'print_ticket', label: 'Impressão de Comandas Térmicas', description: 'Permite imprimir comandas e etiquetas térmicas em 58mm/80mm', category: 'Balcão' },
  { key: 'view_customers', label: 'Ver Clientes', description: 'Permite visualizar o catálogo de clientes e telefones', category: 'Balcão' },
  { key: 'create_customer', label: 'Cadastrar Novos Clientes', description: 'Permite cadastrar novos clientes no balcão e na recepção', category: 'Balcão' },
  { key: 'edit_customer', label: 'Editar Clientes Existentes', description: 'Permite alterar nome, telefone, documento e dados cadastrais de clientes', category: 'Balcão' },
  { key: 'technical_workbench', label: 'Bancada Técnica (Oficina)', description: 'Permite acessar a fila de cartuchos e realizar diagnósticos', category: 'Oficina' },
  { key: 'update_tech_status', label: 'Salvar Testes Técnicos & Pesagem', description: 'Permite registrar peso injetado e aprovar/condenar cartuchos', category: 'Oficina' },
  { key: 'reopen_entry', label: 'Reabrir Comandas Finalizadas/Entregues', description: 'Permite reverter o status de comandas entregues ou pagas para novo processamento', category: 'Gestão' },
  { key: 'delete_entry', label: 'Excluir Comandas', description: 'Permite excluir permanentemente comandas e seus cartuchos do sistema', category: 'Gestão' },
  { key: 'manage_models', label: 'Gerenciar Catálogo & Preços', description: 'Permite cadastrar modelos e alterar preços padrão', category: 'Gestão' },
  { key: 'view_financial_reports', label: 'Relatórios Financeiros', description: 'Permite visualizar faturamento e formas de pagamento', category: 'Gestão' },
  { key: 'view_audit_logs', label: 'Auditoria de Ações', description: 'Permite consultar o registro histórico de operações de todos os usuários', category: 'Gestão' },
  { key: 'manage_company', label: 'Gerenciar Empresa & Permissões', description: 'Permite alterar dados da empresa e permissões dos usuários', category: 'Gestão' },
];

export default function CompanySettingsPage() {
  const { currentCompany, currentUser, hasPermission, refreshUser } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});

  // Add User Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState<UserRole>('ATENDENTE');

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
    const data = AppStore.getUsers(currentCompany.id);
    const sets = AppStore.getSettings(currentCompany.id);
    const seg = AppStore.getSegmentConfig(currentCompany.id);
    setUsers(data);
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
    const updated = AppStore.setCompanySegment(currentCompany.id, newSegment, undefined, currentUser?.full_name || 'Administrador');
    setSettings(updated);
    setSegmentConfig(AppStore.getSegmentConfig(currentCompany.id));
    setCustomChecklist(updated.custom_checklist_items || []);
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

  const countAdmins = limits.usedAdmins;
  const countAttendants = limits.usedAttendants;
  const countTechs = limits.usedTechs;

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    try {
      AppStore.addUser({
        tenant_id: currentCompany.id,
        full_name: fullName,
        email,
        phone,
        password: password || '123456',
        role,
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

  const handleOpenPermissions = (u: Profile) => {
    setEditingUser(u);
    // Initialize permissions: read custom permissions if set, or default to role-based
    const initialPerms: Record<string, boolean> = {};
    AVAILABLE_PERMISSIONS.forEach(p => {
      if (u.custom_permissions && typeof u.custom_permissions[p.key] === 'boolean') {
        initialPerms[p.key] = u.custom_permissions[p.key];
      } else {
        if (u.role === 'ADMINISTRADOR' || u.role === 'SUPER_ADMIN') {
          initialPerms[p.key] = true;
        } else if (u.role === 'ATENDENTE') {
          initialPerms[p.key] = ['create_entry', 'view_entries', 'register_delivery', 'print_ticket', 'view_customers'].includes(p.key);
        } else if (u.role === 'TECNICO') {
          initialPerms[p.key] = ['technical_workbench', 'update_tech_status'].includes(p.key);
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>Gestão de Equipe & Controle Granular de Permissões</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento de usuários da empresa <strong className="text-slate-800 dark:text-slate-200">{currentCompany.trade_name}</strong> e controle de acessos
          </p>
        </div>

        <Badge className="bg-emerald-600 text-white font-bold px-3 py-1.5 text-xs">
          Assinatura Ativa: {currentPlan.name}
        </Badge>
      </div>

      {/* Plan Limits Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
            <span>Administradores</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{countAdmins} / {currentPlan.max_administrators}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full" style={{ width: `${(countAdmins / currentPlan.max_administrators) * 100}%` }} />
          </div>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
            <span>Atendentes (Balcão)</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{countAttendants} / {currentPlan.max_attendants}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full" style={{ width: `${(countAttendants / currentPlan.max_attendants) * 100}%` }} />
          </div>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
            <span>Técnicos (Bancada)</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{countTechs} / {currentPlan.max_technicians}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-600 h-full" style={{ width: `${(countTechs / currentPlan.max_technicians) * 100}%` }} />
          </div>
        </Card>
      </div>

      {/* Business Segment Selector & Operational Workflow Preset (Admin Only) */}
      {hasPermission('manage_company') && (
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Ramo de Atuação & Customização de Segmento</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Selecione o segmento do seu negócio para adaptar as nomenclaturas, regras de bancada e checklists
                </CardDescription>
              </div>

              <Badge className="bg-emerald-600 text-white font-bold text-xs shrink-0 self-start sm:self-auto">
                Segmento Ativo: {segmentConfig.segmentName}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-6">
            {segmentSaveSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Segmento do negócio atualizado com sucesso! Toda a interface foi reconfigurada.</span>
              </div>
            )}

            {/* 4 Segment Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {Object.values(SEGMENT_PRESETS).map((seg) => {
                const isCurrent = segmentConfig.segment === seg.segment;
                return (
                  <div
                    key={seg.segment}
                    onClick={() => handleSegmentSwitch(seg.segment)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isCurrent
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isCurrent ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {seg.segment === 'RECARGA_CARTUCHOS' && <Printer className="w-4 h-4" />}
                          {seg.segment === 'ASSISTENCIA_CELULARES_INFORMATICA' && <Smartphone className="w-4 h-4" />}
                          {seg.segment === 'FERRAMENTAS_MOTORES' && <Wrench className="w-4 h-4" />}
                          {seg.segment === 'OFICINA_GERAL' && <Layers className="w-4 h-4" />}
                        </div>

                        {isCurrent ? (
                          <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Ativo</Badge>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-slate-500 hover:text-emerald-600">
                            Selecionar
                          </Button>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{seg.segmentName}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          Item: <strong>{seg.itemLabelSingular}</strong> | ID: <strong>{seg.identifierLabel}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
                      <span>{seg.hasWeightInspection ? '⚖️ Com Balança' : '📋 Com Checklist'}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{seg.defaultCategories.length} categorias</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checklist Customizer if Active Segment has Checklist */}
            {segmentConfig.hasChecklist && (
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Checklist de Recepção & Inspeção de Entrada</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Itens verificados pelo atendente no momento em que o cliente entrega o {segmentConfig.itemLabelSingular.toLowerCase()}
                    </p>
                  </div>
                </div>

                {/* Add new checklist item input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: Cabo de força, Risco na tampa traseira, etc."
                    value={newChecklistInput}
                    onChange={(e) => setNewChecklistInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistItem(); } }}
                    className="text-xs h-9 bg-white dark:bg-slate-900"
                  />
                  <Button
                    type="button"
                    onClick={handleAddChecklistItem}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-3 gap-1 shrink-0"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </Button>
                </div>

                {/* Checklist Badges List */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {customChecklist.map((item, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 shadow-2xs"
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
                  {customChecklist.length === 0 && (
                    <span className="text-xs text-slate-400 italic">Nenhum item no checklist. Adicione itens acima.</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Policies & Operational Rules (Admin Only) */}
      {hasPermission('manage_company') && (
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>Políticas de Validação & Regras Operacionais</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Defina os campos de preenchimento obrigatório para a equipe de balcão e recepção
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSavePolicies} className="space-y-4">
              {policySaveSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-semibold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Políticas e regras de validação da empresa atualizadas com sucesso!</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. CPF / CNPJ Required Policy */}
                <div className={`p-4 rounded-xl border transition-all ${
                  requireCustomerDocument 
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' 
                    : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800'
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

                {/* 2. Cartridge Serial Required Policy */}
                <div className={`p-4 rounded-xl border transition-all ${
                  requireCartridgeSerial 
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' 
                    : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800'
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
                          Exigir Final de Série / Serial do Cartucho
                        </span>
                        <Badge className={requireCartridgeSerial ? 'bg-emerald-600 text-white text-[10px]' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px]'}>
                          {requireCartridgeSerial ? 'Obrigatório' : 'Opcional (S/N)'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {requireCartridgeSerial 
                          ? 'Cada cartucho recebido na comanda exige o preenchimento do final de série para identificação física.' 
                          : 'O final de série é opcional no balcão. Se deixado em branco, o sistema atribui "S/N" automaticamente.'}
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white gap-1.5 shadow-sm">
                  <Check className="w-4 h-4" />
                  <span>Salvar Regras de Validação</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users List & Add Button */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">Usuários & Permissões ({users.length})</CardTitle>
            <CardDescription className="text-xs">Clique em &quot;Permissões&quot; para habilitar/desabilitar funções específicas</CardDescription>
          </div>
          <Button onClick={() => setShowAddModal(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-1.5 font-semibold">
            <PlusCircle className="w-4 h-4" />
            <span>Adicionar Usuário</span>
          </Button>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                <tr>
                  <th className="p-3 rounded-l-lg">Nome</th>
                  <th className="p-3">E-mail</th>
                  <th className="p-3">Papel Principal</th>
                  <th className="p-3">Permissões Customizadas</th>
                  <th className="p-3 rounded-r-lg text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => {
                  const roleConfig = getRoleBadgeConfig(u.role);
                  const hasCustom = u.custom_permissions && Object.keys(u.custom_permissions).length > 0;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                        {u.full_name}
                        {u.id === currentUser.id && (
                          <span className="ml-2 text-[10px] text-emerald-600 font-mono font-bold">(Você)</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500">{u.email}</td>
                      <td className="p-3">
                        <Badge className={roleConfig.className}>{roleConfig.label}</Badge>
                      </td>
                      <td className="p-3">
                        {hasCustom ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                            <Sliders className="w-3 h-3" />
                            Personalizadas
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Padrão do Papel</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <Button
                          onClick={() => {
                            setUserToResetPass(u);
                            setAdminNewPass('');
                          }}
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 gap-1 font-medium hover:border-amber-500 hover:text-amber-600"
                          title="Redefinir Senha deste Usuário"
                        >
                          <Lock className="w-3 h-3 text-amber-500" />
                          <span>Senha</span>
                        </Button>

                        <Button
                          onClick={() => handleOpenPermissions(u)}
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 gap-1 font-medium hover:border-emerald-500 hover:text-emerald-600"
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
        </CardContent>
      </Card>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-4 sm:p-5 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Cadastrar Novo Usuário</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowAddModal(false)} className="h-8 w-8 p-0 text-slate-400">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Nome Completo *</label>
                <Input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ex: Roberto Técnico" className="text-xs" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">E-mail Corporativo *</label>
                  <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@supreme.com.br" className="text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Senha Inicial *</label>
                  <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 4 dígitos" className="text-xs" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Telefone / WhatsApp</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="text-xs" />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Papel de Acesso *</label>
                <Select value={role} onChange={e => setRole(e.target.value as UserRole)} className="text-xs">
                  <option value="ATENDENTE">Atendente (Balcão de Atendimento)</option>
                  <option value="TECNICO">Técnico (Oficina / Bancada)</option>
                  <option value="ADMINISTRADOR">Administrador (Acesso Total)</option>
                </Select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs">
                  Cadastrar Usuário
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal (Admin) */}
      {userToResetPass && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-4 sm:p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Redefinir Senha</span>
            </h3>
            <p className="text-xs text-slate-500">
              Defina uma nova senha para <strong>{userToResetPass.full_name}</strong> ({userToResetPass.email}).
            </p>

            {resetSuccess ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs text-center font-bold">
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
                    className="text-xs" 
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button type="button" variant="outline" size="sm" onClick={() => setUserToResetPass(null)} className="text-xs">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs">
                    Salvar Senha
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Permissions Matrix Modal */}
      {showPermissionsModal && editingUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Permissões: {editingUser.full_name}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Papel base: <strong className="text-slate-800 dark:text-slate-200">{editingUser.role}</strong> ({editingUser.email})
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowPermissionsModal(false)} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Marque ou desmarque os recursos aos quais este usuário terá permissão de acesso e edição:
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
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
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
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
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
                  // Reset to default
                  const resetPerms: Record<string, boolean> = {};
                  AVAILABLE_PERMISSIONS.forEach(p => {
                    if (editingUser.role === 'ADMINISTRADOR') resetPerms[p.key] = true;
                    else if (editingUser.role === 'ATENDENTE') resetPerms[p.key] = ['create_entry', 'view_entries', 'register_delivery', 'print_ticket', 'view_customers', 'create_customer', 'edit_customer'].includes(p.key);
                    else if (editingUser.role === 'TECNICO') resetPerms[p.key] = ['technical_workbench', 'update_tech_status'].includes(p.key);
                  });
                  setUserPermissions(resetPerms);
                }}
                className="text-xs"
              >
                Restaurar Padrão
              </Button>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPermissionsModal(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button type="button" size="sm" onClick={handleSavePermissions} className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Salvar</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

