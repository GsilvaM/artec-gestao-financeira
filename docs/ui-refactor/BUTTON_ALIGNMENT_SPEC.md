# Button Alignment Spec - Artec Gestao

## Problema

O sistema apresenta varios botoes com texto ou icone desalinhado, incluindo o botao de login.

## Objetivo

Todo botao deve parecer perfeitamente centralizado, limpo e profissional.

## Regra base

Todos os botoes devem usar:

```css
display: inline-flex;
align-items: center;
justify-content: center;
gap: 8px;
box-sizing: border-box;
line-height: 1;
white-space: nowrap;
```

## SVG / icones

Todo icone dentro de botao deve ter:

```css
width: 16px;
height: 16px;
flex-shrink: 0;
```

## Tamanhos

- sm: 36px
- md: 40px
- lg: 44px
- icon desktop: 40x40
- icon mobile: 36x36
- login button: 44px full-width

## Classes recomendadas

```txt
inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold leading-none transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
```

## Proibido

- `items-baseline`
- `items-start`
- `leading-loose`
- `h-auto` em botao padrao
- `py-*` aleatorio quebrando altura
- SVG sem tamanho fixo
- spinner maior que icone
- span com margin vertical
- botao com texto deslocado
- botao com padding vertical conflitante

## Checklist visual

- [ ] O botao de login esta alinhado.
- [ ] Botoes principais estao alinhados.
- [ ] Icones estao no mesmo eixo do texto.
- [ ] Spinners estao centralizados.
- [ ] Botoes de filtro estao alinhados.
- [ ] Botoes "..." estao centralizados.
- [ ] Botoes mobile nao cortam texto.
- [ ] Focus ring nao desloca layout.
- [ ] Active scale nao desloca texto.
