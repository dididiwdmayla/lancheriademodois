// O trilho de ingredientes disponíveis. Pães não entram: eles são obrigatórios e ficam
// travados nas extremidades.
//
// Todo gesto tem equivalente sem arrasto. Tocar na ficha adiciona; arrastar para o painel
// também. Isso é requisito de teclado e leitor de tela, não concessão a mobile — e por
// isso a ficha é um <button>, não uma <div> com listener.
//
// No celular a ficha é 56px de foto e mais nada: nome e preço não cabem embaixo de 56px
// sem quebrar palavra, e cortar é a regra. O nome continua no `aria-label`, o preço aparece
// no medidor no instante em que a camada entra, e a chamada da camada nova se revela
// sozinha — é ela que diz, por escrito, o que acabou de ser posto. Acima de 900px a ficha
// volta a ser a de sempre, com nome e preço. Quem troca é o CSS (app/globals.css).

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
    <div id="rx-trilho" role="group" aria-label="Ingredientes disponíveis">
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
            aria-label={`${c.nome}, ${ausente ? 'em falta' : brl(c.precoCent)}${n ? `, ${n} na pilha` : ''}`}
            onClick={() => onAdicionar(c.slug)}
            onPointerDown={(e) => onArrastar(e, c.slug)}
            style={{
              display: 'grid',
              gap: 2,
              justifyItems: 'start',
              alignContent: 'start',
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
              data-ficha-foto
              aria-hidden="true"
              style={{
                background: ausente ? 'none' : `center/contain no-repeat url("${urlCamada(c)}")`,
              }}
            />
            <span data-ficha-texto aria-hidden="true">
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
                  fontSize: '0.75rem',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--osso)',
                  opacity: 0.55,
                }}
              >
                {brl(c.precoCent)}
              </span>
            </span>
            {/* A contagem é medição: fria, e no celular ela sobe para cima da foto, que é
                o único lugar que sobra. Ficha em falta diz isso no lugar do número. */}
            {(ausente || n > 0) && (
              <span
                data-ficha-conta
                aria-hidden="true"
                style={{
                  fontVariationSettings: "'wght' 500",
                  fontSize: '0.75rem',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--letreiro)',
                }}
              >
                {ausente ? 'em falta' : `${n}×`}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
