# Prompt — o prensado

Mudança de direção, e ela é a maior até agora. Leia inteiro antes de mexer em qualquer
coisa.

---

## Por que

O lanche do Paraná não é o hambúrguer redondo. É o **prensado**, e ele nasceu em Maringá:
um dono de carrinho instalou uma chapa de prensa dentro do carrinho, os concorrentes
copiaram, e virou o prato típico da cidade. Hoje existe prensado em Curitiba, Guaratuba,
São José dos Pinhais e até em São Paulo, onde uma casa se chama "O Prensado de Maringá".

O pão é francês, prensado na chapa até ficar firme e crocante. A prensa **sela o pão e
derrete o recheio** — é isso que define o produto, e é isso que o site precisa mostrar.

A lancheria é de esquina em Maringá. Ela vende prensado. O redondo é a exceção.

## Cardápio novo — 4 prensados e 2 redondos

`/data/fixos.ts`

```ts
export const FIXOS = [
  { slug:'prensado-completo',   nome:'Prensado Completo',   forma:'prensado', icone:'/fixos/prensado-completo.webp',
    camadas:['pao-prensado-base','alface','tomate','carne','bacon','calabresa','milho','queijo-ralado','batata-palha','pao-prensado-topo'] },
  { slug:'prensado-frango',     nome:'Prensado de Frango',  forma:'prensado', icone:'/fixos/prensado-frango.webp',
    camadas:['pao-prensado-base','alface','tomate','frango-desfiado','milho','queijo-ralado','pao-prensado-topo'] },
  { slug:'prensado-calabresa',  nome:'Prensado de Calabresa', forma:'prensado', icone:'/fixos/prensado-calabresa.webp',
    camadas:['pao-prensado-base','alface','calabresa','cebola','queijo-ralado','pao-prensado-topo'] },
  { slug:'prensado-meia-noite', nome:'Prensado Meia-Noite', forma:'prensado', icone:'/fixos/prensado-meia-noite.webp',
    camadas:['pao-prensado-base','tomate','carne','bacon','ovo','queijo-ralado','batata-palha','pao-prensado-topo'] },
  { slug:'x-salada', nome:'X-Salada', forma:'redondo', icone:'/fixos/x-salada.webp',
    camadas:['pao-base','alface','tomate','carne','queijo','pao-topo'] },
  { slug:'x-tudo',   nome:'X-Tudo',   forma:'redondo', icone:'/fixos/x-tudo.webp',
    camadas:['pao-base','molho','alface','tomate','carne','presunto','queijo','bacon','ovo','batata-palha','pao-topo'] },
] as const
```

O campo `forma` decide qual par de pães o "monte seu lanche" oferece e como a selagem
anima. O motor do raio-x é o mesmo nos dois.

Os prensados vêm primeiro no cardápio, e o bloco deles é maior. O redondo é a minoria,
visualmente também.

## 7 camadas novas — acrescente a `camadas.ts`

Os arquivos já estão em `/public/camadas/`. O `baselines.json` já foi atualizado e agora
tem 19 silhuetas.

```ts
{ slug:'pao-prensado-base', arquivo:'/camadas/pao-prensado-base.webp', alturaPx:307, afundamento:0,    alturaCm:1.4, pesoG:38, precoCent:0,   obrigatorio:true  },
{ slug:'pao-prensado-topo', arquivo:'/camadas/pao-prensado-topo.webp', alturaPx:315, afundamento:0.30, alturaCm:1.5, pesoG:42, precoCent:0,   obrigatorio:true  },
{ slug:'calabresa',         arquivo:'/camadas/calabresa.webp',         alturaPx:224, afundamento:0.50, alturaCm:1.0, pesoG:45, precoCent:500, obrigatorio:false },
{ slug:'salsicha',          arquivo:'/camadas/salsicha.webp',          alturaPx:330, afundamento:0.50, alturaCm:1.5, pesoG:40, precoCent:450, obrigatorio:false },
{ slug:'frango-desfiado',   arquivo:'/camadas/frango-desfiado.webp',   alturaPx:296, afundamento:0.45, alturaCm:1.4, pesoG:90, precoCent:800, obrigatorio:false },
{ slug:'milho',             arquivo:'/camadas/milho.webp',             alturaPx:202, afundamento:0.50, alturaCm:0.9, pesoG:25, precoCent:250, obrigatorio:false },
{ slug:'queijo-ralado',     arquivo:'/camadas/queijo-ralado.webp',     alturaPx:261, afundamento:0.55, alturaCm:1.2, pesoG:28, precoCent:400, obrigatorio:false },
```

---

## BUG a corrigir — camada fina sendo engolida

Montei um prensado de teste e **o tomate sumiu**. Ele tem 139px; a carne tem 381px e afunda
42% de si mesma, ou seja 160px, e apaga o tomate inteiro.

O `afundamento` não pode ser calculado só sobre a própria camada. Limite pela de baixo:

```
afundamentoEfetivo = min(alturaPx_propria × afundamento,
                         alturaPx_abaixo × 0.55)
```

Nenhuma camada pode sumir. A de baixo sempre mostra pelo menos 45% de si.

---

## "Selar" vira "prensar"

Esta é a parte que muda o clímax, e eu testei os números — use exatamente estes.

Prensar não é assentar com suavidade. É uma prensa: o peso desce, o recheio comprime **e
espalha para os lados**, e o pão de cima encontra o de baixo. Três transformações
simultâneas, em 340ms, com curva de aceleração forte no início e parada seca no fim — sem
mola, sem quique. Prensa de chapa não balança.

**1. Compressão vertical.** O espaçamento entre camadas cai para 30% do que era no
explodido:

```
espacamento_prensado = espacamento_explodido × 0.30
```

**2. Espalhamento do recheio.** Toda camada que **não é pão** recebe `scaleX(1.14)` e
`scaleY(0.80)`. Os dois pães não deformam.

Isso não é enfeite: é o que fecha a fresta entre o pão de cima e o de baixo nas
extremidades. Sem o espalhamento, o recheio é mais estreito que o pão e sobra um vão vazio
nas pontas, e o lanche não lê como prensado. Com ele, o recheio transborda a borda do pão —
que é exatamente o que a foto de um prensado real mostra.

**3. Marca de prensa.** Ao final, as listras douradas de chapa nos dois pães ganham
contraste, subindo uns 15% de opacidade em 200ms. O pão saiu da prensa mais tostado do que
entrou.

### O medidor ganha duas leituras

Este é o melhor detalhe que a mecânica pode ter, e só existe por causa da prensa.

Antes de prensar, o medidor mostra a altura montada. Depois, ele mostra a altura prensada,
e **as duas ficam visíveis lado a lado**:

```
montado   8.5 cm
prensado  3.1 cm
```

O número desce contando, em 340ms, junto com a animação. É um instrumento medindo uma
transformação real, não uma barra que só sobe.

No lanche redondo não há prensa: a selagem continua como está hoje, com o assentamento
suave e a varredura de calor. Só o prensado ganha a prensa e a segunda leitura.

---

## A sacola sai. Entra o embrulho.

A sacola kraft ficou feia e, pior, está errada: prensado não vai em sacola, vai **embrulhado
em papel branco**, entregue na mão.

Desenhe o embrulho em SVG, não use imagem — ele precisa dobrar.

1. Uma folha de papel branco aparece atrás do lanche prensado (180ms).
2. Duas abas laterais dobram sobre ele, uma de cada lado, com 60ms de diferença entre elas.
3. As pontas dobram por baixo e o vinco assenta.
4. O carimbo da comanda cai por cima, em Plex Mono: nome do lanche, altura prensada, preço.

O papel é branco levemente amarelado, com vincos como linhas de 1px e uma leve textura de
fibra. Sem brilho, sem sombra dramática. É papel de lancheria, não embalagem de marca.

Sob `prefers-reduced-motion`: aparece já embrulhado e carimbado.

---

## Copy

A origem do prensado é material de texto e vale usar na seção "A chapa", com a voz seca de
sempre. Fatos, não lenda: nasceu em Maringá, dentro de um carrinho de lanches, quando
alguém instalou uma prensa na chapa. Os concorrentes copiaram. Virou prato típico da cidade
e saiu do estado.

Não escreva "tradição que atravessa gerações" nem nada nessa linha.

---

## O que não muda

O letreiro e a intro. A regra de temperatura. O mono restrito. O `baselines.json` como
fonte das sombras de contato. A navegação cardápio → raio-x → fechamento. O modelo de
estado com instâncias repetidas e o contrato `#rx-camada-{slug}-{n}`.

---

Entregue tudo de uma vez. Se algum ponto não fechar, pare e me pergunte em vez de
improvisar. Termine com o RELATÓRIO nos quatro campos, e no **Risco** me diga o que você
testou na prensa — especialmente se a fresta entre os dois pães fecha em todos os quatro
prensados, e não só no que tem mais recheio.
