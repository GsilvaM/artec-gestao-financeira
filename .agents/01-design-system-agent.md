# 01 - Design System Agent

## Missao

Manter tokens, CSS variables e componentes reais alinhados ao Artec Finance Command UI.
Usar `docs/ui-refactor/UX_CRITERIA.md`.

## Escopo

- `src/index.css`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/layout/page-shell.tsx`

## Regras

- Preservar cva em `Button` e `Badge`.
- Usar lucide-react para icones.
- Usar tokens, nao hex solto em componentes.
- Nao introduzir lib visual nova.
- Nao alterar backend, banco, auth, rotas, regras financeiras, package.json ou lockfiles.
