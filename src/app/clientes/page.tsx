'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, PlusCircle, CheckCircle2, X, Edit3, Phone, Building2, User, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { Customer } from '@/types';
import { formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function CustomersPage() {
  const { currentCompany, currentUser, hasPermission } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [settings, setSettings] = useState(AppStore.getSettings(currentCompany.id));

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
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
  }, [currentCompany.id]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.whatsapp && c.whatsapp.includes(searchTerm)) ||
    (c.document && c.document.includes(searchTerm)) ||
    (c.company_name && c.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.internal_code.toString().includes(searchTerm)
  );

  const handleOpenCreate = () => {
    setEditingCustomerId(null);
    setName('');
    setPhone('');
    setWhatsapp('');
    setDocument('');
    setEmail('');
    setCompanyName('');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    if (!canEdit) {
      alert('Seu perfil não possui permissão para editar dados de clientes. Solicite ao administrador.');
      return;
    }
    setEditingCustomerId(customer.id);
    setName(customer.name || '');
    setPhone(customer.phone || '');
    setWhatsapp(customer.whatsapp || '');
    setDocument(customer.document || '');
    setEmail(customer.email || '');
    setCompanyName(customer.company_name || '');
    setNotes(customer.notes || '');
    setShowModal(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Por favor, informe ao menos o Nome e o Telefone do cliente.');
      return;
    }

    if (isDocRequired && !document.trim()) {
      alert('Pela política da empresa, o campo CPF ou CNPJ é obrigatório para cadastrar ou editar clientes.');
      return;
    }

    try {
      if (editingCustomerId) {
        if (!canEdit) {
          alert('Você não tem permissão para editar clientes.');
          return;
        }

        AppStore.updateCustomer(editingCustomerId, {
          name: name.trim(),
          phone: phone.trim(),
          whatsapp: (whatsapp || phone).trim(),
          document: document.trim(),
          email: email.trim(),
          company_name: companyName.trim(),
          notes: notes.trim()
        }, currentUser?.full_name || 'Atendente');

        setSuccessMessage('Dados do cliente atualizados com sucesso!');
      } else {
        if (!canCreate) {
          alert('Você não tem permissão para cadastrar novos clientes.');
          return;
        }

        AppStore.addCustomer({
          tenant_id: currentCompany.id,
          name: name.trim(),
          phone: phone.trim(),
          whatsapp: (whatsapp || phone).trim(),
          document: document.trim(),
          email: email.trim(),
          company_name: companyName.trim(),
          notes: notes.trim()
        }, currentUser?.full_name || 'Atendente');

        setSuccessMessage('Cliente cadastrado com sucesso na base de dados!');
      }

      loadData();
      setShowModal(false);
      setName('');
      setPhone('');
      setWhatsapp('');
      setDocument('');
      setEmail('');
      setCompanyName('');
      setNotes('');
      setEditingCustomerId(null);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(`Erro ao salvar cliente: ${err?.message || 'Verifique os dados informados.'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between text-emerald-800 dark:text-emerald-200 text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSuccessMessage('')} className="h-6 w-6 p-0 text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Cadastro & Gestão de Clientes</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Base de clientes da <strong className="text-slate-800 dark:text-slate-200">{currentCompany.trade_name}</strong> com histórico de serviços
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por nome, fone, CPF/CNPJ ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {canCreate && (
            <Button 
              onClick={handleOpenCreate} 
              className="bg-emerald-600 hover:bg-emerald-700 font-semibold text-xs gap-1.5 shadow-sm text-white shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cadastrar Cliente</span>
            </Button>
          )}
        </div>
      </div>

      {/* Customer List */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-lg">Código</th>
                  <th className="p-3">Nome / Razão</th>
                  <th className="p-3">CPF / CNPJ</th>
                  <th className="p-3">Telefone / WhatsApp</th>
                  <th className="p-3">E-mail</th>
                  <th className="p-3">Data Cadastro</th>
                  <th className="p-3">Observações</th>
                  <th className="p-3 rounded-r-lg text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      #{cust.internal_code}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{cust.name}</div>
                      {cust.company_name && <div className="text-[11px] text-slate-500">{cust.company_name}</div>}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">{cust.document || '-'}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      <div>{cust.phone}</div>
                      {cust.whatsapp && cust.whatsapp !== cust.phone && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Zap: {cust.whatsapp}</div>
                      )}
                    </td>
                    <td className="p-3 text-slate-500">{cust.email || '-'}</td>
                    <td className="p-3 text-slate-500">{formatDate(cust.created_at)}</td>
                    <td className="p-3 text-slate-500 truncate max-w-xs">{cust.notes || '-'}</td>
                    <td className="p-3 text-right">
                      {canEdit ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(cust)}
                          className="h-7 text-xs px-2.5 gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-400 border-slate-300 dark:border-slate-700"
                          title="Editar dados cadastrais do cliente"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Editar</span>
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Somente leitura</span>
                      )}
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
        </CardContent>
      </Card>

      {/* Customer Create & Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>{editingCustomerId ? 'Editar Dados do Cliente' : 'Cadastrar Novo Cliente'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {editingCustomerId ? 'Altere as informações de contato e identificação' : 'Preencha os dados de contato e identificação do cliente'}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowModal(false)} className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-semibold mb-1 block">Nome Completo / Razão Social *</label>
                <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Nome do cliente" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Telefone Principal *</label>
                  <Input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">WhatsApp</label>
                  <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block">
                    CPF ou CNPJ {isDocRequired ? <span className="text-rose-600 font-bold">* (Obrigatório)</span> : <span className="text-slate-400 font-normal">(Opcional)</span>}
                  </label>
                  <Input 
                    required={isDocRequired}
                    value={document} 
                    onChange={e => setDocument(e.target.value)} 
                    placeholder={isDocRequired ? "000.000.000-00 (Obrigatório)" : "000.000.000-00 (Opcional)"} 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Empresa / Nome Fantasia</label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex: Marmoraria Silva" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block">E-mail</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com" />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block">Observações Gerais</label>
                <textarea
                  className="w-full h-20 p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Informações adicionais, endereço ou restrições do cliente..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white">
                  {editingCustomerId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
