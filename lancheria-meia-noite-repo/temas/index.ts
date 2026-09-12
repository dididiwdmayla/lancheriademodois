import type { CSSProperties } from 'react'
import meiaNoite from './meia-noite'
import diner from './diner'
import pratico from './pratico'
import cantina from './cantina'

export type Tema = {
  slug: string
  nome: string
  fundo: 'escuro' | 'claro'
  cores: { base: string; superficie: string; traco: string; texto: string; quente: string; frio: string }
  fontes: { display: string; corpo: string; medida: string }
  raio: number
  densidade: 'solta' | 'media' | 'apertada'
  assinatura: string
  mascote: boolean
}

export const TEMAS: readonly Tema[] = [meiaNoite, diner, pratico, cantina]
export const TEMA: Tema = meiaNoite

/** Seleção provisória por URL; Radar poderá fornecer o mesmo objeto Tema no servidor. */
export function selecionarTema(slug?: string | null): Tema {
  return TEMAS.find(tema => tema.slug === slug) ?? TEMA
}

/** Os nomes históricos são aliases semânticos, não paletas dentro dos componentes. */
export function estiloTema(tema: Tema): CSSProperties {
  return {
    '--borra': tema.cores.base, '--fumo': tema.cores.superficie,
    '--traco': tema.cores.traco, '--osso': tema.cores.texto,
    '--latao': tema.cores.quente, '--letreiro': tema.cores.frio,
    '--fonte-display': `"${tema.fontes.display}"`, '--fonte-corpo': `"${tema.fontes.corpo}"`,
    '--fonte-medida': `"${tema.fontes.medida}", ${tema.slug === 'cantina' ? 'Georgia, serif' : tema.slug === 'pratico' ? 'sans-serif' : 'monospace'}`,
    '--raio': `${tema.raio}px`,
    '--numerais': tema.slug === 'cantina' ? 'oldstyle-nums proportional-nums' : 'tabular-nums',
    colorScheme: tema.fundo === 'claro' ? 'light' : 'dark',
  } as CSSProperties
}
