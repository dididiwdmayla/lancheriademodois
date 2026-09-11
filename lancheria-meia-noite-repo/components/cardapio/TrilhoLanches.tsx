'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { MAPA_CAMADAS, urlCamada } from '@/data/camadas'
import { FIXOS, type Fixo } from '@/data/fixos'
import { espalhaXDe, ESPALHA_Y, PRENSA_ESPACAMENTO, unidadesPilha, visivelPx } from '@/components/raio-x/prensa'
import { prefersReducedMotion } from '@/lib/motion'
import { brl, precoDoFixo } from '@/lib/precos'
import { resumoCamadas } from '@/lib/pedido'

const LANCHES = FIXOS.filter(f => f.forma === 'prensado')

function Pilha({ fixo }: { fixo: Fixo }) {
  const ref = useRef<HTMLDivElement>(null)
  const [caixa, setCaixa] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current!
    const medir = () => setCaixa({ w: el.clientWidth, h: el.clientHeight })
    medir()
    const ro = new ResizeObserver(medir); ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const aberto = unidadesPilha(fixo.camadas, 1)
  const k = Math.min(caixa.w * .92 / 2000, caixa.h * .96 / aberto)
  let pos = 0
  return <div ref={ref} data-camadas data-k={k} data-altura-aberta={aberto} data-espalha={espalhaXDe(fixo.camadas)} className="trilho-pilha" aria-hidden="true">
    {fixo.camadas.map((s, i) => {
      const c = MAPA_CAMADAS[s]
      pos += i ? visivelPx(fixo.camadas, i) : c.alturaPx
      return <div key={`${s}-${i}`} data-peca data-slug={s} data-aberto={pos} data-visivel={i ? visivelPx(fixo.camadas, i) : 0} data-pao={!!c.pao} data-altura={c.alturaPx}
        style={{ position: 'absolute', left: '50%', width: 2000 * k, height: 1200 * k, marginLeft: -1000 * k,
          bottom: (pos - c.alturaPx / 2 - 600) * k + (caixa.h - aberto * k) / 2,
          zIndex: i, background: `center / contain no-repeat url("${urlCamada(c)}")` }} />
    })}
  </div>
}

export default function TrilhoLanches({ onAdicionar }: { onAdicionar: (f: Fixo, el: HTMLElement) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [centro, setCentro] = useState(1)
  const [ativo, setAtivo] = useState(false)
  const centroRef = useRef(1)
  const atualizar = useRef<() => void>(() => {})
  useEffect(() => {
    const rail = ref.current!
    const io = new IntersectionObserver(entradas => { setAtivo(entradas.some(e => e.isIntersecting)) }, { rootMargin: '120px' })
    io.observe(rail)
    const cards = [...rail.querySelectorAll<HTMLElement>('[data-item-trilho]')]
    let frame = 0
    const pintar = () => {
      frame = 0
      const r = rail.getBoundingClientRect()
      const meio = r.left + r.width / 2
      const distancias = cards.map(c => { const b = c.getBoundingClientRect(); return Math.abs(b.left + b.width / 2 - meio) })
      const escolhido = distancias.indexOf(Math.min(...distancias))
      if (centroRef.current !== escolhido) { centroRef.current = escolhido; setCentro(escolhido) }
      cards.forEach((card, i) => {
        const t = prefersReducedMotion() ? (i === escolhido ? 0 : 1) : Math.min(1, distancias[i] / card.offsetWidth)
        card.dataset.t = t.toFixed(4)
        const host = card.querySelector<HTMLElement>('[data-camadas]')
        if (!host) return
        const k = Number(host.dataset.k), aberto = Number(host.dataset.alturaAberta), espalha = Number(host.dataset.espalha)
        const fator = PRENSA_ESPACAMENTO + (1 - PRENSA_ESPACAMENTO) * t
        const sx = espalha - (espalha - 1) * t, sy = ESPALHA_Y + (1 - ESPALHA_Y) * t
        let pos = 0
        host.querySelectorAll<HTMLElement>('[data-peca]').forEach((el, j) => {
          pos += j ? Number(el.dataset.visivel) * fator : Number(el.dataset.altura)
          const dy = (Number(el.dataset.aberto) - pos) * k
          el.style.transform = `translateY(${dy}px)${el.dataset.pao === 'true' ? '' : ` scaleX(${sx}) scaleY(${sy})`}`
        })
        host.style.transform = `translateY(${(pos - aberto) * k / 2}px)`
      })
    }
    const pedir = () => { if (!frame) frame = requestAnimationFrame(pintar) }
    atualizar.current = pedir
    const ro = new ResizeObserver(pedir); ro.observe(rail)
    const mo = new MutationObserver(pedir); mo.observe(rail, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-k'] })
    rail.scrollLeft = cards[1].offsetLeft + cards[1].offsetWidth / 2 - rail.clientWidth / 2
    rail.addEventListener('scroll', pedir, { passive: true }); pedir()
    return () => { cancelAnimationFrame(frame); rail.removeEventListener('scroll', pedir); io.disconnect(); ro.disconnect(); mo.disconnect() }
  }, [])
  useLayoutEffect(() => { atualizar.current() }, [ativo, centro])
  const mover = (delta: number) => {
    const rail = ref.current!, cards = rail.querySelectorAll<HTMLElement>('[data-item-trilho]')
    const alvo = cards[Math.max(0, Math.min(cards.length - 1, centro + delta))]
    rail.scrollTo({ left: alvo.offsetLeft + alvo.offsetWidth / 2 - rail.clientWidth / 2, behavior: prefersReducedMotion() ? 'instant' : 'smooth' })
  }
  return <section id="sugestoes" className="secao-trilho" aria-labelledby="titulo-sugestoes">
    <div className="cabecalho-secao moldura"><div><h2 id="titulo-sugestoes">Na prensa</h2><p>O centro fecha. As camadas aparecem ao deslizar.</p></div>
      <div className="setas-trilho"><button aria-label="Lanche anterior" onClick={() => mover(-1)} disabled={centro === 0}>←</button><button aria-label="Próximo lanche" onClick={() => mover(1)} disabled={centro === LANCHES.length - 1}>→</button></div>
    </div>
    <div ref={ref} data-trilho="lanches" className="trilho-lanches" role="region" aria-label="Prensados por dentro" onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); mover(e.key === 'ArrowLeft' ? -1 : 1) } }}>
      {LANCHES.map((f, i) => <article key={f.slug} data-item-trilho={f.slug} data-central={i === centro ? '' : undefined} className="trilho-lanche">
        <div data-palco className="trilho-palco">
          {ativo && Math.abs(i - centro) <= 1 ? <Pilha fixo={f} /> : <img data-icone src={`/fixos/${f.slug}.webp`} alt="" width={2000} height={2000} loading="lazy" />}
        </div>
        <div className="trilho-ficha"><h3>{f.nome}</h3><p className="ingredientes-linha" title={resumoCamadas(f.camadas)}>{resumoCamadas(f.camadas)}</p>
        <div className="trilho-acao"><span data-preco>{brl(precoDoFixo(f))}</span><button className="botao-quente" data-add={f.slug} onClick={e => onAdicionar(f, e.currentTarget.closest('article')!)}>Adicionar</button></div></div>
      </article>)}
    </div>
    <p className="trilho-posicao nota" aria-live="polite">{centro + 1} de {LANCHES.length}</p>
  </section>
}
