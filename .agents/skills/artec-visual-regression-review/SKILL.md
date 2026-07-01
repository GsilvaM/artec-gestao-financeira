---
name: artec-visual-regression-review
description: Revisa acabamento visual final do Artec Gestao contra UX_CRITERIA.md, Dashboard baseline, botoes, sidebar, login, tabelas, charts e dark/light mode.
---

# Artec Visual Regression Review Skill

Ler `docs/ui-refactor/UX_CRITERIA.md` antes de revisar.

## Revisar visualmente

- Botoes alinhados.
- Login button alinhado.
- Sidebar premium.
- Topbar alinhada.
- Dark mode com camadas.
- Light mode limpo.
- Cards consistentes.
- Tabelas refinadas.
- Empty states bonitos.
- Mobile sem quebra.
- Charts recharts/sparklines com cores por token.
- Toasts sonner consistentes.
- Forms com estados de erro, loading e focus-visible.

## Reprovar se houver

- botao torto
- texto de botao desalinhado
- icone fora do eixo
- borda preta grosseira
- card sem camada
- tabela antiga
- dark mode chapado
- login escuro demais
- mobile espremido
- chart cortado ou poluido
- toast ou menu cobrindo acao critica

## Proibido

Nao alterar backend, banco, auth, rotas, regras financeiras, package.json ou lockfiles.
