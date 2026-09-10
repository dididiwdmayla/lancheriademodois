# Prompt — letreiro (ajuste) + Fase 2 + Fase 3

O relatório está no formato certo. Mantenha-o em toda entrega daqui pra frente.

O letreiro está certo como objeto — lê como acrílico retroiluminado, e os pés na base
resolveram a evidência. Dois ajustes rápidos e seguimos.

---

## Movimento 0 — letreiro, dois ajustes

**Troque os dois filtros SVG por gradientes.** O risco que você reportou é real e tem
solução barata: você não precisa de blur de verdade em nenhum dos dois casos.

- O difusor de 42px nos tubos vira uma **barra com gradiente linear** — transparente nas
  bordas, opaco no centro. Visualmente indistinguível de um blur gaussiano num bastão de
  luz, e custo zero.
- A vinheta de canto na face vira um **gradiente radial elíptico**, que já é o que ela
  simula.

Com isso o tremor anima só `opacity` sobre camadas que nunca recalculam, e o problema de
Android fraco desaparece em vez de virar item de vigilância.

**As letras ficaram moles.** O difusor de 9px sobre a face está borrando o texto junto.
Acrílico recortado tem aresta nítida com um bloom sutil ao redor, não contorno difuso.
Separe: as letras ficam cravadas, sem filtro nenhum, e o bloom é uma cópia do texto atrás
delas, em gradiente, com opacidade baixa. O traço de 1px em `--traco` no contorno interno
precisa voltar a ser visível — hoje ele sumiu debaixo do blur.

Sua nota sobre o contraste da linha de baixo depender da posição sobre o gradiente está
certa e vale registrar no `PLAN.md` para a virada de template. Não trate agora.

---

## Movimento 1 — Fase 2: o Raio-X

Spec completa na seção 5 do briefing. Use o `camadas.ts` corrigido e o `baselines.json`
que já enviei. Recapitulando só o que não pode escorregar:

- **Empilhe por `alturaPx`.** Todas as camadas são 2000 × 1200 com objeto centralizado;
  as larguras relativas já estão embutidas. Não aplique escala por camada.
- **O medidor calcula altura montada**, aplicando `afundamento` — não soma `alturaCm`.
  Limiar de aviso em 8,5 cm, barra escalada de 0 a 10 cm.
- **Sombra de contato vem do `baselines.json`.** Nada de `getImageData` em runtime.
- **Reordenar:** pães travados nas extremidades, `afundamento` limitado a 0.65 quando a
  camada está no topo, molho só em posição adjacente a um pão.
- **Selar:** o fundo troca para `chapa-vazia.webp`, a pilha comprime em 280ms e assenta na
  superfície, e a varredura de calor sobe pela pilha em 1,2s. Uma vez, e para. A pilha que
  aparece na chapa é a que o usuário montou — não use `chapa-selagem.webp` aqui.
- **Toque:** Pointer Events, e todo gesto com equivalente sem arrasto.
- Carregue as camadas com IntersectionObserver `rootMargin: '100%'`, servidas em `800w`.

## Movimento 2 — Fase 3: o resto da página

Na ordem da seção 8 do briefing, com as correções que já decidimos:

1. **Hero** — `chapa-selagem.webp`. Ele virou o hero por ser atmosférico e noturno; o
   `x-tudo` desceu para os fixos. Fraunces grande, "das 18h às 4h".
2. **Fixos** — os 6 lanches como fichas de montagem, não cards. Imagem do fixo + ficha
   técnica em Plex Mono: gramatura, altura, tempo de chapa, temperatura interna.
3. **A chapa** — bloco sobre o método, `chapa-vazia.webp` como fundo. Texto curto, sem
   storytelling de família.
4. **Está aberto?** — fuso fixo em `America/Sao_Paulo`, tabela de horários que já mandei,
   recalculando a cada 60s.
5. **Rodapé** — endereço, telefone, o letreiro pequeno ainda tremendo.
6. **Acessibilidade e performance** — foco visível, ordem de tabulação, alt text,
   `prefers-reduced-motion` em tudo que se move, lazy loading em todas as imagens fora do
   primeiro viewport.

As quatro macros entram como textura de fundo sobre `--fumo`, opacidade 8–14%, nunca em
primeiro plano.

---

## Como quero que você trabalhe nisto

Entregue a página inteira de uma vez. Não me devolva estados intermediários pedindo
aprovação no meio — eu prefiro ver o conjunto e lapidar depois.

Mas duas coisas não podem ser resolvidas por conta própria: se algum ponto da spec do
raio-x não fechar na implementação, **pare e me pergunte**, não improvise. E se você
precisar de um asset que não existe na seção 7, **não gere placeholder** — me diga qual e
por quê.

Três coisas que eu vou conferir primeiro, então trate com atenção:

- Nenhuma medição em `--latao`, nenhum ingrediente sob luz `--letreiro`.
- Plex Mono só dentro do medidor, das cotas das chamadas e das fichas técnicas.
- O alinhamento das linhas de chamada: rótulos numa coluna fixa à esquerda, nunca
  centralizados, nunca acompanhando a largura do ingrediente.

Termine com o RELATÓRIO nos quatro campos. No **Risco**, me diga especificamente o que
você testou no raio-x e o que não deu tempo de testar.
