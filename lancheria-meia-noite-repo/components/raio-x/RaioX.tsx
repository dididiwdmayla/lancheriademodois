'use client'

// O raio-x: a pilha explodida, as chamadas, o medidor e o trilho.
//
// O layout é mobile-first e mora no CSS (app/globals.css, bloco "Raio-x"): em 390px a pilha
// ocupa a largura inteira nos dois terços de cima e medidor, trilho e botão empilham no
// terço de baixo, que é a zona de polegar. Acima de 900px o medidor volta para a coluna da
// direita. O que este arquivo decide é o que MUDA de comportamento com o corte, não o que
// muda de lugar: abaixo dele as chamadas ficam ocultas e só a camada tocada mostra a dela.
//
// O estado é uma LISTA ORDENADA DE INSTÂNCIAS, não um conjunto de slugs. Duas fatias de
// queijo são duas instâncias, cada uma com seu uid e seu lugar na ordem — um Set não
// conseguiria representar isso, nem dizer qual das duas você arrastou.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { CAMADAS, MAPA_CAMADAS, urlCamada } from '@/data/camadas'
import { LIMIAR_AVISO_CAMADAS, MAX_CAMADAS, MAX_REPETICOES } from '@/data/casa'
import { precoDaComposicao } from '@/lib/precos'
import { prefersReducedMotion } from '@/lib/motion'
import { Camada, Chamada, ChamadaChip, medidas, TOQUE_MIN, TiraDeToque } from './Camada'
import Composicao from './Composicao'
import Medidor, { BotaoSelar } from './Medidor'
import { distribuirRotulos } from './rotulos'
import type { Origem } from './salto'
import Trilho from './Trilho'
import {
  CORTE_AMPLO,
  fatorFechado,
  geometria,
  MEDIDA_MAX_U,
  PAES,
  PRENSA_CURVA,
  PRENSA_MS,
  unidadesPilha,
  type Forma,
} from './prensa'

export type Instancia = { slug: string; uid: number }

export type LancheFechado = {
  chave: string
  nome: string
  forma: Forma
  camadas: string[]
  resumo: string
  cent: number
}

type Props = {
  nome: string
  forma: Forma
  camadasIniciais: string[]
  onFechar: (item: LancheFechado, origem: Origem | null) => void
}

const CURVA_ASSENTA = 'cubic-bezier(.32,.02,.24,1)'
const CURVA_EXPLODE = 'cubic-bezier(.22,1.24,.36,1)'

export default function RaioX({ nome, forma, camadasIniciais, onFechar }: Props) {
  const uidRef = useRef(1)
  const instanciar = useCallback(
    (slugs: string[]): Instancia[] =>
      slugs.filter((s) => MAPA_CAMADAS[s]).map((s) => ({ slug: s, uid: uidRef.current++ })),
    [],
  )

  const [pilha, setPilha] = useState<Instancia[]>(() => instanciar(camadasIniciais))
  // Editor (raio-x aberto a partir de um fixo do cardápio) vs. montador ("Monte o seu"):
  // o fixo sempre chega com a pilha cheia, o montador sempre nasce vazio — a mesma
  // distinção que já existe nos dados, sem precisar de uma segunda flag para duplicá-la.
  // Fixado no primeiro render: a sessão de raio-x não troca de modo no meio do caminho.
  const [modoMontador] = useState(() => camadasIniciais.length === 0)
  // Editor: o trilho nasce recolhido, e "Acrescentar ingrediente" abre ele como folha por
  // cima do painel. Montador: o trilho é a ação principal e nasce aberto — sem alternância,
  // a tira de sempre. Ver o comentário de `modoMontador` acima e o AGENTS.md.
  const [trilhoAberto, setTrilhoAberto] = useState(modoMontador)
  const [comprimido, setComprimido] = useState(false)
  const [marca, setMarca] = useState(false)
  const [selando, setSelando] = useState(false)
  const [selado, setSelado] = useState(false)
  const [varrendo, setVarrendo] = useState(false)
  const [recado, setRecado] = useState('')
  const [area, setArea] = useState({ w: 0, h: 0 })
  // Mobile-first também no JS: nasce estreito e só alarga se a media query disser. O
  // servidor não sabe a largura da tela, e chutar desktop no HTML seria o avesso do
  // contrato — o celular é o alvo, o desktop é a adaptação.
  const [amplo, setAmplo] = useState(false)
  // A camada cuja chamada está revelada, por índice. Só vale abaixo do corte: acima dele
  // as chamadas aparecem todas ao mesmo tempo e não há o que revelar.
  const [revelada, setRevelada] = useState<number | null>(null)
  const [composicao, setComposicao] = useState(false)
  // Só camadas sem altura medida são sondadas — hoje não há nenhuma. O caminho existe
  // porque falta de asset vira "em falta" no trilho, nunca placeholder de imagem.
  const [ausentes, setAusentes] = useState<Record<string, boolean>>({})
  // Altura da faixa flutuante de aviso/recado (#rx-flutua), medida ao vivo. No celular ela
  // flutua sobre o painel; a pilha escala para a altura que sobra depois de descontá-la, e
  // não para a altura inteira do painel. Fica 0 quando a faixa não tem nada para mostrar.
  const [flutuaH, setFlutuaH] = useState(0)

  const desenhoRef = useRef<HTMLDivElement>(null)
  const flutuaRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  const agendar = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  // Espelho síncrono do que os gestos precisam ler. Um arrasto decide a cada pointermove
  // e não pode esperar o próximo render para saber onde a camada foi parar.
  const vivo = useRef({ pilha, selando, selado, area, forma })
  useLayoutEffect(() => {
    vivo.current = { pilha, selando, selado, area, forma }
  })

  useEffect(() => {
    const alvo = desenhoRef.current
    if (!alvo) return
    const medir = () => {
      const r = alvo.getBoundingClientRect()
      setArea((a) => (Math.abs(r.width - a.w) > 1 || Math.abs(r.height - a.h) > 1 ? { w: r.width, h: r.height } : a))
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(alvo)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const alvo = flutuaRef.current
    if (!alvo) return
    const medir = () => {
      const r = alvo.getBoundingClientRect()
      setFlutuaH((h) => (Math.abs(r.height - h) > 0.5 ? r.height : h))
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(alvo)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    CAMADAS.filter((c) => c.alturaPx === 0).forEach((c) => {
      const im = new Image()
      im.onerror = () => setAusentes((a) => ({ ...a, [c.slug]: true }))
      im.src = urlCamada(c)
    })
  }, [])

  useEffect(() => {
    const pendentes = timers.current
    return () => pendentes.forEach(window.clearTimeout)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${CORTE_AMPLO}px)`)
    const ler = () => setAmplo(mq.matches)
    ler()
    mq.addEventListener('change', ler)
    return () => mq.removeEventListener('change', ler)
  }, [])

  useEffect(() => {
    if (!composicao) return
    const aoTeclarFora = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setComposicao(false)
    }
    window.addEventListener('keydown', aoTeclarFora)
    return () => window.removeEventListener('keydown', aoTeclarFora)
  }, [composicao])

  // A folha do trilho (modo editor) fecha no Escape, do mesmo jeito que a composição.
  useEffect(() => {
    if (modoMontador || !trilhoAberto) return
    const aoTeclarFora = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTrilhoAberto(false)
    }
    window.addEventListener('keydown', aoTeclarFora)
    return () => window.removeEventListener('keydown', aoTeclarFora)
  }, [modoMontador, trilhoAberto])

  // ---------- regras de posição ----------

  const valida = useCallback(
    (arr: Instancia[]): boolean => {
      if (!arr.length) return true
      if (arr.length > MAX_CAMADAS) return false
      const paes = PAES[forma]
      if (arr[0].slug !== paes[0] || arr[arr.length - 1].slug !== paes[1]) return false
      if (arr.filter((i) => MAPA_CAMADAS[i.slug]?.pao).length !== 2) return false
      const contagem: Record<string, number> = {}
      for (const i of arr) {
        contagem[i.slug] = (contagem[i.slug] || 0) + 1
        if (contagem[i.slug] > MAX_REPETICOES) return false
      }
      // Molho só encosta em pão: primeira ou última posição do recheio.
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].slug !== 'molho') continue
        if (i !== 1 && i !== arr.length - 2) return false
      }
      return true
    },
    [forma],
  )

  const trocarPilha = useCallback((arr: Instancia[]) => {
    vivo.current.pilha = arr
    setPilha(arr)
    setRecado('')
    setComprimido(false)
  }, [])

  const adicionar = useCallback(
    (slug: string) => {
      const v = vivo.current
      if (v.selando || v.selado) return
      const c = MAPA_CAMADAS[slug]
      if (!c || ausentes[slug] || c.pao) return
      if (v.pilha.length >= MAX_CAMADAS) {
        setRecado('Dezesseis camadas é o teto. Tire uma antes.')
        return
      }
      let arr = v.pilha.slice()
      // Painel vazio: os dois pães entram junto com o primeiro recheio.
      if (!arr.length) arr = instanciar(PAES[forma])
      const uid = uidRef.current++
      const meio = arr.slice(1, -1)
      meio.push({ slug, uid })
      meio.sort((a, b) => MAPA_CAMADAS[a.slug].ordem - MAPA_CAMADAS[b.slug].ordem)
      arr = [arr[0], ...meio, arr[arr.length - 1]]
      if (!valida(arr)) {
        setRecado('O molho só entra ao lado de um pão.')
        return
      }
      trocarPilha(arr)
      // A ficha desabilita assim que a terceira instância entra — é este o momento em que
      // o recado explica alguma coisa. Um recado antes da terceira nunca dispara: a ficha
      // barra a quarta antes que o clique chegue aqui.
      if (arr.filter((i) => i.slug === slug).length === MAX_REPETICOES) {
        setRecado(`Três ${c.nome.toLowerCase()} já é exagero. O quarto não entra.`)
      }
      // A chamada da camada nova se revela sozinha. No celular a ficha do trilho é só a
      // foto em 56px — é esta chamada que diz, por escrito, o que acabou de entrar.
      setRevelada(arr.findIndex((x) => x.uid === uid))
    },
    [ausentes, forma, instanciar, trocarPilha, valida],
  )

  /** O mesmo `adicionar`, fechando a folha do trilho por cima — "escolher" é um dos dois
   * jeitos de fechá-la (o outro é tocar fora). No modo montador o trilho não tem folha;
   * fechar `trilhoAberto` ali não muda nada em tela. */
  const aoEscolherDoTrilho = useCallback(
    (slug: string) => {
      adicionar(slug)
      setTrilhoAberto(false)
    },
    [adicionar],
  )

  const remover = useCallback(
    (i: number) => {
      const arr = vivo.current.pilha.slice()
      const inst = arr[i]
      if (!inst) return
      if (MAPA_CAMADAS[inst.slug].obrigatorio) {
        setRecado('Os pães ficam. Sem eles não é lanche.')
        return
      }
      arr.splice(i, 1)
      // Tirar a camada de baixo pode deixar o molho no meio da pilha. Ele volta ao pão.
      for (let j = 0; j < arr.length; j++) {
        if (arr[j].slug === 'molho' && j > 1 && j < arr.length - 2) {
          const m = arr.splice(j, 1)[0]
          arr.splice(1, 0, m)
          break
        }
      }
      trocarPilha(arr.length === 2 ? [] : arr)
      setRevelada(null)
    },
    [trocarPilha],
  )

  /** Troca a camada `i` com a vizinha. Devolve o novo índice, ou -1 se a troca não vale. */
  const mover = useCallback(
    (i: number, delta: number): number => {
      const arr = vivo.current.pilha.slice()
      const j = i + delta
      if (j < 1 || j > arr.length - 2 || i < 1 || i > arr.length - 2) return -1
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      if (!valida(arr)) {
        setRecado('O molho só entra ao lado de um pão.')
        return -1
      }
      trocarPilha(arr)
      setRevelada((r) => (r === i ? j : r === j ? i : r))
      return j
    },
    [trocarPilha, valida],
  )

  // ---------- gestos ----------

  /** Arrastar uma ficha do trilho até o painel. Tocar sem arrastar já adiciona pelo click. */
  const arrastarDoTrilho = useCallback(
    (e: ReactPointerEvent<HTMLElement>, slug: string) => {
      const c = MAPA_CAMADAS[slug]
      if (!c) return
      const painel = document.getElementById('rx-painel')
      const x0 = e.clientX
      const y0 = e.clientY
      let fantasma: HTMLDivElement | null = null

      const mover_ = (ev: PointerEvent) => {
        const dx = ev.clientX - x0
        const dy = ev.clientY - y0
        if (!fantasma && Math.hypot(dx, dy) > 10) {
          fantasma = document.createElement('div')
          fantasma.style.cssText =
            'position:fixed;z-index:40;width:180px;height:108px;pointer-events:none;opacity:.85;background:center/contain no-repeat;'
          fantasma.style.backgroundImage = `url("${urlCamada(c)}")`
          document.body.appendChild(fantasma)
        }
        if (fantasma) {
          fantasma.style.left = `${ev.clientX - 90}px`
          fantasma.style.top = `${ev.clientY - 54}px`
        }
      }
      const soltar = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', mover_)
        window.removeEventListener('pointerup', soltar)
        if (!fantasma) return
        fantasma.remove()
        const r = painel?.getBoundingClientRect()
        const dentro =
          !!r && ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom
        if (dentro) aoEscolherDoTrilho(slug)
      }
      window.addEventListener('pointermove', mover_)
      window.addEventListener('pointerup', soltar)
    },
    [aoEscolherDoTrilho],
  )

  /** Arrastar uma camada da pilha: para cima e para baixo reordena, para fora tira. */
  const arrastarCamada = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const v = vivo.current
      if (v.selando || v.selado) return
      const alvo = (e.target as HTMLElement).closest<HTMLElement>(
        '[data-toque], [data-inst], [data-chamada]',
      )
      // Toque no vazio do painel fecha a chamada aberta: sair é gesto, não botão.
      if (!alvo) {
        setRevelada(null)
        return
      }
      const i =
        alvo.dataset.toque !== undefined
          ? Number(alvo.dataset.toque)
          : alvo.dataset.chamada !== undefined
            ? Number(alvo.dataset.chamada)
            : v.pilha.findIndex((x) => String(x.uid) === alvo.dataset.inst)
      if (i < 0) return

      const painel = document.getElementById('rx-painel')
      const x0 = e.clientX
      const y0 = e.clientY
      let base = y0
      let idx = i
      let removendo = false
      let mexeu = false
      const passo = Math.max(28, v.area.h / Math.max(6, v.pilha.length * 1.6))

      const elDe = () => {
        const inst = vivo.current.pilha[idx]
        return inst ? document.querySelector<HTMLElement>(`[data-inst="${inst.uid}"]`) : null
      }
      const mover_ = (ev: PointerEvent) => {
        const dy = ev.clientY - base
        const dx = ev.clientX - x0
        if (Math.hypot(dx, ev.clientY - y0) > 8) mexeu = true
        const r = painel?.getBoundingClientRect()
        const fora = !!r && (ev.clientX < r.left - 40 || ev.clientX > r.right + 40 || Math.abs(dx) > 150)
        if (fora !== removendo) {
          removendo = fora
          const el = elDe()
          if (el) el.style.opacity = removendo ? '0.45' : '1'
          setRecado(removendo ? 'Solte para tirar.' : '')
        }
        if (Math.abs(dy) >= passo && !removendo) {
          const j = mover(idx, dy > 0 ? -1 : 1)
          if (j >= 0) idx = j
          base = ev.clientY
        }
      }
      const soltar = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', mover_)
        window.removeEventListener('pointerup', soltar)
        const inst = vivo.current.pilha[idx]
        const el = elDe()
        if (removendo && inst && !MAPA_CAMADAS[inst.slug].obrigatorio) {
          if (el) {
            const dir = ev.clientX < x0 ? -1 : 1
            el.style.transition = 'transform 220ms cubic-bezier(.4,0,1,1), opacity 220ms linear'
            el.style.transform = `translateX(${dir * 340}px)`
            el.style.opacity = '0'
          }
          agendar(() => remover(idx), el ? 200 : 0)
        } else {
          if (el) el.style.opacity = '1'
          if (removendo) setRecado('Os pães ficam. Sem eles não é lanche.')
          else if (!mexeu) {
            // Toque sem arrasto: revela a chamada daquela camada, e só dela. Tocar de novo
            // fecha. No desktop as chamadas já estão todas na tela e isto não muda nada.
            setRecado('')
            setRevelada((r) => (r === idx ? null : idx))
          }
        }
      }
      window.addEventListener('pointermove', mover_)
      window.addEventListener('pointerup', soltar)
    },
    [agendar, mover, remover],
  )

  /** O mesmo que o arrasto faz, no teclado. Requisito, não alternativa. */
  const aoTeclar = useCallback(
    (e: ReactKeyboardEvent<HTMLElement>) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-chamada]')
      if (!b) return
      const i = Number(b.dataset.chamada)
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const j = mover(i, e.key === 'ArrowUp' ? 1 : -1)
        if (j >= 0) {
          agendar(() => document.querySelector<HTMLElement>(`[data-chamada="${j}"]`)?.focus(), 20)
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        remover(i)
      }
    },
    [agendar, mover, remover],
  )

  // ---------- prensa, gravidade e despacho ----------

  const despachar = useCallback(() => {
    const arr = vivo.current.pilha
    const camadas = arr.map((i) => i.slug)
    if (!camadas.length) return

    // A origem do salto sai da pilha desenhada, enquanto ela ainda está na tela.
    let origem: Origem | null = null
    const el = document.querySelector<HTMLElement>(`[data-inst="${arr[0].uid}"]`)
    if (el) {
      const r = el.getBoundingClientRect()
      if (r.width) {
        const kk = r.width / 2000
        origem = {
          centroX: r.left + r.width / 2,
          baseY: r.top + (600 + MAPA_CAMADAS[arr[0].slug].alturaPx / 2) * kk,
          kk,
        }
      }
    }

    const recheio = camadas.filter((s) => !MAPA_CAMADAS[s]?.pao).map((s) => MAPA_CAMADAS[s].nome)
    const item: LancheFechado = {
      chave: `montado:${forma}:${camadas.join('.')}`,
      nome,
      forma,
      camadas,
      resumo: recheio.length ? recheio.join(', ') : 'Só o pão',
      cent: precoDaComposicao(camadas),
    }

    vivo.current.pilha = []
    setPilha([])
    setComprimido(false)
    setMarca(false)
    setSelando(false)
    setSelado(false)
    setRecado('')
    setRevelada(null)
    setComposicao(false)
    onFechar(item, origem)
  }, [forma, nome, onFechar])

  /** Prensado: a chapa fecha. 340ms, aceleração forte e parada seca. */
  const prensar = useCallback(() => {
    if (prefersReducedMotion()) {
      setComprimido(true)
      setMarca(true)
      setSelado(true)
      agendar(despachar, 140)
      return
    }
    setSelando(true)
    setRecado('')
    agendar(() => setComprimido(true), 60)
    // As listras da chapa só aparecem depois que a prensa parou. Marca é consequência.
    agendar(() => setMarca(true), 60 + PRENSA_MS)
    agendar(() => {
      setSelando(false)
      setSelado(true)
      despachar()
    }, 60 + PRENSA_MS + 260)
  }, [agendar, despachar])

  /** Redondo: só a gravidade assenta, e a chapa passa por baixo. */
  const selar = useCallback(() => {
    setSelando(true)
    setRecado('')
    if (prefersReducedMotion()) {
      setComprimido(true)
      setSelando(false)
      setSelado(true)
      agendar(despachar, 140)
      return
    }
    agendar(() => setComprimido(true), 200)
    agendar(() => setVarrendo(true), 500)
    agendar(() => {
      setVarrendo(false)
      setSelando(false)
      setSelado(true)
      despachar()
    }, 1740)
  }, [agendar, despachar])

  const fechamento = useCallback(() => {
    const v = vivo.current
    if (!v.pilha.length || v.selando || v.selado) return
    if (forma === 'prensado') prensar()
    else selar()
  }, [forma, prensar, selar])

  // ---------- desenho ----------

  const lista = pilha.filter((i) => !ausentes[i.slug] && MAPA_CAMADAS[i.slug].alturaPx > 0)
  const slugs = lista.map((i) => i.slug)
  // No celular a faixa de aviso/recado flutua por cima do painel; no desktop ela mora na
  // coluna do medidor e não toma espaço da pilha. Só desconta no primeiro caso.
  const alturaDisponivel = Math.max(0, area.h - (amplo ? 0 : flutuaH))
  const g = geometria({ slugs, areaW: area.w, areaH: alturaDisponivel, comprimido, forma, chamadas: amplo })
  const pronto = area.w > 0 && area.h > 0

  const transicao = g.prensa
    ? `top ${PRENSA_MS}ms ${PRENSA_CURVA}, transform ${PRENSA_MS}ms ${PRENSA_CURVA}`
    : selando || comprimido
      ? `top 320ms ${CURVA_ASSENTA}, transform 320ms ${CURVA_ASSENTA}`
      : `top 420ms ${CURVA_EXPLODE}, transform 300ms linear`

  const n = pilha.length
  const aviso = n > LIMIAR_AVISO_CAMADAS
  const unidades = unidadesPilha(slugs, comprimido ? fatorFechado(forma) : 1)
  const pct = Math.max(n ? 2 : 0, Math.min(100, (unidades / MEDIDA_MAX_U) * 100))
  const ehPrensado = forma === 'prensado'

  // n = 1ª, 2ª, 3ª instância daquele slug. Vira o sufixo do id #rx-camada-{slug}-{n}.
  const ordinais: Record<string, number> = {}
  const numerada = lista.map((inst) => {
    ordinais[inst.slug] = (ordinais[inst.slug] || 0) + 1
    return { inst, n: ordinais[inst.slug] }
  })
  const estado = { comprimido, selando, selado, marca, forma }

  // A faixa vertical de cada camada: do topo dela ao topo da de baixo. É o que a tira de
  // toque cobre — o embrulho da camada é o quadro inteiro e cobriria as vizinhas.
  const faixaDe = (i: number) => {
    const topo = g.offsetY + (g.tops[i] - g.minTop) * g.k
    const base =
      i > 0
        ? g.offsetY + (g.tops[i - 1] - g.minTop) * g.k
        : topo + MAPA_CAMADAS[slugs[i]].alturaPx * g.k
    return { topo, base }
  }

  const aberta = revelada !== null && revelada >= 0 && revelada < numerada.length ? revelada : null
  const chamadasNaTela = pronto && !comprimido && !selando
  const contarSlug = (s: string) => pilha.filter((i) => i.slug === s).length

  // O leque dos rótulos da coluna de chamadas (só em `amplo`, onde a coluna existe). A
  // ordem física vai de baixo (índice 0) para cima; a leitura na tela vai de cima para
  // baixo — por isso o `topoObjeto` de cada camada, que decresce com o índice, já chega
  // ordenado ao percorrer os índices do maior para o menor. `distribuirRotulos` preserva
  // essa ordem por construção (ver `rotulos.ts`) e nunca a inverte.
  const rotuloTopPorIndice: number[] = []
  if (chamadasNaTela && amplo && numerada.length) {
    const doTopoParaBase = numerada.map((_, i) => i).reverse()
    const ideais = doTopoParaBase.map(
      (i) => medidas(MAPA_CAMADAS[slugs[i]], i, g).topoObjeto - TOQUE_MIN / 2,
    )
    const distribuidos = distribuirRotulos(ideais, TOQUE_MIN)
    doTopoParaBase.forEach((i, j) => {
      rotuloTopPorIndice[i] = distribuidos[j]
    })
  }

  return (
    <div id="rx-takeover" aria-label={`Raio-x do ${nome}`}>
      <header
        id="rx-cabeca"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px 24px',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--traco)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--fonte-display), Georgia, serif',
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            fontVariationSettings: "'opsz' 72, 'wght' 780, 'SOFT' 12, 'WONK' 1",
            lineHeight: 1,
            color: 'var(--osso)',
          }}
        >
          {nome}
        </h2>
      </header>

      <div
        id="rx-painel"
        data-prensado={g.prensa ? '' : undefined}
        // Quando a pilha não cabe, a folga entre camadas cede primeiro (até `PISO_FOLGA`),
        // e só depois a escala (até `PISO_ESCALA`, em prensa.ts). O painel só rola quando
        // nem o mínimo dos dois coube na altura disponível — aí, e só aí, `estourou`.
        data-estourou={g.estourou ? '' : undefined}
        data-escala={pronto ? g.k.toFixed(4) : undefined}
        data-escala-natural={pronto ? g.escalaNatural.toFixed(4) : undefined}
        data-folga={pronto ? g.folga.toFixed(4) : undefined}
        style={g.estourou ? { overflowY: 'auto', overflowX: 'hidden' } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/macro/macro-chapa.webp"
          alt=""
          aria-hidden="true"
          width={2000}
          height={1333}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.1,
            pointerEvents: 'none',
          }}
        />

        <div ref={desenhoRef} id="rx-desenho" onPointerDown={arrastarCamada} onKeyDown={aoTeclar}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            id="rx-chapa-fundo"
            src="/chapa/chapa-vazia.webp"
            alt=""
            aria-hidden="true"
            width={2400}
            height={1600}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: selando || selado ? 0.9 : 0,
              transition: 'opacity 200ms linear',
              pointerEvents: 'none',
            }}
          />

          {n === 0 && (
            <p
              style={{
                position: 'absolute',
                inset: 0,
                margin: 0,
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                color: 'var(--osso)',
                opacity: 0.5,
              }}
            >
              Comece pelo pão: toque num ingrediente.
            </p>
          )}

          <div id="rx-pilha" style={{ position: 'absolute', inset: 0 }}>
            {pronto &&
              numerada.map(({ inst, n: ord }, i) => (
                <Camada
                  key={inst.uid}
                  camada={MAPA_CAMADAS[inst.slug]}
                  uid={inst.uid}
                  n={ord}
                  indice={i}
                  slugs={slugs}
                  g={g}
                  estado={estado}
                  transicao={transicao}
                />
              ))}
          </div>

          {/* As tiras de toque ficam acima das camadas e abaixo das chamadas: são o alvo
              de dedo de cada camada, e o vão entre elas cai de volta na camada. */}
          {pronto && !selando && !selado && (
            <div
              id="rx-toques"
              style={{ position: 'absolute', inset: 0, zIndex: 26, pointerEvents: 'none' }}
            >
              {numerada.map(({ inst }, i) => {
                const { topo, base } = faixaDe(i)
                return (
                  <TiraDeToque key={inst.uid} indice={i} topo={topo} base={base} alturaArea={area.h} />
                )
              })}
            </div>
          )}

          {/* As chamadas somem enquanto a pilha fecha: ler nome de camada em movimento
              não funciona, e depois de prensada a pilha não tem mais o que apontar.
              Abaixo do corte só a camada tocada mostra a dela — em 390px a pilha ocupa a
              largura inteira e não sobra coluna para dez rótulos. */}
          {chamadasNaTela &&
            amplo &&
            numerada.map(({ inst, n: ord }, i) => (
              <Chamada
                key={inst.uid}
                camada={MAPA_CAMADAS[inst.slug]}
                n={ord}
                indice={i}
                g={g}
                rotuloTop={rotuloTopPorIndice[i]}
              />
            ))}

          {chamadasNaTela && !amplo && aberta !== null && (
            <ChamadaChip
              key={numerada[aberta].inst.uid}
              camada={MAPA_CAMADAS[numerada[aberta].inst.slug]}
              n={numerada[aberta].n}
              indice={aberta}
              g={g}
              alturaArea={area.h}
              onTirar={remover}
            />
          )}

          {varrendo && (
            <>
              <div
                id="rx-varredura"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: '46%',
                  pointerEvents: 'none',
                  background:
                    'linear-gradient(to top, rgba(169,118,47,0) 0%, rgba(169,118,47,0.5) 46%, rgba(169,118,47,0) 100%)',
                  mixBlendMode: 'screen',
                  animation: 'rx-varredura 1200ms ease-out forwards',
                }}
              />
              <div
                id="rx-ar"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '8%',
                  right: '8%',
                  top: '4%',
                  height: '14%',
                  pointerEvents: 'none',
                  transformOrigin: 'bottom center',
                  background: 'linear-gradient(to top, rgba(169,118,47,0.22), rgba(169,118,47,0))',
                  animation: 'rx-ar 1200ms ease-in-out forwards',
                }}
              />
            </>
          )}
        </div>
      </div>

      {composicao && (
        <Composicao pilha={pilha} onTirar={remover} onFechar={() => setComposicao(false)} />
      )}

      <Medidor
        precoCent={precoDaComposicao(pilha.map((i) => i.slug))}
        camadas={n}
        pct={pct}
        aviso={aviso}
        recado={recado}
        transicaoBarra={g.prensa ? `${PRENSA_MS}ms ${PRENSA_CURVA}` : '420ms cubic-bezier(.2,.7,.3,1)'}
        onVerComposicao={() => {
          setTrilhoAberto(modoMontador)
          setComposicao((v) => !v)
        }}
        flutuaRef={flutuaRef}
      />

      {/* Editor: o lanche já chega pronto, acrescentar ingrediente é a ação secundária —
          o trilho nasce recolhido atrás deste botão e só ocupa tela quando aberto como
          folha, abaixo. Montador: sem alternância, a tira de sempre — é a ação principal
          ali. Ver o comentário de `modoMontador`. */}
      {modoMontador ? (
        <Trilho
          contarSlug={contarSlug}
          ausentes={ausentes}
          bloqueado={selando || selado}
          cheio={n >= MAX_CAMADAS}
          onAdicionar={aoEscolherDoTrilho}
          onArrastar={arrastarDoTrilho}
        />
      ) : (
        <button
          id="rx-abrir-trilho"
          type="button"
          disabled={selando || selado}
          onClick={() => {
            setComposicao(false)
            setTrilhoAberto(true)
          }}
        >
          Acrescentar ingrediente
        </button>
      )}

      {!modoMontador && trilhoAberto && (
        <div
          id="rx-trilho-cortina"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTrilhoAberto(false)
          }}
        >
          <div id="rx-trilho-folha" role="group" aria-label="Ingredientes disponíveis">
            <div id="rx-trilho-folha-cabeca">
              <span style={{ fontVariationSettings: "'wdth' 92, 'wght' 600", fontSize: '0.875rem' }}>
                Ingredientes
              </span>
              <button
                id="rx-fechar-trilho"
                type="button"
                onClick={() => setTrilhoAberto(false)}
                aria-label="Fechar ingredientes"
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
            <Trilho
              folha
              contarSlug={contarSlug}
              ausentes={ausentes}
              bloqueado={selando || selado}
              cheio={n >= MAX_CAMADAS}
              onAdicionar={aoEscolherDoTrilho}
              onArrastar={arrastarDoTrilho}
            />
          </div>
        </div>
      )}

      <BotaoSelar
        podeFechar={n > 0 && !selado && !selando}
        texto={
          selado
            ? 'No papel'
            : selando
              ? ehPrensado
                ? 'Prensando…'
                : 'Selando…'
              : ehPrensado
                ? 'Prensar na chapa'
                : 'Selar na chapa'
        }
        onSelar={fechamento}
      />
    </div>
  )
}
