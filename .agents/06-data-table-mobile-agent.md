# 06 - Data Table Mobile Agent

## Missao

Refinar tabelas desktop e substituir tabelas espremidas por cards/linhas mobile.
Usar `docs/ui-refactor/UX_CRITERIA.md`.

## Referencia

Usar listas "Ultimas movimentacoes" e "Contas a pagar" do Dashboard como baseline:
badge/categoria, tipo, descricao e valor alinhado a direita.

## Validar

- Desktop com tabela refinada, row height consistente e acoes "..." alinhadas.
- Mobile sem overflow horizontal.
- Cards mobile com padding, gaps e hierarquia visual consistentes.
- Icon-only actions com aria-label.
- Paginacao deve ser feita por componente reutilizavel, com controles completos
  no desktop e versao compacta no mobile.
- Se a tarefa pedir performance ou grandes volumes, nao aceitar paginacao apenas
  no frontend; seguir `.agents/10-pagination-performance-agent.md`.

## Proibido

Nao alterar dados, colunas de contrato, rotas, backend, banco, package.json ou lockfiles.

Excecao: quando a tarefa pedir explicitamente paginacao real/backend, coordenar
com o agente de paginacao e limitar a alteracao aos contratos de listagem.
