// O trilho de ingredientes disponíveis. Pães não entram: eles são obrigatórios e ficam
// travados nas extremidades.
//
// Todo gesto tem equivalente sem arrasto. Tocar na ficha adiciona; arrastar para o painel
// também. Isso é requisito de teclado e leitor de tela, não concessão a mobile — e por
// isso a ficha é um <button>, não uma <div> com listener.

import type { PointerEvent as ReactPointerEvent } from 'react'
import { CAMADAS, urlCamada } from '@/data/camadas'
import { MAX_REPETICOES } from '@/data/casa'
import { brl } from '@/lib/precos'

/** Os quinze recheios, na ordem em que empilham. Derivado dos dados, não uma lista à mão. */
export const RECHEIOS = CAMADAS.filter((c) => !c.pao).sort((a, b) => a.ordem - b.ordem)

type Props = {
  contarSlug: (slug: string) => number
  ausentes: Record<string, boolean>
  bloqueado: boolean
  cheio: boolean
  onAdicionar: (slug: string) => void
  onArrastar: (e: ReactPointerEvent<HTMLElement>, slug: string) => void
}

export default function Trilho({
  contarSlug,
  ausentes,
  bloqueado,
  cheio,
  onAdicionar,
  onArrastar,
}: Props) {
  return (
    <div
      id="rx-trilho"
      role="group"
      aria-label="Ingredientes disponíveis"
      style={{
        display: 'flex',
        borderTop: '1px solid var(--traco)',
        padding: '14px clamp(12px, 2vw, 20px)',
        gap: 10,
        overflowX: 'auto',
        background: 'rgba(28,21,18,0.85)',
        touchAction: 'pan-x',
      }}
    >
      {RECHEIOS.map((c) => {
        const n = contarSlug(c.slug)
        const ausente = !!ausentes[c.slug]
        const off = bloqueado || ausente || cheio || n >= MAX_REPETICOES
        return (
          <button
            key={c.slug}
            type="button"
            data-slug={c.slug}
            disabled={off}
            onClick={() => onAdicionar(c.slug)}
            onPointerDown={(e) => onArrastar(e, c.slug)}
            style={{
              flex: '0 0 auto',
              display: 'grid',
              gap: 2,
              justifyItems: 'start',
              width: 128,
              padding: 9,
              background: 'var(--fumo)',
              border: '1px solid var(--traco)',
              borderRadius: 2,
              cursor: off ? 'default' : 'pointer',
              textAlign: 'left',
              touchAction: 'none',
              opacity: off ? 0.34 : 1,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: '100%',
                height: 36,
                background: ausente ? 'none' : `center/contain no-repeat url("${urlCamada(c)}")`,
              }}
            />
            <span
              style={{
                display: 'flex',
                width: '100%',
                gap: 8,
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontVariationSettings: "'wdth' 92, 'wght' 500",
                  fontSize: '0.8125rem',
                  color: 'var(--osso)',
                }}
              >
                {c.nome}
              </span>
              <span
                style={{
                  fontVariationSettings: "'wght' 500",
                  fontSize: '0.75rem',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--letreiro)',
                }}
              >
                {ausente ? 'em falta' : n ? `${n}×` : ''}
              </span>
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--osso)',
                opacity: 0.55,
              }}
            >
              {brl(c.precoCent)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
