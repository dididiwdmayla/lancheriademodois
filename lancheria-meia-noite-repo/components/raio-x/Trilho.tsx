// O trilho de ingredientes disponíveis. Pães não entram: eles são obrigatórios e ficam
// travados nas extremidades.
//
// Todo gesto tem equivalente sem arrasto. Tocar na ficha adiciona; arrastar para o painel
// também. Isso é requisito de teclado e leitor de tela, não concessão a mobile — e por
// isso a ficha é um <button>, não uma <div> com listener.
//
// No celular a ficha é a foto de 56px e o nome numa linha só, com reticências — "preço"
// não cabe e aparece no medidor no instante em que a camada entra, e a chamada da camada
// nova se revela sozinha. Acima de 900px a ficha volta a ser a de sempre, com nome e preço
// completos. Quem troca é o CSS (app/globals.css).
//
// `folha`: o mesmo trilho, mas desenhado como a folha que se abre por cima do painel no
// modo editor (ver `RaioX.tsx`) — sobra altura ali, então a ficha ganha o nome inteiro e o
// preço, sem reticências, mesmo abaixo de 900px. A tira recolhida do modo montador não
// muda: `folha` fica de fora dela de propósito.
//
// A foto vem de /fichas/, não de /camadas/: é um recorte 256×256 no ponto de maior
// estrutura da camada, feito para ler a 56px. As camadas inteiras (2000×1200) encolhidas
// a esse tamanho perdiam a silhueta e sobrava só a cor média — ver AGENTS.md.

import type { PointerEvent as ReactPointerEvent } from 'react'
import { CAMADAS } from '@/data/camadas'
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
  /** Desenha como a folha do modo editor: ficha maior, rótulo inteiro. Ver o comentário
   * no topo do arquivo. */
  folha?: boolean
}

export default function Trilho({
  contarSlug,
  ausentes,
  bloqueado,
  cheio,
  onAdicionar,
  onArrastar,
  folha,
}: Props) {
  return (
    <div id="rx-trilho" data-folha={folha ? '' : undefined} role="group" aria-label="Ingredientes disponíveis">
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
            onPointerDown={(e) => { if (!folha || e.pointerType === 'mouse') onArrastar(e, c.slug) }}
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
              touchAction: folha ? 'pan-y' : 'none',
              opacity: off ? 0.34 : 1,
            }}
          >
            <span
              data-ficha-foto
              aria-hidden="true"
              style={{
                background: ausente ? 'none' : `center/contain no-repeat url("${c.ficha}")`,
              }}
            />
            {/* Só no celular: nome numa linha, sem preço — o recorte já é legível e o
                preço aparece no medidor assim que a camada entra. Some acima de 900px,
                onde `data-ficha-texto` volta com nome e preço completos. */}
            <span
              data-ficha-nome
              aria-hidden="true"
              style={{
                fontVariationSettings: "'wdth' 92, 'wght' 500",
                fontSize: '0.6875rem',
                lineHeight: 1,
                color: 'var(--osso)',
                width: '100%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {c.nome}
            </span>
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
                data-preco
                style={{
                  fontSize: '0.75rem',
                  fontVariantNumeric: 'var(--numerais)',
                  color: 'var(--latao)',
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
                  fontVariantNumeric: 'var(--numerais)',
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
