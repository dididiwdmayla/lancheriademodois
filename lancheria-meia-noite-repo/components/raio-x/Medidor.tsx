// O medidor. Três leituras, todas derivadas de graça da composição — nenhuma pede ao dono
// da lancheria um número que ele não tem.
//
// Regra de temperatura: a contagem e a barra são medição, logo frias (--letreiro). O preço
// é comida, logo quente (--latao). A única mistura autorizada é a barra em aviso, que vira
// --latao porque ali o calor é alarme.
//
// Plex Mono vive aqui e nos preços. Em qualquer outro lugar é erro.

import type { CSSProperties } from 'react'
import { LIMIAR_AVISO_CAMADAS } from '@/data/casa'
import { brl } from '@/lib/precos'

const rotulo: CSSProperties = {
  fontVariationSettings: "'wdth' 92, 'wght' 500",
  fontSize: '0.8125rem',
  color: 'var(--osso)',
  opacity: 0.6,
}

const mono: CSSProperties = {
  fontFamily: 'var(--fonte-medida), ui-monospace, monospace',
  fontWeight: 500,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1,
}

type Props = {
  precoCent: number
  camadas: number
  /** Altura da pilha renderizada, em por cento do fundo de escala. Sem unidade. */
  pct: number
  aviso: boolean
  podeFechar: boolean
  textoSelar: string
  recado: string
  transicaoBarra: string
  onSelar: () => void
}

export default function Medidor({
  precoCent,
  camadas,
  pct,
  aviso,
  podeFechar,
  textoSelar,
  recado,
  transicaoBarra,
  onSelar,
}: Props) {
  const contagem = camadas === 0 ? 'painel vazio' : camadas === 1 ? '1 camada' : `${camadas} camadas`

  return (
    <div
      id="rx-medidor"
      style={{
        position: 'relative',
        zIndex: 2,
        flex: '0 1 288px',
        minWidth: 244,
        minHeight: 0,
        maxHeight: '100%',
        borderLeft: '1px solid var(--traco)',
        padding: 'clamp(16px, 2.2vw, 28px)',
        display: 'grid',
        gap: 20,
        alignContent: 'start',
        background: 'rgba(18,13,11,0.92)',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'grid', gap: 6 }}>
        <span style={rotulo}>preço</span>
        <span
          id="rx-preco-valor"
          data-preco
          style={{ ...mono, fontSize: '2.5rem', letterSpacing: '-0.02em', color: 'var(--latao)' }}
        >
          {brl(precoCent)}
        </span>
      </div>

      <div style={{ display: 'grid', gap: 6, borderTop: '1px solid var(--traco)', paddingTop: 18 }}>
        <span style={rotulo}>montagem</span>
        <span
          id="rx-camadas-valor"
          data-medida
          style={{ ...mono, fontSize: '1.5rem', color: 'var(--letreiro)' }}
        >
          {contagem}
        </span>
        {/* Barra de altura: mede a pilha renderizada em pixels. Sem número e sem unidade —
            não existe alturaCm, e estimativa errada é pior que nada. */}
        <div
          id="rx-medida"
          data-medida
          role="img"
          aria-label={`Altura da pilha: ${Math.round(pct)} por cento do medidor`}
          style={{
            marginTop: 8,
            height: 8,
            background: 'var(--borra)',
            border: '1px solid var(--traco)',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct.toFixed(1)}%`,
              height: '100%',
              background: aviso ? 'var(--latao)' : 'var(--letreiro)',
              transition: `width ${transicaoBarra}, background-color 200ms linear`,
            }}
          />
        </div>
        <span
          style={{
            fontVariationSettings: "'wdth' 92, 'wght' 500",
            fontSize: '0.8125rem',
            lineHeight: 1.4,
            color: aviso ? 'var(--latao)' : 'var(--osso)',
            opacity: aviso ? 1 : 0.5,
          }}
        >
          {aviso
            ? 'Risco de desmontar. Segue por sua conta.'
            : `até ${LIMIAR_AVISO_CAMADAS} camadas a pilha para em pé`}
        </span>
      </div>

      <button
        id="rx-selar"
        type="button"
        disabled={!podeFechar}
        onClick={onSelar}
        style={{
          marginTop: 2,
          padding: '14px 20px',
          background: podeFechar ? 'var(--latao)' : 'var(--fumo)',
          color: podeFechar ? 'var(--borra)' : 'var(--osso)',
          border: `1px solid ${podeFechar ? 'var(--latao)' : 'var(--traco)'}`,
          borderRadius: 2,
          fontFamily: 'var(--fonte-corpo), sans-serif',
          fontSize: '1rem',
          fontVariationSettings: "'wght' 600",
          cursor: podeFechar ? 'pointer' : 'default',
          opacity: podeFechar ? 1 : 0.45,
        }}
      >
        {textoSelar}
      </button>

      <p
        aria-live="polite"
        style={{
          margin: 0,
          minHeight: '2.6em',
          fontVariationSettings: "'wdth' 92, 'wght' 500",
          fontSize: '0.875rem',
          lineHeight: 1.45,
          color: 'var(--osso)',
          opacity: 0.72,
        }}
      >
        {recado}
      </p>
      <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.5, color: 'var(--osso)', opacity: 0.5 }}>
        Toque para adicionar. Arraste para reordenar, ou para fora para tirar. No teclado:
        setas movem, Delete tira.
      </p>
    </div>
  )
}
