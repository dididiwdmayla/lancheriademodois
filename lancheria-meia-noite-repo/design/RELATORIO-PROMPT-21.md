# RELATÓRIO — Prompt 21

## Feito

### 1. Transições entre telas

- `lib/transicoes.ts` guarda a tabela inteira e é a **única cópia dos números**. O CSS lê a
  duração de `--tr-ms`, escrito pelo JS antes de cada troca; `app/globals.css` não tem
  nenhuma duração de transição escrita à mão. O QA lê a tabela do próprio arquivo em vez de
  repetir os valores.
- As oito trocas, com os movimentos pedidos: cardápio → raio-x (240ms, cresce do retângulo
  do cartão tocado), raio-x → cardápio (200ms, encolhe de volta para o cartão), abrir
  carrinho (220ms, sobe da base), fechar carrinho (180ms, desce), folha de ingredientes
  (200ms, sobe da base sobre o raio-x), confirmação (220ms, entra pela direita) e voltar da
  confirmação (180ms, sai pela direita). A grade do cardápio reencaixa na troca de filtro
  com 20ms entre itens e 200ms do primeiro ao último — a duração de cada item sai da conta
  `200 − 20 × (n − 1)`, então o total é fixo qualquer que seja a quantidade de lanches.
- **Nenhuma é só opacidade.** A entrada e a saída do raio-x são corte puro (`clip-path`
  crescendo e encolhendo), sem fade nenhum: a primeira versão tinha uma rampa de opacidade
  e o cardápio aparecia através do raio-x no meio do caminho. As folhas deslizam. Os passos
  do pedido deslizam. A opacidade só aparece nas cortinas de escurecimento, que não são
  tela, são sombra.
- Onde existe View Transitions API, é ela quem anima, e os nomes (`view-transition-name`)
  são **ligados só enquanto a troca que precisa deles acontece** — nome solto aparece em
  transição errada. As telas de trás ficam firmes com `tr-segura`, senão o navegador aplica
  o cross-fade padrão de 250ms, que estoura o teto e é justamente o fade puro proibido.
  Onde não existe, as mesmas keyframes rodam nos elementos reais sob `html:not([data-vt])`:
  entrada depois da mudança de estado, saída antes dela — para o elemento que sai ainda
  existir enquanto sai.
- O retângulo de origem é medido **no instante do toque** e escrito em `--tr-origem-*`. O
  caminho de volta reconsulta o elemento guardado (`WeakRef`) porque a página pode ter
  rolado no meio, e só cai no retângulo memorizado quando o elemento saiu do DOM — o caso
  da linha do carrinho, que some quando o carrinho fecha. Todo caminho que abre o raio-x
  passa origem: cartão do cardápio, linha do carrinho, "Modificar lanche" da barra, gancho
  do bacon e "Começar a montar".
- `prefers-reduced-motion`: `transicionar()` nem chega a abrir uma view transition — muda o
  estado e pronto. O CSS tem o cinto correspondente nos pseudos.

### 2. O mascote

- `components/letreiro/Mascote.tsx`: o desenho e o olhar, num arquivo só.
- Ele é **pintura**, não personagem. Na intro, o letreiro ganhou a tabuleta que faltava: o
  `viewBox` do `#lt-svg` cresceu para baixo (800 → 1170) e **nenhuma coordenada da caixa de
  acrílico mudou** — os dois postes que já desciam do letreiro agora encostam numa tabuleta
  pintada, com o mascote à esquerda e "DAS 18H / ÀS 4H" à direita, em tinta. No rodapé, a
  placa cresceu para a direita (`viewBox` 340 → 470) com as letras exatamente onde estavam,
  e o mascote pintado ao lado delas. No carrinho vazio ele vem na mesma linguagem: uma
  tabuleta pequena, não um personagem solto.
- Paleta: `--latao` nos pães e na carne, `--osso` no recheio e nos olhos, `--traco` no
  traço, `--borra` na pupila. **Nenhum `--letreiro` encosta nele** — ele é comida; a luz
  fria é da placa. Sem sombra, sem brilho, sem contorno de adesivo, sem filtro SVG.
- **No raio-x ele não existe no DOM.** O contexto `RaioXAberto` faz o componente devolver
  `null`, e com isso ninguém se inscreve no laço do olhar.
- Olhar: um `requestAnimationFrame` só para todos os mascotes da tela. Desktop segue o
  cursor com peso; celular olha o toque e vai à frente do deslize (velocidade × 110ms); em
  repouso escolhe entre o que se toca, o que custa e a saída da tela, e em 30% das vezes
  olha de volta para quem está olhando. Só a pupila se move.
- Com `prefers-reduced-motion` ninguém se inscreve: as pupilas nunca recebem `transform` e
  ficam olhando para frente.

### Verificação executada

`npm test`: 56 regras aprovadas. Build de produção aprovado, TypeScript incluído.

`npm run qa` acrescenta `scripts/qa-prompt21.mjs`, com 30 asserções novas — 142 asserções
aprovadas no total. As quatro pedidas:

```
ok P21: nenhuma duração declarada acima de 240ms (maior: 240ms)
ok P21: nenhuma transição medida acima de 240ms — a mais longa foi 240ms
ok P21: com movimento reduzido nenhuma transição anima (0 animações) e a troca é direta
ok P21: com movimento reduzido os olhos não se mexem (sem-transform → sem-transform)
ok P21: com o raio-x aberto o mascote não existe no DOM (0 encontrados)
ok P21: o raio-x parte do retângulo do cartão tocado — recuos 103/201/387/16px contra o
        cartão em 16,103 173×355 (erro 0,5px)
ok P21: quem anima é o recorte que cresce — tr-cresce-do-cartao, 240ms,
        recorte inset(103px 201px 387px 16px round 3px) (erro 0,0px contra o cartão)
```

A medição de duração não confia na tabela: um observador amostra `document.getAnimations()`
quadro a quadro durante cada troca e cobra `atraso + duração` de tudo que estiver rodando,
pseudos de view transition inclusive. O retângulo é conferido duas vezes — contra as
propriedades da raiz e contra o primeiro quadro da keyframe, lido pela API de animação.

A queda sem View Transitions API é testada de verdade: um contexto com
`delete Document.prototype.startViewTransition` confere que a entrada e a saída continuam
animando nos elementos reais, dentro do mesmo teto.

Recortes em 390px na folha de contato: letreiro da intro com o mascote, letreiro do rodapé
com o mascote, carrinho vazio, e três quadros da transição cardápio → raio-x (30ms, 110ms e
200ms de 240), capturados com as animações pausadas.

## Não feito

- **Fechar a folha de ingredientes escolhendo um ingrediente não tem transição de tela.** A
  view transition congela a página, e nesse toque o que precisa se mover é a camada entrando
  na pilha — a folha só sai da frente. Os outros três fechamentos (o ×, o Escape, o toque
  fora) têm os 180ms.
- **Selar na chapa continua sem transição de tela.** O salto de 640ms já é a transição
  daquele caminho, e ele desenha clones no documento; uma view transition os congelaria.
- Não testei em Safari nem em Firefox. A queda foi exercitada removendo a API no Chromium,
  que prova o caminho do código, não o resultado naqueles motores.
- Não há teste automático do ritmo do repouso nem da piscada. O QA prova que a pupila segue
  o cursor e que ela para com movimento reduzido; "não parece nervoso" foi julgado a olho.

## Adiado

- Quatro asserções seguem falhando **desde antes deste prompt**, idênticas na `main`:
  `x-tudo` bate no piso de escala e rola o painel; `div.trilho-palco` e `div.trilho-pilha`
  estouram a caixa em 390px e 900px; `p.sr-only` conta como estorvo horizontal; e o primeiro
  item do cardápio passa 0,5px da barra do pedido. Nenhuma delas pertence a este prompt e
  nenhuma foi tocada aqui — mas elas continuam vermelhas e precisam de uma rodada própria.
- O `aria-label` do letreiro da intro passou a mencionar o horário da tabuleta. Se a casa
  mudar de horário, hoje são três lugares com o mesmo dado (`casa.ts`, o rodapé e a pintura
  do SVG). Unificar isso é trabalho de quando o template virar produto no Radar.

## Risco

- **O mascote ficou charmoso, não infantil — mas por pouco, e a margem é do desenho, não da
  sorte.** As duas primeiras versões erraram: a primeira lia como bolinho (cúpula alta, base
  fina, carne escura sumindo no fundo escuro), a segunda como emoji (olho redondo branco com
  pupila preta no meio). O que trouxe ele para o lugar certo foi o olho de amêndoa, a boca
  curta e torta, e resolver a carne com linha em vez de tinta escura — `--traco` sobre
  `--borra` abria um buraco no meio do lanche. Se alguém mexer em qualquer um desses três,
  ele volta a escorregar para o infantil.
- **Ele conversa com o resto do site pela tabuleta, não por si.** Um hambúrguer de desenho é,
  por natureza, outro registro que o resto do projeto — que é seco, fotográfico e de
  engenharia. O que o segura é o mascote nunca aparecer solto: ele está sempre pintado numa
  placa, e a placa é um objeto que o site já tinha. É por isso que ele não entra no raio-x, e
  é por isso que no carrinho vazio ele vem com moldura em vez de flutuando. **Se você quiser
  cortar, corte a tabuleta da intro primeiro** — o rodapé e o carrinho vazio custam pouco e
  ganham; a intro é onde o desenho compete com a peça mais forte do site.
- Cinco elementos ganharam `view-transition-name` condicional. Nome de view transition tem
  de ser único no documento no instante da captura: se alguém repetir um nome dessa lista em
  outro lugar, a transição inteira é abortada pelo navegador, silenciosamente. Os nomes moram
  todos juntos num bloco só do `globals.css` por causa disso.
- A mudança de estado agora acontece um quadro depois do clique, dentro do
  `startViewTransition`. Isso já cobrou duas asserções do QA que liam o DOM logo depois de
  `click()` — as duas foram corrigidas esperando o seletor, que é o certo. Qualquer teste
  novo que leia o DOM imediatamente depois de um clique que troca de tela vai bater no mesmo
  ponto.
- A tabuleta deixou o letreiro da intro 46% mais alto. Cabe em 390 × 844 e em 1280 × 860
  (asserção nova cobre os dois), mas numa viewport muito baixa e larga o `62vh` do
  `.intro-letreiro` é quem segura — se alguém aumentar esse teto, a placa encosta no botão
  de pular.

---

RELATÓRIO
Feito:     as oito transições de tela com teto de 240ms, a reacomodação escalonada da grade,
           a queda sem View Transitions API, e o mascote pintado nas três placas com olhar,
           repouso e piscada — mais 30 asserções novas no QA.
Não feito: transição ao escolher ingrediente na folha e ao selar na chapa (as duas com
           motivo acima); nenhum teste em Safari ou Firefox; ritmo do repouso julgado a olho.
Adiado:    as quatro asserções vermelhas herdadas da main, que precisam de rodada própria; e
           unificar o horário da casa, que hoje está em três lugares.
Risco:     o mascote depende de três decisões de desenho para não virar infantil, e só
           conversa com o site enquanto estiver pintado numa placa — se for para cortar,
           corte o da intro primeiro.

## Decisões — o ritmo do olhar

Todos os números estão em `Mascote.tsx`, no bloco "O olhar".

- **Perseguição com peso 0,085 por quadro de 60Hz**, normalizada por `dt` para 120Hz não dar
  um olho mais rápido. Dá cerca de 200ms para cobrir 80% da distância: atraso que se percebe
  como massa, não como travamento.
- **Fixação de 1,5s a 3,3s**, sorteada a cada troca. Abaixo de 1,4s vira varredura; acima de
  3,5s ele parece desligado. E dois pontos seguidos a menos de 60px um do outro são
  descartados — pular 30px de nada é tique, não olhar.
- **Alvos plausíveis**: o que se toca (`Adicionar`, `Abrir pedido`, `Entrar no cardápio`,
  `Fechar`), o que custa (os preços), e a saída da tela. Em 30% das trocas ele olha de volta
  para quem está olhando — pupila centrada, sem alvo. Em 14% olha para fora da borda.
- **Piscada de 2,7s a 7,3s**, irregular por sorteio a cada piscada, e 18% delas viram piscada
  dupla com 95ms entre as duas. Ritmo fixo parece máquina; o intervalo largo é o que impede
  a piscada de virar um tique visível.
- **A piscada dura 130ms**, triangular: fecha em 65ms, abre em 65ms, e para em 7% de abertura
  em vez de zero — pálpebra que fecha de todo some do desenho por um quadro e pisca preto.
- **O ponteiro manda por 1,1s depois do último movimento.** Menos que isso e o olho larga o
  dedo cedo demais no meio de um deslize; mais e ele fica parado depois que a pessoa já
  soltou.
- **A pupila anda no máximo 6,2 de 16 unidades do branco do olho**, e o eixo vertical é
  achatado em 28%: olho de gente anda mais na horizontal, e pupila colada na aresta lê como
  susto, não como olhar.
