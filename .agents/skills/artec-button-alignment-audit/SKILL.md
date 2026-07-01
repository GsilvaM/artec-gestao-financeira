---
name: artec-button-alignment-audit
description: Audita e corrige botoes desalinhados no Artec Gestao, incluindo login, CTAs, filtros, acoes e IconButtons.
---

# Artec Button Alignment Audit Skill

Use esta skill sempre que houver botao desalinhado, texto torto, icone fora do eixo ou botao com altura inconsistente.

## Problema atual

O sistema possui varios botoes com texto desalinhado, inclusive o botao da tela de login.

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

## Correcao padrao

Todo botao deve usar:

- `inline-flex`
- `items-center`
- `justify-center`
- `gap-2`
- altura fixa
- `leading-none` ou padrao controlado
- SVG com `size-4` ou tamanho fixo
- `shrink-0` em icones
- padding horizontal padronizado
- sem padding vertical conflitante
- sem `items-baseline`
- sem `align-middle` improvisado

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

- [ ] Login button alinhado.
- [ ] Texto de todos os CTAs alinhado.
- [ ] Icones centralizados.
- [ ] Spinners/loading centralizados.
- [ ] Botoes com icone e texto alinhados.
- [ ] IconButtons com SVG centralizado.
- [ ] Acoes "..." alinhadas.
- [ ] Botoes mobile com altura correta.
- [ ] Nenhum botao com `h-auto` indevido.
- [ ] Nenhum botao com `py-*` quebrando centralizacao.
- [ ] Nenhum botao com line-height herdado quebrando centralizacao.
