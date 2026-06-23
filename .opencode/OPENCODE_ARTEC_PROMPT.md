# Prompt adaptado para OpenCode — Artec Gestão Financeira e Operacional

Este arquivo adapta a especificação do sistema da **Artec Ambientes Climatizados** para uso no **OpenCode**, com foco em execução por agente de código no terminal.

A ideia é usar este material de três formas:

1. Colar o **Prompt principal** em uma sessão do OpenCode.
2. Criar um `AGENTS.md` na raiz do projeto com as regras permanentes.
3. Executar o projeto em etapas pequenas, sempre validando com Bun, TypeScript, lint e testes.

---

## 1. Como usar no OpenCode

### Opção recomendada

Na raiz do repositório:

```bash
opencode
```

Dentro do OpenCode, rode:

```txt
/init
```

Depois, substitua ou complemente o `AGENTS.md` gerado com a seção **AGENTS.md recomendado** deste arquivo.

Em seguida, cole o **Prompt principal para OpenCode** na conversa.

### Opção direta pelo terminal

```bash
opencode run "$(cat OPENCODE_ARTEC_PROMPT.md)"
```

Use essa opção apenas se o projeto já estiver preparado e versionado com Git.

---

## 2. Prompt principal para OpenCode

```txt
Você está trabalhando no projeto Artec Gestão Financeira e Operacional, sistema web para controle financeiro, gestão operacional e visão gerencial da empresa Artec Ambientes Climatizados.

Objetivo:
Criar ou refatorar o projeto para ficar robusto, moderno, seguro, escalável e pronto para deploy na Netlify com Supabase.

Antes de alterar arquivos:
1. Leia README.md, package.json, tsconfig.json, vite.config.ts, netlify.toml, prisma/schema.prisma, src/ e qualquer AGENTS.md existente.
2. Verifique a stack atual do projeto.
3. Faça um plano curto de implementação dividido em etapas.
4. Não faça mudanças grandes sem antes organizar a sequência.

Stack obrigatória, sem substituições:

Frontend:
- React 19
- Vite
- TypeScript 5.8+ em modo estrito
- Tailwind CSS v4
- React Router v7 com file-based routing
- React Hook Form + Zod para validação de formulários
- TanStack Query v5 / React Query para data fetching, cache e mutations
- shadcn/ui com Radix Primitives como base de componentes
- Lucide React para ícones
- Recharts para gráficos
- Sonner para notificações toast
- date-fns com locale pt-BR para datas
- Zustand apenas para UI, sessão local não sensível e preferências locais

Backend e banco:
- Supabase PostgreSQL, Auth, Storage e Realtime
- Prisma ORM v7 com @prisma/adapter-pg, usado somente no servidor
- Nunca importar Prisma em código client/browser
- Nunca expor DATABASE_URL, DIRECT_URL ou SUPABASE_SERVICE_ROLE_KEY no frontend

Qualidade:
- ESLint + Prettier
- Husky + lint-staged
- Vitest + Testing Library
- Playwright para E2E dos fluxos críticos

Deploy:
- Netlify para frontend e SSR via Netlify Functions
- Supabase para banco, Auth e Storage

Gerenciador de pacotes:
- Bun

Regras obrigatórias de arquitetura:
1. Não usar TanStack Start.
2. Não usar TanStack Router.
3. Usar React Router v7 com file-based routing.
4. Usar Supabase Auth; não criar login fixo via localStorage.
5. Usar Supabase Storage para anexos e comprovantes.
6. Usar Supabase Realtime com moderação para dashboards, status de serviços e notificações internas.
7. Usar Prisma somente no servidor, em camada server-only.
8. Usar TanStack Query para todos os dados persistidos vindos do banco.
9. Usar Zustand somente para UI e preferências locais.
10. Validar formulários e payloads de servidor com Zod.
11. Não usar estratégia replace-all para dados financeiros; implementar CRUD real.
12. Verificar permissões no servidor, não apenas no frontend.
13. Interface 100% em português do Brasil.
14. Datas em dd/MM/yyyy e moeda em Real brasileiro.
15. Preservar dados existentes sempre que possível.

Módulos obrigatórios:
- Login com Supabase Auth
- Layout autenticado com sidebar responsiva
- Dashboard financeiro
- Lançamentos financeiros
- Contas a pagar
- Contas a receber
- DRE mensal
- Fluxo de caixa
- Categorias
- Centros de custo
- Serviços
- Cadastro de serviços
- Técnicos
- Colaboradores
- Metas
- Rentabilidade
- Produtividade
- Relatórios financeiros
- Relatórios operacionais
- Relatórios por centro de custo
- Usuários
- Permissões
- Configurações
- Admin

Perfis de acesso:
- Administrador: acesso total
- Proprietário: dashboards executivos, DRE, fluxo de caixa, rentabilidade, metas e relatórios estratégicos
- Financeiro: lançamentos, contas, categorias, centros de custo, DRE, fluxo e relatórios financeiros
- Operacional: serviços, técnicos, colaboradores, produtividade e relatórios operacionais
- Técnico: próprios serviços, status, anexos e observações técnicas

Banco de dados sugerido:
- profiles
- roles
- permissions
- categories
- cost_centers
- financial_entries
- accounts_payable
- accounts_receivable
- service_catalog
- service_orders
- technicians
- collaborators
- goals
- attachments
- audit_logs

Regras de banco:
- Usar UUID como chave primária.
- Usar created_at, updated_at e, quando fizer sentido, deleted_at.
- Preferir soft delete para cadastros sensíveis.
- Ativar RLS nas tabelas sensíveis do Supabase.
- Criar índices para datas, status, tipo, categoria, centro de custo e usuário.
- Guardar arquivos no Supabase Storage e metadados na tabela attachments.

Estrutura desejada:
- src/routes para rotas file-based
- src/components/ui para shadcn/ui
- src/components/layout para layout, sidebar e header
- src/components/financeiro para componentes financeiros
- src/components/operacional para componentes operacionais
- src/components/charts para gráficos
- src/components/forms para formulários reutilizáveis
- src/domain para schemas, tipos, cálculos, query keys e regras de domínio
- src/lib/supabase para clients Supabase
- src/lib/prisma para Prisma server-only
- src/server para actions, repositories, services e permissões
- src/stores para Zustand de UI
- src/tests para testes unitários/componentes
- e2e para Playwright

UX/UI:
- Visual limpo, profissional e responsivo.
- Sidebar em desktop e menu mobile.
- Cards de KPI no dashboard.
- Tabelas com filtros, busca e estados vazios.
- Badges para status.
- Dialogs ou sheets para criação/edição rápida.
- Toasts com Sonner para sucesso e erro.
- Gráficos com Recharts.
- Componentes base com shadcn/ui.
- Ícones com Lucide React.
- Textos simples e claros, em português do Brasil.

Fluxo de implementação:

Etapa 1 — Diagnóstico
- Inspecione o projeto atual.
- Liste conflitos com a stack obrigatória.
- Identifique dependências faltando, bibliotecas proibidas e pontos inseguros.
- Não altere código ainda se estiver em modo planejamento.

Etapa 2 — Base técnica
- Ajuste package.json para Bun e scripts esperados.
- Configure TypeScript estrito.
- Configure ESLint, Prettier, Tailwind v4, shadcn/ui e Sonner.
- Configure React Router v7 file-based routing.
- Configure providers globais: QueryClientProvider, Supabase Auth Provider, Toaster e tema.

Etapa 3 — Auth e layout
- Implementar Supabase Auth com email e senha.
- Criar login, logout, proteção de rotas e sessão.
- Criar layout privado com sidebar, header e navegação.
- Remover qualquer login fixo em localStorage.

Etapa 4 — Banco e servidor
- Criar ou ajustar schema Prisma v7 com @prisma/adapter-pg.
- Garantir que Prisma fique apenas no servidor.
- Criar repositories, services e actions/server handlers seguros.
- Validar payloads com Zod também no servidor.
- Preparar RLS no Supabase.

Etapa 5 — Financeiro
- Criar CRUD de lançamentos financeiros.
- Criar categorias e centros de custo.
- Criar contas a pagar e contas a receber.
- Criar DRE mensal, fluxo de caixa e dashboard financeiro.
- Usar TanStack Query para queries/mutations e invalidar cache corretamente.

Etapa 6 — Operacional
- Criar serviços, cadastro de serviços, técnicos e colaboradores.
- Relacionar serviços com técnico, centro de custo, valor cobrado, custo estimado e status.
- Criar produtividade e rentabilidade.

Etapa 7 — Relatórios, permissões e admin
- Criar relatórios com filtros e exportação CSV.
- Criar usuários, roles e permissões.
- Verificar permissões no servidor.
- Criar admin com health check, status do banco e logs de auditoria.

Etapa 8 — Testes e validação
- Criar testes Vitest/Testing Library para cálculos, schemas, componentes principais e filtros.
- Criar Playwright para login, criar lançamento, editar lançamento, DRE, criar serviço, baixa de conta e bloqueio por permissão.
- Rodar validações.

Comandos obrigatórios de validação:
- bun install
- bun run typecheck
- bun run lint
- bun run test
- bun run build
- bun run e2e, quando o ambiente estiver pronto

Scripts esperados no package.json:
- dev: vite dev
- build: vite build
- preview: vite preview
- typecheck: tsc --noEmit
- lint: eslint .
- format: prettier --write .
- test: vitest run
- test:watch: vitest
- test:coverage: vitest run --coverage
- e2e: playwright test
- prepare: husky
- db:generate: prisma generate
- db:migrate: prisma migrate dev
- db:deploy: prisma migrate deploy
- db:studio: prisma studio

Critérios de aceite:
- O projeto roda com bun install e bun run dev.
- O build passa com bun run build.
- TypeScript estrito passa sem erros.
- Lint passa sem erros críticos.
- Supabase Auth está funcionando.
- Prisma não aparece em arquivos client/browser.
- CRUD financeiro não usa replace-all.
- Dashboard, DRE e fluxo de caixa refletem dados reais.
- Permissões são verificadas no servidor.
- Anexos usam Supabase Storage.
- Testes principais passam.
- Deploy na Netlify está preparado.

Ao finalizar cada etapa:
1. Resuma arquivos alterados.
2. Informe comandos executados e resultado.
3. Liste pendências reais, sem inventar sucesso.
4. Sugira o próximo passo menor e seguro.
```

---

## 3. AGENTS.md recomendado

Crie um arquivo `AGENTS.md` na raiz do projeto com o conteúdo abaixo.

```md
# AGENTS.md — Artec Gestão Financeira e Operacional

## Contexto do projeto

Sistema web da Artec Ambientes Climatizados para controle financeiro, gestão operacional, relatórios e dashboards executivos.

O sistema deve centralizar lançamentos financeiros, DRE, fluxo de caixa, contas a pagar e receber, serviços, técnicos, colaboradores, centros de custo, metas, permissões, relatórios, anexos e administração.

## Stack obrigatória

Não substitua nenhuma tecnologia sem instrução explícita do usuário.

Frontend:
- React 19
- Vite
- TypeScript 5.8+ estrito
- Tailwind CSS v4
- React Router v7 file-based routing
- React Hook Form + Zod
- TanStack Query v5
- shadcn/ui com Radix Primitives
- Lucide React
- Recharts
- Sonner
- date-fns com locale pt-BR
- Zustand somente para UI/preferências locais

Backend/banco:
- Supabase PostgreSQL, Auth, Storage e Realtime
- Prisma ORM v7 + @prisma/adapter-pg somente no servidor

Qualidade:
- ESLint + Prettier
- Husky + lint-staged
- Vitest + Testing Library
- Playwright

Deploy:
- Netlify com SSR via Netlify Functions
- Supabase para banco, auth e storage

Pacotes:
- Use Bun.

## Proibições importantes

- Não usar TanStack Start.
- Não usar TanStack Router.
- Não criar login fixo em localStorage.
- Não importar Prisma em componentes, hooks client-side ou arquivos executados no browser.
- Não expor DATABASE_URL, DIRECT_URL ou SUPABASE_SERVICE_ROLE_KEY no frontend.
- Não usar Zustand para dados persistidos do banco.
- Não usar replace-all em dados financeiros.
- Não remover validação Zod.
- Não ignorar erros de TypeScript para fazer build passar.

## Regras de arquitetura

- Dados persistidos devem passar por TanStack Query.
- Zustand é permitido apenas para sidebar, tema, preferências locais, filtros temporários e modais globais.
- Toda entrada do usuário deve ser validada com Zod no formulário e no servidor.
- Permissões devem ser verificadas no servidor.
- Frontend pode esconder botões por UX, mas não é a camada de segurança real.
- Supabase Auth é a fonte da sessão.
- Supabase Storage guarda anexos e comprovantes.
- Supabase Realtime deve ser usado com moderação.
- Prisma deve ficar em camada server-only.

## Idioma e formatação

- Interface em português do Brasil.
- Datas em dd/MM/yyyy.
- Moeda em Real brasileiro.
- Use date-fns com locale pt-BR.
- Textos claros, profissionais e simples.

## Estrutura preferida

- `src/routes/` — rotas file-based
- `src/components/ui/` — componentes shadcn/ui
- `src/components/layout/` — sidebar, header, layout privado/público
- `src/components/financeiro/` — componentes financeiros
- `src/components/operacional/` — componentes operacionais
- `src/components/charts/` — gráficos Recharts
- `src/components/forms/` — formulários reutilizáveis
- `src/domain/` — schemas, tipos, query keys, cálculos e regras de domínio
- `src/lib/supabase/` — clientes Supabase
- `src/lib/prisma/` — Prisma server-only
- `src/server/` — actions, services, repositories e permissões
- `src/stores/` — Zustand para UI/preferências
- `src/tests/` — testes unitários/componentes
- `e2e/` — Playwright

## Módulos obrigatórios

- Dashboard financeiro
- Lançamentos financeiros
- Contas a pagar
- Contas a receber
- DRE mensal
- Fluxo de caixa
- Categorias
- Centros de custo
- Serviços
- Cadastro de serviços
- Técnicos
- Colaboradores
- Metas
- Rentabilidade
- Produtividade
- Relatórios financeiros
- Relatórios operacionais
- Relatórios por centro de custo
- Usuários
- Permissões
- Configurações
- Admin

## Banco sugerido

Tabelas principais:
- profiles
- roles
- permissions
- categories
- cost_centers
- financial_entries
- accounts_payable
- accounts_receivable
- service_catalog
- service_orders
- technicians
- collaborators
- goals
- attachments
- audit_logs

Regras:
- UUID como chave primária.
- `created_at`, `updated_at` e, quando fizer sentido, `deleted_at`.
- Soft delete em cadastros sensíveis.
- Índices para data, status, tipo, categoria, centro de custo e usuário.
- RLS em tabelas sensíveis.
- Arquivos no Supabase Storage e metadados em `attachments`.

## Comandos

Use Bun para tudo:

```bash
bun install
bun run dev
bun run typecheck
bun run lint
bun run test
bun run build
bun run e2e
bun run db:generate
bun run db:migrate
bun run db:deploy
```

## Antes de editar

- Leia arquivos existentes antes de criar novos padrões.
- Preserve a arquitetura existente quando ela não conflitar com estas regras.
- Faça mudanças pequenas e verificáveis.
- Não apague dados, migrations ou arquivos importantes sem necessidade clara.
- Se encontrar conflito de instruções, priorize este AGENTS.md e a stack obrigatória do usuário.

## Depois de editar

Sempre informe:
- Arquivos alterados.
- Comandos executados.
- Resultado dos comandos.
- O que ficou pendente.
- Próximo passo recomendado.
```

---

## 4. Comandos reutilizáveis para `.opencode/commands/`

Opcionalmente, crie estes arquivos para facilitar o trabalho no OpenCode.

### `.opencode/commands/diagnostico.md`

```md
---
description: Diagnosticar o projeto Artec antes de implementar
---

Analise o projeto atual sem alterar arquivos.

Verifique:
- package.json
- tsconfig.json
- vite.config.ts
- netlify.toml
- prisma/schema.prisma
- src/
- AGENTS.md

Liste:
1. Stack atual detectada.
2. Conflitos com a stack obrigatória.
3. Riscos de segurança.
4. Arquivos que precisam ser alterados.
5. Plano de implementação em etapas pequenas.
```

### `.opencode/commands/base.md`

```md
---
description: Implementar base técnica do Artec Gestão
---

Implemente a base técnica do projeto respeitando o AGENTS.md.

Inclua:
- React 19 + Vite
- TypeScript estrito
- Tailwind CSS v4
- React Router v7 file-based routing
- shadcn/ui
- Sonner
- TanStack Query Provider
- Supabase client
- Zustand apenas para UI
- Layout público e privado

Depois rode:
- bun run typecheck
- bun run lint
- bun run build

Informe arquivos alterados e resultados.
```

### `.opencode/commands/auth.md`

```md
---
description: Implementar Supabase Auth e permissões iniciais
---

Implemente autenticação com Supabase Auth.

Requisitos:
- Login com email e senha
- Logout
- Proteção de rotas privadas
- profiles, roles e permissions
- Remover login fixo em localStorage
- Não expor chaves server-only no browser
- Verificação inicial de permissão no servidor

Depois rode:
- bun run typecheck
- bun run lint
- bun run test
```

### `.opencode/commands/financeiro.md`

```md
---
description: Implementar módulos financeiros principais
---

Implemente ou ajuste os módulos financeiros:
- Dashboard financeiro
- Lançamentos
- Contas a pagar
- Contas a receber
- DRE
- Fluxo de caixa
- Categorias
- Centros de custo

Regras:
- CRUD real, sem replace-all
- React Hook Form + Zod
- TanStack Query para queries/mutations
- Recharts para gráficos
- Sonner para feedback
- Datas pt-BR
- BRL para moeda

Depois rode:
- bun run typecheck
- bun run lint
- bun run test
- bun run build
```

### `.opencode/commands/validar.md`

```md
---
description: Rodar validação completa do projeto
---

Rode a validação completa:

```bash
bun install
bun run typecheck
bun run lint
bun run test
bun run build
```

Se houver erros:
1. Corrija a menor causa possível.
2. Não esconda erro com `any`, `// @ts-ignore` ou remoção de teste.
3. Rode novamente o comando que falhou.
4. Resuma o resultado final.
```

---

## 5. Ordem recomendada de execução no OpenCode

1. Rodar `/init`.
2. Criar ou ajustar `AGENTS.md`.
3. Rodar `/diagnostico` se você criou o comando.
4. Implementar base técnica.
5. Implementar Auth.
6. Implementar banco e Prisma server-only.
7. Implementar módulos financeiros.
8. Implementar módulos operacionais.
9. Implementar relatórios, permissões e admin.
10. Rodar validação completa.
11. Preparar deploy Netlify/Supabase.

---

## 6. Prompt curto para continuar sessões futuras

Use este prompt quando voltar ao projeto em outra sessão:

```txt
Continue o projeto Artec Gestão Financeira e Operacional seguindo rigorosamente o AGENTS.md.

Primeiro leia o estado atual do repositório, verifique o último progresso e rode apenas os comandos necessários para entender a situação.

Não substitua a stack obrigatória.
Não use TanStack Start/TanStack Router.
Não importe Prisma no browser.
Não use localStorage como autenticação.
Não use replace-all em dados financeiros.

Depois proponha o próximo passo menor e implemente com validação via Bun, TypeScript, lint, testes e build quando aplicável.
```
