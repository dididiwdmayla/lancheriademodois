# Prompt — gravidade, medidas fora, cardápio de fome

Três mudanças. A segunda muda o contrato de dados, então leia inteiro antes de mexer.

---

## 1. O redondo também precisa de peso

Depois de ver o prensado compactado, ficou evidente que o hambúrguer selado continua
frouxo. As camadas flutuam, e num lanche real o peso conecta tudo — não existe ar entre a
carne e o queijo.

Ele não leva prensa, mas leva gravidade. No estado selado do redondo:

```
espacamento_selado = espacamento_explodido × 0.40
```

E as camadas moles — não os pães, não a carne — recebem `scaleY(0.90)`. Sem `scaleX`:
hambúrguer não espalha para os lados, só assenta.

A correção do `afundamento` limitado pela camada de baixo vale para os dois formatos:

```
afundamentoEfetivo = min(alturaPx_propria × afundamento, alturaPx_abaixo × 0.55)
```

---

## 2. As medidas saem

Centímetros e gramas saem do site inteiro. Motivo prático: quando isto virar template, o
dono da lancheria não tem como medir a altura de cada ingrediente, e estimativa errada é
pior que nenhuma.

**Some de `camadas.ts`:** `alturaCm` e `pesoG`. Apague os campos.
**Some do desenho:** as cotas nas linhas de chamada. A linha passa a levar só o nome do
ingrediente.
**Some do medidor:** as leituras de altura e peso, e as duas leituras montado/prensado que
eu tinha pedido no prompt anterior.

`alturaPx` **fica** — ele é o pixel medido do arquivo, não um dado que alguém precisa
preencher, e é o que posiciona a pilha.

### O que o medidor passa a mostrar

Três coisas, todas derivadas de graça:

1. **Preço**, grande, em `--latao`. É o número que importa e o cliente já tem.
2. **Contagem de camadas** — "9 camadas". Derivada da pilha, custo zero.
3. **Uma barra de altura sem unidade.** Ela mede a pilha renderizada em pixels, não
   centímetros. Nenhum número, nenhuma unidade — só a barra.

A barra é o que preserva o instrumento. E ela fica melhor sem número: ao prensar, ela
despenca junto com a animação, e você entende a transformação sem ler nada.

**O aviso "risco de desmontar" passa a ser por contagem:** acima de **10 camadas**. Nada de
limiar em centímetros.

Com isso o Plex Mono passa a viver só no medidor. As linhas de chamada ficam em Archivo.
Continua valendo: mono em nenhum outro lugar.

---

## 3. O cardápio precisa servir gente com fome

Hoje a pessoa entra, vê um hero bonito, rola, e só então encontra comida. Ela pode até
reparar no site, mas ela veio com fome e quer pegar um lanche rápido.

**O cardápio tem que estar visível na primeira tela, depois da intro.** Reduza o hero a uma
faixa — a `chapa-selagem` como fundo, o nome da casa e "das 18h às 4h" por cima, ocupando
no máximo 35% da altura da viewport. O primeiro lanche precisa aparecer sem rolagem.

**Grade compacta, não cards grandes.** Duas colunas no celular, quatro no desktop. Cada
item leva: o ícone em ~110px, o nome, os ingredientes numa linha só, e o preço. Nada mais.

**O raio-x deixa de ser pedágio.** Cada item tem dois toques possíveis:

- **um botão direto** que manda pro embrulho sem passar pelo raio-x — é o caminho da
  pessoa com fome, e tem que ser o mais óbvio dos dois;
- **tocar no item** abre o raio-x pra quem quer editar.

Quem quiser comer não pode ser obrigado a montar nada.

**Filtro fixo no topo da grade:** Prensados · Redondos · Monte o seu. Três opções, sempre
visíveis ao rolar.

Isso não diminui o raio-x. Ele continua sendo o que diferencia o site — só deixa de estar
no caminho de quem não pediu por ele.

---

## O que não muda

O letreiro e a intro. A prensa e o espalhamento de `scaleX(1.14) scaleY(0.80)` no prensado.
O embrulho de papel. A regra de temperatura. O `baselines.json` como fonte das sombras. O
modelo de estado com instâncias repetidas.

---

Entregue tudo de uma vez. Termine com o RELATÓRIO nos quatro campos. No **Risco**, me diga
quantos itens do cardápio cabem na primeira tela num viewport de 390 × 844, e se o botão
direto está mesmo mais evidente que o caminho do raio-x.
