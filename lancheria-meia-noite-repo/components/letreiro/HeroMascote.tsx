'use client'

import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { movimentoPausado, observarPausa } from '@/lib/motion'
import { DesenhoMascote, RaioXAberto } from './Mascote'

const relaxados = [-14, 14]
const sorte = (min: number, max: number) => min + Math.random() * (max - min)
const suave = (t: number) => t * t * (3 - 2 * t)

/** Mesmo desenho, pendurado: a boca fica acima da borda, nunca uma segunda ilustração. */
export default function HeroMascote() {
  const aberto = useContext(RaioXAberto)
  return aberto ? null : <Espiando />
}

function Espiando() {
  const ref = useRef<SVGSVGElement>(null)
  const bracos = useRef<(SVGGElement | null)[]>([])
  const [emTela, setEmTela] = useState(false)
  const [cabe, setCabe] = useState(false)

  useLayoutEffect(() => {
    const svg = ref.current
    const hero = svg?.closest<HTMLElement>('.hero-faixa')
    const titulo = hero?.querySelector('h1')
    if (!svg || !hero || !titulo) return
    let vivo = true
    const posicionar = () => {
      if (!vivo) return
      const h = hero.getBoundingClientRect()
      // Mede os glifos das duas linhas, não a largura vazia do bloco h1.
      const faixa = document.createRange()
      faixa.selectNodeContents(titulo)
      const texto = faixa.getBoundingClientRect()
      const aoLado = Math.max(0, h.right - texto.right - 24)
      const acima = Math.max(0, texto.top - h.top - 10)
      // O SVG inteiro, incluindo braços em alcance máximo, cabe fora do título.
      const largura = Math.min(112, Math.max(aoLado, acima * 1.5))
      svg.style.width = `${largura}px`
      setCabe(largura >= 32)
    }
    const ro = new ResizeObserver(posicionar)
    ro.observe(hero)
    ro.observe(titulo)
    posicionar()
    void document.fonts.ready.then(posicionar)
    return () => { vivo = false; ro.disconnect() }
  }, [])

  useEffect(() => {
    const svg = ref.current
    if (!svg) return
    const io = new IntersectionObserver(([entrada]) => setEmTela(entrada.isIntersecting))
    io.observe(svg)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const svg = ref.current
    if (!svg || !emTela || !cabe) return
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timer = 0
    let raf = 0
    let ativo = false
    let tentando = false
    let liberadoEm = 0
    let ultimo: { x: number; y: number } | null = null
    const relaxar = () => bracos.current.forEach((b, i) => {
      if (b) b.style.transform = `rotate(${relaxados[i]}deg) scaleY(1)`
    })
    const parar = () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      timer = raf = 0
      tentando = false
      svg.dataset.bracosAtivos = '0'
    }
    const esperar = () => {
      clearTimeout(timer)
      timer = window.setTimeout(() => tentar(false), sorte(5500, 9500))
    }
    const tentar = (doPonteiro: boolean) => {
      if (!ativo || tentando || performance.now() < liberadoEm) return
      clearTimeout(timer)
      tentando = true
      svg.dataset.bracosAtivos = '1'
      const caixa = svg.getBoundingClientRect()
      const k = caixa.width / 240
      const repouso = {
        x: caixa.left + caixa.width * sorte(.15, .85), y: caixa.bottom + caixa.height * .7,
      }
      const direcoes = () => [44, 196].map(x => {
        const alvo = doPonteiro && ultimo ? ultimo : repouso
        const dx = (alvo.x - caixa.left) / k - x
        const dy = (alvo.y - caixa.top) / k - 5
        return {
          angulo: Math.max(-55, Math.min(55, Math.atan2(-dx, dy) * 180 / Math.PI)),
          // Só percorre 55% da distância; a ponta nunca chega ao alvo.
          escala: Math.min(1.65, Math.max(.12, Math.hypot(dx, dy) * .55 / 52)),
        }
      })
      const inicio = performance.now()
      // Tenta por 300ms, hesita 160ms, desiste em 440ms. Nenhum laço durante a espera.
      const quadro = (agora: number) => {
        if (!ativo) return
        const t = agora - inicio
        const peso = t < 300 ? suave(t / 300) : t < 460 ? 1 : 1 - suave(Math.min(1, (t - 460) / 440))
        const desejados = direcoes()
        bracos.current.forEach((b, i) => {
          if (!b) return
          const d = desejados[i]
          b.style.transform = `rotate(${relaxados[i] + (d.angulo - relaxados[i]) * peso}deg) scaleY(${1 + (d.escala - 1) * peso})`
        })
        if (t < 900) raf = requestAnimationFrame(quadro)
        else {
          parar()
          relaxar()
          liberadoEm = agora + sorte(2600, 4200)
          esperar()
        }
      }
      raf = requestAnimationFrame(quadro)
    }
    const ponteiro = (e: PointerEvent) => {
      ultimo = { x: e.clientX, y: e.clientY }
      tentar(true)
    }
    const sincronizar = () => {
      const proximo = !reduzido.matches && !document.hidden && !movimentoPausado()
      if (proximo === ativo) return
      ativo = proximo
      if (ativo) {
        relaxar()
        liberadoEm = performance.now() + 900
        window.addEventListener('pointermove', ponteiro, { passive: true })
        window.addEventListener('pointerdown', ponteiro, { passive: true })
        esperar()
      } else {
        parar()
        window.removeEventListener('pointermove', ponteiro)
        window.removeEventListener('pointerdown', ponteiro)
        if (reduzido.matches) relaxar()
      }
    }
    const removerPausa = observarPausa(sincronizar)
    reduzido.addEventListener('change', sincronizar)
    document.addEventListener('visibilitychange', sincronizar)
    return () => {
      ativo = false
      parar()
      window.removeEventListener('pointermove', ponteiro)
      window.removeEventListener('pointerdown', ponteiro)
      removerPausa()
      reduzido.removeEventListener('change', sincronizar)
      document.removeEventListener('visibilitychange', sincronizar)
    }
  }, [emTela, cabe])

  return <svg ref={ref} className="hero-espreita" data-hero-mascote data-em-tela={emTela}
    data-cabe={cabe} viewBox="0 0 240 160" aria-hidden="true" focusable="false">
    <DesenhoMascote transform="translate(240 84) rotate(180)" olharAtivo={emTela && cabe} />
    {[44, 196].map((x, i) => <g key={x} transform={`translate(${x} 5)`}>
      <g ref={el => { bracos.current[i] = el }} data-braco={i}
        style={{ transform: `rotate(${relaxados[i]}deg) scaleY(1)`, transformOrigin: '0 0' }}>
        <path d={`M0 0 Q${i ? 6 : -6} 26 0 52`} fill="none" stroke="var(--osso)" strokeWidth="5" strokeLinecap="round" />
      </g>
    </g>)}
  </svg>
}
