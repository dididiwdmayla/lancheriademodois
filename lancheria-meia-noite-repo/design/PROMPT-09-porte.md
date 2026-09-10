# Prompt 09 — porte para o repositório

Primeiro prompt do Claude Code. O objetivo desta rodada é **portar, não melhorar.**

---

## Antes de rodar

O repositório precisa subir com:

```
/AGENTS.md              o contrato
/CLAUDE.md              uma linha: @AGENTS.md
/design/                os briefings e prompts desta conversa, como referência
/public/camadas/        19 webp
/public/fixos/          10 webp
/public/chapa/           2 webp
/public/macro/           4 webp
/data/baselines.json    19 silhuetas, 240 amostras
/export/                o HTML exportado do Claude Design
```

Use a versão de 240 amostras do `baselines.json` no repo. A compacta de 64 existia só para
caber num prompt.

---

## O prompt

Leia o `AGENTS.md` inteiro antes de qualquer coisa.

Em `/export/` está um componente HTML único, autocontido, produzido no Claude Design. Ele é
a **fonte da verdade do comportamento**: o letreiro, o raio-x, a prensa, o salto, o
carrinho e os trilhos já funcionam ali.

Sua tarefa é transformá-lo num projeto Next.js App Router com TypeScript e Tailwind,
**preservando o comportamento exatamente**. Isto é um porte, não uma reescrita.

### Regras do porte

- **Não redesenhe nada.** Se algo no export parece estranho, feio ou mal resolvido, porte
  como está e registre no **Risco**. Não conserte por conta própria.
- **Não altere nenhum número calibrado.** Eles estão listados no `AGENTS.md` e foram
  medidos, não estimados. Se um número no export divergir do `AGENTS.md`, **pare e me
  pergunte** — não escolha um dos dois.
- **Preserve os IDs contratados.** `#lt-*` e `#rx-camada-{slug}-{n}` e o resto.
- Extraia os dados para `/data/camadas.ts`, `/data/fixos.ts` e `/data/casa.ts`. Nada de
  array literal dentro de componente.
- `baselines.json` é lido do arquivo. Não incorpore os números no código-fonte.
- Fontes passam a `next/font` com subset latin e self-host. Isso estava adiado desde a
  Fase 1 e é o momento.
- Imagens com `next/image`, `sizes` correto. As camadas renderizam a ~400px de largura —
  sirva em `800w`, não os 2000px nativos.

### Estrutura alvo

```
app/          layout, page, globals.css
components/   letreiro/  raio-x/  cardapio/  trilho/  carrinho/  chapa/
lib/          motion.ts, precos.ts, horario.ts
data/         camadas.ts, fixos.ts, casa.ts, baselines.json
```

### Verificação

Instale Playwright e crie `scripts/qa-visual.mjs` que abre a página, executa um roteiro e
salva capturas em `/qa/`:

1. carga inicial, com a intro do letreiro concluída
2. cardápio na primeira tela, viewport 390 × 844
3. raio-x aberto a partir de um prensado, estado explodido
4. o mesmo, estado prensado
5. carrinho aberto com dois itens
6. um trilho com o item central prensado e os vizinhos abertos

Rode, **olhe as capturas**, e me diga no **Risco** o que divergiu do export.

Não me entregue sem ter olhado as seis.

### Não faça nesta rodada

Nenhuma seção nova, nenhum ajuste visual, nenhuma otimização além das citadas, nenhum
placeholder de bebida ou acompanhamento. Se sobrar tempo, pare.

---

Termine com o RELATÓRIO nos quatro campos.
