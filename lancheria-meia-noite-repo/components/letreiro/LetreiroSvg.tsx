import type { CSSProperties } from 'react'
import { DesenhoMascote } from './Mascote'
import { TREMOR_GRUPOS } from './sequencia'

const tremorPorId = Object.fromEntries(TREMOR_GRUPOS.map((g) => [g.id, g]))

function animacaoTremor(id: (typeof TREMOR_GRUPOS)[number]['id']): CSSProperties {
  const g = tremorPorId[id]
  return { animation: `lt-tremor ${g.duracaoS}s linear infinite`, animationDelay: `${g.atrasoS}s` }
}

// A aresta do acrílico cortado. É o detalhe que separa acrílico de neon a olho nu:
// com o painel aceso em 0.42, um traço de 1px cai abaixo de um pixel de tela no tamanho
// em que o letreiro é visto e chega antisserrilhado a meia tinta — some. 1.5px cobre
// pixel inteiro, e stroke-opacity explícito garante que o traço não herde diluição de
// ninguém: contra o fundo aceso ele precisa chegar em --traco cheio.
const arestaDoCorte: CSSProperties = {
  fill: 'none',
  stroke: '#33251E',
  strokeWidth: 1.5,
  strokeOpacity: 1,
}

const fonteLetreiro: CSSProperties = {
  fontFamily: "var(--fonte-display), Georgia, serif",
  fontSize: '260px',
  fontVariationSettings: "'opsz' 144, 'wght' 900, 'SOFT' 12, 'WONK' 1",
  textAnchor: 'middle',
}

/**
 * O sinal em si. Porte 1:1 do `#lt-svg` do export — caixa de acrílico retroiluminada,
 * não neon: as letras não emitem, transmitem a luz do painel atrás delas.
 * Os seis IDs contratados: lt-caixa, lt-tubo-a, lt-tubo-b, lt-texto, lt-halo, lt-tremor.
 * Os difusores (lt-luz, lt-luz-face, lt-tubo-luz) são gradientes, não filtros SVG.
 *
 * Abaixo da caixa, pendurada nos mesmos dois postes, a TABULETA PINTADA: o mascote e o
 * horário, em tinta. Nenhuma coordenada da caixa mudou — o viewBox cresceu para baixo
 * (800 → 1170), então a caixa continua sendo desenhada exatamente onde era. A tabuleta
 * fica fora de `#lt-tremor` de propósito: ela é pintura, não acrílico aceso, e não pisca
 * junto com o reator.
 */
export default function LetreiroSvg() {
  return (
    <svg
      id="lt-svg"
      viewBox="0 0 1000 1210"
      role="img"
      aria-label="Letreiro da Lancheria Meia-Noite. Na tabuleta pintada: das 18h às 4h."
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <radialGradient id="lt-luz" cx="50%" cy="47%" r="70%">
          <stop offset="0%" stopColor="#A8C6D4" stopOpacity="0.98" />
          <stop offset="55%" stopColor="#A8C6D4" stopOpacity="0.93" />
          <stop offset="100%" stopColor="#A8C6D4" stopOpacity="0.82" />
        </radialGradient>
        <radialGradient
          id="lt-luz-face"
          cx="50%"
          cy="47%"
          r="62%"
          gradientTransform="translate(0.5 0.5) scale(1 0.80) translate(-0.5 -0.5)"
        >
          <stop offset="0%" stopColor="#A8C6D4" stopOpacity="0.90" />
          <stop offset="45%" stopColor="#A8C6D4" stopOpacity="0.54" />
          <stop offset="78%" stopColor="#A8C6D4" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#A8C6D4" stopOpacity="0.02" />
        </radialGradient>
        <linearGradient id="lt-tubo-luz" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A8C6D4" stopOpacity="0" />
          <stop offset="50%" stopColor="#A8C6D4" stopOpacity="1" />
          <stop offset="100%" stopColor="#A8C6D4" stopOpacity="0" />
        </linearGradient>
        <mask id="lt-recorte-acrilico" maskUnits="userSpaceOnUse" x="86" y="66" width="828" height="628">
          <g style={fonteLetreiro}>
            <text x="500" y="360" textLength="660" lengthAdjust="spacingAndGlyphs" fill="#ffffff">
              MEIA
            </text>
            <text x="500" y="620" textLength="660" lengthAdjust="spacingAndGlyphs" fill="#ffffff">
              NOITE
            </text>
          </g>
        </mask>
        <mask id="lt-recorte-bloom" maskUnits="userSpaceOnUse" x="60" y="40" width="880" height="680">
          <g
            transform="translate(500 490) scale(1.015) translate(-500 -490)"
            style={fonteLetreiro}
          >
            <text x="500" y="360" textLength="660" lengthAdjust="spacingAndGlyphs" fill="#575757">
              MEIA
            </text>
            <text x="500" y="620" textLength="660" lengthAdjust="spacingAndGlyphs" fill="#575757">
              NOITE
            </text>
          </g>
        </mask>
        <radialGradient
          id="lt-vinheta"
          cx="50%"
          cy="50%"
          r="58%"
          gradientTransform="translate(0.5 0.5) scale(1 0.78) translate(-0.5 -0.5)"
        >
          <stop offset="0%" stopColor="#120D0B" stopOpacity="0" />
          <stop offset="62%" stopColor="#120D0B" stopOpacity="0" />
          <stop offset="100%" stopColor="#120D0B" stopOpacity="0.92" />
        </radialGradient>
        <clipPath id="lt-recorte-painel">
          <rect x="86" y="66" width="828" height="628" rx="3" />
        </clipPath>
      </defs>
      <g transform="rotate(-0.4 500 400)">
        <g id="lt-caixa">
          <rect x="60" y="40" width="880" height="680" rx="4" fill="#1C1512" stroke="#33251E" strokeWidth="2" />
          <path d="M938 42 L938 718" stroke="#33251E" strokeWidth="5" />
          <rect x="86" y="66" width="828" height="628" rx="3" fill="#120D0B" stroke="#33251E" strokeWidth="1" />
          <path d="M120 720 L120 766 M880 720 L880 766" stroke="#33251E" strokeWidth="2" />
        </g>
        <g id="lt-tabuleta">
          <rect x="60" y="764" width="880" height="430" rx="4" fill="var(--fumo)" stroke="var(--traco)" strokeWidth="2" />
          <rect x="84" y="786" width="832" height="386" rx="2" fill="var(--borra)" stroke="var(--traco)" />
          <DesenhoMascote transform="translate(60 784) scale(2.04)" />
          <g
            fill="var(--osso)"
            textAnchor="middle"
            style={{
              fontFamily: 'var(--fonte-display), Georgia, serif',
              fontSize: '96px',
              fontVariationSettings: "'opsz' 96, 'wght' 820, 'SOFT' 14, 'WONK' 1",
            }}
          >
            <text x="752" y="944" textLength="300" lengthAdjust="spacingAndGlyphs">DAS 18H</text>
            <text x="752" y="1046" textLength="234" lengthAdjust="spacingAndGlyphs">ÀS 4H</text>
          </g>
        </g>
        <g id="lt-tremor" style={animacaoTremor('lt-tremor')}>
          <g
            id="lt-halo"
            clipPath="url(#lt-recorte-painel)"
            aria-hidden="true"
          >
            <rect x="86" y="66" width="828" height="628" fill="url(#lt-luz-face)" style={{ opacity: 0.42 }} />
            <g id="lt-tubo-a" style={animacaoTremor('lt-tubo-a')}>
              <rect x="86" y="112" width="828" height="220" fill="url(#lt-tubo-luz)" style={{ opacity: 0.26 }} />
            </g>
            <g id="lt-tubo-b" style={animacaoTremor('lt-tubo-b')}>
              <rect x="86" y="424" width="828" height="220" fill="url(#lt-tubo-luz)" style={{ opacity: 0.244 }} />
            </g>
            <rect x="86" y="66" width="828" height="628" fill="url(#lt-vinheta)" />
          </g>
          <g aria-hidden="true" style={fonteLetreiro}>
            <text
              x="500"
              y="360"
              textLength="660"
              lengthAdjust="spacingAndGlyphs"
              fill="#171110"
              stroke="#33251E"
              strokeWidth="1.5"
            >
              MEIA
            </text>
            <text
              x="500"
              y="620"
              textLength="660"
              lengthAdjust="spacingAndGlyphs"
              fill="#171110"
              stroke="#33251E"
              strokeWidth="1.5"
            >
              NOITE
            </text>
          </g>
          <g id="lt-texto" style={animacaoTremor('lt-texto')}>
            <g id="lt-letras-acesas">
              <rect
                x="60"
                y="40"
                width="880"
                height="680"
                fill="url(#lt-luz)"
                mask="url(#lt-recorte-bloom)"
                style={{ opacity: 0.15 }}
              />
              <rect x="86" y="66" width="828" height="628" fill="url(#lt-luz)" mask="url(#lt-recorte-acrilico)" />
              <g style={{ ...fonteLetreiro, ...arestaDoCorte }}>
                <text x="500" y="360" textLength="660" lengthAdjust="spacingAndGlyphs">
                  MEIA
                </text>
                <text x="500" y="620" textLength="660" lengthAdjust="spacingAndGlyphs">
                  NOITE
                </text>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}
