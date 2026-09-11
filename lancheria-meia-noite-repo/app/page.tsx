import Letreiro from '@/components/letreiro/Letreiro'
import Balcao from '@/components/pedido/Balcao'
import { MAPA_FIXOS } from '@/data/fixos'

// Porte 2 de N — letreiro e raio-x. Ver /design/PROMPT-09-porte.md.
//
// O cardápio em grade é a fase seguinte, e é ele quem vai abrir o raio-x. Até lá `?lanche=`
// é a única porta: escolhe qual composição nasce no painel. Nenhum lanche fora do
// cardápio entra por aqui — slug desconhecido cai no Prensado Completo.
//
// `?lanche=montar` é a exceção: não é um fixo, é a porta provisória para o "Monte o seu"
// (`?forma=` escolhe prensado ou redondo, prensado por padrão) — até o filtro de forma do
// cardápio existir como porta de verdade. É o que diferencia o painel que nasce vazio
// (montador, trilho aberto) do painel que nasce a partir de um fixo (editor, trilho
// recolhido) — ver o comentário de `modoMontador` em `RaioX.tsx`.
const PADRAO = 'prensado-completo'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lanche?: string; forma?: string }>
}) {
  const { lanche, forma } = await searchParams
  const montando = lanche === 'montar'
  const fixo = montando ? null : (MAPA_FIXOS[lanche ?? ''] ?? MAPA_FIXOS[PADRAO])

  return (
    <>
      <Letreiro />
      <Balcao
        nome={fixo ? fixo.nome : 'Monte o seu'}
        forma={fixo ? fixo.forma : forma === 'redondo' ? 'redondo' : 'prensado'}
        camadasIniciais={fixo ? fixo.camadas : []}
      />
    </>
  )
}
