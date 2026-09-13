// O preço comercial do fixo é seu piso; no montador, cada camada conta.

import { MAPA_CAMADAS as FISICA } from '@/data/camadas'
import type { Fixo } from '@/data/fixos'
import { DADOS_EXEMPLO, type DadosLancheria } from '@/data/negocio'

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

export function criarPrecos(dados: DadosLancheria) {
  const MAPA_CAMADAS = Object.fromEntries(dados.ingredientes.map(c=>[c.slug,{...FISICA[c.slug],slug:c.slug,nome:c.nome,precoCent:c.precoCent}]))
  const MAPA_FIXOS = Object.fromEntries(dados.lanches.map(f=>[f.slug,f]))
  const PRECO_BASE_CENT = dados.precoBaseCent
/** Preço de uma pilha, em centavos. Pilha vazia não tem preço, tem zero. */
function precoDaComposicao(slugs: string[]): number {
  if (!slugs.length) return 0
  return slugs
    .filter((s) => MAPA_CAMADAS[s])
    .reduce((soma, s) => soma + MAPA_CAMADAS[s].precoCent, PRECO_BASE_CENT)
}

/** Preço de catálogo injetado; o exemplo antigo pode derivá-lo da composição. */
function precoDoFixo(f: Fixo): number {
  return f.precoCent ?? precoDaComposicao(f.camadas)
}

function precoDoLanche(camadas: string[], fixoSlug?: string): number {
  const fixo = fixoSlug ? MAPA_FIXOS[fixoSlug] : undefined
  if (!fixo) return precoDaComposicao(camadas)
  return precoDoFixo(fixo) + diferencaCamadas(camadas, fixo.camadas).acrescentadas
    .reduce((total, slug) => total + (MAPA_CAMADAS[slug]?.precoCent ?? 0), 0)
}

/** Essencial é uma camada fixa no editor; no montador, apenas os pães. */
function camadaFixa(slug: string, fixoSlug?: string): boolean {
  return !!MAPA_CAMADAS[slug]?.obrigatorio || !!(fixoSlug && MAPA_FIXOS[fixoSlug]?.essenciais.includes(slug))
}
  return { precoDaComposicao, precoDoFixo, precoDoLanche, camadaFixa }
}
// Compatibilidade de utilitários e testes do exemplo. O app usa a instância do provider.
export const { precoDaComposicao, precoDoFixo, precoDoLanche, camadaFixa } = criarPrecos(DADOS_EXEMPLO)
