'use client'

import { useTema } from '@/components/TemaAtivo'
import { PlacaDePorta, Toldo } from '@/components/letreiro/Assinatura'
import { useHorarioDaCasa } from '@/lib/useHorario'
import HeroMascote from '@/components/letreiro/HeroMascote'
import { DesenhoMascote } from '@/components/letreiro/Mascote'
import { CASA } from '@/data/casa'

export function Horario({ compacto = false }: { compacto?: boolean }) {
  const horario = useHorarioDaCasa()
  return <div className={compacto ? 'horario-compacto' : 'horario'} data-horario data-aberto={horario?.aberto} data-ultimos={horario?.ultimos || undefined}>
    {!compacto && <h2>Está aberto?</h2>}
    <p aria-live="polite">{horario?.texto ?? 'Todos os dias, das 18h às 4h.'}</p>
    {!compacto && <p className="nota">Horário de Maringá. Todos os dias, das 18h às 4h.</p>}
  </div>
}

export function Hero() {
  const tema = useTema()
  const pratico = tema.slug === 'pratico'
  const diner = tema.slug === 'diner'
  const cantina = tema.slug === 'cantina'
  return <>
    <header className="cabecalho-casa moldura"><span className="marca-texto">Meia-Noite{diner && <span className="marca-registro">Lancheria de esquina</span>}</span><span className="nota">{cantina ? 'Sanduicheria em Maringá' : 'Lancheria em Maringá'}</span></header>
    {!pratico && <section className="hero-faixa" aria-labelledby="titulo-casa">
      {tema.assinatura === 'toldo' && <Toldo />}
      {tema.assinatura === 'placa-de-porta' && <PlacaDePorta />}
      <img src={diner || cantina ? '/fixos/prensado-meia-noite.webp' : '/chapa/chapa-selagem.webp'}
        alt={diner || cantina ? 'Prensado Meia-Noite' : 'Prensado fechando na chapa'}
        width={diner || cantina ? 2000 : 2400} height={diner || cantina ? 2000 : 1600} fetchPriority="high" />
      {tema.mascote && <HeroMascote />}
      <div className="hero-texto moldura"><h1 id="titulo-casa">{diner ? 'Da esquina. Da chapa.' : cantina ? 'Pão, recheio e boa mesa.' : <>A noite pede<br />um prensado.</>}</h1><p>{cantina ? 'O prensado da casa. Desde o primeiro pão.' : 'Pão na chapa. Recheio no lugar.'}</p></div>
    </section>}
    <div className="moldura"><Horario compacto /></div>
  </>
}

export function HistoriaERodape() {
  const tema = useTema()
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
      {tema.assinatura === 'letreiro' ? <svg className="letreiro-pequeno" viewBox="0 0 470 200" role="img" aria-label="Meia-Noite, letreiro aceso com o mascote pintado ao lado">
        <rect x="8" y="8" width="454" height="184" rx="3" fill="var(--fumo)" stroke="var(--traco)" strokeWidth="2" />
        <rect x="18" y="18" width="434" height="164" rx="2" fill="var(--borra)" stroke="var(--traco)" />
        <g id="lt-rod-tremor" fill="var(--letreiro)" textAnchor="middle" style={{ fontFamily: 'var(--fonte-display), serif', fontWeight: 800 }}>
          <text x="170" y="93" fontSize="72" textLength="248" lengthAdjust="spacingAndGlyphs">MEIA</text><text x="170" y="158" fontSize="72" textLength="248" lengthAdjust="spacingAndGlyphs">NOITE</text>
        </g>
        <DesenhoMascote transform="translate(290 18) scale(.77)" />
      </svg> : <div className="rodape-assinatura">
        {tema.slug === 'diner' && <svg viewBox="0 0 240 200" width="136" height="114" aria-hidden="true"><DesenhoMascote /></svg>}
        <span className="marca-texto">Meia-Noite</span>
        {tema.slug === 'cantina' && <span>Da chapa para a mesa.</span>}
      </div>}
      <p className="rodape-fim nota">Chapa acesa das 18h às 4h.</p>
    </footer>
  </>
}
