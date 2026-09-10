# LANCHERIA MEIA-NOITE
## Briefing de direção — v2, definitivo

Projeto vitrine WillDev. Destino posterior: template do nicho lancheria no Radar.
Stack: Next.js App Router, TypeScript, Tailwind, Vercel.

**Os 24 assets já existem, estão normalizados e são finais.** Não gere placeholders de
imagem, não invente nomes de arquivo, não redimensione os PNGs. Os caminhos e dimensões
estão na seção 7 e devem ser usados exatamente como listados.

---

## 1. A marca

**Lancheria Meia-Noite.** Esquina, aberta das 18h às 4h. Existe há tempo suficiente pra ter
clientela cativa e nova o bastante pra levar a comida a sério. Não é hamburgueria artesanal
com caixote de madeira. É lancheria — X-salada, X-tudo, cachorro-quente, batata, milkshake —
feita com precisão obsessiva.

A tensão que dá alma ao site: **comida de rua tratada como engenharia.**

Voz: seca, específica, sem adjetivo de menu. "Pão de leite, 48h de fermentação" ganha de
"pão artesanal irresistível". Proibido: "irresistível", "explosão de sabor", "experiência
única", "feito com amor". Se a frase caberia em qualquer lancheria do Brasil, ela sai.

---

## 2. Sistema de cor

Regra semântica rígida:

> **Luz fria = o sistema.** Medição, linhas de chamada, letreiro, estados de interface.
> **Calor = a comida.** Gordura, chapa, latão do balcão, preço, CTA.
>
> As duas temperaturas nunca se misturam no mesmo elemento. Nenhum número de medição é
> âmbar. Nenhuma foto de comida recebe overlay azul.

| Token | Hex | Uso |
|---|---|---|
| `--borra` | `#120D0B` | Fundo base. Preto-marrom quente, nunca neutro. |
| `--fumo` | `#1C1512` | Superfícies elevadas: painel do raio-x, fichas. |
| `--traco` | `#33251E` | Fios de 1px, divisórias, contornos. |
| `--osso` | `#E9E0D3` | Tipografia principal. Cor de papel de embrulho. |
| `--latao` | `#A9762F` | Calor: preço, CTA, brilho, estado de aviso. |
| `--letreiro` | `#A8C6D4` | Frio: medições, linhas de chamada, luz da placa. |

Proibido: `#000`, `#fff`, qualquer cinza neutro. Não crie um `--accent` genérico.
Não invente tokens fora desta tabela.

---

## 3. Tipografia

**Display — Fraunces.** `opsz` no máximo, `wght` 700–900, `WONK` 1, `SOFT` baixo.
Tem a irregularidade de letra pintada à mão em fachada, com contraste alto que lê como caro.
Usar grande de verdade (clamp até ~9rem no hero). Nunca abaixo de 1.5rem.

**Corpo e interface — Archivo.** Variável. 400 para leitura, 500 para rótulos, `wdth` ~92
em rótulos curtos. Números tabulares ligados em toda tabela e ficha.

**Medição — IBM Plex Mono, 500.** Uso restrito: **somente dentro dos leitores do raio-x e
das fichas técnicas.** Mono em qualquer outro lugar é erro. Ela marca "isto é um
instrumento" e perde a função se virar decoração.

Proibido no projeto inteiro:
- Rótulo em caixa-alta espaçada acima de título ("NOSSA HISTÓRIA")
- Strings de meta unidas por ponto médio ("Fresco · Artesanal · Local")
- Uma palavra do título em cor ou itálico diferente
- Seta "→" grudada em texto de botão

---

## 4. Movimento — a lei

Um único momento orquestrado por rota. Todo o resto responde a uma ação do usuário e serve
pra mostrar o que mudou.

### O elemento-assinatura: o letreiro acendendo

Ao entrar no viewport, uma vez por sessão:

1. Escuro total. Só o contorno da caixa em `--traco`.
2. Estalo do reator: flash de 60ms em `--letreiro` a 40% de opacidade. Escuro.
3. Pausa de 340ms.
4. Segundo estalo, mais forte, com hesitação — acende, cai pela metade, sobe.
5. Estabiliza em 700ms com halo suave.
6. Tremor residual de ±2% de opacidade em loop de 4s, fora de fase, que nunca para.
7. Só depois disso o resto do hero pode entrar.

IDs contratados: `#lt-caixa` `#lt-tubo-a` `#lt-tubo-b` `#lt-texto` `#lt-halo` `#lt-tremor`

`prefers-reduced-motion`: pula direto pro estado 5. Sem estalos, sem tremor.

O letreiro é SVG e CSS. **Não usa imagem.**

---

## 5. O Raio-X — especificação

### Layout

```
┌─────────────────────────────────────────────┬──────────────┐
│                                             │  MEDIDOR     │
│        ┌ pão de cima ─────────── 2.1 cm     │              │
│                                             │  altura      │
│        ┌ queijo ───────────────── 0.4 cm    │  9.8 cm      │
│                                             │  ▓▓▓▓▓▓░░░░  │
│        ┌ carne 120g ───────────── 1.8 cm    │              │
│                                             │  peso        │
│        ┌ tomate ───────────────── 0.6 cm    │  312 g       │
│                                             │              │
│        ┌ pão de baixo ─────────── 1.9 cm    │  R$ 34,00    │
│                                             │              │
│  [ trilho de ingredientes disponíveis ]     │  [ selar ]   │
└─────────────────────────────────────────────┴──────────────┘
```

Camadas centralizadas no eixo vertical do painel. Linhas de chamada saem pra esquerda e os
rótulos alinham numa coluna fixa — nunca centralizados, nunca acompanhando a largura do
ingrediente. É desenho técnico, não infográfico.

### A propriedade que simplifica tudo

**Todas as 12 camadas são PNG de 2000 × 1200 com o objeto centralizado nos dois eixos.**
As larguras relativas já estão embutidas no arquivo — o bacon já é mais largo que o pão, a
alface já transborda. Empilhe todas na mesma caixa, centralizadas, e a proporção sai certa.
Não aplique escala por camada.

### Estados

- **Repouso (explodido):** camadas separadas verticalmente. Oscilação de ±3px em loop longo,
  fora de fase entre si. Linha de chamada fina em `--letreiro` a 60%, com ponto de 3px onde
  toca a camada.
- **Adicionar:** o ingrediente sai do trilho e entra na posição correta. As camadas acima
  abrem espaço com mola. O medidor interpola em 400ms, não salta.
- **Remover:** arrastar pra fora do painel. Sai com aceleração; as demais fecham o vão.
- **Reordenar:** arrastar verticalmente. A ordem afeta o desenho, não o preço.
- **Aviso:** acima de 14 cm a barra vira `--latao` e o rótulo muda para "risco de
  desmontar". Única exceção autorizada à regra de temperatura, porque ali o calor é alarme.
  Não bloqueia.
- **Selar:** dispara o clímax.

### Assentamento

Ao selar, as camadas comprimem. Duas regras, e só elas:

1. **`afundamento` por camada** — quanto cada uma penetra na de baixo, como fração da
   própria altura. Está em `camadas.ts`. Não use um valor global de sobreposição.
2. **Sombra de contato pela linha de base** — extraia o pixel mais baixo de cada coluna da
   silhueta, borre em 10px, opacidade 37%, deslocamento 14px pra baixo. Desenhe antes da
   camada. **Não use drop-shadow da silhueta inteira** — vira mancha suja sobre a camada de
   baixo.

A compressão dura 280ms. Em seguida, cross-dissolve para `chapa-selagem.webp`.
Nunca cortar entre duas fotos de chapa.

### Copy dos estados

- Vazio: "Comece pelo pão."
- Aviso: "Risco de desmontar. Segue por sua conta."
- Confirmado: "Selado."

IDs contratados: `#rx-painel` `#rx-trilho` `#rx-camada-{slug}` `#rx-chamada-{slug}`
`#rx-medidor` `#rx-altura-valor` `#rx-peso-valor` `#rx-preco-valor` `#rx-selar`

---

## 6. Contrato de dados

`/data/camadas.ts`

```ts
export const CAMADAS = [
  { slug:'pao-base',     arquivo:'/camadas/pao-base.webp',     alturaPx:285, afundamento:0,    alturaCm:1.9, pesoG:32,  precoCent:0,   ordem:1,  obrigatorio:true },
  { slug:'molho',        arquivo:'/camadas/molho.webp',        alturaPx:108, afundamento:0.92, alturaCm:0.4, pesoG:18,  precoCent:200, ordem:2,  obrigatorio:false },
  { slug:'alface',       arquivo:'/camadas/alface.webp',       alturaPx:467, afundamento:0.55, alturaCm:0.5, pesoG:12,  precoCent:150, ordem:3,  obrigatorio:false },
  { slug:'tomate',       arquivo:'/camadas/tomate.webp',       alturaPx:139, afundamento:0.40, alturaCm:0.6, pesoG:34,  precoCent:200, ordem:4,  obrigatorio:false },
  { slug:'cebola',       arquivo:'/camadas/cebola.webp',       alturaPx:399, afundamento:0.55, alturaCm:0.7, pesoG:28,  precoCent:350, ordem:5,  obrigatorio:false },
  { slug:'carne',        arquivo:'/camadas/carne.webp',        alturaPx:381, afundamento:0.42, alturaCm:1.8, pesoG:120, precoCent:900, ordem:6,  obrigatorio:false },
  { slug:'queijo',       arquivo:'/camadas/queijo.webp',       alturaPx:420, afundamento:0.62, alturaCm:0.4, pesoG:22,  precoCent:400, ordem:7,  obrigatorio:false },
  { slug:'presunto',     arquivo:'/camadas/presunto.webp',     alturaPx:416, afundamento:0.58, alturaCm:0.5, pesoG:25,  precoCent:450, ordem:8,  obrigatorio:false },
  { slug:'bacon',        arquivo:'/camadas/bacon.webp',        alturaPx:305, afundamento:0.48, alturaCm:0.6, pesoG:30,  precoCent:700, ordem:9,  obrigatorio:false },
  { slug:'ovo',          arquivo:'/camadas/ovo.webp',          alturaPx:301, afundamento:0.42, alturaCm:1.1, pesoG:55,  precoCent:400, ordem:10, obrigatorio:false },
  { slug:'batata-palha', arquivo:'/camadas/batata-palha.webp', alturaPx:323, afundamento:0.52, alturaCm:0.8, pesoG:15,  precoCent:300, ordem:11, obrigatorio:false },
  { slug:'pao-topo',     arquivo:'/camadas/pao-topo.webp',     alturaPx:456, afundamento:0.30, alturaCm:2.1, pesoG:36,  precoCent:0,   ordem:12, obrigatorio:true  },
] as const
```

`alturaPx` é a altura renderizada do objeto dentro do canvas de 2000 × 1200 — use para
posicionar, não para escalar. `alturaCm` e `pesoG` alimentam o medidor. `obrigatorio:true`
não pode ser arrastado pra fora.

Preço base do lanche: R$ 12,00 (pães + montagem). Some `precoCent` das camadas escolhidas.

---

## 7. Assets — manifesto final

Todos WebP com alpha onde aplicável. **2,8 MB no total.** Já normalizados; não reprocesse.

### `/public/camadas/` — 12 arquivos, 2000 × 1200, alpha, 624 KB
```
pao-topo   pao-base   carne   queijo   bacon   presunto
alface     tomate     cebola  ovo      batata-palha  molho
```

### `/public/fixos/` — 6 arquivos, 2000 × 2000, alpha, 916 KB
```
x-salada  x-bacon  x-tudo  x-calabresa  x-frango  cachorro-quente
```

### `/public/chapa/` — 2 arquivos, 2400 × 1600, sem alpha, 448 KB
```
chapa-selagem.webp    clímax do "selar" — cross-dissolve a partir da pilha comprimida
chapa-vazia.webp      fundo da seção "A chapa" — NÃO é um segundo estado da selagem
```

As duas chapas são enquadramentos diferentes e não casam. Não corte de uma pra outra.

### `/public/macro/` — 4 arquivos, 2000 × 1333, sem alpha, 904 KB
```
macro-corte   macro-pao   macro-queijo   macro-chapa
```

Uso exclusivo: textura de fundo sobre `--fumo`, opacidade 8–14%. Nunca em primeiro plano.

**Carregamento:** só as 12 camadas e um fixo entram no carregamento inicial. Todo o resto
com lazy loading. Sem exceção.

---

## 8. Seções da página

1. **Letreiro** — assinatura, ocupa o primeiro viewport sozinho. SVG, sem imagem.
2. **Hero** — `x-tudo.webp`, tipografia Fraunces grande, "das 18h às 4h".
3. **O Raio-X** — o montador. Coração do site.
4. **Os fixos da casa** — os 6 lanches. Não são cards. São *fichas de montagem*: a imagem
   do fixo + ficha técnica (gramatura, altura, tempo de chapa, temperatura interna).
5. **A chapa** — bloco sobre o método, `chapa-vazia.webp` como fundo. Uma foto, texto
   curto, sem storytelling de família.
6. **Está aberto?** — compara a hora real do visitante com o horário da casa e responde em
   uma linha. Aberto: "Aberto. Fecha em 3h20." Fechado: "Fechada. Abre hoje às 18h."
7. **Rodapé** — endereço, telefone, o letreiro pequeno ainda tremendo.

---

## 9. Ordem de execução

**Fase 1 — Fundação.** Tokens, tipografia, shell de layout, preloader e o letreiro completo.
Nada mais. Não precisa de nenhuma imagem.
Verificação: o letreiro acende corretamente em desktop e mobile, respeita reduced-motion.

**Fase 2 — O Raio-X.** Estado, camadas, linhas de chamada, medidor, arrastar, assentamento,
cross-dissolve pra chapa.
Verificação: montar 3 lanches diferentes e conferir alinhamento das chamadas e do medidor.

**Fase 3 — Resto e polimento.** Fichas dos fixos, chapa, relógio, rodapé, acessibilidade,
performance.

`CLAUDE.md` (contratos, ≤40 linhas) e `PLAN.md` (checklist) como memória persistente.
`/clear` entre fases. Um prompt por vez.

---

## 10. Nota para o Radar

Variável quando virar template de nicho: nome, endereço, horário, telefone, os 6 fixos e
seus preços, a série de camadas, e `--latao` (âmbar / cobre / vermelho-tijolo).

**Não pode virar knob**, porque é a identidade do template: a regra de temperatura
fria/quente, a sequência do letreiro, e o raio-x.

Se o cliente tiver fotos próprias, elas precisam passar pela mesma normalização — canvas
2000 × 1200, objeto centralizado, câmera a 0° lateral, luz quente única em cima à esquerda.
Sem isso a pilha desalinha e o efeito inteiro morre.
