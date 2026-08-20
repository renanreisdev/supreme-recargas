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

const LOCAL_STORAGE_KEY = 'supreme_recargas_v4_clean';


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

function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
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
  id: 'b2000000-0000-0000-0000-000000000001',
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
  id: 'b2000000-0000-0000-0000-000000000002',
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
      technical_workbench: true,
      update_tech_status: true,
      transfer_assigned_tech_order: true,
      edit_other_technician_orders: true,
      customize_kanban: true,
      reopen_entry: true,
      delete_entry: true,
      change_assigned_technician: true,
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
      create_entry: true,
      view_entries: true,
      register_delivery: true,
      close_uncompleted_entry: false,
      apply_discount_on_delivery: true,
      allow_zero_value_delivery: false,
      print_ticket: true,
      view_customers: true,
      create_customer: true,
      edit_customer: true,
      technical_workbench: false,
      update_tech_status: false,
      transfer_assigned_tech_order: false,
      edit_other_technician_orders: false,
      customize_kanban: false,
      reopen_entry: false,
      delete_entry: false,
      change_assigned_technician: false,
      manage_models: false,
      manage_services: false,
      view_financial_reports: false,
      view_audit_logs: false,
      manage_company: false
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
      create_entry: false,
      view_entries: false,
      register_delivery: false,
      close_uncompleted_entry: false,
      apply_discount_on_delivery: false,
      allow_zero_value_delivery: false,
      print_ticket: false,
      view_customers: false,
      create_customer: false,
      edit_customer: false,
      technical_workbench: true,
      update_tech_status: true,
      transfer_assigned_tech_order: false,
      edit_other_technician_orders: false,
      customize_kanban: false,
      reopen_entry: false,
      delete_entry: false,
      change_assigned_technician: false,
      manage_models: false,
      manage_services: false,
      view_financial_reports: false,
      view_audit_logs: false,
      manage_company: false
    }
  }
];

export const MOCK_PROFILES: Profile[] = [
  {
    id: 'd4000000-0000-0000-0000-000000000099',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    full_name: 'Super Administrador',
    email: 'super@supreme.com.br',
    password: 'super123',
    phone: '(11) 99999-0000',
    role: 'SUPER_ADMIN',
    max_discount_percent: 100,
    is_active: true,
    created_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'd4000000-0000-0000-0000-000000000001',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    full_name: 'Carlos Oliveira (Admin)',
    email: 'admin@supreme.com.br',
    password: 'admin123',
    phone: '(11) 98765-1001',
    role: 'ADMINISTRADOR',
    group_id: 'default-admin-group',
    group_name: 'Administrador (Acesso Total)',
    max_discount_percent: 100,
    is_active: true,
    created_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'd4000000-0000-0000-0000-000000000002',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    full_name: 'Mariana Santos (Atendente 1)',
    email: 'atendente1@supreme.com.br',
    password: 'atendente123',
    phone: '(11) 98765-2001',
    role: 'ATENDENTE',
    group_id: 'default-attendant-group',
    group_name: 'Atendente (Balcão de Atendimento)',
    max_discount_percent: 10,
    is_active: true,
    created_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'd4000000-0000-0000-0000-000000000004',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    full_name: 'Lucas Lima (Atendente 2)',
    email: 'atendente2@supreme.com.br',
    password: 'atendente123',
    phone: '(11) 98765-2002',
    role: 'ATENDENTE',
    group_id: 'default-attendant-group',
    group_name: 'Atendente (Balcão de Atendimento)',
    max_discount_percent: 10,
    is_active: true,
    created_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'd4000000-0000-0000-0000-000000000003',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    full_name: 'Rafael Souza (Técnico 1)',
    email: 'tecnico1@supreme.com.br',
    password: 'tecnico123',
    phone: '(11) 98765-3001',
    role: 'TECNICO',
    group_id: 'default-tech-group',
    group_name: 'Técnico (Bancada & Oficina)',
    max_discount_percent: 0,
    is_active: true,
    created_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'd4000000-0000-0000-0000-000000000006',
    tenant_id: MOCK_COMPANY_SUPREME.id,
    full_name: 'Marcos Rocha (Técnico 2)',
    email: 'tecnico2@supreme.com.br',
    password: 'tecnico123',
    phone: '(11) 98765-3002',
    role: 'TECNICO',
    group_id: 'default-tech-group',
    group_name: 'Técnico (Bancada & Oficina)',
    max_discount_percent: 0,
    is_active: true,
    created_at: new Date('2026-01-01').toISOString()
  }
];

export const MOCK_CUSTOMERS: Customer[] = [];

// Initial Categories, Brands, Models & Services (Clean State for Manual Population)
const INITIAL_CATEGORIES: ItemCategory[] = [];

const INITIAL_BRANDS: Brand[] = [];

const INITIAL_MODELS: ItemModel[] = [];

const INITIAL_SERVICES: Service[] = [];

const INITIAL_WORKFLOW_STATES: WorkflowState[] = [
  { id: 'a4000000-0000-0000-0000-000000000001', tenant_id: MOCK_COMPANY_SUPREME.id, workflow_id: 'a3000000-0000-0000-0000-000000000001', code: 'RECEBIDO', name: 'Recebido na Recepção', color: 'slate', stage_type: 'RECEBIDO', sort_order: 1, is_initial: true, is_final: false },
  { id: 'a4000000-0000-0000-0000-000000000002', tenant_id: MOCK_COMPANY_SUPREME.id, workflow_id: 'a3000000-0000-0000-0000-000000000001', code: 'AGUARDANDO_VERIFICACAO', name: 'Aguard. Verificação', color: 'amber', stage_type: 'EM_ANDAMENTO', sort_order: 2, is_initial: false, is_final: false },
  { id: 'a4000000-0000-0000-0000-000000000003', tenant_id: MOCK_COMPANY_SUPREME.id, workflow_id: 'a3000000-0000-0000-0000-000000000001', code: 'EM_VERIFICACAO', name: 'Em Verificação', color: 'amber', stage_type: 'EM_ANDAMENTO', sort_order: 3, is_initial: false, is_final: false },
  { id: 'a4000000-0000-0000-0000-000000000004', tenant_id: MOCK_COMPANY_SUPREME.id, workflow_id: 'a3000000-0000-0000-0000-000000000001', code: 'AGUARDANDO_RECARGA', name: 'Aguard. Execução / Recarga', color: 'purple', stage_type: 'EM_ANDAMENTO', sort_order: 4, is_initial: false, is_final: false },
  { id: 'a4000000-0000-0000-0000-000000000005', tenant_id: MOCK_COMPANY_SUPREME.id, workflow_id: 'a3000000-0000-0000-0000-000000000001', code: 'EM_RECARGA', name: 'Em Execução / Bancada', color: 'purple', stage_type: 'EM_ANDAMENTO', sort_order: 5, is_initial: false, is_final: false },
  { id: 'a4000000-0000-0000-0000-000000000006', tenant_id: MOCK_COMPANY_SUPREME.id, workflow_id: 'a3000000-0000-0000-0000-000000000001', code: 'AGUARDANDO_TESTE', name: 'Aguard. Testes', color: 'blue', stage_type: 'EM_ANDAMENTO', sort_order: 6, is_initial: false, is_final: false },
  { id: 'a4000000-0000-0000-0000-000000000007', tenant_id: MOCK_COMPANY_SUPREME.id, workflow_id: 'a3000000-0000-0000-0000-000000000001', code: 'EM_TESTE', name: 'Em Testes Finais', color: 'blue', stage_type: 'EM_ANDAMENTO', sort_order: 7, is_initial: false, is_final: false },
  { id: 'a4000000-0000-0000-0000-000000000008', tenant_id: MOCK_COMPANY_SUPREME.id, workflow_id: 'a3000000-0000-0000-0000-000000000001', code: 'FINALIZADO', name: 'Pronto p/ Retirada', color: 'emerald', stage_type: 'CONCLUIDO', sort_order: 8, is_initial: false, is_final: true },
  { id: 'a4000000-0000-0000-0000-000000000009', tenant_id: MOCK_COMPANY_SUPREME.id, workflow_id: 'a3000000-0000-0000-0000-000000000001', code: 'ENTREGUE', name: 'Entregue ao Cliente', color: 'slate', stage_type: 'CONCLUIDO', sort_order: 9, is_initial: false, is_final: true },
  { id: 'a4000000-0000-0000-0000-000000000010', tenant_id: MOCK_COMPANY_SUPREME.id, workflow_id: 'a3000000-0000-0000-0000-000000000001', code: 'COM_PROBLEMA', name: 'Com Problema / Aguardando', color: 'rose', stage_type: 'EM_ANDAMENTO', sort_order: 10, is_initial: false, is_final: false },
  { id: 'a4000000-0000-0000-0000-000000000011', tenant_id: MOCK_COMPANY_SUPREME.id, workflow_id: 'a3000000-0000-0000-0000-000000000001', code: 'SEM_REPARO', name: 'Sem Reparo (Inviável)', color: 'rose', stage_type: 'CONCLUIDO', sort_order: 11, is_initial: false, is_final: true }
];

const INITIAL_CHECKLISTS: ChecklistTemplate[] = [];

export const INITIAL_SERVICE_ORDERS: ServiceOrder[] = [];

export const INITIAL_PAYMENTS: Payment[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const MOCK_COMPANY_SETTINGS: CompanySettings = {
  id: 'sett-001',
  tenant_id: MOCK_COMPANY_SUPREME.id,
  active_templates: ['RECARGA_CARTUCHOS', 'ASSISTENCIA_INFORMATICA', 'ASSISTENCIA_CELULARES'],
  thermal_paper_width_mm: 80,
  printer_paper_width: '80mm',
  printer_font_size: 'normal',
  printer_density: 'normal',
  print_entry_copies: 2, // Por padrão: 2 vias na entrada (1ª Via Loja/Oficina + 2ª Via Cliente)
  print_delivery_copies: 1, // Por padrão: 1 via na entrega (Comprovante do Cliente)
  auto_print_on_entry: true,
  auto_print_on_delivery: true,
  show_prices_on_receipt: true,
  show_qr_code_on_receipt: true,
  show_checklist_on_receipt: true,
  show_accessories_on_receipt: true,
  show_reported_issue_on_receipt: true,
  show_technician_on_receipt: true,
  show_customer_signature_line: true,
  show_attendant_signature_line: false,
  show_company_cnpj: true,
  show_company_contact: true,
  show_company_address: true,
  receipt_header: 'Especialistas em Cartuchos, Toners, Informática e Manutenção Especializada',
  receipt_header_note: 'Agradecemos a preferência! Tradição e qualidade no atendimento.',
  receipt_footer: 'Garantia legal de 90 dias para serviços executados. Equipamentos prontos não retirados em 90 dias estão sujeitos a cobrança de taxa de guarda ou descarte conforme Art. 1.275 do Código Civil.',
  receipt_footer_note: 'Acompanhe online com o QR Code ao lado.',
  receipt_delivery_footer: 'Declaro que retirei o equipamento testado, conferido e em perfeitas condições de funcionamento.',
  require_customer_document: false,
  require_item_serial: true,
  require_technician_on_entry: false,
  sku_mode: 'AUTO_INCREMENT',
  sku_prefix: 'OS-',
  sku_start_number: 1,
  sku_digits: 4,
  item_description_display_mode: 'BASIC',
  technician_group_ids: ['default-tech-group']
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

    const rawStorage = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!rawStorage) {
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
      // Auto-migrate legacy 00000000-... IDs to official Supabase b2000000-... and d4000000-... IDs
      const migratedRaw = rawStorage
        .replace(/00000000-0000-0000-0000-000000000001/g, 'b2000000-0000-0000-0000-000000000001')
        .replace(/00000000-0000-0000-0000-000000000010/g, 'd4000000-0000-0000-0000-000000000001')
        .replace(/00000000-0000-0000-0000-000000000020/g, 'd4000000-0000-0000-0000-000000000002')
        .replace(/00000000-0000-0000-0000-000000000021/g, 'd4000000-0000-0000-0000-000000000004')
        .replace(/00000000-0000-0000-0000-000000000030/g, 'd4000000-0000-0000-0000-000000000003')
        .replace(/00000000-0000-0000-0000-000000000031/g, 'd4000000-0000-0000-0000-000000000006')
        .replace(/00000000-0000-0000-0000-000000000099/g, 'd4000000-0000-0000-0000-000000000099');

      const parsed = JSON.parse(migratedRaw);
      if (!Array.isArray(parsed.companies) || parsed.companies.length === 0) parsed.companies = MOCK_COMPANIES;
      if (!Array.isArray(parsed.plans) || parsed.plans.length === 0) parsed.plans = MOCK_PLANS;
      if (!Array.isArray(parsed.subscriptions) || parsed.subscriptions.length === 0) parsed.subscriptions = MOCK_SUBSCRIPTIONS;
      if (!Array.isArray(parsed.profiles) || parsed.profiles.length === 0) parsed.profiles = MOCK_PROFILES;
      if (!Array.isArray(parsed.permissionGroups) || parsed.permissionGroups.length === 0) parsed.permissionGroups = DEFAULT_PERMISSION_GROUPS;
      if (!Array.isArray(parsed.customers)) parsed.customers = [];
      if (!Array.isArray(parsed.categories)) parsed.categories = [];
      if (!Array.isArray(parsed.brands)) parsed.brands = [];
      if (!Array.isArray(parsed.models)) parsed.models = [];
      if (!Array.isArray(parsed.services)) parsed.services = [];
      if (!Array.isArray(parsed.workflowStates) || parsed.workflowStates.length === 0) parsed.workflowStates = INITIAL_WORKFLOW_STATES;
      if (!Array.isArray(parsed.checklistTemplates)) parsed.checklistTemplates = [];
      if (!Array.isArray(parsed.serviceOrders)) parsed.serviceOrders = [];
      if (!Array.isArray(parsed.payments)) parsed.payments = [];
      if (!Array.isArray(parsed.auditLogs)) parsed.auditLogs = [];
      if (!parsed.settings) parsed.settings = MOCK_COMPANY_SETTINGS;
      if (!parsed.company) parsed.company = MOCK_COMPANY_SUPREME;

      if (migratedRaw !== rawStorage) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      }
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
    const old = data.companies[idx];
    const updated = { ...old, ...updates, updated_at: new Date().toISOString() };
    data.companies[idx] = updated;
    this.saveStoreData(data);
    supabase.from('companies').update(updates).eq('id', id).then();

    const diffs: string[] = [];
    if (updates.trade_name !== undefined && updates.trade_name !== old.trade_name) diffs.push(`Nome Fantasia de "${old.trade_name}" para "${updates.trade_name}"`);
    if (updates.corporate_name !== undefined && updates.corporate_name !== old.corporate_name) diffs.push(`Razão Social de "${old.corporate_name || '(vazio)'}" para "${updates.corporate_name || '(vazio)'}"`);
    if (updates.cnpj !== undefined && updates.cnpj !== old.cnpj) diffs.push(`CNPJ de "${old.cnpj || '(vazio)'}" para "${updates.cnpj || '(vazio)'}"`);
    if (updates.phone !== undefined && updates.phone !== old.phone) diffs.push(`Telefone de "${old.phone || '(vazio)'}" para "${updates.phone || '(vazio)'}"`);
    if (updates.whatsapp !== undefined && updates.whatsapp !== old.whatsapp) diffs.push(`WhatsApp de "${old.whatsapp || '(vazio)'}" para "${updates.whatsapp || '(vazio)'}"`);
    if (updates.email !== undefined && updates.email !== old.email) diffs.push(`E-mail de "${old.email || '(vazio)'}" para "${updates.email || '(vazio)'}"`);
    if (updates.address !== undefined && updates.address !== old.address) diffs.push(`Endereço de "${old.address || '(vazio)'}" para "${updates.address || '(vazio)'}"`);
    if (updates.city !== undefined && updates.city !== old.city) diffs.push(`Cidade de "${old.city || '(vazio)'}" para "${updates.city || '(vazio)'}"`);
    if (updates.state !== undefined && updates.state !== old.state) diffs.push(`UF de "${old.state || '(vazio)'}" para "${updates.state || '(vazio)'}"`);
    if (updates.responsible_name !== undefined && updates.responsible_name !== old.responsible_name) diffs.push(`Responsável de "${old.responsible_name || '(vazio)'}" para "${updates.responsible_name || '(vazio)'}"`);

    this.logAudit({
      tenant_id: id,
      user_name: performedByName || 'Administrador',
      action: 'ALTERACAO_EMPRESA',
      resource: 'companies',
      resource_id: id,
      details: diffs.length > 0
        ? `Alterados dados cadastrais da empresa "${old.trade_name}": ${diffs.join('; ')}`
        : `Atualizado cadastro da empresa "${old.trade_name}"`
    });

    return updated;
  }

  static setCompanySegment(companyId: string, segment: BusinessTemplateKey, performedByName?: string): Company {
    const data = this.getStoreData();
    const comp = data.companies.find((c: Company) => c.id === companyId);
    if (!comp) throw new Error('Empresa não encontrada');
    const oldSegment = comp.business_segment || comp.active_template_keys?.[0] || 'RECARGA_CARTUCHOS';
    comp.active_template_keys = [segment];
    comp.business_segment = segment;
    this.saveStoreData(data);

    this.logAudit({
      tenant_id: companyId,
      user_name: performedByName || 'Administrador',
      action: 'ALTERACAO_SEGMENTO',
      resource: 'companies',
      resource_id: companyId,
      details: `Segmento de atuação alterado de "${oldSegment}" para "${segment}"`
    });

    return comp;
  }

  static deleteCompany(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    const old = (data.companies || []).find((c: Company) => c.id === id);
    data.companies = (data.companies || []).filter((c: Company) => c.id !== id);
    this.saveStoreData(data);
    supabase.from('companies').delete().eq('id', id).then();

    if (old) {
      this.logAudit({
        tenant_id: id,
        user_name: performedByName || 'Super Administrador',
        action: 'EXCLUSAO_EMPRESA',
        resource: 'companies',
        resource_id: id,
        details: `Excluída empresa "${old.trade_name}" (CNPJ: ${old.cnpj || 'N/A'})`
      });
    }

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

    this.logAudit({
      user_name: performedByName || 'Super Administrador',
      action: 'CADASTRO_PLANO',
      resource: 'plans',
      resource_id: newPlan.id,
      details: `Criado novo plano "${newPlan.name}" (R$ ${newPlan.monthly_price}/mês, ${newPlan.max_users} usuários base)`
    });

    return newPlan;
  }

  static updatePlan(id: string, updates: Partial<Plan>, performedByName?: string): Plan {
    const data = this.getStoreData();
    const idx = data.plans.findIndex((p: Plan) => p.id === id);
    if (idx === -1) throw new Error('Plano não encontrado');
    const old = data.plans[idx];
    const updated = { ...old, ...updates, updated_at: new Date().toISOString() };
    data.plans[idx] = updated;
    this.saveStoreData(data);

    this.logAudit({
      user_name: performedByName || 'Super Administrador',
      action: 'ALTERACAO_PLANO',
      resource: 'plans',
      resource_id: id,
      details: `Atualizado plano "${old.name}" (Preço: R$ ${updated.price_monthly}, Limite: ${updated.max_users} usuários)`
    });

    return updated;
  }

  static deletePlan(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    const old = data.plans.find((p: Plan) => p.id === id);
    data.plans = data.plans.filter((p: Plan) => p.id !== id);
    this.saveStoreData(data);

    if (old) {
      this.logAudit({
        user_name: performedByName || 'Super Administrador',
        action: 'EXCLUSAO_PLANO',
        resource: 'plans',
        resource_id: id,
        details: `Excluído plano "${old.name}"`
      });
    }

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

  static getEligibleTechnicians(tenantId: string): Profile[] {
    const users = this.getUsers(tenantId).filter(u => u.is_active !== false);
    const settings = this.getSettings(tenantId);
    const allowedGroupIds = settings.technician_group_ids;

    if (Array.isArray(allowedGroupIds) && allowedGroupIds.length > 0) {
      return users.filter(u => {
        if (u.group_id && allowedGroupIds.includes(u.group_id)) return true;
        if (allowedGroupIds.includes('default-tech-group') && u.role === 'TECNICO') return true;
        if (allowedGroupIds.includes('default-admin-group') && (u.role === 'ADMINISTRADOR' || u.role === 'SUPER_ADMIN')) return true;
        if (allowedGroupIds.includes('default-atendente-group') && u.role === 'ATENDENTE') return true;
        return false;
      });
    }

    // Default: only users in default-tech-group or with role TECNICO
    return users.filter(u => {
      if (u.group_id === 'default-tech-group') return true;
      if (u.role === 'TECNICO') return true;
      if (u.group_name && (u.group_name.toLowerCase().includes('técnico') || u.group_name.toLowerCase().includes('tecnico'))) return true;
      return false;
    });
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
    supabase.from('permission_groups').insert(newGroup).then();

    this.logAudit({
      tenant_id: newGroup.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'CRIACAO_GRUPO_PERMISSOES',
      resource: 'permission_groups',
      resource_id: newGroup.id,
      details: `Criado grupo de permissões "${newGroup.name}" (Perfil base: ${newGroup.default_role}, Limite Desconto: ${newGroup.default_max_discount_percent}%)`
    });

    return newGroup;
  }

  static updatePermissionGroup(id: string, updates: Partial<PermissionGroup>, performedByName?: string): PermissionGroup {
    const data = this.getStoreData();
    const idx = data.permissionGroups.findIndex((g: PermissionGroup) => g.id === id);
    if (idx === -1) throw new Error('Grupo não encontrado');
    const old = data.permissionGroups[idx];
    const updated = { ...old, ...updates, updated_at: new Date().toISOString() };
    data.permissionGroups[idx] = updated;
    this.saveStoreData(data);
    supabase.from('permission_groups').update(updates).eq('id', id).then();

    const diffs: string[] = [];
    if (updates.name !== undefined && updates.name !== old.name) diffs.push(`Nome de "${old.name}" para "${updates.name}"`);
    if (updates.description !== undefined && updates.description !== old.description) diffs.push(`Descrição de "${old.description}" para "${updates.description}"`);
    if (updates.default_role !== undefined && updates.default_role !== old.default_role) diffs.push(`Função base de "${old.default_role}" para "${updates.default_role}"`);
    if (updates.default_max_discount_percent !== undefined && updates.default_max_discount_percent !== old.default_max_discount_percent) {
      diffs.push(`Limite de desconto de ${old.default_max_discount_percent}% para ${updates.default_max_discount_percent}%`);
    }
    if (updates.default_inactivity_timeout_minutes !== undefined && updates.default_inactivity_timeout_minutes !== old.default_inactivity_timeout_minutes) {
      diffs.push(`Timeout de inatividade de ${old.default_inactivity_timeout_minutes ?? 0}min para ${updates.default_inactivity_timeout_minutes}min`);
    }
    if (updates.permissions) {
      const activeCount = Object.values(updates.permissions).filter(Boolean).length;
      diffs.push(`Permissões atualizadas (${activeCount} ativas)`);
    }

    this.logAudit({
      tenant_id: old.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'ALTERACAO_GRUPO_PERMISSOES',
      resource: 'permission_groups',
      resource_id: id,
      details: diffs.length > 0
        ? `Atualizado grupo de permissões "${old.name}": ${diffs.join('; ')}`
        : `Atualizado grupo de permissões "${old.name}"`
    });

    return updated;
  }

  static deletePermissionGroup(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    const group = data.permissionGroups.find((g: PermissionGroup) => g.id === id);
    if (group?.is_system_default) throw new Error('Grupos padrão do sistema não podem ser excluídos.');
    data.permissionGroups = data.permissionGroups.filter((g: PermissionGroup) => g.id !== id);
    this.saveStoreData(data);
    supabase.from('permission_groups').delete().eq('id', id).then();

    if (group) {
      this.logAudit({
        tenant_id: group.tenant_id,
        user_name: performedByName || 'Administrador',
        action: 'EXCLUSAO_GRUPO_PERMISSOES',
        resource: 'permission_groups',
        resource_id: id,
        details: `Excluído grupo de permissões "${group.name}"`
      });
    }

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

    this.logAudit({
      tenant_id: newUser.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'CADASTRO_USUARIO',
      resource: 'profiles',
      resource_id: newUser.id,
      details: `Cadastrado novo usuário "${newUser.full_name}" (Função: ${newUser.role}, Grupo: ${newUser.group_name || 'Nenhum'}, E-mail: ${newUser.email}${newUser.phone ? `, Tel: ${newUser.phone}` : ''})`
    });

    return newUser;
  }

  static updateUser(id: string, updates: Partial<Profile>, performedByName?: string): Profile {
    const data = this.getStoreData();
    const idx = data.profiles.findIndex((p: Profile) => p.id === id);
    if (idx === -1) throw new Error('Usuário não encontrado');
    const old = data.profiles[idx];
    const updated = { ...old, ...updates };
    data.profiles[idx] = updated;
    this.saveStoreData(data);
    supabase.from('profiles').update(updates).eq('id', id).then();

    const diffs: string[] = [];
    if (updates.full_name !== undefined && updates.full_name !== old.full_name) diffs.push(`Nome de "${old.full_name}" para "${updates.full_name}"`);
    if (updates.email !== undefined && updates.email !== old.email) diffs.push(`E-mail de "${old.email}" para "${updates.email}"`);
    if (updates.phone !== undefined && updates.phone !== old.phone) diffs.push(`Telefone de "${old.phone || '(vazio)'}" para "${updates.phone || '(vazio)'}"`);
    if (updates.role !== undefined && updates.role !== old.role) diffs.push(`Função de "${old.role}" para "${updates.role}"`);
    if (updates.group_name !== undefined && updates.group_name !== old.group_name) diffs.push(`Grupo de "${old.group_name || 'Nenhum'}" para "${updates.group_name}"`);
    if (updates.is_active !== undefined && updates.is_active !== old.is_active) diffs.push(updates.is_active ? `Status ativado` : `Status desativado (Inativo)`);
    if (updates.max_discount_percent !== undefined && updates.max_discount_percent !== old.max_discount_percent) {
      diffs.push(`Limite de desconto de ${old.max_discount_percent ?? 10}% para ${updates.max_discount_percent}%`);
    }
    if (updates.inactivity_timeout_minutes !== undefined && updates.inactivity_timeout_minutes !== old.inactivity_timeout_minutes) {
      diffs.push(`Timeout de inatividade de ${old.inactivity_timeout_minutes ?? 0}min para ${updates.inactivity_timeout_minutes}min`);
    }

    this.logAudit({
      tenant_id: old.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'ALTERACAO_USUARIO',
      resource: 'profiles',
      resource_id: id,
      details: diffs.length > 0
        ? `Alterado usuário "${old.full_name}": ${diffs.join('; ')}`
        : `Atualizado cadastro do usuário "${old.full_name}"`
    });

    return updated;
  }

  static deleteUser(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    const old = (data.profiles || []).find((p: Profile) => p.id === id);
    data.profiles = (data.profiles || []).filter((p: Profile) => p.id !== id);
    this.saveStoreData(data);
    supabase.from('profiles').delete().eq('id', id).then();

    if (old) {
      this.logAudit({
        tenant_id: old.tenant_id,
        user_name: performedByName || 'Administrador',
        action: 'EXCLUSAO_USUARIO',
        resource: 'profiles',
        resource_id: id,
        details: `Excluído usuário "${old.full_name}" (${old.email}, Função: ${old.role})`
      });
    }

    return true;
  }

  static changeUserPassword(id: string, newPass: string, performedByName?: string): Profile {
    const data = this.getStoreData();
    const idx = data.profiles.findIndex((p: Profile) => p.id === id);
    if (idx === -1) throw new Error('Usuário não encontrado');
    const user = data.profiles[idx];
    user.password = newPass;
    this.saveStoreData(data);
    supabase.from('profiles').update({ password: newPass }).eq('id', id).then();

    this.logAudit({
      tenant_id: user.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'ALTERACAO_SENHA',
      resource: 'profiles',
      resource_id: id,
      details: `Redefinida a senha de acesso do usuário "${user.full_name}" (${user.email})`
    });

    return user;
  }

  static updateUserPermissions(
    id: string, 
    permissions: Record<string, boolean>, 
    performedByName?: string, 
    maxDiscountPercent?: number,
    inactivityTimeoutMinutes?: number
  ): Profile {
    const data = this.getStoreData();
    const idx = data.profiles.findIndex((p: Profile) => p.id === id);
    if (idx === -1) throw new Error('Usuário não encontrado');
    const oldUser = data.profiles[idx];
    const newPermCount = Object.values(permissions || {}).filter(Boolean).length;

    data.profiles[idx].custom_permissions = permissions;
    if (maxDiscountPercent !== undefined) {
      data.profiles[idx].max_discount_percent = maxDiscountPercent;
    }
    if (inactivityTimeoutMinutes !== undefined) {
      data.profiles[idx].inactivity_timeout_minutes = inactivityTimeoutMinutes;
    }
    this.saveStoreData(data);
    
    const dbUpdates: any = {
      custom_permissions: permissions
    };
    if (maxDiscountPercent !== undefined) dbUpdates.max_discount_percent = maxDiscountPercent;
    if (inactivityTimeoutMinutes !== undefined) dbUpdates.inactivity_timeout_minutes = inactivityTimeoutMinutes;
    
    supabase.from('profiles').update(dbUpdates).eq('id', id).then();

    const extraNotes: string[] = [];
    if (maxDiscountPercent !== undefined) extraNotes.push(`Limite Desconto: ${maxDiscountPercent}%`);
    if (inactivityTimeoutMinutes !== undefined) extraNotes.push(`Timeout Inatividade: ${inactivityTimeoutMinutes === 0 ? 'Desativado' : `${inactivityTimeoutMinutes}min`}`);

    this.logAudit({
      tenant_id: oldUser.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'PERMISSOES_USUARIO',
      resource: 'profiles',
      resource_id: id,
      details: `Atualizadas permissões personalizadas do usuário "${oldUser.full_name}" (${newPermCount} permissões concedidas${extraNotes.length > 0 ? `, ${extraNotes.join(', ')}` : ''})`
    });

    return data.profiles[idx];
  }

  static terminateUserSession(userId: string, performedByName?: string): Profile {
    const data = this.getStoreData();
    const idx = (data.profiles || []).findIndex((p: Profile) => p.id === userId);
    if (idx === -1) throw new Error('Usuário não encontrado');
    const user = data.profiles[idx];
    const prevDevice = user.active_session_device || 'Sessão Ativa';
    
    user.active_session_token = undefined;
    user.active_session_device = undefined;
    user.active_session_ip = undefined;
    user.active_session_at = undefined;
    data.profiles[idx] = { ...user };
    this.saveStoreData(data);

    supabase.from('profiles').update({
      active_session_token: null,
      active_session_device: null,
      active_session_ip: null,
      active_session_at: null
    }).eq('id', userId).then();

    this.logAudit({
      tenant_id: user.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'ENCERRAR_SESSAO',
      resource: 'profiles',
      resource_id: userId,
      details: `Encerramento forçado de sessão ativa do usuário "${user.full_name}" (${prevDevice})`
    });

    return data.profiles[idx];
  }

  static updateUserInactivityTimeout(userId: string, timeoutMinutes: number, performedByName?: string): Profile {
    const data = this.getStoreData();
    const idx = (data.profiles || []).findIndex((p: Profile) => p.id === userId);
    if (idx === -1) throw new Error('Usuário não encontrado');
    const user = data.profiles[idx];
    const oldTimeout = user.inactivity_timeout_minutes ?? 0;
    const cleanTimeout = Math.max(0, Number(timeoutMinutes) || 0);

    user.inactivity_timeout_minutes = cleanTimeout;
    data.profiles[idx] = { ...user };
    this.saveStoreData(data);

    supabase.from('profiles').update({
      inactivity_timeout_minutes: cleanTimeout
    }).eq('id', userId).then();

    this.logAudit({
      tenant_id: user.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'ALTERACAO_TIMEOUT_INATIVIDADE',
      resource: 'profiles',
      resource_id: userId,
      details: `Alterado tempo de inatividade do usuário "${user.full_name}" de ${oldTimeout}min para ${cleanTimeout}min`
    });

    return data.profiles[idx];
  }

  static getUserInactivityTimeout(userId: string): number {
    const data = this.getStoreData();
    const user = (data.profiles || []).find((p: Profile) => p.id === userId);
    if (!user) return 0;
    if (user.inactivity_timeout_minutes !== undefined && user.inactivity_timeout_minutes !== null) {
      return Number(user.inactivity_timeout_minutes);
    }
    if (user.group_id) {
      const group = (data.permissionGroups || []).find((g: PermissionGroup) => g.id === user.group_id);
      if (group && group.default_inactivity_timeout_minutes !== undefined && group.default_inactivity_timeout_minutes !== null) {
        return Number(group.default_inactivity_timeout_minutes);
      }
    }
    if (user.tenant_id) {
      const settings = this.getSettings(user.tenant_id);
      if (settings && settings.default_inactivity_timeout_minutes !== undefined && settings.default_inactivity_timeout_minutes !== null) {
        return Number(settings.default_inactivity_timeout_minutes);
      }
    }
    return 0;
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
    supabase.from('customers').insert({
      id: newCustomer.id,
      tenant_id: newCustomer.tenant_id,
      internal_code: newCustomer.internal_code,
      name: newCustomer.name,
      document: newCustomer.document || null,
      phone: newCustomer.phone,
      whatsapp: newCustomer.whatsapp || null,
      email: newCustomer.email || null,
      company_name: newCustomer.company_name || null,
      notes: newCustomer.notes || null,
      phone_is_whatsapp: newCustomer.phone_is_whatsapp || false,
      secondary_phone: newCustomer.secondary_phone || null,
      secondary_phone_is_whatsapp: newCustomer.secondary_phone_is_whatsapp || false
    }).then();

    this.logAudit({
      tenant_id: newCustomer.tenant_id,
      user_name: performedByName || 'Atendente',
      action: 'CADASTRO_CLIENTE',
      resource: 'customers',
      resource_id: newCustomer.id,
      details: `Cadastrado cliente "${newCustomer.name}" (Cód: ${newCustomer.internal_code}, Tel: ${newCustomer.phone}${newCustomer.document ? `, Doc: ${newCustomer.document}` : ''}${newCustomer.email ? `, E-mail: ${newCustomer.email}` : ''}${newCustomer.company_name ? `, Razão: ${newCustomer.company_name}` : ''})`
    });

    return newCustomer;
  }

  static updateCustomer(id: string, updates: Partial<Customer>, performedByName?: string): Customer {
    const data = this.getStoreData();
    const idx = data.customers.findIndex((c: Customer) => c.id === id);
    if (idx === -1) throw new Error('Cliente não encontrado');
    const old = data.customers[idx];
    const updated = { ...old, ...updates, updated_at: new Date().toISOString() };
    data.customers[idx] = updated;
    this.saveStoreData(data);
    supabase.from('customers').update(updates).eq('id', id).then();

    const diffs: string[] = [];
    if (updates.name !== undefined && updates.name !== old.name) diffs.push(`Nome de "${old.name}" para "${updates.name}"`);
    if (updates.phone !== undefined && updates.phone !== old.phone) diffs.push(`Telefone de "${old.phone || '(vazio)'}" para "${updates.phone}"`);
    if (updates.secondary_phone !== undefined && updates.secondary_phone !== old.secondary_phone) diffs.push(`Tel. Secundário de "${old.secondary_phone || '(vazio)'}" para "${updates.secondary_phone || '(vazio)'}"`);
    if (updates.whatsapp !== undefined && updates.whatsapp !== old.whatsapp) diffs.push(`WhatsApp de "${old.whatsapp || '(vazio)'}" para "${updates.whatsapp || '(vazio)'}"`);
    if (updates.document !== undefined && updates.document !== old.document) diffs.push(`Documento/CPF/CNPJ de "${old.document || '(vazio)'}" para "${updates.document || '(vazio)'}"`);
    if (updates.email !== undefined && updates.email !== old.email) diffs.push(`E-mail de "${old.email || '(vazio)'}" para "${updates.email || '(vazio)'}"`);
    if (updates.company_name !== undefined && updates.company_name !== old.company_name) diffs.push(`Razão Social/Empresa de "${old.company_name || '(vazio)'}" para "${updates.company_name || '(vazio)'}"`);
    if (updates.notes !== undefined && updates.notes !== old.notes) diffs.push(`Observações atualizadas`);

    this.logAudit({
      tenant_id: old.tenant_id,
      user_name: performedByName || 'Atendente',
      action: 'ALTERACAO_CLIENTE',
      resource: 'customers',
      resource_id: id,
      details: diffs.length > 0
        ? `Alterado cliente "${old.name}" (Cód: ${old.internal_code}): ${diffs.join('; ')}`
        : `Atualizado cadastro do cliente "${old.name}"`
    });

    return updated;
  }

  static deleteCustomer(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    const old = (data.customers || []).find((c: Customer) => c.id === id);
    data.customers = (data.customers || []).filter((c: Customer) => c.id !== id);
    this.saveStoreData(data);
    supabase.from('customers').update({ deleted_at: new Date().toISOString() }).eq('id', id).then();

    if (old) {
      this.logAudit({
        tenant_id: old.tenant_id,
        user_name: performedByName || 'Administrador',
        action: 'EXCLUSAO_CLIENTE',
        resource: 'customers',
        resource_id: id,
        details: `Excluído cliente "${old.name}" (Cód: ${old.internal_code}, Tel: ${old.phone || 'N/A'})`
      });
    }

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
    supabase.from('item_categories').insert({
      id: newCategory.id,
      tenant_id: newCategory.tenant_id || null,
      name: newCategory.name,
      slug: newCategory.slug,
      description: newCategory.description || null,
      icon: newCategory.icon || 'Layers',
      identifier_label: newCategory.identifier_label || 'Nº de Série',
      is_system: newCategory.is_system || false,
      is_active: newCategory.is_active !== false
    }).then();

    this.logAudit({
      tenant_id: newCategory.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'CADASTRO_CATEGORIA',
      resource: 'categories',
      resource_id: newCategory.id,
      details: `Cadastrada categoria de equipamento "${newCategory.name}" (Tipo de inspeção: ${newCategory.inspection_type})`
    });

    return newCategory;
  }

  static updateCategory(id: string, updates: Partial<ItemCategory>, performedByName?: string): ItemCategory {
    const data = this.getStoreData();
    if (!Array.isArray(data.categories)) data.categories = [...INITIAL_CATEGORIES];
    const idx = data.categories.findIndex((c: ItemCategory) => c.id === id);
    if (idx === -1) throw new Error('Categoria não encontrada');
    const old = data.categories[idx];
    const updated = { ...old, ...updates, updated_at: new Date().toISOString() };
    data.categories[idx] = updated;
    this.saveStoreData(data);
    supabase.from('item_categories').update(updates).eq('id', id).then();

    const diffs: string[] = [];
    if (updates.name !== undefined && updates.name !== old.name) diffs.push(`Nome de "${old.name}" para "${updates.name}"`);
    if (updates.inspection_type !== undefined && updates.inspection_type !== old.inspection_type) diffs.push(`Tipo de inspeção de "${old.inspection_type}" para "${updates.inspection_type}"`);
    if (updates.identifier_label !== undefined && updates.identifier_label !== old.identifier_label) diffs.push(`Rótulo do identificador de "${old.identifier_label}" para "${updates.identifier_label}"`);
    if (updates.technical_verdicts) diffs.push(`Pareceres técnicos atualizados (${updates.technical_verdicts.length} opções)`);
    if (updates.custom_fields) diffs.push(`Campos personalizados atualizados (${updates.custom_fields.length} campos)`);

    this.logAudit({
      tenant_id: old.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'ALTERACAO_CATEGORIA',
      resource: 'categories',
      resource_id: id,
      details: diffs.length > 0
        ? `Alterada categoria "${old.name}": ${diffs.join('; ')}`
        : `Atualizada categoria "${old.name}"`
    });

    return updated;
  }

  static deleteCategory(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    if (!Array.isArray(data.categories)) data.categories = [...INITIAL_CATEGORIES];
    const old = data.categories.find((c: ItemCategory) => c.id === id);
    data.categories = data.categories.filter((c: ItemCategory) => c.id !== id);
    this.saveStoreData(data);
    supabase.from('item_categories').delete().eq('id', id).then();

    if (old) {
      this.logAudit({
        tenant_id: old.tenant_id,
        user_name: performedByName || 'Administrador',
        action: 'EXCLUSAO_CATEGORIA',
        resource: 'categories',
        resource_id: id,
        details: `Excluída categoria de equipamento "${old.name}"`
      });
    }

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
    supabase.from('brands').insert({
      id: newBrand.id,
      tenant_id: newBrand.tenant_id || null,
      name: newBrand.name,
      slug: newBrand.slug,
      is_system: newBrand.is_system || false,
      is_active: newBrand.is_active !== false
    }).then();

    this.logAudit({
      tenant_id: newBrand.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'CADASTRO_MARCA',
      resource: 'brands',
      resource_id: newBrand.id,
      details: `Cadastrada marca "${newBrand.name}"`
    });

    return newBrand;
  }

  static updateBrand(id: string, updates: Partial<Brand>, performedByName?: string): Brand {
    const data = this.getStoreData();
    if (!Array.isArray(data.brands)) data.brands = [...INITIAL_BRANDS];
    const idx = data.brands.findIndex((b: Brand) => b.id === id);
    if (idx === -1) throw new Error('Marca não encontrada');
    const old = data.brands[idx];
    const updated = { ...old, ...updates, updated_at: new Date().toISOString() };
    data.brands[idx] = updated;
    this.saveStoreData(data);
    supabase.from('brands').update(updates).eq('id', id).then();

    this.logAudit({
      tenant_id: old.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'ALTERACAO_MARCA',
      resource: 'brands',
      resource_id: id,
      details: `Alterada marca "${old.name}" para "${updated.name}"`
    });

    return updated;
  }

  static deleteBrand(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    if (!Array.isArray(data.brands)) data.brands = [...INITIAL_BRANDS];
    const old = data.brands.find((b: Brand) => b.id === id);
    data.brands = data.brands.filter((b: Brand) => b.id !== id);
    this.saveStoreData(data);
    supabase.from('brands').delete().eq('id', id).then();

    if (old) {
      this.logAudit({
        tenant_id: old.tenant_id,
        user_name: performedByName || 'Administrador',
        action: 'EXCLUSAO_MARCA',
        resource: 'brands',
        resource_id: id,
        details: `Excluída marca "${old.name}"`
      });
    }

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
    supabase.from('item_models').insert({
      id: newModel.id,
      tenant_id: newModel.tenant_id,
      category_id: newModel.category_id,
      brand_id: newModel.brand_id || null,
      name: newModel.name,
      internal_code: newModel.internal_code || null,
      description: newModel.description || null,
      technical_notes: newModel.technical_notes || null,
      attributes: newModel.attributes || {},
      is_active: newModel.is_active !== false
    }).then();

    const cat = (data.categories || INITIAL_CATEGORIES).find((c: ItemCategory) => c.id === model.category_id);
    this.logAudit({
      tenant_id: newModel.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'CADASTRO_MODELO',
      resource: 'models',
      resource_id: newModel.id,
      details: `Cadastrado modelo "${newModel.name}" (Cód: ${newModel.internal_code || 'N/A'}, Categoria: ${cat?.name || 'Geral'}${newModel.brand_name ? `, Marca: ${newModel.brand_name}` : ''})`
    });

    return newModel;
  }

  static updateModel(id: string, updates: Partial<ItemModel>, performedByName?: string): ItemModel {
    const data = this.getStoreData();
    const idx = data.models.findIndex((m: ItemModel) => m.id === id);
    if (idx === -1) throw new Error('Modelo não encontrado');
    const old = data.models[idx];
    const updated = { ...old, ...updates, updated_at: new Date().toISOString() };
    data.models[idx] = updated;
    this.saveStoreData(data);
    supabase.from('item_models').update(updates).eq('id', id).then();

    const diffs: string[] = [];
    if (updates.name !== undefined && updates.name !== old.name) diffs.push(`Nome de "${old.name}" para "${updates.name}"`);
    if (updates.internal_code !== undefined && updates.internal_code !== old.internal_code) diffs.push(`Código de "${old.internal_code || '(vazio)'}" para "${updates.internal_code || '(vazio)'}"`);
    if (updates.brand_name !== undefined && updates.brand_name !== old.brand_name) diffs.push(`Marca de "${old.brand_name || '(vazio)'}" para "${updates.brand_name || '(vazio)'}"`);
    if (updates.description !== undefined && updates.description !== old.description) diffs.push(`Descrição atualizada`);
    if (updates.empty_weight_grams !== undefined && updates.empty_weight_grams !== old.empty_weight_grams) diffs.push(`Peso vazio de ${old.empty_weight_grams ?? '--'}g para ${updates.empty_weight_grams}g`);
    if (updates.full_weight_grams !== undefined && updates.full_weight_grams !== old.full_weight_grams) diffs.push(`Peso cheio de ${old.full_weight_grams ?? '--'}g para ${updates.full_weight_grams}g`);
    if (updates.service_prices) {
      diffs.push(`Tabela de preços de serviços atualizada (${Object.keys(updates.service_prices).length} preços vinculados)`);
    }

    this.logAudit({
      tenant_id: old.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'ALTERACAO_MODELO',
      resource: 'models',
      resource_id: id,
      details: diffs.length > 0
        ? `Alterado modelo "${old.name}": ${diffs.join('; ')}`
        : `Atualizado modelo "${old.name}"`
    });

    return updated;
  }

  static deleteModel(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    const old = (data.models || []).find((m: ItemModel) => m.id === id);
    data.models = data.models.filter((m: ItemModel) => m.id !== id);
    this.saveStoreData(data);
    supabase.from('item_models').delete().eq('id', id).then();

    if (old) {
      this.logAudit({
        tenant_id: old.tenant_id,
        user_name: performedByName || 'Administrador',
        action: 'EXCLUSAO_MODELO',
        resource: 'models',
        resource_id: id,
        details: `Excluído modelo "${old.name}" (Cód: ${old.internal_code || 'N/A'})`
      });
    }

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
    supabase.from('services').insert({
      id: newService.id,
      tenant_id: newService.tenant_id,
      name: newService.name,
      code: newService.code,
      description: newService.description || null,
      default_price: newService.default_price || 0,
      estimated_time_minutes: newService.estimated_time_minutes || 60,
      is_active: newService.is_active !== false
    }).then();

    this.logAudit({
      tenant_id: newService.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'CADASTRO_SERVICO',
      resource: 'services',
      resource_id: newService.id,
      details: `Cadastrado serviço "${newService.name}" (Valor padrão: R$ ${(newService.default_price || 0).toFixed(2)}, Código: ${newService.code})`
    });

    return newService;
  }

  static updateService(id: string, updates: Partial<Service>, performedByName?: string): Service {
    const data = this.getStoreData();
    const idx = data.services.findIndex((s: Service) => s.id === id);
    if (idx === -1) throw new Error('Serviço não encontrado');
    const old = data.services[idx];
    const updated = { ...old, ...updates, updated_at: new Date().toISOString() };
    data.services[idx] = updated;
    this.saveStoreData(data);
    supabase.from('services').update(updates).eq('id', id).then();

    const diffs: string[] = [];
    if (updates.name !== undefined && updates.name !== old.name) diffs.push(`Nome de "${old.name}" para "${updates.name}"`);
    if (updates.code !== undefined && updates.code !== old.code) diffs.push(`Código de "${old.code}" para "${updates.code}"`);
    if (updates.default_price !== undefined && updates.default_price !== old.default_price) {
      diffs.push(`Preço padrão de R$ ${Number(old.default_price || 0).toFixed(2)} para R$ ${Number(updates.default_price || 0).toFixed(2)}`);
    }
    if (updates.estimated_time_minutes !== undefined && updates.estimated_time_minutes !== old.estimated_time_minutes) {
      diffs.push(`Tempo estimado de ${old.estimated_time_minutes || 0}min para ${updates.estimated_time_minutes}min`);
    }

    this.logAudit({
      tenant_id: old.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'ALTERACAO_SERVICO',
      resource: 'services',
      resource_id: id,
      details: diffs.length > 0
        ? `Alterado serviço "${old.name}": ${diffs.join('; ')}`
        : `Atualizado serviço "${old.name}"`
    });

    return updated;
  }

  static deleteService(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    const old = (data.services || []).find((s: Service) => s.id === id);
    data.services = data.services.filter((s: Service) => s.id !== id);
    this.saveStoreData(data);
    supabase.from('services').delete().eq('id', id).then();

    if (old) {
      this.logAudit({
        tenant_id: old.tenant_id,
        user_name: performedByName || 'Administrador',
        action: 'EXCLUSAO_SERVICO',
        resource: 'services',
        resource_id: id,
        details: `Excluído serviço "${old.name}" (Preço padrão: R$ ${(old.default_price || 0).toFixed(2)})`
      });
    }

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
      workflow_id: state.workflow_id || 'a3000000-0000-0000-0000-000000000001',
      code: (state.code || state.name.toUpperCase().replace(/\s+/g, '_')).trim(),
      sort_order: state.sort_order || (tenantStates.length + 1)
    };
    data.workflowStates.push(newState);
    this.saveStoreData(data);
    supabase.from('workflow_states').insert({
      id: newState.id,
      tenant_id: newState.tenant_id,
      workflow_id: newState.workflow_id,
      code: newState.code,
      name: newState.name,
      color: newState.color || 'slate',
      stage_type: newState.stage_type || 'EM_ANDAMENTO',
      sort_order: newState.sort_order,
      is_initial: newState.is_initial || false,
      is_final: newState.is_final || false,
      description: newState.description || null
    }).then();

    this.logAudit({
      tenant_id: tenantId,
      user_name: performedByName || 'Administrador',
      action: 'CRIACAO_ETAPA_KANBAN',
      resource: 'workflow_states',
      resource_id: newState.id,
      details: `Criada nova etapa no Kanban "${newState.name}" (Código: ${newState.code}, Tipo: ${newState.stage_type})`
    });

    return newState;
  }

  static updateWorkflowState(id: string, updates: Partial<WorkflowState>, performedByName?: string): WorkflowState {
    const data = this.getStoreData();
    if (!Array.isArray(data.workflowStates)) data.workflowStates = [...INITIAL_WORKFLOW_STATES];
    const idx = data.workflowStates.findIndex((st: WorkflowState) => st.id === id);
    if (idx === -1) throw new Error('Situação / Etapa não encontrada');
    const old = data.workflowStates[idx];
    const updated = { ...old, ...updates };
    data.workflowStates[idx] = updated;
    this.saveStoreData(data);
    supabase.from('workflow_states').update(updates).eq('id', id).then();

    const diffs: string[] = [];
    if (updates.name !== undefined && updates.name !== old.name) diffs.push(`Nome de "${old.name}" para "${updates.name}"`);
    if (updates.code !== undefined && updates.code !== old.code) diffs.push(`Código de "${old.code}" para "${updates.code}"`);
    if (updates.color !== undefined && updates.color !== old.color) diffs.push(`Cor de "${old.color}" para "${updates.color}"`);
    if (updates.stage_type !== undefined && updates.stage_type !== old.stage_type) diffs.push(`Tipo de "${old.stage_type}" para "${updates.stage_type}"`);

    this.logAudit({
      tenant_id: old.tenant_id,
      user_name: performedByName || 'Administrador',
      action: 'ALTERACAO_ETAPA_KANBAN',
      resource: 'workflow_states',
      resource_id: id,
      details: diffs.length > 0
        ? `Alterada etapa do Kanban "${old.name}": ${diffs.join('; ')}`
        : `Atualizada etapa do Kanban "${old.name}"`
    });

    return updated;
  }

  static deleteWorkflowState(id: string, performedByName?: string): boolean {
    const data = this.getStoreData();
    if (!Array.isArray(data.workflowStates)) data.workflowStates = [...INITIAL_WORKFLOW_STATES];
    const old = data.workflowStates.find((st: WorkflowState) => st.id === id);
    data.workflowStates = data.workflowStates.filter((st: WorkflowState) => st.id !== id);
    this.saveStoreData(data);
    supabase.from('workflow_states').delete().eq('id', id).then();

    if (old) {
      this.logAudit({
        tenant_id: old.tenant_id,
        user_name: performedByName || 'Administrador',
        action: 'EXCLUSAO_ETAPA_KANBAN',
        resource: 'workflow_states',
        resource_id: id,
        details: `Excluída etapa do Kanban "${old.name}" (Código: ${old.code})`
      });
    }

    return true;
  }

  static reorderWorkflowStates(tenantId: string, stateIds: string[], performedByName?: string): WorkflowState[] {
    const data = this.getStoreData();
    if (!Array.isArray(data.workflowStates)) data.workflowStates = [...INITIAL_WORKFLOW_STATES];
    stateIds.forEach((id, idx) => {
      const state = data.workflowStates.find((s: WorkflowState) => s.id === id);
      if (state) {
        state.sort_order = idx + 1;
        supabase.from('workflow_states').update({ sort_order: idx + 1 }).eq('id', id).then();
      }
    });
    this.saveStoreData(data);

    this.logAudit({
      tenant_id: tenantId,
      user_name: performedByName || 'Administrador',
      action: 'REORDENACAO_KANBAN',
      resource: 'workflow_states',
      resource_id: tenantId,
      details: `Reordenadas as colunas do Kanban (${stateIds.length} etapas)`
    });

    return this.getWorkflowStates(tenantId);
  }

  static resetWorkflowStates(tenantId: string, performedByName?: string): WorkflowState[] {
    const data = this.getStoreData();
    data.workflowStates = [...INITIAL_WORKFLOW_STATES];
    this.saveStoreData(data);

    this.logAudit({
      tenant_id: tenantId,
      user_name: performedByName || 'Administrador',
      action: 'REORDENACAO_KANBAN',
      resource: 'workflow_states',
      resource_id: tenantId,
      details: `Restauradas as etapas padrão do Kanban`
    });

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
      assigned_technician_id?: string;
      assigned_technician_name?: string;
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
        assigned_technician_id?: string;
        assigned_technician_name?: string;
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

      const assignedTechId = itInput.assigned_technician_id || orderData.assigned_technician_id;
      const assignedTechName = itInput.assigned_technician_name || orderData.assigned_technician_name;

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
        assigned_technician_id: assignedTechId,
        assigned_technician_name: assignedTechName,
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
      assigned_technician_id: orderData.assigned_technician_id,
      assigned_technician_name: orderData.assigned_technician_name,
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
    let newPayment: Payment | null = null;
    if (orderData.initial_payment && orderData.initial_payment.amount > 0) {
      if (!Array.isArray(data.payments)) data.payments = [];
      newPayment = {
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

    // Persist to Supabase Database in relational order
    supabase.from('service_orders').insert({
      id: newOrder.id,
      tenant_id: newOrder.tenant_id,
      order_number: newOrder.order_number,
      order_sequence: newOrder.order_sequence,
      order_year: newOrder.order_year,
      customer_id: newOrder.customer_id,
      opened_by: newOrder.opened_by,
      opened_at: newOrder.opened_at,
      expected_at: newOrder.expected_at || null,
      status: 'ABERTA',
      financial_status: newOrder.financial_status,
      subtotal_amount: newOrder.subtotal_amount,
      discount_amount: newOrder.discount_amount,
      surcharge_amount: 0,
      total_amount: newOrder.total_amount,
      paid_amount: newOrder.paid_amount,
      tracking_token: newOrder.tracking_token,
      notes: newOrder.notes || null,
      internal_notes: newOrder.internal_notes || null
    }).then(() => {
      // Persist items
      for (const item of orderItems) {
        const validStateId = isValidUUID(item.current_state_id) && !item.current_state_id?.startsWith('a4000000') ? item.current_state_id : null;
        supabase.from('service_order_items').insert({
          id: item.id,
          tenant_id: item.tenant_id,
          service_order_id: item.service_order_id,
          model_id: item.model_id,
          variant_id: isValidUUID(item.variant_id) ? item.variant_id : null,
          item_index: item.item_index,
          internal_identifier: item.internal_identifier,
          reported_issue: item.reported_issue || null,
          reception_notes: item.reception_notes || null,
          accessories: item.accessories || null,
          checklist: item.checklist || [],
          custom_field_values: item.custom_field_values || {},
          current_state_id: validStateId,
          status: item.status,
          assigned_technician_id: isValidUUID(item.assigned_technician_id) ? item.assigned_technician_id : null,
          subtotal_amount: item.subtotal_amount,
          discount_amount: item.discount_amount,
          total_amount: item.total_amount,
          received_at: item.received_at
        }).then(() => {
          for (const srv of (item.services || [])) {
            supabase.from('service_order_item_services').insert({
              id: srv.id,
              tenant_id: srv.tenant_id,
              service_order_item_id: srv.service_order_item_id,
              service_id: srv.service_id,
              technician_id: isValidUUID(srv.technician_id) ? srv.technician_id : null,
              quantity: srv.quantity,
              unit_price: srv.unit_price,
              discount_amount: srv.discount_amount,
              surcharge_amount: srv.surcharge_amount,
              total_amount: srv.total_amount,
              status: srv.status,
              field_data: srv.field_data || {}
            }).then();
          }
        });
      }
    });

    if (newPayment) {
      supabase.from('payments').insert({
        id: newPayment.id,
        tenant_id: newPayment.tenant_id,
        service_order_id: newPayment.service_order_id,
        amount: newPayment.amount,
        payment_method: newPayment.payment_method,
        received_by: newPayment.received_by,
        paid_at: newPayment.paid_at,
        notes: newPayment.notes
      }).then();
    }

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
      assigned_technician_name?: string;
      custom_field_values?: Record<string, any>;
      checklist?: Array<{ item: string; checked: boolean }>;
      services_field_data?: Record<string, any>;
    },
    performedByName?: string
  ): ServiceOrderItem {
    const data = this.getStoreData();
    let targetItem: ServiceOrderItem | null = null;
    let parentOrder: ServiceOrder | null = null;

    let techName = updates.assigned_technician_name;
    if (updates.assigned_technician_id && !techName) {
      const techProfile = (data.profiles || []).find((p: Profile) => p.id === updates.assigned_technician_id);
      techName = techProfile?.full_name;
    }

    for (const order of (data.serviceOrders || [])) {
      const itIdx = (order.items || []).findIndex((it: ServiceOrderItem) => it.id === itemId);
      if (itIdx !== -1) {
        parentOrder = order;
        const currentItem = order.items[itIdx];
        const updatedItem = {
          ...currentItem,
          ...updates,
          assigned_technician_name: techName !== undefined ? techName : currentItem.assigned_technician_name,
          custom_field_values: { ...currentItem.custom_field_values, ...(updates.custom_field_values || {}) },
          updated_at: new Date().toISOString()
        };
        order.items[itIdx] = updatedItem;
        targetItem = updatedItem;

        // Se a ordem não tiver técnico, atribui este
        if (updates.assigned_technician_id && !order.assigned_technician_id) {
          order.assigned_technician_id = updates.assigned_technician_id;
          order.assigned_technician_name = techName || currentItem.assigned_technician_name;
        }

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

    // Persist to Supabase Database
    const dbItemUpdates: any = {
      updated_at: targetItem.updated_at
    };
    if (updates.status) dbItemUpdates.status = updates.status;
    if (updates.current_state_id && isValidUUID(updates.current_state_id)) dbItemUpdates.current_state_id = updates.current_state_id;
    if (updates.result_code && isValidUUID(updates.result_code)) dbItemUpdates.result_id = updates.result_code;
    if (updates.technical_notes) dbItemUpdates.technical_notes = updates.technical_notes;
    if (updates.assigned_technician_id && isValidUUID(updates.assigned_technician_id)) dbItemUpdates.assigned_technician_id = updates.assigned_technician_id;
    if (updates.custom_field_values) dbItemUpdates.custom_field_values = targetItem.custom_field_values;
    if (updates.checklist) dbItemUpdates.checklist = updates.checklist;

    supabase.from('service_order_items').update(dbItemUpdates).eq('id', itemId).then();
    supabase.from('service_orders').update({
      status: parentOrder.status,
      assigned_technician_id: parentOrder.assigned_technician_id || null,
      updated_at: new Date().toISOString()
    }).eq('id', parentOrder.id).then();

    supabase.from('order_status_history').insert({
      tenant_id: targetItem.tenant_id,
      service_order_id: parentOrder.id,
      item_id: targetItem.id,
      previous_status: updates.status ? targetItem.status : null,
      new_status: updates.status || targetItem.status,
      changed_by: updates.assigned_technician_id || parentOrder.opened_by,
      notes: updates.technical_notes || null
    }).then();

    // Audit Log for Technical Update
    const modelName = targetItem.model?.name || targetItem.model?.description || 'Item';
    const diffs: string[] = [];
    if (updates.status) diffs.push(`Etapa: "${updates.status}"`);
    if (updates.result_code) diffs.push(`Parecer: "${updates.result_code}"`);
    if (updates.result_description) diffs.push(`Detalhe: "${updates.result_description}"`);
    if (updates.custom_field_values?.input_weight_grams !== undefined || updates.custom_field_values?.output_weight_grams !== undefined) {
      const inW = updates.custom_field_values?.input_weight_grams;
      const outW = updates.custom_field_values?.output_weight_grams;
      diffs.push(`Pesagem: Entrada ${inW !== undefined ? inW + 'g' : '--'} / Saída ${outW !== undefined ? outW + 'g' : '--'}`);
    }
    if (updates.checklist) {
      const checked = updates.checklist.filter(c => c.checked).length;
      diffs.push(`Checklist: ${checked}/${updates.checklist.length} itens checados`);
    }
    if (updates.technical_notes) diffs.push(`Obs: "${updates.technical_notes}"`);

    this.logAudit({
      tenant_id: targetItem.tenant_id,
      user_name: performedByName || techName || 'Técnico',
      action: 'DIAGNOSTICO_TECNICO',
      resource: 'service_order_items',
      resource_id: targetItem.id,
      details: `OS #${parentOrder.order_number} - ${modelName} (${targetItem.internal_identifier}): ${diffs.join('; ')}`
    });

    return targetItem;
  }

  static assignOrderItemTechnician(
    itemId: string,
    technicianId: string,
    technicianName?: string,
    performedByName?: string
  ): ServiceOrderItem {
    const data = this.getStoreData();
    const techUser = (data.profiles || []).find((p: Profile) => p.id === technicianId);
    const finalTechName = technicianName || techUser?.full_name || 'Técnico';

    const updated = this.updateOrderItemStatus(
      itemId,
      {
        assigned_technician_id: technicianId,
        assigned_technician_name: finalTechName
      },
      performedByName || finalTechName
    );

    this.logAudit({
      tenant_id: updated.tenant_id,
      user_name: performedByName || finalTechName,
      action: 'ATRIBUICAO_TECNICO',
      resource: 'service_order_items',
      resource_id: itemId,
      details: `Item atribuído ao técnico ${finalTechName}`
    });

    return updated;
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
    const checkoutPayments: Payment[] = [];
    if (Array.isArray(deliveryData.payments)) {
      if (!Array.isArray(data.payments)) data.payments = [];
      for (const p of deliveryData.payments) {
        if (p.amount > 0) {
          totalPaidInCheckout += p.amount;
          const payObj: Payment = {
            id: generateUUID(),
            tenant_id: order.tenant_id,
            service_order_id: orderId,
            amount: p.amount,
            payment_method: p.payment_method,
            received_by: order.opened_by,
            received_by_name: performedByName || 'Atendente',
            paid_at: deliveredAt,
            created_at: deliveredAt
          };
          data.payments.push(payObj);
          checkoutPayments.push(payObj);
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

    // Persist delivery to Supabase Database
    supabase.from('service_orders').update({
      status: 'ENTREGUE',
      delivered_at: deliveredAt,
      closed_at: deliveredAt,
      discount_amount: order.discount_amount,
      total_amount: order.total_amount,
      paid_amount: order.paid_amount,
      remaining_amount: order.remaining_amount,
      financial_status: order.financial_status,
      delivery_info: order.delivery_info,
      updated_at: deliveredAt
    }).eq('id', orderId).then();

    supabase.from('service_order_items').update({
      status: 'ENTREGUE',
      completed_at: deliveredAt,
      updated_at: deliveredAt
    }).eq('service_order_id', orderId).then();

    for (const pay of checkoutPayments) {
      supabase.from('payments').insert({
        id: pay.id,
        tenant_id: pay.tenant_id,
        service_order_id: pay.service_order_id,
        amount: pay.amount,
        payment_method: pay.payment_method,
        received_by: pay.received_by,
        paid_at: pay.paid_at,
        notes: 'Pagamento recebido na entrega / checkout'
      }).then();
    }

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

    supabase.from('service_orders').update({
      status: 'EM_ANDAMENTO',
      delivered_at: null,
      closed_at: null,
      updated_at: new Date().toISOString()
    }).eq('id', orderId).then();

    supabase.from('service_order_items').update({
      status: 'RECEBIDO',
      updated_at: new Date().toISOString()
    }).eq('service_order_id', orderId).then();

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

    supabase.from('service_orders').delete().eq('id', orderId).then();

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
    const old = data.settings || MOCK_COMPANY_SETTINGS;
    const updated = { ...old, ...updates, tenant_id: tenantId };
    data.settings = updated;
    this.saveStoreData(data);

    supabase.from('company_settings').upsert({
      tenant_id: tenantId,
      sku_mode: updated.sku_mode,
      sku_prefix: updated.sku_prefix,
      sku_digits: updated.sku_digits,
      sku_start_number: updated.sku_start_number,
      sku_current_number: updated.sku_current_number,
      thermal_paper_width_mm: updated.thermal_paper_width_mm,
      require_customer_document: updated.require_customer_document,
      require_item_serial: updated.require_item_serial ?? updated.require_cartridge_serial,
      require_cartridge_serial: updated.require_cartridge_serial ?? updated.require_item_serial,
      require_technician_on_entry: updated.require_technician_on_entry,
      auto_print_on_entry: updated.auto_print_on_entry,
      auto_print_on_delivery: updated.auto_print_on_delivery,
      print_entry_copies: updated.print_entry_copies,
      print_delivery_copies: updated.print_delivery_copies,
      printer_paper_width: updated.printer_paper_width,
      printer_font_size: updated.printer_font_size,
      printer_density: updated.printer_density,
      show_prices_on_receipt: updated.show_prices_on_receipt,
      show_qr_code_on_receipt: updated.show_qr_code_on_receipt,
      show_checklist_on_receipt: updated.show_checklist_on_receipt,
      show_accessories_on_receipt: updated.show_accessories_on_receipt,
      show_reported_issue_on_receipt: updated.show_reported_issue_on_receipt,
      show_technician_on_receipt: updated.show_technician_on_receipt,
      show_customer_signature_line: updated.show_customer_signature_line,
      show_attendant_signature_line: updated.show_attendant_signature_line,
      show_company_cnpj: updated.show_company_cnpj,
      show_company_contact: updated.show_company_contact,
      show_company_address: updated.show_company_address,
      receipt_header: updated.receipt_header,
      receipt_footer: updated.receipt_footer,
      receipt_delivery_footer: updated.receipt_delivery_footer,
      receipt_header_note: updated.receipt_header_note,
      receipt_footer_note: updated.receipt_footer_note,
      active_templates: updated.active_templates,
      technician_group_ids: updated.technician_group_ids,
      item_description_display_mode: updated.item_description_display_mode,
      default_inactivity_timeout_minutes: updated.default_inactivity_timeout_minutes,
      updated_at: new Date().toISOString()
    }, { onConflict: 'tenant_id' }).then(({ error }) => {
      if (error) console.error('Error updating company_settings in Supabase:', error);
    });

    const diffs: string[] = [];
    if (updates.default_inactivity_timeout_minutes !== undefined && updates.default_inactivity_timeout_minutes !== old.default_inactivity_timeout_minutes) {
      diffs.push(`Timeout de inatividade geral da empresa de ${old.default_inactivity_timeout_minutes ?? 0}min para ${updates.default_inactivity_timeout_minutes}min`);
    }
    if (updates.thermal_paper_width_mm !== undefined && updates.thermal_paper_width_mm !== old.thermal_paper_width_mm) {
      diffs.push(`Largura da bobina de ${old.thermal_paper_width_mm}mm para ${updates.thermal_paper_width_mm}mm`);
    }
    if (updates.require_customer_document !== undefined && updates.require_customer_document !== old.require_customer_document) {
      diffs.push(`Exigir CPF/CNPJ: ${updates.require_customer_document ? 'Sim' : 'Não'}`);
    }
    if (updates.require_item_serial !== undefined && updates.require_item_serial !== old.require_item_serial) {
      diffs.push(`Exigir Nº de Série: ${updates.require_item_serial ? 'Sim' : 'Não'}`);
    }
    if (updates.require_technician_on_entry !== undefined && updates.require_technician_on_entry !== old.require_technician_on_entry) {
      diffs.push(`Exigir Técnico na Entrada: ${updates.require_technician_on_entry ? 'Sim' : 'Não'}`);
    }
    if (updates.active_templates) {
      diffs.push(`Segmentos de atuação: [${updates.active_templates.join(', ')}]`);
    }
    if (updates.technician_group_ids) {
      diffs.push(`Grupos de técnicos permitidos atualizados (${updates.technician_group_ids.length} grupos)`);
    }
    if (updates.item_description_display_mode !== undefined && updates.item_description_display_mode !== old.item_description_display_mode) {
      diffs.push(`Exibição de descrição: ${updates.item_description_display_mode}`);
    }
    if (updates.receipt_header_note !== undefined && updates.receipt_header_note !== old.receipt_header_note) {
      diffs.push(`Mensagem de cabeçalho do recibo atualizada`);
    }
    if (updates.receipt_footer_note !== undefined && updates.receipt_footer_note !== old.receipt_footer_note) {
      diffs.push(`Mensagem de rodapé do recibo atualizada`);
    }
    if (updates.print_entry_copies !== undefined && updates.print_entry_copies !== old.print_entry_copies) {
      diffs.push(`Vias de impressão na entrada: ${updates.print_entry_copies} via(s)`);
    }
    if (updates.print_delivery_copies !== undefined && updates.print_delivery_copies !== old.print_delivery_copies) {
      diffs.push(`Vias de impressão na entrega: ${updates.print_delivery_copies === 0 ? 'Desativado' : `${updates.print_delivery_copies} via(s)`}`);
    }
    if (updates.auto_print_on_entry !== undefined && updates.auto_print_on_entry !== old.auto_print_on_entry) {
      diffs.push(`Disparo automático na entrada: ${updates.auto_print_on_entry ? 'Ativado' : 'Desativado'}`);
    }
    if (updates.auto_print_on_delivery !== undefined && updates.auto_print_on_delivery !== old.auto_print_on_delivery) {
      diffs.push(`Disparo automático na entrega: ${updates.auto_print_on_delivery ? 'Ativado' : 'Desativado'}`);
    }
    if (updates.printer_font_size !== undefined && updates.printer_font_size !== old.printer_font_size) {
      diffs.push(`Tamanho da fonte de impressão: ${updates.printer_font_size}`);
    }

    this.logAudit({
      tenant_id: tenantId,
      user_name: performedByName || 'Administrador',
      action: 'ALTERACAO_CONFIGURACOES',
      resource: 'settings',
      resource_id: tenantId,
      details: diffs.length > 0
        ? `Alteradas configurações do sistema: ${diffs.join('; ')}`
        : `Atualizadas configurações da empresa`
    });

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
  // AUTHENTICATION & REALTIME HELPERS
  // --------------------------------------------------------------------------
  static authenticate(email: string, pass: string, deviceInfo?: { device?: string; ip?: string }): Profile {
    const data = this.getStoreData();
    const profiles: Profile[] = data.profiles || MOCK_PROFILES;
    const user = profiles.find(p => p.email.toLowerCase().trim() === email.toLowerCase().trim());
    if (!user) throw new Error('Usuário não encontrado.');
    if (user.is_active === false) throw new Error('Este usuário está desativado.');
    if (user.password && user.password !== pass) {
      throw new Error('Senha incorreta.');
    }

    const sessionToken = generateUUID();
    const sessionDevice = deviceInfo?.device || 'Navegador Web';
    const sessionIp = deviceInfo?.ip || null;
    const sessionAt = new Date().toISOString();

    user.active_session_token = sessionToken;
    user.active_session_device = sessionDevice;
    user.active_session_ip = sessionIp || undefined;
    user.active_session_at = sessionAt;

    const idx = data.profiles.findIndex((p: Profile) => p.id === user.id);
    if (idx !== -1) {
      data.profiles[idx] = { ...user };
      this.saveStoreData(data);
    }

    supabase.from('profiles').update({
      active_session_token: sessionToken,
      active_session_device: sessionDevice,
      active_session_ip: sessionIp,
      active_session_at: sessionAt
    }).eq('id', user.id).then();

    this.logAudit({
      tenant_id: user.tenant_id,
      user_name: user.full_name,
      action: 'LOGIN_SUCESSO',
      resource: 'profiles',
      resource_id: user.id,
      details: `Login realizado com sucesso: ${user.full_name} (${user.role}) em [${sessionDevice}]`
    });
    return user;
  }

  static async authenticateAsync(email: string, pass: string, deviceInfo?: { device?: string; ip?: string }): Promise<Profile> {
    const user = this.authenticate(email, pass, deviceInfo);
    try {
      await supabase.from('profiles').update({
        active_session_token: user.active_session_token,
        active_session_device: user.active_session_device,
        active_session_ip: user.active_session_ip,
        active_session_at: user.active_session_at
      }).eq('id', user.id);
    } catch (e) {
      console.warn('Failed to sync session token immediately to Supabase:', e);
    }
    return user;
  }

  static async fetchRemoteProfileSession(userId: string): Promise<{ active_session_token?: string | null; is_active?: boolean; inactivity_timeout_minutes?: number } | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('active_session_token, is_active, inactivity_timeout_minutes')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        const local = this.getStoreData();
        const idx = (local.profiles || []).findIndex((p: Profile) => p.id === userId);
        if (idx !== -1) {
          let modified = false;
          if (local.profiles[idx].active_session_token !== (data.active_session_token || undefined)) {
            local.profiles[idx].active_session_token = data.active_session_token || undefined;
            modified = true;
          }
          if (data.is_active !== undefined && local.profiles[idx].is_active !== data.is_active) {
            local.profiles[idx].is_active = data.is_active;
            modified = true;
          }
          if (data.inactivity_timeout_minutes !== undefined && local.profiles[idx].inactivity_timeout_minutes !== data.inactivity_timeout_minutes) {
            local.profiles[idx].inactivity_timeout_minutes = data.inactivity_timeout_minutes;
            modified = true;
          }
          if (modified) {
            this.saveStoreData(local, true);
          }
        }
        return data;
      }
    } catch (e) {
      // offline fallback
    }
    return null;
  }

  private static realtimeChannel: any = null;

  static async syncFromSupabase(tenantId?: string) {
    try {
      // 1. Fetch Companies
      const { data: companiesData } = await supabase.from('companies').select('*');

      // 2. Fetch Profiles
      const { data: profilesData } = await supabase.from('profiles').select('*');

      // 3. Fetch Plans & Subscriptions
      const { data: plansData } = await supabase.from('plans').select('*');
      const { data: subsData } = await supabase.from('subscriptions').select('*');

      // 4. Target tenant
      const targetTenant = tenantId || (companiesData && companiesData[0]?.id) || MOCK_COMPANY_SUPREME.id;

      // 5. Fetch Settings
      const { data: settingsData } = await supabase
        .from('company_settings')
        .select('*')
        .eq('tenant_id', targetTenant);

      // 5b. Fetch Permission Groups
      const { data: permGroupsData } = await supabase
        .from('permission_groups')
        .select('*')
        .or(`tenant_id.eq.${targetTenant},is_system_default.eq.true`);

      // 6. Fetch Customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', targetTenant)
        .is('deleted_at', null);

      // 7. Fetch Categories, Brands, Models, Services, Workflow
      const { data: categoriesData } = await supabase
        .from('item_categories')
        .select('*')
        .or(`tenant_id.eq.${targetTenant},is_system.eq.true`);

      const { data: brandsData } = await supabase
        .from('brands')
        .select('*')
        .or(`tenant_id.eq.${targetTenant},is_system.eq.true`);

      const { data: modelsData } = await supabase
        .from('item_models')
        .select('*')
        .eq('tenant_id', targetTenant);

      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', targetTenant);

      const { data: workflowStatesData } = await supabase
        .from('workflow_states')
        .select('*')
        .eq('tenant_id', targetTenant)
        .order('sort_order', { ascending: true });

      // 8. Fetch Service Orders with items, item services, payments
      const { data: ordersData } = await supabase
        .from('service_orders')
        .select('*')
        .eq('tenant_id', targetTenant)
        .order('created_at', { ascending: false });

      const { data: orderItemsData } = await supabase
        .from('service_order_items')
        .select('*')
        .eq('tenant_id', targetTenant);

      const { data: itemServicesData } = await supabase
        .from('service_order_item_services')
        .select('*')
        .eq('tenant_id', targetTenant);

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', targetTenant);

      const { data: auditLogsData } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('tenant_id', targetTenant)
        .order('created_at', { ascending: false })
        .limit(100);

      // Merge items & services into orders
      const assembledOrders: ServiceOrder[] = (ordersData || []).map(o => {
        const items = (orderItemsData || [])
          .filter(it => it.service_order_id === o.id)
          .map(it => {
            const srvs = (itemServicesData || []).filter(s => s.service_order_item_id === it.id);
            const modelObj = (modelsData || []).find(m => m.id === it.model_id);
            return {
              ...it,
              order_number: o.order_number,
              model: modelObj,
              services: srvs
            };
          });

        const cust = (customersData || []).find(c => c.id === o.customer_id);

        return {
          ...o,
          customer: cust,
          items
        };
      });

      // Update store
      const current = this.getStoreData();
      if (companiesData && companiesData.length > 0) current.companies = companiesData;
      if (profilesData && profilesData.length > 0) current.profiles = profilesData;
      if (plansData && plansData.length > 0) current.plans = plansData;
      if (subsData && subsData.length > 0) current.subscriptions = subsData;
      if (settingsData && settingsData.length > 0) current.settings = settingsData[0];
      if (permGroupsData && permGroupsData.length > 0) current.permissionGroups = permGroupsData;
      current.customers = customersData || [];
      current.categories = categoriesData || [];
      current.brands = brandsData || [];
      current.models = modelsData || [];
      current.services = servicesData || [];
      if (workflowStatesData && workflowStatesData.length > 0) current.workflowStates = workflowStatesData;
      current.serviceOrders = assembledOrders || [];
      current.payments = paymentsData || [];
      current.auditLogs = auditLogsData || [];

      this.saveStoreData(current, true);
      return current;
    } catch (err) {
      console.error('Error during syncFromSupabase:', err);
    }
  }

  static logLogout(user: Profile) {
    const data = this.getStoreData();
    const idx = (data.profiles || []).findIndex((p: Profile) => p.id === user.id);
    if (idx !== -1) {
      data.profiles[idx].active_session_token = undefined;
      data.profiles[idx].active_session_device = undefined;
      data.profiles[idx].active_session_ip = undefined;
      data.profiles[idx].active_session_at = undefined;
      this.saveStoreData(data);
    }

    supabase.from('profiles').update({
      active_session_token: null,
      active_session_device: null,
      active_session_ip: null,
      active_session_at: null
    }).eq('id', user.id).then();

    this.logAudit({
      tenant_id: user.tenant_id,
      user_name: user.full_name,
      action: 'LOGOUT',
      resource: 'profiles',
      resource_id: user.id,
      details: `Logout de sessão: ${user.full_name}`
    });
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
    if (typeof window === 'undefined') return;
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }

    try {
      this.realtimeChannel = supabase
        .channel(`realtime:${tenantId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders', filter: `tenant_id=eq.${tenantId}` }, () => {
          this.syncFromSupabase(tenantId);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_order_items', filter: `tenant_id=eq.${tenantId}` }, () => {
          this.syncFromSupabase(tenantId);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customers', filter: `tenant_id=eq.${tenantId}` }, () => {
          this.syncFromSupabase(tenantId);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'company_settings', filter: `tenant_id=eq.${tenantId}` }, () => {
          this.syncFromSupabase(tenantId);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload: any) => {
          if (payload.new && payload.new.id) {
            const data = this.getStoreData();
            const idx = (data.profiles || []).findIndex((p: Profile) => p.id === payload.new.id);
            if (idx !== -1) {
              data.profiles[idx] = { ...data.profiles[idx], ...payload.new };
              this.saveStoreData(data, true);
            }
          }
          this.syncFromSupabase(tenantId);
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription not supported in current environment:', e);
    }
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
