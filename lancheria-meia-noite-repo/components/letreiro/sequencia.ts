// Tabela de tempos do letreiro. Números extraídos do export — não estimados, não altere
// sem confirmar contra /export/lancheria-meia-noite.dc.html.

export const CHAVE_SESSAO = 'lm:letreiro-aceso'

/** Cada grupo do tremor roda fora de fase dos outros — é o que dá o "reator velho". */
export const TREMOR_GRUPOS = [
  { id: 'lt-tremor', duracaoS: 4, atrasoS: -1.2 },
  { id: 'lt-tubo-a', duracaoS: 4.3, atrasoS: -2.6 },
  { id: 'lt-tubo-b', duracaoS: 3.7, atrasoS: -0.4 },
  { id: 'lt-texto', duracaoS: 4.6, atrasoS: -3.1 },
] as const

/** Duração da sequência de ignição (@keyframes lt-ignicao, em app/globals.css). */
export const DURACAO_IGNICAO_MS = 1100
/** Espera depois que a ignição termina, antes de marcar a sessão como acesa. */
export const ATRASO_MARCA_MS = 620
/** Sob prefers-reduced-motion: acende direto, sem sequência, e marca depois deste tempo. */
export const ATRASO_REDUZIDO_MS = 1400
/** Prazo máximo de espera pelas fontes antes de começar de qualquer jeito. */
export const ESPERA_FONTES_MS = 2200
