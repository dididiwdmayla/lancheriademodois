'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { TEMA, type Tema } from '@/temas'

const TemaAtivo = createContext<Tema>(TEMA)
export const useTema = () => useContext(TemaAtivo)
export function ProvedorTema({ tema, children }: { tema: Tema; children: ReactNode }) {
  return <TemaAtivo.Provider value={tema}>{children}</TemaAtivo.Provider>
}
