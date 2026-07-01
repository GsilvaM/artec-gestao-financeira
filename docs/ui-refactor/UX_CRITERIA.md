# UX Criteria - Artec Finance Command UI

Este documento e a fonte de verdade para agentes de UI/UX do Artec Gestao.
Use somente o stack real do projeto: React 19, Vite 6, TypeScript, React Router 7,
Tailwind CSS v4, tailwindcss-animate, cva, clsx, tailwind-merge,
lucide-react, recharts, react-hook-form, zod, sonner, zustand e TanStack Query.

## Guardrails

- Nao sugerir shadcn/ui, Radix UI, Chart.js, Heroicons, styled-components ou
  qualquer biblioteca ausente do package.json.
- Nao alterar Prisma, Supabase, adapter-pg, auth, rotas, payloads, permissoes,
  regras de calculo financeiro, package.json ou lockfiles sem aprovacao explicita.
- Preservar contratos de dados e comportamento funcional existente.
- Usar lucide-react como unica fonte de icones.
- Usar sonner como unico padrao de toast e feedback transiente.

## Baseline Visual Aprovado

O Dashboard atual e a referencia positiva para propagar acabamento visual.
Preservar sua linguagem em vez de redesenhar do zero:

- Sidebar navy com largura desktop de aproximadamente 272px.
- Logo "Artec Finance Command" no topo.
- Grupos de navegacao com label uppercase.
- Item ativo com fundo azul solido arredondado, icone antes do texto.
- Topbar simples com breadcrumb, acoes compactas, theme toggle e user menu.
- Card hero escuro "Cartao financeiro" com saldo e resumo interno.
- MetricCards claros com icone circular colorido, valor, variacao e sparkline.
- Listas com badge/categoria, tipo e valor alinhado a direita.
- Empty states curtos, diretos e consistentes com o Dashboard.

## Componentes Reais

Priorizar os componentes existentes:

- `Button` e `IconButton`: `src/components/ui/button.tsx`, usando cva.
- `Badge`: `src/components/ui/badge.tsx`, usando cva.
- `Input`, `Select`, `Textarea`, `Dialog`, `DropdownMenu`: `src/components/ui/`.
- `PageShell`, `PageHeader`, `FilterBar`, `EmptyState`, `StatusBadge`,
  `MetricCard` simples: `src/components/layout/page-shell.tsx`.
- `MetricCard` premium do Dashboard:
  `src/components/dashboard/MetricCard.tsx`.
- `SparklineChart`: `src/components/dashboard/SparklineChart.tsx`.

Novos componentes de botao, badge, input ou variantes visuais devem seguir o
padrao cva quando houver variantes reutilizaveis.

## Buttons

- Todo botao deve usar `inline-flex`, `items-center`, `justify-center`, `gap-2`,
  altura fixa, `leading-none`, icones fixos e `type="button"` quando nao for submit.
- Botoes icon-only precisam de `aria-label`.
- Spinners/loading devem manter o mesmo eixo visual de icone e texto.
- Validar login, filtros, CTAs, "Ver todas", acoes "...", sidebar, topbar,
  theme toggle, user menu e empty states.

## Forms

- Usar os componentes reais `Input`, `Select`, `Textarea`, `Dialog` e `Button`.
- Quando formularios usarem react-hook-form, validar com zod via resolver
  (`zodResolver`) e exibir mensagens a partir de `formState.errors`.
- Quando formularios existentes forem manuais com zod, manter a arquitetura local
  e nao migrar fluxo sem necessidade.
- Estados de erro, disabled, loading e focus-visible devem ser visiveis em light
  e dark mode.

## Charts

- Usar recharts para graficos estruturados e manter sparklines SVG existentes
  quando forem suficientes para MetricCards pequenos.
- Cores de linha, area e tooltip devem vir de CSS variables:
  `--chart-revenue`, `--chart-expense`, `--chart-balance` ou tokens correlatos.
- Sparklines de MetricCard devem ter altura fixa e nao exibir legenda poluida.
- Graficos maiores, como "Resumo financeiro", devem ter tooltip customizado
  consistente com `FinancialTooltip` do Dashboard.
- Evitar legendas, eixos e grades excessivas em graficos compactos.

## Motion

- Usar Tailwind CSS e tailwindcss-animate.
- Preferir classes `animate-in`, `animate-out`, `fade-in-*`, `zoom-in-*`,
  `slide-in-*` e transicoes Tailwind existentes.
- Nao introduzir biblioteca externa de animacao.
- Movimento deve ser curto, funcional e sem deslocar layout critico.

## Toasts/Feedback

- Usar `sonner` como padrao unico: `toast.success`, `toast.error`,
  `toast.loading` quando aplicavel.
- Mensagens devem ser especificas, curtas e orientadas a acao.
- Nao criar outro sistema de notificacao.

## Dark Mode

- O tema e controlado por `src/stores/theme.ts`, que aplica `.dark` e
  `data-theme` no `documentElement`.
- Validar tela por tela se os tokens cobrem conteudo, tabelas, dialogs,
  dropdowns, inputs, cards, charts, login e empty states.
- Sidebar navy e card financeiro escuro nao provam dark mode completo sozinhos.

## Responsividade e Acessibilidade

- Validar 360, 390, 430, 768, 1024, 1280, 1440 e 1920px.
- Sem overflow horizontal, texto cortado, tabela espremida ou botao fora do eixo.
- Listagens completas em mobile devem usar cards/linhas inspiradas nas listas do
  Dashboard, nao tabelas comprimidas.
- Dialog e dropdown sao implementacoes locais; validar foco, Escape,
  click outside, `aria-expanded`, `aria-controls` e `role` quando aplicavel.

## Validacao Obrigatoria

- `rg "cva\\(" src`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run e2e` quando o ambiente permitir.

Nao finalizar refatoracao visual com erro de typecheck, lint, teste ou build.
