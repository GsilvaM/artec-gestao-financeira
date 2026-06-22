---
description: Rodar validação completa do projeto
---

Rode a validação completa:

```bash
bun install
bun run typecheck
bun run lint
bun run test
bun run build
```

Se houver erros:
1. Corrija a menor causa possível.
2. Não esconda erro com `any`, `// @ts-ignore` ou remoção de teste.
3. Rode novamente o comando que falhou.
4. Resuma o resultado final.
