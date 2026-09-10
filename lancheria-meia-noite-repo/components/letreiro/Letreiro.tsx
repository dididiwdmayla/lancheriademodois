'use client'

import { useLayoutEffect, useRef } from 'react'
import LetreiroSvg from './LetreiroSvg'
import {
  ATRASO_MARCA_MS,
  ATRASO_REDUZIDO_MS,
  CHAVE_SESSAO,
  DURACAO_IGNICAO_MS,
  ESPERA_FONTES_MS,
} from './sequencia'
import { prefersReducedMotion, umaVezPorSessao } from '@/lib/motion'

// --lt-acende e --lt-letras são registradas com `inherits: true` (app/globals.css) e
// escritas na raiz do documento, não no <svg>: cascateiam por herança até lt-halo e
// lt-texto de qualquer jeito, e ficam num ponto único e medível de fora.
export default function Letreiro() {
  const raizRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const html = document.documentElement
    const { jaAconteceu, marcar } = umaVezPorSessao(CHAVE_SESSAO)

    // Já acendeu nesta sessão: nasce aceso, sem sequência, sem frame apagado.
    if (jaAconteceu) {
      html.style.setProperty('--lt-acende', '1')
      html.style.setProperty('--lt-letras', '1')
      return
    }

    const reduzido = prefersReducedMotion()
    const timers: number[] = []
    const agendar = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms))
    }

    const travar = () => {
      html.style.setProperty('--lt-acende', '1')
      html.style.setProperty('--lt-letras', '1')
    }

    const acender = () => {
      if (reduzido) {
        travar()
        agendar(marcar, ATRASO_REDUZIDO_MS)
        return
      }
      html.style.animation = `lt-ignicao ${DURACAO_IGNICAO_MS}ms linear forwards`
      html.addEventListener(
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
        ref={raizRef}
        style={{
          width: '100%',
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--borra)',
          padding: 'clamp(20px, 5vw, 64px)',
        }}
      >
        <div style={{ width: '100%', maxWidth: 'min(620px, 62vh)', display: 'grid', placeItems: 'center' }}>
          <LetreiroSvg />
        </div>
      </div>
    </>
  )
}
