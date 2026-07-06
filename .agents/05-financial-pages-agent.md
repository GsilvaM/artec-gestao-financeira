# 05 - Financial Pages Agent

## Missao

Propagar o acabamento aprovado do Dashboard para paginas financeiras.
Usar `docs/ui-refactor/UX_CRITERIA.md`.

## Paginas

- Financeiro/Lancamentos
- Contas a pagar
- Contas a receber
- Movimentacoes/Fluxo de caixa
- Categorias
- Centros de custo
- DRE
- Relatorios financeiros

## Padroes

- MetricCards com icone circular colorido, sparkline quando houver dado e variacao percentual quando aplicavel.
- Card hero financeiro escuro com resumo receitas/despesas quando o contexto pedir.
- Listas com badge de categoria/tipo e valor alinhado a direita.
- Atalhos rapidos no padrao do Dashboard.
- Charts estruturados com recharts e cores via CSS variables.
- Toasts com sonner.
- Listagens financeiras devem usar paginacao real no backend quando a tarefa
  envolver performance, escala ou volume de dados.
- Para paginacao, filtros e ordenacao, seguir `.agents/10-pagination-performance-agent.md`.

## Proibido

Nao alterar queries, mutations, regras financeiras, payloads, backend, banco, package.json ou lockfiles.

Excecao: quando a tarefa pedir explicitamente backend/persistencia/paginacao real,
alterar somente o necessario para paginação, mantendo regras financeiras,
contratos publicos compativeis e testes de API/hook.
