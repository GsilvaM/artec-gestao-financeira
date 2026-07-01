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

## Proibido

Nao mascarar erro com `any`, `@ts-ignore`, mock indevido, remocao de teste ou alteracao de backend/banco.
