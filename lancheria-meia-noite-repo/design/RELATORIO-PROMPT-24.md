# RELATÓRIO — Prompt 24

Base: `4c02acb7eca544c70808e87b057a633dc96bca02`, main de `dididiwdmayla/lancheriademodois`.
Implementação em `lancheria-meia-noite-repo`. O Radar (`creatingmk1`) foi consultado para
identificar o contrato de integração; sua skin atual de lancheria não foi substituída.

## Feito

- Quatro identidades sobre o mesmo balcão: `/temas/meia-noite.ts`, `diner.ts`, `pratico.ts`,
  `cantina.ts` e seleção/tipos em `index.ts`. Meia-Noite permanece o padrão.
- Tema aplicado no servidor, antes do HTML visível, com contexto compartilhado. As seis
  cores são mapeadas para os nomes históricos usados pelos componentes: `base → --borra`,
  `superficie → --fumo`, `traco → --traco`, `texto → --osso`, `quente → --latao`,
  `frio → --letreiro`. Nenhuma cor genérica de destaque.
- Fontes locais com licenças OFL: nove WOFF2, 436.344 bytes no conjunto. Cada visita
  solicita apenas as famílias ativas. Fraunces mantém os eixos completos; Archivo mantém
  `wdth` e `wght`. Prático carrega exclusivamente Inter; Cantina, Playfair Display e Lora.
- Mascote ampliado na tabuleta da intro, no rodapé e no hero. Na largura 390px, a cabeça
  mede **128,1px** em Meia-Noite e Diner (32,8% da tela). O recorte limita os braços ao
  espaço fora do título. A caixa é absoluta e não aumenta a faixa do hero.
- Aviso com o texto exato solicitado após a primeira reordenação válida da sessão.
  Dura sete segundos ou até o toque. Botões, teclado e arrasto usam a mesma função;
  tentativa inválida não consome o aviso. A chave persiste ao reabrir/recarregar e é a
  mesma nos quatro temas. Com storage indisponível, há proteção em memória nesta página.
- Placa do Diner com as duas faces, giro de entrada, pequeno balanço de assentamento e
  transição ao mudar o estado. Compartilha um único relógio com “Está aberto?” e usa
  a função existente, no fuso da casa. Toldo da Cantina desenrola por `scaleY`.
- Prático sem intro nem hero: lista com foto de 88px à esquerda, preço destacado e
  adicionar à direita. “Personalizar” aparece depois de adicionar, inclusive na barra
  e no carrinho. Transições de tela em 120ms; prensa e salto conservam os seus tempos.
- Medição sempre fria, inclusive na barra de limite. O aviso de risco conserva o calor
  em um elemento separado, conforme a regra mais estrita desta rodada.

### Verificação executada

| Verificação | Resultado |
|---|---|
| Build de produção e TypeScript | Aprovados; rota principal 35,8kB, primeiro JS 138kB |
| Regras de dados, preço, geometria, horário, fontes e temas | 57 aprovadas |
| Chromium headless, produção | 107 asserções, zero falhas |
| Movimento estático | 36 arquivos, 20 keyframes, 14 transitions; somente transform/opacity |
| Quatro cardápios, fontes reais e cores computadas | Aprovados |
| Toque e overflow | Aprovados em 390×844, 320×740 e 1280×900; raio-x em 390×844 |
| Aviso | Primeira mudança, expiração, toque, arrasto real e reload verificados |
| Placa do Diner | FECHADO às 17:59; ABERTO às 18:00 junto ao horário; fecha após 04:00 |
| Movimento reduzido | Placa e toldo mantêm o estado sem animação |
| Mascote no raio-x | Zero elementos nos quatro temas |
| Fotos | 54 originais comparados byte a byte; nenhuma nova |

O teste de horário preserva a regra existente: 04:00 ainda conta como aberto; 04:01,
fechado. Esta rodada não muda o horário comercial.

`prensa.ts`, `sombra.ts`, `salto.ts`, `baselines.json`, `camadas.ts`, `fixos.ts` e `casa.ts`
são idênticos à base. A prensa continua em 340ms, espaçamento 0,30, espalhamento 1,16–1,30,
achatamento 0,80, teto de afundamento 0,55 e salto de 640ms. A caixa disponível pode variar
alguns pixels com a tipografia de cada tema; a escala continua calculada pelo mesmo motor.
Não foram alteradas sombras, contratos, limites, preços ou fechamento por WhatsApp.

| Tema | Itens completos na primeira tela de 390×844 | Altura do primeiro cartão/linha |
|---|---:|---:|
| Meia-Noite | 2 | 304,8px |
| Diner | 2 | 297,0px |
| Prático | **4** | **113,0px** |
| Cantina | 1 | 310,4px |

Contagem feita sem rolagem, depois da entrada, exigindo o cartão inteiro acima da barra
inferior. Não conta itens cortados. As seis composições do cardápio continuam compartilhadas.

### Recortes entregues

[Comparação dos quatro](../qa/prompt-24/folha-de-contato.jpg).

| Tema | Cardápio em 390px | Raio-x em 390px | Hero |
|---|---|---|---|
| Meia-Noite | [Cardápio](../qa/prompt-24/meia-noite-cardapio.jpg) | [Raio-x](../qa/prompt-24/meia-noite-raio-x.jpg) | — |
| Diner | [Cardápio](../qa/prompt-24/diner-cardapio.jpg) | [Raio-x](../qa/prompt-24/diner-raio-x.jpg) | [Placa](../qa/prompt-24/diner-hero.jpg) |
| Prático | [Cardápio](../qa/prompt-24/pratico-cardapio.jpg) | [Raio-x](../qa/prompt-24/pratico-raio-x.jpg) | Sem hero |
| Cantina | [Cardápio](../qa/prompt-24/cantina-cardapio.jpg) | [Raio-x](../qa/prompt-24/cantina-raio-x.jpg) | [Toldo](../qa/prompt-24/cantina-hero.jpg) |

A pasta contém também as quatro capturas da entrada, os resultados em texto/JSON e a
captura do handshake. Imagens em escala 1; as finais vêm do build de produção.

## Não feito

Os itens de implementação e os recortes solicitados nesta rodada foram concluídos.
Publicação no catálogo e implantação do Radar não foram executadas: o prompt pede a
seleção provisória até a futura injeção do tema. Não foi feita medição de FPS/CPU,
que não integra a verificação pedida no Prompt 24.

## Adiado

Na fase de integração com Radar: adaptar `SkinDefinition`/`Theme`, fornecer `Tema` no
servidor e remover o parâmetro provisório da revisão. O mapeamento precisa manter os dois
papéis de cor; não converter tudo para um único destaque. Pendências anteriores do PLAN
sobre primeiro quadro desktop e composição sintética estreita permanecem registradas.

## Risco

**Diner é o menos distante do original em estrutura**, pois ainda usa a grade de duas
colunas. A placa física, os cartões creme com fio duplo, o slab e as fotos maiores dão
identidade, mas ele é o primeiro candidato a parecer parente do Meia-Noite ao retirar o hero.

**O conjunto lê como quatro identidades no hero e no cardápio.** Prático muda a prioridade
para pedido e densidade; Cantina muda a composição para uma folha de menu e abandona a
monoespaçada. O raio-x revela claramente a família comum: a pilha e os controles ocupam
os mesmos lugares, com outra tipografia e superfície. Isso preserva a familiaridade do motor;
não apresento as quatro telas técnicas como quatro produtos sem parentesco visual.

## Decisões

- **Diner:** nome em slab, subtítulo de lancheria no cabeçalho e fios duplos como referência
  ao cromo. A placa é creme e azul aço, porque aberto/fechado é sistema. Nenhum vermelho
  entra nela. O vermelho fica em preço, CTA e pigmento do mascote.
- **Diner:** a entrada acontece no próprio hero; não há outro bloqueio de tela com o
  letreiro antigo. A placa dá uma volta de entrada e assenta em 900ms; nas mudanças de
  horário, vira em 600ms. Esses são tempos da assinatura, não das trocas de tela. Com
  movimento reduzido ela já aparece na face correta. Não há balanço infinito.
- **Diner:** hero de 208px no celular, placa à esquerda e mascote espiando à direita;
  “Da esquina. Da chapa.” cabe abaixo. A mesma foto Meia-Noite aparece ao lado do título.
  Cartões com fotos mais presentes e fio duplo deixam dois CTAs visíveis na primeira tela.
- **Diner:** os olhos continuam claros com pupilas escuras. Somente os neutros do próprio
  tema são remapeados dentro do desenho; não há pigmento de sistema nem novo asset.
- **Prático:** nome compacto e horário em uma linha acima do cardápio. Foram retirados
  intro, hero e mascotes do DOM. O filtro de forma e o filtro por ingrediente continuam
  separados, porque eliminá-los mudaria a utilidade do motor.
- **Prático:** linha de 113px antes de personalizar, foto de 88px, ingredientes limitados
  a duas linhas e preço em Inter 800. O adicionar é um “+” com nome acessível completo e
  alvo de 44×44px; no desktop o rótulo “Adicionar” aparece por extenso.
- **Prático:** “Personalizar” só surge após incluir o item, abaixo da ação principal;
  recebe 44px de altura mesmo com texto discreto. A grade não tem cascata nem transição
  de filtro. As transições de tela usam 120ms sem View Transitions; os movimentos físicos
  da prensa e do salto seguem compartilhados.
- **Cantina:** marca centralizada, moldura de tons de papel e madeira e toldo de terracota
  com papel mais escuro. Não há combinação de verde, branco e vermelho no toldo. O pano
  desenrola uma vez em 650ms e permanece como moldura, sem intro adicional.
- **Cantina:** “Pão, recheio. E boa mesa.”, foto existente junto ao hero e cardápio em uma
  coluna no celular, duas no desktop. Fio duplo interno faz o cartão parecer folha de
  menu. Foto central maior, ingredientes por extenso e preço ao lado do nome dão o ritmo
  mais solto; o CTA em contorno terracota conserva o papel quente.
- **Cantina:** Playfair nos títulos e Lora em corpo, medidor, preços e carimbos. Algarismos
  antiquários e proporcionais substituem os tabulares. Até o fallback de medida é serifado;
  nenhuma monoespaçada é registrada ou baixada.
- **Compartilhado:** os ajustes de superfície e raio chegam ao carrinho, campos e raio-x.
  O aviso de reordenação fica junto ao painel, em texto normal com fio quente, e cobre
  também a primeira mudança pelos botões de composição.

## Como testar

Com o servidor em execução:

- `/?tema=meia-noite`
- `/?tema=diner`
- `/?tema=pratico`
- `/?tema=cantina`

Recarregue ao trocar o parâmetro. Slug inválido volta para Meia-Noite. `TEMA` no ambiente
pode selecionar o padrão da implantação; sem valor, permanece Meia-Noite. Os componentes
recebem o objeto pelo `ProvedorTema`; o CSS e as fontes vêm do layout no servidor.

```sh
npm install
npm test
npm run qa:motion
npm run build
QA_PRODUCTION=1 npm run qa:temas -- --serve
```

Se o Chromium não estiver no caminho padrão do Playwright, forneça
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. `--serve` inicia o servidor junto ao navegador,
necessário no ambiente desta execução. O teste de imutabilidade usa a referência base
`4c02acb`, que deve estar disponível no clone.
