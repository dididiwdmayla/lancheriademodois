import { MAPA_CAMADAS } from '@/data/camadas'
import { CASA, MAX_CAMADAS } from '@/data/casa'
import { FIXOS, EXTRAS, type Fixo, type Extra } from '@/data/fixos'
import type { LancheFechado } from '@/components/raio-x/RaioX'
import { brl, precoDaComposicao } from './precos'

export type Item = LancheFechado & { grupo: 'lanche' | Extra['grupo']; foto: string }
export type ItemPedido = Item & { id: string; qtd: number }
export type Gancho = { id: 'bebida' | 'batata' | 'bacon'; texto: string; extra?: Extra; pedidoId?: string }
export const resumoCamadas = (camadas: string[]) => camadas.filter(s => !MAPA_CAMADAS[s].pao).map(s => MAPA_CAMADAS[s].nome).join(', ') || 'Só o pão'
export const totalPedido = (pedido: ItemPedido[]) => pedido.reduce((s, p) => s + p.cent * p.qtd, 0)

export function itemLanche(lanche: LancheFechado): Item {
  const fixo = FIXOS.find(f => f.forma === lanche.forma && f.camadas.join('.') === lanche.camadas.join('.'))
  return { ...lanche, chave: `montado:${lanche.forma}:${lanche.camadas.join('.')}`, cent: precoDaComposicao(lanche.camadas),
    resumo: resumoCamadas(lanche.camadas), grupo: 'lanche', foto: `/fixos/${fixo?.slug ?? (lanche.forma === 'prensado' ? 'prensado-completo' : 'x-salada')}.webp` }
}
export function itemFixo(f: Fixo): Item {
  return itemLanche({ ...f, chave: '', resumo: '', cent: 0 })
}
export function itemExtra(e: Extra): Item {
  return { chave: `extra:${e.slug}`, nome: e.nome, forma: 'prensado', camadas: [], resumo: e.grupo === 'bebida' ? 'Bebida' : 'Acompanhamento',
    cent: e.precoCent, grupo: e.grupo, foto: '' }
}

export function ganchoDoPedido(pedido: ItemPedido[], vistos: string[], dispensados: string[]): Gancho | null {
  const lanches = pedido.filter(p => p.grupo === 'lanche')
  if (!lanches.length) return null
  const candidatos: Gancho[] = []
  if (!pedido.some(p => p.grupo === 'bebida')) candidatos.push({ id: 'bebida', texto: 'Sem bebida?', extra: EXTRAS.find(e => e.slug === 'refri')! })
  if (lanches.reduce((s, p) => s + p.qtd, 0) >= 2 && !pedido.some(p => p.grupo === 'acompanhamento')) {
    candidatos.push({ id: 'batata', texto: 'Dois lanches, nenhuma batata.', extra: EXTRAS.find(e => e.slug === 'batata-frita')! })
  }
  const semBacon = lanches.find(p => p.forma === 'prensado' && !p.camadas.includes('bacon') && p.camadas.length < MAX_CAMADAS)
  if (semBacon) candidatos.push({ id: 'bacon', texto: `${semBacon.nome} sem bacon.`, pedidoId: semBacon.id })
  return candidatos.find(g => !dispensados.includes(g.id) && (vistos.includes(g.id) || vistos.length < 2)) ?? null
}

/** Insere bacon sem reordenar a composição que a pessoa montou e sem afastar molho do pão. */
export function comBacon(camadas: string[]): string[] {
  if (camadas.includes('bacon') || camadas.length >= MAX_CAMADAS) return camadas.slice()
  const novo = camadas.slice()
  let i = novo.findIndex((s, n) => n > 0 && !MAPA_CAMADAS[s].pao && MAPA_CAMADAS[s].ordem > MAPA_CAMADAS.bacon.ordem)
  if (i < 0) i = novo.length - 1
  if (novo[i - 1] === 'molho' && i > 1) i--
  novo.splice(i, 0, 'bacon')
  return novo
}

export function resumoPedido(pedido: ItemPedido[]): string {
  return [`Pedido — ${CASA.nome}`, '', ...pedido.flatMap(p => [
    `${p.qtd} × ${p.nome} — ${brl(p.cent * p.qtd)}`,
    ...(p.grupo === 'lanche' ? [`  ${p.resumo}`] : []),
  ]), '', `Total: ${brl(totalPedido(pedido))}`, `Pagamento: ${CASA.pagamento.join(', ')}.`,
    'Confirmar disponibilidade e retirada.'].join('\n')
}
