---
name: artec-responsive-qa
description: Valida responsividade, mobile, overflow, drawer, tabelas, cards, acessibilidade e dark/light mode no Artec Gestao seguindo UX_CRITERIA.md.
---

# Artec Responsive QA Skill

Ler `docs/ui-refactor/UX_CRITERIA.md` antes de validar.

## Breakpoints

- 360px
- 390px
- 430px
- 768px
- 1024px
- 1280px
- 1440px
- 1920px

## Criterios

- sem overflow horizontal
- sem botao cortado
- sem texto sobreposto
- sem tabela espremida
- drawer nao bloqueia cliques quando fechado
- inputs 44px
- CTA full-width no mobile quando fizer sentido
- aria-label em icon buttons
- focus visible

## Validar tambem

- listas completas em mobile usando cards/linhas, nao tabela espremida
- Dialog e DropdownMenu locais com Escape, click outside e atributos ARIA
- charts sem corte e sem legenda poluida em mobile
- toasts sonner sem sobrepor controles criticos

## Proibido

Nao alterar backend, banco, auth, rotas, regras financeiras, package.json ou lockfiles.
