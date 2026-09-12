'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import LetreiroSvg from './LetreiroSvg'
import { CHAVE_SESSAO, DURACAO_IGNICAO_MS, DURACAO_ENTRADA_MS, DURACAO_TOTAL_MS, SCRIPT_ENTRADA } from './sequencia'

export default function Letreiro({ onConcluir }: { onConcluir: () => void }) {
  const [fim, setFim] = useState(false)
  const concluir = useRef(onConcluir)
  concluir.current = onConcluir
  const encerrar = useRef(() => {})

  useLayoutEffect(() => {
    const raiz = document.documentElement
    let encerrado = false
    const terminar = () => {
      if (encerrado) return
      encerrado = true
      raiz.setAttribute('data-lt-aceso', '1')
      try { sessionStorage.setItem(CHAVE_SESSAO, '1') } catch {}
      setFim(true)
      concluir.current()
    }
    encerrar.current = terminar
    const inicio = Number(raiz.getAttribute('data-lt-inicio') ?? performance.now())
    const restante = Math.max(0, DURACAO_TOTAL_MS - (performance.now() - inicio))
    if (raiz.getAttribute('data-lt-aceso') === '1' || restante === 0) { terminar(); return }
    const timer = window.setTimeout(terminar, restante)
    return () => { window.clearTimeout(timer) }
  }, [])

  return <>
    <script dangerouslySetInnerHTML={{ __html: SCRIPT_ENTRADA }} />
    <style>{`
      html:not([data-lt-aceso='1']) #lt-svg { animation: lt-ignicao ${DURACAO_IGNICAO_MS}ms linear both; }
      html:not([data-lt-aceso='1']) #intro { animation: lt-cruzar ${DURACAO_ENTRADA_MS}ms cubic-bezier(.32,0,.2,1) ${DURACAO_IGNICAO_MS}ms both; }
      html:not([data-lt-aceso='1']) #conteudo { animation: lt-entrar ${DURACAO_ENTRADA_MS}ms cubic-bezier(.32,0,.2,1) ${DURACAO_IGNICAO_MS}ms both; }
    `}</style>
    <div id="intro" hidden={fim} onAnimationEnd={e => { if (e.animationName === 'lt-cruzar') encerrar.current() }}>
      <div className="intro-letreiro"><LetreiroSvg /></div>
      <button id="intro-pular" className="botao-texto" onClick={() => encerrar.current()}>Entrar no cardápio</button>
    </div>
  </>
}
