'use client'

import { useState } from 'react'
import { CAMADAS } from '@/data/camadas'
import { FIXOS, type Fixo } from '@/data/fixos'
import type { Forma } from '@/components/raio-x/prensa'
import { brl, precoDoFixo } from '@/lib/precos'
import { resumoCamadas, type ItemPedido } from '@/lib/pedido'

type Props = { onAdicionar: (f: Fixo, el: HTMLElement) => void; onMontar: (f: Forma) => void; onModificar: (id: string) => void; pedido: ItemPedido[] }

export default function Cardapio({ onAdicionar, onMontar, onModificar, pedido }: Props) {
  const [forma, setForma] = useState<Forma | 'monte'>('prensado')
  const [ingredientes, setIngredientes] = useState<string[]>([])
  const [filtroAberto, setFiltroAberto] = useState(false)
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
      <div className="cardapio-grade">{visiveis.map(f => {
        const adicionado = pedido.find(p => p.grupo === 'lanche' && p.fixoSlug === f.slug)
        return <article key={f.slug} data-item-cardapio={f.slug} className="lanche-card">
          <img className="lanche-icone" data-foto={f.slug} src={`/fixos/${f.slug}.webp`} alt={f.nome} width={2000} height={2000} />
          <h3>{f.nome}</h3><p className="ingredientes-linha" title={resumoCamadas(f.camadas)}>{resumoCamadas(f.camadas)}</p>
          <span data-preco>{brl(precoDoFixo(f))}</span>
          <button className="botao-quente" data-add={f.slug} onClick={e => onAdicionar(f, e.currentTarget.closest('article')!)}>Adicionar</button>
          {adicionado && <button className="modificar-card botao-texto" data-modificar={adicionado.id} onClick={() => onModificar(adicionado.id)}>Modificar lanche</button>}
        </article>
      })}</div>
      {!visiveis.length && <div className="vazio"><p>Nenhum lanche com essa combinação.</p><button className="botao-texto" onClick={() => setIngredientes([])}>Limpar ingredientes</button></div>}
    </>}
    {forma === 'monte' && <div className="cardapio-grade monte-grade">
      {(['prensado', 'redondo'] as const).map(f => <article key={f} className="lanche-card">
        <img className="lanche-icone" src={`/camadas/${f === 'prensado' ? 'pao-prensado-topo' : 'pao-topo'}.webp`} alt="" width={2000} height={1200} />
        <h3>{f === 'prensado' ? 'Prensado' : 'Redondo'} do seu jeito</h3><p>Escolha o recheio. O pão já entra junto.</p>
        <button id={`abrir-livre-${f}`} className="botao-quente" onClick={() => onMontar(f)}>Começar a montar</button>
      </article>)}
    </div>}
  </section>
}
