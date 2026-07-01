---
name: artec-ui-orchestration
description: Coordena refatoracoes visuais amplas no Artec Gestao seguindo AGENTS.md, UX_CRITERIA.md e o baseline aprovado do Dashboard.
---

# Artec UI Orchestration Skill

Use esta skill quando a tarefa envolver refatoracao visual ampla do Artec Gestao.

## Ordem obrigatoria

1. Ler `AGENTS.md`.
2. Ler `docs/ui-refactor/UX_CRITERIA.md`.
3. Ler `docs/ui-refactor/DESIGN_SYSTEM_SPEC.md` e `docs/ui-refactor/BUTTON_ALIGNMENT_SPEC.md`.
4. Auditar stack real com `rg "cva\\(" src`, `rg "lucide-react" src`, `rg "recharts" src` e tokens em `src/index.css`.
5. Auditar botoes, tabelas, mobile, dark mode, charts, toasts e forms.
6. Executar alteracoes incrementais somente em frontend, layout, CSS e componentes visuais.
7. Validar com typecheck, lint, test, build e e2e quando possivel.

## Prioridades

1. Proteger backend, banco, rotas, auth e regras financeiras.
2. Preservar o Dashboard atual como baseline aprovado de sidebar, cards, listas e acabamento.
3. Corrigir design system e alinhamento dos botoes antes de polir paginas.
4. Propagar o padrao para paginas financeiras, cadastros, relatorios, configuracoes e admin.
5. Validar dark/light mode, responsividade, acessibilidade, charts recharts e feedback sonner.

## Proibido

Nao alterar Prisma, Supabase, adapter-pg, auth, rotas, payloads, permissoes,
regras de calculo financeiro, package.json, lockfiles, variaveis de ambiente ou deploy.
