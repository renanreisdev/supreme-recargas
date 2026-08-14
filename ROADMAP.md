# ROADMAP DE DESENVOLVIMENTO - Supreme Recargas 2

Este documento estabelece as 13 fases de execução para o desenvolvimento e homologação da plataforma **Supreme Recargas 2**.

---

## 📌 FASE 1: Planejamento, Arquitetura e Setup Inicial
- [x] Definição da stack tecnológica (Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase PostgreSQL, RLS)
- [x] Criação dos documentos fundamentais (`implementation_plan.md`, `PROJECT_CONTEXT.md`, `ROADMAP.md`, `TASKS.md`)
- [ ] Inicialização do projeto Next.js com TypeScript e Tailwind CSS
- [ ] Configuração do ESLint, Prettier, aliases de importação (`@/`)
- [ ] Instalação dos componentes base UI (`shadcn/ui`, Lucide Icons, Framer Motion)

---

## 📌 FASE 2: Banco de Dados e Autenticação Supabase
- [ ] Criação dos arquivos de migração DDL no Supabase (`supabase/migrations/`)
- [ ] Definição do Esquema de Tabelas (`companies`, `plans`, `subscriptions`, `profiles`, `customers`, `cartridge_entries`, `cartridges`, `service_prices`, etc.)
- [ ] Ativação de **Row Level Security (RLS)** em todas as tabelas operacionais
- [ ] Criação das Políticas de Segurança Multi-tenant e funções atômicas de banco (geração de numeração por empresa)
- [ ] Configuração do Supabase Auth e gerenciador de sessões/JWT

---

## 📌 FASE 3: Sistema Multiempresa e Gestão de Usuários (RBAC)
- [ ] Tela de cadastro de empresa (Tenant onboarding)
- [ ] Gestão de usuários por papel (`ADMINISTRADOR`, `ATENDENTE`, `TECNICO`)
- [ ] Verificação e aplicação estrita dos limites de usuários do plano contratado
- [ ] Configurações da empresa (logotipo, CNPJ, dados de contato, mensagem da comanda)

---

## 📌 FASE 4: Módulo de Cadastro de Clientes
- [ ] CRUD completo de clientes (Código interno, Nome, CPF/CNPJ, Telefone, WhatsApp, Endereço, Observações)
- [ ] Busca instantânea por telefone, CPF/CNPJ, nome ou código no balcão
- [ ] Cadastro rápido inline integrado ao fluxo de entrada

---

## 📌 FASE 5: Balcão de Entrada de Cartuchos e Precificação
- [ ] Cadastro do Catálogo de Fabricantes e Modelos de Cartuchos (HP, Canon, Epson, Brother) com pesos médios
- [ ] Cadastro da Tabela de Preços por Serviço e Sobregravação por Modelo
- [ ] Tela de Entrada Rápida de Balcão (suporte a múltiplos cartuchos por atendimento)
- [ ] Sugestão automática de preços, aplicação de descontos autorizados e cálculo automático de totais

---

## 📌 FASE 6: Bancada do Técnico (Kanban & Diagnósticos)
- [ ] Interface Kanban da Bancada Técnica (Aguardando Análise, Em Andamento, Aguardando Teste, Finalizado)
- [ ] Modal / Painel de atendimento técnico acelerado por teclado
- [ ] Registro de Pesagem (Entrada, Saída e cálculo automático de diferença)
- [ ] Registro de Diagnóstico Técnico e Classificação do Resultado (`OK`, `CID`, `QUEIMADO`, `FALHA_IMPRESSAO`, `ENTUPIDO`, `SEM_REPARO`, `OUTRO`)
- [ ] Atualização em tempo real do workflow de status

---

## 📌 FASE 7: Dashboard Principal e Indicadores Operacionais/Financeiros
- [ ] Cards de métricas diárias (Entradas hoje, Em andamento, Finalizados hoje, Com problema, Entregues hoje)
- [ ] Gráficos interativos (Entradas por dia, Recargas realizadas, Cartuchos por modelo, Cartuchos por técnico)
- [ ] Indicadores Financeiros para Administradores (Faturamento hoje, Faturamento mês, Ticket Médio por entrada/cartucho)
- [ ] Filtros por período (Hoje, 7 dias, 30 dias, Este mês, Personalizado)

---

## 📌 FASE 8: Módulo de Impressão Térmica (Comanda & Etiquetas)
- [ ] Layout de Comanda Térmica Otimizado (58mm e 80mm) com corte CSS `@media print`
- [ ] Layout de Etiqueta com QR Code de identificação serial do cartucho (`2026-XXXXXX-01`)
- [ ] Opção de exibir/ocultar valores financeiros na comanda
- [ ] Estrutura pronta para integração com assistente local de impressão ESC/POS (QZ Tray / Direct Print)

---

## 📌 FASE 9: Módulo Completo de Relatórios e Exportação
- [ ] Relatório de Entradas, Recargas e Entregas por Período
- [ ] Relatório por Modelo, Fabricante, Técnico e Atendente
- [ ] Relatório de Defeitos e Ocorrências CID / Queimados
- [ ] Relatório Financeiro de Faturamento e Descontos Concedidos
- [ ] Motor de Exportação de Relatórios para **PDF**, **Excel (XLSX)** e **CSV**

---

## 10: Auditoria, LGPD e Histórico Completo
- [ ] Timeline visual do histórico de vida de cada cartucho
- [ ] Visualizador de Log de Auditoria para administradores (`audit_logs`)
- [ ] Soft Delete em entidades críticas (`deleted_at`, `deleted_by`)

---

## 📌 FASE 11: Administração SaaS Platform (Super Admin)
- [ ] Painel do Super Admin da Plataforma
- [ ] Gestão de Empresas (Ativar, Pausar, Bloquear, Alterar Plano)
- [ ] Cadastro de Planos e Ajuste Dinâmico de Limites
- [ ] Métricas Globais da Plataforma SaaS

---

## 📌 FASE 12: Testes Automatizados, Segurança e Qualidade
- [ ] Testes Unitários com `vitest`
- [ ] Testes de Integração de Formulários e Validações Zod
- [ ] Testes E2E com `Playwright` focados no isolamento Multi-tenant (garantia RLS)

---

## 📌 FASE 13: Documentação Final e Deploy
- [ ] Geração de Documentações (`README.md`, `README-DEVELOPMENT.md`, `ARCHITECTURE.md`, `DATABASE.md`, `SECURITY.md`, `DEPLOYMENT.md`, `TESTING.md`)
- [ ] Scripts de Seed e Backup do Banco
- [ ] Deploy e Validação em ambiente Vercel + Supabase
