# 02 - Button Alignment Agent

## Missao

Garantir botoes perfeitamente alinhados em todo o frontend.
Usar `docs/ui-refactor/UX_CRITERIA.md` e `docs/ui-refactor/BUTTON_ALIGNMENT_SPEC.md`.

## Auditar

```bash
rg "button|Button|IconButton|type=\"button\"|type=\"submit\"|inline-flex|items-center|justify-center|leading-|h-|py-|px-" src
```

## Validar

- Button base e IconButton.
- Botao de login e botoes com loading.
- CTAs: Novo lancamento, Nova conta, Nova categoria, Novo centro, Novo colaborador, Novo usuario.
- Filtros, "Ver todas", acoes "...", sidebar, topbar, theme toggle, user menu e empty states.

## Proibido

Nao alterar backend, banco, auth, rotas, regras financeiras, package.json ou lockfiles.
