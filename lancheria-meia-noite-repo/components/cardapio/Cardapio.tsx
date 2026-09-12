'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { pausarMovimento, prefersReducedMotion } from '@/lib/motion'
import { GRADE_TOTAL_MS } from '@/lib/transicoes'
import { useTema } from '@/components/TemaAtivo'
import { CAMADAS } from '@/data/camadas'
import { FIXOS, type Fixo } from '@/data/fixos'
import type { Forma } from '@/components/raio-x/prensa'
import { brl, precoDoFixo } from '@/lib/precos'
import { resumoCamadas, type ItemPedido } from '@/lib/pedido'

type Props = { onAdicionar: (f: Fixo, el: HTMLElement) => void; onMontar: (f: Forma, origem: Element | null) => void; onModificar: (id: string, origem?: Element | null) => void; pedido: ItemPedido[] }

/** A grade reencaixa na troca de filtro: 20ms entre um item e o seguinte, 200ms do
 * primeiro ao último. Quanto mais itens, mais curto o passo de cada um — o total é que
 * é fixo. A `key` é o que refaz a animação: filtro novo, grade nova. */
const reencaixe = (n: number): CSSProperties => ({ '--tr-itens': n } as CSSProperties)
const naFila = (i: number): CSSProperties => ({ '--tr-i': i } as CSSProperties)

export default function Cardapio({ onAdicionar, onMontar, onModificar, pedido }: Props) {
  const pratico = useTema().slug === 'pratico'
  const [forma, setForma] = useState<Forma | 'monte'>('prensado')
  const [ingredientes, setIngredientes] = useState<string[]>([])
  const [filtroAberto, setFiltroAberto] = useState(false)
  useEffect(() => {
    if (pratico || prefersReducedMotion() || !window.matchMedia('(min-width: 900px)').matches) return
    const retomar = pausarMovimento()
    const timer = window.setTimeout(retomar, GRADE_TOTAL_MS)
    return () => { clearTimeout(timer); retomar() }
  }, [forma, ingredientes, pratico])
  const visiveis = FIXOS.filter(f => f.forma === forma && ingredientes.every(s => f.camadas.includes(s)))
  return <section id="cardapio" data-cardapio className="cardapio moldura">
    <div className="cabecalho-secao"><h2>Cardápio</h2><span className="nota">Direto da chapa.</span></div>
    <div className="filtros-forma" role="group" aria-label="Forma do lanche">
      {(['prensado', 'redondo', 'monte'] as const).map((f, i) => <button key={f} data-filtro-forma={f} aria-pressed={forma === f} onClick={() => setForma(f)}>{['Prensados', 'Redondos', 'Monte o seu'][i]}</button>)}
    </div>
    {forma !== 'monte' && <>
      <div className="filtro-resumo">
        <button className="botao-texto" aria-expanded={filtroAberto} aria-controls="filtro-ingredientes" onClick={() => setFiltroAberto(!filtroAberto)}>Ingredientes{ingredientes.length ? ` (${ingredientes.length})` : ''} <span aria-hidden="true">{filtroAberto ? '−' : '+'}</span></button>
        <span className="nota" role="status">{visiveis.length} {visiveis.length === 1 ? 'lanche' : 'lanches'}</span>
      </div>
      {filtroAberto && <div id="filtro-ingredientes" className="filtro-ingredientes" role="group" aria-label="Lanches com estes ingredientes">
        <p>Com todos os ingredientes marcados.</p>
        <div className="ingredientes-grade">{CAMADAS.filter(c => !c.pao).map(c => <button key={c.slug} data-filtro-ingrediente={c.slug} aria-pressed={ingredientes.includes(c.slug)} onClick={() => setIngredientes(a => a.includes(c.slug) ? a.filter(s => s !== c.slug) : [...a, c.slug])}>
          <img src={c.ficha} alt="" width={44} height={44} /><span>{c.nome}</span>
        </button>)}</div>
        {!!ingredientes.length && <button className="botao-texto" onClick={() => setIngredientes([])}>Limpar ingredientes</button>}
      </div>}
      <div className="cardapio-grade" data-troca key={`${forma}|${ingredientes.join(',')}`} style={reencaixe(visiveis.length)}>{visiveis.map((f, i) => {
        const adicionado = pedido.find(p => p.grupo === 'lanche' && p.fixoSlug === f.slug)
        return <article key={f.slug} data-item-cardapio={f.slug} className="lanche-card" style={naFila(i)}>
          <img className="lanche-icone" data-foto={f.slug} src={`/fixos/${f.slug}.webp`} alt={f.nome} width={2000} height={2000} />
          <h3>{f.nome}</h3><p className="ingredientes-linha" title={resumoCamadas(f.camadas)}>{resumoCamadas(f.camadas)}</p>
          <span data-preco>{brl(precoDoFixo(f))}</span>
          <button className="botao-quente" data-add={f.slug} onClick={e => onAdicionar(f, e.currentTarget.closest('article')!)} aria-label={`Adicionar ${f.nome}`}><span className="adicionar-label">Adicionar</span>{pratico && <span className="adicionar-mais" aria-hidden="true">+</span>}</button>
          {adicionado && <button className="modificar-card botao-texto" data-modificar={adicionado.id} onClick={e => onModificar(adicionado.id, e.currentTarget.closest('article'))}>{pratico ? 'Personalizar' : 'Modificar lanche'}</button>}
        </article>
      })}</div>
      {!visiveis.length && <div className="vazio"><p>Nenhum lanche com essa combinação.</p><button className="botao-texto" onClick={() => setIngredientes([])}>Limpar ingredientes</button></div>}
    </>}
    {forma === 'monte' && <div className="cardapio-grade monte-grade" data-troca key="monte" style={reencaixe(2)}>
      {(['prensado', 'redondo'] as const).map((f, i) => <article key={f} className="lanche-card" style={naFila(i)}>
        <img className="lanche-icone" src={`/camadas/${f === 'prensado' ? 'pao-prensado-topo' : 'pao-topo'}.webp`} alt="" width={2000} height={1200} />
        <h3>{f === 'prensado' ? 'Prensado' : 'Redondo'} do seu jeito</h3><p>Escolha o recheio. O pão já entra junto.</p>
        <button id={`abrir-livre-${f}`} className="botao-quente" onClick={e => onMontar(f, e.currentTarget.closest('article'))}>Começar a montar</button>
      </article>)}
    </div>}
  </section>
}
