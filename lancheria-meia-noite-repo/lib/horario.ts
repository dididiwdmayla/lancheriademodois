import { CASA } from '@/data/casa'

export function horarioDaCasa(agora = new Date()) {
  const partes = new Intl.DateTimeFormat('pt-BR', { timeZone: CASA.fuso, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(agora)
  const hora = Number(partes.find(p => p.type === 'hour')?.value)
  const minuto = Number(partes.find(p => p.type === 'minute')?.value)
  const m = hora * 60 + minuto
  const aberto = m >= CASA.abre * 60 || m <= CASA.fecha * 60
  const ultimos = aberto && m >= CASA.fecha * 60 - 30 && m <= CASA.fecha * 60
  return { aberto, ultimos, texto: !aberto ? 'Fechada. Abre hoje às 18h.' : ultimos ? 'Aberto. Últimos pedidos.' : 'Aberto. A chapa vai até as 4h.' }
}
