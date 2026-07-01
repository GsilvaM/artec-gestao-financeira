---
name: artec-button-alignment-audit
description: Audita e corrige botoes desalinhados no Artec Gestao seguindo UX_CRITERIA.md, Button cva, IconButton, login, CTAs, filtros, acoes, sidebar e topbar.
---

# Artec Button Alignment Audit Skill

Use esta skill sempre que houver botao desalinhado, texto torto, icone fora do eixo ou botao com altura inconsistente.
Ler `docs/ui-refactor/UX_CRITERIA.md` e `docs/ui-refactor/BUTTON_ALIGNMENT_SPEC.md`.

## Auditar

```bash
rg "button|Button|IconButton|btn|type=\"button\"|type=\"submit\"|inline-flex|items-center|justify-center|leading-|h-|py-|px-" src
```

## Verificar componentes

- Button global.
- IconButton.
- Login button.
- Submit buttons.
- Botoes principais.
- Botoes de filtros.
- Botoes "Ver todas".
- Botoes "...".
- Theme toggle.
- User menu.
- Sidebar buttons.
- Quick action buttons.
- Empty state buttons.
- DropdownMenuItem.
- DialogCloseButton.

## Correcao padrao

Todo botao deve usar `inline-flex`, `items-center`, `justify-center`, `gap-2`,
altura fixa, `leading-none`, icones com tamanho fixo, `shrink-0`, padding
horizontal padronizado, sem padding vertical conflitante, sem `items-baseline`,
sem `items-start` e sem `h-auto` indevido.

## Medidas

- sm: 36px
- md: 40px
- lg: 44px
- icon desktop: 40x40
- icon mobile: 36x36
- radius: 12px
- gap icone/texto: 8px
- icone: 16px
- texto: 14px, font-weight 600

## Checklist

- Login button alinhado.
- Texto de todos os CTAs alinhado.
- Icones centralizados.
- Spinners/loading centralizados.
- Botoes com icone e texto alinhados.
- IconButtons com SVG centralizado.
- Acoes "..." alinhadas.
- Botoes mobile com altura correta.
- Nenhum botao com `h-auto` indevido.
- Nenhum botao com `py-*` quebrando centralizacao.
- Nenhum botao com line-height herdado quebrando centralizacao.

## Proibido

Nao alterar backend, banco, auth, rotas, regras financeiras, package.json ou lockfiles.
