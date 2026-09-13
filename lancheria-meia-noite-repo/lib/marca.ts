export function linhasMarca(marca: string): [string,string] {
  const palavras=marca.replace(/-/g,' ').trim().split(/\s+/);const corte=Math.ceil(palavras.length/2)
  return [palavras.slice(0,corte).join(' '),palavras.slice(corte).join(' ')]
}
