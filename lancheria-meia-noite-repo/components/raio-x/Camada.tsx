// Uma instância de camada na pilha, e a chamada que sai dela para a coluna da esquerda.
//
// Os dois são irmãos no DOM, não pai e filho: a chamada precisa ficar acima de todas as
// camadas (z-index 26–28 contra 10+i), e aninhá-la dentro do embrulho da camada colaria
// as duas no mesmo empilhamento.

import type { CSSProperties } from 'react'
import { type Camada as DadosCamada, urlCamada } from '@/data/camadas'
import { ASSENTA_Y, ESPALHA_X, ESPALHA_Y, expostoPx, type Forma, type Geometria } from './prensa'
import { caixaX0, DESLOCAMENTO_PX, OPACIDADE, sombraDe } from './sombra'

export type EstadoPilha = {
  comprimido: boolean
  selando: boolean
  selado: boolean
  marca: boolean
  forma: Forma
}

type Props = {
  camada: DadosCamada
  uid: number
  /** Quantas instâncias deste slug já vieram antes, mais um. Vira o `n` do id. */
  n: number
  indice: number
  slugs: string[]
  g: Geometria
  estado: EstadoPilha
  transicao: string
}

/** Onde o topo do objeto cai na tela. O arquivo é 2000×1200 com o objeto centralizado. */
function medidas(camada: DadosCamada, indice: number, g: Geometria) {
  const wTop = g.tops[indice] - g.minTop
  return {
    /** Topo do embrulho: recua meio quadro para o objeto pousar em `topoObjeto`. */
    topoEmbrulho: g.offsetY + (wTop - (600 - camada.alturaPx / 2)) * g.k,
    topoObjeto: g.offsetY + wTop * g.k,
    baseObjeto: g.offsetY + (wTop + camada.alturaPx) * g.k,
  }
}

export function Camada({ camada, uid, n, indice, slugs, g, estado, transicao }: Props) {
  const { comprimido, selando, selado, marca, forma } = estado
  const { topoEmbrulho, baseObjeto } = medidas(camada, indice, g)
  const parado = comprimido || selando || selado

  const estilo: CSSProperties = {
    position: 'absolute',
    left: g.x0,
    width: g.larguraPilha,
    top: topoEmbrulho,
    height: 1200 * g.k,
    zIndex: 10 + indice,
    cursor: 'grab',
    touchAction: 'none',
    transformOrigin: '50% 50%',
    transition: `${transicao}, opacity 200ms linear`,
  }
  // A pilha explodida respira. Cada camada fora de fase das outras, senão vira acordeão.
  if (!parado) estilo.animation = `rx-osc ${6.4 + indice * 0.7}s ease-in-out ${-indice * 1.3}s infinite`
  // Prensa: o recheio espalha para os lados. Gravidade: o que é mole só assenta.
  if (g.prensa && !camada.pao) estilo.transform = `scaleX(${ESPALHA_X}) scaleY(${ESPALHA_Y})`
  else if (g.assenta && !camada.pao && !camada.firme) estilo.transform = `scaleY(${ASSENTA_Y})`

  const sombra = comprimido ? sombraDe(camada.slug, g.k) : null
  const arquivo = urlCamada(camada)

  return (
    <div
      id={`rx-camada-${camada.slug}-${n}`}
      data-inst={uid}
      // Os dois números que o QA compara: a camada nunca pode sobrar com menos de 45%
      // de si à vista depois que a de cima afunda nela.
      data-altura-px={camada.alturaPx}
      data-exposto-px={expostoPx(slugs, indice).toFixed(2)}
      style={estilo}
    >
      {sombra && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: sombra.x0Caixa,
            top: baseObjeto - topoEmbrulho - sombra.baseY + DESLOCAMENTO_PX,
            width: sombra.w,
            height: sombra.h,
            opacity: OPACIDADE,
            pointerEvents: 'none',
            background: `center/100% 100% no-repeat url("${sombra.url}")`,
          }}
        />
      )}
      <div
        role="img"
        aria-label={camada.alt}
        draggable={false}
        data-foto-camada
        style={{
          position: 'absolute',
          inset: 0,
          background: `center/contain no-repeat url("${arquivo}")`,
          userSelect: 'none',
        }}
      />
      {forma === 'prensado' && camada.pao && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            mixBlendMode: 'multiply',
            opacity: marca ? 0.27 : 0.12,
            transition: 'opacity 200ms linear',
            background:
              'repeating-linear-gradient(97deg, rgba(169,118,47,0) 0 24px, rgba(169,118,47,0.92) 24px 36px, rgba(169,118,47,0) 36px 58px)',
            WebkitMaskImage: `url("${arquivo}")`,
            maskImage: `url("${arquivo}")`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
        />
      )}
    </div>
  )
}

/**
 * A chamada: rótulo numa coluna fixa à esquerda, e um fio até a aresta esquerda daquele
 * ingrediente. O rótulo alinha; o fio, não — ele mede a largura real da camada, que já
 * vem embutida no arquivo. Só o nome, em Archivo. Nenhum número aqui.
 */
export function Chamada({
  camada,
  n,
  indice,
  g,
}: Pick<Props, 'camada' | 'n' | 'indice' | 'g'>) {
  const { topoObjeto } = medidas(camada, indice, g)
  const pontoX = g.x0 + caixaX0(camada.slug) * g.k

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: g.colW + 6,
          width: Math.max(0, pontoX - g.colW - 6),
          top: topoObjeto,
          height: 1,
          background: 'var(--letreiro)',
          opacity: 0.6,
          pointerEvents: 'none',
          zIndex: 26,
          transition: 'top 300ms linear, width 300ms linear',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: pontoX - 1.5,
          top: topoObjeto - 1.5,
          width: 3,
          height: 3,
          background: 'var(--letreiro)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 27,
          transition: 'top 300ms linear, left 300ms linear',
        }}
      />
      <button
        id={`rx-chamada-${camada.slug}-${n}`}
        type="button"
        data-chamada={indice}
        aria-label={`${camada.nome}. Setas para cima e para baixo movem, Delete tira.`}
        style={{
          position: 'absolute',
          left: 0,
          width: g.colW,
          top: topoObjeto - 11,
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          padding: 0,
          background: 'none',
          border: 0,
          cursor: 'grab',
          textAlign: 'left',
          zIndex: 28,
          touchAction: 'none',
          transition: 'top 300ms linear',
        }}
      >
        <span
          style={{
            fontVariationSettings: "'wdth' 92, 'wght' 500",
            fontSize: '0.8125rem',
            color: 'var(--osso)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {camada.nome}
        </span>
      </button>
    </>
  )
}
