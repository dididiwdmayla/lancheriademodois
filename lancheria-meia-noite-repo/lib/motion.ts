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
