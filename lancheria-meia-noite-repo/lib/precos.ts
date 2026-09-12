// O fixo nasce da composição. No editor, vira piso; no montador, cada camada conta.

import { MAPA_CAMADAS } from '@/data/camadas'
import { PRECO_BASE_CENT } from '@/data/casa'
import { MAPA_FIXOS, type Fixo } from '@/data/fixos'

/** Preço de uma pilha, em centavos. Pilha vazia não tem preço, tem zero. */
export function precoDaComposicao(slugs: string[]): number {
  if (!slugs.length) return 0
  return slugs
    .filter((s) => MAPA_CAMADAS[s])
    .reduce((soma, s) => soma + MAPA_CAMADAS[s].precoCent, PRECO_BASE_CENT)
}

/** Preço de um lanche do cardápio. Mesma conta — um fixo é só uma composição salva. */
export function precoDoFixo(f: Fixo): number {
  return precoDaComposicao(f.camadas)
}

export function brl(centavos: number): string {
  return `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`
}

/** Diferença por ocorrência: reordenar ou recolocar uma camada original não cobra de novo. */
export function diferencaCamadas(atual: string[], original: string[]) {
  const saldo = original.slice()
  const acrescentadas = atual.filter(slug => {
    const i = saldo.indexOf(slug)
    if (i < 0) return true
    saldo.splice(i, 1)
    return false
  })
  return { acrescentadas, removidas: saldo }
}

export function precoDoLanche(camadas: string[], fixoSlug?: string): number {
  const fixo = fixoSlug ? MAPA_FIXOS[fixoSlug] : undefined
  if (!fixo) return precoDaComposicao(camadas)
  return precoDoFixo(fixo) + diferencaCamadas(camadas, fixo.camadas).acrescentadas
    .reduce((total, slug) => total + (MAPA_CAMADAS[slug]?.precoCent ?? 0), 0)
}

/** Essencial é uma camada fixa no editor; no montador, apenas os pães. */
export function camadaFixa(slug: string, fixoSlug?: string): boolean {
  return !!MAPA_CAMADAS[slug]?.obrigatorio || !!(fixoSlug && MAPA_FIXOS[fixoSlug]?.essenciais.includes(slug))
}
