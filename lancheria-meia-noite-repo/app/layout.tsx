import type { Metadata } from 'next'
import { Fraunces, Archivo, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

// Fontes variáveis: NÃO passar `weight` junto com `axes` — next/font trata a fonte como
// estática quando há lista de pesos, e aí os eixos viram erro de build.
// Sem `weight`, a variável carrega a faixa inteira de wght, que é o que a gente quer.

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--fonte-display',
  display: 'swap',
})

const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--fonte-corpo',
  display: 'swap',
})

// IBM Plex Mono não é variável — aqui `weight` é obrigatório e correto.
// Só no medidor, nos preços e nos carimbos.
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--fonte-medida',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Lancheria Meia-Noite',
  description: 'Prensado de esquina em Maringá. Das 18h às 4h.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${archivo.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
