import { MAPA_CAMADAS } from '@/data/camadas'
import { CASA, MAX_CAMADAS } from '@/data/casa'
import { MAPA_FIXOS, EXTRAS, type Fixo, type Extra } from '@/data/fixos'
import type { LancheFechado } from '@/components/raio-x/RaioX'
import { brl, precoDoLanche, diferencaCamadas } from './precos'

export type Item = LancheFechado & { grupo: 'lanche' | Extra['grupo']; foto: string }
export type ItemPedido = Item & { id: string; qtd: number }
export type Gancho = { id: 'bebida' | 'batata' | 'bacon'; texto: string; extra?: Extra; pedidoId?: string }
export const resumoCamadas = (camadas: string[]) => camadas.filter(s => !MAPA_CAMADAS[s].pao).map(s => MAPA_CAMADAS[s].nome).join(', ') || 'Só o pão'
export const totalPedido = (pedido: ItemPedido[]) => pedido.reduce((s, p) => s + p.cent * p.qtd, 0)

export function itemLanche(lanche: LancheFechado): Item {
  const fixo = lanche.fixoSlug ? MAPA_FIXOS[lanche.fixoSlug] : undefined
  const observacao = (lanche.observacao ?? '').trim().slice(0, 120)
  return { ...lanche, observacao,
    chave: JSON.stringify([lanche.fixoSlug ?? 'montado', lanche.forma, lanche.camadas, observacao]),
    cent: precoDoLanche(lanche.camadas, lanche.fixoSlug), resumo: resumoCamadas(lanche.camadas), grupo: 'lanche',
    foto: `/fixos/${fixo?.slug ?? (lanche.forma === 'prensado' ? 'prensado-completo' : 'x-salada')}.webp` }
}
export function itemFixo(f: Fixo): Item {
  return itemLanche({ nome: f.nome, forma: f.forma, camadas: f.camadas.slice(), fixoSlug: f.slug, chave: '', resumo: '', cent: 0 })
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

export type Confirmacao = {
  nome: string
  recebimento: 'retirada' | 'entrega'
  endereco: string
  complemento: string
  pagamento: '' | typeof CASA.pagamento[number]
  troco: string
  observacao: string
}
export const CONFIRMACAO_INICIAL: Confirmacao = {
  nome: '', recebimento: 'retirada', endereco: '', complemento: '', pagamento: '', troco: '', observacao: '',
}
export function validarConfirmacao(dados: Confirmacao): Partial<Record<keyof Confirmacao, string>> {
  const erros: Partial<Record<keyof Confirmacao, string>> = {}
  if (!dados.nome.trim()) erros.nome = 'Falta o nome'
  if (dados.recebimento === 'entrega' && !dados.endereco.trim()) erros.endereco = 'Falta o endereço'
  if (!CASA.pagamento.some(p => p === dados.pagamento)) erros.pagamento = 'Falta a forma de pagamento'
  if (dados.pagamento === 'Dinheiro' && dados.troco.trim() && !/^\d+(?:[,.]\d{1,2})?$/.test(dados.troco.trim())) erros.troco = 'Confira o valor do troco'
  return erros
}
const umaLinha = (texto: string) => texto.trim().replace(/\s+/g, ' ')

export function resumoPedido(pedido: ItemPedido[], dados?: Confirmacao): string {
  const linhas = [`Pedido — ${CASA.nome}`, '']
  for (const p of pedido) {
    linhas.push(`${p.qtd}× ${p.nome} — ${brl(p.cent * p.qtd)}`)
    if (p.grupo === 'lanche') {
      const original = p.fixoSlug ? MAPA_FIXOS[p.fixoSlug]?.camadas ?? [] : []
      const { acrescentadas, removidas } = diferencaCamadas(p.camadas, original)
      if (p.fixoSlug) {
        for (const s of acrescentadas) linhas.push(`   + ${MAPA_CAMADAS[s].nome.toLowerCase()}`)
        for (const s of removidas) linhas.push(`   − ${MAPA_CAMADAS[s].nome.toLowerCase()}`)
      } else linhas.push(`   ${resumoCamadas(p.camadas)}`)
    }
    if (p.observacao?.trim()) linhas.push(`   obs: ${umaLinha(p.observacao)}`)
    linhas.push('')
  }
  linhas.push(`Total: ${brl(totalPedido(pedido))}`)
  if (dados) {
    linhas.push('', `Nome: ${umaLinha(dados.nome)}`,
      dados.recebimento === 'entrega'
        ? `Entrega: ${[dados.endereco, dados.complemento].map(umaLinha).filter(Boolean).join(', ')}`
        : 'Retirada no balcão',
      `Pagamento: ${dados.pagamento}${dados.pagamento === 'Dinheiro' && dados.troco.trim() ? ` (troco para ${brl(Math.round(Number(dados.troco.replace(',', '.')) * 100))})` : ''}`)
    if (dados.observacao.trim()) linhas.push(`Obs: ${umaLinha(dados.observacao)}`)
  }
  return linhas.join('\n')
}
export function urlWhatsApp(pedido: ItemPedido[], dados: Confirmacao): string {
  return `https://wa.me/${CASA.whatsapp}?text=${encodeURIComponent(resumoPedido(pedido, dados))}`
}
