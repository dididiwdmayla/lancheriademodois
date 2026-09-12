# Lancheria Meia-Noite

Site vitrine WillDev. Vira template do nicho lancheria no Radar.

**Leia o `AGENTS.md` antes de tocar em qualquer coisa.** Ele é o contrato: tokens,
tipografia, regra de temperatura e os números calibrados que não podem ser alterados sem
perguntar.

## Estado

Porte em andamento. O comportamento de referência continua em
`export/lancheria-meia-noite.dc.html` — o componente único produzido no Claude Design, que
não roda sozinho no navegador (referencia `./support.js`, o runtime do Claude Design, que
não veio no pacote) e serve como leitura de código, não como demo.

**Portado:**
- `components/letreiro/` — o letreiro e a intro
- `components/raio-x/` — a pilha explodida, a física de afundamento (`prensa.ts`), a
  sombra de contato (`sombra.ts`), a prensa e a gravidade, o salto (`salto.ts`), o medidor
  (faixa horizontal), o trilho de ingredientes ("monte o seu") e a lista de composição
- `components/pedido/` — o balcão e a barra do pedido

**Desenho do raio-x, mobile-first** (corte em 900px, ver `AGENTS.md`):

```
390px                                 900px
┌───────────────────┐                 ┌──────────────────────┬─────────┐
│ nome do lanche    │                 │ nome do lanche       │         │
├───────────────────┤                 ├──────────────────────┤ medidor │
│                   │                 │ chamadas │           │ em      │
│   pilha, largura  │  2/3 de cima:   │ todas    │  pilha    │ coluna  │
│   cheia, chamadas │  para ver       │ visíveis │           ├─────────┤
│   ocultas         │                 │          │           │ prensar │
├───────────────────┤                 ├──────────────────────┴─────────┤
│ preço   n camadas │  1/3 de baixo:  │ trilho ────────────────────────→│
│ ▓▓▓▓▓░░░░░░░░░░░░ │  zona de        └────────────────────────────────-┘
├───────────────────┤  polegar
│ trilho 56px ─────→│
├───────────────────┤
│ Prensar na chapa  │
└───────────────────┘
```

Onde as peças ficam mora no CSS (`app/globals.css`, bloco "Raio-x"); como elas parecem,
nos componentes. Só o que muda de comportamento com o corte mora no JS: abaixo de 900px as
chamadas nascem ocultas e um toque na camada revela a dela; `ver composição` abre a lista
inteira em texto, que é também o caminho garantido de 44px para toda camada.

**Incompleto:**
- Barra do pedido: o botão "Abrir pedido" existe (`data-abrir-carrinho`) mas não abre nada
  — o carrinho é a fase seguinte
- Única porta de entrada é `?lanche=<slug>`, direto no raio-x montado; não há cardápio
- No celular a ficha do trilho é só a foto em 56px: nome e preço só aparecem a partir de
  900px, e no `aria-label` abaixo disso

**Não existe ainda:** cardápio em grade, filtro por ingrediente, trilho horizontal com
deslize-que-prensa (Destaques/Sugestões/Bebidas/Acompanhamentos), carrinho aberto,
bebidas, acompanhamentos, hero, seção da chapa, "está aberto?", rodapé.

Ver `design/PROMPT-09-porte.md` para o plano de porte.

## Rodar

```bash
npm install
npx playwright install chromium
npm run dev
npm run qa          # asserções em texto + uma folha de contato
```

## Estrutura

```
AGENTS.md      contrato — a lei do projeto
CLAUDE.md      uma linha: @AGENTS.md
app/           layout com next/font, tokens em globals.css, a página que abre o raio-x
components/    letreiro/, raio-x/, pedido/ — ver Estado
data/          camadas.ts, fixos.ts, casa.ts, baselines.json
design/        briefings e prompts, na ordem em que foram dados
export/        o HTML do Claude Design
public/        54 assets finais — não reprocessar
scripts/       qa-visual.mjs
```

## O que falta

Componentes que faltam portar: ver "Estado" acima.

- Fotos de bebida e acompanhamento — hoje as duas seções são peça tipográfica
- Série de giro 360° — adiada, o hero funciona sem ela

## Quatro temas — Prompt 24

O padrão é Meia-Noite. Para revisão provisória, recarregue a página com
`?tema=meia-noite`, `?tema=diner`, `?tema=pratico` ou `?tema=cantina`.
A futura integração no Radar injeta o mesmo contrato `Tema`; não duplica o projeto.
As fontes são locais e somente as famílias do tema ativo são carregadas.

Veja [o relatório e as decisões de desenho](design/RELATORIO-PROMPT-24.md),
[as capturas comparativas](qa/prompt-24/folha-de-contato.jpg) e
[o registro literal do handshake](design/HANDSHAKE-PROMPT-24.md).

QA dos quatro temas: `npm run qa:temas -- --serve`. Para testar produção, rode antes
`npm run build` e use `QA_PRODUCTION=1 npm run qa:temas -- --serve`.

## Densidade e estruturas — Prompt 25

Primeira tela de 390 × 844: Meia-Noite **4**, Diner **6**, Prático **4**, Cantina **4**
itens completos, acima da barra de pedido. Diner usa painel de três/cinco colunas;
Cantina usa folha pautada de uma/duas colunas. Prático mantém a geometria da rodada 24.

Veja o [relatório, limites e decisões](design/RELATORIO-PROMPT-25.md),
os [quatro cardápios lado a lado](qa/prompt-25/folha-cardapios.jpg) e a
[comparação da primeira tela](qa/prompt-25/folha-de-contato.jpg).

Depois de `npm run build`, execute `QA_PRODUCTION=1 npm run qa:densidade -- --serve`.
`npm run qa:temas` também acompanha as metas atuais, preservando as evidências antigas.
