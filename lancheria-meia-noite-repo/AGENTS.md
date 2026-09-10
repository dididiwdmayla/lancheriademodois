# AGENTS.md — Lancheria Meia-Noite

Contrato do projeto. Vale para qualquer agente. `CLAUDE.md` contém apenas `@AGENTS.md`.

Stack: Next.js App Router, TypeScript, Tailwind, Vercel.
Site vitrine da WillDev. Vira template do nicho lancheria no Radar depois.

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

## Lei do movimento

Um momento orquestrado por rota — a intro do letreiro. Todo o resto responde a uma ação do
usuário. `prefers-reduced-motion` tratado em tudo que se move, sem exceção.

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

`camadas.ts` — 19 camadas. Campos: `slug`, `arquivo`, `alturaPx`, `afundamento`,
`precoCent`, `obrigatorio`.
**Não existem `alturaCm` nem `pesoG`.** Foram removidos de propósito: nenhum dono de
lancheria consegue preencher isso, e estimativa errada é pior que nada.

`fixos.ts` — 6 lanches, campo `forma: 'prensado' | 'redondo'` e a lista `camadas`.
**Preço do fixo é calculado da composição**, base R$ 12,00 mais a soma dos `precoCent`.
Nunca fixado à mão — senão editar o lanche não move o valor.

Camadas repetidas são permitidas: máximo 3 do mesmo, 16 na pilha. Pães únicos, obrigatórios
e travados nas extremidades. IDs `#rx-camada-{slug}-{n}`, `n` a partir de 1.
Molho só em posição adjacente a um pão. `afundamento` limitado a 0.65 quando a camada está
no topo.

Aviso "risco de desmontar": **acima de 10 camadas.** Não existe limiar em centímetros.

---

## Assets — 35 arquivos, finais

```
/public/camadas/   19 · 2000×1200 · alpha
/public/fixos/     10 · 2000×2000 · alpha
/public/chapa/      2 · 2400×1600
/public/macro/      4 · 2000×1333
```

Já normalizados. **Não redimensione, não reprocesse, não renomeie.**
Bebidas e acompanhamentos **não têm imagem** e entram como peça tipográfica.

**Nunca gere placeholder de imagem.** Se faltar um asset, pare e diga qual e por quê.

---

## Navegação

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
com seis recortes num JPEG de qualidade 55.

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
mais os IDs `#rx-painel`, `#rx-medidor`, `#rx-selar` e os `#lt-*`.
