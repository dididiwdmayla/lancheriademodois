import { DADOS_EXEMPLO, type Casa } from '@/data/negocio'
const minutos=(hora:string)=>{const [h,m]=hora.split(':').map(Number);return h*60+m}
export const horaLegivel=(hora:string)=>{const [h,m]=hora.split(':');return `${Number(h)}h${m==='00'?'':m}`}
export const faixaHorario=(casa:Casa)=>casa.horarioConfirmado===false?(casa.horarioTexto||'Horário não informado.'):`Todos os dias, das ${horaLegivel(casa.abre)} às ${horaLegivel(casa.fecha)}.`
export function horarioDaCasa(agora=new Date(),casa:Casa=DADOS_EXEMPLO.casa) {
  if(casa.horarioConfirmado===false)return {aberto:null,ultimos:false,texto:faixaHorario(casa)}
  const partes=new Intl.DateTimeFormat('pt-BR',{timeZone:casa.fuso,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(agora)
  const m=Number(partes.find(p=>p.type==='hour')?.value)*60+Number(partes.find(p=>p.type==='minute')?.value)
  const abre=minutos(casa.abre),fecha=minutos(casa.fecha)
  const aberto=abre===fecha || (abre>fecha ? m>=abre || m<=fecha : m>=abre && m<=fecha)
  const ultimos=aberto && (fecha-m+1440)%1440<=30
  return {aberto,ultimos,texto:!aberto?`Fechada. Abre ${abre<fecha && m>fecha?'amanhã':'hoje'} às ${horaLegivel(casa.abre)}.`:ultimos?'Aberto. Últimos pedidos.':`Aberto. A chapa vai até as ${horaLegivel(casa.fecha)}.`}
}
