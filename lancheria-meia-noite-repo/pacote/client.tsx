'use client'
import { ProvedorTema } from '@/components/TemaAtivo'
import { ProvedorNegocio } from '@/components/NegocioAtivo'
import Balcao from '@/components/pedido/Balcao'
import { estiloTema, type Tema } from '@/temas'
import type { DadosLancheria } from '@/data/negocio'

/** A skin recebe o objeto escolhido pelo servidor. Não existe seletor de identidade. */
export function Lancheria({tema,dados}:{tema:Tema;dados:DadosLancheria}) {
  const estilo=estiloTema(tema)
  const css=Object.entries(estilo).map(([k,v])=>`${k==='colorScheme'?'color-scheme':k}:${v}`).join(';')
  return <>
    <link rel="stylesheet" href="/lancheria-rx/estrutura.css" precedence="lancheria"/>
    <link rel="stylesheet" href={tema.folhaFontes} precedence="lancheria-fontes"/>
    <style>{`html:has([data-lancheria-app]){${css}}`}</style>
    <div data-lancheria-app data-tema={tema.slug} data-layout={tema.cardapio} data-fundo={tema.fundo}
      data-densidade={tema.densidade} data-assinatura={tema.assinatura}
      data-transicao-ms={tema.movimento.transicaoMs??undefined} data-captura={tema.movimento.captura} style={estilo}>
      <ProvedorTema tema={tema}><ProvedorNegocio key={JSON.stringify(dados)} dados={dados}><Balcao/></ProvedorNegocio></ProvedorTema>
    </div>
  </>
}
