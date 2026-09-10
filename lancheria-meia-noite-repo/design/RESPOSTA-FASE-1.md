# Respostas — Lancheria Meia-Noite

Boa devolutiva. Três achados seus são reais e mudam o briefing. Vamos por ordem.

---

## Antes de tudo: erro meu nos assets

Três arquivos que você recebeu estavam desatualizados — `pao-topo`, `pao-base` e `tomate`
eram versões antigas, com a câmera 20–28° acima da linha do horizonte. Já foram
substituídos. Baixe de novo esses três. Os outros nove não mudaram.

Isso explica parte do item (a): o `tomate` antigo tinha 438px de altura porque estava
fotografado de cima, mostrando a face de corte inteira. O correto tem 139px.

---

## (a) alturaPx × alturaCm — decisão: **opção 4, que não estava na lista**

Você diagnosticou certo e propôs a saída errada. Posicionar por `alturaCm` encolheria a
alface para um quarto da altura do pão, e a foto ficaria absurda — porque os babados da
folha *ocupam* espaço vertical de verdade dentro de um lanche. Os 0,5 cm eram a espessura
do material prensado, não a presença visual da camada. **O dado estava errado, não o
layout.**

Recalibrei `alturaCm` a partir do pixel medido, ancorando a escala no pão de cima
(456 px = 2,1 cm → **217 px/cm**) e aplicando a mesma constante às doze. Agora `alturaPx`
e `alturaCm` são a mesma grandeza em duas unidades e não podem se contradizer.

**Empilhe por `alturaPx`.** As cotas continuam no desenho.

## (b) Estado de aviso — decisão: **o medidor mede altura montada, e o limiar cai para 8,5 cm**

Você estava certo de que era inalcançável, mas a causa é mais funda: somar `alturaCm` das
camadas escolhidas é medir a pilha explodida, não o lanche. O medidor tem que aplicar o
`afundamento`:

```
alturaMontada = alturaPx[0] + Σ alturaPx[i] × (1 − afundamento[i])   , i > 0
                ─────────────────────────────────────────────────
                                    217
```

Com os dados corrigidos: um x-salada dá **5,9 cm**, as doze camadas dão **9,8 cm**.
Limiar de aviso: **8,5 cm**. Barra do medidor escalada de 0 a 10 cm.

Não permita camadas repetidas. `#rx-camada-{slug}` continua único.

## (c) Fonte da verdade — confirmado

O ASCII da seção 5 é ilustrativo. `camadas.ts` + base de R$ 12,00 mandam.

## (d) O clímax mostra o lanche errado — decisão: **inverter a solução**

Achado excelente, e é o mais importante dos dez. Mas dissolver para `macro-chapa` mata o
pagamento emocional: o usuário projetou um lanche e recebe uma textura.

Faça o contrário. **A pilha comprimida dele desce sobre `chapa-vazia.webp`.** É o lanche do
usuário na chapa, não uma foto genérica. A selagem acontece em cima do que ele montou:

- fundo troca de `--borra` para `chapa-vazia.webp` em 200ms
- a pilha comprime e assenta na superfície
- varredura de calor: gradiente quente em `--latao` subindo pela pilha por 1,2s, mais
  distorção sutil no ar acima. Uma vez, e para.

Isso resolve de quebra o descasamento de luz: as camadas foram fotografadas com chave
neutra, e o gradiente quente da selagem é exatamente o que as reconcilia com a chapa.

`chapa-selagem.webp` sai do clímax e **vira o hero.** Ele é atmosférico, noturno e sóbrio —
serve melhor ao tom da casa do que um x-tudo recortado em fundo chapado. O `x-tudo.webp`
desce para a seção dos fixos.

## (e) Baselines — pré-computadas, estão no repo

Você está certo sobre o custo. Não faça `getImageData` em runtime.

`/data/baselines.json` acompanha esta mensagem. Estrutura por slug:

```json
{ "carne": { "caixa": [x0, y0, x1, y1], "base": [0.82, 0.85, ...] } }
```

`caixa` é o bounding box do objeto dentro do canvas de 2000 × 1200. `base` são 240 amostras
da linha inferior da silhueta, normalizadas de 0 a 1 dentro da altura da caixa. Reconstrua a
sombra desenhando essa curva num canvas pequeno, borre 10px, opacidade 37%, desloque 14px.

Sobre o alpha sujo: medi os arquivos entregues. Alface 0,24%, cebola 0,05%, tomate 0,00% de
pixels opacos com cor de fundo — desprezível. **Batata palha tem 1,76%**, que é real e está
nos vãos entre os palitos. É a única onde a baseline pode nascer com dentes; se sair ruim,
me avise que eu regero só ela.

## (f) Reordenar — aprovado com um acréscimo

Sua proposta está certa: pães travados nas extremidades, reordenação livre entre eles,
`afundamento` limitado a 0.65 quando a camada está no topo.

Acréscimo: **o molho só pode ocupar posição adjacente a um pão.** Ele é passado no pão, não
flutua no meio da pilha. Fora dessa posição, recusa o drop e devolve a camada.

## (g) Dois momentos orquestrados — sua leitura está correta

O letreiro é o momento da rota. A selagem responde a uma ação e não conta. Registre no
`CLAUDE.md` exatamente como você escreveu, para não virar precedente.

## (h) Fuso — confirmado, com a tabela completa

Fixe `America/Sao_Paulo`. Nunca o relógio do visitante.

| Hora local da casa | Resposta |
|---|---|
| 18:00 – 23:59 | "Aberto. Fecha em Xh." (fecha às 4h do dia seguinte) |
| 00:00 – 04:00 | "Aberto. Fecha em Xh." (fecha às 4h de hoje) |
| 04:01 – 17:59 | "Fechada. Abre hoje às 18h." |

Nos últimos 30 minutos: "Aberto. Últimos pedidos." Recalcule a cada 60s, não só no mount.

## (i) Peso inicial — aprovado, mas não no primeiro gesto

Não carregue as camadas no `load`, e também não espere o primeiro toque — aí o usuário
espera olhando um painel vazio.

Carregue quando a seção do raio-x estiver a **um viewport de distância** de entrar:
IntersectionObserver com `rootMargin: '100%'`. Nesse ponto ele já está rolando na direção
e as imagens chegam antes dele.

Sirva com `sizes` correto. As camadas renderizam a ~400px de largura; entregue-as em
`800w` para telas 2x, não os 2000px nativos.

## (j) Toque — aprovado integralmente

Pointer Events, e todo gesto com equivalente sem arrasto. Isso não é concessão a mobile, é
requisito de teclado e leitor de tela.

---

## Sobre suas duas perguntas de tipografia

**`opsz` acompanhando o tamanho a partir do d3 — aprovado.** Você está certo: WONK em
`opsz` 144 num corpo de 1.5rem vira defeito, não caráter.

**A chamada dividida — aprovada exatamente como você propôs.** Nome do ingrediente em
Archivo 500 `wdth` 92, cota em Plex Mono. Seu raciocínio é o certo: mono no nome é mono
virando decoração, Archivo na cota quebra o alinhamento tabular da coluna.

**A nota de contraste está aceita como regra:** `--latao` só em preço grande, CTA e barra de
aviso. Nunca em rótulo mono pequeno. Para número pequeno, `--osso`.

## Sobre a entrega em HTML único

Entendido e sem problema. O componente único com a separação interna e os IDs contratados é
o que eu preciso daqui. A montagem do repo Next é passo seguinte, em outra ferramenta.
Mantenha a árvore da seção 2 como espelho fiel do que o handoff vai gerar.

---

## `camadas.ts` corrigido — substitua o da seção 6

```ts
export const ESCALA_PX_POR_CM = 217

export const CAMADAS = [
  { slug:'pao-base',     arquivo:'/camadas/pao-base.webp',     alturaPx:285, afundamento:0,    alturaCm:1.3, pesoG:32,  precoCent:0,   ordem:1,  obrigatorio:true  },
  { slug:'molho',        arquivo:'/camadas/molho.webp',        alturaPx:108, afundamento:0.92, alturaCm:0.5, pesoG:18,  precoCent:200, ordem:2,  obrigatorio:false },
  { slug:'alface',       arquivo:'/camadas/alface.webp',       alturaPx:467, afundamento:0.55, alturaCm:2.2, pesoG:12,  precoCent:150, ordem:3,  obrigatorio:false },
  { slug:'tomate',       arquivo:'/camadas/tomate.webp',       alturaPx:139, afundamento:0.40, alturaCm:0.6, pesoG:34,  precoCent:200, ordem:4,  obrigatorio:false },
  { slug:'cebola',       arquivo:'/camadas/cebola.webp',       alturaPx:399, afundamento:0.55, alturaCm:1.8, pesoG:28,  precoCent:350, ordem:5,  obrigatorio:false },
  { slug:'carne',        arquivo:'/camadas/carne.webp',        alturaPx:381, afundamento:0.42, alturaCm:1.8, pesoG:120, precoCent:900, ordem:6,  obrigatorio:false },
  { slug:'queijo',       arquivo:'/camadas/queijo.webp',       alturaPx:420, afundamento:0.62, alturaCm:1.9, pesoG:22,  precoCent:400, ordem:7,  obrigatorio:false },
  { slug:'presunto',     arquivo:'/camadas/presunto.webp',     alturaPx:416, afundamento:0.58, alturaCm:1.9, pesoG:25,  precoCent:450, ordem:8,  obrigatorio:false },
  { slug:'bacon',        arquivo:'/camadas/bacon.webp',        alturaPx:305, afundamento:0.48, alturaCm:1.4, pesoG:30,  precoCent:700, ordem:9,  obrigatorio:false },
  { slug:'ovo',          arquivo:'/camadas/ovo.webp',          alturaPx:301, afundamento:0.42, alturaCm:1.4, pesoG:55,  precoCent:400, ordem:10, obrigatorio:false },
  { slug:'batata-palha', arquivo:'/camadas/batata-palha.webp', alturaPx:323, afundamento:0.52, alturaCm:1.5, pesoG:15,  precoCent:300, ordem:11, obrigatorio:false },
  { slug:'pao-topo',     arquivo:'/camadas/pao-topo.webp',     alturaPx:456, afundamento:0.30, alturaCm:2.1, pesoG:36,  precoCent:0,   ordem:12, obrigatorio:true  },
] as const

export const LIMIAR_AVISO_CM = 8.5
export const MEDIDOR_MAX_CM  = 10
export const PRECO_BASE_CENT = 1200
```

---

Aprovado. Construa a Fase 1: tokens, tipografia, shell de layout, preloader e o letreiro
completo com os sete tempos e o tremor residual. Nada além disso — sem hero, sem raio-x,
sem seções. Ao terminar, quatro linhas no máximo: o que ficou pronto e o que ficou pendente.
