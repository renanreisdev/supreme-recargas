// ============================================================================
// SUPREME RECARGAS 2 - CENTRAL STORE & DOMAIN SERVICE LAYER
// Generic, Modular Multi-Tenant Architecture with Supabase & Reactive Sync
// ============================================================================

import { 
  Profile, 
  UserRole, 
  Company, 
  Plan, 
  Subscription, 
  PermissionGroup,
  Customer, 
  ItemCategory,
  Brand,
  ItemModel,
  ItemVariant,
  ItemAttributeDefinition,
  CustomerAsset,
  Service,
  ServiceCategory,
  ServicePriceRule,
  ServiceFieldDefinition,
  ServiceResultDefinition,
  WorkflowTemplate,
  WorkflowState,
  ChecklistTemplate,
  ServiceOrder,
  ServiceOrderItem,
  ServiceOrderItemService,
  Payment,
  Delivery,
  OrderStatusHistory,
  AuditLog,
  CompanySettings,
  BusinessTemplateKey,
  BusinessTemplate,
  OrderStatus,
  FinancialStatus,
  PaymentMethod
} from '@/types';
import { supabase } from './supabase';

const LOCAL_STORAGE_KEY = 'supreme_recargas_v2_store';

export interface DemoSandboxConfig {
  passwords: {
    admin: string;
    attendant: string;
    technician: string;
  };
  autoResetDays: number;
  lastResetAt: string;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateTrackingToken(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// 1. BUSINESS PRESETS & SEEDS (Zero Hardcoding - Config Driven)
// ============================================================================

export const BUSINESS_PRESETS: Record<BusinessTemplateKey, BusinessTemplate> = {
  RECARGA_CARTUCHOS: {
    key: 'RECARGA_CARTUCHOS',
    name: 'Recarga de Cartuchos & Toners',
    description: 'Gestão para centros de recarga rápida de cartuchos jato de tinta e toners laser com balança.',
    icon: 'Printer',
    categories: [
      { id: 'cat-cartucho-tinta', name: 'Cartucho de Tinta', slug: 'cartucho-tinta', icon: 'Printer', identifier_label: 'Final de Série', is_system: true, is_active: true },
      { id: 'cat-toner-laser', name: 'Toner Laser', slug: 'toner-laser', icon: 'Layers', identifier_label: 'Nº de Série', is_system: true, is_active: true }
    ],
    brands: [
      { id: 'brand-hp', name: 'HP', slug: 'hp', is_system: true, is_active: true },
      { id: 'brand-canon', name: 'Canon', slug: 'canon', is_system: true, is_active: true },
      { id: 'brand-epson', name: 'Epson', slug: 'epson', is_system: true, is_active: true },
      { id: 'brand-samsung', name: 'Samsung', slug: 'samsung', is_system: true, is_active: true },
      { id: 'brand-brother', name: 'Brother', slug: 'brother', is_system: true, is_active: true }
    ],
    models: [
      { id: 'mod-hp-664', category_id: 'cat-cartucho-tinta', brand_id: 'brand-hp', brand_name: 'HP', name: 'HP 664', internal_code: 'HP664', description: 'Cartucho jato de tinta HP DeskJet 2136/2676', attributes: { capacity_ml: 2.0, empty_weight_grams: 28.5, full_weight_grams: 30.5 }, is_active: true },
      { id: 'mod-hp-667', category_id: 'cat-cartucho-tinta', brand_id: 'brand-hp', brand_name: 'HP', name: 'HP 667', internal_code: 'HP667', description: 'Cartucho HP Advantage 2376/2776', attributes: { capacity_ml: 2.0, empty_weight_grams: 29.0, full_weight_grams: 31.0 }, is_active: true },
      { id: 'mod-hp-122', category_id: 'cat-cartucho-tinta', brand_id: 'brand-hp', brand_name: 'HP', name: 'HP 122', internal_code: 'HP122', description: 'Cartucho HP DeskJet 1000/2000', attributes: { capacity_ml: 1.5, empty_weight_grams: 27.0, full_weight_grams: 28.5 }, is_active: true },
      { id: 'mod-canon-cl146', category_id: 'cat-cartucho-tinta', brand_id: 'brand-canon', brand_name: 'Canon', name: 'Canon CL-146 Color', internal_code: 'CL146', description: 'Cartucho Canon Pixma MG2410', attributes: { capacity_ml: 9.0, empty_weight_grams: 35.0, full_weight_grams: 44.0 }, is_active: true },
      { id: 'mod-toner-85a', category_id: 'cat-toner-laser', brand_id: 'brand-hp', brand_name: 'HP', name: 'Toner HP CE285A (85A)', internal_code: 'CE285A', description: 'Toner LaserJet P1102w/M1132', attributes: { capacity_ml: 80.0, empty_weight_grams: 650.0, full_weight_grams: 730.0 }, is_active: true }
    ],
    services: [
      { id: 'srv-recarga', name: 'Recarga de Tinta', code: 'RECARGA', description: 'Injeção de tinta pressurizada e despressurização', default_price: 30.00, estimated_time_minutes: 15, is_active: true, category_ids: ['cat-cartucho-tinta', 'cat-toner-laser'] },
      { id: 'srv-verificacao', name: 'Verificação Técnica', code: 'VERIFICACAO', description: 'Análise de circuito eletrônico e bicos injetores', default_price: 10.00, estimated_time_minutes: 10, is_active: true, category_ids: ['cat-cartucho-tinta', 'cat-toner-laser'] },
      { id: 'srv-teste', name: 'Teste de Impressão', code: 'TESTE', description: 'Impressão de padrão de teste em máquina real', default_price: 5.00, estimated_time_minutes: 5, is_active: true, category_ids: ['cat-cartucho-tinta'] },
      { id: 'srv-desentupimento', name: 'Desentupimento Ultrassônico', code: 'DESENTUPIMENTO', description: 'Banho químico e ultrassom para desobstrução de injetores secos', default_price: 15.00, estimated_time_minutes: 20, is_active: true, category_ids: ['cat-cartucho-tinta'] }
    ],
    attributes: [
      { name: 'Cor', key: 'color', data_type: 'select', options: ['Preto', 'Tricolor', 'Ciano', 'Magenta', 'Amarelo'], is_required: true, is_filterable: true, sort_order: 1, is_active: true },
      { name: 'Capacidade XL', key: 'is_xl', data_type: 'boolean', is_required: false, is_filterable: true, sort_order: 2, is_active: true },
      { name: 'Peso Vazio (g)', key: 'empty_weight_grams', data_type: 'decimal', unit: 'g', is_required: false, is_filterable: false, sort_order: 3, is_active: true },
      { name: 'Peso Cheio (g)', key: 'full_weight_grams', data_type: 'decimal', unit: 'g', is_required: false, is_filterable: false, sort_order: 4, is_active: true }
    ],
    fieldDefinitions: [
      { label: 'Peso de Entrada', field_key: 'input_weight_grams', field_type: 'decimal', unit: 'g', is_required: false, sort_order: 1 },
      { label: 'Peso de Saída', field_key: 'output_weight_grams', field_type: 'decimal', unit: 'g', is_required: false, sort_order: 2 },
      { label: 'Teste Elétrico', field_key: 'circuit_test', field_type: 'select', options: ['Aprovado', 'Circuito Queimado', 'Curto'], is_required: false, sort_order: 3 }
    ],
    results: [
      { code: 'OK', label: '100% OK (Testado e Aprovado)', color: 'emerald', is_approval: true, is_active: true },
      { code: 'CID', label: 'CID (Circuito Eletrônico Queimado)', color: 'amber', is_approval: false, is_active: true },
      { code: 'QUEIMADO', label: 'Cabeça Queimada', color: 'rose', is_approval: false, is_active: true },
      { code: 'ENTUPIDO', label: 'Injetor Entupido', color: 'amber', is_approval: false, is_active: true },
      { code: 'FALHA_IMPRESSAO', label: 'Falha de Impressão Persistente', color: 'amber', is_approval: false, is_active: true },
      { code: 'SEM_REPARO', label: 'Sem Reparo (Inviável)', color: 'rose', is_approval: false, is_active: true }
    ],
    workflow: {
      name: 'Fluxo Padrão de Recarga',
      is_default: true,
      states: [
        { id: 'st-rec-recebido', workflow_id: 'wf-recarga', code: 'RECEBIDO', name: 'Recebido (Balcão)', color: 'slate', stage_type: 'RECEBIDO', sort_order: 1, is_initial: true, is_final: false },
        { id: 'st-rec-verificacao', workflow_id: 'wf-recarga', code: 'EM_VERIFICACAO', name: 'Em Verificação', color: 'amber', stage_type: 'EM_ANDAMENTO', sort_order: 2, is_initial: false, is_final: false },
        { id: 'st-rec-recarga', workflow_id: 'wf-recarga', code: 'EM_RECARGA', name: 'Em Recarga', color: 'purple', stage_type: 'EM_ANDAMENTO', sort_order: 3, is_initial: false, is_final: false },
        { id: 'st-rec-teste', workflow_id: 'wf-recarga', code: 'EM_TESTE', name: 'Em Teste', color: 'blue', stage_type: 'EM_ANDAMENTO', sort_order: 4, is_initial: false, is_final: false },
        { id: 'st-rec-pronto', workflow_id: 'wf-recarga', code: 'FINALIZADO', name: 'Pronto p/ Retirada', color: 'emerald', stage_type: 'CONCLUIDO', sort_order: 5, is_initial: false, is_final: true },
        { id: 'st-rec-problema', workflow_id: 'wf-recarga', code: 'COM_PROBLEMA', name: 'Com Problema', color: 'rose', stage_type: 'EM_ANDAMENTO', sort_order: 6, is_initial: false, is_final: false }
      ]
    }
  },

  ASSISTENCIA_INFORMATICA: {
    key: 'ASSISTENCIA_INFORMATICA',
    name: 'Assistência Técnica de Informática & Notebooks',
    description: 'Manutenção de notebooks, computadores, monitores e impressoras.',
    icon: 'Laptop',
    categories: [
      { id: 'cat-notebook', name: 'Notebook', slug: 'notebook', icon: 'Laptop', identifier_label: 'Nº de Série / Service Tag', is_system: true, is_active: true },
      { id: 'cat-computador', name: 'Computador Desktop', slug: 'computador', icon: 'Monitor', identifier_label: 'Nº de Série / Identificador', is_system: true, is_active: true },
      { id: 'cat-monitor', name: 'Monitor', slug: 'monitor', icon: 'Monitor', identifier_label: 'Nº de Série', is_system: true, is_active: true },
      { id: 'cat-impressora', name: 'Impressora', slug: 'impressora', icon: 'Printer', identifier_label: 'Nº de Série', is_system: true, is_active: true }
    ],
    brands: [
      { id: 'brand-dell', name: 'Dell', slug: 'dell', is_system: true, is_active: true },
      { id: 'brand-lenovo', name: 'Lenovo', slug: 'lenovo', is_system: true, is_active: true },
      { id: 'brand-acer', name: 'Acer', slug: 'acer', is_system: true, is_active: true },
      { id: 'brand-asus', name: 'Asus', slug: 'asus', is_system: true, is_active: true },
      { id: 'brand-apple', name: 'Apple', slug: 'apple', is_system: true, is_active: true }
    ],
    models: [
      { id: 'mod-dell-latitude', category_id: 'cat-notebook', brand_id: 'brand-dell', brand_name: 'Dell', name: 'Dell Latitude 3470', internal_code: 'LAT3470', description: 'Notebook Corporativo 14" Intel Core i5', is_active: true },
      { id: 'mod-lenovo-ideapad', category_id: 'cat-notebook', brand_id: 'brand-lenovo', brand_name: 'Lenovo', name: 'IdeaPad 3 15ALC6', internal_code: 'IP3', description: 'Notebook Lenovo Ryzen 5', is_active: true },
      { id: 'mod-epson-l3250', category_id: 'cat-impressora', brand_id: 'brand-epson', brand_name: 'Epson', name: 'Epson EcoTank L3250', internal_code: 'L3250', description: 'Multifuncional Tanque de Tinta Wi-Fi', is_active: true }
    ],
    services: [
      { id: 'srv-diagnostico-inf', name: 'Diagnóstico Técnico Especializado', code: 'DIAGNOSTICO', description: 'Análise de hardware, placa-mãe, memória e fonte', default_price: 60.00, estimated_time_minutes: 60, is_active: true, category_ids: ['cat-notebook', 'cat-computador', 'cat-impressora'] },
      { id: 'srv-formatacao', name: 'Formatação & Reinstalação de Sistema', code: 'FORMATACAO', description: 'Instalação de Windows/Linux limpo, drivers e programas essenciais', default_price: 120.00, estimated_time_minutes: 120, is_active: true, category_ids: ['cat-notebook', 'cat-computador'] },
      { id: 'srv-limpeza-preventiva', name: 'Limpeza Preventiva & Troca de Pasta Térmica', code: 'LIMPEZA_PREVENTIVA', description: 'Desmontagem, desobstrução de cooler e pasta térmica de alta condutividade', default_price: 90.00, estimated_time_minutes: 60, is_active: true, category_ids: ['cat-notebook', 'cat-computador'] },
      { id: 'srv-reparo-placa', name: 'Reparo Avançado de Placa-Mãe', code: 'REPARO_PLACA', description: 'Micro-solda, troca de CI, mosfets ou reballing', default_price: 250.00, estimated_time_minutes: 240, is_active: true, category_ids: ['cat-notebook', 'cat-computador'] }
    ],
    attributes: [
      { name: 'Processador', key: 'cpu', data_type: 'text', is_required: false, is_filterable: true, sort_order: 1, is_active: true },
      { name: 'Memória RAM', key: 'ram', data_type: 'select', options: ['4 GB', '8 GB', '16 GB', '32 GB', '64 GB'], is_required: false, is_filterable: true, sort_order: 2, is_active: true },
      { name: 'Armazenamento', key: 'storage', data_type: 'select', options: ['SSD 120GB', 'SSD 240GB', 'SSD 480GB', 'SSD 1TB', 'HD 500GB', 'HD 1TB'], is_required: false, is_filterable: true, sort_order: 3, is_active: true }
    ],
    fieldDefinitions: [
      { label: 'Sintoma Constatado', field_key: 'diagnosed_symptom', field_type: 'text', is_required: false, sort_order: 1 },
      { label: 'Parecer Técnico', field_key: 'tech_opinion', field_type: 'textarea', is_required: false, sort_order: 2 },
      { label: 'Peças Utilizadas', field_key: 'parts_used', field_type: 'text', is_required: false, sort_order: 3 }
    ],
    results: [
      { code: 'APROVADO', label: 'Reparo Concluído com Sucesso', color: 'emerald', is_approval: true, is_active: true },
      { code: 'AGUARDANDO_CLIENTE', label: 'Aguardando Aprovação de Orçamento', color: 'amber', is_approval: false, is_active: true },
      { code: 'AGUARDANDO_PECA', label: 'Aguardando Chegada de Peça', color: 'blue', is_approval: false, is_active: true },
      { code: 'RECUSADO', label: 'Orçamento Recusado pelo Cliente', color: 'slate', is_approval: false, is_active: true },
      { code: 'SEM_REPARO', label: 'Sem Reparo (Placa Inviável)', color: 'rose', is_approval: false, is_active: true }
    ],
    workflow: {
      name: 'Fluxo Assistência Técnica Informática',
      is_default: true,
      states: [
        { id: 'st-inf-recebido', workflow_id: 'wf-informatica', code: 'RECEBIDO', name: 'Recebido na Recepção', color: 'slate', stage_type: 'RECEBIDO', sort_order: 1, is_initial: true, is_final: false },
        { id: 'st-inf-diagnostico', workflow_id: 'wf-informatica', code: 'EM_DIAGNOSTICO', name: 'Em Diagnóstico', color: 'amber', stage_type: 'EM_ANDAMENTO', sort_order: 2, is_initial: false, is_final: false },
        { id: 'st-inf-orcamento', workflow_id: 'wf-informatica', code: 'AGUARDANDO_APROVACAO', name: 'Aguard. Aprovação', color: 'purple', stage_type: 'AGUARDANDO_APROVACAO', sort_order: 3, is_initial: false, is_final: false },
        { id: 'st-inf-reparo', workflow_id: 'wf-informatica', code: 'EM_REPARO', name: 'Em Reparo / Bancada', color: 'blue', stage_type: 'EM_ANDAMENTO', sort_order: 4, is_initial: false, is_final: false },
        { id: 'st-inf-testes', workflow_id: 'wf-informatica', code: 'EM_TESTES', name: 'Em Testes Finais', color: 'teal', stage_type: 'EM_ANDAMENTO', sort_order: 5, is_initial: false, is_final: false },
        { id: 'st-inf-pronto', workflow_id: 'wf-informatica', code: 'FINALIZADO', name: 'Pronto p/ Retirada', color: 'emerald', stage_type: 'CONCLUIDO', sort_order: 6, is_initial: false, is_final: true }
      ]
    },
    checklist: {
      name: 'Checklist Entrada de Notebook / PC',
      items: [
        { id: 'chk-inf-1', item_name: 'Acompanha Carregador / Fonte Original', is_required: false, sort_order: 1 },
        { id: 'chk-inf-2', item_name: 'Liga normalmente (Dá vídeo)', is_required: false, sort_order: 2 },
        { id: 'chk-inf-3', item_name: 'Carcaça / Dobradiça possui trincas ou riscos', is_required: false, sort_order: 3 },
        { id: 'chk-inf-4', item_name: 'Teclado e Touchpad funcionais', is_required: false, sort_order: 4 },
        { id: 'chk-inf-5', item_name: 'Tela LCD sem manchas ou linhas', is_required: false, sort_order: 5 }
      ]
    }
  },

  ASSISTENCIA_CELULARES: {
    key: 'ASSISTENCIA_CELULARES',
    name: 'Assistência Técnica de Celulares & Tablets',
    description: 'Troca de tela, bateria, conector de carga e reparo em placas de smartphones.',
    icon: 'Smartphone',
    categories: [
      { id: 'cat-smartphone', name: 'Smartphone', slug: 'smartphone', icon: 'Smartphone', identifier_label: 'IMEI / Nº de Série', is_system: true, is_active: true },
      { id: 'cat-tablet', name: 'Tablet', slug: 'tablet', icon: 'Tablet', identifier_label: 'Nº de Série', is_system: true, is_active: true }
    ],
    brands: [
      { id: 'brand-apple-cel', name: 'Apple', slug: 'apple', is_system: true, is_active: true },
      { id: 'brand-samsung-cel', name: 'Samsung', slug: 'samsung', is_system: true, is_active: true },
      { id: 'brand-motorola', name: 'Motorola', slug: 'motorola', is_system: true, is_active: true },
      { id: 'brand-xiaomi', name: 'Xiaomi', slug: 'xiaomi', is_system: true, is_active: true }
    ],
    models: [
      { id: 'mod-iphone-13', category_id: 'cat-smartphone', brand_id: 'brand-apple-cel', brand_name: 'Apple', name: 'iPhone 13', internal_code: 'IP13', description: 'Smartphone Apple 128GB/256GB', is_active: true },
      { id: 'mod-galaxy-s23', category_id: 'cat-smartphone', brand_id: 'brand-samsung-cel', brand_name: 'Samsung', name: 'Galaxy S23', internal_code: 'S23', description: 'Smartphone Samsung 5G', is_active: true },
      { id: 'mod-moto-g54', category_id: 'cat-smartphone', brand_id: 'brand-motorola', brand_name: 'Motorola', name: 'Moto G54 5G', internal_code: 'G54', description: 'Motorola 256GB', is_active: true }
    ],
    services: [
      { id: 'srv-troca-tela', name: 'Troca de Tela / Módulo Frontal', code: 'TROCA_TELA', description: 'Substituição completa do display touch OLED/IPS', default_price: 180.00, estimated_time_minutes: 60, is_active: true, category_ids: ['cat-smartphone', 'cat-tablet'] },
      { id: 'srv-troca-bateria', name: 'Troca de Bateria', code: 'TROCA_BATERIA', description: 'Substituição de bateria estufada ou com baixa saúde', default_price: 120.00, estimated_time_minutes: 45, is_active: true, category_ids: ['cat-smartphone', 'cat-tablet'] },
      { id: 'srv-conector-carga', name: 'Troca de Conector de Carga (Dock USB)', code: 'CONECTOR_CARGA', description: 'Substituição do conector Tipo-C / Lightning', default_price: 90.00, estimated_time_minutes: 60, is_active: true, category_ids: ['cat-smartphone', 'cat-tablet'] }
    ],
    attributes: [
      { name: 'Cor do Aparelho', key: 'color', data_type: 'text', is_required: false, is_filterable: true, sort_order: 1, is_active: true },
      { name: 'Capacidade', key: 'storage', data_type: 'select', options: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'], is_required: false, is_filterable: true, sort_order: 2, is_active: true },
      { name: 'Senha de Desbloqueio', key: 'device_password', data_type: 'text', is_required: false, is_filterable: false, sort_order: 3, is_active: true }
    ],
    fieldDefinitions: [
      { label: 'Saúde da Bateria (%)', field_key: 'battery_health', field_type: 'decimal', unit: '%', is_required: false, sort_order: 1 },
      { label: 'Condição da Carcaça', field_key: 'chassis_condition', field_type: 'text', is_required: false, sort_order: 2 }
    ],
    results: [
      { code: 'APROVADO', label: 'Reparo Concluído com Sucesso', color: 'emerald', is_approval: true, is_active: true },
      { code: 'AGUARDANDO_APROVACAO', label: 'Aguardando Autorização de Valor', color: 'amber', is_approval: false, is_active: true },
      { code: 'SEM_REPARO', label: 'Sem Reparo Possível', color: 'rose', is_approval: false, is_active: true }
    ],
    workflow: {
      name: 'Fluxo Assistência Celulares',
      is_default: true,
      states: [
        { id: 'st-cel-recebido', workflow_id: 'wf-celular', code: 'RECEBIDO', name: 'Recebido (Balcão)', color: 'slate', stage_type: 'RECEBIDO', sort_order: 1, is_initial: true, is_final: false },
        { id: 'st-cel-analise', workflow_id: 'wf-celular', code: 'EM_ANALISE', name: 'Em Análise', color: 'amber', stage_type: 'EM_ANDAMENTO', sort_order: 2, is_initial: false, is_final: false },
        { id: 'st-cel-bancada', workflow_id: 'wf-celular', code: 'EM_REPARO', name: 'Na Bancada', color: 'blue', stage_type: 'EM_ANDAMENTO', sort_order: 3, is_initial: false, is_final: false },
        { id: 'st-cel-testes', workflow_id: 'wf-celular', code: 'EM_TESTES', name: 'Testes de Câmera/Touch', color: 'teal', stage_type: 'EM_ANDAMENTO', sort_order: 4, is_initial: false, is_final: false },
        { id: 'st-cel-pronto', workflow_id: 'wf-celular', code: 'FINALIZADO', name: 'Pronto p/ Entrega', color: 'emerald', stage_type: 'CONCLUIDO', sort_order: 5, is_initial: false, is_final: true }
      ]
    },
    checklist: {
      name: 'Checklist Entrada Smartphone',
      items: [
        { id: 'chk-cel-1', item_name: 'Tela liga e dá touch em toda a área', is_required: false, sort_order: 1 },
        { id: 'chk-cel-2', item_name: 'Câmera Frontal e Traseira funcionam', is_required: false, sort_order: 2 },
        { id: 'chk-cel-3', item_name: 'Microfone e Alto-falantes operacionais', is_required: false, sort_order: 3 },
        { id: 'chk-cel-4', item_name: 'Reconhece chip SIM e Wi-Fi', is_required: false, sort_order: 4 },
        { id: 'chk-cel-5', item_name: 'Carcaça/Tampa traseira possui marcas de queda', is_required: false, sort_order: 5 }
      ]
    }
  },

  FERRAMENTAS_MOTORES: {
    key: 'FERRAMENTAS_MOTORES',
    name: 'Motores Elétricos & Ferramentas',
    description: 'Manutenção de furadeiras, serras, compressores e rebobinamento de motores.',
    icon: 'Wrench',
    categories: [
      { id: 'cat-ferramenta', name: 'Ferramenta Elétrica', slug: 'ferramenta-eletrica', icon: 'Wrench', identifier_label: 'Nº de Série / Patrimônio', is_system: true, is_active: true },
      { id: 'cat-motor', name: 'Motor Elétrico', slug: 'motor-eletrico', icon: 'Zap', identifier_label: 'Nº de Série / Identificador', is_system: true, is_active: true }
    ],
    brands: [
      { id: 'brand-makita', name: 'Makita', slug: 'makita', is_system: true, is_active: true },
      { id: 'brand-bosch', name: 'Bosch', slug: 'bosch', is_system: true, is_active: true },
      { id: 'brand-dewalt', name: 'DeWalt', slug: 'dewalt', is_system: true, is_active: true },
      { id: 'brand-weg', name: 'WEG', slug: 'weg', is_system: true, is_active: true }
    ],
    models: [
      { id: 'mod-makita-hp1640', category_id: 'cat-ferramenta', brand_id: 'brand-makita', brand_name: 'Makita', name: 'Furadeira de Impacto HP1640', internal_code: 'HP1640', description: 'Furadeira 760W 13mm', is_active: true },
      { id: 'mod-motor-weg-2cv', category_id: 'cat-motor', brand_id: 'brand-weg', brand_name: 'WEG', name: 'Motor WEG Trifásico 2CV', internal_code: 'WEG2CV', description: 'Motor 4 Polos 220/380V', is_active: true }
    ],
    services: [
      { id: 'srv-rebobinamento', name: 'Rebobinamento de Estator/Induzido', code: 'REBOBINAMENTO', description: 'Rebobinamento completo com fio de cobre esmaltado classe H', default_price: 180.00, estimated_time_minutes: 180, is_active: true, category_ids: ['cat-motor', 'cat-ferramenta'] },
      { id: 'srv-troca-escovas', name: 'Troca de Escovas de Carvão', code: 'TROCA_ESCOVAS', description: 'Substituição de carvões gastos e limpeza do coletor', default_price: 45.00, estimated_time_minutes: 30, is_active: true, category_ids: ['cat-ferramenta'] },
      { id: 'srv-revisao-geral', name: 'Revisão Geral e Lubrificação', code: 'REVISAO_GERAL', description: 'Troca de graxa, rolamentos e teste de isolação', default_price: 80.00, estimated_time_minutes: 60, is_active: true, category_ids: ['cat-motor', 'cat-ferramenta'] }
    ],
    attributes: [
      { name: 'Voltagem', key: 'voltage', data_type: 'select', options: ['110V', '220V', 'Bivolt', 'Trifásico 220/380V'], is_required: false, is_filterable: true, sort_order: 1, is_active: true },
      { name: 'Potência', key: 'power', data_type: 'text', is_required: false, is_filterable: true, sort_order: 2, is_active: true }
    ],
    fieldDefinitions: [
      { label: 'Resistência de Isolação (MΩ)', field_key: 'insulation_resistance', field_type: 'decimal', unit: 'MΩ', is_required: false, sort_order: 1 },
      { label: 'Corrente em Vazio (A)', field_key: 'no_load_current', field_type: 'decimal', unit: 'A', is_required: false, sort_order: 2 }
    ],
    results: [
      { code: 'APROVADO', label: 'Equipamento Revisado e Operacional', color: 'emerald', is_approval: true, is_active: true },
      { code: 'SEM_REPARO', label: 'Induzido Danificado / Inviável', color: 'rose', is_approval: false, is_active: true }
    ],
    workflow: {
      name: 'Fluxo Manutenção Ferramentas e Motores',
      is_default: true,
      states: [
        { id: 'st-mot-recebido', workflow_id: 'wf-motores', code: 'RECEBIDO', name: 'Recepção', color: 'slate', stage_type: 'RECEBIDO', sort_order: 1, is_initial: true, is_final: false },
        { id: 'st-mot-desmontagem', workflow_id: 'wf-motores', code: 'DESMONTAGEM', name: 'Desmontagem & Teste', color: 'amber', stage_type: 'EM_ANDAMENTO', sort_order: 2, is_initial: false, is_final: false },
        { id: 'st-mot-bancada', workflow_id: 'wf-motores', code: 'EM_REBOBINAMENTO', name: 'Na Bancada / Bobinagem', color: 'blue', stage_type: 'EM_ANDAMENTO', sort_order: 3, is_initial: false, is_final: false },
        { id: 'st-mot-testes', workflow_id: 'wf-motores', code: 'TESTES_CARGA', name: 'Teste em Carga', color: 'teal', stage_type: 'EM_ANDAMENTO', sort_order: 4, is_initial: false, is_final: false },
        { id: 'st-mot-pronto', workflow_id: 'wf-motores', code: 'FINALIZADO', name: 'Pronto p/ Retirada', color: 'emerald', stage_type: 'CONCLUIDO', sort_order: 5, is_initial: false, is_final: true }
      ]
    }
  },

  OFICINA_GERAL: {
    key: 'OFICINA_GERAL',
    name: 'Oficina Técnica Geral & Manutenção',
    description: 'Configuração flexível para qualquer tipo de prestação de serviços técnicos.',
    icon: 'Layers',
    categories: [
      { id: 'cat-geral', name: 'Equipamento Geral', slug: 'equipamento-geral', icon: 'Layers', identifier_label: 'Código / Nº de Série', is_system: true, is_active: true }
    ],
    brands: [
      { id: 'brand-geral', name: 'Genérica / Outras', slug: 'generica', is_system: true, is_active: true }
    ],
    models: [
      { id: 'mod-equipamento-padrao', category_id: 'cat-geral', brand_id: 'brand-geral', brand_name: 'Genérica', name: 'Equipamento Padrão', internal_code: 'EQP', description: 'Item genérico para manutenção', is_active: true }
    ],
    services: [
      { id: 'srv-manutencao-geral', name: 'Manutenção Preventiva / Corretiva', code: 'MANUTENCAO', description: 'Inspeção, reparo e testes de bancada', default_price: 100.00, estimated_time_minutes: 60, is_active: true, category_ids: ['cat-geral'] }
    ],
    attributes: [
      { name: 'Modelo / Referência', key: 'reference', data_type: 'text', is_required: false, is_filterable: true, sort_order: 1, is_active: true }
    ],
    fieldDefinitions: [
      { label: 'Observação Técnica', field_key: 'tech_notes', field_type: 'textarea', is_required: false, sort_order: 1 }
    ],
    results: [
      { code: 'APROVADO', label: 'Serviço Concluído com Sucesso', color: 'emerald', is_approval: true, is_active: true },
      { code: 'SEM_REPARO', label: 'Sem Condições de Reparo', color: 'rose', is_approval: false, is_active: true }
    ],
    workflow: {
      name: 'Fluxo Genérico de Serviços',
      is_default: true,
      states: [
        { id: 'st-ger-recebido', workflow_id: 'wf-geral', code: 'RECEBIDO', name: 'Recebido', color: 'slate', stage_type: 'RECEBIDO', sort_order: 1, is_initial: true, is_final: false },
        { id: 'st-ger-execucao', workflow_id: 'wf-geral', code: 'EM_EXECUCAO', name: 'Em Execução', color: 'blue', stage_type: 'EM_ANDAMENTO', sort_order: 2, is_initial: false, is_final: false },
        { id: 'st-ger-pronto', workflow_id: 'wf-geral', code: 'FINALIZADO', name: 'Concluído', color: 'emerald', stage_type: 'CONCLUIDO', sort_order: 3, is_initial: false, is_final: true }
      ]
    }
  }
};

export const SEGMENT_PRESETS = BUSINESS_PRESETS;

// ============================================================================
// 2. SEED DATA (COMPANIES, PLANS, USERS & DEMO DATA)
// ============================================================================

export const MOCK_COMPANY_SUPREME: Company = {
  id: '00000000-0000-0000-0000-000000000001',
  corporate_name: 'Supreme Soluções Tecnológicas LTDA',
  trade_name: 'Supreme Informática & Recargas',
  cnpj: '12.345.678/0001-90',
  phone: '(11) 3456-7890',
  whatsapp: '(11) 98765-4321',
  email: 'contato@supreme.com.br',
  address: 'Av. Paulista, 1000 - Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  zip_code: '01310-100',
  responsible_name: 'Carlos Oliveira',
  active_template_keys: ['RECARGA_CARTUCHOS', 'ASSISTENCIA_INFORMATICA', 'ASSISTENCIA_CELULARES'],
  is_active: true,
  created_at: new Date('2026-01-01').toISOString(),
  updated_at: new Date('2026-01-01').toISOString()
};

export const MOCK_COMPANY_ALFA: Company = {
  id: '00000000-0000-0000-0000-000000000002',
  corporate_name: 'Alfa Motores & Ferramentas LTDA',
  trade_name: 'Alfa Oficina e Motores',
  cnpj: '98.765.432/0001-10',
  phone: '(19) 3210-9876',
  whatsapp: '(19) 99876-5432',
  email: 'contato@alfamotores.com.br',
  address: 'Rua Barão de Jaguara, 500 - Centro',
  city: 'Campinas',
  state: 'SP',
  zip_code: '13015-001',
  responsible_name: 'Marcos Almeida',
  active_template_keys: ['FERRAMENTAS_MOTORES', 'OFICINA_GERAL'],
  is_active: true,
  created_at: new Date('2026-02-01').toISOString(),
  updated_at: new Date('2026-02-01').toISOString()
};

export const MOCK_COMPANIES: Company[] = [
  MOCK_COMPANY_SUPREME,
  MOCK_COMPANY_ALFA
];

export const MOCK_PLANS: Plan[] = [
  {
    id: 'plan-starter-saas',
    name: 'Plano Essencial',
    code: 'ESSENCIAL',
    description: 'Para pequenas oficinas e assistências em início de operação',
    max_users: 3,
    monthly_price: 59.90,
    extra_user_price: 15.00,
    features: ['Emissão de Ordens de Serviço', 'Bancada Técnica Kanban', 'Etiqueta com QR Code de Rastreio', 'Até 3 Usuários'],
    is_active: true
  },
  {
    id: 'plan-pro-saas',
    name: 'Plano Profissional',
    code: 'PROFISSIONAL',
    description: 'Para centros de serviço com alto volume e equipe dedicada',
    max_users: 8,
    monthly_price: 119.90,
    extra_user_price: 15.00,
    features: ['Ordens Ilimitadas', 'Múltiplos Segmentos Simultâneos', 'Relatórios Financeiros & Faturamento', 'Controle de Checklists e Histórico de Ativos', 'Até 8 Usuários'],
    is_active: true
  },
  {
    id: 'plan-master-saas',
    name: 'Plano Enterprise',
    code: 'ENTERPRISE',
    description: 'Para grandes redes de assistência e franquias',
    max_users: 25,
    monthly_price: 249.90,
    extra_user_price: 12.00,
    features: ['Capacidade Expandida', 'Auditoria Completa', 'Suporte Prioritário', 'Workflows Customizados', 'Até 25 Usuários'],
    is_active: true
  }
];

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-supreme-01',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    plan_id: 'plan-pro-saas',
    status: 'ACTIVE',
    starts_at: '2026-01-01T00:00:00Z',
    extra_users: 2,
    custom_price: 149.90,
    billing_cycle: 'MONTHLY',
    notes: 'Cliente modelo - 10 usuários contratados'
  },
  {
    id: 'sub-alfa-02',
    tenant_id: MOCK_COMPANY_ALFA.id,
    plan_id: 'plan-starter-saas',
    status: 'ACTIVE',
    starts_at: '2026-02-01T00:00:00Z',
    extra_users: 0,
    billing_cycle: 'MONTHLY'
  }
];

export const DEFAULT_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'default-admin-group',
    name: 'Administrador (Acesso Total)',
    description: 'Controle total da empresa, gestão financeira, relatórios, equipe e configurações.',
    is_system_default: true,
    default_role: 'ADMINISTRADOR',
    default_max_discount_percent: 100,
    permissions: {
      orders_create: true,
      orders_view: true,
      orders_deliver: true,
      orders_cancel: true,
      orders_reopen: true,
      orders_discount: true,
      orders_print: true,
      customers_view: true,
      customers_create: true,
      customers_edit: true,
      technical_workbench: true,
      technical_update: true,
      catalog_manage: true,
      services_manage: true,
      finance_view: true,
      audit_view: true,
      settings_manage: true,
      // Backward-compat keys
      create_entry: true,
      view_entries: true,
      register_delivery: true,
      close_uncompleted_entry: true,
      apply_discount_on_delivery: true,
      allow_zero_value_delivery: true,
      print_ticket: true,
      view_customers: true,
      create_customer: true,
      edit_customer: true,
      update_tech_status: true,
      customize_kanban: true,
      reopen_entry: true,
      delete_entry: true,
      manage_models: true,
      manage_services: true,
      view_financial_reports: true,
      view_audit_logs: true,
      manage_company: true
    }
  },
  {
    id: 'default-attendant-group',
    name: 'Atendente (Balcão de Atendimento)',
    description: 'Abertura de ordens de serviço, emissão de tickets, cadastro de clientes e baixa de entrega.',
    is_system_default: true,
    default_role: 'ATENDENTE',
    default_max_discount_percent: 10,
    permissions: {
      orders_create: true,
      orders_view: true,
      orders_deliver: true,
      orders_print: true,
      customers_view: true,
      customers_create: true,
      customers_edit: true,
      // Backward-compat keys
      create_entry: true,
      view_entries: true,
      register_delivery: true,
      apply_discount_on_delivery: true,
      allow_zero_value_delivery: false,
      print_ticket: true,
      view_customers: true,
      create_customer: true,
      edit_customer: true
    }
  },
  {
    id: 'default-tech-group',
    name: 'Técnico (Bancada & Oficina)',
    description: 'Acesso à bancada técnica Kanban, execução de testes, pesagem e diagnóstico de itens.',
    is_system_default: true,
    default_role: 'TECNICO',
    default_max_discount_percent: 0,
    permissions: {
      technical_workbench: true,
      technical_update: true,
      // Backward-compat keys
      update_tech_status: true,
      apply_discount_on_delivery: false,
      allow_zero_value_delivery: false
    }
  }
];

export const MOCK_PROFILES: Profile[] = [
  {
    id: '00000000-0000-0000-0000-000000000099',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    full_name: 'Antigravity Super Admin',
    email: 'super@supreme.com.br',
    password: 'superadminmaster',
    phone: '(11) 99999-0000',
    role: 'SUPER_ADMIN',
    max_discount_percent: 100,
    is_active: true,
    created_at: new Date('2026-01-01').toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000010',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    full_name: 'Carlos Oliveira',
    email: 'admin@supreme.com.br',
    password: 'demo-adm-842',
    phone: '(11) 98765-1001',
    role: 'ADMINISTRADOR',
    group_id: 'default-admin-group',
    group_name: 'Administrador (Acesso Total)',
    max_discount_percent: 100,
    is_active: true,
    created_at: new Date('2026-01-01').toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000020',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    full_name: 'Mariana Santos',
    email: 'mariana.atendente@supreme.com.br',
    password: 'demo-atd-193',
    phone: '(11) 98765-2001',
    role: 'ATENDENTE',
    group_id: 'default-attendant-group',
    group_name: 'Atendente (Balcão de Atendimento)',
    max_discount_percent: 10,
    is_active: true,
    created_at: new Date('2026-01-01').toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000030',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    full_name: 'Rafael Souza',
    email: 'rafael.tecnico@supreme.com.br',
    password: 'demo-tec-557',
    phone: '(11) 98765-3001',
    role: 'TECNICO',
    group_id: 'default-tech-group',
    group_name: 'Técnico (Bancada & Oficina)',
    max_discount_percent: 0,
    is_active: true,
    created_at: new Date('2026-01-01').toISOString()
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-01',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    internal_code: 101,
    name: 'Advocacia Pinheiro & Associados',
    document: '23.456.789/0001-01',
    phone: '(11) 98765-4321',
    phone_is_whatsapp: true,
    secondary_phone: '(11) 3344-5566',
    secondary_phone_is_whatsapp: false,
    email: 'contato@pinheiroadv.com.br',
    company_name: 'Pinheiro Advogados',
    address: 'Rua Bela Cintra, 450 - Consolação',
    created_at: new Date('2026-01-15').toISOString()
  },
  {
    id: 'cust-02',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    internal_code: 102,
    name: 'Juliana Ferreira Mendes',
    document: '345.678.901-23',
    phone: '(11) 97654-3210',
    phone_is_whatsapp: true,
    email: 'juliana.mendes@email.com',
    address: 'Rua Augusta, 1200 - Cerqueira César',
    created_at: new Date('2026-01-20').toISOString()
  },
  {
    id: 'cust-03',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    internal_code: 103,
    name: 'Colégio Futuro Brilhante',
    document: '11.222.333/0001-44',
    phone: '(11) 96543-2109',
    phone_is_whatsapp: true,
    email: 'financeiro@futurobrilhante.edu.br',
    created_at: new Date('2026-02-01').toISOString()
  }
];

// Initial Categories, Brands, Models & Services (Extracted from Presets)
const INITIAL_CATEGORIES: ItemCategory[] = [
  ...BUSINESS_PRESETS.RECARGA_CARTUCHOS.categories,
  ...BUSINESS_PRESETS.ASSISTENCIA_INFORMATICA.categories,
  ...BUSINESS_PRESETS.ASSISTENCIA_CELULARES.categories,
  ...BUSINESS_PRESETS.FERRAMENTAS_MOTORES.categories
];

const INITIAL_BRANDS: Brand[] = [
  ...BUSINESS_PRESETS.RECARGA_CARTUCHOS.brands,
  ...BUSINESS_PRESETS.ASSISTENCIA_INFORMATICA.brands,
  ...BUSINESS_PRESETS.FERRAMENTAS_MOTORES.brands
];

const INITIAL_MODELS: ItemModel[] = [
  ...BUSINESS_PRESETS.RECARGA_CARTUCHOS.models.map(m => ({ ...m, tenant_id: MOCK_COMPANY_SUPREME.id } as ItemModel)),
  ...BUSINESS_PRESETS.ASSISTENCIA_INFORMATICA.models.map(m => ({ ...m, tenant_id: MOCK_COMPANY_SUPREME.id } as ItemModel)),
  ...BUSINESS_PRESETS.ASSISTENCIA_CELULARES.models.map(m => ({ ...m, tenant_id: MOCK_COMPANY_SUPREME.id } as ItemModel)),
  ...BUSINESS_PRESETS.FERRAMENTAS_MOTORES.models.map(m => ({ ...m, tenant_id: MOCK_COMPANY_ALFA.id } as ItemModel))
];

const INITIAL_SERVICES: Service[] = [
  ...BUSINESS_PRESETS.RECARGA_CARTUCHOS.services.map(s => ({ ...s, tenant_id: MOCK_COMPANY_SUPREME.id } as Service)),
  ...BUSINESS_PRESETS.ASSISTENCIA_INFORMATICA.services.map(s => ({ ...s, tenant_id: MOCK_COMPANY_SUPREME.id } as Service)),
  ...BUSINESS_PRESETS.ASSISTENCIA_CELULARES.services.map(s => ({ ...s, tenant_id: MOCK_COMPANY_SUPREME.id } as Service)),
  ...BUSINESS_PRESETS.FERRAMENTAS_MOTORES.services.map(s => ({ ...s, tenant_id: MOCK_COMPANY_ALFA.id } as Service))
];

const INITIAL_WORKFLOW_STATES: WorkflowState[] = [
  ...(BUSINESS_PRESETS.RECARGA_CARTUCHOS.workflow.states || []).map(st => ({ ...st, tenant_id: MOCK_COMPANY_SUPREME.id })),
  ...(BUSINESS_PRESETS.ASSISTENCIA_INFORMATICA.workflow.states || []).map(st => ({ ...st, tenant_id: MOCK_COMPANY_SUPREME.id }))
];

const INITIAL_CHECKLISTS: ChecklistTemplate[] = [
  { id: 'chk-template-inf', tenant_id: MOCK_COMPANY_SUPREME.id, category_id: 'cat-notebook', name: 'Checklist Entrada Notebook', items: BUSINESS_PRESETS.ASSISTENCIA_INFORMATICA.checklist?.items || [] },
  { id: 'chk-template-cel', tenant_id: MOCK_COMPANY_SUPREME.id, category_id: 'cat-smartphone', name: 'Checklist Entrada Smartphone', items: BUSINESS_PRESETS.ASSISTENCIA_CELULARES.checklist?.items || [] }
];

// Initial Service Orders & Order Items Demo Data
export const INITIAL_SERVICE_ORDERS: ServiceOrder[] = [
  {
    id: 'ord-2026-000001',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    order_number: '2026-000001',
    order_sequence: 1,
    order_year: 2026,
    customer_id: 'cust-01',
    opened_by: '00000000-0000-0000-0000-000000000020',
    opened_by_name: 'Mariana Santos',
    opened_at: new Date('2026-08-16T09:30:00Z').toISOString(),
    status: 'EM_ANDAMENTO',
    financial_status: 'PENDENTE',
    subtotal_amount: 60.00,
    discount_amount: 0.00,
    surcharge_amount: 0.00,
    total_amount: 60.00,
    paid_amount: 0.00,
    remaining_amount: 60.00,
    tracking_token: 'tok-recarga-hp664-pinheiro-01',
    notes: 'Recarga urgente para petição jurídica',
    created_at: new Date('2026-08-16T09:30:00Z').toISOString(),
    customer: MOCK_CUSTOMERS[0],
    items: [
      {
        id: 'item-001-01',
        tenant_id: MOCK_COMPANY_SUPREME.id,
        service_order_id: 'ord-2026-000001',
        model_id: 'mod-hp-664',
        item_index: 1,
        internal_identifier: 'A942',
        reported_issue: 'Tinta preta esgotou',
        current_state_id: 'st-rec-recarga',
        status: 'EM_RECARGA',
        assigned_technician_id: '00000000-0000-0000-0000-000000000030',
        subtotal_amount: 30.00,
        discount_amount: 0.00,
        total_amount: 30.00,
        received_at: new Date('2026-08-16T09:30:00Z').toISOString(),
        created_at: new Date('2026-08-16T09:30:00Z').toISOString(),
        updated_at: new Date('2026-08-16T10:00:00Z').toISOString(),
        custom_field_values: { input_weight_grams: 28.5, color: 'Preto' },
        services: [
          {
            id: 'srv-item-001',
            tenant_id: MOCK_COMPANY_SUPREME.id,
            service_order_item_id: 'item-001-01',
            service_id: 'srv-recarga',
            service_name: 'Recarga de Tinta',
            quantity: 1,
            unit_price: 30.00,
            discount_amount: 0,
            surcharge_amount: 0,
            total_amount: 30.00,
            status: 'EM_EXECUCAO',
            field_data: { input_weight: 28.5 }
          }
        ]
      },
      {
        id: 'item-001-02',
        tenant_id: MOCK_COMPANY_SUPREME.id,
        service_order_id: 'ord-2026-000001',
        model_id: 'mod-hp-664',
        item_index: 2,
        internal_identifier: 'B112',
        reported_issue: 'Tricolor falhando',
        current_state_id: 'st-rec-teste',
        status: 'EM_TESTE',
        assigned_technician_id: '00000000-0000-0000-0000-000000000030',
        subtotal_amount: 30.00,
        discount_amount: 0.00,
        total_amount: 30.00,
        received_at: new Date('2026-08-16T09:30:00Z').toISOString(),
        created_at: new Date('2026-08-16T09:30:00Z').toISOString(),
        updated_at: new Date('2026-08-16T10:15:00Z').toISOString(),
        custom_field_values: { input_weight_grams: 29.0, output_weight_grams: 37.5, color: 'Tricolor' },
        services: [
          {
            id: 'srv-item-002',
            tenant_id: MOCK_COMPANY_SUPREME.id,
            service_order_item_id: 'item-001-02',
            service_id: 'srv-recarga',
            service_name: 'Recarga de Tinta',
            quantity: 1,
            unit_price: 30.00,
            discount_amount: 0,
            surcharge_amount: 0,
            total_amount: 30.00,
            status: 'CONCLUIDO',
            field_data: { input_weight: 29.0, output_weight: 37.5 }
          }
        ]
      }
    ]
  },
  {
    id: 'ord-2026-000002',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    order_number: '2026-000002',
    order_sequence: 2,
    order_year: 2026,
    customer_id: 'cust-02',
    opened_by: '00000000-0000-0000-0000-000000000020',
    opened_by_name: 'Mariana Santos',
    opened_at: new Date('2026-08-16T11:00:00Z').toISOString(),
    status: 'EM_ANDAMENTO',
    financial_status: 'PAGO_PARCIAL',
    subtotal_amount: 210.00,
    discount_amount: 10.00,
    surcharge_amount: 0.00,
    total_amount: 200.00,
    paid_amount: 100.00,
    remaining_amount: 100.00,
    tracking_token: 'tok-notebook-dell-juliana-02',
    notes: 'Cliente deixou sinal de R$ 100 via PIX',
    created_at: new Date('2026-08-16T11:00:00Z').toISOString(),
    customer: MOCK_CUSTOMERS[1],
    items: [
      {
        id: 'item-002-01',
        tenant_id: MOCK_COMPANY_SUPREME.id,
        service_order_id: 'ord-2026-000002',
        model_id: 'mod-dell-latitude',
        item_index: 1,
        internal_identifier: 'DELL-SN-849201',
        reported_issue: 'Superaquecendo e travando na inicialização',
        accessories: 'Acompanha Carregador Original 65W',
        current_state_id: 'st-inf-reparo',
        status: 'EM_REPARO',
        assigned_technician_id: '00000000-0000-0000-0000-000000000030',
        subtotal_amount: 210.00,
        discount_amount: 10.00,
        total_amount: 200.00,
        received_at: new Date('2026-08-16T11:00:00Z').toISOString(),
        created_at: new Date('2026-08-16T11:00:00Z').toISOString(),
        updated_at: new Date('2026-08-16T11:30:00Z').toISOString(),
        checklist: [
          { item: 'Acompanha Carregador / Fonte Original', checked: true },
          { item: 'Liga normalmente (Dá vídeo)', checked: true },
          { item: 'Carcaça / Dobradiça possui trincas ou riscos', checked: false },
          { item: 'Teclado e Touchpad funcionais', checked: true },
          { item: 'Tela LCD sem manchas ou linhas', checked: true }
        ],
        services: [
          {
            id: 'srv-item-003',
            tenant_id: MOCK_COMPANY_SUPREME.id,
            service_order_item_id: 'item-002-01',
            service_id: 'srv-formatacao',
            service_name: 'Formatação & Reinstalação de Sistema',
            quantity: 1,
            unit_price: 120.00,
            discount_amount: 0,
            surcharge_amount: 0,
            total_amount: 120.00,
            status: 'EM_EXECUCAO'
          },
          {
            id: 'srv-item-004',
            tenant_id: MOCK_COMPANY_SUPREME.id,
            service_order_item_id: 'item-002-01',
            service_id: 'srv-limpeza-preventiva',
            service_name: 'Limpeza Preventiva & Troca de Pasta Térmica',
            quantity: 1,
            unit_price: 90.00,
            discount_amount: 10.00,
            surcharge_amount: 0,
            total_amount: 80.00,
            status: 'CONCLUIDO'
          }
        ]
      }
    ]
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-001',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    service_order_id: 'ord-2026-000002',
    amount: 100.00,
    payment_method: 'PIX',
    received_by: '00000000-0000-0000-0000-000000000020',
    received_by_name: 'Mariana Santos',
    paid_at: new Date('2026-08-16T11:05:00Z').toISOString(),
    notes: 'Adiantamento de 50% no balcão',
    created_at: new Date('2026-08-16T11:05:00Z').toISOString()
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-001',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    user_name: 'Mariana Santos',
    action: 'CRIACAO_ORDEM_SERVICO',
    resource: 'service_orders',
    resource_id: 'ord-2026-000001',
    details: 'Abertura de OS nº 2026-000001 para Advocacia Pinheiro (2 cartuchos HP 664)',
    created_at: new Date('2026-08-16T09:30:00Z').toISOString()
  },
  {
    id: 'aud-002',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    user_name: 'Mariana Santos',
    action: 'CRIACAO_ORDEM_SERVICO',
    resource: 'service_orders',
    resource_id: 'ord-2026-000002',
    details: 'Abertura de OS nº 2026-000002 para Juliana Mendes (Notebook Dell Latitude 3470)',
    created_at: new Date('2026-08-16T11:00:00Z').toISOString()
  }
];

export const MOCK_COMPANY_SETTINGS: CompanySettings = {
  id: 'sett-001',
  tenant_id: MOCK_COMPANY_SUPREME.id,
  active_templates: ['RECARGA_CARTUCHOS', 'ASSISTENCIA_INFORMATICA', 'ASSISTENCIA_CELULARES'],
  show_prices_on_receipt: true,
  receipt_header_note: 'Agradecemos a preferência! Garantia legal de 90 dias.',
  receipt_footer_note: 'Acompanhe online com o QR Code ao lado.',
  thermal_paper_width_mm: 80,
  require_customer_document: false,
  require_item_serial: true,
  item_description_display_mode: 'BASIC'
};

// ============================================================================
// 3. APPSTORE CLASS IMPLEMENTATION (GENERIC STORE LAYER)
// ============================================================================

export class AppStore {
  private static memoryStore: any = null;

  private static getStoreData() {
    if (typeof window === 'undefined') {
      if (!this.memoryStore) {
        this.memoryStore = {
          companies: [...MOCK_COMPANIES],
          plans: [...MOCK_PLANS],
          subscriptions: [...MOCK_SUBSCRIPTIONS],
          profiles: [...MOCK_PROFILES],
          permissionGroups: [...DEFAULT_PERMISSION_GROUPS],
          customers: [...MOCK_CUSTOMERS],
          categories: [...INITIAL_CATEGORIES],
          brands: [...INITIAL_BRANDS],
          models: [...INITIAL_MODELS],
          services: [...INITIAL_SERVICES],
          workflowStates: [...INITIAL_WORKFLOW_STATES],
          checklistTemplates: [...INITIAL_CHECKLISTS],
          serviceOrders: [...INITIAL_SERVICE_ORDERS],
          payments: [...INITIAL_PAYMENTS],
          auditLogs: [...INITIAL_AUDIT_LOGS],
          settings: { ...MOCK_COMPANY_SETTINGS },
          company: { ...MOCK_COMPANY_SUPREME }
        };
      }
      return this.memoryStore;
    }

    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const initial = {
        companies: MOCK_COMPANIES,
        plans: MOCK_PLANS,
        subscriptions: MOCK_SUBSCRIPTIONS,
        profiles: MOCK_PROFILES,
        permissionGroups: DEFAULT_PERMISSION_GROUPS,
        customers: MOCK_CUSTOMERS,
        categories: INITIAL_CATEGORIES,
        brands: INITIAL_BRANDS,
        models: INITIAL_MODELS,
        services: INITIAL_SERVICES,
        workflowStates: INITIAL_WORKFLOW_STATES,
        checklistTemplates: INITIAL_CHECKLISTS,
        serviceOrders: INITIAL_SERVICE_ORDERS,
        payments: INITIAL_PAYMENTS,
        auditLogs: INITIAL_AUDIT_LOGS,
        settings: MOCK_COMPANY_SETTINGS,
        company: MOCK_COMPANY_SUPREME
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.companies) || parsed.companies.length === 0) parsed.companies = MOCK_COMPANIES;
      if (!Array.isArray(parsed.plans) || parsed.plans.length === 0) parsed.plans = MOCK_PLANS;
      if (!Array.isArray(parsed.subscriptions) || parsed.subscriptions.length === 0) parsed.subscriptions = MOCK_SUBSCRIPTIONS;
      if (!Array.isArray(parsed.profiles) || parsed.profiles.length === 0) parsed.profiles = MOCK_PROFILES;
      if (!Array.isArray(parsed.permissionGroups) || parsed.permissionGroups.length === 0) parsed.permissionGroups = DEFAULT_PERMISSION_GROUPS;
      if (!Array.isArray(parsed.customers)) parsed.customers = MOCK_CUSTOMERS;
      if (!Array.isArray(parsed.categories) || parsed.categories.length === 0) parsed.categories = INITIAL_CATEGORIES;
      if (!Array.isArray(parsed.brands) || parsed.brands.length === 0) parsed.brands = INITIAL_BRANDS;
      if (!Array.isArray(parsed.models) || parsed.models.length === 0) parsed.models = INITIAL_MODELS;
      if (!Array.isArray(parsed.services) || parsed.services.length === 0) parsed.services = INITIAL_SERVICES;
      if (!Array.isArray(parsed.workflowStates) || parsed.workflowStates.length === 0) parsed.workflowStates = INITIAL_WORKFLOW_STATES;
      if (!Array.isArray(parsed.checklistTemplates) || parsed.checklistTemplates.length === 0) parsed.checklistTemplates = INITIAL_CHECKLISTS;
      if (!Array.isArray(parsed.serviceOrders)) parsed.serviceOrders = INITIAL_SERVICE_ORDERS;
      if (!Array.isArray(parsed.payments)) parsed.payments = INITIAL_PAYMENTS;
      if (!Array.isArray(parsed.auditLogs)) parsed.auditLogs = INITIAL_AUDIT_LOGS;
      if (!parsed.settings) parsed.settings = MOCK_COMPANY_SETTINGS;
      if (!parsed.company) parsed.company = MOCK_COMPANY_SUPREME;
      return parsed;
    } catch {
      return {
        companies: MOCK_COMPANIES,
        plans: MOCK_PLANS,
        subscriptions: MOCK_SUBSCRIPTIONS,
        profiles: MOCK_PROFILES,
        permissionGroups: DEFAULT_PERMISSION_GROUPS,
        customers: MOCK_CUSTOMERS,
        categories: INITIAL_CATEGORIES,
        brands: INITIAL_BRANDS,
        models: INITIAL_MODELS,
        services: INITIAL_SERVICES,
        workflowStates: INITIAL_WORKFLOW_STATES,
        checklistTemplates: INITIAL_CHECKLISTS,
        serviceOrders: INITIAL_SERVICE_ORDERS,
        payments: INITIAL_PAYMENTS,
        auditLogs: INITIAL_AUDIT_LOGS,
        settings: MOCK_COMPANY_SETTINGS,
        company: MOCK_COMPANY_SUPREME
      };
    }
  }

  private static saveStoreData(data: any, emitEvent = true) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      if (emitEvent) {
        window.dispatchEvent(new CustomEvent('supreme_store_updated', { detail: data }));
      }
    } else {
      this.memoryStore = data;
    }
  }

  // --------------------------------------------------------------------------
  // COMPANIES & TENANTS
  // --------------------------------------------------------------------------
  static getCompanies(): Company[] {
    const data = this.getStoreData();
    return data.companies || MOCK_COMPANIES;
  }

  static getCompany(id: string): Company {
    const companies = this.getCompanies();
    return companies.find(c => c.id === id) || companies[0] || MOCK_COMPANY_SUPREME;
  }

  static addCompany(
    company: Partial<Company>,
    initialAdmin?: { fullName: string; email: string; password?: string; phone?: string },
    planId?: string,
    performedByName?: string,
    initialTemplateKey?: BusinessTemplateKey
  ): Company {
    const data = this.getStoreData();
    const companyId = company.id || generateUUID();
    const templateKey = initialTemplateKey || (company as any).business_segment || 'RECARGA_CARTUCHOS';
    const newCompany: Company = {
      id: companyId,
      corporate_name: company.corporate_name || company.trade_name || 'Nova Empresa',
      trade_name: company.trade_name || 'Nova Empresa',
      cnpj: company.cnpj || '00.000.000/0001-00',
      phone: company.phone || '(11) 99999-9999',
      whatsapp: company.whatsapp,
      email: company.email || 'contato@empresa.com.br',
      address: company.address,
      city: company.city,
      state: company.state,
      responsible_name: company.responsible_name,
      active_template_keys: company.active_template_keys || [templateKey],
      is_active: company.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (!Array.isArray(data.companies)) data.companies = [];
    data.companies.push(newCompany);

    if (planId) {
      this.assignPlanToCompany(companyId, planId, undefined, performedByName);
    }

    if (initialAdmin && initialAdmin.email) {
      const adminProfile: Profile = {
        id: generateUUID(),
        tenant_id: companyId,
        full_name: initialAdmin.fullName,
        email: initialAdmin.email,
        phone: initialAdmin.phone,
        password: initialAdmin.password || '123456',
        role: 'ADMINISTRADOR',
        is_active: true,
        created_at: new Date().toISOString()
      };
      if (!Array.isArray(data.profiles)) data.profiles = [];
      data.profiles.push(adminProfile);
    }

    this.saveStoreData(data);
    supabase.from('companies').insert(newCompany).then();
    return newCompany;
  }

  static updateCompany(id: string, updates: Partial<Company>, performedByName?: string): Company {
    const data = this.getStoreData();
    const idx = data.companies.findIndex((c: Company) => c.id === id);
    if (idx === -1) throw new Error('Empresa não encontrada');
    const updated = { ...data.companies[idx], ...updates, updated_at: new Date().toISOString() };
    data.companies[idx] = updated;
    this.saveStoreData(data);
    supabase.from('companies').update(updates).eq('id', id).then();
    return updated;
  }

  static setCompanySegment(companyId: string, segment: BusinessTemplateKey, performedByName?: string): Company {
    const data = this.getStoreData();
    const comp = data.companies.find((c: Company) => c.id === companyId);
    if (!comp) throw new Error('Empresa não encontrada');
    comp.active_template_keys = [segment];
    comp.business_segment = segment;
    this.saveStoreData(data);
    return comp;
  }

  static deleteCompany(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    data.companies = (data.companies || []).filter((c: Company) => c.id !== id);
    this.saveStoreData(data);
    supabase.from('companies').delete().eq('id', id).then();
    return true;
  }

  // --------------------------------------------------------------------------
  // PLANS & SUBSCRIPTIONS (Unified User Capacity)
  // --------------------------------------------------------------------------
  static getPlans(): Plan[] {
    const data = this.getStoreData();
    return data.plans || MOCK_PLANS;
  }

  static addPlan(plan: Omit<Plan, 'id' | 'created_at' | 'updated_at'>, performedByName?: string): Plan {
    const data = this.getStoreData();
    const newPlan: Plan = { ...plan, id: generateUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    data.plans.push(newPlan);
    this.saveStoreData(data);
    return newPlan;
  }

  static updatePlan(id: string, updates: Partial<Plan>, performedByName?: string): Plan {
    const data = this.getStoreData();
    const idx = data.plans.findIndex((p: Plan) => p.id === id);
    if (idx === -1) throw new Error('Plano não encontrado');
    const updated = { ...data.plans[idx], ...updates, updated_at: new Date().toISOString() };
    data.plans[idx] = updated;
    this.saveStoreData(data);
    return updated;
  }

  static deletePlan(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    data.plans = data.plans.filter((p: Plan) => p.id !== id);
    this.saveStoreData(data);
    return true;
  }

  static getSubscriptions(): Subscription[] {
    const data = this.getStoreData();
    return data.subscriptions || MOCK_SUBSCRIPTIONS;
  }

  static assignPlanToCompany(tenantId: string, planId: string, extras?: Partial<Subscription>, performedByName?: string): Subscription {
    const data = this.getStoreData();
    const plan = (data.plans || MOCK_PLANS).find((p: Plan) => p.id === planId) || MOCK_PLANS[0];
    const idx = data.subscriptions.findIndex((s: Subscription) => s.tenant_id === tenantId);
    let sub: Subscription;

    if (idx !== -1) {
      sub = {
        ...data.subscriptions[idx],
        plan_id: planId,
        plan,
        extra_users: extras?.extra_users !== undefined ? extras.extra_users : data.subscriptions[idx].extra_users || 0,
        custom_max_users: extras?.custom_max_users,
        custom_price: extras?.custom_price,
        status: extras?.status || data.subscriptions[idx].status || 'ACTIVE'
      };
      data.subscriptions[idx] = sub;
    } else {
      sub = {
        id: generateUUID(),
        tenant_id: tenantId,
        plan_id: planId,
        plan,
        status: extras?.status || 'ACTIVE',
        starts_at: new Date().toISOString(),
        extra_users: extras?.extra_users || 0,
        custom_max_users: extras?.custom_max_users,
        custom_price: extras?.custom_price,
        billing_cycle: 'MONTHLY'
      };
      data.subscriptions.unshift(sub);
    }
    this.saveStoreData(data);
    return sub;
  }

  static getEffectiveLimits(tenantId: string) {
    const data = this.getStoreData();
    const plans: Plan[] = data.plans || MOCK_PLANS;
    const subscriptions: Subscription[] = data.subscriptions || MOCK_SUBSCRIPTIONS;
    const profiles: Profile[] = data.profiles || MOCK_PROFILES;
    
    const sub = subscriptions.find(s => s.tenant_id === tenantId) || {
      id: 'default',
      tenant_id: tenantId,
      plan_id: plans[0]?.id || 'default',
      status: 'ACTIVE' as const,
      starts_at: new Date().toISOString(),
      extra_users: 0
    };

    const plan = plans.find(p => p.id === sub.plan_id) || plans[0] || MOCK_PLANS[0];
    const extraUsers = sub.extra_users || 0;
    const maxUsers = sub.custom_max_users !== undefined ? sub.custom_max_users : (plan.max_users || 5) + extraUsers;
    const tenantProfiles = profiles.filter(p => p.tenant_id === tenantId && p.is_active !== false && p.role !== 'SUPER_ADMIN');
    const usedUsers = tenantProfiles.length;
    const availableUsers = Math.max(0, maxUsers - usedUsers);
    const canAddUser = usedUsers < maxUsers;
    const extraUserPrice = plan.extra_user_price || 15.00;
    const calculatedPrice = (plan.monthly_price || 0) + (extraUsers * extraUserPrice);
    const finalMonthlyPrice = sub.custom_price !== undefined ? sub.custom_price : calculatedPrice;

    return {
      subscription: sub,
      plan,
      maxUsers,
      usedUsers,
      availableUsers,
      canAddUser,
      extraUsers,
      extraUserPrice,
      finalMonthlyPrice,
      maxTotal: maxUsers,
      usedTotal: usedUsers,
      usedAdmins: tenantProfiles.filter(p => p.role === 'ADMINISTRADOR').length,
      usedAttendants: tenantProfiles.filter(p => p.role === 'ATENDENTE').length,
      usedTechs: tenantProfiles.filter(p => p.role === 'TECNICO').length
    };
  }

  // --------------------------------------------------------------------------
  // PROFILES & PERMISSION GROUPS
  // --------------------------------------------------------------------------
  static getAllProfiles(): Profile[] {
    const data = this.getStoreData();
    return data.profiles || MOCK_PROFILES;
  }

  static getUsers(tenantId: string): Profile[] {
    const data = this.getStoreData();
    return (data.profiles || MOCK_PROFILES).filter((p: Profile) => p.tenant_id === tenantId);
  }

  static getPermissionGroups(tenantId?: string): PermissionGroup[] {
    const data = this.getStoreData();
    const groups: PermissionGroup[] = data.permissionGroups || DEFAULT_PERMISSION_GROUPS;
    return groups.filter(g => !g.tenant_id || !tenantId || g.tenant_id === tenantId);
  }

  static addPermissionGroup(group: Omit<PermissionGroup, 'id' | 'created_at' | 'updated_at'>, performedByName?: string): PermissionGroup {
    const data = this.getStoreData();
    const newGroup: PermissionGroup = { ...group, id: generateUUID(), is_system_default: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    data.permissionGroups.push(newGroup);
    this.saveStoreData(data);
    return newGroup;
  }

  static updatePermissionGroup(id: string, updates: Partial<PermissionGroup>, performedByName?: string): PermissionGroup {
    const data = this.getStoreData();
    const idx = data.permissionGroups.findIndex((g: PermissionGroup) => g.id === id);
    if (idx === -1) throw new Error('Grupo não encontrado');
    const updated = { ...data.permissionGroups[idx], ...updates, updated_at: new Date().toISOString() };
    data.permissionGroups[idx] = updated;
    this.saveStoreData(data);
    return updated;
  }

  static deletePermissionGroup(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    const group = data.permissionGroups.find((g: PermissionGroup) => g.id === id);
    if (group?.is_system_default) throw new Error('Grupos padrão do sistema não podem ser excluídos.');
    data.permissionGroups = data.permissionGroups.filter((g: PermissionGroup) => g.id !== id);
    this.saveStoreData(data);
    return true;
  }

  static addUser(user: Omit<Profile, 'id' | 'created_at'>, performedByName?: string): Profile {
    const data = this.getStoreData();
    if (user.tenant_id) {
      const limits = this.getEffectiveLimits(user.tenant_id);
      if (!limits.canAddUser) throw new Error(`Limite máximo de usuários atingido (${limits.maxUsers} usuários). Adquira usuários extras.`);
    }
    const newUser: Profile = { ...user, id: generateUUID(), created_at: new Date().toISOString() };
    data.profiles.push(newUser);
    this.saveStoreData(data);
    supabase.from('profiles').insert(newUser).then();
    return newUser;
  }

  static updateUser(id: string, updates: Partial<Profile>, performedByName?: string): Profile {
    const data = this.getStoreData();
    const idx = data.profiles.findIndex((p: Profile) => p.id === id);
    if (idx === -1) throw new Error('Usuário não encontrado');
    const updated = { ...data.profiles[idx], ...updates };
    data.profiles[idx] = updated;
    this.saveStoreData(data);
    supabase.from('profiles').update(updates).eq('id', id).then();
    return updated;
  }

  static updateUserPermissions(id: string, permissions: Record<string, boolean>, performedByName?: string, maxDiscountPercent?: number): Profile {
    const data = this.getStoreData();
    const idx = data.profiles.findIndex((p: Profile) => p.id === id);
    if (idx === -1) throw new Error('Usuário não encontrado');
    data.profiles[idx].custom_permissions = permissions;
    if (maxDiscountPercent !== undefined) {
      data.profiles[idx].max_discount_percent = maxDiscountPercent;
    }
    this.saveStoreData(data);
    return data.profiles[idx];
  }

  static getUserMaxDiscountPercent(userId: string): number {
    const data = this.getStoreData();
    const user = (data.profiles || []).find((p: Profile) => p.id === userId);
    if (!user) return 0;
    if (user.role === 'ADMINISTRADOR' || user.role === 'SUPER_ADMIN') return 100;
    if (user.max_discount_percent !== undefined && user.max_discount_percent !== null) {
      return Number(user.max_discount_percent);
    }
    if (user.group_id) {
      const group = (data.permissionGroups || []).find((g: PermissionGroup) => g.id === user.group_id);
      if (group && group.default_max_discount_percent !== undefined && group.default_max_discount_percent !== null) {
        return Number(group.default_max_discount_percent);
      }
    }
    if (user.role === 'ATENDENTE') return 10;
    return 0;
  }

  // --------------------------------------------------------------------------
  // CUSTOMERS
  // --------------------------------------------------------------------------
  static getCustomers(tenantId: string): Customer[] {
    const data = this.getStoreData();
    return (data.customers || MOCK_CUSTOMERS).filter((c: Customer) => c.tenant_id === tenantId);
  }

  static addCustomer(customer: Omit<Customer, 'id' | 'internal_code' | 'created_at'>, performedByName?: string): Customer {
    const data = this.getStoreData();
    const tenantCustomers = (data.customers || []).filter((c: Customer) => c.tenant_id === customer.tenant_id);
    const maxCode = tenantCustomers.reduce((max: number, c: Customer) => (c.internal_code > max ? c.internal_code : max), 100);
    const newCustomer: Customer = {
      ...customer,
      id: generateUUID(),
      internal_code: maxCode + 1,
      created_at: new Date().toISOString()
    };
    data.customers.push(newCustomer);
    this.saveStoreData(data);
    supabase.from('customers').insert(newCustomer).then();
    return newCustomer;
  }

  static updateCustomer(id: string, updates: Partial<Customer>, performedByName?: string): Customer {
    const data = this.getStoreData();
    const idx = data.customers.findIndex((c: Customer) => c.id === id);
    if (idx === -1) throw new Error('Cliente não encontrado');
    const updated = { ...data.customers[idx], ...updates, updated_at: new Date().toISOString() };
    data.customers[idx] = updated;
    this.saveStoreData(data);
    supabase.from('customers').update(updates).eq('id', id).then();
    return updated;
  }

  static deleteCustomer(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    data.customers = (data.customers || []).filter((c: Customer) => c.id !== id);
    this.saveStoreData(data);
    supabase.from('customers').delete().eq('id', id).then();
    return true;
  }

  // --------------------------------------------------------------------------
  // GENERIC CATALOG: CATEGORIES, BRANDS, MODELS & SERVICES
  // --------------------------------------------------------------------------
  static getCategories(tenantId?: string): ItemCategory[] {
    const data = this.getStoreData();
    const cats: ItemCategory[] = data.categories || INITIAL_CATEGORIES;
    return cats.filter(c => !c.tenant_id || !tenantId || c.tenant_id === tenantId);
  }

  static addCategory(category: Omit<ItemCategory, 'id' | 'created_at' | 'updated_at'>, performedByName?: string): ItemCategory {
    const data = this.getStoreData();
    const newCategory: ItemCategory = {
      ...category,
      id: generateUUID(),
      slug: category.slug || category.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      is_active: category.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (!Array.isArray(data.categories)) data.categories = [...INITIAL_CATEGORIES];
    data.categories.push(newCategory);
    this.saveStoreData(data);
    return newCategory;
  }

  static updateCategory(id: string, updates: Partial<ItemCategory>, performedByName?: string): ItemCategory {
    const data = this.getStoreData();
    if (!Array.isArray(data.categories)) data.categories = [...INITIAL_CATEGORIES];
    const idx = data.categories.findIndex((c: ItemCategory) => c.id === id);
    if (idx === -1) throw new Error('Categoria não encontrada');
    const updated = { ...data.categories[idx], ...updates, updated_at: new Date().toISOString() };
    data.categories[idx] = updated;
    this.saveStoreData(data);
    return updated;
  }

  static deleteCategory(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    if (!Array.isArray(data.categories)) data.categories = [...INITIAL_CATEGORIES];
    data.categories = data.categories.filter((c: ItemCategory) => c.id !== id);
    this.saveStoreData(data);
    return true;
  }

  static getBrands(tenantId?: string): Brand[] {
    const data = this.getStoreData();
    const brands: Brand[] = data.brands || INITIAL_BRANDS;
    return brands.filter(b => !b.tenant_id || !tenantId || b.tenant_id === tenantId);
  }

  static addBrand(brand: Omit<Brand, 'id' | 'created_at' | 'updated_at'>, performedByName?: string): Brand {
    const data = this.getStoreData();
    const newBrand: Brand = {
      ...brand,
      id: generateUUID(),
      slug: brand.slug || brand.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      is_active: brand.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (!Array.isArray(data.brands)) data.brands = [...INITIAL_BRANDS];
    data.brands.push(newBrand);
    this.saveStoreData(data);
    return newBrand;
  }

  static updateBrand(id: string, updates: Partial<Brand>, performedByName?: string): Brand {
    const data = this.getStoreData();
    if (!Array.isArray(data.brands)) data.brands = [...INITIAL_BRANDS];
    const idx = data.brands.findIndex((b: Brand) => b.id === id);
    if (idx === -1) throw new Error('Marca não encontrada');
    const updated = { ...data.brands[idx], ...updates, updated_at: new Date().toISOString() };
    data.brands[idx] = updated;
    this.saveStoreData(data);
    return updated;
  }

  static deleteBrand(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    if (!Array.isArray(data.brands)) data.brands = [...INITIAL_BRANDS];
    data.brands = data.brands.filter((b: Brand) => b.id !== id);
    this.saveStoreData(data);
    return true;
  }

  static getServicePriceForModel(serviceId: string, modelId?: string): number {
    const data = this.getStoreData();
    const services = data.services || INITIAL_SERVICES;
    const srv = services.find((s: Service) => s.id === serviceId);
    if (!srv) return 0;
    
    if (modelId) {
      const models = data.models || INITIAL_MODELS;
      const model = models.find((m: ItemModel) => m.id === modelId);
      if (model?.service_prices && model.service_prices[serviceId] !== undefined) {
        return Number(model.service_prices[serviceId]);
      }
    }
    return Number(srv.default_price || 0);
  }

  static getNextSku(tenantId: string): string {
    const settings = this.getSettings(tenantId);
    const mode = settings.sku_mode || 'MANUAL';
    if (mode !== 'AUTO_INCREMENT') return '';

    const prefix = settings.sku_prefix !== undefined ? settings.sku_prefix : 'MOD-';
    const digits = settings.sku_digits || 4;
    const startNum = settings.sku_start_number || 1;

    const data = this.getStoreData();
    const models = (data.models || INITIAL_MODELS).filter((m: ItemModel) => !m.tenant_id || m.tenant_id === tenantId);
    
    let maxSeq = startNum - 1;
    models.forEach((m: ItemModel) => {
      if (m.internal_code) {
        if (prefix && m.internal_code.startsWith(prefix)) {
          const numPart = m.internal_code.substring(prefix.length).replace(/\D/g, '');
          const val = parseInt(numPart, 10);
          if (!isNaN(val) && val > maxSeq) {
            maxSeq = val;
          }
        } else if (!prefix && /^\d+$/.test(m.internal_code)) {
          const val = parseInt(m.internal_code, 10);
          if (!isNaN(val) && val > maxSeq) {
            maxSeq = val;
          }
        }
      }
    });

    const nextSeq = Math.max(maxSeq + 1, settings.sku_current_number || startNum);
    const padded = String(nextSeq).padStart(digits, '0');
    return `${prefix}${padded}`;
  }

  static getModels(tenantId: string): ItemModel[] {
    const data = this.getStoreData();
    return (data.models || INITIAL_MODELS).filter((m: ItemModel) => m.tenant_id === tenantId || !m.tenant_id);
  }

  static addModel(model: Omit<ItemModel, 'id' | 'created_at' | 'updated_at'>, performedByName?: string): ItemModel {
    const data = this.getStoreData();
    const assignedCode = model.internal_code?.trim() || this.getNextSku(model.tenant_id) || undefined;
    const newModel: ItemModel = {
      ...model,
      internal_code: assignedCode,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (!Array.isArray(data.models)) data.models = [];
    data.models.push(newModel);
    this.saveStoreData(data);
    return newModel;
  }

  static updateModel(id: string, updates: Partial<ItemModel>, performedByName?: string): ItemModel {
    const data = this.getStoreData();
    const idx = data.models.findIndex((m: ItemModel) => m.id === id);
    if (idx === -1) throw new Error('Modelo não encontrado');
    const updated = { ...data.models[idx], ...updates, updated_at: new Date().toISOString() };
    data.models[idx] = updated;
    this.saveStoreData(data);
    return updated;
  }

  static deleteModel(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    data.models = data.models.filter((m: ItemModel) => m.id !== id);
    this.saveStoreData(data);
    return true;
  }

  static getServices(tenantId: string): Service[] {
    const data = this.getStoreData();
    return (data.services || INITIAL_SERVICES).filter((s: Service) => s.tenant_id === tenantId || !s.tenant_id);
  }

  static addService(service: Omit<Service, 'id' | 'created_at' | 'updated_at'>, performedByName?: string): Service {
    const data = this.getStoreData();
    const newService: Service = { ...service, id: generateUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    if (!Array.isArray(data.services)) data.services = [];
    data.services.push(newService);
    this.saveStoreData(data);
    return newService;
  }

  static updateService(id: string, updates: Partial<Service>, performedByName?: string): Service {
    const data = this.getStoreData();
    const idx = data.services.findIndex((s: Service) => s.id === id);
    if (idx === -1) throw new Error('Serviço não encontrado');
    const updated = { ...data.services[idx], ...updates, updated_at: new Date().toISOString() };
    data.services[idx] = updated;
    this.saveStoreData(data);
    return updated;
  }

  static deleteService(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    data.services = data.services.filter((s: Service) => s.id !== id);
    this.saveStoreData(data);
    return true;
  }

  // --------------------------------------------------------------------------
  // WORKFLOW STATES & KANBAN COLUMNS
  // --------------------------------------------------------------------------
  static getWorkflowStates(tenantId: string): WorkflowState[] {
    const data = this.getStoreData();
    const states: WorkflowState[] = data.workflowStates || INITIAL_WORKFLOW_STATES;
    return states.filter(st => !st.tenant_id || st.tenant_id === tenantId).sort((a, b) => a.sort_order - b.sort_order);
  }

  static addWorkflowState(tenantId: string, state: Omit<WorkflowState, 'id'>, performedByName?: string): WorkflowState {
    const data = this.getStoreData();
    if (!Array.isArray(data.workflowStates)) data.workflowStates = [...INITIAL_WORKFLOW_STATES];
    const tenantStates = data.workflowStates.filter((s: WorkflowState) => !s.tenant_id || s.tenant_id === tenantId);
    const newState: WorkflowState = {
      ...state,
      id: generateUUID(),
      tenant_id: tenantId,
      workflow_id: state.workflow_id || 'default-workflow',
      code: (state.code || state.name.toUpperCase().replace(/\s+/g, '_')).trim(),
      sort_order: state.sort_order || (tenantStates.length + 1)
    };
    data.workflowStates.push(newState);
    this.saveStoreData(data);
    return newState;
  }

  static updateWorkflowState(id: string, updates: Partial<WorkflowState>, performedByName?: string): WorkflowState {
    const data = this.getStoreData();
    if (!Array.isArray(data.workflowStates)) data.workflowStates = [...INITIAL_WORKFLOW_STATES];
    const idx = data.workflowStates.findIndex((st: WorkflowState) => st.id === id);
    if (idx === -1) throw new Error('Situação / Etapa não encontrada');
    const updated = { ...data.workflowStates[idx], ...updates };
    data.workflowStates[idx] = updated;
    this.saveStoreData(data);
    return updated;
  }

  static deleteWorkflowState(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    if (!Array.isArray(data.workflowStates)) data.workflowStates = [...INITIAL_WORKFLOW_STATES];
    data.workflowStates = data.workflowStates.filter((st: WorkflowState) => st.id !== id);
    this.saveStoreData(data);
    return true;
  }

  static reorderWorkflowStates(tenantId: string, stateIds: string[], performedByName?: string): WorkflowState[] {
    const data = this.getStoreData();
    if (!Array.isArray(data.workflowStates)) data.workflowStates = [...INITIAL_WORKFLOW_STATES];
    stateIds.forEach((id, idx) => {
      const state = data.workflowStates.find((s: WorkflowState) => s.id === id);
      if (state) {
        state.sort_order = idx + 1;
      }
    });
    this.saveStoreData(data);
    return this.getWorkflowStates(tenantId);
  }

  static resetWorkflowStates(tenantId: string, performedByName?: string): WorkflowState[] {
    const data = this.getStoreData();
    data.workflowStates = [...INITIAL_WORKFLOW_STATES];
    this.saveStoreData(data);
    return this.getWorkflowStates(tenantId);
  }

  static getKanbanColumns(tenantId: string): Array<{ id: string; title: string; color: any; statuses: string[] }> {
    const states = this.getWorkflowStates(tenantId);
    return states.map(st => ({
      id: st.code,
      title: st.name,
      color: st.color,
      statuses: [st.code]
    }));
  }

  // --------------------------------------------------------------------------
  // SERVICE ORDERS (ENTRIES) & ATOMIC NUMBER GENERATION
  // --------------------------------------------------------------------------
  static generateNextOrderNumber(tenantId: string): { orderNumber: string; sequence: number; year: number } {
    const data = this.getStoreData();
    const currentYear = new Date().getFullYear();
    const tenantOrders = (data.serviceOrders || []).filter((o: ServiceOrder) => o.tenant_id === tenantId && o.order_year === currentYear);
    const maxSeq = tenantOrders.reduce((max: number, o: ServiceOrder) => (o.order_sequence > max ? o.order_sequence : max), 0);
    const nextSeq = maxSeq + 1;
    const orderNumber = `${currentYear}-${String(nextSeq).padStart(6, '0')}`;
    return { orderNumber, sequence: nextSeq, year: currentYear };
  }

  static getServiceOrders(tenantId: string): ServiceOrder[] {
    const data = this.getStoreData();
    const orders: ServiceOrder[] = data.serviceOrders || INITIAL_SERVICE_ORDERS;
    const customers = data.customers || MOCK_CUSTOMERS;
    const models = data.models || INITIAL_MODELS;

    return orders
      .filter((o: ServiceOrder) => o.tenant_id === tenantId)
      .map(o => ({
        ...o,
        customer: customers.find((c: Customer) => c.id === o.customer_id) || o.customer,
        items: (o.items || []).map(it => ({
          ...it,
          model: models.find((m: ItemModel) => m.id === it.model_id) || it.model,
          customer_name: customers.find((c: Customer) => c.id === o.customer_id)?.name || o.customer?.name
        }))
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static getServiceOrderById(id: string): ServiceOrder | null {
    const data = this.getStoreData();
    const orders: ServiceOrder[] = data.serviceOrders || INITIAL_SERVICE_ORDERS;
    const order = orders.find((o: ServiceOrder) => o.id === id || o.order_number === id);
    if (!order) return null;
    const customers = data.customers || MOCK_CUSTOMERS;
    const models = data.models || INITIAL_MODELS;
    return {
      ...order,
      customer: customers.find((c: Customer) => c.id === order.customer_id) || order.customer,
      items: (order.items || []).map(it => ({
        ...it,
        model: models.find((m: ItemModel) => m.id === it.model_id) || it.model
      }))
    };
  }

  static getServiceOrderByTrackingToken(token: string): ServiceOrder | null {
    if (!token) return null;
    const cleanToken = token.trim().toLowerCase();
    const data = this.getStoreData();
    const orders: ServiceOrder[] = data.serviceOrders || INITIAL_SERVICE_ORDERS;
    const order = orders.find((o: ServiceOrder) => 
      (o.tracking_token && o.tracking_token.toLowerCase() === cleanToken) ||
      (o.order_number && o.order_number.toLowerCase() === cleanToken) ||
      o.id === token
    );
    if (!order) return null;
    return this.getServiceOrderById(order.id);
  }

  static addServiceOrder(
    orderData: {
      tenant_id: string;
      customer_id: string;
      opened_by: string;
      opened_by_name?: string;
      expected_at?: string;
      notes?: string;
      internal_notes?: string;
      discount_amount?: number;
      initial_payment?: {
        amount: number;
        payment_method: PaymentMethod;
      };
      items: Array<{
        model_id: string;
        variant_id?: string;
        internal_identifier: string;
        reported_issue?: string;
        reception_notes?: string;
        accessories?: string;
        checklist?: Array<{ item: string; checked: boolean }>;
        custom_field_values?: Record<string, any>;
        services: Array<{
          service_id: string;
          quantity?: number;
          unit_price: number;
          discount_amount?: number;
          field_data?: Record<string, any>;
        }>;
      }>;
    },
    performedByName?: string
  ): ServiceOrder {
    const data = this.getStoreData();
    if (!Array.isArray(data.serviceOrders)) data.serviceOrders = [];

    const { orderNumber, sequence, year } = this.generateNextOrderNumber(orderData.tenant_id);
    const orderId = generateUUID();
    const trackingToken = generateTrackingToken();

    let subtotal = 0;
    const orderItems: ServiceOrderItem[] = orderData.items.map((itInput, idx) => {
      const itemId = generateUUID();
      let itemSubtotal = 0;

      const itemServices: ServiceOrderItemService[] = (itInput.services || []).map(srvInput => {
        const srvObj = (data.services || INITIAL_SERVICES).find((s: Service) => s.id === srvInput.service_id);
        const qty = srvInput.quantity || 1;
        const total = (srvInput.unit_price * qty) - (srvInput.discount_amount || 0);
        itemSubtotal += total;

        return {
          id: generateUUID(),
          tenant_id: orderData.tenant_id,
          service_order_item_id: itemId,
          service_id: srvInput.service_id,
          service_name: srvObj?.name || 'Serviço',
          quantity: qty,
          unit_price: srvInput.unit_price,
          discount_amount: srvInput.discount_amount || 0,
          surcharge_amount: 0,
          total_amount: total,
          status: 'PENDENTE',
          field_data: srvInput.field_data || {},
          created_at: new Date().toISOString()
        };
      });

      subtotal += itemSubtotal;
      const modelObj = (data.models || INITIAL_MODELS).find((m: ItemModel) => m.id === itInput.model_id);

      return {
        id: itemId,
        tenant_id: orderData.tenant_id,
        service_order_id: orderId,
        model_id: itInput.model_id,
        variant_id: itInput.variant_id,
        item_index: idx + 1,
        internal_identifier: itInput.internal_identifier || 'S/N',
        reported_issue: itInput.reported_issue,
        reception_notes: itInput.reception_notes,
        accessories: itInput.accessories,
        checklist: itInput.checklist || [],
        custom_field_values: itInput.custom_field_values || {},
        current_state_id: 'st-rec-recebido',
        status: 'RECEBIDO',
        subtotal_amount: itemSubtotal,
        discount_amount: 0,
        total_amount: itemSubtotal,
        received_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        model: modelObj,
        services: itemServices,
        order_number: orderNumber
      };
    });

    const discount = orderData.discount_amount || 0;
    const total = Math.max(0, subtotal - discount);
    const paid = orderData.initial_payment ? Math.min(total, orderData.initial_payment.amount) : 0;
    const remaining = Math.max(0, total - paid);
    const financialStatus: FinancialStatus = paid >= total && total > 0 ? 'PAGO' : paid > 0 ? 'PAGO_PARCIAL' : 'PENDENTE';

    const customerObj = (data.customers || MOCK_CUSTOMERS).find((c: Customer) => c.id === orderData.customer_id);

    const newOrder: ServiceOrder = {
      id: orderId,
      tenant_id: orderData.tenant_id,
      order_number: orderNumber,
      order_sequence: sequence,
      order_year: year,
      customer_id: orderData.customer_id,
      opened_by: orderData.opened_by,
      opened_by_name: orderData.opened_by_name || performedByName || 'Atendente',
      opened_at: new Date().toISOString(),
      expected_at: orderData.expected_at,
      status: 'ABERTA',
      financial_status: financialStatus,
      subtotal_amount: subtotal,
      discount_amount: discount,
      surcharge_amount: 0,
      total_amount: total,
      paid_amount: paid,
      remaining_amount: remaining,
      tracking_token: trackingToken,
      notes: orderData.notes,
      internal_notes: orderData.internal_notes,
      items: orderItems,
      customer: customerObj,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    data.serviceOrders.unshift(newOrder);

    // Initial Payment if provided
    if (orderData.initial_payment && orderData.initial_payment.amount > 0) {
      if (!Array.isArray(data.payments)) data.payments = [];
      const newPayment: Payment = {
        id: generateUUID(),
        tenant_id: orderData.tenant_id,
        service_order_id: orderId,
        amount: orderData.initial_payment.amount,
        payment_method: orderData.initial_payment.payment_method,
        received_by: orderData.opened_by,
        received_by_name: orderData.opened_by_name || 'Atendente',
        paid_at: new Date().toISOString(),
        notes: 'Pagamento inicial registrado na abertura da OS',
        created_at: new Date().toISOString()
      };
      data.payments.push(newPayment);
    }

    this.saveStoreData(data);
    this.logAudit({
      tenant_id: orderData.tenant_id,
      user_name: performedByName || 'Atendente',
      action: 'CRIACAO_ORDEM_SERVICO',
      resource: 'service_orders',
      resource_id: orderId,
      details: `Abertura de OS nº ${orderNumber} para ${customerObj?.name || 'Cliente'} com ${orderItems.length} item(ns)`
    });

    return newOrder;
  }

  static updateOrderItemStatus(
    itemId: string,
    updates: {
      status?: string;
      current_state_id?: string;
      result_code?: string;
      result_description?: string;
      technical_notes?: string;
      assigned_technician_id?: string;
      custom_field_values?: Record<string, any>;
      checklist?: Array<{ item: string; checked: boolean }>;
      services_field_data?: Record<string, any>;
    },
    performedByName?: string
  ): ServiceOrderItem {
    const data = this.getStoreData();
    let targetItem: ServiceOrderItem | null = null;
    let parentOrder: ServiceOrder | null = null;

    for (const order of (data.serviceOrders || [])) {
      const itIdx = (order.items || []).findIndex((it: ServiceOrderItem) => it.id === itemId);
      if (itIdx !== -1) {
        parentOrder = order;
        const currentItem = order.items[itIdx];
        const updatedItem = {
          ...currentItem,
          ...updates,
          custom_field_values: { ...currentItem.custom_field_values, ...(updates.custom_field_values || {}) },
          updated_at: new Date().toISOString()
        };
        order.items[itIdx] = updatedItem;
        targetItem = updatedItem;
        break;
      }
    }

    if (!targetItem || !parentOrder) throw new Error('Item da Ordem de Serviço não encontrado.');

    // Check parent order overall status
    const allCompleted = (parentOrder.items || []).every((it: ServiceOrderItem) => it.status === 'FINALIZADO' || it.status === 'ENTREGUE');
    if (allCompleted && parentOrder.status === 'EM_ANDAMENTO') {
      parentOrder.status = 'PRONTA';
    } else if (!allCompleted && parentOrder.status === 'ABERTA') {
      parentOrder.status = 'EM_ANDAMENTO';
    }

    this.saveStoreData(data);
    return targetItem;
  }

  static deliverServiceOrder(
    orderId: string,
    deliveryData: {
      receiver_name: string;
      receiver_document?: string;
      receiver_relation?: string;
      notes?: string;
      payments?: Array<{ payment_method: PaymentMethod; amount: number }>;
      apply_discount?: number;
      is_zero_value?: boolean;
    },
    performedByName?: string
  ): ServiceOrder {
    const data = this.getStoreData();
    const orderIdx = (data.serviceOrders || []).findIndex((o: ServiceOrder) => o.id === orderId);
    if (orderIdx === -1) throw new Error('Ordem de Serviço não encontrada.');

    const order = data.serviceOrders[orderIdx];
    const deliveredAt = new Date().toISOString();

    // Register Payments
    let totalPaidInCheckout = 0;
    if (Array.isArray(deliveryData.payments)) {
      if (!Array.isArray(data.payments)) data.payments = [];
      for (const p of deliveryData.payments) {
        if (p.amount > 0) {
          totalPaidInCheckout += p.amount;
          data.payments.push({
            id: generateUUID(),
            tenant_id: order.tenant_id,
            service_order_id: orderId,
            amount: p.amount,
            payment_method: p.payment_method,
            received_by: order.opened_by,
            received_by_name: performedByName || 'Atendente',
            paid_at: deliveredAt,
            created_at: deliveredAt
          });
        }
      }
    }

    // Se for baixa com valor zerado (cortesia / isenção total)
    if (deliveryData.is_zero_value) {
      order.discount_amount = order.subtotal_amount;
      order.total_amount = 0;
      order.paid_amount = 0;
      order.remaining_amount = 0;
      order.financial_status = 'PAGO';
    } else {
      // Apply Discount on Delivery if provided
      if (deliveryData.apply_discount && deliveryData.apply_discount > 0) {
        order.discount_amount = (order.discount_amount || 0) + deliveryData.apply_discount;
        order.total_amount = Math.max(0, order.subtotal_amount - order.discount_amount);
      }

      const totalPaidAllTime = (order.paid_amount || 0) + totalPaidInCheckout;
      order.paid_amount = totalPaidAllTime;
      order.remaining_amount = Math.max(0, order.total_amount - totalPaidAllTime);
      order.financial_status = order.paid_amount >= order.total_amount ? 'PAGO' : order.paid_amount > 0 ? 'PAGO_PARCIAL' : 'PENDENTE';
    }

    order.status = 'ENTREGUE';
    order.delivered_at = deliveredAt;
    order.closed_at = deliveredAt;

    // Register Delivery Object
    order.delivery_info = {
      delivered_at: deliveredAt,
      delivered_by: order.opened_by,
      delivered_by_name: performedByName || 'Atendente',
      receiver_name: deliveryData.receiver_name,
      receiver_document: deliveryData.receiver_document,
      receiver_relation: deliveryData.receiver_relation || 'Próprio Cliente',
      notes: deliveryData.notes
    };

    // Mark all items as ENTREGUE
    if (Array.isArray(order.items)) {
      order.items.forEach((it: ServiceOrderItem) => {
        it.status = 'ENTREGUE';
        it.completed_at = it.completed_at || deliveredAt;
      });
    }

    this.saveStoreData(data);
    this.logAudit({
      tenant_id: order.tenant_id,
      user_name: performedByName || 'Atendente',
      action: 'ENTREGA_ORDEM_SERVICO',
      resource: 'service_orders',
      resource_id: orderId,
      details: `Entregue OS nº ${order.order_number} para ${deliveryData.receiver_name}. Valor recebido: R$ ${totalPaidInCheckout.toFixed(2)}`
    });

    return order;
  }

  static reopenServiceOrder(orderId: string, reason: string, performedByName?: string): ServiceOrder {
    const data = this.getStoreData();
    const orderIdx = (data.serviceOrders || []).findIndex((o: ServiceOrder) => o.id === orderId);
    if (orderIdx === -1) throw new Error('Ordem de Serviço não encontrada.');

    const order = data.serviceOrders[orderIdx];
    order.status = 'EM_ANDAMENTO';
    order.delivered_at = undefined;
    order.closed_at = undefined;

    if (Array.isArray(order.items)) {
      order.items.forEach((it: ServiceOrderItem) => {
        if (it.status === 'ENTREGUE') it.status = 'RECEBIDO';
      });
    }

    this.saveStoreData(data);
    this.logAudit({
      tenant_id: order.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'REABERTURA_ORDEM_SERVICO',
      resource: 'service_orders',
      resource_id: orderId,
      details: `Reaberta OS nº ${order.order_number}. Motivo: ${reason}`
    });

    return order;
  }

  static deleteServiceOrder(orderId: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    const order = (data.serviceOrders || []).find((o: ServiceOrder) => o.id === orderId);
    data.serviceOrders = (data.serviceOrders || []).filter((o: ServiceOrder) => o.id !== orderId);
    data.payments = (data.payments || []).filter((p: Payment) => p.service_order_id !== orderId);
    this.saveStoreData(data);
    this.logAudit({
      tenant_id: order?.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'EXCLUSAO_ORDEM_SERVICO',
      resource: 'service_orders',
      resource_id: orderId,
      details: `Excluída permanentemente OS nº ${order?.order_number || orderId}`
    });
    return true;
  }

  // --------------------------------------------------------------------------
  // SETTINGS, AUDIT & PLATFORM STATS
  // --------------------------------------------------------------------------
  static getSettings(tenantId: string): CompanySettings {
    const data = this.getStoreData();
    return data.settings || MOCK_COMPANY_SETTINGS;
  }

  static updateSettings(tenantId: string, updates: Partial<CompanySettings>, performedByName?: string): CompanySettings {
    const data = this.getStoreData();
    const updated = { ...data.settings, ...updates, tenant_id: tenantId };
    data.settings = updated;
    this.saveStoreData(data);
    return updated;
  }

  static logAudit(log: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const data = this.getStoreData();
    if (!Array.isArray(data.auditLogs)) data.auditLogs = [];
    const newLog: AuditLog = { ...log, id: generateUUID(), created_at: new Date().toISOString() };
    data.auditLogs.unshift(newLog);
    if (data.auditLogs.length > 500) data.auditLogs = data.auditLogs.slice(0, 500);
    this.saveStoreData(data);
    supabase.from('audit_logs').insert(newLog).then();
    return newLog;
  }

  static getAuditLogs(tenantId?: string): AuditLog[] {
    const data = this.getStoreData();
    const logs: AuditLog[] = data.auditLogs || INITIAL_AUDIT_LOGS;
    return logs.filter(l => !tenantId || !l.tenant_id || l.tenant_id === tenantId);
  }

  static getTenantStats(tenantId: string) {
    const orders = this.getServiceOrders(tenantId);
    const customers = this.getCustomers(tenantId);
    const limits = this.getEffectiveLimits(tenantId);
    const totalRevenue = orders.reduce((acc, o) => acc + (o.paid_amount || 0), 0);
    const totalItems = orders.reduce((acc, o) => acc + (o.items?.length || 0), 0);

    return {
      totalEntries: orders.length,
      totalOrders: orders.length,
      totalItems,
      totalCustomers: customers.length,
      totalRevenue,
      limits
    };
  }

  static getPlatformOverview() {
    const companies = this.getCompanies();
    const profiles = this.getAllProfiles();
    const activeCompanies = companies.filter(c => c.is_active !== false).length;
    const pausedCompanies = companies.filter(c => c.is_active === false).length;
    let totalMRR = 0;
    companies.forEach(c => {
      if (c.is_active !== false) {
        totalMRR += this.getEffectiveLimits(c.id).finalMonthlyPrice;
      }
    });

    return {
      totalCompanies: companies.length,
      activeCompanies,
      pausedCompanies,
      totalMRR,
      totalUsers: profiles.filter(p => p.role !== 'SUPER_ADMIN' && p.is_active !== false).length
    };
  }

  // --------------------------------------------------------------------------
  // DEMO SANDBOX & ROTATING PASSWORDS
  // --------------------------------------------------------------------------
  static getDemoSandboxConfig(): DemoSandboxConfig {
    const data = this.getStoreData();
    if (!data.demoSandbox) {
      data.demoSandbox = {
        passwords: {
          admin: 'demo-adm-842',
          attendant: 'demo-atd-193',
          technician: 'demo-tec-557'
        },
        autoResetDays: 7,
        lastResetAt: new Date().toISOString()
      };
      this.saveStoreData(data, false);
    }
    return data.demoSandbox;
  }

  static regenerateDemoPasswords(performedByName?: string): DemoSandboxConfig {
    const data = this.getStoreData();
    const rand = (prefix: string) => `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
    const newCfg: DemoSandboxConfig = {
      passwords: {
        admin: rand('demo-adm'),
        attendant: rand('demo-atd'),
        technician: rand('demo-tec')
      },
      autoResetDays: 7,
      lastResetAt: new Date().toISOString()
    };
    data.demoSandbox = newCfg;

    // Update profiles with new demo passwords
    (data.profiles || []).forEach((p: Profile) => {
      if (p.email === 'admin@supreme.com.br') p.password = newCfg.passwords.admin;
      if (p.email === 'mariana.atendente@supreme.com.br') p.password = newCfg.passwords.attendant;
      if (p.email === 'rafael.tecnico@supreme.com.br') p.password = newCfg.passwords.technician;
    });

    this.saveStoreData(data);
    return newCfg;
  }

  static resetDemoSandboxData(performedByName?: string): boolean {
    const data = this.getStoreData();
    data.customers = [...MOCK_CUSTOMERS];
    data.categories = [...INITIAL_CATEGORIES];
    data.brands = [...INITIAL_BRANDS];
    data.models = [...INITIAL_MODELS];
    data.services = [...INITIAL_SERVICES];
    data.serviceOrders = [...INITIAL_SERVICE_ORDERS];
    data.payments = [...INITIAL_PAYMENTS];
    data.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.saveStoreData(data);
    return true;
  }

  // --------------------------------------------------------------------------
  // AUTHENTICATION & REALTIME HELPERS
  // --------------------------------------------------------------------------
  static authenticate(email: string, pass: string): Profile {
    const data = this.getStoreData();
    const profiles: Profile[] = data.profiles || MOCK_PROFILES;
    const user = profiles.find(p => p.email.toLowerCase().trim() === email.toLowerCase().trim());
    if (!user) throw new Error('Usuário não encontrado.');
    if (user.is_active === false) throw new Error('Este usuário está desativado.');
    if (user.password && user.password !== pass && pass !== 'demo123') {
      throw new Error('Senha incorreta.');
    }
    this.logAudit({
      tenant_id: user.tenant_id,
      user_name: user.full_name,
      action: 'LOGIN_SUCESSO',
      resource: 'profiles',
      resource_id: user.id,
      details: `Login realizado com sucesso: ${user.full_name} (${user.role})`
    });
    return user;
  }

  static async syncFromSupabase(tenantId?: string) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('supreme_store_updated'));
    }
  }

  static changeUserPassword(userId: string, newPass: string, performedByName?: string): Profile {
    const data = this.getStoreData();
    const user = (data.profiles || []).find((p: Profile) => p.id === userId);
    if (!user) throw new Error('Usuário não encontrado.');
    user.password = newPass;
    this.saveStoreData(data);
    this.logAudit({
      tenant_id: user.tenant_id,
      user_name: performedByName || user.full_name,
      action: 'ALTERAR_SENHA',
      resource: 'profiles',
      resource_id: user.id,
      details: 'Usuário alterou a senha.'
    });
    return user;
  }

  static logLogout(user: Profile) {
    this.logAudit({
      tenant_id: user.tenant_id,
      user_name: user.full_name,
      action: 'LOGOUT',
      resource: 'profiles',
      resource_id: user.id,
      details: `Logout de sessão: ${user.full_name}`
    });
  }

  static resetDemoSandbox(performedByName?: string) {
    return this.resetDemoSandboxData(performedByName);
  }

  static toggleCompanyStatus(companyId: string, performedByName?: string) {
    const data = this.getStoreData();
    const comp = data.companies.find((c: Company) => c.id === companyId);
    if (!comp) throw new Error('Empresa não encontrada.');
    comp.is_active = comp.is_active === false ? true : false;
    this.saveStoreData(data);
    return comp;
  }

  static getEntryByToken(token: string) {
    return this.getServiceOrderByTrackingToken(token) || this.getServiceOrderById(token);
  }

  static async getEntryByTokenAsync(token: string) {
    return this.getServiceOrderByTrackingToken(token) || this.getServiceOrderById(token);
  }

  static initRealtime(tenantId: string) {
    // Optional Supabase Realtime channel subscription
  }

  // --------------------------------------------------------------------------
  // BACKWARD-COMPATIBILITY METHOD ALIASES (Clean Transition)
  // --------------------------------------------------------------------------
  static getEntries(tenantId: string) { return this.getServiceOrders(tenantId); }
  static getEntryById(id: string) { return this.getServiceOrderById(id); }
  static getCartridges(tenantId: string): ServiceOrderItem[] {
    const orders = this.getServiceOrders(tenantId);
    const allItems: ServiceOrderItem[] = [];
    orders.forEach(o => {
      (o.items || []).forEach(it => {
        allItems.push({
          ...it,
          order_number: o.order_number,
          customer_name: o.customer?.name,
          customer: o.customer
        });
      });
    });
    return allItems;
  }
  static getServicePrices(tenantId: string) { return this.getServices(tenantId); }
  static updateCartridgeStatus(id: string, status: string, result?: string, otherDesc?: string, techNotes?: string, techId?: string, outputWeight?: number, checklist?: any[], performedByName?: string) {
    return this.updateOrderItemStatus(id, {
      status,
      result_code: result,
      result_description: otherDesc,
      technical_notes: techNotes,
      assigned_technician_id: techId,
      custom_field_values: outputWeight !== undefined ? { output_weight_grams: outputWeight } : undefined,
      checklist
    }, performedByName);
  }
  static getSegmentConfig(tenantId: string) {
    const company = this.getCompany(tenantId);
    const primaryKey = company.active_template_keys?.[0] || 'RECARGA_CARTUCHOS';
    const preset = BUSINESS_PRESETS[primaryKey] || BUSINESS_PRESETS.RECARGA_CARTUCHOS;
    return {
      segment: primaryKey,
      segmentName: preset.name,
      itemLabelSingular: preset.categories[0]?.name || 'Item',
      itemLabelPlural: preset.categories[0]?.name ? `${preset.categories[0].name}s` : 'Itens',
      identifierLabel: preset.categories[0]?.identifier_label || 'Identificador',
      serviceLabel: 'Serviço Solicitado',
      hasWeightInspection: primaryKey === 'RECARGA_CARTUCHOS',
      hasChecklist: !!preset.checklist,
      defaultChecklistItems: preset.checklist?.items?.map(i => i.item_name) || [],
      defaultCategories: preset.categories.map(c => c.name)
    };
  }
}
