// Uma instância de camada na pilha, a tira de toque dela e a chamada que sai dela.
//
// Os três são irmãos no DOM, não pai e filho: chamada e tira precisam ficar acima de todas
// as camadas (z-index 26–28 contra 10+i), e aninhá-las dentro do embrulho da camada colaria
// tudo no mesmo empilhamento.
//
// A chamada tem dois modos, e o corte de 900px decide qual. Em `coluna` (desktop) todas
// aparecem ao mesmo tempo, cada uma com seu fio até a aresta do ingrediente — ali sobra
// largura e a leitura simultânea é o ganho. Em `chip` (celular) só a camada tocada mostra
// a dela, sobre o desenho, com o controle de tirar junto: em 390px sobram ~90px de rótulo
// e "batata palha" não cabe. A lista inteira em texto mora na composição, fora do desenho.

import type { CSSProperties } from 'react'
import { type Camada as DadosCamada, urlCamada } from '@/data/camadas'
import { ASSENTA_Y, ESPALHA_Y, expostoPx, type Forma, type Geometria } from './prensa'
import { caixaX0, DESLOCAMENTO_PX, OPACIDADE, sombraDe } from './sombra'

export type EstadoPilha = {
  comprimido: boolean
  selando: boolean
  selado: boolean
  marca: boolean
  forma: Forma
}

/** Alvo de toque mínimo do contrato. Vale para camada, chamada, ficha de trilho e botão. */
export const TOQUE_MIN = 44

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
  if (g.prensa && !camada.pao) estilo.transform = `scaleX(${g.espalhaX}) scaleY(${ESPALHA_Y})`
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
 * A tira de toque de uma camada: um alvo de 44px de altura sobre a faixa que a camada
 * ocupa no desenho. Existe porque o embrulho da camada é o quadro inteiro de 2000×1200 —
 * o de cima cobre o de baixo, e o toque sempre cairia na camada errada.
 *
 * Faixa menor que 44px cresce até 44 e passa a invadir a vizinha; por isso a mais FINA
 * fica por cima (z-index maior quanto menor a faixa). Camada fina é a que some primeiro,
 * e é ela que precisa da preferência. A camada grossa perde alguns pixels nas bordas e
 * continua com folga de sobra no meio.
 *
 * `aria-hidden` e fora da ordem de tabulação de propósito: é afordância de dedo, e o
 * caminho por teclado e leitor de tela é a chamada (no desktop) e a lista de composição
 * (no celular) — não uma terceira cópia do mesmo comando.
 */
export function TiraDeToque({
  indice,
  topo,
  base,
  alturaArea,
}: {
  indice: number
  /** Topo da faixa em px de tela: o topo do objeto desta camada. */
  topo: number
  /** Base da faixa: o topo da camada de baixo, ou a base do objeto na camada do fundo. */
  base: number
  alturaArea: number
}) {
  const faixa = Math.max(0, base - topo)
  const altura = Math.max(TOQUE_MIN, faixa)
  const y = Math.min(
    Math.max(0, alturaArea - altura),
    Math.max(0, topo + (faixa - altura) / 2),
  )

  return (
    <button
      type="button"
      data-toque={indice}
      data-faixa={faixa.toFixed(1)}
      tabIndex={-1}
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: y,
        height: altura,
        padding: 0,
        background: 'none',
        border: 0,
        cursor: 'grab',
        touchAction: 'none',
        pointerEvents: 'auto',
        zIndex: Math.round(Math.max(0, TOQUE_MIN - faixa)),
      }}
    />
  )
}

const nomeDaChamada: CSSProperties = {
  fontVariationSettings: "'wdth' 92, 'wght' 500",
  fontSize: '0.8125rem',
  color: 'var(--osso)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
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
          top: topoObjeto - TOQUE_MIN / 2,
          minHeight: TOQUE_MIN,
          display: 'flex',
          alignItems: 'center',
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
        <span style={nomeDaChamada}>{camada.nome}</span>
      </button>
    </>
  )
}

/**
 * A chamada do celular: a mesma informação, sobre o desenho, só para a camada tocada.
 * O nome à esquerda e o controle de tirar junto — é o único lugar em 390px onde os dois
 * cabem lado a lado. O ponto marca de qual camada ela saiu; fio não há, porque não há
 * coluna para onde levar.
 */
export function ChamadaChip({
  camada,
  n,
  indice,
  g,
  alturaArea,
  onTirar,
}: Pick<Props, 'camada' | 'n' | 'indice' | 'g'> & {
  alturaArea: number
  onTirar: (indice: number) => void
}) {
  const { topoObjeto } = medidas(camada, indice, g)
  const pontoX = g.x0 + caixaX0(camada.slug) * g.k
  const y = Math.min(Math.max(0, alturaArea - TOQUE_MIN), Math.max(0, topoObjeto - TOQUE_MIN / 2))

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: pontoX - 2,
          top: topoObjeto - 2,
          width: 5,
          height: 5,
          background: 'var(--letreiro)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 27,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 6,
          top: y,
          maxWidth: 'calc(100% - 12px)',
          display: 'flex',
          alignItems: 'stretch',
          background: 'var(--fumo)',
          border: '1px solid var(--traco)',
          borderRadius: 2,
          zIndex: 28,
        }}
      >
        <button
          id={`rx-chamada-${camada.slug}-${n}`}
          type="button"
          data-chamada={indice}
          aria-label={`${camada.nome}. Setas para cima e para baixo movem, Delete tira.`}
          style={{
            display: 'flex',
            alignItems: 'center',
            minHeight: TOQUE_MIN,
            minWidth: TOQUE_MIN,
            padding: '0 12px',
            background: 'none',
            border: 0,
            cursor: 'grab',
            textAlign: 'left',
            touchAction: 'none',
          }}
        >
          <span style={nomeDaChamada}>{camada.nome}</span>
        </button>
        {!camada.obrigatorio && (
          <button
            type="button"
            data-tirar={indice}
            aria-label={`Tirar ${camada.nome.toLowerCase()}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onTirar(indice)}
            style={{
              width: TOQUE_MIN,
              minHeight: TOQUE_MIN,
              flex: '0 0 auto',
              padding: 0,
              background: 'none',
              border: 0,
              borderLeft: '1px solid var(--traco)',
              color: 'var(--osso)',
              fontSize: '1.125rem',
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        )}
      </div>
    </>
  )
}
