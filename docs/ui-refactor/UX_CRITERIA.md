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

## Reforco Obrigatorio - Responsividade Completa da Pagina DRE

Alem das melhorias visuais e da correcao de exportacao em PDF, ajustar a
responsividade de toda a pagina DRE, nao apenas dos cards.

A responsividade precisa contemplar:

- Sidebar/menu lateral.
- Header da pagina.
- Cards principais.
- Card de ponto de equilibrio.
- Grafico de evolucao mensal.
- Composicao de despesas.
- Barra de busca.
- Filtros.
- Select de mes/periodo.
- Botao Exportar PDF.
- Tabela DRE.
- Modal de exportacao em PDF.
- Conteudo gerado para PDF, quando aplicavel.

Problema atual observado:

- Em telas grandes, a pagina pode ficar muito centralizada e com muito espaco
  vazio lateral.
- Em telas menores, filtros, tabela, graficos e modal podem ficar espremidos.
- A tela precisa se adaptar a diferentes larguras sem quebrar layout, sem cortar
  textos importantes e sem perder clareza.

Objetivo de responsividade:

- Criar um layout fluido, limpo e profissional para desktop grande acima de
  1440px, notebook 1366px, tablet e mobile.

Regras gerais:

1. Evitar larguras fixas rigidas.
2. Usar max-width inteligente, aproveitando melhor telas grandes.
3. Usar `width: 100%` nos containers principais.
4. Usar CSS grid/flex com `minmax()`, `auto-fit` ou `auto-fill` quando fizer sentido.
5. Usar gap responsivo.
6. Usar padding responsivo com `clamp()`.
7. Evitar estouro horizontal de componentes.
8. Nenhum texto, botao, card, grafico ou tabela deve ser cortado de forma ruim.
9. O layout deve manter hierarquia visual em todas as telas.
10. Nao prejudicar a versao desktop atual; apenas melhorar adaptacao e uso do espaco.

Container principal da pagina:

- Revisar o container que envolve a DRE.
- Em telas grandes, permitir largura maior, entre 1180px e 1440px conforme o
  padrao do sistema.
- Melhorar o aproveitamento horizontal em vez de deixar a area util estreita no centro.
- Usar referencia proxima de:

```css
width: 100%;
max-width: 1440px;
margin: 0 auto;
padding-inline: clamp(16px, 3vw, 40px);
```

- Se a sidebar ocupar espaco fixo, considerar corretamente a largura restante da viewport.

Cards superiores:

- Desktop grande: manter 3 ou mais cards em linha.
- Notebook: manter 3 cards em linha se houver espaco.
- Tablet: permitir 2 colunas.
- Mobile: empilhar em 1 coluna.
- Usar grid responsivo: `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));`.
- Garantir que valores monetarios nao quebrem de forma ruim.
- Usar font-size responsivo com `clamp()` quando necessario.

Card de ponto de equilibrio:

- Desktop: manter texto a esquerda e barra/indicador a direita.
- Tablet/mobile: empilhar texto e barra.
- A barra de progresso deve ocupar 100% da largura disponivel.
- Evitar elementos soltos ou desalinhados em telas pequenas.
- Garantir que "Receita atual", "Despesa" e "Gap" fiquem legiveis.
- Se necessario, transformar labels horizontais em blocos verticais no mobile.

Grafico de evolucao mensal:

- O grafico precisa ter altura responsiva.
- Desktop: altura confortavel, aproximadamente 320px a 380px.
- Mobile: altura minima de 260px.
- Se houver muitos meses ou labels no eixo X, permitir rolagem horizontal interna
  apenas no grafico, sem quebrar a pagina inteira.
- Nao deixar o grafico esmagado.
- Garantir que `ResponsiveContainer` tenha pai com largura e altura validas.
- Evitar `width`/`height` zero.
- No mobile, simplificar labels do eixo X se necessario.
- Tooltips precisam caber na tela.

Composicao de despesas:

- Desktop: pode usar barra empilhada e cards/chips em grid.
- Tablet: chips podem ficar em 2 colunas.
- Mobile: chips devem empilhar em 1 coluna.
- A barra empilhada nao pode ficar ilegivel em telas pequenas.
- Se a barra empilhada ficar ruim no mobile, substituir por lista vertical
  responsiva com barra individual por categoria.
- Cada categoria deve mostrar nome, valor e percentual.
- Evitar que nomes grandes quebrem o layout.
- Usar text-overflow, quebra controlada ou layout em duas linhas.

Area de filtros:

- Busca, filtros, select de mes e botao Exportar PDF precisam se reorganizar responsivamente.
- Desktop: busca ocupando maior parte da linha, Exportar PDF a direita, filtros
  proximos da busca e select de mes abaixo ou ao lado conforme espaco.
- Tablet: busca em linha inteira e botoes abaixo em grid/flex.
- Mobile: busca, select e botoes em largura total ou com area de toque clara.
- Evitar botoes muito pequenos no mobile.
- Altura minima dos controles: cerca de 40px a 44px.
- Chips de filtros ativos devem quebrar linha corretamente.

Tabela DRE:

- Desktop: manter tabela completa, valores monetarios e percentuais alinhados a direita.
- Notebook: ajustar espacamentos sem cortar colunas importantes.
- Tablet/mobile: usar scroll horizontal dentro de wrapper com `overflow-x: auto`
  ou transformar linhas em cards resumidos, se o padrao permitir.
- O scroll horizontal deve acontecer somente na tabela, nao na pagina inteira.
- Definir min-width seguro para a tabela, por exemplo 760px ou conforme colunas.
- O usuario precisa conseguir ver todas as colunas rolando lateralmente.
- Cabecalho deve continuar claro.
- Nao deixar badges de variacao esmagados.
- Nomes de categorias grandes devem quebrar linha de forma controlada.

Modal de exportacao PDF:

- Desktop: modal centralizado com largura confortavel.
- Mobile: modal deve ocupar quase toda a largura da tela.
- Usar referencia proxima de:

```css
width: min(100% - 32px, 560px);
max-height: calc(100vh - 32px);
overflow-y: auto;
```

- Select de periodo e campos de ano/data devem ocupar 100% da largura.
- Botoes podem ficar lado a lado no desktop; no mobile devem empilhar ou manter boa area de toque.
- Garantir que dropdown do select nao seja cortado.
- Garantir que o botao "Gerar PDF" fique visivel e acessivel.
- O modal nao deve ultrapassar a tela em altura.
- Fechar com Escape e manter foco acessivel.

Sidebar/Menu lateral:

- Verificar se a sidebar causa problemas de largura na pagina.
- Em telas menores, respeitar o comportamento colapsado ou overlay existente no sistema.
- Nao deixar conteudo principal escondido atras da sidebar.
- Garantir que o calculo de largura do conteudo considere a sidebar.

PDF e responsividade:

- O layout do PDF nao deve depender diretamente do layout responsivo da tela.
- Criar layout proprio para PDF com largura fixa segura.
- O PDF deve ter visual consistente independente do tamanho da tela do usuario.
- Nao usar layout mobile para gerar PDF em desktop.
- Garantir que o componente/rotina de PDF tenha width e height validos antes da captura, quando aplicavel.

Breakpoints sugeridos:

- Usar os breakpoints ja existentes no projeto.
- Se necessario, considerar mobile ate 640px, tablet de 641px a 1024px,
  notebook de 1025px a 1366px e desktop grande acima de 1366px.

Criterios de aceite especificos de responsividade:

- Em 1920px, a pagina nao pode ficar estreita demais perdida no centro.
- Em 1366px, cards, graficos, filtros e tabela devem ficar bem distribuidos.
- Em tablet, cards e filtros devem reorganizar sem sobreposicao.
- Em mobile, nenhum elemento deve estourar a largura da tela.
- A tabela deve ser acessivel por scroll horizontal ou cards responsivos.
- O modal de exportacao deve caber na tela do celular.
- O dropdown do periodo no modal nao deve ser cortado.
- O botao Gerar PDF deve permanecer acessivel.
- O grafico nao pode ficar com altura zerada ou comprimida.
- O card de composicao de despesas nao pode quebrar visualmente.
- O botao Exportar PDF deve permanecer facil de encontrar.
- Nao deve existir scroll horizontal na pagina inteira, exceto dentro da tabela
  ou grafico quando necessario.
- Testar visualmente 1920px, 1440px, 1366px, 1024px, 768px, 430px e 390px.

Prioridade da responsividade:

1. Corrigir containers principais e largura geral da pagina.
2. Corrigir cards e ponto de equilibrio.
3. Corrigir grafico.
4. Corrigir composicao de despesas.
5. Corrigir filtros e busca.
6. Corrigir tabela.
7. Corrigir modal de PDF.
8. Garantir que PDF nao dependa do layout responsivo da tela.

Ao finalizar ajustes de responsividade na DRE:

- Listar quais arquivos tiveram ajustes de responsividade.
- Explicar quais breakpoints foram usados.
- Explicar como a pagina se comporta em desktop, notebook, tablet e mobile.
- Informar se foi necessario criar wrappers com `overflow-x` para tabela/graficos.
- Confirmar que nao existe scroll horizontal indevido na pagina.

## Validacao Obrigatoria

- `rg "cva\\(" src`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run e2e` quando o ambiente permitir.

Nao finalizar refatoracao visual com erro de typecheck, lint, teste ou build.
