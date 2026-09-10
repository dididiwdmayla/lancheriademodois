'use client'

// A barra do pedido. Nesta rodada ela é o destino do salto e mais nada: contagem, total,
// e um botão de abrir que ainda não leva a lugar nenhum. O carrinho é fase seguinte.
//
// O total sobe contando e é escrito direto no nó — 320ms de requestAnimationFrame
// re-renderizando a página inteira seria caro por nada.

import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { brl } from '@/lib/precos'
import { prefersReducedMotion } from '@/lib/motion'

export type ChegadaBarra = {
  /** Leva o solavanco e conta o total até o novo valor. */
  chegou: (de: number, para: number) => void
}

type Props = {
  itens: number
  totalCent: number
  ref?: Ref<ChegadaBarra>
}

const CONTAGEM_MS = 320

/** Altura da barra: 46px de botão mais 11px de folga em cima e embaixo, mais o fio.
 *  Quem monta o raio-x desconta isto da viewport para o trilho não sumir atrás dela. */
export const ALTURA_BARRA_PX = 70

export default function BarraPedido({ itens, totalCent, ref }: Props) {
  const totalRef = useRef<HTMLSpanElement>(null)
  const ficha = useRef(0)

  const escrever = useCallback((cent: number) => {
    if (totalRef.current) totalRef.current.textContent = brl(cent)
  }, [])

  useEffect(() => {
    escrever(totalCent)
  }, [escrever, totalCent])

  useImperativeHandle(ref, () => ({
    chegou(de, para) {
      const barra = document.getElementById('barra-pedido')
      const reduzido = prefersReducedMotion()
      if (barra?.animate && !reduzido) {
        barra.animate(
          [
            { transform: 'translateY(0px)' },
            { transform: 'translateY(7px)' },
            { transform: 'translateY(-2px)' },
            { transform: 'translateY(0px)' },
          ],
          { duration: 190, easing: 'ease-out' },
        )
      }
      if (de === para || reduzido) {
        escrever(para)
        return
      }
      const minha = ++ficha.current
      const t0 = performance.now()
      const passo = (t: number) => {
        if (minha !== ficha.current) return
        const p = Math.min(1, (t - t0) / CONTAGEM_MS)
        escrever(Math.round(de + (para - de) * (1 - Math.pow(1 - p, 3))))
        if (p < 1) requestAnimationFrame(passo)
        else escrever(para)
      }
      requestAnimationFrame(passo)
    },
  }))

  const cheio = itens > 0

  return (
    <div
      id="barra-pedido"
      data-barra-pedido
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        minHeight: ALTURA_BARRA_PX,
        background: 'rgba(28,21,18,0.97)',
        borderTop: '1px solid var(--traco)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px 20px',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '11px clamp(16px, 4vw, 64px)',
        }}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
          <span
            aria-live="polite"
            style={{
              fontVariationSettings: "'wdth' 92, 'wght' 500",
              fontSize: '0.9375rem',
              color: 'var(--osso)',
              opacity: 0.72,
            }}
          >
            {itens === 0 ? 'pedido vazio' : itens === 1 ? '1 item' : `${itens} itens`}
          </span>
          <span
            id="barra-total"
            data-preco
            ref={totalRef}
            style={{
              fontFamily: 'var(--fonte-medida), ui-monospace, monospace',
              fontWeight: 500,
              fontSize: '1.5rem',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.01em',
              color: 'var(--latao)',
            }}
          />
        </div>
        <button
          id="barra-abrir"
          type="button"
          data-abrir-carrinho
          disabled={!cheio}
          style={{
            minHeight: 46,
            padding: '13px 20px',
            background: cheio ? 'var(--latao)' : 'var(--fumo)',
            color: cheio ? 'var(--borra)' : 'var(--osso)',
            border: `1px solid ${cheio ? 'var(--latao)' : 'var(--traco)'}`,
            borderRadius: 2,
            fontFamily: 'var(--fonte-corpo), sans-serif',
            fontSize: '1rem',
            fontVariationSettings: "'wght' 600",
            cursor: cheio ? 'pointer' : 'default',
            opacity: cheio ? 1 : 0.45,
          }}
        >
          Abrir pedido
        </button>
      </div>
    </div>
  )
}
