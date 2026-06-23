# Artec Gestão Financeira e Operacional

Sistema web para gestão financeira e operacional da Artec Climatizados, com foco em controle de lançamentos, contas, relatórios, serviços, técnicos, colaboradores, cadastros e administração.

## Stack

- Bun
- React 19
- Vite
- TypeScript strict
- Tailwind CSS v4
- React Router v7
- TanStack Query v5
- React Hook Form + Zod
- Supabase Auth/Storage/Realtime
- Prisma ORM v7
- shadcn/ui/Radix-style primitives
- Lucide React
- Recharts
- Sonner
- Vitest + Testing Library
- Playwright

## Funcionalidades atuais

- Login com Supabase Auth
- Layout administrativo com sidebar responsiva
- Dashboard financeiro/operacional
- Financeiro:
  - Lançamentos
  - Contas a pagar
  - Contas a receber
  - Categorias
  - Centros de custo
  - DRE
  - Fluxo de caixa
- Operacional:
  - Visão geral
  - Serviços
  - Cadastro de serviços
  - Técnicos
  - Colaboradores
  - Produtividade
  - Rentabilidade
- Cadastros:
  - Clientes
  - Fornecedores
- Relatórios:
  - Financeiros
  - Operacionais
  - Por centro de custo
- Configurações
- Admin

## Estrutura

```txt
src/
  components/
    forms/          # Formulários e diálogos reutilizáveis
    layout/         # AppShell, sidebar, topbar, navegação e wrappers
    ui/             # Componentes base de UI
  domain/           # Schemas, hooks e tipos de domínio
  lib/              # Supabase, Prisma server-only e utilitários
  routes/           # Rotas da aplicação
  server/           # Serviços/repositórios server-side
  stores/           # Zustand para estado de UI
  tests/            # Testes unitários/componentes
e2e/                # Playwright
prisma/             # Seed e migrações
public/             # Assets públicos, favicon
```

## Requisitos

- Bun instalado
- Projeto Supabase configurado
- Variáveis de ambiente preenchidas

## Variáveis de ambiente

Crie um arquivo `.env` com base em `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

E2E_TEST_EMAIL=gmls.dev@gmail.com
E2E_TEST_PASSWORD=Gm99463683!
```

Importante: variáveis sem prefixo `VITE_` são server-only e não devem ser usadas no frontend.

## Instalação

```bash
bun install
```

## Desenvolvimento

```bash
bun run dev
```

A aplicação roda via Vite.

## Scripts

```bash
bun run typecheck     # TypeScript sem emissão
bun run lint          # ESLint
bun run test          # Vitest
bun run build         # Build de produção
bun run e2e           # Playwright
bun run db:generate   # Prisma generate
bun run db:migrate    # Prisma migrate dev
bun run db:deploy     # Prisma migrate deploy
```

Ordem recomendada de validação:

```bash
bun run typecheck
bun run lint
bun run test
bun run build
```

## Banco e seed

O seed atual cria dados auxiliares como roles, categorias e centros de custo:

```bash
bun prisma db seed
```

Usuários da aplicação são gerenciados pelo Supabase Auth. Para E2E, o Playwright executa um seed idempotente que cria/atualiza o usuário `E2E_TEST_EMAIL`, confirma o email, garante categorias mínimas e remove lançamentos antigos marcados como `[E2E]`.

Esse seed automático exige `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `DATABASE_URL` configurados no ambiente de teste. Sem a service role, crie o usuário manualmente no Supabase Auth com as credenciais E2E e confirme o email antes de rodar os testes.

## Autenticação

O login usa Supabase Auth. Não há credenciais padrão no código. Usuários devem ser criados no painel do Supabase ou por fluxo administrativo futuro.

## Testes

Os testes atuais cobrem ações principais de frontend, incluindo abertura de modais e navegação de relatórios.

```bash
bun run test
```

Para E2E, configure as credenciais de teste. Os valores padrão do projeto são:

Depois execute:

```bash
bun run e2e
```

O comando sobe o Vite automaticamente em `http://127.0.0.1:3000`, autentica via Supabase, navega pelo sistema, cria/edita/exclui lançamento financeiro, valida dashboard e realiza logout.

## Segurança

- Não exponha `DATABASE_URL`, `DIRECT_URL` ou `SUPABASE_SERVICE_ROLE_KEY` no frontend.
- Não importe Prisma em componentes client/browser.
- Não use localStorage para login.
- Permissões devem ser aplicadas no servidor.
- Dados persistidos devem ser buscados via TanStack Query, não Zustand.

## Observações

O frontend atual possui telas modernas e funcionais para navegação e fluxos iniciais. Algumas ações usam estado local/mock quando ainda não há integração completa com backend, mantendo a interface pronta para futura conexão com os serviços reais.
#
