import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { ProvedorNegocio } from '@/components/NegocioAtivo'
import { exemploLancheria } from '@/data/negocio'
import { ProvedorTema } from '@/components/TemaAtivo'
import { estiloTema, selecionarTema } from '@/temas'
import './globals.css'
import './temas.css'

export const metadata: Metadata = {
  title: 'Lancheria Meia-Noite',
  description: 'Prensado de esquina em Maringá. Das 18h às 4h.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tema = selecionarTema((await headers()).get('x-lancheria-tema'))
  return <html lang="pt-BR" data-tema={tema.slug} data-fundo={tema.fundo}
    data-layout={tema.cardapio} data-transicao-ms={tema.movimento.transicaoMs ?? undefined} data-captura={tema.movimento.captura} data-densidade={tema.densidade} data-assinatura={tema.assinatura}
    style={estiloTema(tema)} suppressHydrationWarning>
    <head>
      {/* Só a folha ativa: sem next/font global nem preload das outras famílias. */}
      <link rel="stylesheet" href={tema.folhaFontes} />
    </head>
    <body><ProvedorTema tema={tema}><ProvedorNegocio dados={exemploLancheria(tema.hero)}>{children}</ProvedorNegocio></ProvedorTema></body>
  </html>
}
