'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTema } from '@/components/TemaAtivo'
import Letreiro from '@/components/letreiro/Letreiro'
import { RaioXAberto } from '@/components/letreiro/Mascote'
import RaioX, { type LancheFechado } from '@/components/raio-x/RaioX'
import { salto, type Origem } from '@/components/raio-x/salto'
import type { Forma } from '@/components/raio-x/prensa'
import { MAPA_CAMADAS, urlCamada } from '@/data/camadas'
import { FIXOS, type Extra, type Fixo } from '@/data/fixos'
import { CONFIRMACAO_INICIAL, comBacon, ganchoDoPedido, itemExtra, itemFixo, itemLanche, totalPedido, type Item, type ItemPedido } from '@/lib/pedido'
import { lembrarOrigem, origemAtual, transicionar } from '@/lib/transicoes'
import Cardapio from '@/components/cardapio/Cardapio'
import TrilhoLanches from '@/components/cardapio/TrilhoLanches'
import Extras from '@/components/cardapio/Extras'
import { Hero, HistoriaERodape } from '@/components/cardapio/Casa'
import BarraPedido, { type ChegadaBarra } from './BarraPedido'
import Carrinho from './Carrinho'
import Modal from './Modal'

type Editor = { nome: string; forma: Forma; camadas: string[]; id?: string; fixoSlug?: string; observacao?: string; voltarCarrinho: boolean }
const imagens = new Map<string, Promise<void>>()
const preparar = (slugs: string[]) => Promise.all(slugs.map(s => {
  if (!imagens.has(s)) imagens.set(s, new Promise<void>(resolve => { const im = new Image(); im.onload = () => { im.decode().catch(() => {}).finally(resolve) }; im.onerror = () => resolve(); im.src = urlCamada(MAPA_CAMADAS[s]) }))
  return imagens.get(s)!
}))

export default function Balcao() {
  const tema = useTema()
  const [pedido, setPedido] = useState<ItemPedido[]>([])
  const atual = useRef<ItemPedido[]>([])
  const [editor, setEditor] = useState<Editor | null>(null)
  const [confirmacao, setConfirmacao] = useState(CONFIRMACAO_INICIAL)
  const [carrinho, setCarrinho] = useState(false)
  const [intro, setIntro] = useState(tema.assinatura === 'letreiro')
  const [ultimo, setUltimo] = useState<string | null>(null)
  const [aviso, setAviso] = useState('')
  const [ganchos, setGanchos] = useState<{ vistos: string[]; dispensados: string[] }>({ vistos: [], dispensados: [] })
  const [sessaoLida, setSessaoLida] = useState(false)
  const barra = useRef<ChegadaBarra>(null)
  const pid = useRef(0)
  const canceladores = useRef<Set<() => void>>(new Set())
  const vivo = useRef(true)
  useEffect(() => {
    vivo.current = true
    // Antecipar as fotos do salto: só assets existentes, nunca imagens de extras.
    const t = window.setTimeout(() => { void preparar([...new Set(FIXOS.flatMap(f => f.camadas))]) }, 1200)
    try { const salvo = JSON.parse(sessionStorage.getItem('lm:ganchos') ?? 'null'); if (Array.isArray(salvo?.vistos) && Array.isArray(salvo?.dispensados)) setGanchos(salvo) } catch {}
    setSessaoLida(true)
    return () => { vivo.current = false; clearTimeout(t); canceladores.current.forEach(c => c()) }
  }, [])
  useEffect(() => {
    if (!intro) return
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = antes }
  }, [intro])
  useEffect(() => { if (sessaoLida) { try { sessionStorage.setItem('lm:ganchos', JSON.stringify(ganchos)) } catch {} } }, [ganchos, sessaoLida])

  const atualizar = useCallback((novo: ItemPedido[]) => { atual.current = novo; setPedido(novo) }, [])
  const somar = useCallback((item: Item, substituir?: string) => {
    const de = totalPedido(atual.current)
    const lista = atual.current.slice()
    let id = substituir
    if (substituir) {
      const i = lista.findIndex(p => p.id === substituir)
      if (i < 0) return
      lista[i] = { ...item, id: substituir, qtd: lista[i].qtd }
    } else {
      const i = lista.findIndex(p => p.chave === item.chave)
      if (i >= 0) { lista[i] = { ...lista[i], qtd: lista[i].qtd + 1 }; id = lista[i].id }
      else { id = `p${++pid.current}`; lista.push({ ...item, id, qtd: 1 }) }
    }
    atualizar(lista)
    if (item.grupo === 'lanche') setUltimo(id!)
    setAviso(`${item.nome} ${substituir ? 'atualizado' : 'adicionado'}.`)
    barra.current?.chegou(de, totalPedido(lista))
  }, [atualizar])

  const lancar = useCallback((item: Item, origem: Origem | null, substituir?: string, voltarCarrinho = false) => {
    // Cada adição tem sua chegada. Cancelar a anterior aqui perdia pedidos em toques rápidos.
    const cancelar = salto(item, origem, () => { somar(item, substituir); if (voltarCarrinho) setCarrinho(true) })
    canceladores.current.add(cancelar)
    window.setTimeout(() => canceladores.current.delete(cancelar), 1800)
  }, [somar])
  const adicionarFixo = async (f: Fixo, el: HTMLElement) => {
    await preparar(f.camadas)
    if (!vivo.current || !el.isConnected) return
    const palco = el.querySelector<HTMLElement>('[data-palco], .lanche-icone')!
    const r = palco.getBoundingClientRect()
    let origem: Origem = { centroX: r.left + r.width / 2, baseY: r.top + r.height * .75, kk: Math.min(r.width * .9 / 2000, .14) }
    const pilha = palco.querySelector<HTMLElement>('[data-camadas]')
    const base = pilha?.querySelector<HTMLElement>('[data-peca]')
    if (pilha && base) {
      const b = base.getBoundingClientRect(), k = Number(pilha.dataset.k)
      origem = { centroX: b.left + b.width / 2, baseY: b.top + (600 + Number(base.dataset.altura) / 2) * k, kk: k }
    }
    lancar(itemFixo(f), origem)
  }
  const adicionarExtra = (e: Extra) => somar(itemExtra(e))
  // `origem` é o retângulo de onde o raio-x cresce: o cartão que a pessoa tocou, a linha
  // do carrinho, a barra. Nunca o centro da tela — é o toque que explica a tela nova.
  const modificar = (id: string, origem?: Element | null, bacon = false) => {
    const p = atual.current.find(p => p.id === id)
    if (!p || p.grupo !== 'lanche') return
    lembrarOrigem(origem ?? null)
    transicionar('rx-entra', () => {
      setEditor({ nome: p.nome, forma: p.forma, fixoSlug: p.fixoSlug, observacao: p.observacao, camadas: bacon ? comBacon(p.camadas) : p.camadas.slice(), id, voltarCarrinho: carrinho })
      setCarrinho(false)
    }, origemAtual())
  }
  const montar = (forma: Forma, origem: Element | null) => {
    lembrarOrigem(origem)
    transicionar('rx-entra', () => {
      setEditor({ nome: forma === 'prensado' ? 'Seu prensado' : 'Seu redondo', forma, camadas: [], voltarCarrinho: false })
    }, origemAtual())
  }
  // A volta é o inverso da ida: o takeover encolhe de volta para o cartão de origem.
  const fecharEditor = () => transicionar('rx-sai', () => {
    if (editor?.voltarCarrinho) setCarrinho(true)
    setEditor(null)
  }, origemAtual())
  const abrirCarrinho = () => transicionar('carrinho-entra', () => setCarrinho(true))
  const fecharCarrinho = () => transicionar('carrinho-sai', () => setCarrinho(false))
  // Selar não entra na tabela de transições: o SALTO já é a transição desse caminho, e
  // ele desenha clones no documento — congelá-los numa view transition mataria o efeito.
  const aoFechar = (lanche: LancheFechado, origem: Origem | null) => {
    setEditor(null)
    lancar(itemLanche(lanche), origem, editor?.id, editor?.voltarCarrinho)
  }
  const gancho = carrinho && sessaoLida ? ganchoDoPedido(pedido, ganchos.vistos, ganchos.dispensados) : null
  const ganchoId = gancho?.id
  useEffect(() => {
    if (ganchoId) setGanchos(g => g.vistos.includes(ganchoId) ? g : { ...g, vistos: [...g.vistos, ganchoId] })
  }, [ganchoId])
  const ultimoItem = pedido.find(p => p.id === ultimo)

  return <RaioXAberto.Provider value={!!editor}>
    {tema.assinatura === 'letreiro' && <Letreiro onConcluir={() => setIntro(false)} />}
    <main id="conteudo" inert={!!editor || carrinho || intro} className={ultimoItem ? 'tem-modificar' : undefined}>
      <Hero />
      <Cardapio pedido={pedido} onAdicionar={adicionarFixo} onModificar={modificar} onMontar={montar} />
      <TrilhoLanches onAdicionar={adicionarFixo} />
      <Extras grupo="bebida" onAdicionar={adicionarExtra} />
      <Extras grupo="acompanhamento" onAdicionar={adicionarExtra} />
      <HistoriaERodape />
    </main>
    <p className="sr-only" role="status">{aviso}</p>
    {!editor && <div inert={carrinho || intro}>
      <BarraPedido ref={barra} itens={pedido.reduce((s, p) => s + p.qtd, 0)} totalCent={totalPedido(pedido)} onAbrir={abrirCarrinho} ultimo={carrinho ? undefined : ultimoItem} onModificar={modificar} />
    </div>}
    {carrinho && <Carrinho dados={confirmacao} onDados={setConfirmacao} pedido={pedido} gancho={gancho} onSair={fecharCarrinho} onModificar={modificar}
      onQuantidade={(id, d) => atualizar(atual.current.map(p => p.id === id ? { ...p, qtd: p.qtd + d } : p).filter(p => p.qtd > 0))}
      onRemover={id => atualizar(atual.current.filter(p => p.id !== id))}
      onGancho={e => { if (gancho?.extra) adicionarExtra(gancho.extra); else if (gancho?.pedidoId) modificar(gancho.pedidoId, e, true) }}
      onDispensar={() => { if (gancho) setGanchos(g => ({ ...g, dispensados: [...g.dispensados, gancho.id] })) }} />}
    {editor && <Modal className="rx-modal" titulo={`Raio-x do ${editor.nome}`} onSair={fecharEditor}>
      <RaioX fixoSlug={editor.fixoSlug} observacaoInicial={editor.observacao} nome={editor.nome} forma={editor.forma} camadasIniciais={editor.camadas} onFechar={aoFechar} onSair={fecharEditor} editando={!!editor.id} />
    </Modal>}
  </RaioXAberto.Provider>
}
