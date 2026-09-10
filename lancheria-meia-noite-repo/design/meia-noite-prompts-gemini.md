# LANCHERIA MEIA-NOITE
## Prompts de geração — Gemini

Complemento do briefing de Fase 1. 24 assets obrigatórios + série opcional.

---

## Antes de começar: o que o prompt controla e o que não controla

O Gemini **não** entrega dimensão exata nem canal alpha confiável. Ele entrega um objeto
bem iluminado sobre fundo plano. A dimensão final e a transparência vêm da normalização
depois. Não perca tempo brigando com o prompt por isso.

Fluxo por arquivo:

```
1. gerar no Gemini (fundo cinza plano, objeto centralizado)
2. BAIXAR O ARQUIVO ORIGINAL — nunca printar a tela
3. recortar o fundo por flood-fill (o cinza plano do Gemini sai limpo)
4. normalizar pro canvas exato (comando no fim de cada série)
5. exportar WebP com alpha, qualidade 92 — é o que vai pro repositório
```

**Print de tela não serve.** O original tem resolução de sobra; o print vem com menos de
600px e com os botões da interface gravados na imagem, que entram no cálculo do `-trim` e
descentralizam o objeto no canvas.

**Formato de entrega: WebP com alpha.** O PNG é intermediário de trabalho. No repositório
entram só os `.webp`, e os caminhos em `camadas.ts` usam essa extensão.

**Onde gastar a variedade:** a série A é deliberadamente monótona — mesma câmera, mesma
luz, mesmo enquadramento nos 12 arquivos. Isso é função, não preguiça: qualquer variação
desalinha a pilha. A variedade de ângulo, escala e técnica está toda nas séries B, C e D,
que é onde ela aparece pro visitante.

---

# SÉRIE A — Camadas do raio-x

**Canvas final: 2000 × 1200 px** · 12 arquivos · 0° lateral rigoroso

## Bloco base (cole no início de TODOS os 12 prompts)

```
Photorealistic food photography, single isolated ingredient, no plate, no props,
no hands, no text, no garnish.

Camera: locked tripod, perfectly level, dead-on side elevation at exactly 0 degrees —
the lens is at the exact vertical center of the subject. No perspective distortion,
no top surface visible, no bottom surface visible. 100mm macro lens equivalent,
f/8, everything in sharp focus front to back.

Lighting: one warm soft key light from upper left at 35 degrees, large softbox,
warm neutral bounce fill on the right at 15 percent. No rim light, no backlight.
No cast shadow, no ground plane, no reflection, no surface beneath the subject —
the object floats.

Background: completely flat seamless mid-grey, single solid tone, no gradient,
no vignette, no texture.

Framing: subject centered horizontally and vertically, occupying about 70 percent
of frame width, generous empty margin on all sides. Wide horizontal frame, 5:3.

Style: honest and appetizing, slight natural imperfection, real texture,
no plastic CGI sheen, no over-saturation.

CRITICAL GEOMETRY RULE: the ingredient lies FLAT in a horizontal plane, exactly as it
would rest inside an assembled burger. Its flat faces point up and down, toward the
ceiling and the floor — never toward the camera. The camera is level with the ingredient
and sees only its narrow rim, its thickness. The resulting silhouette is a WIDE, THIN,
HORIZONTAL BAND — far wider than it is tall. Do not stand the ingredient up. Do not tilt
it. Do not show its top face or its bottom face. If the silhouette is taller than it is
wide, the image is wrong.
```

## Prompts por item

**`pao-topo.png`**
```
Subject: the top half of a Brazilian pão de leite burger bun, cut horizontally.
Soft glossy golden-brown enriched dough with a light scatter of sesame seeds.
Domed crown, slightly irregular. The cut face is at the bottom edge, showing fine
tight crumb. Seen in strict side elevation.
```

**`pao-base.png`**
```
Subject: the bottom half of a Brazilian pão de leite burger bun. Flat base,
soft golden crust, cut face at the top showing fine tight crumb, faintly toasted
and slightly compressed at the center. Seen in strict side elevation.
```

**`carne.png`**
```
Subject: a single 120g smashed beef patty, seen edge-on. Dark deeply caramelized
crust with lacy irregular edges where it hit the griddle. Visible thickness of about
1.5cm, slightly domed. Juices beading on the surface. Seen in strict side elevation.
```

**`queijo.png`**
```
Subject: a single slice of melted mussarela cheese, seen edge-on, drooping and
draping downward at both ends as if it just melted over something and is hanging
free. Glossy, soft, slightly translucent at the thin edges. The center is a flat
horizontal band. Seen in strict side elevation.
```

**`bacon.png`**
```
Subject: two crisp strips of streaky bacon lying flat and overlapping slightly,
seen edge-on. Rippled and buckled from the heat, deep red-brown with rendered
white fat lines, glossy. Seen in strict side elevation.
```

**`presunto.png`**
```
Subject: a single slice of cooked ham, folded loosely in soft waves so the folds
read clearly from the side. Pale pink, matte surface, slight moisture.
Seen in strict side elevation.
```

**`alface.png`**
```
Subject: a single leaf of crisp curly green lettuce, arranged as one horizontal
layer with the ruffled edges spilling out to both sides. Bright fresh green,
crisp turgid texture, a few water droplets. Seen in strict side elevation.
```

**`tomate.png`**
```
Subject: two round slices of ripe tomato lying FLAT, one behind the other, both
resting in a horizontal plane. The camera is at the height of the slices, so the
round cut faces are completely hidden — only the narrow outer rim is visible,
forming a thin horizontal band about 6mm tall and 11cm wide. Deep red glossy skin
around the rim, a faint wet gleam along the top edge, the two slices offset slightly
so the back one peeks out at the right end. The silhouette is roughly 15 times
wider than it is tall.
```

> Este item já falhou uma vez — o Gemini colocou as fatias em pé, de frente pra câmera.
> Se repetir, acrescente ao final: `Think of it as a coin lying on a table, photographed
> from the level of the tabletop — you see the edge of the coin, never its face.`

**`cebola.png`**
```
Subject: a loose layer of caramelized onion strands, seen edge-on. Deep amber and
glossy, soft and collapsed, irregular silhouette with a few strands escaping the
mass at both ends. Seen in strict side elevation.
```

**`ovo.png`**
```
Subject: a single fried egg seen from the side. Intact domed orange yolk sitting
proud above a thin layer of set white with slightly crisp browned edges.
The yolk is the highest point. Seen in strict side elevation.
```

**`batata-palha.png`**
```
Subject: a loose horizontal layer of Brazilian batata palha, very thin shoestring
potato sticks. Golden and crisp, packed loosely so individual strands and small
air gaps are visible, ragged uneven silhouette on top and at both ends.
Seen in strict side elevation.
```

**`molho.png`**
```
Subject: a thin horizontal layer of creamy pale orange burger sauce, seen edge-on,
as if spread on a flat surface that has been removed. About 4mm thick, high gloss,
soft rounded edges with one slow drip forming at the right end.
Seen in strict side elevation.
```

## Normalização da série A

```bash
magick entrada.png -trim +repage -resize 1400x -background none \
  -gravity center -extent 2000x1200 saida.png
```

Rode os 12 com o mesmo comando. O `-resize 1400x` fixa a largura do objeto, o `-extent`
centraliza no canvas. Confira depois abrindo os 12 empilhados num mesmo documento — se um
estiver fora de eixo, ele salta na hora.

---

# SÉRIE B — Fixos da casa

**Canvas final: 2000 × 2000 px** · 6 arquivos · 3/4 alto, 25° acima do horizonte

## Bloco base

```
Photorealistic food photography of a complete assembled Brazilian lancheria burger,
no plate, no props, no hands, no text, no background elements.

Camera: three-quarter view, lens positioned 25 degrees above the horizon line and
about 20 degrees off-axis to the left. 85mm lens, f/5.6, focus on the front edge
of the patty, very slight falloff at the back of the bun.

Lighting: one warm key light from upper left at 40 degrees through a large softbox,
warm bounce fill from the right at 20 percent, and a single narrow warm specular
highlight along the top of the bun. No cool light anywhere in the frame.
No cast shadow, no ground plane — the burger floats.

Background: completely flat seamless mid-grey, single solid tone.

Framing: subject centered, occupying about 75 percent of the square frame.

Style: built by hand, slightly imperfect stack, real melt and slump, visible
steam-free freshness. Appetizing but not styled to the point of looking fake.
```

## Prompts por item

**`x-salada.png`**
```
Stack from bottom: pão de leite base, lettuce, two tomato slices, 120g smashed
beef patty with dark crust, melted mussarela draping down the sides, pão de leite
crown with sesame. Clean and legible — this is the reference burger.
```

**`x-bacon.png`**
```
Stack from bottom: pão de leite base, 120g smashed patty, melted mussarela,
three crisp buckled bacon strips fanned so their rippled edges break the silhouette,
pão de leite crown. Slightly taller than the classic.
```

**`x-tudo.png`**
```
Stack from bottom: pão de leite base, lettuce, tomato, 120g patty, ham slice,
melted mussarela, bacon, a fried egg with intact yolk visible at the front edge,
a generous fall of batata palha spilling out of the sides, pão de leite crown
pushed high and tilted slightly off-center by the height. Overloaded and leaning —
it should look structurally ambitious.
```

**`x-calabresa.png`**
```
Stack from bottom: pão de leite base, 120g patty, sliced grilled calabresa sausage
rounds with charred edges arranged in a visible layer, caramelized onion,
melted mussarela, pão de leite crown. Darker and smokier in tone than the others.
```

**`x-frango.png`**
```
Stack from bottom: pão de leite base, lettuce, tomato, a grilled chicken breast
fillet with visible griddle marks, melted mussarela, a thin layer of pale sauce
just visible at the edge, pão de leite crown. Lighter in color overall.
```

**`cachorro-quente.png`**
```
A Brazilian lancheria hot dog, not a burger: a split soft roll holding two
sausages side by side, buried under batata palha, with visible corn kernels,
peas, and grated cheese, and two sauce lines running the length. Same camera and
light as the burgers. Wider than tall — let it sit horizontally in the square frame.
```

## Normalização da série B

```bash
magick entrada.png -trim +repage -resize 1600x1600\> -background none \
  -gravity center -extent 2000x2000 saida.png
```

---

# SÉRIE C — Clímax da chapa

**Canvas final: 2400 × 1600 px** · 2 arquivos

**`chapa-selagem.png`**
```
Photorealistic photograph of a single assembled smashed burger sitting on a
well-used commercial flat-top griddle. Camera: three-quarter view, 25 degrees above
the horizon, 85mm lens, f/4, focus on the burger, the griddle surface falling
gently out of focus toward the back of the frame.

Lighting: one warm key from upper left, plus a low warm glow rising from the griddle
surface itself onto the underside of the burger. Strong specular highlights on the
oiled steel. Everything warm — no cool light in frame.

The griddle: dark seasoned steel, visible scratches and heat discoloration, a thin
film of oil catching the light, faint char residue near the edges. Slight heat
shimmer distortion in the air directly above the surface.

No hands, no spatula, no text, no other food. Wide horizontal frame, 3:2.
Background beyond the griddle: dark and out of focus, nearly black.
```

**`chapa-vazia.png`**
```
Identical scene, identical camera position, identical lighting — but the griddle is
empty. Same dark seasoned steel, same oil film, same scratches, same heat shimmer,
same out-of-focus dark background. Nothing on the surface. Wide horizontal frame, 3:2.
```

> Gere as duas na mesma sessão, uma logo após a outra, referenciando a primeira ao pedir
> a segunda. Elas precisam casar pixel a pixel no fundo — o corte entre os dois estados
> denuncia qualquer diferença de enquadramento.

## Normalização da série C

```bash
magick entrada.png -resize 2400x1600^ -gravity center -extent 2400x1600 saida.png
```

Série C **não** leva recorte — o fundo faz parte da imagem.

---

# SÉRIE D — Macro

**Canvas final: 1600 × 1600 px** · 4 arquivos · aqui a variedade é o ponto

Estas viram textura de fundo a 8–14% de opacidade. Precisam ter estrutura visual forte e
serem diferentes entre si em escala e ângulo, senão o fundo do site fica repetitivo.

**`macro-corte.png`** — corte transversal, câmera a 0°
```
Extreme macro photograph of a vertical cross-section through a smashed beef patty,
sliced clean with a sharp blade. Camera dead-on at the cut face, 0 degrees.
100mm macro lens, f/2.8, focus on the center of the cut, edges falling soft.
Visible: dark caramelized crust at top and bottom, pink-grey interior gradient,
individual muscle fibers, small pockets of rendered fat, beads of juice on the
cut face. Warm key light from the left. Dark neutral background. Fills the frame.
```

**`macro-pao.png`** — superfície, câmera rasante
```
Extreme macro photograph of the surface of a pão de leite bun, camera at a very
low grazing angle almost parallel to the surface, so the sesame seeds cast long
raking shadows and the crust texture reads as landscape. 100mm macro, f/3.5,
narrow plane of focus running left to right through the middle of the frame.
Warm key light from the left, low. Fills the frame edge to edge.
```

**`macro-queijo.png`** — gotejamento, câmera de baixo pra cima
```
Extreme macro photograph of melted mussarela cheese dripping downward, camera
positioned slightly below the drip and angled up. A single strand stretches and
thins toward the bottom of the frame, catching a warm specular highlight along its
length. 100mm macro, f/2.8, focus on the neck of the strand. Dark background,
strong contrast, the cheese almost glowing against it.
```

**`macro-chapa.png`** — superfície de aço, vista de cima
```
Extreme macro photograph of the surface of a used commercial steel griddle, camera
directly overhead at 90 degrees. Circular scouring marks, scratches, heat blueing,
carbon residue in the low spots, a thin uneven film of oil catching a broad soft
warm reflection. 100mm macro, f/8, sharp across the whole frame.
Abstract and textural — no food, no tools.
```

## Normalização da série D

```bash
magick entrada.png -resize 1600x1600^ -gravity center -extent 1600x1600 saida.png
```

Série D também não leva recorte.

---

# SÉRIE E — Giro 360° (opcional)

**Canvas final: 1400 × 1400 px** · 24 quadros

Aviso honesto: gerar 24 quadros consistentes de rotação em modelo de imagem é frágil.
O objeto muda sutilmente de forma entre quadros e o giro fica trêmulo. Duas saídas melhores:

1. **Reduza pra 12 quadros** e faça o giro mais lento. Metade dos erros, metade da chance
   de o olho pegar a inconsistência.
2. **Não gere — filme.** Se você tiver um lanche real e um prato giratório, 12 fotos
   resolvem melhor do que 24 gerações.

Se for gerar, use o bloco base da série B trocando o ângulo horizontal a cada quadro:

```
[bloco base da série B]
Rotate the subject 15 degrees clockwise around its vertical axis from the previous
frame. Camera, lighting, distance, and subject remain absolutely identical —
only the subject's rotation changes. This is frame {N} of 24 in a turntable sequence.
```

Gere sempre referenciando o quadro anterior na mesma sessão. Descarte a série inteira e
recomece se o quadro 12 não parecer o mesmo objeto do quadro 1.

---

# Negativos (todos os prompts)

```
no text, no watermark, no logo, no hands, no plate, no cutlery, no wooden board,
no rustic props, no scattered crumbs as decoration, no herb garnish,
no artificial color saturation, no plastic CGI look, no lens flare,
no cool blue lighting, no gradient background, no vignette
```

O "no cool blue lighting" não é detalhe. Toda luz fria do site é reservada ao letreiro e
às medições do raio-x. Um PNG com fill azulado quebra a regra de temperatura e vai parecer
errado no meio da página sem que ninguém consiga dizer por quê.

---

# Checklist antes de dar por pronta a série A

- [ ] Os 12 arquivos têm exatamente 2000 × 1200
- [ ] Empilhados no mesmo documento, os centros coincidem
- [ ] Nenhum tem sombra projetada assada na imagem
- [ ] Nenhum mostra a face superior ou inferior do objeto — tudo é elevação lateral pura
- [ ] A direção da luz é a mesma nos 12 (chave em cima à esquerda)
- [ ] Nenhum tem tom azulado no fill
