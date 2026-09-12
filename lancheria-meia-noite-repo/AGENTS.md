# AGENTS.md — Lancheria Meia-Noite

Contrato do projeto. Vale para qualquer agente. `CLAUDE.md` contém apenas `@AGENTS.md`.

Stack: Next.js App Router, TypeScript, Tailwind, Vercel.
Site vitrine da WillDev. Vira template do nicho lancheria no Radar depois.

---

## Atualização vigente — Prompt 23

Estas decisões, autorizadas pelo usuário, substituem as orientações anteriores de movimento
que exigiam clip-path, captura em todo navegador e nomes separados nas folhas:

- Só `transform` e `opacity` em `transition` e `@keyframes`, inclusive estilos inline.
- Raio-x: deslocamento a partir da posição do cartão com scale leve (0,96 → 1), sem recorte animado.
- View Transitions apenas no takeover em desktop (900px+, ponteiro fino). Um nome, nenhum filho;
  captura automática da raiz e animação geométrica automática do navegador desativadas.
- Folhas e confirmação usam os elementos reais também no desktop; no celular nenhuma troca usa captura.
- Grade sem escalonamento nem animação por item no celular. Desktop conserva 200ms totais.
- Olhos e tremor pausam durante as transições; `will-change` temporário, limpo ao terminar.
- Hero recebe o MESMO mascote invertido e recortado pela borda superior, só pão/olhos e dois braços.
  Caixa absoluta fora do título, inclusive durante o alcance. Sem rosto no DOM no raio-x.
- Olhos e braços param fora da tela, com aba oculta e durante transições; movimento reduzido
  centraliza olhos e relaxa braços. Braços tentam por 900ms e repousam por 5,5–9,5s.
- Verificação desta rodada: TypeScript, build, varredura estática. Não declarar fluidez,
  limite de 32ms, capturas ou validação visual sem realmente executar no navegador/aparelho.

---

## A marca

Lancheria de esquina em Maringá, aberta das 18h às 4h. Vende **prensado** — o lanche que
nasceu na cidade, quando um dono de carrinho instalou uma chapa de prensa no carrinho. O
hambúrguer redondo é a exceção, não a regra.

Tensão que dá alma ao site: **comida de rua tratada como engenharia.**

Voz seca e específica. "Pão francês, prensado até firmar" ganha de "pão artesanal
irresistível". Proibido: "irresistível", "explosão de sabor", "experiência única", "feito
com amor", "tradição que atravessa gerações".

---

## Mobile-first, sem negociação

Este é um site de lancheria. A pessoa está na rua, com uma mão, com fome. O celular é o
alvo; o desktop é a adaptação, nunca o contrário.

**Toda decisão de layout é tomada em 390 × 844 primeiro** e só depois expandida. Se algo
não cabe no celular, a solução é cortar, não rolar.

**Olhar em cima, tocar embaixo.** O terço inferior da tela é zona de polegar e recebe tudo
que é acionável: trilho de ingredientes, medidor, botões, barra do pedido. Os dois terços
de cima são para ver: a pilha, as chamadas, a foto. Nada que exija toque preciso mora no
topo.

**Alvo de toque mínimo de 44px.** Vale para camada, chamada, item de trilho e botão. Na
pilha a tira de toque de uma camada fina cresce até 44px invadindo a vizinha — não é
garantia por camada; quem garante toque, teclado e leitor de tela para toda camada é a
lista de composição.

Arrastar nunca é o único caminho. Todo gesto tem equivalente por toque.

O corte é 900px. Abaixo dele vale tudo que está escrito aqui; acima, o desenho volta a
espalhar — chamadas todas visíveis ao mesmo tempo, medidor em coluna à direita.

---

## Regra de temperatura — nunca viole

**Luz fria (`--letreiro`) = o sistema.** Medição, letreiro, estados de interface, filtro ativo.
**Calor (`--latao`) = a comida.** Preço, CTA, gordura, chapa, aviso.

As duas nunca se misturam no mesmo elemento. Nenhuma medição em âmbar. Nenhum ingrediente
sob luz azul. Única exceção autorizada: a barra em estado de aviso vira `--latao`, porque ali
o calor é alarme.

## Tokens — os seis, sem adições

```
--borra    #120D0B   fundo base
--fumo     #1C1512   painel do raio-x, fichas, tiles
--traco    #33251E   fios 1px, contornos
--osso     #E9E0D3   tipografia
--latao    #A9762F   preço, CTA, calor, aviso
--letreiro #A8C6D4   medição, chamadas, luz da placa
```

Proibido `#000`, `#fff`, cinza neutro, e qualquer `--accent` genérico. Estados de
hover/foco/desabilitado saem de opacidade e `color-mix` dos seis.
`--latao` sobre `--borra` dá ~4,9:1 — serve para preço grande, CTA e barra de aviso, nunca
para texto pequeno.

## Tipografia

**Fraunces** display. `opsz` acompanhando o tamanho, `WONK` 1, `SOFT` baixo, `wght` 700–900.
Nunca abaixo de 1.5rem.
**Archivo** corpo e interface. Variável. `tabular-nums` em toda tabela e ficha.
**IBM Plex Mono 500** — **só no medidor, nos preços e nos carimbos.** Em qualquer outro
lugar é erro.

Proibido: rótulo em caixa-alta espaçada acima de título; meta unida por ponto médio
("Fresco · Artesanal"); uma palavra do título em cor diferente; seta "→" colada em botão.

**Pisos do display em 390px.** O teto de cada `clamp` é desenho de desktop e nunca é
alcançado no celular — quem manda ali é o piso. Os três que valem quando cada peça for
portada:

```
hero               piso 2.75rem   (3.5rem estoura em 390px com WONK 1)
título de seção    piso 2rem
nome de lanche     piso 1.25rem
```

## Lei do movimento

Um momento orquestrado por rota — a intro do letreiro. Todo o resto responde a uma ação do
usuário. `prefers-reduced-motion` tratado em tudo que se move, sem exceção.

### Transições entre telas

Cada troca de tela tem uma transição curta. Ela não enfeita: ela diz **de onde a tela
veio**. Fade sozinho não diz nada, então **nenhuma transição é só opacidade** — todas
carregam corte, deslocamento ou crescimento, e a opacidade, quando entra, só acompanha.

A tabela mora em `lib/transicoes.ts` (`TRANSICOES`) e é a única cópia dos números. O CSS
lê a duração de `--tr-ms`, escrito pelo JS; `app/globals.css` não tem duração à mão.

| troca | movimento | duração |
|---|---|---|
| cardápio → raio-x | o takeover cresce a partir do retângulo do cartão tocado | 240ms |
| raio-x → cardápio | o inverso, voltando para o cartão de origem | 200ms |
| abrir carrinho | folha sobe da base | 220ms |
| fechar carrinho | desce | 180ms |
| folha de ingredientes | sobe da base, sobre o raio-x | 200ms |
| fechar folha de ingredientes | desce | 180ms |
| confirmação do pedido | entra pela direita, como passo seguinte | 220ms |
| voltar da confirmação | sai pela direita | 180ms |
| troca de filtro | os itens da grade reencaixam com escalonamento de 20ms | 200ms no total |

**Teto de 240ms, sem exceção.** Acima disso quem está com fome acha que o site travou.
Curva de saída rápida (`--tr-sai`), chegada suave (`--tr-entra`).

A do cardápio para o raio-x é a mais importante: ela sai **do cartão que a pessoa tocou**,
nunca do centro da tela — é isso que faz a tela nova parecer consequência do toque. O
retângulo é medido no instante do toque e escrito em `--tr-origem-*`; o caminho de volta
reconsulta o elemento, porque a página pode ter rolado no meio.

Onde existe View Transitions API, é ela quem anima, e as telas de trás ficam firmes
(`tr-segura`) para o navegador não aplicar o cross-fade dele. Onde não existe, as mesmas
keyframes rodam nos elementos reais sob `html:not([data-vt])`: entrada depois da mudança,
saída antes dela.

Duas trocas ficam **de fora** da tabela, de propósito:
- **Selar na chapa** — o salto de 640ms já é a transição daquele caminho, e ele desenha
  clones no documento; congelá-los numa view transition mataria o efeito.
- **Escolher um ingrediente na folha** — a resposta ao toque é a camada entrando na pilha.
  A folha só sai da frente; congelar a página ali esconderia justamente o que importa.

## O mascote

Um hambúrguer com olhos que acompanham o cursor, os toques e os deslizes.

**Ele é pintado no letreiro, não é um personagem flutuando pela tela.** Lancheria de
esquina tem mascote pintado na fachada — ele é parte do mundo, não um enfeite por cima
dele. Desenho de pintura de letreiro: traço chapado, poucas cores, imperfeito como pincel.
Proibido sombra 3D, brilho, contorno de adesivo e qualquer filtro SVG.

**Temperatura:** ele é comida. `--latao`, `--osso` e `--traco`, mais `--borra` na pupila.
Nenhum `--letreiro` encosta nele — a luz fria é da placa, o mascote é pigmento sobre a
placa.

**Onde ele aparece:** na tabuleta pintada sob o letreiro da intro, no letreiro pequeno do
rodapé, e no carrinho vazio.

**Onde ele nunca aparece: no raio-x.** Aquilo é o instrumento do site, e um rosto de
desenho ali destrói o efeito que sustenta o projeto inteiro. Não é `display: none` — com o
raio-x aberto ele **não existe no DOM** (contexto `RaioXAberto`, em `Mascote.tsx`).

**Olhar:** um só relógio para todos os mascotes da tela. No desktop os olhos seguem o
cursor com atraso; no celular olham o toque e vão à frente do deslize; em repouso fixam
coisas plausíveis (o que se toca, o que custa, a saída) e de vez em quando voltam para
quem está olhando. Piscam em intervalo irregular. **O que se move é a pupila dentro do
olho, nunca a cabeça.** O único erro possível é ele parecer nervoso: olho que se mexe
demais cansa e chama atenção para si em vez de dar vida ao letreiro. Daí perseguição com
peso, fixação de 1,5s a 3,3s e piscada de 2,7s a 7,3s.

Com `prefers-reduced-motion` os olhos ficam parados, olhando para frente. Ele continua lá,
só não se mexe.

---

## Números calibrados — não altere sem me perguntar

Foram medidos em teste, não estimados.

**Afundamento, os dois formatos:**
```
afundamentoEfetivo = min(alturaPx_propria × afundamento, alturaPx_abaixo × 0.55)
```
Sem esse limite, camada grossa engole camada fina. O tomate sumiu no primeiro teste.

Este `min` é estrutural, não margem de segurança. Nos seis lanches a menor exposição bate
exatamente 45,0%, ou seja, o limite é a restrição ativa em todos. Alterar qualquer
`alturaPx` move várias camadas de uma vez. Não trate esses números como cosméticos.

**Quando a pilha não cabe na altura, em `geometria()` (`prensa.ts`) — ordem de quem cede:**

Escala é conteúdo — encolher a pilha encolhe as camadas finas até o molho virar um fio.
Folga entre camadas é leitura — ela só separa as peças, e com mais peças cabe menos
separação por peça sem perder o desenho. Por isso a folga cede **primeiro**, e só depois a
escala:

1. **Folga**, até o piso `PISO_FOLGA` = 0,40 (fração de `GAP`, 46px). Abaixo disso as linhas
   de chamada se encavalam e o desenho vira sanduíche em vez de diagrama.
2. **Escala**, até o piso `PISO_ESCALA` = 0,70 (fração da escala natural).
3. **Rolagem**, só quando os dois pisos acima já foram gastos e ainda não coube.

**Leque dos rótulos da coluna de chamadas (`Chamada`, em `Camada.tsx`, distribuído por
`distribuirRotulos` em `rotulos.ts`):** mesmo com a folga no piso, camada fina ainda pode
deixar menos de 44px entre duas alturas de objeto — o rótulo, que é um alvo de toque de
44px, encavalaria o vizinho se ficasse preso na altura exata da peça. Por isso ele desliza
ao longo da coluna, com `ESPACO_MIN_ROTULO` = 22px de vão mínimo entre vizinhos, ordem
vertical idêntica à ordem física das camadas (nunca inverte) e a linha de chamada vira
diagonal para acompanhar — o ponto de 3px continua ancorado na aresta real da camada, não
no rótulo. Isso não substitui a folga: menos folga ainda significa mais camadas espremidas
e mais deslocamento no leque, logo linhas mais inclinadas. A folga continua sendo o que
mantém o leque discreto; o leque é a garantia de que ele nunca vira sobreposição.

```
escalaNatural = larguraDoPainel / 2000
alturaAlvo    = alturaDisponível × 0.94
// 1) tenta caber cedendo só a folga, na escala natural
folga         = clamp((alturaAlvo / escalaNatural − somaAlturas) / gapsBase, 0.40, 1.00)
// 2) se nem a folga no piso bastou, a escala cede
k             = max(alturaAlvo / (somaAlturas + gapsBase × folga), escalaNatural × 0.70)
```
`alturaDisponível` é a altura do painel já descontada a faixa flutuante de aviso/recado
(`#rx-flutua`), medida ao vivo — não a altura inteira do painel. `0.94` é ar vertical, não
contrato; ajuste se a pilha parecer apertada ou solta demais. `0.40` e `0.70` são pisos:
abaixo deles a leitura (o primeiro) ou o desenho (o segundo) perdem sentido. Se mesmo com os
dois pisos gastos a pilha não coube, ela para no piso de escala e **o painel rola**
(`overflow-y: auto` só nesse estado, alinhado pelo topo) — é a única situação em que o
raio-x rola verticalmente. Nas seis composições fixas do cardápio isso não deve acontecer;
só o sintético de 16 camadas (o teto do contrato) está autorizado a rolar.

`k` e a folga saem sempre do estado explodido — a pilha não muda de escala nem de folga ao
prensar, só a distância entre camadas encolhe (`fatorFechado`). `#rx-painel` expõe os três
números vivos em `data-escala`, `data-escala-natural` e `data-folga`, mais `data-estourou`
quando a rolagem entrou.

**Prensa (só prensado), 340ms, aceleração forte e parada seca — sem mola:**
```
espacamento = espacamento_explodido × 0.30
recheio (não-pão): scaleX(ESPALHA_X) scaleY(0.80)

ESPALHA_X = clamp(larguraPao / maiorRecheio, 1.16, 1.30)
larguraPao   = largura da camada de pão do lanche
maiorRecheio = maior largura entre as camadas não-pão da composição
```
O `scaleX` não é enfeite: sem ele sobra fresta entre os dois pães nas pontas e o lanche não
lê como prensado. `ESPALHA_X` é **derivado da composição, nunca escrito à mão** — um
número fixo nunca cobre toda composição possível. Piso 1.16: preserva o espalhamento como
gesto mesmo quando o recheio já cobria sozinho. Teto 1.30: não estica um recheio estreito a
ponto de distorcer a fotografia. Composição estreita bate no teto e sobra vão nas pontas —
aceitável, porque pilha estreita é pilha baixa e os dois pães ficam quase encostados. Não
precisa de tratamento; se aparecer visível num lanche real, avise antes de corrigir.
Qualquer lugar que precise de `ESPALHA_X` importa de `prensa.ts`, nunca reescreve a conta.

**Gravidade (só redondo):**
```
espacamento = espacamento_explodido × 0.40
camadas moles: scaleY(0.90), sem scaleX
```

**Deslize que prensa** — `t` = 0 no centro do trilho, 1 na borda do foco:
```
espacamento = espacamento_explodido × (0.30 + 0.70 × t)
recheio: scaleX(ESPALHA_X − (ESPALHA_X − 1) × t)
         scaleY(0.80 + 0.20 × t)
```
Em `t = 0` cai exatamente no estado prensado daquele lanche; em `t = 1`, no explodido — é
por isso que a fórmula reusa `ESPALHA_X` em vez de citar um número. `ESPALHA_X` é o mesmo
fator derivado da composição descrito acima, nunca uma segunda constante. Acompanha o dedo
continuamente. Não é estado que troca no fim do gesto.

**Salto, 640ms:** antecipação 0–90ms `scaleY(.86) scaleX(1.04)`; impulso 90–200ms sobe 12%
da viewport com `scaleY(1.08)` e 4° de rotação; queda e desmonte 200–560ms com 45ms de
atraso entre camadas, **de baixo para cima**, cada uma com rotação entre −14° e +14° e
deriva de até 40px; chegada 560–640ms com solavanco na barra do pedido.
Rotação sorteada **uma vez por lanche e memorizada** — o mesmo lanche cai igual sempre.
Sem rastro, sem borrão, sem partícula. As camadas são fotografia.

**Sombra de contato:** vem de `/data/baselines.json`. Curva de 240 amostras por camada,
borrão 10px, opacidade 37%, deslocamento 14px. Nunca `getImageData` em runtime.

`sombra.ts` lê `b.base.length` e não assume contagem fixa. Ao trocar o `baselines.json`,
não é preciso mexer no código.

---

## Dados

`camadas.ts` — 19 camadas. Campos: `slug`, `arquivo`, `ficha`, `alturaPx`, `afundamento`,
`precoCent`, `obrigatorio`.
**Não existem `alturaCm` nem `pesoG`.** Foram removidos de propósito: nenhum dono de
lancheria consegue preencher isso, e estimativa errada é pior que nada.

`fixos.ts` — 6 lanches, `forma: 'prensado' | 'redondo'`, `camadas` e `essenciais`.
No editor, os slugs essenciais não expõem remoção e ficam marcados como fixa.
No montador, só os pães são obrigatórios.
**Preço do fixo é calculado da composição**, base R$ 12,00 mais a soma dos `precoCent`.
No editor (Prompt 19), o preço é o fixo original mais os acréscimos por ocorrência além
da composição original. Remover não baixa o piso. No montador, tudo conta.
`fixoSlug` e a observação do item acompanham a linha mesmo depois de modificar.

Camadas repetidas são permitidas: máximo 3 do mesmo, 16 na pilha. Pães únicos, obrigatórios
e travados nas extremidades. IDs `#rx-camada-{slug}-{n}`, `n` a partir de 1.
Molho só em posição adjacente a um pão. `afundamento` limitado a 0.65 quando a camada está
no topo.

Aviso "risco de desmontar": **acima de 10 camadas.** Não existe limiar em centímetros.

---

## Assets — 54 arquivos, finais

```
/public/camadas/   19 · 2000×1200 · alpha
/public/fixos/     10 · 2000×2000 · alpha
/public/chapa/      2 · 2400×1600
/public/macro/      4 · 2000×1333
/public/fichas/    19 ·  256× 256 · alpha
```

`/public/fichas/` é miniatura de trilho: recorte 256×256 no ponto de maior estrutura de
cada camada, feito para ler a 56px. Uso **exclusivo** do trilho. A pilha, o cardápio e o
raio-x usam `/camadas/`, que são as camadas inteiras — encolher a 2000×1200 a 56px joga
fora a silhueta e sobra a cor média (foi assim que quatro marrons viraram uma mancha só).
Trocar um pelo outro quebra os dois.

Exceção: o ghost de arrasto usa `/camadas/`, porque representa a camada real entrando na
pilha e precisa da proporção verdadeira.

Já normalizados. **Não redimensione, não reprocesse, não renomeie.**
Bebidas e acompanhamentos **não têm imagem** e entram como peça tipográfica.

**Nunca gere placeholder de imagem.** Se faltar um asset, pare e diga qual e por quê.

---

## Navegação

Prompt 19: ignição em 800ms, travessia em 420ms, sem espera extra. Segunda visita da
sessão e movimento reduzido entram direto. O prazo começa antes da hidratação.

Intro (letreiro) → hero em faixa de no máximo 35% da viewport → **cardápio em grade
compacta**, visível na primeira tela sem rolagem.

Item da grade: botão de adicionar, e mais nada. Depois de adicionar, aparece "Modificar
lanche", que abre o raio-x montado. O raio-x **não é pedágio** — quem quer comer nunca é
obrigado a montar.

Filtro de forma (Prensados · Redondos · Monte o seu) e filtro por ingrediente (silhuetas das
camadas) são **dois eixos separados**. Não os funda.

Trilho horizontal com deslize-que-prensa: Destaques, Sugestões, Bebidas, Acompanhamentos.
Só o item central e os dois vizinhos ficam montados por camada; o resto usa ícone estático.

Fechar pedido **não é checkout**: monta resumo para WhatsApp e lista as formas aceitas numa
linha seca. Sem selo de segurança, sem bandeira de cartão.
Prompt 19 acrescenta uma confirmação antes do WhatsApp: nome, entrega/retirada, endereço
com complemento quando entrega, pagamento, troco quando dinheiro e observação geral.
Observação por item no raio-x: até 120 caracteres. WhatsApp da casa: 5544984570105.

---

## Formato de resposta

Toda entrega termina com:

```
RELATÓRIO
Feito:     o que foi implementado
Não feito: o que foi pedido e não feito, com o motivo
Adiado:    o que ficou pra depois, com a fase
Risco:     o que pode quebrar e onde — ou "nenhum"
```

Não escreva "nenhum" em **Não feito** ou **Adiado** para parecer completo.

Se algum ponto do contrato não fechar na implementação, **pare e pergunte**. Não improvise.

---

## Como olhar o que você fez, sem queimar contexto

`npm run qa` roda `scripts/qa-visual.mjs`. Ele devolve **texto primeiro** — uma linha por
asserção numérica — e só depois uma **folha de contato única** em `qa/folha-de-contato.jpg`,
com os recortes reunidos num JPEG de qualidade 55.

Regras:
- Leia o texto primeiro. A maior parte dos defeitos aparece ali e nunca precisa de imagem.
- Abra a folha de contato só quando uma asserção falhar ou quando a tarefa for de
  julgamento visual — cor, proporção, espaçamento, se o lanche parece compacto.
- **Nunca capture a página inteira em `deviceScaleFactor: 2`.** É o jeito mais rápido de
  esgotar a janela de contexto, e não melhora o julgamento.
- Capture elemento, não página. Um recorte de 360px basta para julgar composição.
- Se precisar de mais de uma rodada de imagem, acrescente asserção numérica em vez de
  capturar de novo. O que dá para medir não deve ser olhado.

Os seletores usados pelo QA são contrato: `[data-cardapio]`, `[data-item-cardapio]`,
`[data-filtro-ingrediente]`, `[data-barra-pedido]`, `[data-abrir-carrinho]`,
`[data-carrinho]`, `[data-medida]`, `[data-preco]`, `[data-carimbo]`, `[data-prensado]`,
`[data-estourou]`, `[data-escala]`, `[data-escala-natural]`, `[data-folga]`,
`[data-chamada]`, `[data-toque]`, `[data-tirar]`, `[data-folha]`, `[data-mascote]`,
`[data-pupila]`, `[data-passo-pedido]`, `[data-troca]`, mais os IDs
`#rx-takeover`, `#rx-painel`, `#rx-desenho`, `#rx-medidor`, `#rx-selar`, `#rx-trilho`,
`#rx-abrir-trilho`, `#rx-trilho-cortina`, `#rx-trilho-folha`, `#rx-fechar-trilho`,
`#rx-toques`, `#rx-composicao`, `#rx-ver-composicao` e os `#lt-*`.

`#rx-trilho` só existe montado em tela — no trilho do modo montador, ou dentro da folha
do modo editor quando ela está aberta (`#rx-trilho-cortina` > `#rx-trilho-folha` >
`#rx-trilho[data-folha]`). Com o trilho recolhido (editor, estado padrão), quem ocupa o
lugar dele é `#rx-abrir-trilho`. Ver "raio-x aberto a partir de um fixo (editor) vs. Monte
o seu (montador)" no componente `RaioX.tsx`.

O QA roda em 390 × 844 e, no fim, uma segunda passada em 900 × 800 só para o que muda de
comportamento no corte. Três asserções são de mobile e valem para toda peça nova: nenhuma
rolagem horizontal acidental, nenhum alvo acionável abaixo de 44 × 44, e medidor, trilho e
botão inteiros no terço inferior.
