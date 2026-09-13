'use client'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { CAMADAS as FISICA } from '@/data/camadas'
import { DADOS_EXEMPLO, type DadosLancheria } from '@/data/negocio'
import { criarPrecos } from '@/lib/precos'
import { criarPedido } from '@/lib/pedido'
function criarNegocio(dados: DadosLancheria) {
  const CAMADAS=dados.ingredientes.map(c=>({...FISICA.find(f=>f.slug===c.slug)!,slug:c.slug,nome:c.nome,precoCent:c.precoCent}))
  return {dados,CASA:dados.casa,CAMADAS,MAPA_CAMADAS:Object.fromEntries(CAMADAS.map(c=>[c.slug,c])),
    FIXOS:dados.lanches,EXTRAS:dados.extras, ...criarPrecos(dados),...criarPedido(dados)}
}
const NegocioAtivo=createContext(criarNegocio(DADOS_EXEMPLO))
export const useNegocio=()=>useContext(NegocioAtivo)
export function ProvedorNegocio({dados,children}:{dados:DadosLancheria;children:ReactNode}) {
  const negocio=useMemo(()=>criarNegocio(dados),[dados])
  return <NegocioAtivo.Provider value={negocio}>{children}</NegocioAtivo.Provider>
}
