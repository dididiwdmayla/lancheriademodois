// As transições entre telas.
//
// Cada troca de tela é curta e diz DE ONDE a tela veio. Fade sozinho não diz nada —
// por isso nenhuma transição daqui é só opacidade: todas carregam deslocamento, corte
// ou crescimento, e a opacidade só acompanha.
//
// No desktop, o takeover usa a View Transitions API: o estado muda dentro
// de `startViewTransition` e o desenho sai das regras `::view-transition-*` em
// app/globals.css. Onde não tem, a queda anima os elementos reais com as mesmas
// durações e curvas — entrada por animação CSS depois da mudança, saída animada antes
// dela, para que o elemento que sai ainda exista enquanto sai.
//
// `prefers-reduced-motion`: nenhuma das duas. A troca é direta.

import { flushSync } from 'react-dom'
import { pausarMovimento, prefersReducedMotion } from './motion'

export type NomeTransicao =
  | 'rx-entra'
  | 'rx-sai'
  | 'carrinho-entra'
  | 'carrinho-sai'
  | 'folha-entra'
  | 'folha-sai'
  | 'confirma-entra'
  | 'confirma-sai'

/** Teto do contrato. Acima disso quem está com fome acha que o site travou. */
export const TETO_MS = 240

/** Escalonamento e total da reacomodação da grade na troca de filtro. */
export const ESCALONAMENTO_GRADE_MS = 20
export const GRADE_TOTAL_MS = 200

/**
 * A tabela. `ms` é a duração; `sai` é o seletor do que deixa a tela — só as saídas
 * precisam dele, e só na queda, onde o elemento tem de ser animado ANTES de sumir do
 * DOM. Nenhum `ms` pode passar de `TETO_MS`.
 */
export const TRANSICOES: Record<NomeTransicao, { ms: number; sai?: string }> = {
  'rx-entra': { ms: 240 },
  'rx-sai': { ms: 200, sai: '.rx-modal' },
  'carrinho-entra': { ms: 220 },
  'carrinho-sai': { ms: 180, sai: '.carrinho-modal' },
  'folha-entra': { ms: 200 },
  'folha-sai': { ms: 180, sai: '#rx-trilho-cortina' },
  'confirma-entra': { ms: 220 },
  'confirma-sai': { ms: 180, sai: '[data-passo-pedido]' },
}

type ComVT = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }

/** De onde o raio-x cresceu, para ele saber para onde voltar.
 *
 * Guarda o elemento e o retângulo dele. Na volta, se o elemento ainda está na página
 * (o cartão do cardápio está — o cardápio fica montado atrás do raio-x), vale o
 * retângulo de AGORA, porque a página pode ter rolado no meio. Se ele saiu (a linha do
 * carrinho sai quando o carrinho fecha), vale o retângulo guardado na ida. */
let origemEl: WeakRef<Element> | null = null
let origemRect: DOMRect | null = null

export function lembrarOrigem(el: Element | null) {
  origemEl = el ? new WeakRef(el) : null
  origemRect = el ? el.getBoundingClientRect() : null
}

export function origemAtual(): DOMRect | null {
  const el = origemEl?.deref()
  if (el?.isConnected) return el.getBoundingClientRect()
  return origemRect
}

/** Origem do gesto, com escala leve: evita comprimir o texto até o tamanho do cartão. */
function escreverOrigem(raiz: HTMLElement, r: DOMRect | null) {
  const x = r ? r.left + r.width / 2 : innerWidth / 2
  const y = r ? r.top + r.height / 2 : innerHeight
  raiz.style.setProperty('--tr-dx', `${Math.round((x - innerWidth / 2) * .08)}px`)
  raiz.style.setProperty('--tr-dy', `${Math.round((y - innerHeight / 2) * .08)}px`)
  raiz.style.setProperty('--tr-origem-x', `${Math.round(x)}px`)
  raiz.style.setProperty('--tr-origem-y', `${Math.round(y)}px`)
}

let emCurso = false

/** No desktop só o takeover usa captura. Folhas e passos animam elementos reais.
 * Um gesto por vez; finalizar por evento, com prazo de segurança e limpeza em todos os caminhos. */
export function transicionar(nome: NomeTransicao, mutar: () => void, origem?: Element | DOMRect | null) {
  if (emCurso) return
  const raiz = document.documentElement
  if (prefersReducedMotion()) { mutar(); return }
  emCurso = true
  const retomar = pausarMovimento()
  const { ms: padraoMs, sai } = TRANSICOES[nome]
  const ms = raiz.dataset.tema === 'pratico' ? 120 : padraoMs
  const doc = document as ComVT
  const captura = raiz.dataset.tema !== 'pratico' && nome.startsWith('rx-') && window.matchMedia('(min-width: 900px) and (pointer: fine)').matches
    && typeof doc.startViewTransition === 'function'
  escreverOrigem(raiz, origem instanceof Element ? origem.getBoundingClientRect() : origem ?? null)
  raiz.style.setProperty('--tr-ms', `${ms}ms`)
  raiz.dataset.transicao = nome
  if (captura) raiz.dataset.vt = '1'
  else delete raiz.dataset.vt
  let terminou = false
  let mutado = false
  let timer = 0
  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)')
  const mudar = () => { if (!mutado) { mutado = true; flushSync(mutar) } }
  const limpar = () => {
    if (terminou) return
    terminou = true
    clearTimeout(timer)
    raiz.removeEventListener('animationend', aoFim)
    reduzir.removeEventListener('change', aoReduzir)
    window.removeEventListener('pagehide', finalizar)
    delete raiz.dataset.transicao
    delete raiz.dataset.vt
    raiz.style.removeProperty('--tr-ms')
    retomar()
    emCurso = false
  }
  const finalizar = () => { try { mudar() } finally { limpar() } }
  const aoReduzir = () => { if (reduzir.matches) finalizar() }
  const alvo = nome.startsWith('rx-') ? '.rx-modal' : nome.startsWith('carrinho-') ? '.carrinho-folha'
    : nome.startsWith('folha-') ? '#rx-trilho-folha' : '[data-passo-pedido]'
  const aoFim = (e: AnimationEvent) => {
    if (e.animationName.startsWith('tr-') && e.target instanceof Element && e.target.matches(alvo)) finalizar()
  }
  reduzir.addEventListener('change', aoReduzir)
  window.addEventListener('pagehide', finalizar)
  if (captura) {
    // Rejeição/skip da API não pode deixar a aplicação nem os mascotes presos.
    try {
      const vt = doc.startViewTransition!(mudar)
      void vt.finished.then(finalizar, finalizar)
    } catch { finalizar() }
    return
  }
  raiz.addEventListener('animationend', aoFim)
  // O timer é só contingência (aba suspensa, elemento retirado, animationend perdido).
  timer = window.setTimeout(finalizar, ms + 80)
  if (!sai || !document.querySelector(sai)) {
    try { mudar() } catch (erro) { limpar(); throw erro }
  }
}
