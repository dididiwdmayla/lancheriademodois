// As transições entre telas.
//
// Cada troca de tela é curta e diz DE ONDE a tela veio. Fade sozinho não diz nada —
// por isso nenhuma transição daqui é só opacidade: todas carregam deslocamento, corte
// ou crescimento, e a opacidade só acompanha.
//
// Onde o navegador tem a View Transitions API, ela é quem anima: o estado muda dentro
// de `startViewTransition` e o desenho sai das regras `::view-transition-*` em
// app/globals.css. Onde não tem, a queda anima os elementos reais com as mesmas
// durações e curvas — entrada por animação CSS depois da mudança, saída animada antes
// dela, para que o elemento que sai ainda exista enquanto sai.
//
// `prefers-reduced-motion`: nenhuma das duas. A troca é direta.

import { flushSync } from 'react-dom'
import { prefersReducedMotion } from './motion'

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

/** Escreve o retângulo como recuos de `inset()` — é assim que o corte cresce e encolhe. */
function escreverOrigem(raiz: HTMLElement, r: DOMRect) {
  const lim = (n: number) => `${Math.max(0, Math.round(n))}px`
  raiz.style.setProperty('--tr-origem-topo', lim(r.top))
  raiz.style.setProperty('--tr-origem-direita', lim(window.innerWidth - r.right))
  raiz.style.setProperty('--tr-origem-base', lim(window.innerHeight - r.bottom))
  raiz.style.setProperty('--tr-origem-esquerda', lim(r.left))
  raiz.style.setProperty('--tr-origem-x', `${Math.round(r.left + r.width / 2)}px`)
  raiz.style.setProperty('--tr-origem-y', `${Math.round(r.top + r.height / 2)}px`)
}

/**
 * Troca de tela. `mutar` é a mudança de estado do React; ela roda dentro do
 * `startViewTransition` (com `flushSync`, senão o React ainda não pintou quando o
 * navegador tira a foto do estado novo).
 *
 * `origem` é opcional e só interessa a quem cresce de um lugar: o raio-x sai do cartão
 * que a pessoa tocou, não do centro da tela.
 */
export function transicionar(nome: NomeTransicao, mutar: () => void, origem?: Element | DOMRect | null) {
  const raiz = document.documentElement
  if (origem) escreverOrigem(raiz, origem instanceof Element ? origem.getBoundingClientRect() : origem)
  if (prefersReducedMotion()) {
    mutar()
    return
  }

  const { ms, sai } = TRANSICOES[nome]
  const doc = document as ComVT
  const suporta = typeof doc.startViewTransition === 'function'
  raiz.style.setProperty('--tr-ms', `${ms}ms`)
  raiz.dataset.transicao = nome
  const limpar = () => {
    if (raiz.dataset.transicao !== nome) return
    delete raiz.dataset.transicao
    raiz.style.removeProperty('--tr-ms')
  }

  if (suporta) {
    raiz.dataset.vt = '1'
    doc.startViewTransition!(() => flushSync(mutar)).finished.finally(limpar)
    return
  }

  // Queda: mesmas durações, mesmas curvas, elementos reais.
  const saindo = sai ? document.querySelector<HTMLElement>(sai) : null
  if (!saindo) {
    flushSync(mutar)
    window.setTimeout(limpar, ms + 40)
    return
  }
  // A saída tem de terminar antes da mudança, senão o elemento já não está lá para sair.
  // `data-transicao` sai junto com ela: quem chega no lugar não herda animação de entrada.
  void saindo.offsetHeight
  window.setTimeout(() => {
    limpar()
    mutar()
  }, ms)
}
