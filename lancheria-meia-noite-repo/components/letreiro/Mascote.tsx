'use client'

// O mascote: um hambúrguer PINTADO NO LETREIRO.
//
// Não é um personagem flutuando pela tela. Lancheria de esquina tem mascote pintado na
// fachada — ele é parte do mundo, não um enfeite por cima dele. Por isso o desenho é
// pintura de letreiro: traço chapado, quatro pigmentos, aresta torta de pincel. Nada de
// sombra 3D, brilho, contorno de adesivo ou qualquer filtro SVG.
//
// Temperatura: ele é COMIDA, então é pintado em --latao, --osso e --traco. Nenhum
// --letreiro encosta nele. A luz fria é da placa; o mascote é pigmento sobre a placa.
//
// Onde ele aparece: letreiro da intro, letreiro pequeno do rodapé, carrinho vazio.
// Onde ele NUNCA aparece: no raio-x. Aquilo é o instrumento do site, e um rosto de
// desenho ali destrói o efeito que sustenta o projeto inteiro. Não é `display: none` —
// com o raio-x aberto ele não existe no DOM.

import { createContext, useContext, useEffect, useRef, type CSSProperties } from 'react'
import { useTema } from '@/components/TemaAtivo'
import { movimentoPausado, observarPausa } from '@/lib/motion'

export const RaioXAberto = createContext(false)

// ---------------------------------------------------------------------------
// O olhar.
//
// Um relógio só para todos os mascotes da tela: o alvo é um ponto da viewport, e cada
// olho calcula sozinho para que lado ele fica. O que se move é a pupila dentro do olho,
// nunca a cabeça.
//
// O único erro possível aqui é ele parecer nervoso. Olho que se mexe demais cansa e
// chama atenção para si em vez de dar vida ao letreiro. Daí os números serem lentos:
// peso alto na perseguição, fixação longa, piscada rara.
// ---------------------------------------------------------------------------

/** Fração do caminho percorrida a cada quadro de 60Hz. 0.085 dá peso sem dar preguiça. */
const PESO = 0.085
/** Desvio máximo da pupila, em unidades do desenho (o branco tem raio 16, a pupila 6.5).
 * Sobra borda de branco no limite: pupila colada na aresta lê como susto, não como olhar. */
const DESVIO_MAX = 6.2
/** Distância em que o olhar já está no limite. Mais perto que isso, a pupila anda menos. */
const ALCANCE = 300
/** O olho anda menos na vertical que na horizontal — é assim que olho de gente funciona. */
const ACHATA_Y = 0.72
/** Depois do último toque ou movimento do cursor, o repouso só retoma passado isto. */
const RETOMA_MS = 1100
/** Quanto tempo ele fixa cada coisa. Abaixo de 1,4s vira varredura nervosa. */
const FIXA_MIN = 1500
const FIXA_MAX = 3300
/** De vez em quando ele olha de volta para quem está olhando. */
const CHANCE_ESPECTADOR = 0.3
/** E de vez em quando para a saída da tela. */
const CHANCE_SAIDA = 0.14
/** Piscada: rápida, e em intervalo irregular. Ritmo fixo parece máquina. */
const PISCA_MS = 130
const PISCA_MIN = 2700
const PISCA_MAX = 7300
const CHANCE_DUPLA = 0.18
/** O deslize empurra o olhar à frente do dedo: velocidade em px/ms vezes isto. */
const ANTECIPA_DESLIZE = 110

/** Coisas plausíveis de se olhar: o que se toca, o que custa, a saída. */
const ALVOS_PLAUSIVEIS = [
  '[data-abrir-carrinho]',
  '[data-barra-pedido] [data-preco]',
  '.lanche-card [data-preco]',
  '.lanche-card .botao-quente',
  '#intro-pular',
  '#carrinho-fechar',
  '[data-carrinho] .botao-quente',
].join(', ')

type Ponto = { x: number; y: number }
type Registro = {
  soquetes: (SVGGraphicsElement | null)[]
  pupilas: (SVGGraphicsElement | null)[]
  internos: (SVGGraphicsElement | null)[]
  angulos: number[]
  centros: Ponto[]
  atuais: Ponto[]
}

const inscritos = new Set<Registro>()
let laco = 0
let alvo: Ponto | null = null
let ultimoPonteiro = -Infinity
let trocaEm = 0
let medidoEm = -Infinity
let ultimoQuadro = 0
let piscaInicio = -1
let proximaPisca = 0
let encadeadas = 0
let ultimoToque: { p: Ponto; t: number } | null = null

const sorte = (a: number, b: number) => a + Math.random() * (b - a)

function medirTudo() {
  for (const r of inscritos) {
    r.centros = r.soquetes.map((s, i) => {
      if (!s) return { x: 0, y: 0 }
      const matriz = s.getScreenCTM()
      r.angulos[i] = matriz ? Math.atan2(matriz.b, matriz.a) : 0
      const c = s.getBoundingClientRect()
      return { x: c.left + c.width / 2, y: c.top + c.height / 2 }
    })
  }
}

function visivel(el: Element) {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight
}

/** Escolhe o próximo ponto de repouso. Nunca dois seguidos quase no mesmo lugar: pular
 * 30px de nada é tique, não olhar. */
function escolherRepouso() {
  if (Math.random() < CHANCE_ESPECTADOR) {
    alvo = null
    return
  }
  if (Math.random() < CHANCE_SAIDA) {
    alvo = { x: Math.random() < 0.5 ? -60 : window.innerWidth + 60, y: sorte(0.2, 0.8) * window.innerHeight }
    return
  }
  const candidatos = [...document.querySelectorAll(ALVOS_PLAUSIVEIS)].filter(visivel)
  if (!candidatos.length) {
    alvo = null
    return
  }
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const r = candidatos[Math.floor(Math.random() * candidatos.length)].getBoundingClientRect()
    const p = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    if (!alvo || Math.hypot(p.x - alvo.x, p.y - alvo.y) > 60) {
      alvo = p
      return
    }
  }
}

function aberturaDoOlho(t: number) {
  if (piscaInicio < 0) {
    if (!proximaPisca) proximaPisca = t + sorte(PISCA_MIN, PISCA_MAX)
    if (t < proximaPisca) return 1
    piscaInicio = t
    encadeadas = Math.random() < CHANCE_DUPLA ? 1 : 0
  }
  const u = (t - piscaInicio) / PISCA_MS
  if (u >= 1) {
    piscaInicio = -1
    if (encadeadas > 0) {
      encadeadas--
      proximaPisca = t + 95
    } else {
      proximaPisca = t + sorte(PISCA_MIN, PISCA_MAX)
    }
    return 1
  }
  // Triangular: fecha na metade do tempo, abre na outra. 0.07 é a fresta que sobra.
  return Math.max(0.07, Math.abs(u * 2 - 1))
}

function desvioDesejado(centro: Ponto): Ponto {
  if (!alvo) return { x: 0, y: 0 }
  const dx = alvo.x - centro.x
  const dy = (alvo.y - centro.y) * ACHATA_Y
  const d = Math.hypot(dx, dy)
  if (d < 1) return { x: 0, y: 0 }
  // Raiz do alcance: alvo perto já move bem o olho, alvo longe satura devagar.
  const k = Math.min(1, d / ALCANCE) ** 0.6
  return { x: (dx / d) * DESVIO_MAX * k, y: (dy / d) * DESVIO_MAX * k }
}

function quadro(t: number) {
  const dt = Math.min(50, t - ultimoQuadro || 16.7)
  ultimoQuadro = t
  // Perseguição independente da taxa de quadros: 120Hz não pode dar um olho mais rápido.
  const f = 1 - (1 - PESO) ** (dt / 16.7)

  if (t - medidoEm > 400) {
    medirTudo()
    medidoEm = t
  }
  if (t - ultimoPonteiro > RETOMA_MS && t > trocaEm) {
    escolherRepouso()
    trocaEm = t + sorte(FIXA_MIN, FIXA_MAX)
  }
  const abertura = aberturaDoOlho(t)

  for (const r of inscritos) {
    for (let i = 0; i < r.centros.length; i++) {
      const mundo = desvioDesejado(r.centros[i])
      const a = r.angulos[i]
      const querido = { x: Math.cos(a) * mundo.x + Math.sin(a) * mundo.y, y: -Math.sin(a) * mundo.x + Math.cos(a) * mundo.y }
      const atual = r.atuais[i]
      atual.x += (querido.x - atual.x) * f
      atual.y += (querido.y - atual.y) * f
      r.pupilas[i]?.setAttribute('transform', `translate(${atual.x.toFixed(2)} ${atual.y.toFixed(2)})`)
      const interno = r.internos[i]
      if (interno) {
        const cy = OLHOS[i]?.cy ?? 0
        interno.setAttribute('transform', `translate(0 ${(cy * (1 - abertura)).toFixed(2)}) scale(1 ${abertura.toFixed(3)})`)
      }
    }
  }
  laco = requestAnimationFrame(quadro)
}

function aoPonteiro(e: PointerEvent) {
  ultimoPonteiro = performance.now()
  const p = { x: e.clientX, y: e.clientY }
  if (e.pointerType === 'mouse') {
    alvo = p
    ultimoToque = null
    return
  }
  // Toque: olha para onde a pessoa tocou e, no deslize, à frente do dedo.
  const agora = performance.now()
  if (ultimoToque && agora - ultimoToque.t > 0 && agora - ultimoToque.t < 120) {
    const dt = agora - ultimoToque.t
    const vx = (p.x - ultimoToque.p.x) / dt
    const vy = (p.y - ultimoToque.p.y) / dt
    alvo = { x: p.x + vx * ANTECIPA_DESLIZE, y: p.y + vy * ANTECIPA_DESLIZE }
  } else {
    alvo = p
  }
  ultimoToque = { p, t: agora }
}

function ligar() {
  window.addEventListener('pointermove', aoPonteiro, { passive: true })
  window.addEventListener('pointerdown', aoPonteiro, { passive: true })
  const remedir = () => { medidoEm = -Infinity }
  window.addEventListener('scroll', remedir, { passive: true, capture: true })
  window.addEventListener('resize', remedir, { passive: true })
  ultimoQuadro = 0
  medidoEm = -Infinity
  proximaPisca = performance.now() + sorte(PISCA_MIN, PISCA_MAX)
  piscaInicio = -1
  laco = requestAnimationFrame(quadro)
  return () => {
    window.removeEventListener('pointermove', aoPonteiro)
    window.removeEventListener('pointerdown', aoPonteiro)
    window.removeEventListener('scroll', remedir, true)
    window.removeEventListener('resize', remedir)
    cancelAnimationFrame(laco)
    laco = 0
  }
}

let desligar: (() => void) | null = null

function useOlhar(qtd: number, ativo: boolean) {
  const reg = useRef<Registro>({
    soquetes: Array(qtd).fill(null),
    pupilas: Array(qtd).fill(null),
    internos: Array(qtd).fill(null),
    angulos: Array(qtd).fill(0),
    centros: Array.from({ length: qtd }, () => ({ x: 0, y: 0 })),
    atuais: Array.from({ length: qtd }, () => ({ x: 0, y: 0 })),
  })
  useEffect(() => {
    const r = reg.current
    const soquete = r.soquetes.find(Boolean)
    if (!ativo || !soquete) return
    let emTela = false
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)')
    const retirar = () => {
      inscritos.delete(r)
      if (!inscritos.size && desligar) { desligar(); desligar = null }
    }
    const sincronizar = () => {
      if (reduzido.matches) {
        r.pupilas.forEach(p => p?.removeAttribute('transform'))
        r.internos.forEach(p => p?.removeAttribute('transform'))
        r.atuais.forEach(p => { p.x = 0; p.y = 0 })
      }
      if (!emTela || document.hidden || reduzido.matches || movimentoPausado()) { retirar(); return }
      inscritos.add(r)
      if (!desligar) desligar = ligar()
    }
    const io = new IntersectionObserver(([entrada]) => { emTela = entrada.isIntersecting; sincronizar() })
    io.observe(soquete)
    const pararObservacao = observarPausa(sincronizar)
    reduzido.addEventListener('change', sincronizar)
    document.addEventListener('visibilitychange', sincronizar)
    return () => {
      io.disconnect()
      pararObservacao()
      reduzido.removeEventListener('change', sincronizar)
      document.removeEventListener('visibilitychange', sincronizar)
      retirar()
    }
  }, [ativo])
  return reg
}

// ---------------------------------------------------------------------------
// O desenho. Sistema de coordenadas próprio: 240 × 200.
//
// A silhueta é que faz o trabalho no tamanho em que ele é visto (uns 100px de largura):
// cúpula baixa e larga, franja clara, carne escura e base grossa — quatro faixas de
// alturas diferentes. Cúpula alta com base fina lia como bolinho, não como lanche.
// Os olhos são pequenos de propósito: olho grande e redondo demais vira emoji.
// ---------------------------------------------------------------------------

const OLHOS = [
  { cx: 88, cy: 68 },
  { cx: 152, cy: 66 },
]

/** O olho é uma amêndoa, não um círculo: círculo branco com pupila preta no meio é olho
 * de emoji. Amêndoa é o que a mão de um pintor de letreiro faz com um pincel chato. */
const amendoa = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} C${cx - rx + 4} ${cy - ry - 2} ${cx + rx - 4} ${cy - ry - 2} ${cx + rx} ${cy}` +
  ` C${cx + rx - 5} ${cy + ry} ${cx - rx + 5} ${cy + ry} ${cx - rx} ${cy} Z`

/** O mascote como peça de outro SVG (letreiro da intro, letreiro do rodapé). */
export function DesenhoMascote({ transform, olharAtivo = true }: { transform?: string; olharAtivo?: boolean }) {
  const tema = useTema()
  const aberto = useContext(RaioXAberto) || !tema.mascote
  const reg = useOlhar(OLHOS.length, !aberto && olharAtivo)
  if (aberto) return null
  return (
    <g data-mascote transform={transform} aria-hidden="true" style={{ pointerEvents: 'none', ...(tema.fundo === 'claro' ? { '--osso': tema.cores.superficie, '--borra': tema.cores.texto } : {}) } as CSSProperties}>
      {/* Fora do esquadro de propósito: pintura à mão não sai reta. */}
      <g transform="rotate(-1.4 120 104)">
      {/* Duas tintas chapadas e o traço por cima — é assim que letreiro pintado resolve
          volume. A carne NÃO é pintada de --traco: escuro sobre fundo escuro abre um
          buraco no meio do lanche. Ela é --latao como os pães, e quem a separa deles é
          a linha, mais as duas marcas de chapa dentro. */}
      <path d="M28 156 L212 156 C221 163 219 182 203 188 C159 195 81 195 37 188 C21 182 19 163 28 156 Z" fill="var(--latao)" />
      <path d="M24 130 L216 130 C219 146 208 158 188 159 L52 159 C32 158 21 146 24 130 Z" fill="var(--latao)" />
      <g fill="none" stroke="var(--traco)" strokeLinecap="round">
        <path d="M24 131 L216 131 C219 146 208 158 188 159 L52 159 C32 158 21 146 24 131" strokeWidth="3.2" />
        <path d="M58 146 l36 0" strokeWidth="3.6" />
        <path d="M148 144 l34 0" strokeWidth="3.2" />
      </g>
      {/* recheio claro, sobrando nas pontas e com a franja torta de quem pintou à mão */}
      <path
        d="M15 102 L226 102 L226 120 C211 132 199 118 185 126 C170 135 159 121 144 129 C129 137 117 122 103 130 C88 138 75 123 61 130 C47 137 28 124 15 126 Z"
        fill="var(--osso)"
      />
      {/* pão de cima: baixo e largo */}
      <path data-mascote-cabeca d="M20 106 C22 56 64 22 120 21 C176 20 218 55 220 106 C178 112 62 113 20 106 Z" fill="var(--latao)" />
      {/* gergelim: três pinceladas, nenhuma igual à outra */}
      <g stroke="var(--osso)" strokeWidth="5.5" strokeLinecap="round" fill="none">
        <path d="M70 50 l11 -7" />
        <path d="M115 38 l12 -2" />
        <path d="M159 48 l10 7" />
      </g>
      {/* o contorno do pão de cima não fecha: pincel de letreiro não fecha */}
      <path
        d="M25 98 C29 55 68 25 120 24 C170 23 211 53 215 95"
        fill="none"
        stroke="var(--traco)"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      {/* boca: curta, torta e fina. Sorriso largo puxa o desenho para o infantil */}
      <path d="M110 92 C117 98 128 98 134 90" fill="none" stroke="var(--traco)" strokeWidth="3.4" strokeLinecap="round" />
      {OLHOS.map((o, i) => (
        <g key={i} ref={(el) => { reg.current.soquetes[i] = el }}>
          {/* a piscada achata o olho inteiro, contorno junto — pálpebra de pintura é o
              próprio traço descendo. O soquete de fora não escala: é dele que sai a
              medida do centro do olho na tela. */}
          <g ref={(el) => { reg.current.internos[i] = el }}>
            <path d={amendoa(o.cx, o.cy, 17 - i, 13)} fill="var(--osso)" />
            <g data-pupila={i} ref={(el) => { reg.current.pupilas[i] = el }}>
              <circle cx={o.cx} cy={o.cy + 1} r="6" fill="var(--borra)" />
            </g>
          </g>
        </g>
      ))}
      </g>
    </g>
  )
}

/**
 * O mascote sozinho, na sua tabuleta. Mesma linguagem do letreiro pequeno do rodapé —
 * no carrinho vazio ele continua sendo placa pintada, não personagem solto na tela.
 */
export function Mascote({ largura = 168, className }: { largura?: number; className?: string }) {
  const aberto = useContext(RaioXAberto) || !useTema().mascote
  if (aberto) return null
  return (
    <svg
      className={className}
      viewBox="0 0 300 248"
      width={largura}
      height={(largura * 248) / 300}
      role="img"
      aria-label="Tabuleta pintada da casa"
      style={{ display: 'block', transform: 'rotate(-.6deg)' }}
    >
      <rect x="4" y="4" width="292" height="240" rx="3" fill="var(--fumo)" stroke="var(--traco)" strokeWidth="2" />
      <rect x="14" y="14" width="272" height="220" rx="2" fill="var(--borra)" stroke="var(--traco)" />
      <DesenhoMascote transform="translate(34 26)" />
    </svg>
  )
}
