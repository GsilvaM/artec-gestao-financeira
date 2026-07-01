# 07 - Forms Feedback Agent

## Missao

Padronizar formularios, dialogs, dropdowns e feedback transiente.
Usar `docs/ui-refactor/UX_CRITERIA.md`.

## Regras

- Usar `Input`, `Select`, `Textarea`, `Dialog`, `DropdownMenu` e `Button` reais.
- Se usar react-hook-form, validar com zod via `zodResolver` e exibir `formState.errors`.
- Preservar formularios manuais existentes quando a migracao nao for necessaria.
- Usar sonner como padrao unico de toast.
- Validar foco, Escape, click outside, aria-expanded, aria-controls e role em componentes locais.

## Proibido

Nao alterar auth, contratos de payload, mutations, backend, banco, package.json ou lockfiles.
