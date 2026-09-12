// Lei do movimento: prefers-reduced-motion tratado em tudo que se move, sem exceção.

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Lê e marca uma flag em sessionStorage. `jaAconteceu` é a leitura no momento da chamada;
 * `marcar()` fica disponível pra quando o evento (não a checagem) de fato acontecer. */
export function umaVezPorSessao(chave: string): { jaAconteceu: boolean; marcar: () => void } {
  let jaAconteceu = false
  try {
    jaAconteceu = sessionStorage.getItem(chave) === '1'
  } catch {}

  const marcar = () => {
    try {
      sessionStorage.setItem(chave, '1')
    } catch {}
  }

  return { jaAconteceu, marcar }
}

/** Pausa compartilhada, inclusive para relógios JS: nenhum rAF continua só para testar uma flag. */
const pausas = new Set<symbol>()
const ouvintes = new Set<(pausado: boolean) => void>()
export const movimentoPausado = () => pausas.size > 0
export function observarPausa(ouvinte: (pausado: boolean) => void) {
  ouvintes.add(ouvinte)
  ouvinte(movimentoPausado())
  return () => { ouvintes.delete(ouvinte) }
}
export function pausarMovimento() {
  const chave = Symbol()
  pausas.add(chave)
  document.documentElement.dataset.movimentoPausado = '1'
  ouvintes.forEach(fn => fn(true))
  return () => {
    if (!pausas.delete(chave) || pausas.size) return
    delete document.documentElement.dataset.movimentoPausado
    ouvintes.forEach(fn => fn(false))
  }
}
