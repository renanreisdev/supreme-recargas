'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Building2, 
  Users, 
  Shield, 
  PlusCircle, 
  CheckCircle2, 
  Sliders, 
  KeyRound, 
  Check, 
  X, 
  Trash2,
  Settings,
  Printer,
  FileText,
  Lock,
  Edit,
  Tag,
  Wrench,
  QrCode,
  Scissors,
  Copy,
  ExternalLink,
  Sparkles,
  FileCheck,
  CheckSquare,
  Eye,
  Layers,
  Scale
} from 'lucide-react';
import QRCode from 'qrcode';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { formatCurrency, getRoleBadgeConfig, cn, formatDateTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DialogModal, DialogModalProps } from '@/components/ui/dialog-modal';
import { Profile, UserRole, CompanySettings, PermissionGroup, Company } from '@/types';
import { toast } from '@/lib/toast';

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
  { key: 'apply_discount_on_delivery', label: 'Conceder Desconto na Baixa / Pagamento', description: 'Permite receber valor menor do que o total da comanda e aplicar a diferença como desconto financeiro (respeitando o limite de % do usuário/grupo)', category: 'Balcão' },
  { key: 'allow_zero_value_delivery', label: 'Dar Baixa com Valor Zerado (Cortesia / Isenção)', description: 'Permite concluir a entrega de itens sem recebimento de pagamento (cortesia/isenção total) mediante justificativa obrigatória de no mínimo 10 caracteres', category: 'Balcão' },
  { key: 'print_ticket', label: 'Impressão de Comandas Térmicas', description: 'Permite imprimir comandas e etiquetas térmicas em 58mm/80mm', category: 'Balcão' },
  { key: 'view_customers', label: 'Ver Clientes', description: 'Permite visualizar o catálogo de clientes e telefones', category: 'Balcão' },
  { key: 'create_customer', label: 'Cadastrar Novos Clientes', description: 'Permite cadastrar novos clientes no balcão e na recepção', category: 'Balcão' },
  { key: 'edit_customer', label: 'Editar Clientes Existentes', description: 'Permite alterar nome, telefone, documento e dados cadastrais de clientes', category: 'Balcão' },
  { key: 'technical_workbench', label: 'Bancada Técnica (Oficina)', description: 'Permite acessar a fila de itens e realizar diagnósticos', category: 'Oficina' },
  { key: 'update_tech_status', label: 'Salvar Testes Técnicos & Pesagem', description: 'Permite registrar peso injetado e aprovar/condenar itens', category: 'Oficina' },
  { key: 'transfer_assigned_tech_order', label: 'Transferir OS de Outro Técnico (Puxar para Si)', description: 'Permite ao técnico assumir ou transferir para si uma ordem de serviço que já está sob responsabilidade de outro técnico', category: 'Oficina' },
  { key: 'edit_other_technician_orders', label: 'Alterar / Editar OS de Outro Técnico', description: 'Permite visualizar e alterar informações, diagnósticos, laudos, checklists, pesos e serviços em ordens de serviço atribuídas a outro técnico', category: 'Oficina' },
  { key: 'customize_kanban', label: 'Personalizar Colunas do Kanban', description: 'Permite editar nomes, cores e etapas das colunas da bancada', category: 'Oficina' },
  { key: 'reopen_entry', label: 'Reabrir Comandas Finalizadas/Entregues', description: 'Permite reverter o status de comandas entregues ou pagas para novo processamento', category: 'Gestão' },
  { key: 'delete_entry', label: 'Excluir Comandas', description: 'Permite excluir permanentemente comandas e seus itens do sistema', category: 'Gestão' },
  { key: 'change_assigned_technician', label: 'Alterar Técnico da OS para Outro Técnico', description: 'Permite reatribuir ou alterar o técnico responsável de uma comanda para outro profissional (não é puxar para si, mas definir outro técnico)', category: 'Gestão' },
  { key: 'manage_models', label: 'Gerenciar Catálogo & Preços', description: 'Permite cadastrar modelos e alterar preços padrão', category: 'Gestão' },
  { key: 'manage_services', label: 'Gerenciar Serviços & Procedimentos', description: 'Permite criar, editar e precificar serviços solicitados da oficina', category: 'Gestão' },
  { key: 'view_financial_reports', label: 'Relatórios Financeiros', description: 'Permite visualizar faturamento e formas de pagamento', category: 'Gestão' },
  { key: 'view_audit_logs', label: 'Auditoria de Ações', description: 'Permite consultar o registro histórico de operações de todos os usuários', category: 'Gestão' },
  { key: 'manage_company', label: 'Gerenciar Empresa & Permissões', description: 'Permite alterar dados da empresa e permissões dos usuários', category: 'Gestão' },
];

function CompanySettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'equipe';

  const { currentCompany, currentUser, hasPermission, refreshUser } = useAuth();
  
  // Navigation Tabs (Separated: regras vs impressao)
  const [activeTab, setActiveTab] = useState<'equipe' | 'grupos' | 'empresa' | 'regras' | 'impressao'>(
    ['equipe', 'grupos', 'empresa', 'regras', 'impressao'].includes(initialTab) ? initialTab : 'equipe'
  );

  const [users, setUsers] = useState<Profile[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [userMaxDiscount, setUserMaxDiscount] = useState<number>(10);

  // Group Modal State
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PermissionGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupDefaultRole, setGroupDefaultRole] = useState<UserRole>('ATENDENTE');
  const [groupMaxDiscount, setGroupMaxDiscount] = useState<number>(10);
  const [groupPermissions, setGroupPermissions] = useState<Record<string, boolean>>({});

  // Add User Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('123456');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('default-attendant-group');

  // Company Data Form State
  const [tradeName, setTradeName] = useState(currentCompany.trade_name || '');
  const [corporateName, setCorporateName] = useState(currentCompany.corporate_name || '');
  const [cnpj, setCnpj] = useState(currentCompany.cnpj || '');
  const [companyPhone, setCompanyPhone] = useState(currentCompany.phone || '');
  const [companyWhatsapp, setCompanyWhatsapp] = useState(currentCompany.whatsapp || '');
  const [companyEmail, setCompanyEmail] = useState(currentCompany.email || '');
  const [companyAddress, setCompanyAddress] = useState(currentCompany.address || '');
  const [companyCity, setCompanyCity] = useState(currentCompany.city || '');
  const [companyState, setCompanyState] = useState(currentCompany.state || '');
  const [companyZipCode, setCompanyZipCode] = useState(currentCompany.zip_code || '');
  const [companyResponsible, setCompanyResponsible] = useState(currentCompany.responsible_name || '');
  const [companySaveSuccess, setCompanySaveSuccess] = useState(false);

  // Operational Rules State (Tab 4)
  const [settings, setSettings] = useState<CompanySettings>(AppStore.getSettings(currentCompany.id));
  const [requireCustomerDocument, setRequireCustomerDocument] = useState<boolean>(settings.require_customer_document ?? false);
  const [requireCartridgeSerial, setRequireCartridgeSerial] = useState<boolean>(settings.require_cartridge_serial ?? true);
  const [requireTechnicianOnEntry, setRequireTechnicianOnEntry] = useState<boolean>(settings.require_technician_on_entry ?? false);
  const [skuMode, setSkuMode] = useState<'MANUAL' | 'AUTO_INCREMENT'>(settings.sku_mode || 'MANUAL');
  const [skuPrefix, setSkuPrefix] = useState(settings.sku_prefix !== undefined ? settings.sku_prefix : 'MOD-');
  const [skuStartNumber, setSkuStartNumber] = useState<string>(String(settings.sku_start_number || 1));
  const [skuDigits, setSkuDigits] = useState<string>(String(settings.sku_digits || 4));
  const [itemDescriptionDisplayMode, setItemDescriptionDisplayMode] = useState<'BASIC' | 'FULL'>(settings.item_description_display_mode || 'BASIC');
  const [technicianGroupIds, setTechnicianGroupIds] = useState<string[]>(settings.technician_group_ids || ['default-tech-group']);
  const [policySaveSuccess, setPolicySaveSuccess] = useState(false);

  // Dedicated Thermal Printing State (Tab 5)
  const [printerPaperWidth, setPrinterPaperWidth] = useState<'58mm' | '80mm'>(settings.printer_paper_width || '80mm');
  const [printerFontSize, setPrinterFontSize] = useState<'compact' | 'normal' | 'large'>(settings.printer_font_size || 'normal');
  const [printerDensity, setPrinterDensity] = useState<'compact' | 'normal'>(settings.printer_density || 'normal');
  const [printEntryCopies, setPrintEntryCopies] = useState<1 | 2>(settings.print_entry_copies ?? 2);
  const [printDeliveryCopies, setPrintDeliveryCopies] = useState<0 | 1 | 2>(settings.print_delivery_copies ?? 1);
  const [autoPrintOnEntry, setAutoPrintOnEntry] = useState<boolean>(settings.auto_print_on_entry ?? true);
  const [autoPrintOnDelivery, setAutoPrintOnDelivery] = useState<boolean>(settings.auto_print_on_delivery ?? true);
  const [showPricesOnReceipt, setShowPricesOnReceipt] = useState<boolean>(settings.show_prices_on_receipt ?? true);
  const [showQrCodeOnReceipt, setShowQrCodeOnReceipt] = useState<boolean>(settings.show_qr_code_on_receipt ?? true);
  const [showChecklistOnReceipt, setShowChecklistOnReceipt] = useState<boolean>(settings.show_checklist_on_receipt ?? true);
  const [showAccessoriesOnReceipt, setShowAccessoriesOnReceipt] = useState<boolean>(settings.show_accessories_on_receipt ?? true);
  const [showReportedIssueOnReceipt, setShowReportedIssueOnReceipt] = useState<boolean>(settings.show_reported_issue_on_receipt ?? true);
  const [showTechnicianOnReceipt, setShowTechnicianOnReceipt] = useState<boolean>(settings.show_technician_on_receipt ?? true);
  const [showCustomerSignatureLine, setShowCustomerSignatureLine] = useState<boolean>(settings.show_customer_signature_line ?? true);
  const [showAttendantSignatureLine, setShowAttendantSignatureLine] = useState<boolean>(settings.show_attendant_signature_line ?? false);
  const [showCompanyCnpj, setShowCompanyCnpj] = useState<boolean>(settings.show_company_cnpj ?? true);
  const [showCompanyContact, setShowCompanyContact] = useState<boolean>(settings.show_company_contact ?? true);
  const [showCompanyAddress, setShowCompanyAddress] = useState<boolean>(settings.show_company_address ?? true);
  const [receiptHeader, setReceiptHeader] = useState(settings.receipt_header || '');
  const [receiptFooter, setReceiptFooter] = useState(settings.receipt_footer || '');
  const [receiptDeliveryFooter, setReceiptDeliveryFooter] = useState(settings.receipt_delivery_footer || '');
  const [printSaveSuccess, setPrintSaveSuccess] = useState(false);
  const [previewTab, setPreviewTab] = useState<'entrada' | 'entrega'>('entrada');
  const [previewQrUrl, setPreviewQrUrl] = useState<string>('');

  // Reset Password Modal State
  const [userToResetPass, setUserToResetPass] = useState<Profile | null>(null);
  const [adminNewPass, setAdminNewPass] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Global Dialog Modal (Replaces standard browser alerts & confirms)
  const [dialogModal, setDialogModal] = useState<DialogModalProps | null>(null);

  const limits = AppStore.getEffectiveLimits(currentCompany.id);
  const currentPlan = limits.plan;

  const loadData = () => {
    const dataUsers = AppStore.getUsers(currentCompany.id);
    const dataGroups = AppStore.getPermissionGroups(currentCompany.id);
    const sets = AppStore.getSettings(currentCompany.id);
    const comp = AppStore.getCompany(currentCompany.id) || currentCompany;

    setUsers(dataUsers);
    setPermissionGroups(dataGroups);
    setSettings(sets);
    
    // Operational Rules
    setRequireCustomerDocument(sets.require_customer_document ?? false);
    setRequireCartridgeSerial(sets.require_cartridge_serial ?? true);
    setRequireTechnicianOnEntry(sets.require_technician_on_entry ?? false);
    setSkuMode(sets.sku_mode || 'MANUAL');
    setSkuPrefix(sets.sku_prefix !== undefined ? sets.sku_prefix : 'MOD-');
    setSkuStartNumber(String(sets.sku_start_number || 1));
    setSkuDigits(String(sets.sku_digits || 4));
    setItemDescriptionDisplayMode(sets.item_description_display_mode || 'BASIC');
    setTechnicianGroupIds(sets.technician_group_ids || ['default-tech-group']);

    // Printing Settings
    setPrinterPaperWidth(sets.printer_paper_width || '80mm');
    setPrinterFontSize(sets.printer_font_size || 'normal');
    setPrinterDensity(sets.printer_density || 'normal');
    setPrintEntryCopies(sets.print_entry_copies ?? 2);
    setPrintDeliveryCopies(sets.print_delivery_copies ?? 1);
    setAutoPrintOnEntry(sets.auto_print_on_entry ?? true);
    setAutoPrintOnDelivery(sets.auto_print_on_delivery ?? true);
    setShowPricesOnReceipt(sets.show_prices_on_receipt ?? true);
    setShowQrCodeOnReceipt(sets.show_qr_code_on_receipt ?? true);
    setShowChecklistOnReceipt(sets.show_checklist_on_receipt ?? true);
    setShowAccessoriesOnReceipt(sets.show_accessories_on_receipt ?? true);
    setShowReportedIssueOnReceipt(sets.show_reported_issue_on_receipt ?? true);
    setShowTechnicianOnReceipt(sets.show_technician_on_receipt ?? true);
    setShowCustomerSignatureLine(sets.show_customer_signature_line ?? true);
    setShowAttendantSignatureLine(sets.show_attendant_signature_line ?? false);
    setShowCompanyCnpj(sets.show_company_cnpj ?? true);
    setShowCompanyContact(sets.show_company_contact ?? true);
    setShowCompanyAddress(sets.show_company_address ?? true);
    setReceiptHeader(sets.receipt_header || '');
    setReceiptFooter(sets.receipt_footer || '');
    setReceiptDeliveryFooter(sets.receipt_delivery_footer || '');

    // Company Data
    setTradeName(comp.trade_name || '');
    setCorporateName(comp.corporate_name || '');
    setCnpj(comp.cnpj || '');
    setCompanyPhone(comp.phone || '');
    setCompanyWhatsapp(comp.whatsapp || '');
    setCompanyEmail(comp.email || '');
    setCompanyAddress(comp.address || '');
    setCompanyCity(comp.city || '');
    setCompanyState(comp.state || '');
    setCompanyZipCode(comp.zip_code || '');
    setCompanyResponsible(comp.responsible_name || '');
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, [currentCompany.id]);

  useEffect(() => {
    QRCode.toDataURL('https://supreme.com.br/acompanhar/DEMO-2026-0001', {
      width: 140,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    })
      .then(url => setPreviewQrUrl(url))
      .catch(() => {});
  }, []);

  // Save Operational Rules (Tab 4)
  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = AppStore.updateSettings(currentCompany.id, {
      require_customer_document: requireCustomerDocument,
      require_cartridge_serial: requireCartridgeSerial,
      require_technician_on_entry: requireTechnicianOnEntry,
      sku_mode: skuMode,
      sku_prefix: skuPrefix.trim(),
      sku_start_number: parseInt(skuStartNumber, 10) || 1,
      sku_digits: parseInt(skuDigits, 10) || 4,
      item_description_display_mode: itemDescriptionDisplayMode,
      technician_group_ids: technicianGroupIds
    }, currentUser?.full_name || 'Administrador');
    setSettings(updated);
    setPolicySaveSuccess(true);
    toast.success('Regras operacionais salvas com sucesso!');
    setTimeout(() => setPolicySaveSuccess(false), 3500);
  };

  // Save Printing Settings (Tab 5)
  const handleSavePrinting = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = AppStore.updateSettings(currentCompany.id, {
      printer_paper_width: printerPaperWidth,
      thermal_paper_width_mm: printerPaperWidth === '58mm' ? 58 : 80,
      printer_font_size: printerFontSize,
      printer_density: printerDensity,
      print_entry_copies: printEntryCopies,
      print_delivery_copies: printDeliveryCopies,
      auto_print_on_entry: autoPrintOnEntry,
      auto_print_on_delivery: autoPrintOnDelivery,
      show_prices_on_receipt: showPricesOnReceipt,
      show_qr_code_on_receipt: showQrCodeOnReceipt,
      show_checklist_on_receipt: showChecklistOnReceipt,
      show_accessories_on_receipt: showAccessoriesOnReceipt,
      show_reported_issue_on_receipt: showReportedIssueOnReceipt,
      show_technician_on_receipt: showTechnicianOnReceipt,
      show_customer_signature_line: showCustomerSignatureLine,
      show_attendant_signature_line: showAttendantSignatureLine,
      show_company_cnpj: showCompanyCnpj,
      show_company_contact: showCompanyContact,
      show_company_address: showCompanyAddress,
      receipt_header: receiptHeader.trim(),
      receipt_footer: receiptFooter.trim(),
      receipt_delivery_footer: receiptDeliveryFooter.trim()
    }, currentUser?.full_name || 'Administrador');
    setSettings(updated);
    setPrintSaveSuccess(true);
    toast.success('Configurações de impressão salvas com sucesso!');
    setTimeout(() => setPrintSaveSuccess(false), 3500);
  };

  const toggleTechnicianGroup = (groupId: string) => {
    setTechnicianGroupIds(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const handleSaveCompanyData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeName.trim()) {
      toast.warning('O Nome Fantasia da empresa é obrigatório.');
      return;
    }

    try {
      AppStore.updateCompany(currentCompany.id, {
        trade_name: tradeName.trim(),
        corporate_name: corporateName.trim() || undefined,
        cnpj: cnpj.trim() || undefined,
        phone: companyPhone.trim() || undefined,
        whatsapp: companyWhatsapp.trim() || undefined,
        email: companyEmail.trim() || undefined,
        address: companyAddress.trim() || undefined,
        city: companyCity.trim() || undefined,
        state: companyState.trim() || undefined,
        zip_code: companyZipCode.trim() || undefined,
        responsible_name: companyResponsible.trim() || undefined
      }, currentUser?.full_name || 'Administrador');

      setCompanySaveSuccess(true);
      toast.success('Dados cadastrais da empresa salvos com sucesso!');
      setTimeout(() => setCompanySaveSuccess(false), 3500);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar dados da empresa.');
    }
  };

  if (!currentUser) return null;

  // Add User Handler with Group Association
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      toast.warning('Preencha o nome completo e o e-mail do usuário.');
      return;
    }

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

      toast.success(`Usuário "${fullName}" cadastrado com sucesso!`);
      loadData();
      setShowAddModal(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('123456');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao cadastrar usuário.');
    }
  };

  // Group Create/Edit Handler
  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupName('');
    setGroupDescription('');
    setGroupDefaultRole('ATENDENTE');
    setGroupMaxDiscount(10);
    
    const initialPerms: Record<string, boolean> = {
      create_entry: true,
      view_entries: true,
      register_delivery: true,
      apply_discount_on_delivery: true,
      allow_zero_value_delivery: false,
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
    setGroupDefaultRole(group.default_role || 'ATENDENTE');
    setGroupMaxDiscount(group.default_max_discount_percent !== undefined ? group.default_max_discount_percent : (group.default_role === 'ADMINISTRADOR' ? 100 : 10));
    setGroupPermissions(group.permissions || {});
    setShowGroupModal(true);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.warning('Informe o nome do grupo de permissões.');
      return;
    }

    try {
      if (editingGroup) {
        AppStore.updatePermissionGroup(editingGroup.id, {
          name: groupName.trim(),
          description: groupDescription.trim(),
          default_role: groupDefaultRole,
          default_max_discount_percent: Math.min(100, Math.max(0, Number(groupMaxDiscount) || 0)),
          permissions: groupPermissions
        }, currentUser.full_name);
        toast.success(`Grupo "${groupName.trim()}" atualizado com sucesso!`);
      } else {
        AppStore.addPermissionGroup({
          tenant_id: currentCompany.id,
          name: groupName.trim(),
          description: groupDescription.trim(),
          default_role: groupDefaultRole,
          default_max_discount_percent: Math.min(100, Math.max(0, Number(groupMaxDiscount) || 0)),
          permissions: groupPermissions
        }, currentUser.full_name);
        toast.success(`Grupo "${groupName.trim()}" criado com sucesso!`);
      }

      loadData();
      setShowGroupModal(false);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar grupo de permissões.');
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    setDialogModal({
      isOpen: true,
      type: 'danger',
      title: 'Excluir Grupo de Permissões?',
      subtitle: 'Esta ação não poderá ser desfeita',
      message: 'Tem certeza que deseja excluir este grupo de permissões? Usuários associados a este grupo perderão esses acessos específicos.',
      confirmLabel: 'Sim, Excluir Grupo',
      cancelLabel: 'Cancelar',
      onCancel: () => setDialogModal(null),
      onConfirm: () => {
        try {
          AppStore.deletePermissionGroup(groupId, currentUser.full_name);
          setDialogModal(null);
          toast.info('Grupo de permissões excluído.');
          loadData();
        } catch (err: any) {
          toast.error(err?.message || 'Não foi possível excluir o grupo.');
        }
      }
    });
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

    try {
      AppStore.changeUserPassword(userToResetPass.id, adminNewPass, currentUser.full_name);
      setResetSuccess(true);
      toast.success(`Senha de "${userToResetPass.full_name}" redefinida com sucesso!`);
      setTimeout(() => {
        setResetSuccess(false);
        setUserToResetPass(null);
        setAdminNewPass('');
        loadData();
      }, 1500);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao redefinir senha.');
    }
  };

  // Open Individual Permissions Modal
  const handleOpenPermissions = (u: Profile) => {
    setEditingUser(u);
    
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
    setUserMaxDiscount(
      u.max_discount_percent !== undefined && u.max_discount_percent !== null
        ? u.max_discount_percent
        : (userGroup?.default_max_discount_percent ?? (u.role === 'ADMINISTRADOR' ? 100 : 10))
    );
    setShowPermissionsModal(true);
  };

  const handleSavePermissions = () => {
    if (!editingUser) return;
    try {
      AppStore.updateUserPermissions(
        editingUser.id,
        userPermissions,
        currentUser.full_name,
        Math.min(100, Math.max(0, Number(userMaxDiscount) || 0))
      );
      toast.success(`Permissões do usuário "${editingUser.full_name}" salvas com sucesso!`);
      loadData();
      refreshUser();
      setShowPermissionsModal(false);
      setEditingUser(null);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar permissões do usuário.');
    }
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
    return u.group_name || (u.role === 'ADMINISTRADOR' ? 'Administradores' : u.role === 'TECNICO' ? 'Técnicos de Bancada' : 'Atendimento & Balcão');
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Global Dialog Modal */}
      {dialogModal && <DialogModal {...dialogModal} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <span>Configurações da Empresa & Gestão</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Empresa: <strong className="text-slate-800 dark:text-slate-200">{currentCompany.trade_name}</strong> • Gestão de equipe, permissões, regras operacionais e impressão térmica
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
      </div>

      {/* Navigation Tabs (5 Distinct Tabs: Equipe, Grupos, Empresa, Regras Operacionais, Impressão & Comandas) */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('equipe')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
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
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
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
              onClick={() => setActiveTab('empresa')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'empresa'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Dados da Empresa</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('regras')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'regras'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Regras Operacionais & SKU</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('impressao')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'impressao'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Impressão & Comandas</span>
            </button>
          </>
        )}
      </div>

      {/* TAB 1: LISTA DE USUÁRIOS & EQUIPE */}
      {activeTab === 'equipe' && (
        <div className="bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Colaboradores Cadastrados
              </h3>
              <p className="text-xs text-slate-500">
                Cada usuário pode estar associado a um grupo e ter permissões customizadas
              </p>
            </div>

            {hasPermission('manage_company') && (
              <Button
                size="sm"
                onClick={() => setShowAddModal(true)}
                disabled={limits.availableUsers <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white gap-1.5 rounded-xl h-9 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Adicionar Usuário</span>
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="p-3.5">Nome & Telefone</th>
                  <th className="p-3.5">E-mail de Acesso</th>
                  <th className="p-3.5">Função Base</th>
                  <th className="p-3.5">Grupo de Permissões</th>
                  <th className="p-3.5">Status</th>
                  {hasPermission('manage_company') && <th className="p-3.5 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const roleConfig = getRoleBadgeConfig(u.role);
                  const isCurrent = u.id === currentUser.id;
                  const groupName = getGroupNameForUser(u);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{u.full_name}</span>
                          {isCurrent && (
                            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-[9px] px-1.5 py-0">
                              Você
                            </Badge>
                          )}
                        </div>
                        {u.phone && <div className="text-[11px] text-slate-400 mt-0.5">{u.phone}</div>}
                      </td>

                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                        {u.email}
                      </td>

                      <td className="p-3.5">
                        <Badge className={cn(roleConfig.className, "text-[10px] font-bold")}>
                          {roleConfig.label}
                        </Badge>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {groupName}
                          </span>
                          {u.custom_permissions && Object.keys(u.custom_permissions).length > 0 && (
                            <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-[9px]">
                              Ajustado
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <Badge className={u.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px]' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 text-[10px]'}>
                          {u.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>

                      {hasPermission('manage_company') && (
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPermissions(u)}
                              className="h-7 text-[11px] px-2 rounded-lg gap-1 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                              title="Configurar Permissões Individuais"
                            >
                              <Shield className="w-3 h-3 text-purple-600" />
                              <span>Permissões</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setUserToResetPass(u);
                                setAdminNewPass('');
                              }}
                              className="h-7 text-[11px] px-2 rounded-lg gap-1 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                              title="Redefinir Senha"
                            >
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              <span>Senha</span>
                            </Button>
                          </div>
                        </td>
                      )}
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
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Grupos de Permissões</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Crie perfis com conjuntos de permissões específicas para atribuir facilmente aos usuários da empresa.
              </p>
            </div>

            {hasPermission('manage_company') && (
              <Button
                size="sm"
                onClick={handleOpenCreateGroup}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white gap-1.5 rounded-xl h-9 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Novo Grupo</span>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {permissionGroups.map((g) => {
              const assignedUsersCount = users.filter(u => u.group_id === g.id).length;
              const permsCount = AVAILABLE_PERMISSIONS.filter(p => Boolean(g.permissions?.[p.key])).length;

              return (
                <Card key={g.id} className="bg-white dark:bg-[#0e1626] border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                            {g.name}
                          </CardTitle>
                          {g.is_system_default && (
                            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px]">
                              Padrão
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs text-slate-500 line-clamp-2">
                          {g.description || 'Sem descrição cadastrada'}
                        </CardDescription>
                      </div>

                      {hasPermission('manage_company') && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditGroup(g)}
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Editar Grupo"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {!g.is_system_default && (
                            <button
                              onClick={() => handleDeleteGroup(g.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Excluir Grupo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Membros Associados:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {assignedUsersCount} usuário(s)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Permissões Ativas:</span>
                      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                        {permsCount} de {AVAILABLE_PERMISSIONS.length} regras
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DADOS DA EMPRESA */}
      {activeTab === 'empresa' && hasPermission('manage_company') && (
        <div className="bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Dados Cadastrais da Empresa</span>
            </h3>
            <p className="text-xs text-slate-500">
              Informações utilizadas nos cabeçalhos de comprovantes, ordens de serviço e identificação fiscal.
            </p>
          </div>

          <form onSubmit={handleSaveCompanyData} className="space-y-4">
            {companySaveSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dados da empresa salvos com sucesso!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome Fantasia *</label>
                <Input required value={tradeName} onChange={e => setTradeName(e.target.value)} placeholder="Ex: Supreme Recargas" className="text-xs rounded-xl" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Razão Social</label>
                <Input value={corporateName} onChange={e => setCorporateName(e.target.value)} placeholder="Ex: Supreme Comércio e Serviços LTDA" className="text-xs rounded-xl" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">CNPJ / CPF</label>
                <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="text-xs rounded-xl font-mono" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Telefone Principal</label>
                <Input value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} placeholder="(11) 3333-4444" className="text-xs rounded-xl" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">WhatsApp Corporativo</label>
                <Input value={companyWhatsapp} onChange={e => setCompanyWhatsapp(e.target.value)} placeholder="(11) 98888-7777" className="text-xs rounded-xl" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">E-mail Principal</label>
                <Input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} placeholder="contato@empresa.com.br" className="text-xs rounded-xl" />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Endereço Completo</label>
                <Input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="Rua das Flores, 123 - Centro" className="text-xs rounded-xl" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Cidade</label>
                <Input value={companyCity} onChange={e => setCompanyCity(e.target.value)} placeholder="São Paulo" className="text-xs rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Estado (UF)</label>
                  <Input value={companyState} onChange={e => setCompanyState(e.target.value.toUpperCase())} placeholder="SP" maxLength={2} className="text-xs rounded-xl uppercase font-mono" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">CEP</label>
                  <Input value={companyZipCode} onChange={e => setCompanyZipCode(e.target.value)} placeholder="01000-000" className="text-xs rounded-xl font-mono" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Responsável / Proprietário</label>
                <Input value={companyResponsible} onChange={e => setCompanyResponsible(e.target.value)} placeholder="Nome do proprietário ou gerente" className="text-xs rounded-xl" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white gap-1.5 rounded-xl h-9 shadow-xs">
                <Check className="w-4 h-4" />
                <span>Salvar Dados Cadastrais</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: REGRAS OPERACIONAIS & SKU */}
      {activeTab === 'regras' && hasPermission('manage_company') && (
        <div className="bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Regras Operacionais, Validações & SKU</span>
            </h3>
            <p className="text-xs text-slate-500">
              Personalize políticas de preenchimento, validações de balcão e padronização de códigos internos.
            </p>
          </div>

          <form onSubmit={handleSavePolicies} className="space-y-6">
            {policySaveSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Regras operacionais atualizadas com sucesso!</span>
              </div>
            )}

            {/* Validation Policies */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CPF / CNPJ Policy */}
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
                        Exigir CPF / CNPJ
                      </span>
                      <Badge className={requireCustomerDocument ? 'bg-emerald-600 text-white text-[9px]' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px]'}>
                        {requireCustomerDocument ? 'Obrigatório' : 'Opcional'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {requireCustomerDocument 
                        ? 'Atendentes devem preencher CPF/CNPJ para salvar clientes.' 
                        : 'CPF/CNPJ opcional no balcão de atendimento.'}
                    </p>
                  </label>
                </div>
              </div>

              {/* Item Serial Required Policy */}
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
                        Exigir Nº de Série / Serial
                      </span>
                      <Badge className={requireCartridgeSerial ? 'bg-emerald-600 text-white text-[9px]' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px]'}>
                        {requireCartridgeSerial ? 'Obrigatório' : 'Opcional (S/N)'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {requireCartridgeSerial 
                        ? 'Exige preenchimento de serial ou identificador no recebimento.' 
                        : 'Serial opcional (atribui S/N se deixado em branco).'}
                    </p>
                  </label>
                </div>
              </div>

              {/* Require Technician on Entry Policy */}
              <div className={`p-4 rounded-2xl border transition-all ${
                requireTechnicianOnEntry 
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' 
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="require_technician_toggle"
                    checked={requireTechnicianOnEntry}
                    onChange={(e) => setRequireTechnicianOnEntry(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="require_technician_toggle" className="cursor-pointer space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        Exigir Técnico na Entrada
                      </span>
                      <Badge className={requireTechnicianOnEntry ? 'bg-emerald-600 text-white text-[9px]' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px]'}>
                        {requireTechnicianOnEntry ? 'Obrigatório' : 'Opcional'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {requireTechnicianOnEntry 
                        ? 'Obriga seleção do técnico no momento de abrir a OS.' 
                        : 'Permite abrir sem técnico para assumir na bancada.'}
                    </p>
                  </label>
                </div>
              </div>
            </div>

            {/* Grupos de Usuários que aparecem como Técnicos Responsáveis */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-emerald-600" />
                    <span>Grupos de Usuários Elegíveis como "Técnicos Responsáveis"</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Defina quais grupos de usuários aparecerão na seleção de técnico da comanda e da bancada técnica.
                  </p>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold w-fit">
                  {technicianGroupIds.length} grupo(s) selecionado(s)
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {permissionGroups.map(group => {
                  const isSelected = technicianGroupIds.includes(group.id);
                  const membersInGroup = users.filter(u => u.group_id === group.id && u.is_active);

                  return (
                    <div
                      key={group.id}
                      onClick={() => toggleTechnicianGroup(group.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-500/20'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} 
                          className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block truncate">
                            {group.name}
                          </span>
                          <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                            {group.description || `Função padrão: ${group.default_role}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/60 text-[10px]">
                        <span className="text-slate-500 font-medium">
                          {membersInGroup.length} usuário(s) ativo(s)
                        </span>
                        <Badge className={isSelected ? 'bg-emerald-600 text-white text-[9px]' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px]'}>
                          {isSelected ? 'Elegível' : 'Não Listado'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Preview of Eligible Technicians */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Usuários que aparecerão como Técnicos Responsáveis:</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {users.filter(u => u.is_active && u.group_id && technicianGroupIds.includes(u.group_id)).length} profissional(is)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {users
                    .filter(u => u.is_active && u.group_id && technicianGroupIds.includes(u.group_id))
                    .map(u => (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        {u.full_name}
                        <span className="text-[9px] text-emerald-600/80 dark:text-emerald-400/80 font-normal">({getGroupNameForUser(u)})</span>
                      </span>
                    ))}
                  {users.filter(u => u.is_active && u.group_id && technicianGroupIds.includes(u.group_id)).length === 0 && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                      Nenhum usuário ativo pertence aos grupos marcados.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SKU / Código Interno Configuration Section */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span>Código Interno / SKU dos Produtos & Equipamentos</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Defina se os códigos de identificação serão gerados de forma manual ou automática incremental.
                  </p>
                </div>

                <Badge className={skuMode === 'AUTO_INCREMENT' ? 'bg-emerald-600 text-white text-[10px]' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px]'}>
                  {skuMode === 'AUTO_INCREMENT' ? 'Automático Incremental' : 'Manual'}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="sku_mode"
                      value="MANUAL"
                      checked={skuMode === 'MANUAL'}
                      onChange={() => setSkuMode('MANUAL')}
                      className="text-emerald-600"
                    />
                    <span>Manual (Digitado livremente no cadastro)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="sku_mode"
                      value="AUTO_INCREMENT"
                      checked={skuMode === 'AUTO_INCREMENT'}
                      onChange={() => setSkuMode('AUTO_INCREMENT')}
                      className="text-emerald-600"
                    />
                    <span>Automático Incremental (Gerado pelo sistema)</span>
                  </label>
                </div>

                {skuMode === 'AUTO_INCREMENT' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 animate-in fade-in-0">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Prefixo do Código (Opcional)
                      </label>
                      <Input
                        value={skuPrefix}
                        onChange={e => setSkuPrefix(e.target.value)}
                        placeholder="Ex: MOD-, SKU-, PROD-"
                        className="text-xs rounded-xl font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Padrão Inicial / Número
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={skuStartNumber}
                        onChange={e => setSkuStartNumber(e.target.value)}
                        placeholder="Ex: 1 ou 1001"
                        className="text-xs rounded-xl font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Formato com Zeros à Esquerda
                      </label>
                      <Select
                        value={skuDigits}
                        onChange={e => setSkuDigits(e.target.value)}
                        className="text-xs rounded-xl"
                      >
                        <option value="3">3 Dígitos (001)</option>
                        <option value="4">4 Dígitos (0001)</option>
                        <option value="5">5 Dígitos (00001)</option>
                        <option value="6">6 Dígitos (000001)</option>
                      </Select>
                    </div>

                    <div className="sm:col-span-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                      <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                        Exemplo do próximo código gerado:
                      </span>
                      <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm">
                        {skuPrefix}{String(parseInt(skuStartNumber, 10) || 1).padStart(parseInt(skuDigits, 10) || 4, '0')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modo de Exibição dos Produtos / Itens nas Telas */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Exibição dos Itens / Produtos nas Telas do Sistema</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Escolha se as listagens de recepção, bancada Kanban e comandas devem mostrar a descrição básica ou completa.
                  </p>
                </div>

                <Badge className={itemDescriptionDisplayMode === 'FULL' ? 'bg-emerald-600 text-white text-[10px]' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px]'}>
                  {itemDescriptionDisplayMode === 'FULL' ? 'Descrição Completa' : 'Descrição Básica'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  itemDescriptionDisplayMode === 'BASIC'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="item_description_display_mode"
                    value="BASIC"
                    checked={itemDescriptionDisplayMode === 'BASIC'}
                    onChange={() => setItemDescriptionDisplayMode('BASIC')}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="space-y-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      Descrição Básica (Padrão)
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Exibe apenas o nome principal do modelo cadastrado.
                    </p>
                    <div className="pt-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      Ex: HP 664
                    </div>
                  </div>
                </label>

                <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  itemDescriptionDisplayMode === 'FULL'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="item_description_display_mode"
                    value="FULL"
                    checked={itemDescriptionDisplayMode === 'FULL'}
                    onChange={() => setItemDescriptionDisplayMode('FULL')}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="space-y-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      Descrição Completa
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Exibe o nome do modelo concatenado com os opcionais técnicos e especificações.
                    </p>
                    <div className="pt-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      Ex: HP 664 Tricolor Versão XL (Alta Capacidade) 32ml
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white gap-1.5 rounded-xl h-9 shadow-xs">
                <Check className="w-4 h-4" />
                <span>Salvar Regras Operacionais</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: CONFIGURAÇÕES DEDICADAS DE IMPRESSÃO & COMANDAS TÉRMICAS */}
      {activeTab === 'impressao' && hasPermission('manage_company') && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-600" />
                  <span>Central de Configurações de Impressão & Comandas Térmicas</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure a quantidade de vias (1 via / 2 vias), disparos automáticos, largura de bobina e seções personalizadas com preview em tempo real.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/impressao">
                  <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 rounded-xl h-9">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir Emissor de Comandas</span>
                  </Button>
                </Link>
              </div>
            </div>

            {printSaveSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Configurações de impressão salvas e aplicadas a todo o sistema!</span>
              </div>
            )}

            {/* Two-Column Studio Layout: Settings Form on Left, Live Mockup on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              {/* LEFT COLUMN: Controls & Preferences (7 Cols) */}
              <form onSubmit={handleSavePrinting} className="lg:col-span-7 space-y-5">
                {/* 1. Formato da Bobina & Tipografia */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span>1. Formato do Papel & Tipografia</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Largura da Bobina Térmica
                      </label>
                      <Select 
                        value={printerPaperWidth} 
                        onChange={e => setPrinterPaperWidth(e.target.value as any)} 
                        className="text-xs rounded-xl font-bold"
                      >
                        <option value="80mm">80 mm (Padrão Comercial)</option>
                        <option value="58mm">58 mm (Bobina Compacta)</option>
                      </Select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Tamanho da Fonte
                      </label>
                      <Select 
                        value={printerFontSize} 
                        onChange={e => setPrinterFontSize(e.target.value as any)} 
                        className="text-xs rounded-xl"
                      >
                        <option value="compact">Pequena (9px - Econômica)</option>
                        <option value="normal">Média (11px - Padrão)</option>
                        <option value="large">Grande (13px - Alta Legibilidade)</option>
                      </Select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Densidade do Cupom
                      </label>
                      <Select 
                        value={printerDensity} 
                        onChange={e => setPrinterDensity(e.target.value as any)} 
                        className="text-xs rounded-xl"
                      >
                        <option value="normal">Normal (Espaçado)</option>
                        <option value="compact">Compacta (Economizar Papel)</option>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 2. Quantidade de Vias & Automações de Disparo */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-emerald-600" />
                    <span>2. Quantidade de Vias & Automação de Disparo</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Vias na Entrada */}
                    <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Vias na Entrada / Abertura da OS
                        </label>
                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                          {printEntryCopies} via(s)
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {printEntryCopies === 2 
                          ? 'Imprime 2 vias destacáveis: 1ª Via para a Empresa/Bancada + 2ª Via para o Cliente.' 
                          : 'Imprime 1 via única entregue ao cliente.'}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setPrintEntryCopies(1)}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                            printEntryCopies === 1
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          1 Via (Única)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrintEntryCopies(2)}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                            printEntryCopies === 2
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          2 Vias (Loja + Cliente)
                        </button>
                      </div>
                    </div>

                    {/* Vias na Finalização / Entrega */}
                    <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Vias na Finalização / Baixa & Entrega
                        </label>
                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                          {printDeliveryCopies === 0 ? 'Desativado' : `${printDeliveryCopies} via(s)`}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {printDeliveryCopies === 2 
                          ? 'Imprime 2 vias: 1ª Via Empresa (Termo de retirada assinado) + 2ª Via Recibo do Cliente.' 
                          : printDeliveryCopies === 1 
                            ? 'Imprime 1 via de comprovante de quitação para o cliente.' 
                            : 'Não emite comprovante impresso automático na baixa.'}
                      </p>
                      <div className="flex gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setPrintDeliveryCopies(0)}
                          className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                            printDeliveryCopies === 0
                              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          Não Imprimir
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrintDeliveryCopies(1)}
                          className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                            printDeliveryCopies === 1
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          1 Via (Recibo)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrintDeliveryCopies(2)}
                          className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                            printDeliveryCopies === 2
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          2 Vias
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Disparos Automáticos Checkboxes */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <label className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60">
                      <input
                        type="checkbox"
                        checked={autoPrintOnEntry}
                        onChange={e => setAutoPrintOnEntry(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-slate-900 dark:text-slate-100">Disparar janela de impressão imediatamente ao gerar nova OS no Balcão</span>
                        <p className="text-[10px] text-slate-400 font-normal">Abre o diálogo de impressão do navegador assim que a comanda for criada.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60">
                      <input
                        type="checkbox"
                        checked={autoPrintOnDelivery}
                        onChange={e => setAutoPrintOnDelivery(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-slate-900 dark:text-slate-100">Disparar janela de impressão automaticamente na Finalização & Baixa</span>
                        <p className="text-[10px] text-slate-400 font-normal">Abre o diálogo de impressão do comprovante ao confirmar o pagamento e entrega.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 3. Elementos & Seções Visíveis no Cupom */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span>3. Elementos & Seções Visíveis no Cupom Térmico</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <input type="checkbox" checked={showPricesOnReceipt} onChange={e => setShowPricesOnReceipt(e.target.checked)} className="rounded text-emerald-600" />
                      <span>Exibir Discriminação de Valores & Preços</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <input type="checkbox" checked={showQrCodeOnReceipt} onChange={e => setShowQrCodeOnReceipt(e.target.checked)} className="rounded text-emerald-600" />
                      <span>Exibir QR Code de Rastreio Online</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <input type="checkbox" checked={showChecklistOnReceipt} onChange={e => setShowChecklistOnReceipt(e.target.checked)} className="rounded text-emerald-600" />
                      <span>Exibir Checklist de Conferência do Item</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <input type="checkbox" checked={showAccessoriesOnReceipt} onChange={e => setShowAccessoriesOnReceipt(e.target.checked)} className="rounded text-emerald-600" />
                      <span>Exibir Acessórios Informados na Entrada</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <input type="checkbox" checked={showReportedIssueOnReceipt} onChange={e => setShowReportedIssueOnReceipt(e.target.checked)} className="rounded text-emerald-600" />
                      <span>Exibir Defeito / Relato do Cliente</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <input type="checkbox" checked={showTechnicianOnReceipt} onChange={e => setShowTechnicianOnReceipt(e.target.checked)} className="rounded text-emerald-600" />
                      <span>Exibir Técnico Responsável</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <input type="checkbox" checked={showCustomerSignatureLine} onChange={e => setShowCustomerSignatureLine(e.target.checked)} className="rounded text-emerald-600" />
                      <span>Exibir Linha para Assinatura do Cliente</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <input type="checkbox" checked={showAttendantSignatureLine} onChange={e => setShowAttendantSignatureLine(e.target.checked)} className="rounded text-emerald-600" />
                      <span>Exibir Linha para Assinatura do Atendente</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <input type="checkbox" checked={showCompanyCnpj} onChange={e => setShowCompanyCnpj(e.target.checked)} className="rounded text-emerald-600" />
                      <span>Exibir CNPJ no Cabeçalho</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                      <input type="checkbox" checked={showCompanyContact} onChange={e => setShowCompanyContact(e.target.checked)} className="rounded text-emerald-600" />
                      <span>Exibir Telefone & WhatsApp no Cabeçalho</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer sm:col-span-2">
                      <input type="checkbox" checked={showCompanyAddress} onChange={e => setShowCompanyAddress(e.target.checked)} className="rounded text-emerald-600" />
                      <span>Exibir Endereço Completo no Cabeçalho</span>
                    </label>
                  </div>
                </div>

                {/* 4. Textos Personalizados de Cabeçalho & Rodapé */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>4. Textos e Termos Institucionais Personalizados</span>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Slogan / Mensagem de Cabeçalho
                      </label>
                      <Input
                        value={receiptHeader}
                        onChange={e => setReceiptHeader(e.target.value)}
                        placeholder="Ex: Especialistas em Manutenção, Informática e Recargas"
                        className="text-xs rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Termos de Rodapé na Entrada (Garantia Legal & Prazos)
                      </label>
                      <textarea
                        rows={2}
                        value={receiptFooter}
                        onChange={e => setReceiptFooter(e.target.value)}
                        placeholder="Ex: Garantia legal de 90 dias conforme Art. 26 do CDC. Equipamentos não retirados em 90 dias estarão sujeitos a taxa de guarda."
                        className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 resize-none focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Termos de Rodapé na Entrega / Baixa (Quitação & Recebimento)
                      </label>
                      <textarea
                        rows={2}
                        value={receiptDeliveryFooter}
                        onChange={e => setReceiptDeliveryFooter(e.target.value)}
                        placeholder="Ex: Declaro que retirei o equipamento testado, conferido e em perfeitas condições de funcionamento."
                        className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 resize-none focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white gap-2 rounded-xl h-10 px-5 shadow-md shadow-emerald-600/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>Salvar Configurações de Impressão</span>
                  </Button>
                </div>
              </form>

              {/* RIGHT COLUMN: Live Interactive Thermal Preview Studio (5 Cols) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Pré-visualização Térmica em Tempo Real
                    </h4>
                  </div>

                  {/* Preview Mode Switcher */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('entrada')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        previewTab === 'entrada'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      Entrada (OS)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('entrega')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        previewTab === 'entrega'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      Entrega (Baixa)
                    </button>
                  </div>
                </div>

                {/* Thermal Preview Paper Container */}
                <div className="bg-slate-100 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[780px] overflow-y-auto flex flex-col items-center shadow-inner">
                  {/* Paper Strip */}
                  <div 
                    style={{ 
                      width: printerPaperWidth === '58mm' ? '280px' : '360px',
                      maxWidth: '100%' 
                    }}
                    className={`bg-white text-black p-4 font-mono shadow-2xl border border-slate-300 rounded-sm ${
                      printerFontSize === 'compact' ? 'text-[9px] leading-tight' : printerFontSize === 'large' ? 'text-[12px] leading-snug' : 'text-[10px] leading-tight'
                    }`}
                  >
                    {/* Render Function for 1 Copy */}
                    {previewTab === 'entrada' ? (
                      <>
                        {/* 1ª VIA (EMPRESA / OFICINA ou ÚNICA) */}
                        <div className={printerDensity === 'compact' ? 'space-y-1.5' : 'space-y-2.5'}>
                          <div className="text-center font-bold text-[9px] bg-black text-white py-0.5 px-1 uppercase tracking-widest">
                            {printEntryCopies === 2 ? '1ª VIA - ESTABELECIMENTO / OFICINA' : 'VIA ÚNICA / CLIENTE'}
                          </div>

                          {/* Header */}
                          <div className="text-center border-b border-dashed border-black pb-1.5 space-y-0.5">
                            <h4 className="font-black text-xs uppercase">{tradeName || 'SUPREME RECARGAS'}</h4>
                            {receiptHeader && <p className="text-[8.5px] font-bold">{receiptHeader}</p>}
                            {showCompanyCnpj && cnpj && <p className="text-[8.5px]">CNPJ: {cnpj}</p>}
                            {showCompanyContact && (companyPhone || companyWhatsapp) && (
                              <p className="text-[8.5px]">
                                {companyPhone && `Tel: ${companyPhone}`} {companyWhatsapp && `• Whats: ${companyWhatsapp}`}
                              </p>
                            )}
                            {showCompanyAddress && companyAddress && (
                              <p className="text-[8px] text-gray-700">{companyAddress} - {companyCity || 'SP'}</p>
                            )}
                          </div>

                          {/* Order & Customer Info */}
                          <div className="border-b border-dashed border-black pb-1.5 space-y-0.5 text-[9px]">
                            <div className="flex justify-between font-bold">
                              <span>ORDEM DE SERVIÇO:</span>
                              <span>#2026-000142</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Data / Hora:</span>
                              <span>{formatDateTime(new Date().toISOString())}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Atendente:</span>
                              <span>{currentUser.full_name || 'Balcão'}</span>
                            </div>
                            {showTechnicianOnReceipt && (
                              <div className="flex justify-between">
                                <span>Técnico Responsável:</span>
                                <span>Técnico Roberto</span>
                              </div>
                            )}
                            <div className="pt-1 font-bold">
                              <span>CLIENTE: Advocacia Pinheiro & Ass.</span>
                            </div>
                            <div>
                              <span>Telefone: (11) 98765-4321</span>
                            </div>
                          </div>

                          {/* Items List */}
                          <div className="border-b border-dashed border-black pb-1.5 space-y-1.5">
                            <div className="font-bold uppercase text-[9px]">ITENS DA COMANDA (2):</div>
                            <div className="space-y-0.5">
                              <div className="flex justify-between font-bold">
                                <span>#1 HP 664 Tricolor XL</span>
                                {showPricesOnReceipt && <span>R$ 35,00</span>}
                              </div>
                              <div className="flex justify-between text-[8.5px] text-gray-700">
                                <span>Serial / S/N:</span>
                                <span className="font-bold">HP-664-9921</span>
                              </div>
                              {showReportedIssueOnReceipt && (
                                <div className="text-[8px] text-gray-600 italic">Defeito: Falhando cor magenta</div>
                              )}
                              {showChecklistOnReceipt && (
                                <div className="text-[8px] text-gray-700">Checklist: [X] Circuito OK  [X] Tampa OK</div>
                              )}
                            </div>

                            <div className="space-y-0.5 pt-1 border-t border-dotted border-gray-400">
                              <div className="flex justify-between font-bold">
                                <span>#2 Notebook Dell Latitude 3470</span>
                                {showPricesOnReceipt && <span>R$ 180,00</span>}
                              </div>
                              <div className="flex justify-between text-[8.5px] text-gray-700">
                                <span>Serial:</span>
                                <span className="font-bold">DELL-8831-SP</span>
                              </div>
                              {showAccessoriesOnReceipt && (
                                <div className="text-[8px] text-gray-600">Acessórios: Fonte original + Cabo</div>
                              )}
                            </div>
                          </div>

                          {/* Values */}
                          {showPricesOnReceipt && (
                            <div className="border-b border-dashed border-black pb-1.5 space-y-0.5 text-[9.5px]">
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>R$ 215,00</span>
                              </div>
                              <div className="flex justify-between text-gray-700">
                                <span>Desconto:</span>
                                <span>- R$ 15,00</span>
                              </div>
                              <div className="flex justify-between font-black text-[11px] pt-1 border-t border-dotted border-black">
                                <span>TOTAL:</span>
                                <span>R$ 200,00</span>
                              </div>
                            </div>
                          )}

                          {/* Signatures for Store Copy */}
                          {showCustomerSignatureLine && (
                            <div className="pt-2 text-center space-y-1">
                              <div className="w-4/5 mx-auto border-b border-black"></div>
                              <p className="text-[8px]">Assinatura do Cliente</p>
                            </div>
                          )}
                        </div>

                        {/* If 2 Vias: Render Cut Line + 2ª Via Cliente */}
                        {printEntryCopies === 2 && (
                          <div className="my-4 pt-3 border-t-2 border-dashed border-slate-400 relative text-center">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[8px] font-bold uppercase tracking-wider mb-3">
                              <Scissors className="w-3 h-3" />
                              <span>DESTACAR AQUI / CORTE DA BOBINA</span>
                            </div>

                            {/* 2ª VIA - CLIENTE */}
                            <div className={printerDensity === 'compact' ? 'space-y-1.5 text-left' : 'space-y-2.5 text-left'}>
                              <div className="text-center font-bold text-[9px] bg-black text-white py-0.5 px-1 uppercase tracking-widest">
                                2ª VIA - CLIENTE (COMPROVANTE)
                              </div>

                              {/* Header 2ª Via */}
                              <div className="text-center border-b border-dashed border-black pb-1.5 space-y-0.5">
                                <h4 className="font-black text-xs uppercase">{tradeName || 'SUPREME RECARGAS'}</h4>
                                {receiptHeader && <p className="text-[8.5px] font-bold">{receiptHeader}</p>}
                                {showCompanyContact && (companyPhone || companyWhatsapp) && (
                                  <p className="text-[8.5px]">Tel: {companyPhone} • Whats: {companyWhatsapp}</p>
                                )}
                              </div>

                              {/* Order & Customer */}
                              <div className="border-b border-dashed border-black pb-1.5 space-y-0.5 text-[9px]">
                                <div className="flex justify-between font-bold">
                                  <span>ORDEM DE SERVIÇO:</span>
                                  <span>#2026-000142</span>
                                </div>
                                <div><span>CLIENTE: Advocacia Pinheiro</span></div>
                              </div>

                              {/* QR Code Online Tracking */}
                              {showQrCodeOnReceipt && (
                                <div className="py-2 text-center border-b border-dashed border-black space-y-1">
                                  <p className="font-bold text-[8.5px] uppercase">CONSULTE O STATUS PELO CELULAR:</p>
                                  {previewQrUrl ? (
                                    <img src={previewQrUrl} alt="QR Code" className="w-20 h-20 mx-auto my-1 border border-black p-0.5" />
                                  ) : (
                                    <div className="w-20 h-20 bg-gray-200 mx-auto flex items-center justify-center text-[8px]">QR Code</div>
                                  )}
                                  <p className="text-[7.5px] font-mono">Token: TRK-DEMO-2026</p>
                                </div>
                              )}

                              {/* Legal Footer Terms */}
                              <div className="text-center text-[7.5px] text-gray-700 leading-snug pt-1">
                                {receiptFooter || 'Garantia legal de 90 dias conforme Art. 26 do CDC. Equipamentos não retirados em 90 dias serão considerados abandonados.'}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* PREVIEW DA FINALIZAÇÃO / BAIXA / ENTREGA */
                      <div className={printerDensity === 'compact' ? 'space-y-1.5' : 'space-y-2.5'}>
                        <div className="text-center font-bold text-[9px] bg-emerald-700 text-white py-0.5 px-1 uppercase tracking-widest">
                          {printDeliveryCopies === 2 ? '1ª VIA - RECIBO DE QUITAÇÃO (LOJA)' : 'COMPROVANTE DE ENTREGA & QUITAÇÃO'}
                        </div>

                        <div className="text-center border-b border-dashed border-black pb-1.5 space-y-0.5">
                          <h4 className="font-black text-xs uppercase">{tradeName || 'SUPREME RECARGAS'}</h4>
                          <p className="text-[8.5px] font-bold">COMPROVANTE DE SAÍDA E RETIRADA</p>
                        </div>

                        <div className="border-b border-dashed border-black pb-1.5 space-y-0.5 text-[9px]">
                          <div className="flex justify-between font-bold">
                            <span>ORDEM DE SERVIÇO:</span>
                            <span>#2026-000142</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Data da Retirada:</span>
                            <span>{formatDateTime(new Date().toISOString())}</span>
                          </div>
                          <div><span>Cliente: Advocacia Pinheiro & Ass.</span></div>
                        </div>

                        {/* Financial Settlement */}
                        <div className="border-b border-dashed border-black pb-1.5 space-y-0.5 text-[9.5px]">
                          <div className="flex justify-between">
                            <span>Valor Total Liquidado:</span>
                            <span className="font-bold">R$ 200,00</span>
                          </div>
                          <div className="flex justify-between text-gray-700">
                            <span>Forma de Pagamento:</span>
                            <span className="font-bold">PIX / Dinheiro</span>
                          </div>
                          <div className="flex justify-between text-emerald-800 font-bold text-[10px] pt-1">
                            <span>STATUS:</span>
                            <span>PAGO & ENTREGUE</span>
                          </div>
                        </div>

                        {/* Delivery Statement */}
                        <div className="text-center text-[8px] text-gray-800 italic leading-snug py-1">
                          {receiptDeliveryFooter || 'Declaro que retirei o equipamento testado, conferido e em perfeitas condições de funcionamento.'}
                        </div>

                        {/* Customer Signature */}
                        <div className="pt-3 text-center space-y-1">
                          <div className="w-4/5 mx-auto border-b border-black"></div>
                          <p className="text-[8px]">Assinatura do Recebedor</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span>Largura selecionada: <strong>{printerPaperWidth}</strong></span>
                  <Link href="/impressao">
                    <span className="text-emerald-600 hover:underline font-bold">Abrir Emissor Completo →</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
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
                  <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Telefone / Whats</label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 98888-0000" className="text-xs rounded-xl" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Grupo de Permissões Inicial *</label>
                <Select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="text-xs rounded-xl">
                  {permissionGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.default_role})</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Senha Provisória</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="123456" className="text-xs rounded-xl" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)} className="rounded-xl text-xs">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs">
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingGroup ? `Editar Grupo: ${editingGroup.name}` : 'Criar Novo Grupo de Permissões'}
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setShowGroupModal(false)} className="h-8 w-8 p-0 text-slate-400">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Nome do Grupo *</label>
                  <Input required value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Ex: Técnicos Nível 2" className="text-xs rounded-xl" />
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Função Base Herdada *</label>
                  <Select value={groupDefaultRole} onChange={e => setGroupDefaultRole(e.target.value as any)} className="text-xs rounded-xl">
                    <option value="ATENDENTE">Atendente</option>
                    <option value="TECNICO">Técnico</option>
                    <option value="ADMINISTRADOR">Administrador</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Descrição do Grupo</label>
                <Input value={groupDescription} onChange={e => setGroupDescription(e.target.value)} placeholder="Ex: Acesso total à oficina com restrição financeira" className="text-xs rounded-xl" />
              </div>

              {/* Limite de Desconto Padrão do Grupo */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Limite Máximo de Desconto Padrão do Grupo (%)
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    {groupMaxDiscount}% Máx
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Desconto percentual padrão permitido para usuários deste grupo no momento da baixa/entrega.
                </p>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={groupMaxDiscount}
                  onChange={e => setGroupMaxDiscount(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="h-8 text-xs font-bold rounded-lg"
                  placeholder="Ex: 10"
                />
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Permissões Habilitadas para este Grupo ({AVAILABLE_PERMISSIONS.filter(p => Boolean(groupPermissions[p.key])).length} ativas):
                  </span>
                  <div className="flex gap-2 text-[11px]">
                    <button type="button" onClick={() => handleSelectAllGroupPermissions(true)} className="text-emerald-600 hover:underline font-semibold">Marcar Todas</button>
                    <span className="text-slate-300">|</span>
                    <button type="button" onClick={() => handleSelectAllGroupPermissions(false)} className="text-slate-400 hover:underline">Desmarcar</button>
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(['Balcão', 'Oficina', 'Gestão'] as const).map(cat => (
                    <div key={cat} className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 pt-1">
                        {cat}
                      </div>
                      {AVAILABLE_PERMISSIONS.filter(p => p.category === cat).map(p => (
                        <label key={p.key} className="flex items-start gap-2.5 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs cursor-pointer hover:bg-slate-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={Boolean(groupPermissions[p.key])}
                            onChange={() => toggleGroupPermission(p.key)}
                            className="mt-0.5 w-3.5 h-3.5 text-emerald-600 rounded"
                          />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{p.label}</span>
                            <p className="text-[10px] text-slate-400">{p.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowGroupModal(false)} className="rounded-xl text-xs">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs">
                  {editingGroup ? 'Salvar Alterações' : 'Criar Grupo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTAR PERMISSÕES INDIVIDUAIS DO USUÁRIO */}
      {showPermissionsModal && editingUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Permissões de {editingUser.full_name}
                </h3>
                <p className="text-xs text-slate-500">
                  Grupo base: <strong>{getGroupNameForUser(editingUser)}</strong> ({editingUser.role})
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowPermissionsModal(false)} className="h-8 w-8 p-0 text-slate-400">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <p className="text-xs text-slate-500">
                Você pode conceder ou revogar permissões e ajustar o limite de desconto deste colaborador:
              </p>

              {/* Limite de Desconto Individual */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Limite Máximo de Desconto deste Usuário (%)
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    {userMaxDiscount}% Máx
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Sobrescreve o limite do grupo apenas para este usuário específico na baixa de comandas.
                </p>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={userMaxDiscount}
                  onChange={e => setUserMaxDiscount(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="h-8 text-xs font-bold rounded-lg"
                  placeholder="Ex: 15"
                />
              </div>

              <div className="space-y-2">
                {(['Balcão', 'Oficina', 'Gestão'] as const).map(cat => (
                  <div key={cat} className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 pt-1">
                      {cat}
                    </div>
                    {AVAILABLE_PERMISSIONS.filter(p => p.category === cat).map(p => (
                      <label key={p.key} className="flex items-start gap-2.5 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={Boolean(userPermissions[p.key])}
                          onChange={() => togglePermission(p.key)}
                          className="mt-0.5 w-3.5 h-3.5 text-emerald-600 rounded"
                        />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{p.label}</span>
                          <p className="text-[10px] text-slate-400">{p.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPermissionsModal(false)} className="rounded-xl text-xs">
                Cancelar
              </Button>
              <Button type="button" size="sm" onClick={handleSavePermissions} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs">
                Salvar Permissões
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESETAR SENHA DO USUÁRIO */}
      {userToResetPass && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Redefinir Senha de Acesso</span>
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setUserToResetPass(null)} className="h-7 w-7 p-0 text-slate-400">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <p className="text-xs text-slate-500">
                Defina uma nova senha para o usuário <strong>{userToResetPass.full_name}</strong> ({userToResetPass.email}):
              </p>

              <div>
                <label className="text-xs font-semibold mb-1 block text-slate-700 dark:text-slate-300">Nova Senha</label>
                <Input
                  type="password"
                  required
                  value={adminNewPass}
                  onChange={e => setAdminNewPass(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="text-xs rounded-xl"
                />
              </div>

              {resetSuccess && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Senha redefinida com sucesso!</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setUserToResetPass(null)} className="rounded-xl text-xs">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs">
                  Redefinir Senha
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompanySettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Carregando configurações...</div>}>
      <CompanySettingsContent />
    </Suspense>
  );
}
