---
name: artec-pagination-performance
description: Implementa e audita paginacao real no backend, contratos paginados, DataTablePagination, busca com debounce, sorting, cache TanStack Query e performance de listagens do Artec Gestao.
---

# Artec Pagination Performance Skill

Use esta skill quando a tarefa mencionar paginacao, performance de listagens,
escalabilidade, grandes volumes, DataTable, filtros com pagina, sorting ou APIs
que nao devem carregar todos os registros.

## Ler antes de agir

1. `AGENTS.md`
2. `.agents/10-pagination-performance-agent.md`
3. `docs/ui-refactor/UX_CRITERIA.md`, quando houver componente visual ou responsividade.

## Fluxo obrigatorio

1. Mapear listagens, hooks, APIs, repositories e consultas Prisma afetadas.
2. Confirmar se a listagem tem backend real. Se for mock/local, documentar a limitacao.
3. Implementar paginacao no backend usando `skip`/`take` ou cursor.
4. Padronizar retorno como `{ items, pagination }`.
5. Validar filtros, busca e sorting por allowlist.
6. Integrar hooks TanStack Query com query key contendo filtros, pagina, page size e ordenacao.
7. Usar componente reutilizavel de paginacao no frontend.
8. Garantir layout responsivo: completo no desktop, compacto no mobile.
9. Rodar validacoes obrigatorias.

## Regras de backend

- Nunca paginar apenas no frontend quando houver banco/API.
- `page` minimo 1.
- `pageSize` permitido: 10, 20, 50, 100, 200.
- `findMany` paginado deve compartilhar o mesmo `where` do `count`.
- Sorting deve aceitar apenas campos conhecidos da entidade.
- Preservar regras financeiras, autenticacao e permissoes.
- Indices/migrations somente quando a tarefa autorizar banco explicitamente.

## Regras de frontend

- Resetar para pagina 1 quando busca, filtro ou sorting mudarem.
- Usar debounce de 300ms para busca.
- Salvar preferencia de page size quando fizer sentido.
- Exibir intervalo: `Mostrando X-Y de Z registros`.
- Botoes devem usar componentes reais (`Button`/`IconButton`) e `aria-label`.
- Evitar overflow horizontal da pagina.

## Validacao

```bash
rg "cva\\(" src
npm run typecheck
npm run lint
npm run test
npm run build
npm run e2e
```

## Relatorio

Informar arquitetura, APIs alteradas, consultas otimizadas, componentes criados,
telas integradas, cache/debounce/persistencia, testes executados, limitacoes e
proximos passos.
