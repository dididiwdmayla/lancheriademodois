import { useNegocio } from '@/components/NegocioAtivo'
// A composição em texto: a lista inteira do lanche, fora do desenho.
//
// Existe porque em 390px o rótulo não cabe ao lado da camada — a arte do pão prensado
// ocupa a largura toda e sobram ~90px, onde "batata palha" não entra. A chamada no desenho
// mostra uma camada de cada vez; aqui cabe a leitura completa, de cima para baixo, na mesma
// ordem em que a pilha é vista.
//
// É também a garantia de alvo de 44px para TODA camada: a faixa de uma camada fina na
// pilha tem uns 25px em 390px, e nenhuma conta de layout conserta isso. Aqui cada linha
// tem 44px e um controle de tirar do mesmo tamanho — e funciona por toque, teclado e
// leitor de tela, sem arrastar nada.


import { brl } from '@/lib/precos'
import { TOQUE_MIN } from './Camada'
import type { Instancia } from './RaioX'

type Props = {
  /** A pilha, da base para o topo — a mesma ordem do estado. */
  pilha: Instancia[]
  fixa: (slug: string) => boolean
  onTirar: (indice: number) => void
  onMover: (indice: number, delta: number) => number
  onFechar: () => void
}

export default function Composicao({ pilha, fixa, onTirar, onMover, onFechar }: Props) {
  const { MAPA_CAMADAS } = useNegocio()
  // De cima para baixo: é assim que a pilha é vista, e o pão de cima é o primeiro nome
  // que a pessoa procura.
  const linhas = pilha.map((inst, indice) => ({ inst, indice })).reverse()

  return (
    <div id="rx-composicao" role="group" aria-label="Composição do lanche">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '6px 6px 6px clamp(12px, 4vw, 20px)',
          borderBottom: '1px solid var(--traco)',
        }}
      >
        <span style={{ fontVariationSettings: "'wdth' 92, 'wght' 600", fontSize: '0.875rem' }}>
          Composição
        </span>
        <button
          id="rx-fechar-composicao"
          type="button"
          onClick={onFechar}
          aria-label="Fechar a composição"
          style={{
            width: TOQUE_MIN,
            minHeight: TOQUE_MIN,
            padding: 0,
            background: 'none',
            border: 0,
            color: 'var(--osso)',
            fontSize: '1.125rem',
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>

      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
        }}
      >
        {linhas.map(({ inst, indice }) => {
          const c = MAPA_CAMADAS[inst.slug]
          return (
            <li
              key={inst.uid}
              className="composicao-linha"
              data-slug={inst.slug}
              data-fixa={fixa(inst.slug) ? '' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minHeight: TOQUE_MIN,
                padding: '0 6px 0 clamp(12px, 4vw, 20px)',
                borderBottom: '1px solid var(--traco)',
              }}
            >
              <span
                style={{
                  flex: '1 1 auto',
                  fontVariationSettings: "'wdth' 92, 'wght' 500",
                  fontSize: '0.9375rem',
                  color: 'var(--osso)',
                }}
              >
                {c.nome}
              </span>
              <span
                data-preco
                style={{
                  fontFamily: 'var(--fonte-medida)',
                  fontWeight: 500,
                  fontVariantNumeric: 'var(--numerais)',
                  fontSize: '0.8125rem',
                  color: 'var(--latao)',
                  opacity: c.precoCent ? 1 : 0.4,
                }}
              >
                {c.precoCent ? brl(c.precoCent) : '—'}
              </span>
              {!c.obrigatorio && <div className="composicao-mover">
                <button type="button" className="botao-texto" data-mover-cima={indice} aria-label={`Subir ${c.nome.toLowerCase()}`} disabled={indice >= pilha.length - 2} onClick={() => onMover(indice, 1)}>↑</button>
                <button type="button" className="botao-texto" data-mover-baixo={indice} aria-label={`Descer ${c.nome.toLowerCase()}`} disabled={indice <= 1} onClick={() => onMover(indice, -1)}>↓</button>
              </div>}
              {fixa(inst.slug) ? (
                <span
                  style={{
                    width: TOQUE_MIN,
                    textAlign: 'center',
                    fontVariationSettings: "'wdth' 92, 'wght' 500",
                    fontSize: '0.6875rem',
                    color: 'var(--osso)',
                    opacity: 0.4,
                  }}
                >
                  fixa
                </span>
              ) : (
                <button
                  type="button"
                  data-tirar={indice}
                  onClick={() => onTirar(indice)}
                  aria-label={`Tirar ${c.nome.toLowerCase()}`}
                  style={{
                    width: TOQUE_MIN,
                    minHeight: TOQUE_MIN,
                    flex: '0 0 auto',
                    padding: 0,
                    background: 'none',
                    border: 0,
                    color: 'var(--osso)',
                    fontSize: '1.125rem',
                    lineHeight: 1,
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <p
        style={{
          margin: 0,
          padding: '8px clamp(12px, 4vw, 20px)',
          fontVariationSettings: "'wdth' 92, 'wght' 500",
          fontSize: '0.75rem',
          lineHeight: 1.5,
          color: 'var(--osso)',
          opacity: 0.5,
        }}
      >
        Toque no trilho para pôr. Toque numa camada da pilha para ver o nome dela. No
        teclado: setas movem, Delete tira. Os botões ↑ e ↓ também mudam a ordem.
      </p>
    </div>
  )
}
