# Agilis OS

> **Sistema Operacional de Balcão e Bancada Técnica**  
> Plataforma SaaS Multi-Tenant para recepção ágil (<60s), bancada de precisão, diagnóstico técnico, kanban em tempo real e rastreabilidade com QR Code.

---

## ⚡ Principais Recursos

- **Atendimento Ágil de Balcão:** Recepção 1 para N com emissão de comandas térmicas (ESC/POS 58mm/80mm) e etiquetas adesivas QR Code em menos de 60 segundos.
- **Bancada Técnica & Laboratório:** Pesagem em gramas (entrada vs. saída), testes elétricos/funcionais, laudos e kanban de status em tempo real.
- **Portal Público de Rastreamento:** Consulta pública instantânea para o cliente final via QR Code sem necessidade de login, em conformidade com a LGPD.
- **Gestão B2B Multi-Tenant:** Isolamento rigoroso por empresa (RLS no PostgreSQL), controle de permissões por perfil (RBAC), auditoria e precificação customizada.
- **Modo Offline & Resiliência:** Fila outbox local para continuidade operacional em caso de oscilações de rede.

---

## 🚀 Tecnologias

- **Framework:** [Next.js 14+ / App Router](https://nextjs.org) (React 19, TypeScript Strict Mode)
- **Estilização & UI:** Tailwind CSS, shadcn/ui tokens, Lucide Icons, Framer Motion
- **Banco de Dados & Autenticação:** PostgreSQL + Supabase (RLS, Auth JWT, Realtime)
- **Testes Automatizados:** Vitest & React Testing Library

---

## 🛠️ Começando

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

4. Para rodar a suíte de testes:
   ```bash
   npm test
   ```
