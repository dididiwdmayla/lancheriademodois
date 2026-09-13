'use client'

import { useHorarioDaCasa } from '@/lib/useHorario'

/** Uma única leitura compartilhada pela placa e por todos os textos de horário. */
export function PlacaDePorta() {
  const horario = useHorarioDaCasa()
  return <div className="placa-porta" data-placa-porta data-aberto={horario?.aberto}
    role="img" aria-label={horario ? (horario.aberto===null?'Horário não informado':horario.aberto ? 'Aberto' : 'Fechado') : 'Consultando horário da casa'}>
    <div className="placa-fio" aria-hidden="true" />
    {horario && <div className="placa-balanco" aria-hidden="true"><div className="placa-giro">
      <span className="placa-face placa-aberto">{horario.aberto===null?'CONSULTE':'ABERTO'}</span>
      <span className="placa-face placa-fechado">{horario.aberto===null?'CONSULTE':'FECHADO'}</span>
    </div></div>}
  </div>
}

/** Só transform: o tecido desenrola em scaleY sem recalcular o tamanho do hero. */
export function Toldo() {
  return <div className="toldo" data-toldo aria-hidden="true"><div className="toldo-tecido" /></div>
}
