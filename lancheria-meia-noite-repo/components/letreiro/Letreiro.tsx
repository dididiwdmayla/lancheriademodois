'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import LetreiroSvg from './LetreiroSvg'
import {
  ATRASO_MARCA_MS,
  ATRASO_REDUZIDO_MS,
  CHAVE_SESSAO,
  DURACAO_IGNICAO_MS,
  ESPERA_FONTES_MS,
} from './sequencia'
import { prefersReducedMotion, umaVezPorSessao } from '@/lib/motion'

// --lt-acende e --lt-letras moram no #lt-svg, como no export. Escrevê-las na raiz
// poupava uma linha no QA e cobrava o preço errado: a animação de ignição vai no
// shorthand `animation` do elemento que as escreve, e na raiz ela brigaria com qualquer
// animação futura de <html>. O clock fica onde o letreiro está; quem mede vai até ele.
export default function Letreiro({ onConcluir }: { onConcluir: () => void }) {
  const [fim, setFim] = useState(false)
  const concluir = useRef(onConcluir)
  concluir.current = onConcluir
  const sair = () => {
    try { sessionStorage.setItem(CHAVE_SESSAO, '1') } catch {}
    document.documentElement.setAttribute('data-lt-aceso', '1')
    setFim(true)
    concluir.current()
  }
  const raizRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const svg = raizRef.current?.querySelector<SVGSVGElement>('#lt-svg')
    if (!svg) return
    const { jaAconteceu, marcar: marcarSessao } = umaVezPorSessao(CHAVE_SESSAO)

    // Já acendeu nesta sessão: nasce aceso, sem sequência, sem frame apagado.
    if (jaAconteceu) {
      svg.style.setProperty('--lt-acende', '1')
      svg.style.setProperty('--lt-letras', '1')
      setFim(true); concluir.current()
      return
    }

    const marcar = () => { marcarSessao(); setFim(true); concluir.current() }
    const reduzido = prefersReducedMotion()
    const timers: number[] = []
    const agendar = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms))
    }

    const travar = () => {
      svg.style.setProperty('--lt-acende', '1')
      svg.style.setProperty('--lt-letras', '1')
    }

    const acender = () => {
      if (reduzido) {
        travar()
        agendar(marcar, ATRASO_REDUZIDO_MS)
        return
      }
      svg.style.animation = `lt-ignicao ${DURACAO_IGNICAO_MS}ms linear forwards`
      svg.addEventListener(
        'animationend',
        () => {
          travar()
          agendar(marcar, ATRASO_MARCA_MS)
        },
        { once: true },
      )
    }

    let comecou = false
    const comecar = () => {
      if (comecou) return
      comecou = true
      acender()
    }

    const esperarFontesEComecar = () => {
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(comecar)
      agendar(comecar, ESPERA_FONTES_MS)
    }

    // As fotos das letras precisam existir na tela antes de a sequência começar — se o
    // letreiro nascer fora da viewport (páginas futuras), não desperdiça o clock rodando
    // escondido, e a sequência ainda assim só dispara uma vez.
    let observer: IntersectionObserver | null = null
    if (raizRef.current && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver((entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          observer?.disconnect()
          esperarFontesEComecar()
        }
      })
      observer.observe(raizRef.current)
    } else {
      esperarFontesEComecar()
    }

    return () => {
      observer?.disconnect()
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  return (
    <>
      {/* Antes do primeiro paint, não em useEffect: se a sessão já acendeu, o HTML puro
          (sem hidratação ainda) já nasce marcado, e a regra em globals.css cobre o resto. */}
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem(${JSON.stringify(CHAVE_SESSAO)})==='1'){document.documentElement.setAttribute('data-lt-aceso','1')}}catch(e){}`,
        }}
      />
      <div
        id="intro"
        hidden={fim}
        ref={raizRef}
        style={{
          width: '100%',
          position: 'fixed',
          inset: '0 0 var(--barra-altura)',
          zIndex: 40,
          display: fim ? 'none' : 'grid',
          placeItems: 'center',
          background: 'var(--borra)',
          padding: 'clamp(20px, 5vw, 64px)',
        }}
      >
        <div style={{ width: '100%', maxWidth: 'min(620px, 62vh)', display: 'grid', placeItems: 'center' }}>
          <LetreiroSvg />
        </div>
        <button id="intro-pular" className="botao-texto" onClick={sair}>Entrar no cardápio</button>
      </div>
    </>
  )
}
