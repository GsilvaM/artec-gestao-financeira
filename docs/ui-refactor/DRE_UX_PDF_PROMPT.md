# Prompt DRE - UX, PDF e Analise Financeira

Use este prompt como referencia para iteracoes na pagina DRE do Artec Gestao.

## Papel

Voce e um Senior Product Designer, Senior Frontend Engineer e especialista em
dashboards financeiros/DRE.

## Contexto

O Artec Gestao e usado por uma empresa de ar-condicionado/climatizacao. A pagina
atual de DRE mostra:

- Cards superiores: Receitas, Despesas e Resultado.
- Card de ponto de equilibrio.
- Grafico de evolucao mensal com receita, despesa e resultado.
- Composicao de despesas por categoria em barra empilhada.
- Filtros por busca, mes e filtros avancados.
- Tabela com grupo, categoria, realizado, % receita e variacao.
- Botao "Exportar PDF".
- Modal de exportacao com periodo: mes atual, trimestre, ano inteiro e intervalo customizado.

## Problemas Atuais

1. A pagina esta funcional, mas ainda pode ficar mais clara, analitica e profissional.
2. A exportacao PDF nao pode gerar arquivo em branco.
3. O grafico de evolucao pode ser pouco util quando ha poucos meses com dados.
4. A composicao de despesas deve explicar melhor o impacto financeiro.
5. A tabela deve ficar mais gerencial, escaneavel e util para decisao.
6. A pagina precisa funcionar para empresa pequena/media de climatizacao, com
   receitas de servicos, produtos e contratos de manutencao, e despesas como
   colaboradores, alimentacao, gestor, EPI, estorno/troco e mao de obra externa.

## Objetivo Geral

Melhorar a pagina de DRE sem perder simplicidade. A tela deve ficar mais clara
para tomada de decisao, com melhor hierarquia visual, melhores graficos, melhores
indicadores e exportacao PDF funcionando corretamente.

## Antes De Alterar

- Analise o repositorio e identifique a stack usada.
- Localize os componentes da pagina DRE.
- Localize a funcao/componente responsavel pelo PDF.
- Localize a origem dos dados da DRE.
- Preserve a arquitetura existente sempre que possivel.
- Nao quebre rotas, autenticacao, banco de dados ou APIs existentes.
- Faca mudancas incrementais, com codigo limpo, componentizado e facil de manter.

## Referencias Conceituais

- Dashboard financeiro precisa mostrar primeiro os KPIs mais importantes e depois permitir detalhamento.
- A leitura precisa ser rapida: hierarquia clara, menos poluicao visual, bons contrastes e numeros formatados.
- Graficos devem ajudar a responder perguntas de negocio, nao apenas decorar a tela.
- Filtros devem ficar proximos do conteudo que controlam.
- Estados de loading, vazio e erro precisam ter mensagens uteis.
- Nao depender apenas de cor para comunicar lucro/prejuizo; usar labels, icones e textos.
- Tabelas financeiras precisam permitir comparacao, agrupamento, ordenacao e leitura rapida.

## 1. Cabecalho Da Pagina

- Manter titulo "DRE".
- Adicionar subtitulo gerencial: "Acompanhe receitas, despesas, resultado liquido e categorias que mais impactam a operacao."
- Exibir badge do periodo selecionado, por exemplo "Periodo: Julho/2026" ou "Ano inteiro 2026".
- Se existir diferenca entre regime de caixa e competencia no sistema, deixar visualmente claro qual regime esta sendo usado. Se nao existir, nao inventar dado.

## 2. Cards Principais

Substituir ou complementar os cards atuais com indicadores mais uteis:

- Receita total.
- Despesa total.
- Resultado liquido.
- Margem liquida (%).
- Cobertura das despesas = receita / despesas.
- Variacao contra periodo anterior, quando houver dados.

Cada card deve ter:

- Valor principal em destaque.
- Label clara.
- Indicador de variacao com texto explicativo, nao apenas "+1,8%".
- Estado positivo, neutro ou negativo.
- Para resultado negativo, mensagem objetiva: "Prejuizo no periodo" ou "Resultado negativo".

Exemplo de card Resultado:

- Valor: `-R$ 10.196,13`.
- Subtexto: "Resultado negativo no periodo".
- Badge: "-46,3% da receita".

## 3. Card De Ponto De Equilibrio

- Mostrar receita atual.
- Mostrar despesa atual.
- Mostrar gap para equilibrio.
- Mostrar percentual de cobertura: "A receita cobre 68,4% das despesas".
- Mostrar barra de progresso com receita atual, meta de equilibrio e gap restante.
- Evitar visual confuso com pontos soltos sem escala.
- Se receita for maior que despesas, usar mensagem: "Receita supera as despesas em R$ X".

## 4. Grafico De Evolucao Mensal

O grafico deve responder:

- A empresa esta melhorando ou piorando?
- Receita e despesa estao se aproximando?
- O resultado esta ficando menos negativo ou mais negativo?

Requisitos:

- Usar meses reais no eixo X.
- Ao selecionar 12 meses, mostrar os 12 meses, mesmo que alguns estejam zerados.
- Diferenciar "sem dados" de "valor zero" quando possivel.
- Evitar linha enganosa conectando apenas dois pontos muito distantes.
- Preferir visual combinado: barras para Receita e Despesa, linha para Resultado liquido.
- Tooltip completo: mes, receita, despesa, resultado, margem e diferenca receita vs despesa.
- Formatar eixo Y como moeda brasileira.
- Desabilitar animacoes no componente usado para exportacao PDF.
- Adicionar legenda clara.
- Adicionar estado vazio: "Ainda nao ha dados suficientes para evolucao mensal."

## 5. Composicao De Despesas

- Mostrar top 5 categorias de despesa por impacto.
- Agrupar restante como "Outros".
- Para cada categoria, mostrar nome, valor em R$, % sobre total de despesas e % sobre receita.
- Destacar categorias criticas; exemplo: categoria acima de 30% da receita deve exibir alerta discreto.
- Se "Pag. Colaborador" representar parcela alta da receita, tratar como alerta de pressao sobre margem.
- Permitir clicar/expandir categoria para detalhes somente se ja existir dado disponivel. Se nao existir, deixar estrutura preparada sem quebrar.

## 6. Insights Automaticos

Adicionar area pequena de "Leitura rapida" ou "Resumo gerencial", com 2 a 4
insights calculados a partir dos dados reais.

Exemplos:

- "As despesas superaram as receitas em R$ 10.196,13 no periodo."
- "Pag. Colaborador representa 69,4% da receita, principal pressao do mes."
- "Receita de servicos representa 58,6% da receita total."
- "A empresa precisa aumentar a receita em 46,3% ou reduzir despesas para atingir equilibrio."

Regras:

- Nao inventar insight sem base nos dados.
- Se nao houver dados suficientes, mostrar mensagem neutra.
- Calcular insights a partir dos dados reais carregados na pagina.

## 7. Filtros

- Campo de busca por categoria/descricao.
- Filtro de periodo.
- Filtro por grupo: Receitas, Despesas, Resultado.
- Filtro por categoria.
- Botao "Limpar filtros".
- Chips dos filtros ativos.
- Filtros proximos da tabela.
- Empty state para busca/filtro sem resultado: "Nenhuma categoria encontrada para os filtros selecionados. Limpe os filtros ou altere o periodo."

## 8. Tabela DRE

- Cabecalho fixo se fizer sentido.
- Linhas agrupadas por Receitas, Despesas e Resultado.
- Subtotais destacados.
- Resultado liquido destacado no final.
- Valores positivos e negativos formatados corretamente.
- Coluna "% da Receita" com destaque quando for muito alto.
- Coluna "Variacao" com tooltip explicando comparacao.
- Ordenacao por valor realizado e % da receita.
- Texto a esquerda, valores monetarios e percentuais a direita.
- Usar fonte tabular/monoespacada para numeros se disponivel.
- Evitar bordas pesadas; usar linhas suaves e espacamento confortavel.
- Em mobile, permitir rolagem horizontal ou cards resumidos.

## 9. Exportacao PDF

Prioridade maxima: o PDF nao pode sair em branco.

Investigar:

- Onde o PDF e gerado.
- Se usa html2canvas, jsPDF, html2pdf, react-pdf, print CSS ou outra biblioteca.
- Se o elemento capturado esta com `display: none`, `visibility: hidden`, largura 0, altura 0, fora do DOM ou ainda carregando.
- Se graficos usam `ResponsiveContainer` sem largura/altura fixa no momento da captura.
- Se fontes, imagens, SVGs ou canvas nao carregaram antes da exportacao.
- Se o PDF e gerado antes dos dados serem renderizados.
- Se ha erro silencioso no console.
- Se o modal fecha antes da captura.
- Se o componente capturado depende de estado visual inexistente no momento da geracao.

Implementacao recomendada:

- Criar componente dedicado para impressao/exportacao, como `PrintableDREReport` ou `DREPdfTemplate`.
- Esse componente deve receber os dados ja processados do periodo selecionado.
- Ele deve ter layout proprio para PDF, sem depender do layout responsivo da tela.
- Renderizar em container temporario fora da area visivel, mas nunca com `display: none`.
- Se usar captura DOM, usar posicao fixa fora da viewport:

```css
position: fixed;
left: -10000px;
top: 0;
width: 1120px;
background: white;
```

- Aguardar renderizacao completa antes de capturar: `document.fonts.ready`, imagens, proximo frame e graficos sem animacao.
- Se usar `html2canvas`, configurar `backgroundColor: "#ffffff"`, `scale: 2`, `useCORS: true`, `logging: false`, `windowWidth` e `windowHeight` baseados no elemento.
- Antes de gerar PDF, validar elemento, `offsetWidth`, `offsetHeight`, `canvas.width` e `canvas.height`.
- Se algum valor for zero, lancar erro visivel e nao gerar PDF em branco.
- Exibir toast de erro: "Nao foi possivel gerar o PDF. Tente novamente ou altere o periodo."
- Limpar container temporario depois da geracao.

O PDF precisa conter:

- Logo/nome Artec Gestao, se ja existir no sistema.
- Titulo "DRE".
- Periodo selecionado.
- Data/hora de geracao.
- Cards resumo.
- Ponto de equilibrio.
- Grafico de evolucao ou resumo equivalente.
- Composicao de despesas.
- Tabela detalhada.

Se a tabela for longa, paginar corretamente e nao cortar linhas no meio da pagina.

Nomes de arquivo sugeridos:

- `DRE_Artec_2026_AnoInteiro.pdf`.
- `DRE_Artec_2026_07_MesAtual.pdf`.
- `DRE_Artec_2026_T1.pdf`.
- `DRE_Artec_2026_Customizado.pdf`.

Se a stack usar `@react-pdf/renderer`:

- Criar documento PDF com componentes proprios do react-pdf.
- Nao tentar reutilizar CSS do DOM.
- Garantir que textos e valores estejam dentro de `<Text>`.
- Garantir tabelas e graficos com fallback compativel.
- Se graficos nao forem compativeis, gerar imagem do grafico ou resumo tabular no PDF.

Se a stack usar rota/API para gerar PDF:

- Verificar se a API recebe o periodo correto.
- Verificar se os dados chegam no backend.
- Verificar se HTML enviado ao gerador nao esta vazio.
- Verificar se assets/CSS sao acessiveis no ambiente de geracao.
- Retornar erro claro quando nao houver dados, em vez de PDF branco.

## 10. Modal De Exportacao

- Manter opcoes: mes atual, trimestre, ano inteiro e intervalo customizado.
- Para intervalo customizado, mostrar data inicial e data final.
- Validar se data inicial <= data final.
- Mostrar descricao: "Sera gerado um PDF com resumo, graficos e tabela detalhada do periodo selecionado."
- Mostrar loading no botao: "Gerando PDF...".
- Desabilitar botao durante geracao.
- Em sucesso, fechar modal ou mostrar feedback.
- Em erro, exibir mensagem clara.

## 11. Responsividade

Garantir funcionamento em desktop grande, notebook 1366px, tablet e mobile.

No desktop:

- Evitar conteudo estreito demais no centro com muito espaco vazio lateral.
- Usar largura maxima confortavel e aproveitar melhor telas grandes.
- Cards podem ficar em grid.
- Graficos devem ter altura adequada.

No mobile:

- Cards empilhados.
- Graficos com rolagem horizontal se necessario.
- Tabela com scroll horizontal ou versao resumida.

## 12. Acessibilidade

- Usar contraste adequado.
- Nao comunicar positivo/negativo apenas por cor.
- Adicionar labels, aria-labels e titles quando necessario.
- Garantir navegacao por teclado no modal.
- Fechar modal com Escape.
- Foco inicial no modal ao abrir.
- Retornar foco ao botao "Exportar PDF" ao fechar.

## 13. Formatacao Brasileira

Padronizar:

- Moeda: `R$ 22.029,00`.
- Percentual: `58,6%`.
- Datas: `DD/MM/AAAA`.
- Meses: `jan/2026`, `fev/2026`, `mar/2026`.
- Valores negativos: `-R$ 10.196,13`.
- Evitar misturar `R$ 0,00` com `R$ -15 mil` de forma confusa no grafico.

## 14. Dados E Calculos

Criar ou revisar funcoes utilitarias para:

- `totalReceitas`.
- `totalDespesas`.
- `resultadoLiquido = receitas - despesas`.
- `margemLiquida = resultadoLiquido / receitas`.
- `coberturaDespesas = receitas / despesas`.
- `gapEquilibrio = despesas - receitas`.
- `percentualCategoriaSobreReceita`.
- `percentualCategoriaSobreDespesas`.
- `variacao contra periodo anterior`.
- `agrupamento por mes`.
- `agrupamento por categoria`.
- `top categorias + outros`.

Evitar divisao por zero. Se receita for zero, mostrar "-" em percentuais que dependem da receita.

## 15. Estados

Implementar ou melhorar:

- Loading skeleton nos cards, graficos e tabela.
- Empty state quando nao houver dados no periodo.
- Error state quando falhar carregamento.
- Empty state especifico para busca/filtro sem resultado.
- Estado de geracao do PDF.

## 16. Criterios De Aceite Obrigatorios

A tarefa so estara concluida se:

- A pagina DRE continuar carregando sem erro.
- Os cards exibirem valores corretos.
- O grafico nao ficar visualmente enganoso com poucos meses.
- A composicao de despesas mostrar valor e percentual de forma clara.
- A tabela continuar filtravel e legivel.
- O botao "Exportar PDF" gerar PDF com conteudo visivel.
- O PDF nao sair em branco.
- O PDF respeitar o periodo selecionado no modal.
- O PDF incluir titulo, periodo, cards, graficos/resumo e tabela.
- Nao houver erro no console durante carregamento e exportacao.
- Build, lint e testes do projeto passarem, se existirem scripts disponiveis.
- A solucao for compativel com o padrao visual atual do sistema.

## 17. Testes Manuais

- Abrir pagina DRE.
- Testar filtro de mes.
- Testar busca por categoria.
- Testar filtros avancados.
- Exportar PDF com mes atual.
- Exportar PDF com trimestre.
- Exportar PDF com ano inteiro.
- Exportar PDF com intervalo customizado.
- Conferir se o PDF nao esta branco.
- Conferir se valores do PDF batem com os valores da tela.
- Testar periodo sem dados.
- Testar resultado positivo, negativo e zerado, se houver mocks/dados possiveis.
- Testar em largura 1366px e desktop grande.

## 18. Entrega Esperada

Ao finalizar:

- Liste os arquivos alterados.
- Explique resumidamente o que foi mudado.
- Explique a causa provavel do PDF em branco encontrada no codigo.
- Explique como a correcao evita novo PDF em branco.
- Informe comandos executados, como build, lint ou test.
- Se algum ponto nao puder ser implementado por falta de dados ou limitacao da stack, deixe isso claro e proponha proximo passo.

## Prioridade

1. Corrigir PDF branco.
2. Melhorar clareza dos KPIs e ponto de equilibrio.
3. Melhorar grafico de evolucao mensal.
4. Melhorar composicao de despesas.
5. Melhorar tabela e filtros.
6. Ajustes finos de responsividade e acessibilidade.
