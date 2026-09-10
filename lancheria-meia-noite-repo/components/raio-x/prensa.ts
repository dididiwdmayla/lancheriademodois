// A física da pilha. Números extraídos do export — não estimados, não altere sem checar
// contra /export/lancheria-meia-noite.dc.html e o AGENTS.md.
//
// Tudo aqui é puro: entra composição e caixa, sai geometria. Nenhum DOM, nenhum estado.

import { CAMADAS, MAPA_CAMADAS } from '@/data/camadas'

export type Forma = 'prensado' | 'redondo'

/** Espaço vazio entre camadas na pilha explodida, em pixels do arquivo. */
export const GAP = 46
/** Prensado: a chapa fecha até 30% do espaçamento explodido. */
export const PRENSA_ESPACAMENTO = 0.3
/** Redondo: só a gravidade assenta, e para em 40%. */
export const SELADO_ESPACAMENTO = 0.4
/** Fundo de escala da barra de altura, em unidades de pixel do arquivo. */
export const MEDIDA_MAX_U = 2200
export const PRENSA_MS = 340
/** Aceleração forte e parada seca. Sem mola: prensa de chapa não balança. */
export const PRENSA_CURVA = 'cubic-bezier(.14,.92,.24,1)'
/**
 * O recheio espalha para os lados. Sem isso sobra fresta entre os pães nas pontas.
 *
 * 1.16 e não 1.14: em 1.14 o bacon alcançava 1732 contra os 1749 do pão e o
 * `prensado-meia-noite` ficava com fresta nas pontas — era o único dos quatro que não
 * fechava. O mínimo para o bacon cobrir é 1.151; 1.16 dá 1763, com folga.
 */
export const ESPALHA_X = 1.16
export const ESPALHA_Y = 0.8
/** Redondo: as camadas moles assentam, sem espalhar. */
export const ASSENTA_Y = 0.9
/** Afundamento da camada do topo, que não tem nada em cima para prensá-la. */
export const AFUNDAMENTO_TOPO_MAX = 0.65
/** Teto do afundamento como fração da camada de baixo. É este número que salva o tomate. */
export const TETO_SOBRE_A_DE_BAIXO = 0.55

function paesDe(forma: Forma): [string, string] {
  const p = CAMADAS.filter((c) => c.pao === forma).sort((a, b) => a.ordem - b.ordem)
  return [p[0].slug, p[p.length - 1].slug]
}

/** Os pães de cada forma, base → topo. Derivado dos dados, não uma segunda lista. */
export const PAES: Record<Forma, [string, string]> = {
  prensado: paesDe('prensado'),
  redondo: paesDe('redondo'),
}

export function ehPao(slug: string): boolean {
  return !!MAPA_CAMADAS[slug]?.pao
}

/**
 * Quanto a camada `i` afunda na de baixo, em pixels do arquivo.
 *
 * O `min` não é refinamento: sem ele camada grossa engole camada fina. A carne afunda
 * 160px e o tomate tem 139px de altura — o tomate sumia inteiro. Com o teto, a camada
 * de baixo sempre mostra pelo menos 45% de si.
 */
export function afundamentoPx(slugs: string[], i: number): number {
  if (i === 0) return 0
  const c = MAPA_CAMADAS[slugs[i]]
  const abaixo = MAPA_CAMADAS[slugs[i - 1]]
  if (!c || !abaixo) return 0
  const noTopo = i === slugs.length - 1
  const af = noTopo ? Math.min(c.afundamento, AFUNDAMENTO_TOPO_MAX) : c.afundamento
  return Math.min(c.alturaPx * af, abaixo.alturaPx * TETO_SOBRE_A_DE_BAIXO)
}

/** Quanto a camada `i` acrescenta à altura da pilha depois de afundar. */
export function visivelPx(slugs: string[], i: number): number {
  const c = MAPA_CAMADAS[slugs[i]]
  return c ? c.alturaPx - afundamentoPx(slugs, i) : 0
}

/**
 * Quanto da camada `i` sobra à vista, depois que a de cima afunda nela. É o número que
 * o QA compara com 45% da própria altura — o teste do teto de afundamento, sem imagem.
 */
export function expostoPx(slugs: string[], i: number): number {
  const c = MAPA_CAMADAS[slugs[i]]
  if (!c) return 0
  if (i === slugs.length - 1) return c.alturaPx
  return c.alturaPx - afundamentoPx(slugs, i + 1)
}

export function fatorFechado(forma: Forma): number {
  return forma === 'prensado' ? PRENSA_ESPACAMENTO : SELADO_ESPACAMENTO
}

/** Altura da pilha em unidades de pixel do arquivo — medida sem unidade exposta. */
export function unidadesPilha(slugs: string[], fator: number): number {
  const com = slugs.filter((s) => MAPA_CAMADAS[s] && MAPA_CAMADAS[s].alturaPx > 0)
  if (!com.length) return 0
  let u = MAPA_CAMADAS[com[0]].alturaPx
  for (let i = 1; i < com.length; i++) u += visivelPx(com, i) * fator
  return u
}

export type Geometria = {
  /** Largura da coluna das chamadas, à esquerda. */
  colW: number
  /** Onde a caixa da pilha começa, depois da coluna de chamadas. */
  x0: number
  larguraPilha: number
  /** Pixels de tela por pixel do arquivo. */
  k: number
  tops: number[]
  minTop: number
  offsetY: number
  prensa: boolean
  assenta: boolean
}

/**
 * Todas as 19 camadas são PNG de 2000×1200 com o objeto centralizado, e as larguras
 * relativas já estão no arquivo — o bacon já é mais largo que o pão. Por isso a pilha
 * inteira vai numa caixa só, centralizada, e nenhuma camada leva escala própria.
 */
export function geometria(opcoes: {
  slugs: string[]
  areaW: number
  areaH: number
  comprimido: boolean
  forma: Forma
}): Geometria {
  const { slugs, areaW, areaH, comprimido, forma } = opcoes
  const colW = Math.min(200, Math.max(80, areaW * 0.28))
  const x0 = colW + 18
  const larguraPilha = Math.max(130, areaW - x0 - 10)
  const prensa = comprimido && forma === 'prensado'
  const assenta = comprimido && forma !== 'prensado'

  // k sai sempre do estado explodido: a pilha não muda de escala ao prensar, só encolhe.
  let unidades = 0
  slugs.forEach((s, i) => {
    unidades += (MAPA_CAMADAS[s]?.alturaPx ?? 0) + (i > 0 ? GAP : 0)
  })
  const k = Math.min(larguraPilha / 2000, unidades ? (areaH * 0.88) / unidades : 1)

  const tops: number[] = []
  let cursor = 0
  slugs.forEach((s, i) => {
    const c = MAPA_CAMADAS[s]
    if (i === 0) cursor = -(c?.alturaPx ?? 0)
    else if (comprimido) cursor -= visivelPx(slugs, i) * fatorFechado(forma)
    else cursor -= (c?.alturaPx ?? 0) + GAP
    tops.push(cursor)
  })
  const minTop = tops.length ? tops[tops.length - 1] : 0
  const offsetY = (areaH - -minTop * k) / 2

  return { colW, x0, larguraPilha, k, tops, minTop, offsetY, prensa, assenta }
}
