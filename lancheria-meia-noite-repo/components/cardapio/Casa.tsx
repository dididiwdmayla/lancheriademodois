'use client'

import { useEffect, useState } from 'react'
import HeroMascote from '@/components/letreiro/HeroMascote'
import { DesenhoMascote } from '@/components/letreiro/Mascote'
import { CASA } from '@/data/casa'
import { horarioDaCasa } from '@/lib/horario'

export function Horario({ compacto = false }: { compacto?: boolean }) {
  const [horario, setHorario] = useState<ReturnType<typeof horarioDaCasa> | null>(null)
  useEffect(() => {
    const ler = () => setHorario(horarioDaCasa())
    ler(); const timer = setInterval(ler, 60000)
    document.addEventListener('visibilitychange', ler)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', ler) }
  }, [])
  return <div className={compacto ? 'horario-compacto' : 'horario'} data-horario data-aberto={horario?.aberto} data-ultimos={horario?.ultimos || undefined}>
    {!compacto && <h2>Está aberto?</h2>}
    <p aria-live="polite">{horario?.texto ?? 'Todos os dias, das 18h às 4h.'}</p>
    {!compacto && <p className="nota">Horário de Maringá. Todos os dias, das 18h às 4h.</p>}
  </div>
}

export function Hero() {
  return <>
    <header className="cabecalho-casa moldura"><span className="marca-texto">Meia-Noite</span><span className="nota">Lancheria em Maringá</span></header>
    <section className="hero-faixa" aria-labelledby="titulo-casa">
      <img src="/chapa/chapa-selagem.webp" alt="Prensado fechando na chapa" width={2400} height={1600} fetchPriority="high" />
      <HeroMascote />
      <div className="hero-texto moldura"><h1 id="titulo-casa">A noite pede<br />um prensado.</h1><p>Pão na chapa. Recheio no lugar.</p></div>
    </section>
    <div className="moldura"><Horario compacto /></div>
  </>
}

export function HistoriaERodape() {
  return <>
    <section id="a-chapa" className="a-chapa" aria-labelledby="titulo-chapa">
      <img src="/chapa/chapa-vazia.webp" alt="Chapa de ferro vazia, pronta para o próximo lanche" width={2400} height={1600} loading="lazy" />
      <div className="chapa-texto moldura"><div><h2 id="titulo-chapa">Antes do prato,<br />um carrinho.</h2><p>O prensado nasceu em Maringá, dentro de um carrinho de lanches. Alguém instalou uma prensa na chapa e passou a fechar o pão sobre o recheio.</p><p>Os concorrentes copiaram. Virou prato típico da cidade e saiu do estado.</p><span data-carimbo>MARINGÁ / PÃO / CHAPA / PRENSA</span></div></div>
    </section>
    <section id="horarios" className="horarios-secao moldura"><Horario /><a className="botao-texto" href="#cardapio">Voltar ao cardápio</a></section>
    <footer id="rodape" className="rodape moldura">
      <div className="rodape-dados"><p>{CASA.nome}</p><address>{CASA.endereco}<br />{CASA.cidade}</address><a href={`tel:+${CASA.whatsapp}`}>{CASA.telefone}</a><p className="pagamentos">{CASA.pagamento.join(' / ')}</p></div>
      {/* A placa cresceu para a direita para caber o mascote pintado ao lado do nome. As
          letras não saíram do lugar: continuam centradas em x=170, como antes. */}
      <svg className="letreiro-pequeno" viewBox="0 0 470 200" role="img" aria-label="Meia-Noite, letreiro aceso com o mascote pintado ao lado">
        <rect x="8" y="8" width="454" height="184" rx="3" fill="var(--fumo)" stroke="var(--traco)" strokeWidth="2" />
        <rect x="18" y="18" width="434" height="164" rx="2" fill="var(--borra)" stroke="var(--traco)" />
        <g id="lt-rod-tremor" fill="var(--letreiro)" textAnchor="middle" style={{ fontFamily: 'var(--fonte-display), serif', fontWeight: 800 }}>
          <text x="170" y="93" fontSize="72" textLength="248" lengthAdjust="spacingAndGlyphs">MEIA</text><text x="170" y="158" fontSize="72" textLength="248" lengthAdjust="spacingAndGlyphs">NOITE</text>
        </g>
        <DesenhoMascote transform="translate(302 40) scale(.62)" />
      </svg>
      <p className="rodape-fim nota">Chapa acesa das 18h às 4h.</p>
    </footer>
  </>
}
