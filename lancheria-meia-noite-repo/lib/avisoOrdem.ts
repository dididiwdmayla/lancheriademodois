export const CHAVE_AVISO_ORDEM = 'lm:ordem-desenho-v1'
export const TEXTO_AVISO_ORDEM = 'A ordem é só do desenho. Na chapa, o lanche é montado do jeito da casa.'
export const AVISO_ORDEM_MS = 7000
let mostradoNestaPagina = false

/** Chamar somente depois de uma reordenação válida; compartilhado entre os temas. */
export function consumirAvisoOrdem(): boolean {
  if (mostradoNestaPagina) return false
  mostradoNestaPagina = true
  try {
    if (sessionStorage.getItem(CHAVE_AVISO_ORDEM)) return false
    sessionStorage.setItem(CHAVE_AVISO_ORDEM, '1')
  } catch { /* Storage indisponível: ainda não repete ao reabrir o editor nesta página. */ }
  return true
}
