# Prompt — carrinho, seções e o deslize que prensa

Três blocos. O terceiro é o que diferencia o site, então leia inteiro antes de começar.

---

## 1. O carrinho

A barra do pedido, que hoje só conta e soma, passa a abrir.

**Fechada:** contagem, total e o botão de abrir. Continua fixa e sempre visível.

**Aberta:** uma folha que sobe cobrindo até 85% da viewport, com a lista do pedido.

Cada linha do pedido leva:
- o ícone do lanche em ~64px
- o nome e a composição resumida numa linha
- quantidade com menos e mais
- **Modificar**, que abre o raio-x montado com aquele pedido
- remover

Alterar quantidade não anima salto. O salto é só para item novo.

Ao final da lista: subtotal, e o botão de fechar pedido.

**Fechar pedido não é checkout.** Esta é uma lancheria de esquina — o pedido sai por
WhatsApp com o resumo montado. O botão abre um resumo em texto pronto para enviar, e abaixo
dele as formas de pagamento aceitas em uma linha seca: dinheiro, Pix, débito e crédito. Sem
bandeira, sem ícone de cartão, sem selo de segurança.

## 2. Bebidas e acompanhamentos

Duas seções novas, abaixo do cardápio de lanches.

**Bebidas:** refrigerante lata, guaraná, suco de laranja, água, milkshake.
**Acompanhamentos:** batata frita, batata com cheddar e bacon, anéis de cebola.

**Não temos foto de nenhum dos dois ainda.** Não gere placeholder, não use foto de lanche
no lugar, não invente arquivo. Monte as duas seções com peça tipográfica: nome grande em
Fraunces, preço em Plex Mono, fundo em `--fumo` com uma das macros a 10% de opacidade. Deixe
o campo `icone` preparado e vazio — eu mando as imagens depois.

Uma peça tipográfica bem feita é melhor que uma foto errada, e essas duas seções vão ficar
boas assim mesmo se as fotos demorarem.

## 3. Os ganchos

Aparecem dentro do carrinho aberto, nunca no meio do cardápio. Um por vez, no máximo dois
no pedido inteiro. Regras:

- pedido sem bebida → sugere uma bebida
- pedido sem acompanhamento e com dois ou mais lanches → sugere batata
- prensado sem bacon no pedido → sugere adicionar bacon **àquele lanche**, e tocar abre o
  raio-x já com o bacon posicionado, à espera de confirmação

O texto é seco e específico: "Sem bebida?" e não "Que tal completar sua experiência?".
Se a pessoa dispensar um gancho, ele não volta na mesma sessão.

---

## 4. O deslize que prensa

Esta é a parte que diferencia o site. Leia com atenção.

### O trilho

As seções de **Destaques**, **Sugestões**, **Bebidas** e **Acompanhamentos** deixam de ser
grade e viram trilho horizontal com encaixe — um item por vez ocupando o centro.

O cardápio principal **continua grade**. Ele é o caminho rápido e não se mexe.

### A regra

**O item no centro do trilho está prensado. Os que estão fora do centro estão abertos.**

Conforme o dedo arrasta, o item que entra no centro fecha e o que sai abre. A transição
acompanha a posição do dedo, não é um estado que troca no fim — arrastar meio caminho deixa
o item meio prensado.

Use exatamente a mecânica que já existe:

```
t = 0 no centro do trilho, 1 na borda do foco
espacamento = espacamento_explodido × (0.30 + 0.70 × t)
recheio: scaleX(1.14 − 0.14 × t)  scaleY(0.80 + 0.20 × t)
```

Em `t = 0` o item está exatamente no estado prensado que a gente já calibrou. Em `t = 1`,
exatamente no explodido. É a mesma função, só que dirigida pelo gesto em vez do relógio.

Isso resolve identificação sem precisar de borda, sombra ou destaque de cor: só um item
está fechado, e ele é o escolhido. Nenhum outro site de comida consegue fazer isso, porque
depende de ter cada ingrediente como camada separada.

Nos trilhos de bebida e acompanhamento, que não têm camadas, o item central recebe um
realce discreto de escala e o resto fica a 70% de opacidade.

### Custo

Só o item central e os dois vizinhos ficam montados por camada. O resto do trilho usa o
ícone estático. Sem isso, um trilho de dez itens carrega cem imagens.

Sob `prefers-reduced-motion`: sem interpolação. O item central aparece prensado, os outros
abertos, e a troca é instantânea.

## 5. O filtro por ingrediente

Acima da grade do cardápio, um trilho horizontal com as **silhuetas das camadas** —
`bacon`, `ovo`, `calabresa`, `milho`, `batata-palha`, `queijo-ralado`, `frango-desfiado`,
`carne`.

Cada uma é o próprio PNG da camada, pequeno, sobre `--fumo`. Tocar filtra a grade para os
lanches que contêm aquele ingrediente. Multi-seleção permitida, e o filtro ativo fica com
contorno em `--letreiro`.

É como gente com fome escolhe de verdade: não pelo nome do lanche, e sim pelo que quer
comer. E aproveita assets que já estão carregados.

Mantenha o filtro de forma — Prensados · Redondos · Monte o seu — separado deste. São dois
eixos diferentes e não devem virar um só.

---

## O que não muda

O letreiro e a intro. O salto com desmonte em cascata. A prensa. A gravidade do redondo. O
medidor com preço, contagem e barra sem unidade. A regra de temperatura. O mono restrito ao
medidor e aos preços.

---

Entregue tudo de uma vez. Termine com o RELATÓRIO nos quatro campos. No **Risco**, me diga
se o deslize que prensa mantém 60fps num trilho com três itens montados por camada, e o que
acontece quando a pessoa arrasta rápido demais.
