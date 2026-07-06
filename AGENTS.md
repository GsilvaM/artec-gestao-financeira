# AGENTS.md - Artec Gestao

Este arquivo orienta agentes de codigo que trabalham no repositorio Artec Gestao.

## Projeto

Artec Gestao e um SaaS financeiro/administrativo.

Stack principal:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Zustand
- Recharts
- lucide-react
- Sonner
- Prisma
- Supabase
- Vitest
- Playwright

## Regra principal

Agentes podem alterar frontend, layout, design system, componentes visuais e CSS somente quando a tarefa pedir explicitamente.

Agentes podem alterar backend, APIs, rotas de recurso, services, queries, mutations, contratos internos e regras de negocio somente quando a tarefa pedir explicitamente mudanca de backend, integracao, persistencia, fluxo de dados, regra de negocio ou correcao funcional que dependa dessas camadas.

## Regra financeira para contas futuras

Contas a Pagar e Contas a Receber representam obrigacoes/previsoes futuras.

- Criar ou editar uma conta pendente nao deve criar lancamento financeiro.
- Contas a Pagar so podem gerar despesa quando forem pagas por fluxo transacional proprio.
- Contas a Receber so podem gerar receita quando forem recebidas por fluxo transacional proprio.
- Lancamentos financeiros criados a partir dessas contas devem manter marcador de origem e nao devem ser editados/excluidos diretamente pela tela de Lancamentos.
- Conta ja paga/recebida nao deve voltar para pendente, ser editada ou excluida por fluxo comum enquanto nao existir rotina explicita de estorno/cancelamento.
- Operacoes que atualizam a conta e criam lancamento financeiro devem ser transacionais, idempotentes e protegidas contra duplicidade.

Quando uma tarefa pedir backend, agir de forma conservadora:

- Entender primeiro o fluxo existente antes de editar.
- Preferir reaproveitar services, repositories, schemas, permissions e helpers ja existentes.
- Manter o menor escopo possivel para cumprir a regra solicitada.
- Preservar contratos publicos sempre que possivel.
- Nao alterar regra financeira, autenticacao, permissao ou payload existente sem necessidade clara da tarefa.
- Usar transacoes quando a operacao envolver mais de uma escrita relacionada.
- Garantir idempotencia ou protecao contra duplicidade quando houver risco financeiro.
- Adicionar ou atualizar testes unitarios/API quando alterar regra de negocio, persistencia ou integracao entre modulos.
- Documentar no relatorio final quais garantias foram mantidas e quais limitacoes permanecem.

Quando a tarefa envolver a pagina DRE, alem da melhoria visual, tratar responsividade como requisito obrigatorio de entrega. A pagina DRE precisa funcionar bem desde desktop grande ate celular, incluindo graficos, filtros, tabela e modal de exportacao PDF.

Agentes NAO podem alterar, salvo quando a tarefa pedir explicitamente e a alteracao for indispensavel:

- banco de dados
- Prisma schema
- migrations
- seeds
- Supabase config
- autenticacao
- permissoes
- calculos financeiros
- package.json
- lockfiles
- variaveis de ambiente
- config de deploy

Mesmo quando a tarefa pedir backend, continuam proibidas alteracoes destrutivas ou amplas sem autorizacao direta:

- apagar dados fisicos em vez de soft delete/cancelamento/estorno;
- remover funcionalidade existente;
- enfraquecer autenticacao, autorizacao ou guards;
- alterar schema/migrations por conveniencia quando houver solucao segura no modelo atual;
- trocar contratos de payload sem compatibilidade ou migracao clara;
- mudar calculos financeiros fora do escopo solicitado;
- alterar package.json ou lockfiles sem necessidade tecnica explicita.

Excecao explicita para a tarefa "Exportacao de DRE em PDF":

- Pode alterar backend/resource routes/API somente para implementar o endpoint de exportacao do DRE em PDF.
- Pode alterar services/queries somente para reaproveitar ou expor os dados ja existentes da DRE para o PDF, sem mudar regra financeira.
- Pode alterar `package.json` e lockfile somente para adicionar a biblioteca de PDF `@react-pdf/renderer`.
- Pode adicionar testes unitarios/API relacionados exclusivamente a exportacao de DRE em PDF.
- Continua proibido alterar banco de dados, Prisma schema, migrations, seeds, Supabase config, autenticacao, permissoes fora do guard ja existente, variaveis de ambiente e config de deploy.

## Problema critico atual: botoes desalinhados

O sistema apresenta botoes com textos e icones desalinhados, inclusive na tela de login.

Nenhuma alteracao visual deve ser aceita se botoes continuarem tortos.

Todo agente que mexer em frontend deve validar:

- Button base.
- IconButton.
- Botao de login.
- Botoes principais das paginas.
- Botoes de filtro.
- Botoes "Novo lancamento", "Nova conta", "Nova categoria", "Novo centro", "Novo colaborador", "Novo usuario".
- Botoes "Ver todas".
- Botoes de acao "...".
- Botoes de sidebar/topbar.
- Theme toggle.
- User menu.
- Botoes dentro de empty states.

Regra visual obrigatoria:

- `display: inline-flex`.
- `align-items: center`.
- `justify-content: center`.
- `gap: 8px`.
- altura fixa por tamanho.
- line-height controlado.
- icones com tamanho fixo.
- SVG sem margin vertical estranha.
- texto sem deslocamento.
- `leading-none` ou `leading-normal` padronizado.
- `box-sizing: border-box`.
- `type="button"` quando nao for submit.
- aria-label em icon-only.

## Button alignment checklist obrigatorio

Todo botao deve passar nestes criterios:

- [ ] Texto centralizado verticalmente.
- [ ] Icone centralizado verticalmente.
- [ ] Icone e texto alinhados no mesmo eixo.
- [ ] Altura visual igual a altura CSS.
- [ ] Nao ha padding vertical causando deslocamento.
- [ ] Nao ha line-height herdado quebrando alinhamento.
- [ ] Nao ha SVG com `display: block` desalinhando.
- [ ] Nao ha `items-start`, `items-baseline` ou `leading` conflitante.
- [ ] Nao ha botao com `h-auto` quando deveria ter altura fixa.
- [ ] Nao ha botao com texto empurrado para cima/baixo.
- [ ] Login button esta alinhado.
- [ ] Botoes com spinner/loading continuam alinhados.
- [ ] Botoes com icone a esquerda continuam alinhados.
- [ ] Botoes icon-only tem area clicavel centralizada.

## Antes de editar frontend

Sempre auditar:

```bash
rg "button|Button|IconButton|btn|type=\"button\"|type=\"submit\"|inline-flex|items-center|justify-center|leading-|h-|py-|px-" src
rg "bg-white|bg-black|bg-gray|bg-slate|bg-zinc|bg-neutral|text-white|text-gray|text-slate|border-black|border-gray|border-slate|#[0-9a-fA-F]{3,8}" src
rg "dark:|theme|ThemeProvider|useTheme|localStorage|classList|data-theme" src
rg "<button|Button|onClick|disabled|pointer-events|aria-label|type=\"submit\"|type=\"button\"" src
rg "z-|fixed|absolute|inset|overlay|pointer-events|opacity-0|invisible" src
rg "sm:|md:|lg:|xl:|2xl:|w-screen|min-w|max-w|overflow-x|table-auto|grid-cols" src
rg "table|thead|tbody|tr|td|DataTable|Table|columns|row|rows" src
rg "Dashboard|Financeiro|Lancamentos|Contas|Movimentacoes|DRE|Categorias|Centros|Clientes|Fornecedores|Colaboradores|Relatorios|Admin|Configuracoes|Login" src
rg "logo|Logo|favicon|icon|Icon|Artec|arco|arch" src public
```

## Comandos de validacao

Antes de finalizar qualquer tarefa frontend:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Se o ambiente permitir:

```bash
npm run e2e
```

Nunca finalizar com erro de TypeScript, lint, teste ou build.

Antes de finalizar qualquer tarefa backend:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Quando a tarefa alterar API, fluxo financeiro, persistencia ou integracao entre modulos, adicionar ou atualizar testes relacionados e rodar pelo menos os testes afetados. Se o ambiente permitir, rodar `npm run e2e` quando a mudanca impactar fluxo de usuario.

## Proibicoes

Nao usar:

- `any` para escapar de erro
- `@ts-ignore`
- `console.log` esquecido
- mock para mascarar problema
- remocao de funcionalidade
- alteracao de banco sem pedido explicito
- alteracao de rotas sem pedido explicito ou sem compatibilidade
- alteracao de regras financeiras fora do escopo solicitado
- alteracao ampla de backend quando uma mudanca pequena resolver

## Direcao visual

A refatoracao visual deve seguir o conceito:

"Artec Finance Command UI"

Caracteristicas:

- SaaS financeiro premium
- light mode limpo
- dark mode refinado
- sidebar navy premium
- novo logo vetorial proprio
- tabelas elegantes
- cards consistentes
- botoes perfeitamente alinhados
- mobile sem quebra
- dark/light mode consistente
- sem bordas grosseiras
- sem visual antigo residual

## Documentacao obrigatoria

Usar como base:

- `docs/ui-refactor/DESIGN_SYSTEM_SPEC.md`
- `docs/ui-refactor/BUTTON_ALIGNMENT_SPEC.md`
- `docs/ui-refactor/UI_REFACTOR_PLAN.md`
- `docs/ui-refactor/ACCEPTANCE_CHECKLIST.md`
- `docs/ui-refactor/DRE_UX_PDF_PROMPT.md` quando a tarefa envolver a pagina DRE, graficos, filtros, tabela ou exportacao PDF.

## Finalizacao

Ao terminar uma tarefa, responder com:

1. Arquivos alterados.
2. O que foi feito.
3. O que nao foi alterado.
4. Como botoes foram validados.
5. Comandos rodados.
6. Resultado dos comandos.
7. Limitacoes ou pendencias.
