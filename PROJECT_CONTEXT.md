# PROJECT CONTEXT - Supreme Recargas 2

## 1. Visão Geral
Aplicação web SaaS comercial e multiempresa para controle profissional de recepção, verificação, recarga, testes, diagnóstico técnico e entrega de cartuchos de impressora.

## 2. Tecnologias & Stack
- **Frontend**: Next.js 14+ (App Router), React, TypeScript (Strict Mode)
- **Styling & UI**: Tailwind CSS, shadcn/ui, Lucide Icons, Framer Motion
- **Backend**: Next.js Server Actions & API Routes
- **Banco de Dados**: PostgreSQL via Supabase (com Row-Level Security - RLS)
- **Autenticação**: Supabase Auth (JWT + RBAC)
- **Formulários & Validação**: React Hook Form + Zod
- **Impressão**: CSS `@media print` + ESC/POS Raw Generator (58mm / 80mm)
- **Testes**: Vitest, React Testing Library, Playwright (Multi-tenant security)

## 3. Regras de Negócio Chave
1. **Entrada vs. Cartuchos**: 1 Atendimento/Entrada (`cartridge_entries`) engloba 1 ou N Cartuchos (`cartridges`).
   - Número da Entrada: `2026-000001`
   - Número do Cartucho Individual: `2026-000001-01`, `2026-000001-02`
2. **Workflow de Status**:
   - `RECEBIDO` -> `AGUARDANDO_VERIFICACAO` -> `EM_VERIFICACAO` -> `AGUARDANDO_RECARGA` -> `EM_RECARGA` -> `AGUARDANDO_TESTE` -> `EM_TESTE` -> `FINALIZADO` -> `ENTREGUE`.
   - Exceções: `COM_PROBLEMA`, `SEM_REPARO`, `CANCELADO`.
3. **Classificações Técnicas do Resultado**:
   - `OK`, `CID`, `QUEIMADO`, `FALHA_IMPRESSAO`, `ENTUPIDO`, `SEM_REPARO`, `OUTRO`.
4. **Isolamento Multi-tenant**:
   - Todas as tabelas operacionais possuem a coluna `tenant_id`.
   - RLS ativo no PostgreSQL garantindo isolamento total por empresa.
5. **Sistema de Preços & Financeiro**:
   - Preço padrão por serviço (`service_prices`).
   - Sobregravação opcional por modelo de cartucho (`cartridge_model_prices`).
   - Registro snapshot imutável do valor no próprio cartucho (`applied_price`, `discount_amount`, `final_price`).
   - Relatórios financeiros detalhados por período, cliente, modelo, atendente e técnico.

## 4. Tipos de Usuários & Roles
- **SUPER_ADMIN**: Gestor da plataforma SaaS (empresas, planos, limites, bloqueios).
- **ADMINISTRADOR**: Gestor da empresa cliente (usuários, preços, relatórios, auditoria, configurações).
- **ATENDENTE**: Operação de balcão (clientes, novas entradas, comandas, entregas).
- **TECNICO**: Operação de bancada (pesagem entrada/saída, diagnósticos, testes, alteração de status técnico).

## 5. Auditoria & LGPD
- Registro de log para todas as ações sensíveis (`audit_logs`).
- Exclusão lógica (`soft_delete`) para clientes, cartuchos e usuários (`deleted_at`, `deleted_by`).

## 6. Estado Atual da Implementação
- **Fase 1**: Documentação técnica, arquitetura, plano de implementação e mapa de tarefas criados.
