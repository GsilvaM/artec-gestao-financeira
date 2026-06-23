# AGENTS.md — Artec Gestão Financeira e Operacional

**Greenfield project.** No package.json, no `src/`, no code — this is a spec and scaffold.  
Base instructions file: `OPENCODE_ARTEC_PROMPT.md` (full blueprint).  
Custom workflows exist at `.opencode/commands/` (`diagnostico`, `base`, `auth`, `financeiro`, `validar`).

## Stack (must-match — no substitutions)

- **Runtime:** Bun
- **Frontend:** React 19, Vite, TypeScript 5.8+ strict, Tailwind v4, React Router v7 file-based, React Hook Form + Zod, TanStack Query v5, shadcn/ui (Radix), Lucide, Recharts, Sonner, date-fns (pt-BR locale)
- **Zustand:** UI/preferences only (sidebar, theme, temp filters, global modals) — never for persisted data
- **Backend/db:** Supabase (PostgreSQL, Auth, Storage, Realtime), Prisma ORM v7 + `@prisma/adapter-pg` — **server-only**
- **Quality:** ESLint, Prettier, Vitest + Testing Library, Playwright, Husky + lint-staged
- **Deploy:** Netlify SSR (Functions), Supabase (db, auth, storage)

## Hard prohibitions (will reject PRs)

- No TanStack Start, no TanStack Router
- No localStorage-based login
- No Prisma imports in client/browser code
- No exposure of `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_SERVICE_ROLE_KEY` in frontend
- No Zustand for persisted DB data
- No `replace-all` strategy on financial records — real CRUD only
- No removal of Zod validation
- No `// @ts-ignore` or `any` to force builds green

## Architecture

| Rule | Detail |
|------|--------|
| Data fetching | TanStack Query for all persisted data |
| Validation | Zod on every form (client) **and** every server payload |
| Permissions | Enforced server-side; frontend hides UI only |
| Auth | Supabase Auth only |
| Files | Supabase Storage; metadata in `attachments` table |
| Realtime | Sparse — dashboards, service status, internal notifications only |
| Locale | pt-BR (`dd/MM/yyyy`, BRL currency, date-fns locale pt-BR) |

## Directory layout

```
src/
  routes/              # React Router v7 file-based
  components/ui/       # shadcn/ui primitives
  components/layout/   # sidebar, header, auth/layout wrapper
  components/{financeiro,operacional,charts,forms}/
  domain/              # Zod schemas, types, query keys, business logic
  lib/supabase/        # Supabase clients
  lib/prisma/          # Prisma (server-only — never imported in browser)
  server/              # actions, services, repositories, permissions
  stores/              # Zustand UI stores only
  tests/               # Vitest unit/component tests
e2e/                   # Playwright
```

## Commands (Bun)

```
bun install
bun run dev              # vite dev
bun run typecheck        # tsc --noEmit
bun run lint             # eslint .
bun run test             # vitest run
bun run build            # vite build
bun run e2e              # playwright test
bun run db:generate      # prisma generate
bun run db:migrate       # prisma migrate dev
bun run db:deploy        # prisma migrate deploy
```

Validation order: `typecheck → lint → test → build`

## DB conventions

- UUID PKs, `created_at`/`updated_at`/`deleted_at` on sensitive entities
- Soft delete on cadastros sensíveis
- Indexes on date, status, type, category, cost_center, user_id
- RLS on sensitive tables

## Required modules

Login → Dashboard financeiro → Lançamentos → Contas a pagar/receber → DRE → Fluxo de caixa → Categorias → Centros de custo → Serviços → Técnicos → Colaboradores → Metas → Rentabilidade → Produtividade → Relatórios (financeiros, operacionais, por centro de custo) → Usuários → Permissões → Configurações → Admin

## Access profiles

- **Admin:** full access
- **Proprietário:** executive dashboards, DRE, cash flow, profitability, goals, strategic reports
- **Financeiro:** entries, accounts, categories, cost centers, DRE, cash flow, financial reports
- **Operacional:** services, technicians, collaborators, productivity, operational reports
- **Técnico:** own services, status, attachments, technical notes
