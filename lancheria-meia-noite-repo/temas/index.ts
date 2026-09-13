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
  filtroInicial: 'todos' | 'primeira-forma'
  abrirComposicao: 'nenhuma' | 'pela-foto' | 'pelo-rotulo'
  cardapio: 'editorial' | 'painel' | 'lista' | 'folha'
  intro: boolean
  hero: 'chapa' | 'balcao' | 'menu' | 'nenhum'
  adicionarIcone: boolean
  rotulos: { modificar: string; modificarCurto: string }
  movimento: { grade: boolean; transicaoMs: number | null; captura: boolean }
  medida: { fallback: 'monospace' | 'sans-serif' | 'serif'; numerais: string }
  folhaFontes: string
}

export const TEMAS: readonly Tema[] = [meiaNoite, diner, pratico, cantina]
export const TEMA: Tema = meiaNoite

/** Registro de identidades. A rota pública recebe o objeto pela definição da skin. */
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
    '--fonte-medida': `"${tema.fontes.medida}", ${tema.medida.fallback}`,
    '--raio': `${tema.raio}px`,
    '--numerais': tema.medida.numerais,
    colorScheme: tema.fundo === 'claro' ? 'light' : 'dark',
  } as CSSProperties
}
