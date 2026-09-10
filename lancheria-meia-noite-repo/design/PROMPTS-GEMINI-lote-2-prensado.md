# LANCHERIA MEIA-NOITE
## Prompts de geração — lote 2, o prensado

11 arquivos novos: 7 camadas e 4 fixos. Os 12 assets da série A original continuam válidos
e são reaproveitados nos dois formatos.

---

## Decisão de cardápio que define este lote

**Quatro prensados e dois redondos.** É o que uma lancheria de Paraná realmente vende, e
faz o template do Radar cobrir as duas formas em vez de uma.

Os dois redondos são **X-Salada** e **X-Tudo** — os únicos dois que se montam inteiros com
as camadas que já existem. As fotos do X-Bacon, X-Calabresa, X-Frango e do cachorro-quente
ficam em reserva; não precisam ser refeitas nem descartadas.

Por causa disso o `frango-file` que estava pendente **sai da lista** — o frango agora entra
desfiado, que é a forma do prensado. A `calabresa` continua necessária.

---

## O que continua servindo dos 12 originais

`carne` `queijo` `bacon` `presunto` `alface` `tomate` `cebola` `ovo` `batata-palha` `molho`

Todos funcionam nos dois formatos. As camadas de recheio não tocam a crosta do pão, então a
largura atual (1150–1560px) cai bem dentro de um pão prensado de 1750px.

Os dois pães redondos — `pao-base` e `pao-topo` — continuam, e passam a ser usados só nos
dois lanches redondos.

---

# CAMADAS NOVAS — 7 arquivos

**Canvas final: 2000 × 1200 px** · mesmo bloco base da série A original.

## Bloco base (cole no início dos 7)

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
would rest inside a sandwich. Its flat faces point up and down, toward the ceiling and
the floor — never toward the camera. The camera is level with the ingredient and sees
only its narrow rim, its thickness. The resulting silhouette is a WIDE, THIN, HORIZONTAL
BAND — far wider than it is tall. Do not stand the ingredient up. Do not tilt it. If the
silhouette is taller than it is wide, the image is wrong.
```

## Os 7 prompts

**`pao-prensado-base.webp`** — largura alvo 1750px
```
Subject: the bottom half of a Brazilian sandwich roll for a pressed sandwich —
a soft white rectangular bread, split horizontally, seen in strict side elevation.
Flat bottom crust with the pale golden marks of a sandwich press running across it.
The cut face is at the top, showing soft dense white crumb, lightly compressed.
Roughly 3cm tall and much wider than it is tall. Rustic and slightly irregular,
the bread of a corner snack bar, not an artisan bakery loaf.
```

**`pao-prensado-topo.webp`** — largura alvo 1750px
```
Subject: the top half of a Brazilian sandwich roll for a pressed sandwich —
a soft white rectangular bread, split horizontally, seen in strict side elevation.
The top crust is flattened by the press, with pale golden griddle marks and a
slight sag in the middle where it pressed down onto the filling. The cut face is
at the bottom, showing soft dense white crumb. Roughly 3cm tall, much wider than
tall, the outline gently uneven from the pressing.
```

**`calabresa.webp`** — largura alvo 1400px
```
Subject: a loose horizontal layer of grilled calabresa sausage rounds, lying flat
side by side and slightly overlapping. About 8mm thick each, charred blistered
edges, deep red-brown, glossy with rendered fat. The silhouette is a wide low band
with a slightly irregular top edge where the rounds sit at different heights.
```

**`frango-desfiado.webp`** — largura alvo 1500px
```
Subject: a horizontal layer of shredded cooked chicken in a light creamy sauce,
spread flat as it would sit inside a sandwich. Pale golden strands visible at the
near edge, moist and glossy, packed loosely so individual shreds and small gaps
read clearly. The silhouette is a wide low band with a soft uneven top edge.
```

**`milho.webp`** — largura alvo 1350px
```
Subject: a single loose horizontal layer of sweet corn kernels, lying flat side by
side, one kernel deep. Bright yellow, glossy and wet, each kernel distinct with
small dark gaps between them. The silhouette is a wide low band, bumpy along the
top edge from the individual kernels, about 8mm tall.
```

**`queijo-ralado.webp`** — largura alvo 1450px
```
Subject: a loose horizontal layer of coarsely grated white cheese, sprinkled flat
as it would sit inside a sandwich. Pale ivory strands piled loosely, individual
shreds and air gaps visible, slightly melted and clumping in places. The silhouette
is a wide low band with a soft ragged top edge.
```

**`salsicha.webp`** — largura alvo 1400px
```
Subject: a loose horizontal layer of grilled sausage rounds, sliced from a Brazilian
hot dog sausage, lying flat side by side and slightly overlapping. About 1cm thick,
pinkish red with dark charred marks on the cut faces, glossy. The silhouette is a
wide low band, slightly uneven along the top.
```

### Normalização das camadas novas

```bash
magick entrada.png -trim +repage -resize {LARGURA}x -background none \
  -gravity center -extent 2000x1200 saida.png
magick saida.png -quality 92 saida.webp
```

Substitua `{LARGURA}` pela largura alvo de cada item, listada acima.

---

# FIXOS NOVOS — 4 prensados

**Canvas final: 2000 × 2000 px** · uso: ícone no cardápio, tamanho pequeno.

Mudança importante em relação à série B original: o prensado é fotografado **cortado ao
meio, com a seção virada para a câmera.** É assim que ele é servido, e é o que o torna um
raio-x natural.

## Bloco base (cole no início dos 4)

```
Photorealistic food photography of a Brazilian pressed sandwich (prensado),
cut cleanly in half, with the cut section facing the camera at a slight angle.
No plate, no props, no hands, no text.

Camera: three-quarter view, lens about 20 degrees above the horizon line, close
enough that the cut section fills most of the frame. 85mm lens, f/5.6, focus on
the cut face, gentle falloff behind.

Lighting: one warm key light from upper left at 40 degrees through a large softbox,
warm bounce fill from the right at 20 percent. No cool light anywhere in the frame.
No cast shadow, no ground plane — the sandwich floats.

Background: completely flat seamless mid-grey, single solid tone.

Framing: subject centered, occupying about 80 percent of the square frame.

The bread: soft white rectangular roll, flattened by the press, pale golden griddle
marks on the outside, dense soft crumb visible at the cut. The filling is layered and
generous and spills very slightly at the cut edge — this is corner snack bar food,
abundant and slightly messy, not a styled restaurant burger.
```

## Os 4 prompts

**`prensado-completo.webp`**
```
Filling, bottom to top at the cut face: lettuce, tomato slices, a beef patty,
bacon strips, grilled calabresa rounds, sweet corn, grated white cheese, and a
thick fall of shoestring potato sticks. Overloaded and colourful.
```

**`prensado-frango.webp`**
```
Filling, bottom to top at the cut face: lettuce, tomato slices, a generous layer of
shredded chicken in creamy sauce, sweet corn, and grated white cheese melting into
the chicken. Softer and paler in tone than the others.
```

**`prensado-calabresa.webp`**
```
Filling, bottom to top at the cut face: lettuce, grilled calabresa sausage rounds
with charred edges, caramelized onion, and melted mozzarella pulling slightly at the
cut. Darker and smokier in tone.
```

**`prensado-meia-noite.webp`**
```
Filling, bottom to top at the cut face: tomato slices, a beef patty, bacon strips,
a fried egg with the yolk visible in cross-section, melted mozzarella, and shoestring
potato sticks. The house sandwich — the tallest and most excessive of the four.
```

### Normalização dos fixos

```bash
magick entrada.png -trim +repage -resize 1700x1700\> -background none \
  -gravity center -extent 2000x2000 saida.png
magick saida.png -quality 92 saida.webp
```

---

# Negativos (todos os 11)

```
no text, no watermark, no logo, no hands, no plate, no cutlery, no wooden board,
no rustic props, no herb garnish, no checkered paper, no artificial color saturation,
no plastic CGI look, no lens flare, no cool blue lighting, no gradient background,
no vignette
```

O `no cool blue lighting` não é detalhe. Toda luz fria do site é reservada ao letreiro e às
medições do raio-x. Um PNG com fill azulado quebra a regra de temperatura.

---

# Ordem de geração

Se quiser validar antes de gerar tudo: **faça os dois pães prensados primeiro.** Me mande,
eu monto uma pilha de teste com os recheios que já existem, e a gente vê a proporção antes
de você comprometer os outros nove.

É o mesmo método que pegou o tomate em pé e o pão de baixo a 25° no lote anterior.

---

# Checklist antes de dar por pronto

- [ ] As 7 camadas novas têm exatamente 2000 × 1200
- [ ] Empilhadas com as 12 antigas, os centros coincidem
- [ ] Nenhuma mostra a face superior — tudo é elevação lateral pura
- [ ] A direção da luz é a mesma em todas (chave em cima à esquerda)
- [ ] Nenhuma tem tom azulado no fill
- [ ] Os 4 fixos estão cortados ao meio com a seção visível
