// O medidor. Três leituras, todas derivadas de graça da composição — nenhuma pede ao dono
// da lancheria um número que ele não tem.
//
// No celular ele é FAIXA HORIZONTAL entre a pilha e o trilho: preço à esquerda, contagem à
// direita, barra ocupando a largura toda embaixo dos dois. A barra fica melhor deitada do
// que em pé — ela é uma régua, não um termômetro. Acima de 900px a mesma faixa vira coluna
// à direita; quem troca é o CSS (app/globals.css), não este arquivo.
//
// Regra de temperatura: a contagem e a barra são medição, logo frias (--letreiro). O preço
// é comida, logo quente (--latao). A única mistura autorizada é a barra em aviso, que vira
// --latao porque ali o calor é alarme.
//
// Plex Mono vive aqui e nos preços. Em qualquer outro lugar é erro.

import type { CSSProperties, Ref } from 'react'
import { LIMIAR_AVISO_CAMADAS } from '@/data/casa'
import { brl } from '@/lib/precos'

const mono: CSSProperties = {
  fontFamily: 'var(--fonte-medida), ui-monospace, monospace',
  fontWeight: 500,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1,
}

const miudo: CSSProperties = {
  fontVariationSettings: "'wdth' 92, 'wght' 500",
  fontSize: '0.75rem',
  lineHeight: 1.35,
  color: 'var(--osso)',
}

type Props = {
  precoCent: number
  camadas: number
  /** Altura da pilha renderizada, em por cento do fundo de escala. Sem unidade. */
  pct: number
  aviso: boolean
  recado: string
  transicaoBarra: string
  onVerComposicao: () => void
  /** Mede a faixa de aviso/recado: no celular ela flutua sobre o painel e a altura
   * disponível da pilha precisa descontá-la. Ver `RaioX.tsx`. */
  flutuaRef?: Ref<HTMLDivElement>
}

export default function Medidor({
  precoCent,
  camadas,
  pct,
  aviso,
  recado,
  transicaoBarra,
  onVerComposicao,
  flutuaRef,
}: Props) {
  const contagem = camadas === 0 ? 'painel vazio' : camadas === 1 ? '1 camada' : `${camadas} camadas`

  return (
    <div id="rx-medidor">
      <div id="rx-medidor-linha">
        <span
          id="rx-preco-valor"
          data-preco
          style={{ ...mono, fontSize: '1.75rem', letterSpacing: '-0.02em', color: 'var(--latao)' }}
        >
          {brl(precoCent)}
        </span>

        {/* A contagem é o próprio botão da composição: em 390px não há largura para um
            botão separado, e não faz sentido dizer "9 camadas" sem deixar ver quais. */}
        <button
          id="rx-ver-composicao"
          type="button"
          disabled={camadas === 0}
          onClick={onVerComposicao}
          style={{
            display: 'grid',
            gap: 3,
            justifyItems: 'end',
            padding: 0,
            background: 'none',
            border: 0,
            cursor: camadas === 0 ? 'default' : 'pointer',
            textAlign: 'right',
            opacity: camadas === 0 ? 0.45 : 1,
          }}
        >
          <span
            id="rx-camadas-valor"
            data-medida
            style={{ ...mono, fontSize: '1.125rem', color: 'var(--letreiro)' }}
          >
            {contagem}
          </span>
          <span style={{ ...miudo, fontSize: '0.6875rem', opacity: 0.6 }}>ver composição</span>
        </button>
      </div>

      {/* Barra de altura: mede a pilha renderizada em pixels. Sem número e sem unidade —
          não existe alturaCm, e estimativa errada é pior que nada. */}
      <div
        id="rx-medida"
        data-medida
        role="img"
        aria-label={`Altura da pilha: ${Math.round(pct)} por cento do medidor`}
        style={{
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

      <div id="rx-flutua" ref={flutuaRef}>
        <span
          id="rx-aviso"
          data-aviso={aviso ? '' : undefined}
          style={{ ...miudo, color: aviso ? 'var(--latao)' : 'var(--osso)', opacity: aviso ? 1 : 0.5 }}
        >
          {aviso
            ? 'Risco de desmontar. Segue por sua conta.'
            : `até ${LIMIAR_AVISO_CAMADAS} camadas a pilha para em pé`}
        </span>

        <p id="rx-recado" aria-live="polite" style={{ ...miudo, margin: 0, fontSize: '0.8125rem', opacity: 0.78 }}>
          {recado}
        </p>

        <p id="rx-ajuda" style={{ ...miudo, margin: 0, lineHeight: 1.5, opacity: 0.5 }}>
          Toque para adicionar. Arraste para reordenar, ou para fora para tirar. No teclado:
          setas movem, Delete tira.
        </p>
      </div>
    </div>
  )
}

/**
 * O botão de fechar o lanche. Sai do medidor porque no celular ele é largura cheia na base,
 * abaixo do trilho, e no desktop volta para debaixo da coluna do medidor — dois lugares
 * diferentes na grade do raio-x, logo dois filhos diretos dela. Ver `#rx-selar` no CSS.
 */
export function BotaoSelar({
  podeFechar,
  texto,
  onSelar,
}: {
  podeFechar: boolean
  texto: string
  onSelar: () => void
}) {
  return (
    <button
      id="rx-selar"
      type="button"
      disabled={!podeFechar}
      onClick={onSelar}
      style={{
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
      {texto}
    </button>
  )
}
