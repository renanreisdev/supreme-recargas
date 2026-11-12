'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Clock, 
  Edit3, 
  Trash2, 
  Wrench, 
  Check, 
  X, 
  PlusCircle 
} from 'lucide-react';
import { Service, ItemCategory, Company, Profile } from '@/types';
import { AppStore } from '@/lib/store';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export interface ServicesTabProps {
  services: Service[];
  categories: ItemCategory[];
  currentCompany: Company;
  currentUser: Profile | null;
  canManage: boolean;
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  showAlert: (title: string, message: string, subtitle?: string, type?: 'warning' | 'info' | 'danger') => void;
  showConfirm: (opts: {
    title: string;
    subtitle?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
}

export function ServicesTab({
  services,
  categories,
  currentCompany,
  currentUser,
  canManage,
  onRefresh,
  showToast,
  showAlert,
  showConfirm,
  isCreateOpen = false,
  onCloseCreate
}: ServicesTabProps) {
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceCode, setServiceCode] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState('50.00');
  const [serviceEstTime, setServiceEstTime] = useState('45');
  const [selectedServiceCategories, setSelectedServiceCategories] = useState<string[]>([]);

  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const handleCloseModal = () => {
    setShowServiceModal(false);
    if (onCloseCreate) onCloseCreate();
  };

  const handleOpenAddService = () => {
    setEditingServiceId(null);
    setServiceName('');
    setServiceCode('');
    setServiceDesc('');
    setServicePrice('40.00');
    setServiceEstTime('45');
    setSelectedServiceCategories(categories.map(c => c.id));
    setShowServiceModal(true);
  };

  useEffect(() => {
    if (isCreateOpen) {
      handleOpenAddService();
    }
  }, [isCreateOpen]);

  const handleOpenEditService = (srv: Service) => {
    setEditingServiceId(srv.id);
    setServiceName(srv.name);
    setServiceCode(srv.code);
    setServiceDesc(srv.description || '');
    setServicePrice(String(srv.default_price || '0.00'));
    setServiceEstTime(String(srv.estimated_time_minutes || '30'));
    setSelectedServiceCategories(srv.category_ids || categories.map(c => c.id));
    setShowServiceModal(true);
  };

  const handleRequestCloseServiceModal = () => {
    const isDirty = Boolean(serviceName.trim() || serviceDesc.trim() || serviceCode.trim());
    if (isDirty) {
      showConfirm({
        title: 'Descartar Alterações do Serviço?',
        subtitle: 'Alterações não salvas serão perdidas.',
        message: 'Você tem informações não salvas neste serviço. Tem certeza de que deseja sair sem salvar?',
        confirmLabel: 'Sim, Descartar e Sair',
        cancelLabel: 'Continuar Editando',
        type: 'danger',
        onConfirm: handleCloseModal
      });
    } else {
      handleCloseModal();
    }
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      showToast('Informe o nome do serviço.', 'error');
      return;
    }

    const payload: Partial<Service> = {
      tenant_id: currentCompany.id,
      name: serviceName.trim(),
      code: (serviceCode || serviceName.toUpperCase().replace(/\s+/g, '_')).trim(),
      description: serviceDesc.trim() || undefined,
      default_price: parseFloat(servicePrice) || 0,
      estimated_time_minutes: parseInt(serviceEstTime, 10) || 30,
      category_ids: selectedServiceCategories,
      is_active: true
    };

    try {
      if (editingServiceId) {
        AppStore.updateService(editingServiceId, payload, currentUser?.full_name || 'Admin');
        showToast(`Serviço "${serviceName}" atualizado com sucesso!`);
      } else {
        AppStore.addService(payload as any, currentUser?.full_name || 'Admin');
        showToast(`Serviço "${serviceName}" cadastrado com sucesso!`);
      }
      handleCloseModal();
      onRefresh();
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar serviço.', 'error');
    }
  };

  const handleDeleteService = (id: string, name: string) => {
    showConfirm({
      title: 'Excluir Serviço?',
      subtitle: 'Esta ação não poderá ser desfeita',
      message: `Deseja realmente excluir o serviço "${name}"?`,
      confirmLabel: 'Sim, Excluir Serviço',
      type: 'danger',
      onConfirm: () => {
        try {
          AppStore.deleteService(id, currentUser?.full_name || 'Admin');
          showToast(`Serviço "${name}" excluído.`);
          onRefresh();
        } catch (err: any) {
          showToast(err?.message || 'Erro ao excluir serviço.', 'error');
        }
      }
    });
  };

  const toggleServiceCategory = (catId: string) => {
    if (selectedServiceCategories.includes(catId)) {
      setSelectedServiceCategories(selectedServiceCategories.filter(id => id !== catId));
    } else {
      setSelectedServiceCategories([...selectedServiceCategories, catId]);
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter(srv => {
      const matchesSearch = !searchFilter.trim() || 
        srv.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
        srv.code.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesCat = categoryFilter === 'ALL' || (srv.category_ids && srv.category_ids.includes(categoryFilter));
      return matchesSearch && matchesCat;
    });
  }, [services, searchFilter, categoryFilter]);

  return (
    <div className="space-y-4">
      {/* Services Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Buscar por serviço ou código..."
            className="pl-9 text-xs"
          />
        </div>

        <Select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="text-xs"
        >
          <option value="ALL">Todas as Categorias Aplicáveis</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>

      {/* Services List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Serviço / Procedimento</th>
                <th className="p-3.5">Código</th>
                <th className="p-3.5">Categorias Vinculadas</th>
                <th className="p-3.5">Tempo Médio</th>
                <th className="p-3.5 text-right">Preço Padrão</th>
                {canManage && <th className="p-3.5 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredServices.map(srv => {
                const linkedCats = categories.filter(c => srv.category_ids?.includes(c.id));

                return (
                  <tr key={srv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{srv.name}</div>
                      {srv.description && (
                        <div className="text-[11px] text-slate-400 mt-0.5 max-w-md">{srv.description}</div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                        {srv.code}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {linkedCats.length === 0 ? (
                          <span className="text-slate-400 text-[11px]">Todas as categorias</span>
                        ) : (
                          linkedCats.map(c => (
                            <Badge key={c.id} className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px]">
                              {c.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {srv.estimated_time_minutes || 30} min
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(srv.default_price)}
                    </td>
                    {canManage && (
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditService(srv)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-800 transition-colors"
                            title="Editar Serviço"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(srv.id, srv.name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-800 transition-colors"
                            title="Excluir Serviço"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 my-8">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  {editingServiceId ? 'Editar Serviço / Procedimento' : 'Novo Serviço / Procedimento'}
                </h3>
              </div>
              <button onClick={handleRequestCloseServiceModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center mb-1">
                  <span>Nome do Serviço</span>
                  <span className="text-red-500 font-bold ml-1">*</span>
                </label>
                <Input
                  value={serviceName}
                  onChange={e => setServiceName(e.target.value)}
                  placeholder="Ex: Recarga de Tinta, Formatação, Troca de Conector..."
                  className="text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Código Mnemônico
                  </label>
                  <Input
                    value={serviceCode}
                    onChange={e => setServiceCode(e.target.value)}
                    placeholder="Ex: RECARGA_TINTA"
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tempo Médio (min)
                  </label>
                  <Input
                    type="number"
                    value={serviceEstTime}
                    onChange={e => setServiceEstTime(e.target.value)}
                    placeholder="Ex: 30"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center mb-1">
                  <span>Preço Padrão de Venda (R$)</span>
                  <span className="text-red-500 font-bold ml-1">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                  <Input
                    type="number"
                    step="0.50"
                    value={servicePrice}
                    onChange={e => setServicePrice(e.target.value)}
                    placeholder="50.00"
                    className="pl-9 text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Descrição do Procedimento
                </label>
                <Input
                  value={serviceDesc}
                  onChange={e => setServiceDesc(e.target.value)}
                  placeholder="Ex: Injeção pressurizada de tinta, desobstrução ultrassônica..."
                  className="text-xs"
                />
              </div>

              {/* Category Linking */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Disponível nas seguintes Categorias:
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedServiceCategories(categories.map(c => c.id))}
                      className="text-[10px] text-emerald-600 hover:underline font-bold"
                    >
                      Marcar Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedServiceCategories([])}
                      className="text-[10px] text-slate-400 hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 max-h-40 overflow-y-auto">
                  {categories.map(cat => {
                    const isChecked = selectedServiceCategories.includes(cat.id);

                    return (
                      <label
                        key={cat.id}
                        onClick={() => toggleServiceCategory(cat.id)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all",
                          isChecked
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 text-emerald-600 rounded pointer-events-none"
                        />
                        <span className="truncate">{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={handleRequestCloseServiceModal} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5">
                  <Check className="w-4 h-4" />
                  {editingServiceId ? 'Salvar Serviço' : 'Cadastrar Serviço'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
