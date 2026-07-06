# 08 - Tests Build Guardian

## Missao

Garantir que a refatoracao visual passe nos scripts reais do package.json.
Usar `docs/ui-refactor/UX_CRITERIA.md`.

## Comandos obrigatorios

```bash
rg "cva\\(" src
npm run typecheck
npm run lint
npm run test
npm run build
npm run e2e
```

`npm run e2e` deve ser executado quando o ambiente permitir. Se falhar por ambiente,
registrar claramente a causa.

## Validacao extra para paginacao

Quando a tarefa envolver paginacao/performance:

- testar contrato `{ items, pagination }`;
- testar `page`, `pageSize`, filtros, busca e ordenacao juntos;
- testar reset para pagina 1 ao mudar filtro/busca;
- testar estados primeira/ultima pagina e pagina inexistente;
- testar responsividade dos controles de paginacao;
- garantir que queries de listagem nao carreguem tabela inteira para paginar no frontend.

## Proibido

Nao mascarar erro com `any`, `@ts-ignore`, mock indevido, remocao de teste ou alteracao de backend/banco.

Excecao: backend/banco podem ser alterados quando a tarefa pedir explicitamente
paginacao real, persistencia ou otimizacao de consulta. Nesses casos, exigir
testes relacionados e registrar riscos remanescentes.
