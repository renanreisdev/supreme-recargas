'use client';

import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  PlusCircle, 
  Wrench, 
  Layers, 
  Building, 
  Kanban, 
  Sliders, 
  Trash2, 
  Info, 
  AlertCircle, 
  Check 
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore } from '@/lib/store';
import { 
  ItemModel, 
  ItemCategory, 
  Brand, 
  Service, 
  WorkflowState 
} from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';

import { ModelsTab } from '@/components/modelos/ModelsTab';
import { ServicesTab } from '@/components/modelos/ServicesTab';
import { CategoriesTab } from '@/components/modelos/CategoriesTab';
import { BrandsTab } from '@/components/modelos/BrandsTab';
import { WorkflowTab } from '@/components/modelos/WorkflowTab';

export interface DialogModalState {
  isOpen: boolean;
  type?: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  subtitle?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isAlertOnly?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export default function CatalogAndModelsPage() {
  const { currentCompany, currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'MODELS' | 'SERVICES' | 'CATEGORIES' | 'BRANDS' | 'WORKFLOW'>('MODELS');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const [models, setModels] = useState<ItemModel[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [workflowStates, setWorkflowStates] = useState<WorkflowState[]>([]);
  
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [dialogModal, setDialogModal] = useState<DialogModalState | null>(null);

  const canManage = hasPermission('manage_models') || hasPermission('catalog_manage') || currentUser?.role === 'ADMINISTRADOR';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error') {
      toast.error(message);
    } else {
      toast.success(message);
    }
  };

  const showAlert = (title: string, message: string, subtitle?: string, type: 'warning' | 'info' | 'danger' = 'warning') => {
    setDialogModal({
      isOpen: true,
      type,
      title,
      subtitle,
      message,
      isAlertOnly: true,
      confirmLabel: 'Entendido'
    });
  };

  const showConfirm = ({
    title,
    subtitle,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    type = 'warning',
    onConfirm,
    onCancel
  }: {
    title: string;
    subtitle?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
    onCancel?: () => void;
  }) => {
    setDialogModal({
      isOpen: true,
      type,
      title,
      subtitle,
      message,
      confirmLabel,
      cancelLabel,
      isAlertOnly: false,
      onConfirm,
      onCancel
    });
  };

  const loadData = () => {
    const mods = AppStore.getModels(currentCompany.id);
    const cats = AppStore.getCategories(currentCompany.id);
    const brs = AppStore.getBrands(currentCompany.id);
    const srvs = AppStore.getServices(currentCompany.id);
    const wfs = AppStore.getWorkflowStates(currentCompany.id);

    setModels(mods);
    setCategories(cats);
    setBrands(brs);
    setServices(srvs);
    setWorkflowStates(wfs);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('supreme_store_updated', handleUpdate);
    return () => window.removeEventListener('supreme_store_updated', handleUpdate);
  }, [currentCompany.id]);

  if (!currentUser) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-semibold animate-in fade-in slide-in-from-bottom-5",
          notification.type === 'success' ? "bg-emerald-600 text-white border-emerald-500" : "bg-rose-600 text-white border-rose-500"
        )}>
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Global Dialog Modal */}
      {dialogModal && dialogModal.isOpen && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3.5">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0",
                dialogModal.type === 'danger'
                  ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  : dialogModal.type === 'info'
                    ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                    : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              )}>
                {dialogModal.type === 'danger' ? (
                  <Trash2 className="w-6 h-6" />
                ) : dialogModal.type === 'info' ? (
                  <Info className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {dialogModal.title}
                </h3>
                {dialogModal.subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {dialogModal.subtitle}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {dialogModal.message}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              {!dialogModal.isAlertOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const onCancel = dialogModal.onCancel;
                    setDialogModal(null);
                    if (onCancel) onCancel();
                  }}
                  className="text-xs font-semibold"
                >
                  {dialogModal.cancelLabel || 'Cancelar'}
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  const onConfirm = dialogModal.onConfirm;
                  setDialogModal(null);
                  if (onConfirm) onConfirm();
                }}
                className={cn(
                  "text-xs font-bold text-white",
                  dialogModal.type === 'danger'
                    ? "bg-rose-600 hover:bg-rose-700"
                    : dialogModal.type === 'info'
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {dialogModal.confirmLabel || (dialogModal.isAlertOnly ? 'Entendido' : 'Confirmar')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Catálogo & Engenharia de Serviços
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize equipamentos, opcionais técnicos, categorias, marcas, serviços e as etapas do fluxo Kanban da bancada técnica.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Button */}
        {canManage && (
          <div className="flex items-center gap-2">
            {activeTab === 'MODELS' && (
              <Button onClick={() => setIsCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-lg shadow-emerald-600/20">
                <PlusCircle className="w-4 h-4" />
                Novo Modelo
              </Button>
            )}
            {activeTab === 'SERVICES' && (
              <Button onClick={() => setIsCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-lg shadow-emerald-600/20">
                <PlusCircle className="w-4 h-4" />
                Novo Serviço
              </Button>
            )}
            {activeTab === 'CATEGORIES' && (
              <Button onClick={() => setIsCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-lg shadow-emerald-600/20">
                <PlusCircle className="w-4 h-4" />
                Nova Categoria
              </Button>
            )}
            {activeTab === 'BRANDS' && (
              <Button onClick={() => setIsCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-lg shadow-emerald-600/20">
                <PlusCircle className="w-4 h-4" />
                Nova Marca
              </Button>
            )}
            {activeTab === 'WORKFLOW' && (
              <Button onClick={() => setIsCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-lg shadow-emerald-600/20">
                <PlusCircle className="w-4 h-4" />
                Nova Etapa do Kanban
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => { setActiveTab('MODELS'); setIsCreateOpen(false); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all",
            activeTab === 'MODELS'
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          )}
        >
          <Tag className="w-4 h-4" />
          <span>Modelos & Produtos</span>
          <Badge className={cn("text-[10px] ml-1", activeTab === 'MODELS' ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}>
            {models.length}
          </Badge>
        </button>

        <button
          onClick={() => { setActiveTab('SERVICES'); setIsCreateOpen(false); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all",
            activeTab === 'SERVICES'
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          )}
        >
          <Wrench className="w-4 h-4" />
          <span>Tabela de Serviços & Preços</span>
          <Badge className={cn("text-[10px] ml-1", activeTab === 'SERVICES' ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}>
            {services.length}
          </Badge>
        </button>

        <button
          onClick={() => { setActiveTab('CATEGORIES'); setIsCreateOpen(false); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all",
            activeTab === 'CATEGORIES'
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          )}
        >
          <Layers className="w-4 h-4" />
          <span>Categorias & Especificações</span>
          <Badge className={cn("text-[10px] ml-1", activeTab === 'CATEGORIES' ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}>
            {categories.length}
          </Badge>
        </button>

        <button
          onClick={() => { setActiveTab('BRANDS'); setIsCreateOpen(false); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all",
            activeTab === 'BRANDS'
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          )}
        >
          <Building className="w-4 h-4" />
          <span>Marcas & Fabricantes</span>
          <Badge className={cn("text-[10px] ml-1", activeTab === 'BRANDS' ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}>
            {brands.length}
          </Badge>
        </button>

        <button
          onClick={() => { setActiveTab('WORKFLOW'); setIsCreateOpen(false); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all",
            activeTab === 'WORKFLOW'
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          )}
        >
          <Kanban className="w-4 h-4" />
          <span>Etapas do Kanban (Situações)</span>
          <Badge className={cn("text-[10px] ml-1", activeTab === 'WORKFLOW' ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}>
            {workflowStates.length}
          </Badge>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'MODELS' && (
        <ModelsTab
          models={models}
          categories={categories}
          brands={brands}
          services={services}
          currentCompany={currentCompany}
          currentUser={currentUser}
          canManage={canManage}
          onRefresh={loadData}
          showToast={showToast}
          showAlert={showAlert}
          showConfirm={showConfirm}
          isCreateOpen={isCreateOpen}
          onCloseCreate={() => setIsCreateOpen(false)}
        />
      )}

      {activeTab === 'SERVICES' && (
        <ServicesTab
          services={services}
          categories={categories}
          currentCompany={currentCompany}
          currentUser={currentUser}
          canManage={canManage}
          onRefresh={loadData}
          showToast={showToast}
          showAlert={showAlert}
          showConfirm={showConfirm}
          isCreateOpen={isCreateOpen}
          onCloseCreate={() => setIsCreateOpen(false)}
        />
      )}

      {activeTab === 'CATEGORIES' && (
        <CategoriesTab
          categories={categories}
          models={models}
          services={services}
          currentCompany={currentCompany}
          currentUser={currentUser}
          canManage={canManage}
          onRefresh={loadData}
          showToast={showToast}
          showAlert={showAlert}
          showConfirm={showConfirm}
          isCreateOpen={isCreateOpen}
          onCloseCreate={() => setIsCreateOpen(false)}
        />
      )}

      {activeTab === 'BRANDS' && (
        <BrandsTab
          brands={brands}
          models={models}
          currentCompany={currentCompany}
          currentUser={currentUser}
          canManage={canManage}
          onRefresh={loadData}
          showToast={showToast}
          showAlert={showAlert}
          showConfirm={showConfirm}
          isCreateOpen={isCreateOpen}
          onCloseCreate={() => setIsCreateOpen(false)}
        />
      )}

      {activeTab === 'WORKFLOW' && (
        <WorkflowTab
          workflowStates={workflowStates}
          currentCompany={currentCompany}
          currentUser={currentUser}
          canManage={canManage}
          onRefresh={loadData}
          showToast={showToast}
          showAlert={showAlert}
          showConfirm={showConfirm}
          isCreateOpen={isCreateOpen}
          onCloseCreate={() => setIsCreateOpen(false)}
        />
      )}
    </div>
  );
}
