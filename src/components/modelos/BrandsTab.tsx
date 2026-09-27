'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Check, 
  X 
} from 'lucide-react';
import { Brand, ItemModel, Profile, Company } from '@/types';
import { AppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface BrandsTabProps {
  brands: Brand[];
  models: ItemModel[];
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

export function BrandsTab({
  brands,
  models,
  currentCompany,
  currentUser,
  canManage,
  onRefresh,
  showToast,
  showAlert,
  showConfirm,
  isCreateOpen = false,
  onCloseCreate
}: BrandsTabProps) {
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState('');
  const [brandSlug, setBrandSlug] = useState('');

  const handleCloseModal = () => {
    setShowBrandModal(false);
    if (onCloseCreate) onCloseCreate();
  };

  const handleOpenAddBrand = () => {
    setEditingBrandId(null);
    setBrandName('');
    setBrandSlug('');
    setShowBrandModal(true);
  };

  useEffect(() => {
    if (isCreateOpen) {
      handleOpenAddBrand();
    }
  }, [isCreateOpen]);

  const handleOpenEditBrand = (b: Brand) => {
    setEditingBrandId(b.id);
    setBrandName(b.name);
    setBrandSlug(b.slug);
    setShowBrandModal(true);
  };

  const handleRequestCloseBrandModal = () => {
    const isDirty = Boolean(brandName.trim() || brandSlug.trim());
    if (isDirty) {
      showConfirm({
        title: 'Descartar Alterações da Marca?',
        subtitle: 'Alterações não salvas serão perdidas.',
        message: 'Você preencheu dados para esta marca. Deseja sair sem salvar?',
        confirmLabel: 'Sim, Descartar e Sair',
        cancelLabel: 'Continuar Editando',
        type: 'danger',
        onConfirm: handleCloseModal
      });
    } else {
      handleCloseModal();
    }
  };

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      showToast('Informe o nome da marca.', 'error');
      return;
    }

    const payload: Partial<Brand> = {
      tenant_id: currentCompany.id,
      name: brandName.trim(),
      slug: brandSlug.trim() || brandName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-'),
      is_active: true
    };

    try {
      if (editingBrandId) {
        AppStore.updateBrand(editingBrandId, payload, currentUser?.full_name || 'Admin');
        showToast(`Marca "${brandName}" atualizada com sucesso!`);
      } else {
        AppStore.addBrand(payload as any, currentUser?.full_name || 'Admin');
        showToast(`Marca "${brandName}" cadastrada com sucesso!`);
      }
      handleCloseModal();
      onRefresh();
    } catch (err: any) {
      showToast(err?.message || 'Erro ao salvar marca.', 'error');
    }
  };

  const handleDeleteBrand = (id: string, name: string) => {
    const linkedModels = models.filter(m => m.brand_id === id);
    if (linkedModels.length > 0) {
      showAlert(
        'Exclusão Bloqueada',
        `Não é possível excluir a marca "${name}" pois existem ${linkedModels.length} modelo(s) cadastrado(s) nela. Realoque os modelos primeiro.`,
        'Existem modelos vinculados a esta marca',
        'danger'
      );
      return;
    }

    showConfirm({
      title: 'Excluir Marca?',
      subtitle: 'Esta ação não poderá ser desfeita',
      message: `Deseja realmente excluir a marca "${name}"?`,
      confirmLabel: 'Sim, Excluir Marca',
      type: 'danger',
      onConfirm: () => {
        try {
          AppStore.deleteBrand(id, currentUser?.full_name || 'Admin');
          showToast(`Marca "${name}" excluída.`);
          onRefresh();
        } catch (err: any) {
          showToast(err?.message || 'Erro ao excluir marca.', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Marcas & Fabricantes Parceiros
          </h2>
          <p className="text-xs text-slate-400">
            Cadastre e edite marcas de cartuchos, computadores, celulares e ferramentas (ex: HP, Epson, Dell, Apple, Makita).
          </p>
        </div>
        {canManage && (
          <Button onClick={handleOpenAddBrand} className="bg-emerald-600 text-white font-bold text-xs gap-1.5 shadow-sm">
            <PlusCircle className="w-4 h-4" />
            Nova Marca
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {brands.map(brand => {
          const modelCount = models.filter(m => m.brand_id === brand.id).length;

          return (
            <Card key={brand.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                      {brand.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {brand.name}
                      </CardTitle>
                      <p className="text-[10px] text-slate-400 font-mono">{brand.slug}</p>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleOpenEditBrand(brand)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-800 transition-colors"
                        title="Editar Marca"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBrand(brand.id, brand.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-800 transition-colors"
                        title="Excluir Marca"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Modelos Vinculados:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{modelCount}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Brand Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 my-8">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  {editingBrandId ? 'Editar Marca' : 'Nova Marca / Fabricante'}
                </h3>
              </div>
              <button onClick={handleRequestCloseBrandModal} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center mb-1">
                  <span>Nome da Marca / Fabricante</span>
                  <span className="text-red-500 font-bold ml-1">*</span>
                </label>
                <Input
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  placeholder="Ex: Apple, HP, Dell, Makita, Bosch..."
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Slug / Identificador URL (opcional)
                </label>
                <Input
                  value={brandSlug}
                  onChange={e => setBrandSlug(e.target.value)}
                  placeholder="Ex: apple, dell, hp"
                  className="text-xs font-mono"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={handleRequestCloseBrandModal} className="text-xs">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5">
                  <Check className="w-4 h-4" />
                  {editingBrandId ? 'Salvar Marca' : 'Cadastrar Marca'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
