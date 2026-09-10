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
  e o trilho de ingredientes ("monte o seu")
- `components/pedido/` — o balcão e a barra do pedido

**Incompleto:**
- Barra do pedido: o botão "Abrir pedido" existe (`data-abrir-carrinho`) mas não abre nada
  — o carrinho é a fase seguinte
- Única porta de entrada é `?lanche=<slug>`, direto no raio-x montado; não há cardápio

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
public/        35 assets finais — não reprocessar
scripts/       qa-visual.mjs
```

## O que falta

Componentes que faltam portar: ver "Estado" acima.

- Fotos de bebida e acompanhamento — hoje as duas seções são peça tipográfica
- Série de giro 360° — adiada, o hero funciona sem ela
