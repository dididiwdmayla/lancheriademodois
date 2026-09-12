'use client'

import { useTema } from '@/components/TemaAtivo'

// A barra é o destino do salto e a porta permanente do pedido.
//
// O total sobe contando e é escrito direto no nó — 320ms de requestAnimationFrame
// re-renderizando a página inteira seria caro por nada.

import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { brl } from '@/lib/precos'
import { prefersReducedMotion } from '@/lib/motion'
import type { ItemPedido } from '@/lib/pedido'

export type ChegadaBarra = {
  /** Leva o solavanco e conta o total até o novo valor. */
  chegou: (de: number, para: number) => void
}

type Props = {
  itens: number
  totalCent: number
  ref?: Ref<ChegadaBarra>
  onAbrir: () => void
  ultimo?: ItemPedido
  onModificar: (id: string, origem?: Element | null) => void
}

const CONTAGEM_MS = 320

/** A altura mora em --barra-altura (app/globals.css): CSS e componente precisam dela. */
export const ALTURA_BARRA = 'var(--barra-altura)'

export default function BarraPedido({ itens, totalCent, ref, onAbrir, ultimo, onModificar }: Props) {
  const pratico = useTema().slug === 'pratico'
  const totalRef = useRef<HTMLSpanElement>(null)
  const ficha = useRef(0)
  const destinoAnimado = useRef<number | null>(null)

  const escrever = useCallback((cent: number) => {
    if (totalRef.current) totalRef.current.textContent = brl(cent)
  }, [])

  useEffect(() => {
    if (destinoAnimado.current === totalCent) return
    ficha.current++
    destinoAnimado.current = null
    escrever(totalCent)
  }, [escrever, totalCent])

  useEffect(() => () => { ficha.current++ }, [])

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
        ficha.current++
        destinoAnimado.current = null
        escrever(para)
        return
      }
      destinoAnimado.current = para
      const minha = ++ficha.current
      const t0 = performance.now()
      const passo = (t: number) => {
        if (minha !== ficha.current) return
        const p = Math.min(1, (t - t0) / CONTAGEM_MS)
        escrever(Math.round(de + (para - de) * (1 - Math.pow(1 - p, 3))))
        if (p < 1) requestAnimationFrame(passo)
        else { destinoAnimado.current = null; escrever(para) }
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
        zIndex: 38,
        minHeight: ALTURA_BARRA,
        background: 'var(--fumo)',
        borderTop: '1px solid var(--traco)',
      }}
    >
      {ultimo && <div className="barra-modificar"><span>{ultimo.nome}</span><button className="botao-texto" onClick={e => onModificar(ultimo.id, e.currentTarget.closest('.barra-modificar'))}>{pratico ? 'Personalizar' : 'Modificar lanche'}</button></div>}
      <div
        className="barra-conteudo"
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
              fontFamily: 'var(--fonte-medida)',
              fontWeight: 500,
              fontSize: '1.5rem',
              fontVariantNumeric: 'var(--numerais)',
              letterSpacing: '-0.01em',
              color: 'var(--latao)',
            }}
          >{brl(totalCent)}</span>
        </div>
        <button
          id="barra-abrir"
          type="button"
          data-abrir-carrinho
          onClick={onAbrir}
          style={{
            minHeight: 46,
            padding: '13px 14px',
            background: cheio ? 'var(--latao)' : 'var(--fumo)',
            color: cheio ? 'var(--borra)' : 'var(--osso)',
            border: `1px solid ${cheio ? 'var(--latao)' : 'var(--traco)'}`,
            borderRadius: 2,
            fontFamily: 'var(--fonte-corpo), sans-serif',
            fontSize: '1rem',
            fontVariationSettings: "'wght' 600",
            cursor: 'pointer',
            opacity: 1,
          }}
        >
          Abrir pedido
        </button>
      </div>
    </div>
  )
}
