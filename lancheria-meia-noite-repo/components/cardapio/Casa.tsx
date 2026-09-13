'use client'
import { useTema } from '@/components/TemaAtivo'
import { useNegocio } from '@/components/NegocioAtivo'
import { PlacaDePorta, Toldo } from '@/components/letreiro/Assinatura'
import { useHorarioDaCasa } from '@/lib/useHorario'
import { faixaHorario, horaLegivel } from '@/lib/horario'
import { linhasMarca } from '@/lib/marca'
import HeroMascote from '@/components/letreiro/HeroMascote'
import { DesenhoMascote } from '@/components/letreiro/Mascote'

export function Horario({compacto=false}:{compacto?:boolean}) {
  const {CASA}=useNegocio()
  const horario=useHorarioDaCasa()
  return <div className={compacto?'horario-compacto':'horario'} data-horario data-aberto={horario?.aberto} data-ultimos={horario?.ultimos||undefined}>
    {!compacto&&<h2>Está aberto?</h2>}
    <p aria-live="polite">{horario?.texto??faixaHorario(CASA)}</p>
    {!compacto&&<p className="nota">{faixaHorario(CASA)} Horário local da casa.</p>}
  </div>
}
export function Hero() {
  const tema=useTema()
  const {CASA,dados:{textos}}=useNegocio()
  return <>
    <header className="cabecalho-casa moldura"><span className="marca-texto">{CASA.marca}{textos.registro&&<span className="marca-registro">{textos.registro}</span>}</span><span className="nota">{textos.categoria}{CASA.cidade?` em ${CASA.cidade.split(',')[0]}`:''}</span></header>
    {tema.hero!=='nenhum'&&<section className="hero-faixa" aria-labelledby="titulo-casa">
      {tema.assinatura==='toldo'&&<Toldo/>}
      {tema.assinatura==='placa-de-porta'&&<PlacaDePorta/>}
      {textos.heroFoto&&<img src={textos.heroFoto} alt={textos.heroAlt} width={2400} height={1600} fetchPriority="high"/>}
      {tema.mascote&&<HeroMascote/>}
      <div className="hero-texto moldura"><h1 id="titulo-casa">{textos.heroTitulo.split('\n').map((s,i)=><span key={i}>{i>0&&<br/>}{s}</span>)}</h1><p>{textos.heroDescricao}</p></div>
    </section>}
    <div className="moldura"><Horario compacto/></div>
  </>
}
export function HistoriaERodape() {
  const tema=useTema()
  const {CASA,dados:{textos}}=useNegocio()
  const [linha1,linha2]=linhasMarca(CASA.marca)
  return <>
    <section id="a-chapa" data-d-secao="historia" className="a-chapa" aria-labelledby="titulo-chapa">
      <img src="/chapa/chapa-vazia.webp" alt="Chapa de ferro vazia, pronta para o próximo lanche" width={2400} height={1600} loading="lazy"/>
      <div className="chapa-texto moldura"><div><h2 id="titulo-chapa" style={{whiteSpace:'pre-line'}}>{textos.historiaTitulo}</h2>{textos.historia.map((s,i)=><p key={i}>{s}</p>)}<span data-carimbo>{textos.carimbo}</span></div></div>
    </section>
    <section id="horarios" className="horarios-secao moldura"><Horario/><a className="botao-texto" href="#cardapio">Voltar ao cardápio</a></section>
    <footer id="rodape" data-d-secao="contato" className="rodape moldura">
      <div className="rodape-dados"><p>{CASA.nome}</p><address>{CASA.endereco}{CASA.endereco&&<br/>}{CASA.cidade}</address>{CASA.telefone&&<a href={`tel:${CASA.telefone.replace(/[^+\d]/g,'')}`}>{CASA.telefone}</a>}{CASA.whatsapp&&<a href={`https://wa.me/${CASA.whatsapp}`}>WhatsApp</a>}{CASA.instagram&&<a href={`https://instagram.com/${CASA.instagram.replace(/^@/,'')}`} rel="noreferrer">{CASA.instagram}</a>}<p className="pagamentos">{CASA.pagamento.join(' / ')}</p></div>
      {tema.assinatura==='letreiro'?<svg className="letreiro-pequeno" viewBox="0 0 470 200" role="img" aria-label={`${CASA.marca}, letreiro aceso com o mascote pintado ao lado`}>
        <rect x="8" y="8" width="454" height="184" rx="3" fill="var(--fumo)" stroke="var(--traco)" strokeWidth="2"/>
        <rect x="18" y="18" width="434" height="164" rx="2" fill="var(--borra)" stroke="var(--traco)"/>
        <g id="lt-rod-tremor" fill="var(--letreiro)" textAnchor="middle" style={{fontFamily:'var(--fonte-display), serif',fontWeight:800}}>
          <text x="170" y="93" fontSize="72" textLength="248" lengthAdjust="spacingAndGlyphs">{linha1.toUpperCase()}</text><text x="170" y="158" fontSize="72" textLength="248" lengthAdjust="spacingAndGlyphs">{linha2.toUpperCase()}</text>
        </g><DesenhoMascote transform="translate(290 18) scale(.77)"/>
      </svg>:<div className="rodape-assinatura">{tema.mascote&&<svg viewBox="0 0 240 200" width="136" height="114" aria-hidden="true"><DesenhoMascote/></svg>}<span className="marca-texto">{CASA.marca}</span>{textos.rodape&&<span>{textos.rodape}</span>}</div>}
      {CASA.horarioConfirmado!==false&&<p className="rodape-fim nota">Chapa acesa das {horaLegivel(CASA.abre)} às {horaLegivel(CASA.fecha)}.</p>}
    </footer>
  </>
}
