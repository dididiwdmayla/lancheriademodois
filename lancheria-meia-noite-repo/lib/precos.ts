// Preço sai sempre da composição: base da casa mais a soma das camadas. Nunca fixado à
// mão — senão editar o lanche não move o valor, e o cardápio mente.

import { MAPA_CAMADAS } from '@/data/camadas'
import { PRECO_BASE_CENT } from '@/data/casa'
import type { Fixo } from '@/data/fixos'

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
