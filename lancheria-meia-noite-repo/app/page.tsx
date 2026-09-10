import Letreiro from '@/components/letreiro/Letreiro'
import Balcao from '@/components/pedido/Balcao'
import { MAPA_FIXOS } from '@/data/fixos'

// Porte 2 de N — letreiro e raio-x. Ver /design/PROMPT-09-porte.md.
//
// O cardápio em grade é a fase seguinte, e é ele quem vai abrir o raio-x. Até lá `?lanche=`
// é a única porta: escolhe qual composição nasce no painel. Nenhum lanche fora do
// cardápio entra por aqui — slug desconhecido cai no Prensado Completo.
const PADRAO = 'prensado-completo'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lanche?: string }>
}) {
  const { lanche } = await searchParams
  const fixo = MAPA_FIXOS[lanche ?? ''] ?? MAPA_FIXOS[PADRAO]

  return (
    <>
      <Letreiro />
      <Balcao nome={fixo.nome} forma={fixo.forma} camadasIniciais={fixo.camadas} />
    </>
  )
}
