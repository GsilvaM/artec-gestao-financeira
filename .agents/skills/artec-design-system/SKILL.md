---
name: artec-design-system
description: Aplica tokens, componentes reais e design system Artec Finance Command UI usando UX_CRITERIA.md, cva, Tailwind v4 e o baseline do Dashboard.
---

# Artec Design System Skill

Use esta skill para criar/refatorar tokens e componentes base.
Ler `docs/ui-refactor/UX_CRITERIA.md` antes de editar.

## Componentes reais

- `Button` e `IconButton` em `src/components/ui/button.tsx`.
- `Badge` em `src/components/ui/badge.tsx`.
- `Input`, `Select`, `Textarea`, `Dialog`, `DropdownMenu` em `src/components/ui/`.
- `PageShell`, `FilterBar`, `EmptyState`, `StatusBadge` em `src/components/layout/page-shell.tsx`.
- `MetricCard` premium e `SparklineChart` em `src/components/dashboard/`.
- Dashboard atual como baseline aprovado de card hero, MetricCards, atalhos e listas.

## Charts e feedback

- Usar recharts para graficos estruturados e CSS variables para cores.
- Usar sparklines existentes quando o contexto for MetricCard compacto.
- Usar sonner como unico padrao de toast.

## Regra

Nao espalhar hex solto em componentes.
Usar CSS variables e tokens globais.
Nao introduzir biblioteca visual nova sem aprovacao.
Nao alterar backend, banco, auth, rotas, regras financeiras, package.json ou lockfiles.
