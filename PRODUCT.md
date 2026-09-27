# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Operadores de Balcão (Atendentes):** Precisam de agilidade extrema para receber de 1 a N cartuchos ou equipamentos, realizar busca instantânea de clientes por telefone/CPF/nome, imprimir comprovantes térmicos e emitir etiquetas QR Code em segundos.
- **Técnicos de Bancada:** Operam no laboratório e bancada de recarga/manutenção; realizam pesagem de precisão inicial/final, testes de condutividade elétrica, ultrassom, diagnóstico e classificação técnica com kanban visual em tempo real.
- **Gestores e Administradores de Loja:** Monitoram produtividade, comissões, faturamento, ticket médio, relatórios por modelo/cliente e gerenciam preços, serviços e equipe.
- **Super Administradores (SaaS Platform):** Gerenciam empresas parceiras (tenants), planos recorrentes, limites de usuários e módulos adicionais.
- **Clientes Finais:** Acompanham o status do seu pedido em tempo real pelo celular via QR Code ou link público sem necessidade de login.

## Product Purpose

Oferecer um sistema SaaS operacional de alto padrão e velocidade para recepção, diagnóstico técnico, pesagem de precisão, recarga de suprimentos, assistência técnica e entrega de cartuchos de impressora, toners e aparelhos. O sucesso é medido pela redução do tempo de atendimento no balcão para menos de 60 segundos, zero extravios e rastreabilidade total de cada item individual.

## Positioning

Diferente de sistemas genéricos de ordem de serviço, o Supreme Recargas possui arquitetura técnica orientada à bancada de precisão (pesagem em gramas, teste de circuito integrado, histórico por serial individual dentro do mesmo atendimento e geração nativa de comandas térmicas ESC/POS e etiquetas adesivas).

## Operating Context

Balcões de lojas de recarga rápida e oficinas de assistência técnica com impressoras térmicas (58mm/80mm), balança digital de precisão, leitores de código de barras e clientes aguardando na loja ou retirando no final do dia.

## Capabilities and Constraints

- Atendimento 1 para N: uma única entrada/comanda engloba múltiplos cartuchos e itens com identificação individual sequencial (`YYYY-XXXXXX-01`, `02`).
- Sincronização em tempo real (Supabase Realtime) e suporte a operação tolerante a oscilações de rede com armazenamento local resiliente.
- Sistema de controle de acesso baseado em funções e grupos (RBAC com perfis e permissões granulares).
- Segurança e privacidade conforme LGPD (ofuscação de PII no rastreamento público deslogado).

## Brand Commitments

- **Identidade Visual:** "Supreme Recargas" — paleta profunda slate (`#0b0f19` / `#0f172a`) com acento profissional Emerald (`#059669` / `#10b981`), tipografia nítida (Inter / Outfit) e leitura numérica tabular.
- **Tom de Voz:** Confiável, ágil, técnico e transparente.

## Product Principles

1. **Agilidade no Balcão Primeiro:** Cada clique a menos e cada campo a menos no fluxo de recepção salva minutos valiosos na frente do cliente.
2. **Evidência Técnica Rigorosa:** A pesagem (entrada vs saída) e o diagnóstico elétrico/teste real são as garantias contra reclamações e queima de cartuchos.
3. **Privacidade por Padrão:** Nenhum dado pessoal identificável de clientes é exposto publicamente no rastreio.
4. **Resiliência Multi-Tenant:** Isolamento rigoroso entre empresas parceiras da plataforma.
