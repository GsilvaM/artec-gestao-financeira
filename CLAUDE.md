# CLAUDE.md - Artec Gestao

Voce esta trabalhando no Artec Gestao, um SaaS financeiro/administrativo.

Use sempre os subagentes de `.claude/agents/` quando a tarefa for grande, visual ou envolver muitas paginas.

## Regra de ouro

Nao altere backend, banco, Prisma, Supabase, autenticacao, rotas, permissoes, calculos financeiros ou regras de negocio.

A refatoracao autorizada e visual/frontend.

## Problema prioritario atual

A maioria dos botoes do sistema esta com texto ou icone desalinhado, incluindo o botao de login.

Qualquer refatoracao visual deve priorizar:

1. Button global.
2. IconButton.
3. Login button.
4. Botoes principais de pagina.
5. Filtros.
6. Acoes "...".
7. Botoes em tabelas/cards.
8. Theme toggle.
9. User menu.

Use o agente `button-alignment-guardian` sempre que qualquer botao for alterado.

## Subagentes disponiveis

- `ui-refactor-orchestrator`: coordena a refatoracao visual total.
- `design-system-architect`: tokens, CSS global e componentes base.
- `button-alignment-guardian`: audita e corrige alinhamento de todos os botoes.
- `app-shell-sidebar-logo-agent`: app shell, sidebar, topbar, drawer e logo.
- `login-theme-agent`: login, dark mode, light mode e botao de login.
- `financial-pages-agent`: paginas financeiras.
- `data-table-mobile-agent`: tabelas, cards mobile e empty states.
- `responsive-accessibility-agent`: responsividade e acessibilidade.
- `tests-build-guardian`: typecheck, lint, test, build e protecao contra alteracoes proibidas.
- `visual-polish-reviewer`: revisao visual final.

## Fluxo recomendado

1. Chamar `ui-refactor-orchestrator`.
2. Chamar `design-system-architect`.
3. Chamar obrigatoriamente `button-alignment-guardian`.
4. Chamar `app-shell-sidebar-logo-agent`.
5. Chamar `login-theme-agent`.
6. Chamar `financial-pages-agent`.
7. Chamar `data-table-mobile-agent`.
8. Chamar `responsive-accessibility-agent`.
9. Chamar novamente `button-alignment-guardian`.
10. Chamar `visual-polish-reviewer`.
11. Chamar `tests-build-guardian`.

## Design principal

Seguir documentos em:

- `docs/ui-refactor/README.md`
- `docs/ui-refactor/DESIGN_SYSTEM_SPEC.md`
- `docs/ui-refactor/BUTTON_ALIGNMENT_SPEC.md`
- `docs/ui-refactor/UI_REFACTOR_PLAN.md`
- `docs/ui-refactor/ACCEPTANCE_CHECKLIST.md`
