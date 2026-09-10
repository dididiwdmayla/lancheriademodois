# Lancheria Meia-Noite

Site vitrine WillDev. Vira template do nicho lancheria no Radar.

**Leia o `AGENTS.md` antes de tocar em qualquer coisa.** Ele é o contrato: tokens,
tipografia, regra de temperatura e os números calibrados que não podem ser alterados sem
perguntar.

## Estado

Andaime, dados e assets prontos. **Componentes ainda não portados.**

O comportamento vive em `export/lancheria-meia-noite.dc.html` — um componente único
produzido no Claude Design, onde o letreiro, o raio-x, a prensa, o salto, o carrinho e os
trilhos já funcionam. A próxima tarefa é portá-lo para React preservando o comportamento
exatamente. Ver `design/PROMPT-09-porte.md`.

O export referencia `./support.js`, que é o runtime do Claude Design e não veio no pacote.
Ele não roda sozinho no navegador — serve como leitura de código, não como demo.

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
app/           layout com next/font, tokens em globals.css
components/    vazio até o porte
data/          camadas.ts, fixos.ts, casa.ts, baselines.json
design/        briefings e prompts, na ordem em que foram dados
export/        o HTML do Claude Design
public/        35 assets finais — não reprocessar
scripts/       qa-visual.mjs
```

## O que falta

- Porte dos componentes (`design/PROMPT-09-porte.md`)
- Fotos de bebida e acompanhamento — hoje as duas seções são peça tipográfica
- Série de giro 360° — adiada, o hero funciona sem ela
