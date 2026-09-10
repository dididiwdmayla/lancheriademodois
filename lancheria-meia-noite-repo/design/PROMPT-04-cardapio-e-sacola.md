# Prompt — reestruturação: cardápio primeiro, raio-x como editor

O raio-x ficou excelente. A mecânica está certa e não vamos mexer nela. O que muda é
**onde ela vive** na página, e mais três ajustes.

---

## 1. O letreiro sai da página

Ele deixa de ser a primeira seção e vira **a intro** — a animação de entrada do site, sobre
tela cheia, antes do conteúdo aparecer. Quando a sequência termina, ele sai e o hero assume.

Tudo que já está implementado continua: os sete tempos, o tremor, o clock em WAAPI, o
`prefers-reduced-motion`. O que muda é que ele agora é o próprio preloader — funde o
`Preloader.tsx` com o `Letreiro.tsx` em vez de terem dois.

Na segunda visita da sessão, com a flag já gravada, a intro é pulada inteira e a página
abre direto no hero. Não mostre o letreiro aceso por meio segundo antes de sair.

## 2. O cardápio passa a ser a porta principal

Hoje o raio-x é a única entrada, e isso obriga todo visitante a montar um lanche antes de
ver o que a casa vende. Inverta.

**A seção dos fixos vira o cardápio, e é o caminho padrão.** Cada lanche aparece com a foto
da série B em tamanho pequeno — **de ícone, não de herói** —, o nome, o preço e a ficha
técnica curta.

Tocar num lanche abre o raio-x **já montado com a composição dele**, em takeover de
viewport inteiro, com o nome do lanche no topo e um retorno claro. Dali a pessoa adiciona ou
remove o que quiser e sela.

**"Monte seu lanche" é a segunda porta, em destaque, mas não é o padrão.** Mesmo painel,
começando vazio, com o trilho completo liberado.

### Composição dos fixos — `/data/fixos.ts`

```ts
export const FIXOS = [
  { slug:'x-salada',    nome:'X-Salada',    icone:'/fixos/x-salada.webp',
    camadas:['pao-base','alface','tomate','carne','queijo','pao-topo'] },
  { slug:'x-bacon',     nome:'X-Bacon',     icone:'/fixos/x-bacon.webp',
    camadas:['pao-base','carne','queijo','bacon','pao-topo'] },
  { slug:'x-calabresa', nome:'X-Calabresa', icone:'/fixos/x-calabresa.webp',
    camadas:['pao-base','carne','calabresa','cebola','queijo','pao-topo'] },
  { slug:'x-frango',    nome:'X-Frango',    icone:'/fixos/x-frango.webp',
    camadas:['pao-base','alface','tomate','frango','queijo','pao-topo'] },
  { slug:'x-tudo',      nome:'X-Tudo',      icone:'/fixos/x-tudo.webp',
    camadas:['pao-base','molho','alface','tomate','carne','presunto','queijo','bacon','ovo','batata-palha','pao-topo'] },
] as const
```

O preço de cada fixo é calculado da composição, não fixado à mão — base R$ 12,00 mais a
soma dos `precoCent`. Assim editar o lanche move o preço de forma coerente.

**O cachorro-quente fica no cardápio mas não abre o raio-x.** Ele não é montável, e isso é
verdade de lancheria, não limitação. Tocar nele vai direto para a sacola.

**Duas camadas novas entram:** `calabresa` e `frango`. Elas ainda não estão na pasta. Deixe
os registros em `camadas.ts` prontos e o painel funcionando sem elas — se o arquivo não
existir, esconda a camada em vez de quebrar. Eu mando os dois arquivos em seguida.

```ts
{ slug:'calabresa', arquivo:'/camadas/calabresa.webp', alturaPx:0, afundamento:0.50, alturaCm:0.9, pesoG:45, precoCent:500, ordem:6, obrigatorio:false },
{ slug:'frango',    arquivo:'/camadas/frango.webp',    alturaPx:0, afundamento:0.45, alturaCm:1.5, pesoG:110, precoCent:800, ordem:6, obrigatorio:false },
```

`alturaPx` fica em 0 até eu mandar os arquivos medidos.

## 3. Camadas repetidas passam a ser permitidas

Voltei atrás na regra anterior. Dois hambúrgueres, dois ovos, bacon duplo — é o que faz
"monte seu lanche" ter graça, e é o que finalmente torna o aviso de "risco de desmontar"
alcançável.

- Máximo **3 unidades do mesmo ingrediente**, máximo **16 camadas** na pilha.
- Os pães continuam obrigatórios, únicos e travados nas extremidades.
- **O contrato de IDs muda:** `#rx-camada-{slug}-{n}`, com `n` começando em 1.
- O estado vira uma lista ordenada de instâncias, não um conjunto de slugs.
- No trilho, um ingrediente já usado mostra a contagem. No terceiro, fica indisponível.

O limiar de aviso continua em 8,5 cm e o medidor escala até 10 cm — agora dá para
ultrapassar de verdade.

## 4. O lanche selado ainda está frouxo

As camadas continuam distantes demais depois da compressão. Aplique uma compressão extra
global no estado selado:

```
deslocamentoSelado = alturaPx × (1 − afundamento) × 0.78
```

Só no selado. No estado explodido, nada muda. Se ainda ficar solto, o número a mexer é esse
0.78, e mais nada.

## 5. A sacola

Depois da selagem e da varredura de calor na chapa, o lanche vai para a sacola.

**Desenhe a sacola em SVG, não use imagem.** Ela precisa deformar — abrir a boca, sacudir,
amassar de leve — e foto não faz isso. Papel kraft, dois tons quentes da família do
`--latao`, interior bem mais escuro que a face, vincos como linhas de 1px, fundo chanfrado.
Uma aba dobrada no topo.

Sequência, logo após a varredura de calor:

1. A boca da sacola abre (240ms).
2. O lanche montado reduz para ~22% e cai dentro, com leve rotação. A boca fecha atrás dele.
3. A sacola sacode: dois eixos, 3 oscilações com decaimento, 520ms no total. Não é um
   balanço bonito — é o peso caindo dentro dela.
4. Assenta e recebe um carimbo: o nome do lanche e o preço, em Plex Mono, alinhado ao
   vinco da aba.

Sob `prefers-reduced-motion`: a sacola aparece já fechada e carimbada, sem queda e sem
sacudida.

---

## O que não muda

A mecânica interna do raio-x, o medidor, as chamadas, o assentamento por `baselines.json`,
a varredura de calor sobre `chapa-vazia.webp`, a regra de temperatura, o mono restrito.

Nada disso precisa ser reescrito — o que muda é a navegação em volta.

---

Entregue tudo de uma vez. Se algum ponto não fechar, pare e me pergunte em vez de
improvisar. Termine com o RELATÓRIO nos quatro campos, e no **Risco** me diga o que você
testou na navegação cardápio → raio-x → sacola e o que não deu tempo.
