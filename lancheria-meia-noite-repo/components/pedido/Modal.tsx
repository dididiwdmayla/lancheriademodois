'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/** Foco preso, Escape, devolução do foco e bloqueio de rolagem também nas folhas internas. */
export default function Modal({ children, className, titulo, onSair }: { children: ReactNode; className: string; titulo: string; onSair: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const sair = useRef(onSair)
  sair.current = onSair
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.querySelector<HTMLElement>('button')?.focus()
    const teclado = (e: KeyboardEvent) => {
      const painel = ref.current
      if (!painel) return
      if (e.key === 'Escape') {
        // O raio-x já fecha suas folhas com Escape; não fechar os dois níveis juntos.
        if (painel.querySelector('#rx-trilho-cortina, #rx-composicao')) return
        e.preventDefault(); sair.current()
      }
      if (e.key !== 'Tab') return
      const escopo = painel.querySelector('#rx-trilho-folha, #rx-composicao') ?? painel
      const focos = [...escopo.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], textarea, [tabindex="0"]')].filter(e => e.getClientRects().length)
      const primeiro = focos[0], ultimo = focos[focos.length - 1]
      if (e.shiftKey && (document.activeElement === primeiro || !escopo.contains(document.activeElement))) { e.preventDefault(); ultimo?.focus() }
      else if (!e.shiftKey && (document.activeElement === ultimo || !escopo.contains(document.activeElement))) { e.preventDefault(); primeiro?.focus() }
    }
    document.addEventListener('keydown', teclado, true)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', teclado, true)
      if (anterior?.isConnected && !anterior.closest('[inert]')) anterior.focus({ preventScroll: true })
      else document.querySelector<HTMLElement>('#barra-abrir')?.focus({ preventScroll: true })
    }
  }, [])
  return <div className={`modal-cortina ${className}`} onClick={e => { if (e.target === e.currentTarget) onSair() }}>
    <div ref={ref} role="dialog" aria-modal="true" aria-label={titulo} className="modal-corpo">{children}</div>
  </div>
}
