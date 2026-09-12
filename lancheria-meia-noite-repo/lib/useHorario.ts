'use client'

import { useSyncExternalStore } from 'react'
import { horarioDaCasa } from './horario'

type Horario = ReturnType<typeof horarioDaCasa>
let atual: Horario | null = null
const ouvintes = new Set<() => void>()
let timer: ReturnType<typeof setTimeout> | undefined
const ler = () => {
  const novo = horarioDaCasa()
  if (novo.texto !== atual?.texto) { atual = novo; ouvintes.forEach(fn => fn()) }
}
const tick = () => { ler(); timer = setTimeout(tick, 60000 - Date.now() % 60000) }
const aoVoltar = () => { if (!document.hidden) ler() }
function assinar(fn: () => void) {
  ouvintes.add(fn)
  if (ouvintes.size === 1) { tick(); document.addEventListener('visibilitychange', aoVoltar) }
  return () => {
    ouvintes.delete(fn)
    if (!ouvintes.size) { clearTimeout(timer); document.removeEventListener('visibilitychange', aoVoltar) }
  }
}
const noServidor = () => null
export function useHorarioDaCasa() {
  return useSyncExternalStore(assinar, () => atual, noServidor)
}
