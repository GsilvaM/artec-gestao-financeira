# 10 - Pagination Performance Agent

## Missao

Implementar e revisar paginacao real, performance e escalabilidade em listagens
do Artec Gestao. Usar `AGENTS.md`, `docs/ui-refactor/UX_CRITERIA.md` e este
arquivo como criterio de pronto.

## Analise obrigatoria

Antes de editar, mapear:

- telas que exibem listas, tabelas, cards repetidos ou historicos;
- componentes reutilizados por listagens;
- hooks TanStack Query e chaves de cache;
- APIs que retornam arrays completos;
- repositories e consultas Prisma `findMany`;
- filtros, busca, ordenacao e campos usados em cada consulta;
- gargalos de performance, duplicacao e contratos inconsistentes.

## Arquitetura padrao

Toda listagem persistida deve seguir:

`DataTable/Listagem -> Filters -> Sorting -> Pagination -> API -> Repository -> Banco`

Regras:

- paginar no servidor, nunca carregar tudo para paginar no frontend;
- usar contrato padrao `{ items, pagination }`;
- aceitar `page`, `pageSize`, `search`, `sortBy`, `sortDirection` e filtros especificos;
- manter compatibilidade somente quando uma rotina existente realmente precisa de lista completa;
- resetar para pagina 1 quando filtros, busca ou ordenacao mudarem;
- usar debounce de busca, preferencialmente 300ms;
- preservar estado via URL ou storage quando fizer sentido.

## Contrato de retorno

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

## Backend e banco

- Repositories devem usar `skip`/`take` ou cursor quando apropriado.
- Consultas paginadas devem executar `findMany` e `count` com o mesmo `where`.
- Ordenacao deve ser validada por allowlist por entidade.
- `pageSize` deve aceitar apenas 10, 20, 50, 100 e 200.
- `page` deve ser no minimo 1.
- Adicionar indices somente quando a tarefa autorizar banco/migration explicitamente.
- Campos prioritarios para indice: data, status, tipo, categoria, centro de custo, cliente,
  fornecedor, usuario e campos usados em filtros.

## Frontend

Criar ou reutilizar um componente unico de paginacao com:

- primeira pagina;
- pagina anterior;
- proximas paginas;
- ultima pagina;
- numeros de pagina no desktop;
- `Pagina X de Y` no mobile;
- total de registros;
- intervalo exibido, como `Mostrando 41-60 de 1.542 registros`;
- seletor de page size com 10, 20, 50, 100 e 200;
- campo ou controle para ir para pagina;
- aria-labels, foco visivel e suporte a teclado.

## Cache

Com TanStack Query:

- incluir filtros, ordenacao, pagina e page size na query key;
- usar `keepPreviousData`/placeholder quando apropriado;
- pre-carregar proxima pagina quando houver `hasNext`;
- invalidar listas e resumos apos criar, editar, excluir, pagar, receber e estornar;
- evitar reload completo da pagina.

## Responsividade

- Desktop: mostrar primeira, anterior, numeros, proxima e ultima.
- Mobile: mostrar anterior, `Pagina X de Y` e proxima.
- Nao criar overflow horizontal na pagina inteira.
- Botoes devem seguir `Button`/`IconButton`, alinhados e com `aria-label`.

## Escopo minimo por implementacao

Quando a tarefa pedir paginacao global, priorizar nesta ordem:

1. utilitarios e tipos compartilhados de paginacao;
2. repositories e APIs financeiras reais;
3. hooks e cache;
4. componente reutilizavel;
5. telas com dados persistidos;
6. testes unitarios/API;
7. e2e/responsividade.

Se houver telas sem backend real, como mocks locais, documentar a limitacao e nao criar
uma falsa paginacao apenas no frontend.

## Validacao obrigatoria

```bash
rg "cva\\(" src
npm run typecheck
npm run lint
npm run test
npm run build
npm run e2e
```

Se `e2e` falhar por ambiente, registrar a causa concreta.

## Relatorio final

Informar:

1. arquitetura criada;
2. APIs alteradas;
3. consultas otimizadas;
4. componentes criados;
5. telas integradas;
6. estrategia de cache/debounce/persistencia;
7. validacoes executadas;
8. limitacoes e proximos passos.
