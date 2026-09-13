'use client'
import { useMemo, useSyncExternalStore } from 'react'
import { useNegocio } from '@/components/NegocioAtivo'
import { horarioDaCasa } from './horario'
// Compartilha só o instante. Cada provider calcula o estado da própria casa.
let atual:number|null=null
const ouvintes=new Set<()=>void>()
let timer:ReturnType<typeof setTimeout>|undefined
const ler=()=>{atual=Date.now();ouvintes.forEach(fn=>fn())}
const tick=()=>{ler();timer=setTimeout(tick,60000-Date.now()%60000)}
const aoVoltar=()=>{if(!document.hidden)ler()}
function assinar(fn:()=>void) {
  ouvintes.add(fn)
  if(ouvintes.size===1){tick();document.addEventListener('visibilitychange',aoVoltar)}
  return ()=>{ouvintes.delete(fn);if(!ouvintes.size){clearTimeout(timer);document.removeEventListener('visibilitychange',aoVoltar)}}
}
const noServidor=()=>null
export function useHorarioDaCasa() {
  const {CASA}=useNegocio()
  const instante=useSyncExternalStore(assinar,()=>atual,noServidor)
  return useMemo(()=>instante===null?null:horarioDaCasa(new Date(instante),CASA),[instante,CASA])
}
