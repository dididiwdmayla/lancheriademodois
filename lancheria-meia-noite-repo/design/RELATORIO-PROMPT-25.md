# RELATÓRIO — Prompt 25

Base: `bb259e46ff0a1145bdab8bbd2023880e55bd144d`, main após o merge do Prompt 24.
Implementação em `lancheria-meia-noite-repo`.

## Feito

Os quatro cardápios atingem a meta na primeira tela de **390 × 844**, sem rolagem.

| Tema | Rodada 24 | Meta | Agora | Primeiro item | Último item termina em |
|---|---:|---:|---:|---:|---:|
| Meia-Noite | 2 | ≥ 3 | **4** | 177,9px de altura | 754,8px |
| Diner | 2 | ≥ 6 | **6** | 225,5px de altura | 760,6px |
| Prático | 4 | ≥ 4 | **4** | 113,0px de altura | 669,5px |
| Cantina | 1 | ≥ 4 | **4** | 111,3px de altura | 756,0px |

A contagem exige o artigo inteiro acima do início real da barra de pedido, em **769px**.
Esse limite é medido pelo DOM; substitui a estimativa de 70px usada na rodada anterior.
Fontes e imagens terminam de carregar antes da medição. As quatro contagens anteriores
continuam iguais ao aplicar o limite mais estrito.

- Cantina: folha única de papel com nome e preço ligados por pontilhado, ingredientes
  completos, fotos de 64px e pauta entre linhas. Uma coluna no celular, duas no desktop.
- Diner: painel com três colunas no celular e cinco no desktop. Fotos quadradas, nome e
  preço em Alfa Slab One; fio duplo envolvendo o conjunto. O filtro inicial “Todos”
  mostra os quatro prensados e os dois redondos já existentes. Os filtros de forma e
  ingrediente continuam funcionando juntos.
- Meia-Noite: dois cartões por linha no celular, fotografia em uma faixa menor,
  ingredientes em uma linha e preço junto ao adicionar na base do cartão. Hero com teto
  de `30dvh`, altura de 168px no celular e até 270px no desktop.
- Prático: mesma entrada, lista, fontes, fotos de 88px e ações. Os quatro pares de
  coordenadas e alturas são exatamente iguais aos registrados no Prompt 24.

### Verificação

| Verificação | Resultado |
|---|---|
| Build de produção e TypeScript | Aprovados; rota principal 36kB, primeiro JS 138kB |
| Regras de preço, dados, geometria e cores | 57 testes aprovados |
| QA de densidade e estrutura, Chromium 153 | 128 asserções, zero falhas |
| Regressão dos temas, com movimento normal | 107 asserções, zero falhas |
| Movimento estático | 36 arquivos, 20 keyframes e 14 transitions; somente transform/opacity |
| 320 × 740 | Nenhum overflow horizontal ou controle abaixo de 44px nos quatro temas |
| Estados em 320px | Cardápio, montagem livre, item adicionado e raio-x verificados |
| Nome longo na Cantina | Três linhas em 390px e quatro em 320px; preço inteiro e pontilhado ≥ 12px |
| Nomes do Diner | Inteiros em 390px e 320px, sem reticências ou recortes |
| Quente/frio | Preços quentes e medições frias, inclusive no raio-x |
| Fontes | Prático somente Inter; Cantina somente Playfair Display e Lora |
| Aviso de reordenação e assinatura | Primeira mudança, arrasto, reload, expiração e placa pelo horário preservados |

**53 arquivos de motor, pedido, contratos, temas e fontes foram comparados byte a byte
com a base**, incluindo `prensa.ts`, `sombra.ts`, `salto.ts` e `baselines.json`. Os hashes
completos estão no JSON de resultados. O CSS global também é idêntico à base. Nenhuma
regra do raio-x foi alterada nesta rodada. Os 54 assets fotográficos são idênticos; nenhuma
foto foi gerada, adicionada ou reprocessada. WhatsApp, limites, sombras e salto permanecem
no mesmo motor.

### Recortes e evidência

- [Os quatro cardápios lado a lado, alinhados pelo título](../qa/prompt-25/folha-cardapios.jpg).
- [Primeira tela dos quatro, sem rolagem](../qa/prompt-25/folha-de-contato.jpg).
- [Asserções em texto](../qa/prompt-25/resultados.txt) e [geometria e hashes em JSON](../qa/prompt-25/resultados.json).
- [Regressão dos temas em texto](../qa/prompt-25/regressao-temas.txt).
- [Diner em 320px](../qa/prompt-25/diner-320.jpg) e [Cantina com nome longo em 320px](../qa/prompt-25/cantina-nome-longo-320.jpg).

A pasta também contém cada entrada, cardápio, raio-x e desktop separadamente. A folha
comparativa usa recortes reais de 390 × 844, em escala 1, sem reduzir o navegador para
simular densidade. A captura inicial usa horário fixo às 19h30 de Maringá; a regressão
exercita separadamente as mudanças reais de estado do relógio.

## Não feito

Nenhum item solicitado ficou pendente. Não houve implantação pública nem merge desta
rodada. A integração com o catálogo Radar não faz parte deste ajuste de cardápios.

## Adiado

Permanece a integração futura com o Radar. A seleção por `?tema=` continua provisória,
com Meia-Noite como padrão. As pendências anteriores do PLAN sobre o primeiro quadro
desktop e a composição sintética estreita continuam fora desta rodada.

## Risco

**Os quatro cardápios agora têm estruturas distintas:** cartões editoriais em duas
colunas, painel fotográfico em três, lista de pedido e folha de menu pautada. Na comparação
sem hero, essa diferença continua visível. Os filtros e a barra de pedido ainda revelam
uma família comum. Eu os apresentaria como quatro projetos de cardápio com navegação
compartilhada; o raio-x conserva deliberadamente a identidade do produto.

**O Diner ficou legível em três colunas.** Os cartões medem **112,7px** em 390px, um pouco
menos que os 118px estimados, porque a moldura e os intervalos também ocupam espaço.
Os seis nomes aparecem inteiros em slab de 14px, em até duas linhas. Em 320px, o nome
“Prensado de Calabresa” usa três linhas. Não precisei aplicar reticência, truncar texto ou
reduzir a fonte nesse breakpoint. Manteria as três colunas para o catálogo atual.

O Diner é o mais sensível a futuros nomes compridos. As linhas podem crescer livremente;
a inclusão de nomes maiores pode reduzir a contagem inicial. Abrir o recheio ou adicionar
um lanche também revela conteúdo e aumenta a altura. A meta é da entrada normal com o
catálogo atual, e não de todos os estados expandidos.

## Decisões

- **Cantina — papel contínuo.** Uma superfície única, sem contorno individual, com
  separadores finos em `traco`. A linha começa pelo nome em Playfair e pelo preço em Lora;
  o pontilhado recebe o espaço restante. A foto entra depois, à esquerda dos ingredientes.
- **Cantina — nome longo.** O nome pode encolher e quebrar em linhas; o preço não encolhe.
  O líder pontilhado mantém pelo menos 12px. Nome, líder e preço compartilham a primeira
  linha de base; a receita começa abaixo de toda a altura do nome. Não usei pontos
  digitados, quantidade fixa de caracteres nem posição absoluta.
- **Cantina — leitura e toque.** Nome e preço de 17px, ingredientes de 13px com entrelinha
  de 1,35. Foto 64 × 64px, adicionar de 44 × 44px em contorno terracota. A aparência de
  papel vem da composição, sem textura nova. No desktop, o papel recebe duas colunas
  com um corredor de 28px.
- **Cantina — entrada curta.** Toldo de 20px e hero de 86px no celular. A frase contínua
  “Pão, recheio e boa mesa.” funciona como cabeçalho impresso; a fotografia deixa o hero
  para dar prioridade ao menu. O desenrolar do toldo permanece intacto.
- **Diner — painel de balcão.** Moldura cromada dupla de 4px no conjunto, interior creme,
  janelas quadradas azuis e intervalos de 6px entre colunas. Nenhum cartão recebe uma
  segunda moldura. Nome de 14px e preço de 16px em slab, botão Adicionar por extenso com
  altura mínima de 44px. No desktop, são cinco colunas e tipografia maior.
- **Diner — seis receitas reais.** O estado inicial “Todos” é exclusivo deste tema.
  Deriva da mesma lista FIXOS e respeita o filtro de ingredientes; não duplica contratos,
  receitas nem fotografias.
- **Diner — ingredientes disponíveis.** A foto funciona como abertura nativa de detalhes,
  identificada por “Recheio +”. Toque ou Enter revela a composição completa. A adição
  continua em seu botão próprio; modificar só aparece depois de adicionar.
- **Diner — assinatura preservada.** Hero de 96px, placa de 132 × 68px à esquerda e mascote
  à direita. A frase cabe em uma linha abaixo. A cabeça continua em 128,1px, fora do título,
  assim como no Meia-Noite. A placa segue o mesmo relógio e o mesmo movimento.
- **Meia-Noite — altura útil.** Foto em uma janela de 112 × 56px que elimina margem
  transparente pelo CSS. Nenhum arquivo de imagem foi modificado. O cartão conserva foto,
  título e ingredientes empilhados; preço e botão “+” de 44px dividem o rodapé. O botão
  mantém o nome acessível “Adicionar [lanche]”.

### Reproduzir

```sh
npm test
npm run qa:motion
npm run build
QA_PRODUCTION=1 npm run qa:densidade -- --serve
QA_PRODUCTION=1 npm run qa:temas -- --serve
```

Se o navegador estiver fora do caminho padrão do Playwright, informe
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. O script inicia servidor e navegador no mesmo
processo de execução. A referência `bb259e4` deve existir no clone para comparar a base.
A regressão grava em `qa/regressao-temas`; não sobrescreve as capturas históricas do Prompt 24.
