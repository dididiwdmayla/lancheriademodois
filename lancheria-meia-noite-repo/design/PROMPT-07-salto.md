# Prompt — o salto, e o "modificar lanche"

Duas mudanças. O embrulho de papel sai.

---

## 1. O embrulho sai. Entra o salto.

O embrulho ficou correto e sem graça. Troque por um salto com desmonte em cascata — o
lanche pula, se abre no ar, e as camadas caem em sequência para fora da tela.

**O destino é a barra do pedido**, no rodapé da viewport. Cair no vazio é bonito uma vez;
cair dentro da barra vira retorno e ainda ensina onde o pedido mora. A barra é fixa,
sempre visível, e mostra a contagem de itens e o total.

### A sequência — 640ms no total

**0–90ms — antecipação.** O lanche prensado comprime: `scaleY(0.86)` e `scaleX(1.04)`,
descendo uns 8px. É o agachamento antes do pulo, e sem ele o salto não tem peso.

**90–200ms — impulso.** Sobe cerca de 12% da altura da viewport, esticando para
`scaleY(1.08)`, com uma rotação leve de 4° para um dos lados. Saída rápida, aceleração
forte.

**200–560ms — a queda e o desmonte.** No topo do arco a pilha se abre. Cada camada passa a
cair por conta própria, com **45ms de atraso entre uma e outra, de baixo para cima** — o
pão de baixo primeiro, o de cima por último.

Cada camada cai com parâmetros próprios e levemente diferentes:
- rotação entre −14° e +14°, sorteada por camada mas estável para o mesmo lanche
- deriva horizontal de até 40px, alternando de lado
- aceleração de gravidade, não velocidade constante

Elas saem pela borda inferior da tela em sequência, não juntas. É a cascata de desenho
animado: cai o pão, depois o queijo, depois a alface, cada um no seu tempo.

**560–640ms — chegada.** A barra do pedido dá um solavanco vertical curto, a contagem
incrementa, e o total sobe contando. Sem confete, sem brilho, sem marca de conferido.

### Regras

- Nada de rastro, borrão de movimento ou partícula. As camadas são fotografias; qualquer
  efeito por cima delas denuncia a montagem.
- A rotação de cada camada é sorteada **uma vez por lanche e memorizada**. Se a pessoa
  pedir o mesmo lanche duas vezes, ele cai igual. Aleatório que muda a cada repetição
  parece defeito.
- Anime `transform` e `opacity` apenas. Nenhuma camada muda de tamanho durante a queda.
- Sob `prefers-reduced-motion`: nada de salto. O item aparece na barra e a contagem
  incrementa.
- Se a pessoa pedir dois lanches em sequência rápida, o segundo salto não espera o
  primeiro terminar. Eles se sobrepõem.

---

## 2. "Modificar lanche" no lugar de raio-x em cada item

Hoje cada item do cardápio carrega o raio-x como função própria, e isso empurra o montador
pra frente de quem só quer comer.

Inverta a ordem:

- **No item da grade:** um botão de adicionar, e mais nada. É o caminho padrão e o único
  visível.
- **Depois de adicionar:** aparece por alguns segundos, junto ao item ou na barra,
  **"Modificar lanche"**. Tocar ali abre o raio-x já montado com a composição daquele
  pedido.
- **Na barra do pedido:** cada item da lista tem "Modificar" ao lado, disponível a
  qualquer momento antes de fechar.

O raio-x deixa de ser uma função anunciada em seis lugares e passa a ser o que ele é: o jeito
de mexer num lanche que já existe.

O "Monte o seu" continua no filtro do topo, como porta própria. Esse sim é anunciado.

---

## O que não muda

O letreiro e a intro. A prensa com `scaleX(1.14) scaleY(0.80)`. A gravidade do redondo em
`0.40` e `scaleY(0.90)`. O medidor com preço, contagem de camadas e a barra sem unidade. A
grade compacta com filtro fixo. A regra de temperatura e o mono restrito ao medidor.

---

## O que vem depois, e que você não deve fazer agora

Carrinho completo, ganchos de "que tal levar também", bebidas e acompanhamentos, formas de
pagamento. Vamos tratar disso na próxima rodada — não antecipe, e não invente placeholder
de nenhum deles.

A única exceção é a **barra do pedido**, que precisa existir agora porque é o destino do
salto. Ela pode ser simples: contagem, total e um botão de fechar pedido que ainda não leva
a lugar nenhum.

---

Entregue tudo de uma vez. Termine com o RELATÓRIO nos quatro campos. No **Risco**, me diga
se o desmonte em cascata mantém 60fps num prensado de 10 camadas e o que acontece quando
dois saltos se sobrepõem.
