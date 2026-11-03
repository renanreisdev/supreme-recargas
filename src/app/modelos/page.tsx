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
  Check,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  X
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

  // CSV Import State for Models
  const [showImportModelsModal, setShowImportModelsModal] = useState(false);
  const [csvModelsRows, setCsvModelsRows] = useState<any[]>([]);
  const [isImportingModels, setIsImportingModels] = useState(false);
  const [importModelsFileName, setImportModelsFileName] = useState('');

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

  const handleDownloadModelsTemplate = () => {
    const csvContent = 'Categoria;Marca;Modelo;Preco_Padrao;Descricao\n' +
      'Cartuchos;HP;HP 664 Preto;35.00;Cartucho de tinta preta 2ml\n' +
      'Cartuchos;HP;HP 664 Color;40.00;Cartucho de tinta colorida 2ml\n' +
      'Toners;Samsung;D111S;65.00;Toner monocromático ML-2165\n' +
      'Toners;Brother;TN 1060;55.00;Toner Brother HL-1212W\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_importacao_modelos_supreme.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCsvModelsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportModelsFileName(file.name);

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

        const catVal = row['categoria'] || row['category'] || rawValues[0] || 'Cartuchos';
        const brandVal = row['marca'] || row['brand'] || rawValues[1] || 'Generica';
        const modelVal = row['modelo'] || row['model'] || row['nome'] || rawValues[2] || '';
        const priceVal = parseFloat((row['preco_padrao'] || row['preco'] || row['price'] || rawValues[3] || '0').replace(',', '.'));
        const descVal = row['descricao'] || row['description'] || rawValues[4] || '';

        if (modelVal) {
          parsed.push({
            category: catVal,
            brand: brandVal,
            model: modelVal,
            price: isNaN(priceVal) ? 0 : priceVal,
            description: descVal
          });
        }
      }

      setCsvModelsRows(parsed);
      if (parsed.length === 0) {
        toast.error('Nenhum modelo válido foi encontrado no arquivo.');
      } else {
        toast.info(`${parsed.length} modelo(s) identificado(s) no arquivo.`);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleExecuteModelsImport = async () => {
    if (csvModelsRows.length === 0) return;
    setIsImportingModels(true);
    let successCount = 0;
    try {
      let currentCats = AppStore.getCategories(currentCompany.id);
      let currentBrands = AppStore.getBrands(currentCompany.id);

      for (const item of csvModelsRows) {
        // Resolve or create category
        let cat = currentCats.find(c => c.name.toLowerCase().trim() === item.category.toLowerCase().trim());
        if (!cat) {
          cat = AppStore.addCategory({
            tenant_id: currentCompany.id,
            name: item.category,
            slug: item.category.toLowerCase().replace(/\s+/g, '-'),
            is_active: true
          }, currentUser?.full_name || 'Importador CSV');
          currentCats = AppStore.getCategories(currentCompany.id);
        }

        // Resolve or create brand
        let br = currentBrands.find(b => b.name.toLowerCase().trim() === item.brand.toLowerCase().trim());
        if (!br) {
          br = AppStore.addBrand({
            tenant_id: currentCompany.id,
            name: item.brand,
            slug: item.brand.toLowerCase().replace(/\s+/g, '-'),
            is_active: true
          }, currentUser?.full_name || 'Importador CSV');
          currentBrands = AppStore.getBrands(currentCompany.id);
        }

        // Add Model
        AppStore.addModel({
          tenant_id: currentCompany.id,
          category_id: cat.id,
          brand_id: br.id,
          name: item.model,
          description: item.description || undefined,
          is_active: true
        }, currentUser?.full_name || 'Importador CSV');
        successCount++;
      }

      loadData();
      setShowImportModelsModal(false);
      setCsvModelsRows([]);
      setImportModelsFileName('');
      toast.success(`${successCount} modelo(s) e marcas/categorias importados com sucesso!`);
    } catch (err: any) {
      toast.error(err?.message || 'Erro durante a importação de modelos.');
    } finally {
      setIsImportingModels(false);
    }
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
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowImportModelsModal(true)} 
                  className="gap-1.5 text-xs font-semibold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Importar CSV</span>
                </Button>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-lg shadow-emerald-600/20">
                  <PlusCircle className="w-4 h-4" />
                  Novo Modelo
                </Button>
              </div>
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

      {/* CSV Models Import Modal */}
      {showImportModelsModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0e1626] rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Importação de Modelos e Catálogo (CSV)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Importe centenas de modelos, marcas e categorias para o catálogo em lote
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowImportModelsModal(false); setCsvModelsRows([]); setImportModelsFileName(''); }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 gap-3">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Planilha modelo recomendada</p>
                  <p>Baixe a planilha modelo contendo as colunas: Categoria, Marca, Modelo, Preço Padrão e Descrição.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadModelsTemplate}
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
                  onChange={handleCsvModelsFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-500/20 file:cursor-pointer cursor-pointer border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              {/* Preview Table */}
              {csvModelsRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Pré-visualização: {csvModelsRows.length} modelo(s) identificado(s)
                    </span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                      Pronto para importação
                    </Badge>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 font-bold text-slate-600 dark:text-slate-400">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Categoria</th>
                          <th className="p-2">Marca</th>
                          <th className="p-2">Modelo</th>
                          <th className="p-2">Preço Padrão</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {csvModelsRows.slice(0, 50).map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <td className="p-2 text-slate-400">{i + 1}</td>
                            <td className="p-2 text-slate-500">{r.category}</td>
                            <td className="p-2 text-slate-500">{r.brand}</td>
                            <td className="p-2 font-bold text-slate-900 dark:text-slate-100">{r.model}</td>
                            <td className="p-2 font-mono text-emerald-600 dark:text-emerald-400">
                              {r.price > 0 ? `R$ ${r.price.toFixed(2)}` : 'R$ 0,00'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvModelsRows.length > 50 && (
                    <p className="text-[10px] text-slate-400 text-center italic">
                      + {csvModelsRows.length - 50} modelos adicionais serão criados
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowImportModelsModal(false); setCsvModelsRows([]); setImportModelsFileName(''); }}
                className="rounded-xl h-10 px-4 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleExecuteModelsImport}
                disabled={isImportingModels || csvModelsRows.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-xl h-10 px-5 text-xs shadow-xs gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isImportingModels ? 'Importando...' : `Confirmar Importação (${csvModelsRows.length})`}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
