'use client'

// O balcão: quem segura o pedido e liga o raio-x à barra.
//
// Nesta rodada é também a única porta de entrada do raio-x — o cardápio em grade é fase
// seguinte. Quando ele existir, é ele quem abre o raio-x, e este arquivo continua o mesmo:
// recebe o lanche fechado, lança, e soma no pedido.

import { useCallback, useEffect, useRef, useState } from 'react'
import RaioX, { type LancheFechado } from '@/components/raio-x/RaioX'
import { salto, type Origem } from '@/components/raio-x/salto'
import BarraPedido, { ALTURA_BARRA_PX, type ChegadaBarra } from './BarraPedido'
import type { Forma } from '@/components/raio-x/prensa'

type ItemPedido = LancheFechado & { id: string; qtd: number }

type Props = {
  nome: string
  forma: Forma
  camadasIniciais: string[]
}

const somaCent = (arr: ItemPedido[]) => arr.reduce((s, p) => s + p.cent * p.qtd, 0)

export default function Balcao({ nome, forma, camadasIniciais }: Props) {
  const [pedido, setPedido] = useState<ItemPedido[]>([])
  const pedidoRef = useRef<ItemPedido[]>([])
  const exibido = useRef(0)
  const pid = useRef(0)
  const barra = useRef<ChegadaBarra>(null)
  const cancelarSalto = useRef<(() => void) | null>(null)

  useEffect(() => () => cancelarSalto.current?.(), [])

  /** Item repetido soma quantidade; item novo entra no fim da lista. */
  const somar = useCallback((item: LancheFechado) => {
    const de = exibido.current
    const atual = pedidoRef.current
    const igual = atual.findIndex((x) => x.chave === item.chave)
    const novo =
      igual >= 0
        ? atual.map((x, j) => (j === igual ? { ...x, qtd: x.qtd + 1 } : x))
        : [...atual, { ...item, id: `p${++pid.current}`, qtd: 1 }]

    pedidoRef.current = novo
    setPedido(novo)
    const para = somaCent(novo)
    exibido.current = para
    barra.current?.chegou(de, para)
  }, [])

  const aoFechar = useCallback(
    (item: LancheFechado, origem: Origem | null) => {
      cancelarSalto.current?.()
      cancelarSalto.current = salto(item, origem, () => somar(item))
    },
    [somar],
  )

  return (
    <>
      <div style={{ height: `calc(100dvh - ${ALTURA_BARRA_PX}px)` }}>
        <RaioX nome={nome} forma={forma} camadasIniciais={camadasIniciais} onFechar={aoFechar} />
      </div>
      <BarraPedido
        ref={barra}
        itens={pedido.reduce((s, p) => s + p.qtd, 0)}
        totalCent={somaCent(pedido)}
      />
    </>
  )
}
