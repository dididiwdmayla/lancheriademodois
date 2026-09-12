import { NextResponse, type NextRequest } from 'next/server'
import { selecionarTema } from './temas'

export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers)
  // Sobrescreve o cabeçalho externo: só os quatro slugs do registro são aceitos.
  const tema = selecionarTema(request.nextUrl.searchParams.get('tema') ?? process.env.TEMA)
  headers.set('x-lancheria-tema', tema.slug)
  return NextResponse.next({ request: { headers } })
}

export const config = { matcher: ['/'] }
