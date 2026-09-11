'use client'

import { useEffect, useRef, useState } from 'react'
import { EXTRAS, type Extra } from '@/data/fixos'
import { brl } from '@/lib/precos'
import { prefersReducedMotion } from '@/lib/motion'

export default function Extras({ grupo, onAdicionar }: { grupo: Extra['grupo']; onAdicionar: (e: Extra) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(0)
  const [bordas, setBordas] = useState({ inicio: true, fim: false })
  const itens = EXTRAS.filter(e => e.grupo === grupo)
  const bebida = grupo === 'bebida', id = bebida ? 'bebidas' : 'acompanhamentos'
  const medir = () => {
    const rail = ref.current!
    setBordas({ inicio: rail.scrollLeft < 2, fim: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2 })
  }
  useEffect(() => {
    medir(); const ro = new ResizeObserver(medir); ro.observe(ref.current!)
    return () => ro.disconnect()
  }, [])
  const mover = (d: number) => {
    const rail = ref.current!, cards = rail.querySelectorAll<HTMLElement>('article')
    const alvo = cards[Math.max(0, Math.min(cards.length - 1, pos + d))]
    rail.scrollTo({ left: alvo.offsetLeft - cards[0].offsetLeft, behavior: prefersReducedMotion() ? 'instant' : 'smooth' })
  }
  return <section id={id} className={`extras secao-trilho ${id}`}>
    <div className="cabecalho-secao moldura"><div><h2>{bebida ? 'Pra beber' : 'Pra dividir'}</h2><p>{bebida ? 'Bebidas da geladeira.' : 'Acompanhamentos para a mesa.'}</p></div>
      <div className="setas-trilho"><button aria-label={`${bebida ? 'Bebida' : 'Acompanhamento'} anterior`} onClick={() => mover(-1)} disabled={bordas.inicio}>←</button><button aria-label={`Próximo ${grupo}`} onClick={() => mover(1)} disabled={bordas.fim}>→</button></div>
    </div>
    <div ref={ref} data-trilho={grupo} className="extras-trilho" onScroll={() => {
      medir()
      const rail = ref.current!, cards = [...rail.querySelectorAll<HTMLElement>('article')]
      setPos(cards.reduce((melhor, c, i) => Math.abs(c.offsetLeft - cards[0].offsetLeft - rail.scrollLeft) < Math.abs(cards[melhor].offsetLeft - cards[0].offsetLeft - rail.scrollLeft) ? i : melhor, 0))
    }}>
      {itens.map((e, i) => <article key={e.slug} className="extra-card" data-extra={e.slug}>
        <img className="extra-macro" src={`/macro/${bebida ? 'macro-corte' : 'macro-chapa'}.webp`} alt="" aria-hidden="true" width={2000} height={1333} loading="lazy" />
        <span data-carimbo>{String(i + 1).padStart(2, '0')} / {bebida ? 'GELADEIRA' : 'FRITADEIRA'}</span>
        <h3>{e.nome}</h3><div className="extra-base"><span data-preco>{brl(e.precoCent)}</span><button className="botao-quente" data-add={e.slug} aria-label={`Adicionar ${e.nome}`} onClick={() => onAdicionar(e)}>Adicionar</button></div>
      </article>)}
    </div>
  </section>
}
