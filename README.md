# Artec Gestao

Sistema web administrativo para gestao financeira e operacional da Artec Ambientes Climatizados. A aplicacao combina dashboard, financeiro, operacional, cadastros, relatorios e administracao de usuarios com aprovacao de acesso.

## Tecnologias

- Bun
- React 19 + Vite
- TypeScript
- Tailwind CSS v4
- React Router v7
- TanStack Query
- Supabase Auth
- Prisma ORM + PostgreSQL
- Lucide React
- Recharts
- Sonner
- Vitest + Testing Library
- Playwright

## Funcionalidades

- Login com Supabase Auth.
- Solicitacao publica de acesso sem liberacao imediata.
- Aprovacao, rejeicao, desativacao e reativacao de usuarios por administradores.
- Layout administrativo com sidebar responsiva.
- Tema claro e escuro com preferencia persistida.
- Dashboard financeiro e operacional.
- Financeiro: lancamentos, contas a pagar, contas a receber, categorias, centros de custo, DRE e fluxo de caixa.
- Operacional: visao geral, servicos, cadastro de servicos, tecnicos, colaboradores, produtividade e rentabilidade.
- Cadastros: clientes e fornecedores.
- Relatorios financeiros, operacionais e por centro de custo.
- Configuracoes e area administrativa.

## Estrutura

```txt
src/
  components/
    forms/          # Formularios e dialogos reutilizaveis
    layout/         # AppShell, sidebar, topbar, navegacao e wrappers
    ui/             # Componentes base de UI
  domain/           # Schemas, hooks e tipos de dominio
  lib/              # Supabase, Prisma server-only e utilitarios
  routes/           # Rotas da aplicacao
  server/           # Servicos/repositorios server-side
  stores/           # Zustand para estado de UI
  tests/            # Testes unitarios/componentes
e2e/                # Playwright
prisma/             # Seed e migrations
public/             # Assets publicos, favicon
```

## Instalar

```bash
bun install
```

## Variaveis de Ambiente

Crie `.env` a partir de `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

PRIMARY_ADMIN_EMAIL=admin@artec.com
PRIMARY_ADMIN_PASSWORD=change-this-strong-password1
PRIMARY_ADMIN_NAME=Administrador Principal

E2E_TEST_EMAIL=e2e@artec.com
E2E_TEST_PASSWORD=artec26
```

Variaveis sem `VITE_` sao server-only. Nunca exponha `DATABASE_URL`, `DIRECT_URL` ou `SUPABASE_SERVICE_ROLE_KEY` no frontend.

## Desenvolvimento

```bash
bun run dev
```

O Vite roda em `http://localhost:3000`.

## Banco de Dados

Gerar Prisma Client:

```bash
bun run db:generate
```

Aplicar migrations em desenvolvimento:

```bash
bun run db:migrate
```

Aplicar migrations em ambiente publicado:

```bash
bun run db:deploy
```

Rodar seed:

```bash
bun run db:seed
```

O seed cria roles, categorias, centros de custo e, se `PRIMARY_ADMIN_EMAIL` e `PRIMARY_ADMIN_PASSWORD` estiverem definidos, cria/atualiza o primeiro `primary_admin` via Supabase Auth.

## Administrador Principal

O primeiro administrador principal nao e criado pelo cadastro publico. Configure:

```env
PRIMARY_ADMIN_EMAIL=admin@artec.com
PRIMARY_ADMIN_PASSWORD=uma-senha-forte1
PRIMARY_ADMIN_NAME=Administrador Principal
```

Depois rode:

```bash
bun run db:seed
```

Esse usuario fica com `role=primary_admin` e `status=approved`.

## Acesso de Usuarios

Na tela de login existe a opcao `Solicitar acesso`.

Fluxo:

1. O usuario preenche nome, email, telefone, senha, confirmacao e observacao.
2. O sistema cria a conta no Supabase Auth e um profile com `status=pending`.
3. O login fica bloqueado enquanto o status nao for aprovado.
4. Um `primary_admin` ou `admin` acessa `/app/admin`.
5. O administrador aprova, rejeita, desativa ou reativa usuarios.
6. Apenas usuarios `approved` conseguem acessar o sistema.

Status:

- `pending`: solicitacao enviada, aguardando aprovacao.
- `approved`: usuario liberado para acessar.
- `rejected`: solicitacao rejeitada, login bloqueado.
- `disabled`: usuario desativado, login bloqueado.

Roles:

- `primary_admin`: administrador principal, pode aprovar acessos e promover outro usuario a administrador principal.
- `admin`: administrador autorizado a gerenciar usuarios.
- `user`: perfil padrao.

Roles legadas como `financeiro`, `operacional`, `tecnico` e `proprietario` continuam disponiveis para compatibilidade.

## Tema Claro e Escuro

A interface possui modo claro e escuro com preferencia persistida em `localStorage`. O botao de alternancia fica na tela de login e na topbar do sistema.

## Scripts

```bash
bun run typecheck
bun run lint
bun run test
bun run test:coverage
bun run build
bun run e2e
bun run db:generate
bun run db:migrate
bun run db:deploy
bun run db:seed
bun run db:studio
```

## Testes

Unitarios/componentes:

```bash
bun run test
```

Cobertura:

```bash
bun run test:coverage
```

Build:

```bash
bun run build
```

E2E:

```bash
bun run e2e
```

Para E2E, configure `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`, `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `DATABASE_URL`.

## Seguranca

- Senhas sao armazenadas pelo Supabase Auth, nunca em texto puro no banco Prisma.
- Cadastro publico cria usuarios como `pending`, sem acesso imediato.
- Login valida sessao e status aprovado antes de liberar o app.
- APIs administrativas exigem bearer token valido e role `primary_admin` ou `admin`.
- APIs financeiras exigem sessao valida e profile `approved`.
- Erros internos de API nao retornam stack trace para o frontend.
- Emails duplicados sao bloqueados antes da criacao.
- Senhas novas exigem minimo de 8 caracteres com letras e numeros.
- Entradas textuais sao normalizadas e limitadas antes de persistir.
- Hash de senha nao e retornado por nenhuma resposta da API.
- `SUPABASE_SERVICE_ROLE_KEY` permanece restrita ao backend.

## Problemas Comuns

- `Sessao nao informada`: o token Supabase nao foi enviado ou a sessao expirou.
- `Acesso bloqueado`: o usuario esta `pending`, `rejected`, `disabled` ou sem profile valido.
- `Acesso restrito a administradores`: o usuario nao possui role `primary_admin` ou `admin`.
- Seed nao cria admin: confira `PRIMARY_ADMIN_EMAIL`, `PRIMARY_ADMIN_PASSWORD`, `VITE_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
- Prisma nao conecta: confira `DATABASE_URL` para runtime e `DIRECT_URL` para migrations.
