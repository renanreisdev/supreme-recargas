'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  Layers,
  Building,
  Wrench,
  Tag,
  Kanban,
  Plus,
  Search,
  Printer,
  Laptop,
  Smartphone,
  Gamepad2,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Lock
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppStore, BUSINESS_PRESETS } from '@/lib/store';
import {
  BusinessTemplateKey,
  CategoryCustomField,
  KanbanColumnColor,
  PresetImportResult,
  PresetImportSelection,
  StageType
} from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface PresetCatalogWizardProps {
  mode: 'modal' | 'inline';
  isOpen?: boolean;
  isFirstAccess?: boolean;
  onClose?: () => void;
  onComplete?: (result: PresetImportResult) => void;
}

type GroupTab = 'categories' | 'brands' | 'services' | 'models' | 'workflow';

interface DraftCategory {
  tempId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  identifier_label: string;
  inspection_type?: string;
  checklist_items?: string[];
  custom_fields?: CategoryCustomField[];
  technical_verdicts?: string[];
  selected: boolean;
  alreadyExists: boolean;
  sourceSegments: string[];
}

interface DraftBrand {
  tempId: string;
  name: string;
  slug: string;
  selected: boolean;
  alreadyExists: boolean;
  sourceSegments: string[];
}

interface DraftService {
  tempId: string;
  name: string;
  code: string;
  description?: string;
  default_price: number;
  estimated_time_minutes: number;
  category_slugs: string[];
  selected: boolean;
  alreadyExists: boolean;
  sourceSegments: string[];
}

interface DraftModel {
  tempId: string;
  name: string;
  internal_code: string;
  brand_name: string;
  category_slug: string;
  description?: string;
  empty_weight_grams?: number;
  full_weight_grams?: number;
  attributes?: Record<string, any>;
  custom_attributes?: Record<string, any>;
  selected: boolean;
  alreadyExists: boolean;
  sourceSegments: string[];
}

interface DraftWorkflowState {
  tempId: string;
  code: string;
  name: string;
  color: KanbanColumnColor;
  stage_type: StageType;
  sort_order: number;
  is_initial: boolean;
  is_final: boolean;
  selected: boolean;
  alreadyExists: boolean;
  sourceSegments: string[];
}

const slugify = (val: string) =>
  val
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const SEGMENT_ICONS: Record<BusinessTemplateKey, React.ComponentType<{ className?: string }>> = {
  RECARGA_CARTUCHOS: Printer,
  ASSISTENCIA_INFORMATICA: Laptop,
  ASSISTENCIA_CELULARES: Smartphone,
  VIDEOGAMES_ELETRONICOS: Gamepad2,
  FERRAMENTAS_MOTORES: Wrench,
  OFICINA_GERAL: Layers
};

const COLOR_OPTIONS: Array<{ value: KanbanColumnColor; label: string }> = [
  { value: 'slate', label: 'Cinza (Slate)' },
  { value: 'amber', label: 'Âmbar' },
  { value: 'blue', label: 'Azul' },
  { value: 'purple', label: 'Roxo' },
  { value: 'teal', label: 'Turquesa' },
  { value: 'emerald', label: 'Verde' },
  { value: 'rose', label: 'Rosa / Alerta' },
  { value: 'indigo', label: 'Índigo' }
];

const STAGE_TYPE_OPTIONS: Array<{ value: StageType; label: string }> = [
  { value: 'RECEBIDO', label: 'Recebido' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'AGUARDANDO_APROVACAO', label: 'Aguard. Aprovação' },
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'CANCELADO', label: 'Cancelado' }
];

export function PresetCatalogWizard({
  mode,
  isOpen = true,
  isFirstAccess = false,
  onClose,
  onComplete
}: PresetCatalogWizardProps) {
  const { currentUser, currentCompany, refreshUser } = useAuth();
  const canAccess = currentUser?.role === 'ADMINISTRADOR' || currentUser?.role === 'SUPER_ADMIN';

  const [selectedSegments, setSelectedSegments] = useState<BusinessTemplateKey[]>(['RECARGA_CARTUCHOS']);
  const [activeGroup, setActiveGroup] = useState<GroupTab>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceWorkflowStates, setReplaceWorkflowStates] = useState(false);

  const [categoriesDraft, setCategoriesDraft] = useState<DraftCategory[]>([]);
  const [brandsDraft, setBrandsDraft] = useState<DraftBrand[]>([]);
  const [servicesDraft, setServicesDraft] = useState<DraftService[]>([]);
  const [modelsDraft, setModelsDraft] = useState<DraftModel[]>([]);
  const [workflowDraft, setWorkflowDraft] = useState<DraftWorkflowState[]>([]);

  // Quick custom add inputs per tab
  const [newCatName, setNewCatName] = useState('');
  const [newCatIdentifier, setNewCatIdentifier] = useState('Nº de Série');
  const [newBrandNames, setNewBrandNames] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('80');
  const [newModelName, setNewModelName] = useState('');
  const [newModelBrand, setNewModelBrand] = useState('');
  const [newModelSku, setNewModelSku] = useState('');
  const [newStageName, setNewStageName] = useState('');

  // Track existing catalog snapshot for currentCompany
  const [existingVersion, setExistingVersion] = useState(0);

  const existingSnapshot = useMemo(() => {
    void existingVersion;
    const tenantId = currentCompany.id;
    const cats = AppStore.getCategories(tenantId);
    const brands = AppStore.getBrands(tenantId);
    const services = AppStore.getServices(tenantId);
    const models = AppStore.getModels(tenantId);
    const states = AppStore.getWorkflowStates(tenantId);

    return {
      catKeys: new Set([
        ...cats.map(c => c.slug?.toLowerCase()).filter(Boolean),
        ...cats.map(c => c.name.trim().toLowerCase())
      ]),
      brandKeys: new Set([
        ...brands.map(b => b.slug?.toLowerCase()).filter(Boolean),
        ...brands.map(b => b.name.trim().toLowerCase())
      ]),
      serviceKeys: new Set([
        ...services.map(s => s.code?.trim().toLowerCase()).filter(Boolean),
        ...services.map(s => s.name.trim().toLowerCase())
      ]),
      modelKeys: new Set([
        ...models.map(m => m.name.trim().toLowerCase()),
        ...models.map(m => m.internal_code?.trim().toLowerCase()).filter(Boolean)
      ]),
      stateKeys: new Set([
        ...states.map(s => s.code.trim().toUpperCase()),
        ...states.map(s => s.name.trim().toLowerCase())
      ]),
      hasExistingStates: states.length > 0
    };
  }, [currentCompany.id, existingVersion]);

  const buildDraftsFromSegments = (
    segments: BusinessTemplateKey[],
    preserveCustomOnly: boolean = false,
    prevState?: {
      cats: DraftCategory[];
      brands: DraftBrand[];
      services: DraftService[];
      models: DraftModel[];
      workflow: DraftWorkflowState[];
    }
  ) => {
    const { catKeys, brandKeys, serviceKeys, modelKeys, stateKeys } = existingSnapshot;

    // Categories map by slug/name
    const catMap = new Map<string, DraftCategory>();
    if (preserveCustomOnly && prevState) {
      prevState.cats
        .filter(c => c.sourceSegments.includes('CUSTOM'))
        .forEach(c => catMap.set(c.slug || slugify(c.name), c));
    }

    const brandMap = new Map<string, DraftBrand>();
    if (preserveCustomOnly && prevState) {
      prevState.brands
        .filter(b => b.sourceSegments.includes('CUSTOM'))
        .forEach(b => brandMap.set(b.slug || slugify(b.name), b));
    }

    const serviceMap = new Map<string, DraftService>();
    if (preserveCustomOnly && prevState) {
      prevState.services
        .filter(s => s.sourceSegments.includes('CUSTOM'))
        .forEach(s => serviceMap.set(s.code.toLowerCase(), s));
    }

    const modelMap = new Map<string, DraftModel>();
    if (preserveCustomOnly && prevState) {
      prevState.models
        .filter(m => m.sourceSegments.includes('CUSTOM'))
        .forEach(m => modelMap.set(m.name.toLowerCase(), m));
    }

    const stateMap = new Map<string, DraftWorkflowState>();
    if (preserveCustomOnly && prevState) {
      prevState.workflow
        .filter(w => w.sourceSegments.includes('CUSTOM'))
        .forEach(w => stateMap.set(w.code.toUpperCase(), w));
    }

    segments.forEach(segKey => {
      const tpl = BUSINESS_PRESETS[segKey];
      if (!tpl) return;

      tpl.categories.forEach(c => {
        const key = (c.slug || slugify(c.name)).toLowerCase();
        const alreadyExists = catKeys.has(key) || catKeys.has(c.name.trim().toLowerCase());
        const existing = catMap.get(key);
        if (existing) {
          if (!existing.sourceSegments.includes(segKey)) existing.sourceSegments.push(segKey);
        } else {
          const prevEdited = prevState?.cats.find(p => p.slug === key);
          catMap.set(key, {
            tempId: `cat-${key}`,
            name: prevEdited ? prevEdited.name : c.name,
            slug: key,
            description: c.description,
            icon: c.icon || 'Layers',
            identifier_label: prevEdited ? prevEdited.identifier_label : c.identifier_label || 'Nº de Série',
            inspection_type: c.inspection_type || 'STANDARD',
            checklist_items: c.checklist_items || [],
            custom_fields: c.custom_fields || [],
            technical_verdicts: c.technical_verdicts || [],
            selected: prevEdited ? prevEdited.selected : !alreadyExists,
            alreadyExists,
            sourceSegments: [segKey]
          });
        }
      });

      tpl.brands.forEach(b => {
        const key = (b.slug || slugify(b.name)).toLowerCase();
        const alreadyExists = brandKeys.has(key) || brandKeys.has(b.name.trim().toLowerCase());
        const existing = brandMap.get(key);
        if (existing) {
          if (!existing.sourceSegments.includes(segKey)) existing.sourceSegments.push(segKey);
        } else {
          const prevEdited = prevState?.brands.find(p => p.slug === key);
          brandMap.set(key, {
            tempId: `brand-${key}`,
            name: prevEdited ? prevEdited.name : b.name,
            slug: key,
            selected: prevEdited ? prevEdited.selected : !alreadyExists,
            alreadyExists,
            sourceSegments: [segKey]
          });
        }
      });

      tpl.services.forEach(s => {
        const name = s.name || '';
        const code = (s.code || slugify(name).replace(/-/g, '_').toUpperCase()).trim();
        const key = code.toLowerCase();
        const alreadyExists = serviceKeys.has(key) || serviceKeys.has(name.trim().toLowerCase());
        const existing = serviceMap.get(key);
        if (existing) {
          if (!existing.sourceSegments.includes(segKey)) existing.sourceSegments.push(segKey);
        } else {
          const prevEdited = prevState?.services.find(p => p.code.toLowerCase() === key);
          serviceMap.set(key, {
            tempId: `srv-${key}`,
            name: prevEdited ? prevEdited.name : name,
            code,
            description: s.description,
            default_price: prevEdited ? prevEdited.default_price : Number(s.default_price ?? 0),
            estimated_time_minutes: prevEdited ? prevEdited.estimated_time_minutes : Number(s.estimated_time_minutes ?? 60),
            category_slugs: (s.category_ids || []).map(cid => cid.replace(/^cat-/, '')),
            selected: prevEdited ? prevEdited.selected : !alreadyExists,
            alreadyExists,
            sourceSegments: [segKey]
          });
        }
      });

      tpl.models.forEach(m => {
        const name = m.name || '';
        const code = (m.internal_code || '').trim();
        const key = name.trim().toLowerCase();
        const alreadyExists = modelKeys.has(key) || (Boolean(code) && modelKeys.has(code.toLowerCase()));
        const existing = modelMap.get(key);
        if (existing) {
          if (!existing.sourceSegments.includes(segKey)) existing.sourceSegments.push(segKey);
        } else {
          const matchedCat = tpl.categories.find(c => c.id === m.category_id);
          const prevEdited = prevState?.models.find(p => p.name.trim().toLowerCase() === key);
          modelMap.set(key, {
            tempId: `mod-${slugify(name)}`,
            name: prevEdited ? prevEdited.name : name,
            internal_code: prevEdited ? prevEdited.internal_code : code,
            brand_name: prevEdited ? prevEdited.brand_name : m.brand_name || '',
            category_slug: matchedCat?.slug || '',
            description: m.description,
            empty_weight_grams: m.empty_weight_grams ?? m.attributes?.empty_weight_grams,
            full_weight_grams: m.full_weight_grams ?? m.attributes?.full_weight_grams,
            attributes: m.attributes || {},
            custom_attributes: m.custom_attributes || m.attributes || {},
            selected: prevEdited ? prevEdited.selected : !alreadyExists,
            alreadyExists,
            sourceSegments: [segKey]
          });
        }
      });

      (tpl.workflow?.states || []).forEach(st => {
        const key = st.code.trim().toUpperCase();
        const alreadyExists = stateKeys.has(key) || stateKeys.has(st.name.trim().toLowerCase());
        const existing = stateMap.get(key);
        if (existing) {
          if (!existing.sourceSegments.includes(segKey)) existing.sourceSegments.push(segKey);
        } else {
          const prevEdited = prevState?.workflow.find(p => p.code.toUpperCase() === key);
          stateMap.set(key, {
            tempId: `st-${key}`,
            code: key,
            name: prevEdited ? prevEdited.name : st.name,
            color: prevEdited ? prevEdited.color : st.color,
            stage_type: prevEdited ? prevEdited.stage_type : st.stage_type,
            sort_order: st.sort_order,
            is_initial: st.is_initial,
            is_final: st.is_final,
            selected: prevEdited ? prevEdited.selected : !alreadyExists,
            alreadyExists,
            sourceSegments: [segKey]
          });
        }
      });
    });

    setCategoriesDraft(Array.from(catMap.values()));
    setBrandsDraft(Array.from(brandMap.values()));
    setServicesDraft(Array.from(serviceMap.values()));
    setModelsDraft(Array.from(modelMap.values()));
    setWorkflowDraft(
      Array.from(stateMap.values()).sort((a, b) => a.sort_order - b.sort_order)
    );
  };

  // Initialize segments & drafts on open / company change
  useEffect(() => {
    if (mode === 'modal' && !isOpen) return;
    const companySegments = (
      currentCompany.active_template_keys && currentCompany.active_template_keys.length > 0
        ? currentCompany.active_template_keys
        : [currentCompany.business_segment || 'RECARGA_CARTUCHOS']
    ).filter((k): k is BusinessTemplateKey => Boolean(BUSINESS_PRESETS[k as BusinessTemplateKey]));

    const initialSegs: BusinessTemplateKey[] =
      companySegments.length > 0 ? companySegments : ['ASSISTENCIA_INFORMATICA'];
    setSelectedSegments(initialSegs);
    buildDraftsFromSegments(initialSegs, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompany.id, isOpen, mode, existingVersion]);

  if (!canAccess) return null;
  if (mode === 'modal' && !isOpen) return null;

  const hasMultiSegmentModule = currentCompany
    ? AppStore.isModuleEnabledForTenant(currentCompany.id, 'multi_segmento')
    : true;

  const toggleSegment = (segKey: BusinessTemplateKey) => {
    const isSelected = selectedSegments.includes(segKey);
    const next = isSelected
      ? selectedSegments.filter(k => k !== segKey)
      : hasMultiSegmentModule
        ? [...selectedSegments, segKey]
        : [segKey];
    setSelectedSegments(next);
    buildDraftsFromSegments(next, true, {
      cats: categoriesDraft,
      brands: brandsDraft,
      services: servicesDraft,
      models: modelsDraft,
      workflow: workflowDraft
    });
  };

  const selectAllSegments = () => {
    if (!hasMultiSegmentModule) {
      toast.warning('Módulo Múltiplos Segmentos Simultâneos não está incluído no plano atual.');
      return;
    }
    const all = Object.keys(BUSINESS_PRESETS) as BusinessTemplateKey[];
    setSelectedSegments(all);
    buildDraftsFromSegments(all, true, {
      cats: categoriesDraft,
      brands: brandsDraft,
      services: servicesDraft,
      models: modelsDraft,
      workflow: workflowDraft
    });
  };

  const clearSegments = () => {
    setSelectedSegments([]);
    buildDraftsFromSegments([], true, {
      cats: categoriesDraft,
      brands: brandsDraft,
      services: servicesDraft,
      models: modelsDraft,
      workflow: workflowDraft
    });
  };

  // Counts
  const counts = {
    categories: categoriesDraft.filter(c => c.selected).length,
    brands: brandsDraft.filter(b => b.selected).length,
    services: servicesDraft.filter(s => s.selected).length,
    models: modelsDraft.filter(m => m.selected).length,
    workflow: workflowDraft.filter(w => w.selected).length
  };
  const totalSelected =
    counts.categories + counts.brands + counts.services + counts.models + counts.workflow;

  // Bulk select / deselect in active tab
  const toggleGroupSelection = (selectNewOnes: boolean) => {
    if (activeGroup === 'categories') {
      setCategoriesDraft(prev =>
        prev.map(c => ({ ...c, selected: selectNewOnes ? !c.alreadyExists : false }))
      );
    } else if (activeGroup === 'brands') {
      setBrandsDraft(prev =>
        prev.map(b => ({ ...b, selected: selectNewOnes ? !b.alreadyExists : false }))
      );
    } else if (activeGroup === 'services') {
      setServicesDraft(prev =>
        prev.map(s => ({ ...s, selected: selectNewOnes ? !s.alreadyExists : false }))
      );
    } else if (activeGroup === 'models') {
      setModelsDraft(prev =>
        prev.map(m => ({ ...m, selected: selectNewOnes ? !m.alreadyExists : false }))
      );
    } else if (activeGroup === 'workflow') {
      setWorkflowDraft(prev =>
        prev.map(w => ({
          ...w,
          selected: selectNewOnes ? replaceWorkflowStates || !w.alreadyExists : false
        }))
      );
    }
  };

  // Add Custom Item handlers
  const handleAddCustomCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    const slug = slugify(name);
    if (categoriesDraft.some(c => c.slug === slug)) {
      toast.warning('Essa categoria já está na lista.');
      return;
    }
    const alreadyExists =
      existingSnapshot.catKeys.has(slug) || existingSnapshot.catKeys.has(name.toLowerCase());
    setCategoriesDraft(prev => [
      {
        tempId: `cat-custom-${Date.now()}`,
        name,
        slug,
        identifier_label: newCatIdentifier.trim() || 'Nº de Série',
        inspection_type: 'STANDARD',
        selected: true,
        alreadyExists,
        sourceSegments: ['CUSTOM']
      },
      ...prev
    ]);
    setNewCatName('');
  };

  const handleAddCustomBrands = () => {
    const parts = newBrandNames
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;

    setBrandsDraft(prev => {
      const next = [...prev];
      parts.forEach((name, idx) => {
        const slug = slugify(name);
        if (!next.some(b => b.slug === slug)) {
          const alreadyExists =
            existingSnapshot.brandKeys.has(slug) ||
            existingSnapshot.brandKeys.has(name.toLowerCase());
          next.unshift({
            tempId: `brand-custom-${Date.now()}-${idx}`,
            name,
            slug,
            selected: true,
            alreadyExists,
            sourceSegments: ['CUSTOM']
          });
        }
      });
      return next;
    });
    setNewBrandNames('');
  };

  const handleAddCustomService = () => {
    const name = newServiceName.trim();
    if (!name) return;
    const code = slugify(name).replace(/-/g, '_').toUpperCase();
    const price = Math.max(0, Number(newServicePrice) || 0);
    const alreadyExists =
      existingSnapshot.serviceKeys.has(code.toLowerCase()) ||
      existingSnapshot.serviceKeys.has(name.toLowerCase());
    setServicesDraft(prev => [
      {
        tempId: `srv-custom-${Date.now()}`,
        name,
        code,
        default_price: price,
        estimated_time_minutes: 60,
        category_slugs: [],
        selected: true,
        alreadyExists,
        sourceSegments: ['CUSTOM']
      },
      ...prev
    ]);
    setNewServiceName('');
  };

  const handleAddCustomModel = () => {
    const name = newModelName.trim();
    if (!name) return;
    const alreadyExists = existingSnapshot.modelKeys.has(name.toLowerCase());
    setModelsDraft(prev => [
      {
        tempId: `mod-custom-${Date.now()}`,
        name,
        internal_code: newModelSku.trim(),
        brand_name: newModelBrand.trim(),
        category_slug: categoriesDraft.find(c => c.selected)?.slug || '',
        selected: true,
        alreadyExists,
        sourceSegments: ['CUSTOM']
      },
      ...prev
    ]);
    setNewModelName('');
    setNewModelSku('');
  };

  const handleAddCustomStage = () => {
    const name = newStageName.trim();
    if (!name) return;
    const code = slugify(name).replace(/-/g, '_').toUpperCase();
    const alreadyExists =
      existingSnapshot.stateKeys.has(code) || existingSnapshot.stateKeys.has(name.toLowerCase());
    setWorkflowDraft(prev => [
      ...prev,
      {
        tempId: `st-custom-${Date.now()}`,
        code,
        name,
        color: 'blue',
        stage_type: 'EM_ANDAMENTO',
        sort_order: prev.length + 1,
        is_initial: prev.length === 0,
        is_final: false,
        selected: true,
        alreadyExists,
        sourceSegments: ['CUSTOM']
      }
    ]);
    setNewStageName('');
  };

  const moveWorkflowRow = (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= workflowDraft.length) return;
    const next = [...workflowDraft];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    setWorkflowDraft(next.map((st, i) => ({ ...st, sort_order: i + 1 })));
  };

  const handleDismiss = () => {
    try {
      AppStore.dismissPresetOnboarding(currentCompany.id, currentUser?.full_name);
      refreshUser();
      toast.info('Você pode abrir os Pré-Cadastros a qualquer momento em Empresa ou Catálogo.');
      onClose?.();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao dispensar assistente.');
    }
  };

  const handleImport = () => {
    if (totalSelected === 0) {
      toast.warning('Selecione ao menos 1 item para importar.');
      return;
    }

    try {
      const selection: PresetImportSelection = {
        segments: selectedSegments.length > 0 ? selectedSegments : undefined,
        categories: categoriesDraft
          .filter(c => c.selected)
          .map(c => ({
            name: c.name,
            slug: c.slug,
            description: c.description,
            icon: c.icon,
            identifier_label: c.identifier_label,
            inspection_type: c.inspection_type,
            checklist_items: c.checklist_items,
            custom_fields: c.custom_fields,
            technical_verdicts: c.technical_verdicts
          })),
        brands: brandsDraft
          .filter(b => b.selected)
          .map(b => ({
            name: b.name,
            slug: b.slug
          })),
        services: servicesDraft
          .filter(s => s.selected)
          .map(s => ({
            name: s.name,
            code: s.code,
            description: s.description,
            default_price: Number(s.default_price) || 0,
            estimated_time_minutes: Number(s.estimated_time_minutes) || 60,
            category_slugs: s.category_slugs
          })),
        models: modelsDraft
          .filter(m => m.selected)
          .map(m => ({
            name: m.name,
            internal_code: m.internal_code,
            brand_name: m.brand_name,
            category_slug: m.category_slug,
            description: m.description,
            empty_weight_grams: m.empty_weight_grams,
            full_weight_grams: m.full_weight_grams,
            attributes: m.attributes,
            custom_attributes: m.custom_attributes
          })),
        workflowStates: workflowDraft
          .filter(w => w.selected)
          .map((w, idx) => ({
            code: w.code,
            name: w.name,
            color: w.color,
            stage_type: w.stage_type,
            sort_order: idx + 1,
            is_initial: w.is_initial,
            is_final: w.is_final
          })),
        replaceWorkflowStates
      };

      const res = AppStore.applyPresetSelection(
        currentCompany.id,
        selection,
        currentUser?.full_name
      );

      const addedParts = [
        res.addedCategories > 0 ? `${res.addedCategories} categoria(s)` : null,
        res.addedBrands > 0 ? `${res.addedBrands} fabricante(s)` : null,
        res.addedServices > 0 ? `${res.addedServices} serviço(s)` : null,
        res.addedModels > 0 ? `${res.addedModels} modelo(s)` : null,
        res.addedWorkflowStates > 0 ? `${res.addedWorkflowStates} etapa(s) Kanban` : null
      ].filter(Boolean);

      toast.success(
        addedParts.length > 0
          ? `Importação concluída: ${addedParts.join(', ')} adicionados à loja!`
          : 'Catálogo sincronizado! Todos os itens marcados já existiam na loja.'
      );

      setExistingVersion(v => v + 1);
      refreshUser();
      onComplete?.(res);
      if (mode === 'modal') {
        onClose?.();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao importar pré-cadastros.');
    }
  };

  const q = searchQuery.trim().toLowerCase();

  const filteredCategories = categoriesDraft.filter(
    c => !q || c.name.toLowerCase().includes(q) || c.identifier_label.toLowerCase().includes(q)
  );
  const filteredBrands = brandsDraft.filter(
    b => !q || b.name.toLowerCase().includes(q)
  );
  const filteredServices = servicesDraft.filter(
    s => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
  );
  const filteredModels = modelsDraft.filter(
    m =>
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.brand_name.toLowerCase().includes(q) ||
      m.internal_code.toLowerCase().includes(q)
  );
  const filteredWorkflow = workflowDraft.filter(
    w => !q || w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q)
  );

  const wizardContent = (
    <div
      className={cn(
        'bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800 flex flex-col',
        mode === 'modal'
          ? 'rounded-2xl w-full max-w-5xl max-h-[92vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95'
          : 'rounded-2xl shadow-sm overflow-hidden'
      )}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 via-sky-500/5 to-transparent flex items-start justify-between gap-4 shrink-0">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isFirstAccess
                  ? 'Assistente de Pré-Cadastros da Loja (1º Acesso)'
                  : 'Biblioteca Flexível de Pré-Cadastros'}
              </h2>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                Exclusivo Administrador
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Combine um ou mais segmentos e marque exatamente quais categorias, fabricantes, serviços (com preços editáveis), modelos e etapas Kanban deseja puxar.
            </p>
          </div>
        </div>

        {mode === 'modal' && !isFirstAccess && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Step 1: Multi-Segment Library Selector */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  {hasMultiSegmentModule
                    ? '1. Escolha um ou mais Segmentos para Combinar'
                    : '1. Escolha o Segmento do Catálogo'}
                </p>
                {!hasMultiSegmentModule && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70 px-2 py-0.5 text-[10px] font-bold">
                    <Lock className="w-3 h-3" />
                    1 segmento por vez neste plano
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {hasMultiSegmentModule
                  ? 'Você pode marcar vários ramos simultaneamente para montar uma lista personalizada sem engessamento.'
                  : 'Planos com o módulo Múltiplos Segmentos Simultâneos permitem combinar vários ramos em uma única importação.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {hasMultiSegmentModule && (
                <>
                  <button
                    type="button"
                    onClick={selectAllSegments}
                    className="text-[11px] font-bold text-emerald-600 hover:underline px-2 py-1"
                  >
                    Combinar Todos
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                </>
              )}
              <button
                type="button"
                onClick={clearSegments}
                className="text-[11px] font-semibold text-slate-500 hover:underline px-2 py-1"
              >
                Limpar Segmentos
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {(Object.keys(BUSINESS_PRESETS) as BusinessTemplateKey[]).map(segKey => {
              const preset = BUSINESS_PRESETS[segKey];
              const Icon = SEGMENT_ICONS[segKey] || Layers;
              const isSelected = selectedSegments.includes(segKey);
              return (
                <button
                  key={segKey}
                  type="button"
                  onClick={() => toggleSegment(segKey)}
                  className={cn(
                    'text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 relative',
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1 pr-5">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                      {preset.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {preset.categories.length} cat • {preset.brands.length} marcas • {preset.services.length} serv • {preset.models.length} mod
                    </p>
                  </div>
                  <div
                    className={cn(
                      'w-4 h-4 rounded flex items-center justify-center border absolute top-3 right-3',
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-700'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: 5 Interactive Groups */}
        <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              2. Personalize Item a Item Antes de Puxar
            </p>
            <div className="flex items-center gap-2">
              <div className="relative w-52">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filtrar itens nesta aba..."
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => toggleGroupSelection(true)}
                className="h-8 px-2.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400"
              >
                Marcar Novos
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => toggleGroupSelection(false)}
                className="h-8 px-2.5 text-[11px] font-semibold"
              >
                Desmarcar Aba
              </Button>
            </div>
          </div>

          {/* Sub-Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
            {[
              { id: 'categories' as GroupTab, label: 'Categorias', icon: Layers, count: counts.categories, total: categoriesDraft.length },
              { id: 'brands' as GroupTab, label: 'Fabricantes', icon: Building, count: counts.brands, total: brandsDraft.length },
              { id: 'services' as GroupTab, label: 'Tabela de Serviços', icon: Wrench, count: counts.services, total: servicesDraft.length },
              { id: 'models' as GroupTab, label: 'Modelos & Produtos', icon: Tag, count: counts.models, total: modelsDraft.length },
              { id: 'workflow' as GroupTab, label: 'Etapas Kanban', icon: Kanban, count: counts.workflow, total: workflowDraft.length }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeGroup === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveGroup(tab.id);
                    setSearchQuery('');
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                    active
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-full text-[10px] font-extrabold',
                      active
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    {tab.count}/{tab.total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Group Panels */}
          {activeGroup === 'categories' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <Input
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Nova categoria personalizada (ex: Drone, Nobreak)..."
                  className="flex-1 min-w-[200px] h-8 text-xs bg-white dark:bg-slate-900"
                />
                <Input
                  value={newCatIdentifier}
                  onChange={e => setNewCatIdentifier(e.target.value)}
                  placeholder="Rótulo do serial (ex: IMEI)"
                  className="w-44 h-8 text-xs bg-white dark:bg-slate-900"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCustomCategory}
                  className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredCategories.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    Nenhuma categoria listada. Selecione um segmento acima ou adicione uma categoria personalizada.
                  </p>
                ) : (
                  filteredCategories.map(cat => (
                    <div
                      key={cat.tempId}
                      className={cn(
                        'p-2.5 rounded-xl border flex flex-wrap items-center gap-2.5 text-xs',
                        cat.selected
                          ? 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/60'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={cat.selected}
                        onChange={e =>
                          setCategoriesDraft(prev =>
                            prev.map(item =>
                              item.tempId === cat.tempId
                                ? { ...item, selected: e.target.checked }
                                : item
                            )
                          )
                        }
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 shrink-0"
                      />
                      <Input
                        value={cat.name}
                        onChange={e =>
                          setCategoriesDraft(prev =>
                            prev.map(item =>
                              item.tempId === cat.tempId
                                ? { ...item, name: e.target.value }
                                : item
                            )
                          )
                        }
                        className="flex-1 min-w-[180px] h-8 text-xs font-semibold"
                        aria-label="Nome da categoria"
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-semibold">Identificador:</span>
                        <Input
                          value={cat.identifier_label}
                          onChange={e =>
                            setCategoriesDraft(prev =>
                              prev.map(item =>
                                item.tempId === cat.tempId
                                  ? { ...item, identifier_label: e.target.value }
                                  : item
                              )
                            )
                          }
                          className="w-36 h-8 text-xs"
                        />
                      </div>
                      {(cat.custom_fields?.length || 0) > 0 && (
                        <Badge className="bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold">
                          {cat.custom_fields!.length} opcionais
                        </Badge>
                      )}
                      {cat.alreadyExists && (
                        <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          Já cadastrado
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeGroup === 'brands' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <Input
                  value={newBrandNames}
                  onChange={e => setNewBrandNames(e.target.value)}
                  placeholder="Adicionar fabricante(s) separado por vírgula (ex: Multilaser, Philco, Vaio)..."
                  className="flex-1 min-w-[220px] h-8 text-xs bg-white dark:bg-slate-900"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCustomBrands}
                  className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Fabricante</span>
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                {filteredBrands.length === 0 ? (
                  <p className="col-span-full text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    Nenhum fabricante listado. Selecione segmentos acima ou digite manualmente.
                  </p>
                ) : (
                  filteredBrands.map(brand => (
                    <label
                      key={brand.tempId}
                      className={cn(
                        'p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer text-xs transition-all',
                        brand.selected
                          ? 'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 dark:border-emerald-900/70 font-bold text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={brand.selected}
                          onChange={e =>
                            setBrandsDraft(prev =>
                              prev.map(item =>
                                item.tempId === brand.tempId
                                  ? { ...item, selected: e.target.checked }
                                  : item
                              )
                            )
                          }
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 shrink-0"
                        />
                        <span className="truncate">{brand.name}</span>
                      </div>
                      {brand.alreadyExists && (
                        <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] shrink-0">
                          Já existe
                        </Badge>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {activeGroup === 'services' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <Input
                  value={newServiceName}
                  onChange={e => setNewServiceName(e.target.value)}
                  placeholder="Novo serviço personalizado (ex: Limpeza Completa de Cooler)..."
                  className="flex-1 min-w-[220px] h-8 text-xs bg-white dark:bg-slate-900"
                />
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newServicePrice}
                  onChange={e => setNewServicePrice(e.target.value)}
                  placeholder="Preço R$"
                  className="w-28 h-8 text-xs font-bold bg-white dark:bg-slate-900"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCustomService}
                  className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredServices.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    Nenhum serviço listado. Selecione segmentos acima ou adicione serviços personalizados.
                  </p>
                ) : (
                  filteredServices.map(srv => (
                    <div
                      key={srv.tempId}
                      className={cn(
                        'p-2.5 rounded-xl border flex flex-wrap items-center gap-2.5 text-xs',
                        srv.selected
                          ? 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/60'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={srv.selected}
                        onChange={e =>
                          setServicesDraft(prev =>
                            prev.map(item =>
                              item.tempId === srv.tempId
                                ? { ...item, selected: e.target.checked }
                                : item
                            )
                          )
                        }
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 shrink-0"
                      />
                      <Input
                        value={srv.name}
                        onChange={e =>
                          setServicesDraft(prev =>
                            prev.map(item =>
                              item.tempId === srv.tempId
                                ? { ...item, name: e.target.value }
                                : item
                            )
                          )
                        }
                        className="flex-1 min-w-[200px] h-8 text-xs font-semibold"
                        aria-label="Nome do serviço"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-bold text-slate-400">R$</span>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={srv.default_price}
                          onChange={e =>
                            setServicesDraft(prev =>
                              prev.map(item =>
                                item.tempId === srv.tempId
                                  ? { ...item, default_price: Math.max(0, Number(e.target.value) || 0) }
                                  : item
                              )
                            )
                          }
                          className="w-24 h-8 text-xs font-bold text-emerald-700 dark:text-emerald-400"
                          aria-label="Preço do serviço"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={5}
                          step={5}
                          value={srv.estimated_time_minutes}
                          onChange={e =>
                            setServicesDraft(prev =>
                              prev.map(item =>
                                item.tempId === srv.tempId
                                  ? { ...item, estimated_time_minutes: Math.max(5, parseInt(e.target.value, 10) || 30) }
                                  : item
                              )
                            )
                          }
                          className="w-16 h-8 text-xs"
                          aria-label="Tempo estimado em minutos"
                        />
                        <span className="text-[10px] text-slate-400 font-semibold">min</span>
                      </div>
                      {srv.alreadyExists && (
                        <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          Já cadastrado
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeGroup === 'models' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <Input
                  value={newModelName}
                  onChange={e => setNewModelName(e.target.value)}
                  placeholder="Novo modelo/produto (ex: MacBook Pro M3, iPhone 15)..."
                  className="flex-1 min-w-[200px] h-8 text-xs bg-white dark:bg-slate-900"
                />
                <Input
                  value={newModelBrand}
                  onChange={e => setNewModelBrand(e.target.value)}
                  placeholder="Marca (ex: Apple)"
                  className="w-32 h-8 text-xs bg-white dark:bg-slate-900"
                />
                <Input
                  value={newModelSku}
                  onChange={e => setNewModelSku(e.target.value)}
                  placeholder="Código / SKU"
                  className="w-28 h-8 text-xs bg-white dark:bg-slate-900"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCustomModel}
                  className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredModels.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    Nenhum modelo listado. Selecione segmentos acima ou adicione modelos manualmente.
                  </p>
                ) : (
                  filteredModels.map(mod => (
                    <div
                      key={mod.tempId}
                      className={cn(
                        'p-2.5 rounded-xl border flex flex-wrap items-center gap-2.5 text-xs',
                        mod.selected
                          ? 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/60'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={mod.selected}
                        onChange={e =>
                          setModelsDraft(prev =>
                            prev.map(item =>
                              item.tempId === mod.tempId
                                ? { ...item, selected: e.target.checked }
                                : item
                            )
                          )
                        }
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 shrink-0"
                      />
                      <Input
                        value={mod.name}
                        onChange={e =>
                          setModelsDraft(prev =>
                            prev.map(item =>
                              item.tempId === mod.tempId
                                ? { ...item, name: e.target.value }
                                : item
                            )
                          )
                        }
                        className="flex-1 min-w-[190px] h-8 text-xs font-semibold"
                        aria-label="Nome do modelo"
                      />
                      <Input
                        value={mod.internal_code}
                        onChange={e =>
                          setModelsDraft(prev =>
                            prev.map(item =>
                              item.tempId === mod.tempId
                                ? { ...item, internal_code: e.target.value }
                                : item
                            )
                          )
                        }
                        placeholder="SKU"
                        className="w-28 h-8 text-xs font-mono"
                      />
                      {mod.brand_name && (
                        <Badge className="bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 text-[10px]">
                          {mod.brand_name}
                        </Badge>
                      )}
                      {mod.alreadyExists && (
                        <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          Já cadastrado
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeGroup === 'workflow' && (
            <div className="space-y-3">
              {existingSnapshot.hasExistingStates && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs">
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-200">
                      Sua loja já possui colunas cadastradas no Kanban
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      Escolha se deseja apenas adicionar etapas novas ou substituir todo o fluxo pelas etapas marcadas abaixo.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReplaceWorkflowStates(false)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg font-bold border text-[11px]',
                        !replaceWorkflowStates
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                          : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-300 dark:border-slate-700'
                      )}
                    >
                      Mesclar Novas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplaceWorkflowStates(true);
                        setWorkflowDraft(prev => prev.map(w => ({ ...w, selected: true })));
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg font-bold border text-[11px] flex items-center gap-1',
                        replaceWorkflowStates
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white dark:bg-slate-900 text-amber-700 border-amber-300 dark:border-amber-800'
                      )}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Substituir Kanban Atual</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <Input
                  value={newStageName}
                  onChange={e => setNewStageName(e.target.value)}
                  placeholder="Nova etapa personalizada do Kanban (ex: Aguardando Cliente Retirar)..."
                  className="flex-1 min-w-[220px] h-8 text-xs bg-white dark:bg-slate-900"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCustomStage}
                  className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Etapa</span>
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredWorkflow.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    Nenhuma etapa Kanban listada. Selecione segmentos acima ou crie suas próprias etapas.
                  </p>
                ) : (
                  filteredWorkflow.map((st, idx) => (
                    <div
                      key={st.tempId}
                      className={cn(
                        'p-2.5 rounded-xl border flex flex-wrap items-center gap-2 text-xs',
                        st.selected
                          ? 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/60'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={st.selected}
                        onChange={e =>
                          setWorkflowDraft(prev =>
                            prev.map(item =>
                              item.tempId === st.tempId
                                ? { ...item, selected: e.target.checked }
                                : item
                            )
                          )
                        }
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 shrink-0"
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-400 w-5 text-center">
                        #{idx + 1}
                      </span>
                      <Input
                        value={st.name}
                        onChange={e =>
                          setWorkflowDraft(prev =>
                            prev.map(item =>
                              item.tempId === st.tempId
                                ? { ...item, name: e.target.value }
                                : item
                            )
                          )
                        }
                        className="flex-1 min-w-[160px] h-8 text-xs font-semibold"
                        aria-label="Nome da etapa Kanban"
                      />
                      <Select
                        value={st.color}
                        onChange={e =>
                          setWorkflowDraft(prev =>
                            prev.map(item =>
                              item.tempId === st.tempId
                                ? { ...item, color: e.target.value as KanbanColumnColor }
                                : item
                            )
                          )
                        }
                        className="w-32 h-8 text-xs"
                      >
                        {COLOR_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                      <Select
                        value={st.stage_type}
                        onChange={e =>
                          setWorkflowDraft(prev =>
                            prev.map(item =>
                              item.tempId === st.tempId
                                ? { ...item, stage_type: e.target.value as StageType }
                                : item
                            )
                          )
                        }
                        className="w-40 h-8 text-xs"
                      >
                        {STAGE_TYPE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveWorkflowRow(idx, -1)}
                          className="p-1 text-slate-400 hover:text-slate-700"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveWorkflowRow(idx, 1)}
                          className="p-1 text-slate-400 hover:text-slate-700"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {st.alreadyExists && !replaceWorkflowStates && (
                        <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          Já existe
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
          <span>Selecionados para puxar:</span>
          <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px]">
            {counts.categories} cat
          </Badge>
          <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px]">
            {counts.brands} marcas
          </Badge>
          <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px]">
            {counts.services} serv
          </Badge>
          <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px]">
            {counts.models} mod
          </Badge>
          <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px]">
            {counts.workflow} Kanban
          </Badge>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {mode === 'modal' && isFirstAccess && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDismiss}
              className="text-xs font-semibold"
            >
              Configurar Depois (Loja Limpa)
            </Button>
          )}
          {mode === 'modal' && !isFirstAccess && onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs font-semibold"
            >
              Fechar
            </Button>
          )}
          <Button
            type="button"
            onClick={handleImport}
            disabled={totalSelected === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2 shadow-lg shadow-emerald-600/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Importar {totalSelected} Pré-Cadastro(s) Selecionado(s)</span>
          </Button>
        </div>
      </div>
    </div>
  );

  if (mode === 'inline') {
    return wizardContent;
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {wizardContent}
    </div>
  );
}
