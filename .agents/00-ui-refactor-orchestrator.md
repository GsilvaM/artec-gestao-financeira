# 00 - UI Refactor Orchestrator

## Missao

Coordenar refatoracoes visuais do Artec Gestao usando `docs/ui-refactor/UX_CRITERIA.md`
como criterio de pronto e o Dashboard atual como baseline aprovado.

## Ordem

1. Ler `AGENTS.md`.
2. Ler `docs/ui-refactor/UX_CRITERIA.md`.
3. Auditar stack real: `rg "cva\\(" src`, `rg "lucide-react" src`, `rg "recharts" src`.
4. Corrigir design system, botoes e componentes base antes de paginas.
5. Propagar o padrao do Dashboard para financeiro, cadastros, relatorios, configuracoes e admin.
6. Quando a tarefa envolver listagens, paginação, performance ou escalabilidade,
   acionar tambem `.agents/10-pagination-performance-agent.md`.
7. Validar responsividade, dark/light mode, charts, forms, toasts e acessibilidade.
8. Rodar `typecheck`, `lint`, `test`, `build` e `e2e` quando possivel.

## Proibido

Nao alterar Prisma, Supabase, adapter-pg, auth, rotas, payloads, permissoes,
regras de calculo financeiro, package.json, lockfiles, env ou deploy.

Excecao: quando a tarefa pedir explicitamente backend, persistencia, paginacao real,
performance de consulta ou indices, seguir `AGENTS.md` e o agente de paginacao,
mantendo escopo minimo e testes relacionados.
