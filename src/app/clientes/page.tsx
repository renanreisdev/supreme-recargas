'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  PlusCircle, 
  CheckCircle2, 
  X, 
  Edit3, 
  Phone, 
  Building2, 
  User, 
  Mail, 
  ShieldAlert,
  MessageSquare,
  Sparkles,
  FileText,
  Upload,
  Download,
  UserX,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { Customer } from '@/types';
import { formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DialogModal, DialogModalProps } from '@/components/ui/dialog-modal';

import { toast } from '@/lib/toast';

export default function CustomersPage() {
  const { currentCompany, currentUser, hasPermission } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [settings, setSettings] = useState(AppStore.getSettings(currentCompany.id));
  const [dialogModal, setDialogModal] = useState<DialogModalProps | null>(null);

  // CSV Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importFileName, setImportFileName] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneIsWhatsapp, setPhoneIsWhatsapp] = useState(true);
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [secondaryPhoneIsWhatsapp, setSecondaryPhoneIsWhatsapp] = useState(false);
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [notes, setNotes] = useState('');

  const canCreate = hasPermission('create_customer');
  const canEdit = hasPermission('edit_customer');
  const isDocRequired = settings.require_customer_document ?? false;

  const loadData = () => {
    const custs = AppStore.getCustomers(currentCompany.id);
    const sets = AppStore.getSettings(currentCompany.id);
    setCustomers(custs);
    setSettings(sets);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, [currentCompany.id]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.secondary_phone && c.secondary_phone.includes(searchTerm)) ||
    (c.whatsapp && c.whatsapp.includes(searchTerm)) ||
    (c.document && c.document.includes(searchTerm)) ||
    (c.company_name && c.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.internal_code.toString().includes(searchTerm)
  );

  const handleOpenCreate = () => {
    setEditingCustomerId(null);
    setName('');
    setPhone('');
    setPhoneIsWhatsapp(true);
    setSecondaryPhone('');
    setSecondaryPhoneIsWhatsapp(false);
    setDocument('');
    setEmail('');
    setCompanyName('');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    if (!canEdit) {
      setDialogModal({
        isOpen: true,
        type: 'warning',
        title: 'Permissão Insuficiente',
        message: 'Seu perfil não possui permissão para editar dados de clientes. Solicite ao administrador.',
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
      return;
    }
    setEditingCustomerId(customer.id);
    setName(customer.name || '');
    setPhone(customer.phone || '');
    setPhoneIsWhatsapp(customer.phone_is_whatsapp ?? (customer.whatsapp ? customer.whatsapp.replace(/\D/g, '') === (customer.phone || '').replace(/\D/g, '') : true));
    setSecondaryPhone(customer.secondary_phone || '');
    setSecondaryPhoneIsWhatsapp(customer.secondary_phone_is_whatsapp ?? (customer.whatsapp && customer.secondary_phone ? customer.whatsapp.replace(/\D/g, '') === customer.secondary_phone.replace(/\D/g, '') : false));
    setDocument(customer.document || '');
    setEmail(customer.email || '');
    setCompanyName(customer.company_name || '');
    setNotes(customer.notes || '');
    setShowModal(true);
  };

  const handleAnonymizeCustomer = (customer: Customer) => {
    if (customer.is_anonymized) {
      toast.info('Este titular já foi anonimizado conforme a LGPD.');
      return;
    }
    setDialogModal({
      isOpen: true,
      type: 'danger',
      title: 'Anonimizar Titular (LGPD)',
      message: `Atenção: A anonimização dos dados de "${customer.name}" é uma ação IRREVERSÍVEL exigida pelo Art. 18 da LGPD. Nome, documento, telefone, e-mail e endereço serão suprimidos, preservando o histórico financeiro e operacional da loja. Deseja prosseguir?`,
      confirmLabel: 'Sim, Anonimizar Titular',
      cancelLabel: 'Cancelar',
      onConfirm: () => {
        try {
          AppStore.anonymizeCustomer(customer.id, currentUser?.full_name);
          loadData();
          setDialogModal(null);
          toast.success('Titular anonimizado com sucesso em conformidade com a LGPD.');
        } catch (err: any) {
          toast.error(err?.message || 'Erro ao anonimizar titular.');
        }
      },
      onCancel: () => setDialogModal(null)
    });
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'Nome;Telefone;Documento_CPF_CNPJ;Email;Empresa_RazaoSocial;Observacoes\n' +
      'João da Silva;(11) 98765-4321;123.456.789-00;joao@email.com;Silva Informática;Cliente antigo de recargas\n' +
      'Maria Souza;(21) 99888-7766;987.654.321-11;maria@exemplo.com;;Retira sempre às sextas\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_importacao_clientes_supreme.csv');
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        toast.error('O arquivo selecionado está vazio ou não possui linhas de dados.');
        return;
      }
      const delimiter = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
      
      const parsed: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const rawValues = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
        if (rawValues.length === 0 || rawValues.every(v => !v)) continue;
        const row: any = {};
        headers.forEach((h, idx) => {
          row[h] = rawValues[idx] || '';
        });
        
        const nameVal = row['nome'] || row['name'] || row['cliente'] || rawValues[0] || '';
        const phoneVal = row['telefone'] || row['fone'] || row['celular'] || row['phone'] || rawValues[1] || '';
        const docVal = row['documento_cpf_cnpj'] || row['documento'] || row['cpf'] || row['cnpj'] || rawValues[2] || '';
        const emailVal = row['email'] || row['e-mail'] || rawValues[3] || '';
        const companyVal = row['empresa_razaosocial'] || row['empresa'] || row['razao_social'] || rawValues[4] || '';
        const notesVal = row['observacoes'] || row['obs'] || row['notes'] || rawValues[5] || '';

        if (nameVal && phoneVal) {
          parsed.push({
            name: nameVal,
            phone: phoneVal,
            document: docVal,
            email: emailVal,
            company_name: companyVal,
            notes: notesVal
          });
        }
      }

      setCsvRows(parsed);
      if (parsed.length === 0) {
        toast.error('Nenhum registro válido com Nome e Telefone foi encontrado no arquivo.');
      } else {
        toast.info(`${parsed.length} cliente(s) identificado(s) no arquivo.`);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleExecuteImport = async () => {
    if (csvRows.length === 0) return;
    setIsImporting(true);
    let successCount = 0;
    try {
      for (const item of csvRows) {
        AppStore.addCustomer({
          tenant_id: currentCompany.id,
          name: item.name,
          phone: item.phone,
          phone_is_whatsapp: true,
          document: item.document,
          email: item.email,
          company_name: item.company_name,
          notes: item.notes
        }, currentUser?.full_name || 'Importador CSV');
        successCount++;
      }
      loadData();
      setShowImportModal(false);
      setCsvRows([]);
      setImportFileName('');
      toast.success(`${successCount} cliente(s) importado(s) com sucesso para a base!`);
    } catch (err: any) {
      toast.error(err?.message || 'Erro durante a importação.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setDialogModal({
        isOpen: true,
        type: 'warning',
        title: 'Campos Obrigatórios',
        message: 'Por favor, informe ao menos o Nome e o Telefone Principal do cliente.',
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
      return;
    }

    if (isDocRequired && !document.trim()) {
      setDialogModal({
        isOpen: true,
        type: 'warning',
        title: 'Documento Obrigatório',
        subtitle: 'Política cadastral da empresa',
        message: 'Pela política da empresa, o campo CPF ou CNPJ é obrigatório para cadastrar ou editar clientes.',
        isAlertOnly: true,
        confirmLabel: 'Entendido',
        onConfirm: () => setDialogModal(null)
      });
      return;
    }

    const primaryClean = phone.trim();
    const secondaryClean = secondaryPhone.trim();
    const effectiveWhatsapp = phoneIsWhatsapp 
      ? primaryClean 
      : (secondaryPhoneIsWhatsapp ? secondaryClean : '');

    try {
      if (editingCustomerId) {
        if (!canEdit) {
          setDialogModal({
            isOpen: true,
            type: 'warning',
            title: 'Permissão Insuficiente',
            message: 'Você não tem permissão para editar clientes.',
            isAlertOnly: true,
            confirmLabel: 'Entendido',
            onConfirm: () => setDialogModal(null)
          });
          return;
        }

        AppStore.updateCustomer(editingCustomerId, {
          name: name.trim(),
          phone: primaryClean,
          phone_is_whatsapp: phoneIsWhatsapp,
          secondary_phone: secondaryClean,
          secondary_phone_is_whatsapp: secondaryPhoneIsWhatsapp,
          whatsapp: effectiveWhatsapp,
          document: document.trim(),
          email: email.trim(),
          company_name: companyName.trim(),
          notes: notes.trim()
        }, currentUser?.full_name || 'Atendente');

        toast.success(`Dados do cliente "${name.trim()}" atualizados com sucesso!`);
      } else {
        if (!canCreate) {
          setDialogModal({
            isOpen: true,
            type: 'warning',
            title: 'Permissão Insuficiente',
            message: 'Você não tem permissão para cadastrar novos clientes.',
            isAlertOnly: true,
            confirmLabel: 'Entendido',
            onConfirm: () => setDialogModal(null)
          });
          return;
        }

        AppStore.addCustomer({
          tenant_id: currentCompany.id,
          name: name.trim(),
          phone: primaryClean,
          phone_is_whatsapp: phoneIsWhatsapp,
          secondary_phone: secondaryClean,
          secondary_phone_is_whatsapp: secondaryPhoneIsWhatsapp,
          whatsapp: effectiveWhatsapp,
          document: document.trim(),
          email: email.trim(),
          company_name: companyName.trim(),
          notes: notes.trim()
        }, currentUser?.full_name || 'Atendente');

        toast.success(`Cliente "${name.trim()}" cadastrado com sucesso!`);
      }

      loadData();
      setShowModal(false);
      setName('');
      setPhone('');
      setPhoneIsWhatsapp(true);
      setSecondaryPhone('');
      setSecondaryPhoneIsWhatsapp(false);
      setDocument('');
      setEmail('');
      setCompanyName('');
      setNotes('');
      setEditingCustomerId(null);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar cliente.');
    }
  };

  const whatsappCount = customers.filter(c => c.phone_is_whatsapp || c.secondary_phone_is_whatsapp || c.whatsapp).length;
  const companiesCount = customers.filter(c => c.company_name || (c.document && c.document.length > 14)).length;

  return (
    <div className="space-y-6">
      {/* Global Dialog Modal */}
      {dialogModal && <DialogModal {...dialogModal} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0e1626] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              Cadastro & Gestão de Clientes
            </h1>
            <Badge className="bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px] border border-emerald-500/30">
              {customers.length} Total
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Base de clientes da <strong className="text-slate-800 dark:text-slate-200">{currentCompany.trade_name}</strong> com histórico de contatos e WhatsApp
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Buscar por nome, fone, CPF/CNPJ ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 h-10 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100 font-medium"
            />
          </div>

          {canCreate && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowImportModal(true)}
                className="text-xs font-semibold gap-1.5 h-10 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 shadow-xs"
                title="Importar lista de clientes via planilha CSV"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Importar CSV</span>
              </Button>

              <Button 
                onClick={handleOpenCreate} 
                className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs gap-1.5 shadow-md shadow-emerald-950/30 text-white shrink-0 h-10 rounded-xl px-4"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Novo Cliente</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Customer Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total de Cadastros</span>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{customers.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Clientes ativos</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Contatos com WhatsApp</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{whatsappCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Prontos para notificação</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Pessoas Jurídicas / Empresas</span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{companiesCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Contas corporativas</p>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-[#0e1626] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 font-bold text-slate-500">
                <th className="p-3.5">Cód</th>
                <th className="p-3.5">Nome / Razão Social</th>
                <th className="p-3.5">CPF / CNPJ</th>
                <th className="p-3.5">Telefones & WhatsApp</th>
                <th className="p-3.5">E-mail</th>
                <th className="p-3.5">Cadastrado em</th>
                <th className="p-3.5">Observações</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredCustomers.map(cust => (
                <tr key={cust.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="p-3.5 font-mono text-slate-400 font-bold">#{cust.internal_code}</td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{cust.name}</div>
                    {cust.company_name && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{cust.company_name}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{cust.document || '-'}</td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                      <span>{cust.phone}</span>
                      {cust.phone_is_whatsapp && (
                        <a
                          href={`https://wa.me/55${cust.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-lg text-[10px] font-bold transition-colors border border-emerald-200 dark:border-emerald-800"
                          title="Conversar no WhatsApp (Principal)"
                        >
                          <MessageSquare className="w-3 h-3" /> WhatsApp
                        </a>
                      )}
                    </div>
                    {cust.secondary_phone && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span>{cust.secondary_phone}</span>
                        {cust.secondary_phone_is_whatsapp && (
                          <a
                            href={`https://wa.me/55${cust.secondary_phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-lg text-[10px] font-bold transition-colors border border-emerald-200 dark:border-emerald-800"
                            title="Conversar no WhatsApp (Secundário)"
                          >
                            <MessageSquare className="w-3 h-3" /> WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-500">{cust.email || '-'}</td>
                  <td className="p-3.5 text-slate-500">{formatDate(cust.created_at)}</td>
                  <td className="p-3.5 text-slate-500 truncate max-w-xs">{cust.notes || '-'}</td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {cust.is_anonymized ? (
                        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
                          Anonimizado LGPD
                        </Badge>
                      ) : (
                        <>
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEdit(cust)}
                              className="h-8 text-xs px-2.5 gap-1.5 font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-400 border-slate-200 dark:border-slate-700 rounded-xl"
                              title="Editar cliente"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Editar</span>
                            </Button>
                          )}
                          {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMINISTRADOR') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAnonymizeCustomer(cust)}
                              className="h-8 text-xs px-2 gap-1 font-semibold text-slate-400 hover:text-rose-600 hover:border-rose-400 border-slate-200 dark:border-slate-800 rounded-xl"
                              title="Anonimizar dados pessoais deste titular conforme Art. 18 da LGPD"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">LGPD</span>
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Nenhum cliente encontrado com os filtros informados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Create & Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#0e1626] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>{editingCustomerId ? 'Editar Dados do Cliente' : 'Cadastrar Novo Cliente'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {editingCustomerId ? 'Altere as informações de contato e identificação' : 'Preencha os dados de contato do cliente'}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowModal(false)} className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold mb-1.5 flex items-center text-slate-700 dark:text-slate-300">
                  <span>Nome Completo / Razão Social</span>
                  <span className="text-red-500 font-bold ml-1">*</span>
                </label>
                <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Nome do cliente" className="h-10 rounded-xl text-xs" />
              </div>

              {/* Telefone Principal & Telefone Secundário com Checkboxes de WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
                      <span>Telefone Principal</span>
                      <span className="text-red-500 font-bold ml-1">*</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-emerald-600 dark:text-emerald-400 select-none hover:text-emerald-700">
                      <input
                        type="checkbox"
                        checked={phoneIsWhatsapp}
                        onChange={(e) => setPhoneIsWhatsapp(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                      />
                      <span>É WhatsApp</span>
                    </label>
                  </div>
                  <Input 
                    required 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="(11) 99999-9999" 
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Telefone Secundário
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-emerald-600 dark:text-emerald-400 select-none hover:text-emerald-700">
                      <input
                        type="checkbox"
                        checked={secondaryPhoneIsWhatsapp}
                        onChange={(e) => setSecondaryPhoneIsWhatsapp(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                      />
                      <span>É WhatsApp</span>
                    </label>
                  </div>
                  <Input 
                    value={secondaryPhone} 
                    onChange={e => setSecondaryPhone(e.target.value)} 
                    placeholder="(11) 98888-8888 (Opcional)" 
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold mb-1.5 flex items-center text-slate-700 dark:text-slate-300">
                    <span>CPF ou CNPJ</span>
                    {isDocRequired ? (
                      <span className="text-red-500 font-bold ml-1">* (Obrigatório)</span>
                    ) : (
                      <span className="text-slate-400 font-normal ml-1 text-[11px]">(Opcional)</span>
                    )}
                  </label>
                  <Input 
                    required={isDocRequired}
                    value={document} 
                    onChange={e => setDocument(e.target.value)} 
                    placeholder={isDocRequired ? "000.000.000-00 (Obrigatório)" : "000.000.000-00 (Opcional)"} 
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1.5 block text-slate-700 dark:text-slate-300">Empresa / Nome Fantasia</label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex: Marmoraria Silva" className="h-10 rounded-xl text-xs" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold mb-1.5 block text-slate-700 dark:text-slate-300">E-mail</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com" className="h-10 rounded-xl text-xs" />
              </div>

              <div>
                <label className="text-xs font-bold mb-1.5 block text-slate-700 dark:text-slate-300">Observações Gerais</label>
                <textarea
                  className="w-full h-20 p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100 font-medium"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Informações adicionais, endereço ou restrições do cliente..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="rounded-xl h-10 px-4 text-xs">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-xl h-10 px-5 text-xs shadow-xs">
                  {editingCustomerId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0e1626] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Importação de Clientes em Massa (CSV)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Importe centenas de cadastros existentes para a loja em segundos
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowImportModal(false); setCsvRows([]); setImportFileName(''); }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 gap-3">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Precisa do modelo padrão?</p>
                  <p>Baixe a planilha de exemplo com as colunas corretas preenchidas.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="gap-1.5 text-xs rounded-xl h-9 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Baixar Modelo CSV</span>
                </Button>
              </div>

              {/* Upload Input Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Selecione o arquivo CSV
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleCsvFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-500/20 file:cursor-pointer cursor-pointer border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              {/* Preview Table */}
              {csvRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Pré-visualização: {csvRows.length} cliente(s) pronto(s) para importar
                    </span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                      Válido
                    </Badge>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 font-bold text-slate-600 dark:text-slate-400">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Nome</th>
                          <th className="p-2">Telefone</th>
                          <th className="p-2">Documento</th>
                          <th className="p-2">E-mail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {csvRows.slice(0, 50).map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <td className="p-2 text-slate-400">{i + 1}</td>
                            <td className="p-2 font-bold text-slate-900 dark:text-slate-100">{r.name}</td>
                            <td className="p-2">{r.phone}</td>
                            <td className="p-2 font-mono text-slate-500">{r.document || '-'}</td>
                            <td className="p-2 text-slate-500">{r.email || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvRows.length > 50 && (
                    <p className="text-[10px] text-slate-400 text-center italic">
                      + {csvRows.length - 50} clientes adicionais serão importados
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowImportModal(false); setCsvRows([]); setImportFileName(''); }}
                className="rounded-xl h-10 px-4 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting || csvRows.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-xl h-10 px-5 text-xs shadow-xs gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isImporting ? 'Importando...' : `Confirmar Importação (${csvRows.length})`}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
