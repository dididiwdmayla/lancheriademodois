// QA visual — desenhado para custar POUCOS TOKENS ao agente que vai olhar.
//
// Duas camadas, nesta ordem:
//   1. Asserções numéricas em texto. Uma linha por checagem, custo desprezível.
//      A maior parte dos defeitos aparece aqui e nunca precisa de imagem.
//   2. UMA folha de contato: os recortes reunidos num único JPEG, qualidade 55.
//      Capturas separadas em 2x custariam mais de dez vezes mais tokens.
//
// Regra para o agente: leia o texto primeiro. Só abra a folha de contato se uma
// asserção falhar ou se a tarefa for de julgamento visual. Nunca capture a página
// inteira em 2x — é o jeito mais rápido de queimar a janela de contexto.
//
// Linhas começadas por `pula` são checagens cujo alvo ainda não foi portado. Elas dizem
// qual fase traz o alvo. Nunca transforme uma delas em `ok` sem o alvo existir.
//
// A passada principal é 390 × 844 — o alvo do contrato. No fim há uma segunda, em
// 900 × 800, só para o que muda de comportamento do outro lado do corte.
//
// uso:  node scripts/qa-visual.mjs [url]

import { chromium } from 'playwright'
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs'

/** Caixa de cada silhueta, a mesma que a sombra de contato usa. Nenhuma imagem é lida. */
const CAIXAS = JSON.parse(readFileSync('data/baselines.json', 'utf8'))
const larguraDe = (slug) => CAIXAS[slug].caixa[2] - CAIXAS[slug].caixa[0]
/** Teto do fator de espalhamento. Duplicado de `prensa.ts` pelo mesmo motivo de
 * `larguraDe`: este script é puro Node, sem passar pelo build do TypeScript. */
const ESPALHA_X_TETO = 1.3
/** Piso da escala da pilha pela altura e teto de camadas. Duplicados de `prensa.ts` e
 * `casa.ts` pelo mesmo motivo de `ESPALHA_X_TETO`. */
const PISO_ESCALA = 0.70
/** Piso da folga entre camadas, como fração da folga base. Cede antes da escala — ver
 * `PISO_FOLGA` em `prensa.ts`. Duplicado aqui pelo mesmo motivo de `PISO_ESCALA`. */
const PISO_FOLGA = 0.40
const MAX_CAMADAS_QA = 16
const MAX_REPETICOES_QA = 3

const URL = process.argv[2] ?? 'http://localhost:3000'
const LARGURA_RECORTE = 360
const QUALIDADE = 55

/** Onde as chamadas do raio-x têm mais o que apontar: dez camadas. */
const LANCHE_CHEIO = 'prensado-completo'
/** Seis camadas, o mais magro dos quatro. É nele que a fresta da prensa aparece primeiro. */
const LANCHE_MAGRO = 'prensado-calabresa'
const PRENSADOS = ['prensado-completo', 'prensado-frango', 'prensado-calabresa', 'prensado-meia-noite']
const REDONDOS = ['x-salada', 'x-tudo']

/** Piso da exposição: nenhuma camada some atrás da de cima. */
const EXPOSICAO_MIN = 0.45
/** Alvo de toque mínimo do contrato, em px. Vale para camada, chamada, ficha e botão. */
const TOQUE_MIN = 44
/** O corte do AGENTS.md: abaixo dele o desenho é o do celular. */
const CORTE_AMPLO = 900
const CELULAR = { width: 390, height: 844 }
/** A segunda passada, do outro lado do corte: as chamadas voltam todas. */
const AMPLO = { width: 900, height: 800 }
/** Depois de mandar prensar: 60ms de espera + 340ms de prensa. Antes do despacho, aos 660ms. */
const ESPERA_PRENSA_MS = 430

mkdirSync('qa', { recursive: true })

// Em alguns ambientes de execução (contêiner efêmero do Claude Code), o download do
// Chromium do Playwright é bloqueado e um binário já vem pré-instalado num caminho fixo.
// Fora desses ambientes essa variável/caminho não existem e o Playwright resolve sozinho.
const CHROMIUM_FIXO = '/opt/pw-browsers/chromium'
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ?? (existsSync(CHROMIUM_FIXO) ? CHROMIUM_FIXO : undefined)

const navegador = await chromium.launch(executablePath ? { executablePath } : undefined)
const ctx = await navegador.newContext({
  viewport: CELULAR,
  deviceScaleFactor: 1, // nunca 2 — dobra o peso da imagem sem ajudar o julgamento
})

// Instrumenta o protótipo do contexto 2D antes de qualquer script da página rodar.
// A sombra de contato vem de baselines.json; ler pixel de volta em runtime é proibido.
await ctx.addInitScript(() => {
  const proto = CanvasRenderingContext2D.prototype
  const original = proto.getImageData
  window.__lidoDeVolta = 0
  proto.getImageData = function (...args) {
    window.__lidoDeVolta++
    return original.apply(this, args)
  }
})

const pg = await ctx.newPage()

// Exceção não tratada de página é um FALHA, não um crash silencioso do script.
const excecoes = []
pg.on('pageerror', (erro) => excecoes.push(String(erro)))

const linhas = []
const recortes = []
const diz = (ok, txt) => linhas.push(`${ok ? 'ok  ' : 'FALHA'} ${txt}`)
const pula = (txt, fase) => linhas.push(`pula  ${txt} — chega na fase: ${fase}`)

async function recorte(nome, seletor, pagina = pg) {
  const el = await pagina.$(seletor)
  if (!el) { diz(false, `${nome}: seletor ${seletor} não encontrado`); return }
  const buf = await el.screenshot({ type: 'jpeg', quality: QUALIDADE })
  recortes.push({ nome, b64: buf.toString('base64') })
}

/**
 * Reabre a folha do trilho se ela estiver fechada — modo editor, onde `#rx-abrir-trilho`
 * fica no lugar do trilho por padrão. Cada escolha do trilho fecha a folha de novo (ver
 * `aoEscolherDoTrilho` em `RaioX.tsx`), então isto tem de rodar antes de CADA clique num
 * ingrediente, não só uma vez. No modo montador `#rx-abrir-trilho` nunca existe — o trilho
 * já está aberto — e a função não faz nada.
 */
async function abrirTrilhoSeRecolhido(pagina) {
  const abrir = await pagina.$('#rx-abrir-trilho:not([disabled])')
  if (!abrir) return
  await abrir.click()
  await pagina.waitForSelector('#rx-trilho-folha', { timeout: 3000 })
}

/** Abre o raio-x com uma composição do cardápio e espera a pilha existir. */
async function abrir(slug) {
  await pg.goto(`${URL}/?lanche=${slug}`, { waitUntil: 'networkidle' })
  await pg.waitForSelector('#rx-pilha [id^="rx-camada-"]', { timeout: 5000 })
  // A pilha só é desenhada depois que o ResizeObserver mede o painel.
  await pg.waitForTimeout(120)
}

/**
 * Rola o raio-x para dentro da viewport. Alinha o TAKEOVER, não o painel: o terço inferior
 * só quer dizer alguma coisa quando o raio-x está ocupando a tela como ocupa em uso — do
 * topo até a barra do pedido. Alinhar o painel jogaria o cabeçalho para fora e mediria uma
 * tela que ninguém vê.
 */
async function encarar() {
  await pg.evaluate(() => document.getElementById('rx-takeover')?.scrollIntoView({ block: 'start' }))
  await pg.waitForTimeout(80)
}

/**
 * Rolagem horizontal acidental — o defeito mais comum de mobile, e medível. Rolagem
 * declarada (o trilho) é decisão de desenho e não conta; o que se procura é conteúdo
 * estourando a caixa de quem não foi feito para rolar.
 */
async function estorvosHorizontais(pagina) {
  return pagina.evaluate(() => {
    const fora = []
    const nome = (e) => e.id || `${e.tagName.toLowerCase()}${e.className ? '.' + String(e.className).split(' ')[0] : ''}`
    for (const e of document.querySelectorAll('body, body *')) {
      const cs = getComputedStyle(e)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') continue
      if (e.clientWidth === 0) continue
      // Reticências de uma linha (overflow:hidden + white-space:nowrap + text-overflow:
      // ellipsis) cortam de propósito: o texto que sobra não pinta fora da caixa, só
      // engorda o scrollWidth. Não é a caixa estourando por quem não foi feita pra rolar.
      if (cs.overflowX === 'hidden' && cs.whiteSpace === 'nowrap' && cs.textOverflow === 'ellipsis') continue
      if (e.scrollWidth > e.clientWidth + 1) fora.push(`${nome(e)} ${e.scrollWidth}>${e.clientWidth}`)
    }
    const raiz = document.documentElement
    if (raiz.scrollWidth > raiz.clientWidth + 1) fora.push(`html ${raiz.scrollWidth}>${raiz.clientWidth}`)
    return fora
  })
}

/** Todo alvo acionável mede pelo menos 44 × 44. Contrato, e ele também é medível. */
async function alvosPequenos(pagina, min) {
  return pagina.evaluate((m) => {
    const sel = 'button, [role="button"], a[href], input, select, textarea, summary'
    return [...document.querySelectorAll(sel)]
      .filter((e) => {
        const cs = getComputedStyle(e)
        if (cs.display === 'none' || cs.visibility === 'hidden') return false
        const r = e.getBoundingClientRect()
        return r.width > 0 && r.height > 0 && (r.width < m - 0.5 || r.height < m - 0.5)
      })
      .map((e) => {
        const r = e.getBoundingClientRect()
        const quem = e.id || e.dataset.slug || (e.textContent || '').trim().slice(0, 16) || e.tagName
        return `${quem} ${Math.round(r.width)}×${Math.round(r.height)}`
      })
  }, min)
}

/**
 * Sela a composição atual e lê, do próprio DOM — não de uma cópia da constante, que é
 * justamente o que pegaria divergência com `prensa.ts` — o fator aplicado ao recheio mais
 * largo. Só mede; não julga se o alcance está certo, porque o "certo" depende da
 * composição: nas seis fixas o recheio tem de alcançar o pão, mas um recheio estreito de
 * propósito pode bater no teto sem alcançar — vão esperado, não falha. Quem decide a
 * asserção é o chamador.
 */
async function medirFresta() {
  const camadas = await pg.evaluate(() =>
    [...document.querySelectorAll('#rx-pilha [id^="rx-camada-"]')].map((e) => ({
      id: e.id.replace('rx-camada-', ''),
    })))
  const naPilha = camadas.map((c) => ({ inst: c.id, slug: c.id.replace(/-\d+$/, '') }))
  const pao = larguraDe(naPilha[0].slug)
  const maisLargo = naPilha
    .filter((c) => !c.slug.startsWith('pao-'))
    .reduce((a, c) => (larguraDe(c.slug) > larguraDe(a.slug) ? c : a))

  // Lê o `style` declarado, não o computado: o computado devolve o valor no meio da
  // transição de 340ms, e um relógio fixo aqui corre contra a máquina de estados — na
  // navegação mais pesada do loop ele chegava a ler 1.000, com a prensa ainda parada.
  // O alvo declarado não tem quadro intermediário; esperar por ele dispensa o relógio.
  await pg.waitForSelector('#rx-selar:not([disabled])', { timeout: 5000 })
  await pg.click('#rx-selar')
  const fator = await pg
    .waitForFunction(
      (inst) => {
        const el = document.getElementById(`rx-camada-${inst}`)
        const m = el && /scaleX\(([\d.]+)\)/.exec(el.style.transform || '')
        return m ? Number(m[1]) : false
      },
      maisLargo.inst,
      { timeout: 3000, polling: 16 },
    )
    .then((h) => h.jsonValue())
  const alcance = Math.round(larguraDe(maisLargo.slug) * fator)
  return { maisLargo: maisLargo.slug, pao, fator, alcance }
}

/**
 * A escala e a folga aplicadas à pilha, e se ela bateu no piso, direto dos atributos que
 * `RaioX.tsx` expõe em `#rx-painel` (`data-escala`, `data-escala-natural`, `data-folga`,
 * `data-estourou`) — nenhum recálculo aqui, só leitura do que o componente já decidiu.
 *
 * Não mede `scrollHeight`: cada camada embrulha o canvas de 1200px inteiro do arquivo
 * (o objeto raramente ocupa tudo), então a caixa da camada estoura `#rx-painel` mesmo
 * quando o desenho visível cabe sobrando — `overflow: hidden` corta essa transparência de
 * propósito. `estourou` é o sinal correto: só é `true` quando a conta do componente não
 * coube nem com a folga no piso e a escala no piso, e é aí, e só aí, que o painel precisa
 * rolar de verdade.
 */
async function medirEscala(pagina = pg) {
  return pagina.evaluate(() => {
    const el = document.getElementById('rx-painel')
    if (!el) return null
    return {
      escala: Number(el.dataset.escala),
      escalaNatural: Number(el.dataset.escalaNatural),
      folga: Number(el.dataset.folga),
      estourou: el.dataset.estourou !== undefined,
    }
  })
}

/**
 * Uma asserção só, para as três chamadoras: as seis composições fixas (`exigirSemRolagem`
 * true) e o sintético de 16 camadas (false — é o único autorizado a rolar). Cobra sempre
 * os dois pisos, porque `folga` e `escala` nunca saem dos limites por construção; cobra
 * `!estourou` só quando quem chama exige que a pilha caiba sem rolar.
 */
function validaGeometria(e, rotulo, exigirSemRolagem) {
  const okFolga = e.folga >= PISO_FOLGA - 1e-6 && e.folga <= 1 + 1e-6
  const okEscala = e.escala >= e.escalaNatural * PISO_ESCALA - 1e-6
  const okRolagem = !exigirSemRolagem || !e.estourou
  diz(
    okFolga && okEscala && okRolagem,
    `${rotulo}: escala aplicada ${e.escala.toFixed(3)} (natural ${e.escalaNatural.toFixed(3)}, piso ${PISO_ESCALA}× natural)` +
      `, folga aplicada ${e.folga.toFixed(3)} (piso ${PISO_FOLGA})` +
      `${e.estourou ? ' — BATEU NO PISO, painel rola' : ', sem rolagem'}`,
  )
}

// ---------- 1. asserções numéricas ----------

await abrir(LANCHE_CHEIO)

// intro do letreiro concluída
await pg.waitForTimeout(2200)
// as propriedades moram no #lt-svg, não na raiz: a asserção vai onde o código está
const acende = await pg.evaluate(() => {
  const svg = document.getElementById('lt-svg')
  return svg ? getComputedStyle(svg).getPropertyValue('--lt-acende').trim() : 'sem-svg'
})
diz(acende === '1', `letreiro estabilizado (#lt-svg --lt-acende=${acende || 'n/d'})`)

pula('itens do cardápio na primeira tela', 'cardápio em grade')
pula('filtro por ingrediente como eixo separado', 'cardápio em grade')

// Fator, recheio mais largo e alcance de cada prensado — o relatório final soma o
// sintético a esta mesma lista.
const frestas = []
// Escala aplicada à pilha em cada composição fixa — o relatório final soma a de 16
// camadas a esta mesma lista.
const escalas = []

// Teto de afundamento: nenhuma camada some atrás da de cima. É o teste do tomate, e ele
// roda em todas as composições do cardápio — não só na que tem mais recheio.
for (const slug of [...PRENSADOS, ...REDONDOS]) {
  await abrir(slug)
  const camadas = await pg.evaluate(() =>
    [...document.querySelectorAll('#rx-pilha [id^="rx-camada-"]')].map((e) => ({
      id: e.id.replace('rx-camada-', ''),
      frac: Number(e.dataset.expostoPx) / Number(e.dataset.alturaPx),
    })))
  if (!camadas.length) { diz(false, `${slug}: pilha vazia`); continue }
  const pior = camadas.reduce((a, b) => (b.frac < a.frac ? b : a))
  diz(
    pior.frac >= EXPOSICAO_MIN - 1e-6,
    `${slug}: menor exposição ${(pior.frac * 100).toFixed(1)}% em ${pior.id} (piso ${EXPOSICAO_MIN * 100}%)`,
  )

  // A contagem que o medidor mostra é a mesma pilha que o painel desenha.
  const bate = await pg.evaluate(() => {
    const nos = document.querySelectorAll('#rx-pilha [id^="rx-camada-"]').length
    const txt = document.getElementById('rx-camadas-valor')?.textContent ?? ''
    const lido = txt === 'painel vazio' ? 0 : Number(txt.match(/\d+/)?.[0] ?? -1)
    return { nos, lido }
  })
  diz(bate.nos === bate.lido, `${slug}: medidor diz ${bate.lido}, painel desenha ${bate.nos} camadas`)

  // A pilha cabe na altura disponível sem rolar: a folga cede primeiro (até o piso
  // `PISO_FOLGA`), a escala só depois (até `PISO_ESCALA`) — ver "Quando a pilha não cabe
  // na altura" no AGENTS.md. `#rx-painel` expõe os três números.
  const escala = await medirEscala()
  if (escala) {
    escalas.push({ rotulo: slug, ...escala })
    validaGeometria(escala, slug, true)
  } else {
    diz(false, `${slug}: #rx-painel sem atributos de escala`)
  }

  // As duas composições que o relatório pediu de olho: o x-tudo, que bateu no piso de
  // escala antes da folga ceder primeiro, e o prensado-completo (recortado mais abaixo,
  // reaberto para o resto da passada de celular).
  if (slug === 'x-tudo') await recorte('x-tudo explodido em 390px', '#rx-desenho')

  if (!PRENSADOS.includes(slug)) continue
  // Fresta da prensa: o recheio mais largo, já espalhado em scaleX, tem de alcançar a
  // largura do pão — senão as duas metades se encostam sem nada entre elas nas pontas.
  const fresta = await medirFresta()
  frestas.push({ rotulo: slug, ...fresta })
  diz(
    fresta.alcance >= fresta.pao,
    `${slug}: prensado, recheio mais largo é ${fresta.maisLargo}, alcança ${fresta.alcance}` +
      ` de ${fresta.pao} do pão (scaleX ${fresta.fator.toFixed(3)}` +
      `${fresta.alcance >= fresta.pao ? '' : `, ${fresta.pao - fresta.alcance}px a menos`})`,
  )
}

// Caso sintético: um lanche fora dos seis fixos, só pão + molho + tomate — os dois
// recheios mais estreitos do cardápio. Nenhum fixo tem essa composição; ela nasce aqui
// pelos mesmos gestos do cliente: Delete tira pelo teclado, o trilho põe. Existe para
// confirmar que o fator bate no teto de 1.30 sem lançar exceção, não só nas seis
// composições fixas.
await abrir(LANCHE_MAGRO)
// Em 390px as chamadas nascem ocultas, então o caminho de tirar camada é a lista de
// composição — que é justamente o equivalente por toque exigido pelo contrato. O caminho
// por teclado (Delete na chamada) é cobrado na passada de 900px, onde as chamadas moram.
await pg.click('#rx-ver-composicao')
await pg.waitForSelector('#rx-composicao', { timeout: 3000 })
while ((await pg.evaluate(() => document.querySelectorAll('#rx-pilha [id^="rx-camada-"]').length)) > 2) {
  const tirar = await pg.$('#rx-composicao [data-tirar]')
  if (!tirar) break
  await tirar.click()
  await pg.waitForTimeout(60)
}
await pg.click('#rx-fechar-composicao')
await pg.waitForTimeout(60)
await abrirTrilhoSeRecolhido(pg)
await pg.click('#rx-trilho [data-slug="molho"]')
await pg.waitForTimeout(80)
await abrirTrilhoSeRecolhido(pg)
await pg.click('#rx-trilho [data-slug="tomate"]')
await pg.waitForTimeout(80)
const composto = await pg.evaluate(() =>
  [...document.querySelectorAll('#rx-pilha [id^="rx-camada-"]')].map((e) =>
    e.id.replace(/^rx-camada-/, '').replace(/-\d+$/, '')))
diz(
  composto.join('+') === 'pao-prensado-base+molho+tomate+pao-prensado-topo',
  `sintético: composição montada é ${composto.join(' + ') || 'vazia'}`,
)
const excecoesAntes = excecoes.length
const sintetico = await medirFresta()
frestas.push({ rotulo: 'sintético: pão + molho + tomate', ...sintetico })
// Aqui o teste NÃO é alcance >= pão: com recheio tão estreito o fator bate no teto e
// sobra vão de propósito (ver AGENTS.md). O que importa é o teto ter sido respeitado e
// nada ter quebrado ao selar.
diz(
  sintetico.fator >= ESPALHA_X_TETO - 1e-6,
  `sintético: fator bateu no teto (${sintetico.fator.toFixed(3)} contra ${ESPALHA_X_TETO.toFixed(3)})` +
    ` — alcança ${sintetico.alcance} de ${sintetico.pao} do pão, vão esperado`,
)
diz(
  excecoes.length === excecoesAntes,
  `sintético: exceções lançadas ao selar ${excecoes.length - excecoesAntes}`,
)

// nenhuma medição em --latao
await abrir(LANCHE_CHEIO)
const quenteErrado = await pg.evaluate(() => {
  const latao = getComputedStyle(document.documentElement).getPropertyValue('--latao').trim()
  const hex = (c) => { const m = c.match(/\d+/g); return m ? '#' + m.slice(0,3)
    .map((n) => (+n).toString(16).padStart(2,'0')).join('').toUpperCase() : '' }
  return [...document.querySelectorAll('#rx-medidor [data-medida]')]
    .filter((e) => hex(getComputedStyle(e).color) === latao.toUpperCase()).length
})
diz(quenteErrado === 0, `medições em --latao: ${quenteErrado} (regra de temperatura)`)

// mono fora do medidor
const monoVazado = await pg.evaluate(() =>
  [...document.querySelectorAll('body *')].filter((e) => {
    const f = getComputedStyle(e).fontFamily.toLowerCase()
    if (!f.includes('plex mono')) return false
    return !e.closest('#rx-medidor, [data-preco], [data-carimbo]')
  }).length)
diz(monoVazado === 0, `Plex Mono fora do medidor/preço/carimbo: ${monoVazado}`)

// nenhum placeholder de imagem
const quebradas = await pg.evaluate(() =>
  [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).length)
diz(quebradas === 0, `imagens quebradas: ${quebradas}`)

// ---------- 2. o desenho de celular, em 390 × 844 ----------

await encarar()

// Rolagem horizontal acidental. O trilho rola de propósito e está de fora.
const estorvos = await estorvosHorizontais(pg)
diz(
  estorvos.length === 0,
  `sem rolagem horizontal acidental em ${CELULAR.width}px${estorvos.length ? `: ${estorvos.join(', ')}` : ''}`,
)

// Alvo de toque. Inclui as tiras de toque das camadas, que são o alvo de dedo da pilha.
const pequenos = await alvosPequenos(pg, TOQUE_MIN)
diz(
  pequenos.length === 0,
  `alvos acionáveis abaixo de ${TOQUE_MIN}×${TOQUE_MIN}: ${pequenos.length}${pequenos.length ? ` — ${pequenos.join(', ')}` : ''}`,
)

// Olhar em cima, tocar embaixo: medidor, trilho (ou o botão que fica no lugar dele, no
// modo editor com o trilho recolhido — ver "trilho recolhível" abaixo) e botão inteiros
// no terço inferior.
const terco = await pg.evaluate(() => {
  const caixa = (id) => {
    const r = document.getElementById(id)?.getBoundingClientRect()
    return r ? { topo: r.top, base: r.bottom } : null
  }
  return {
    altura: window.innerHeight,
    medidor: caixa('rx-medidor'),
    trilho: caixa('rx-trilho') ?? caixa('rx-abrir-trilho'),
    selar: caixa('rx-selar'),
  }
})
const linhaDoPolegar = (terco.altura * 2) / 3
for (const [nome, c] of [['medidor', terco.medidor], ['trilho', terco.trilho], ['botão de prensar', terco.selar]]) {
  diz(
    !!c && c.topo >= linhaDoPolegar - 0.5 && c.base <= terco.altura + 0.5,
    `${nome} no terço inferior: ${c ? `${c.topo.toFixed(0)}–${c.base.toFixed(0)}px` : 'não encontrado'}` +
      ` (zona começa em ${linhaDoPolegar.toFixed(0)}px, tela ${terco.altura}px)`,
  )
}

// Em repouso a pilha aparece limpa: nenhuma chamada na tela.
const chamadasEmRepouso = await pg.evaluate(() => document.querySelectorAll('[data-chamada]').length)
diz(chamadasEmRepouso === 0, `chamadas visíveis em repouso: ${chamadasEmRepouso} (esperado 0 no celular)`)

// A menor faixa de camada da pilha desenhada. Não é asserção de aprovação: é o número que
// diz por que a tira de toque precisa de piso de 44px, e por que a lista de composição é o
// caminho garantido de toda camada. Ver o Risco do relatório.
const faixas = await pg.evaluate(() =>
  [...document.querySelectorAll('#rx-toques [data-toque]')].map((e) => Number(e.dataset.faixa)))
if (faixas.length) {
  linhas.push(
    `      faixa das camadas na pilha: menor ${Math.min(...faixas).toFixed(0)}px,` +
      ` maior ${Math.max(...faixas).toFixed(0)}px (tira de toque tem piso de ${TOQUE_MIN}px)`,
  )
}

// ---------- trilho recolhível ----------
//
// Editor (raio-x aberto a partir de um fixo — o estado em que `pg` já está, desde
// `abrir(LANCHE_CHEIO)` no início da seção 1): o trilho nasce recolhido atrás de
// #rx-abrir-trilho, e só existe em tela como #rx-trilho quando aberto como folha.
const editorFechado = await pg.evaluate(() => ({
  abrirExiste: !!document.getElementById('rx-abrir-trilho'),
  trilhoExiste: !!document.getElementById('rx-trilho'),
}))
diz(
  editorFechado.abrirExiste && !editorFechado.trilhoExiste,
  `modo editor nasce com o trilho recolhido: #rx-abrir-trilho ${editorFechado.abrirExiste ? 'presente' : 'ausente'}` +
    `, #rx-trilho ${editorFechado.trilhoExiste ? 'presente' : 'ausente'}`,
)

// Abre a folha para o resto da passada: a ficha aqui dentro vem de /camadas/, a camada
// inteira — o recorte apertado de /fichas/ lê bem a 56px e vira abstrato acima disso (ver
// `data-folha` em `Trilho.tsx` e AGENTS.md).
await pg.click('#rx-abrir-trilho')
await pg.waitForSelector('#rx-trilho-folha', { timeout: 3000 })

// Na folha nenhuma ficha carrega de /fichas/: acima de 56px o recorte apertado vira
// abstrato (o molho parece um pôr do sol), e é `/camadas/` que mantém a silhueta legível.
const fichasErradasNaFolha = await pg.evaluate(() =>
  [...document.querySelectorAll('#rx-trilho [data-ficha-foto]')]
    .map((e) => getComputedStyle(e).backgroundImage)
    .filter((bg) => bg.includes('/fichas/') || !bg.includes('/camadas/')))
diz(
  fichasErradasNaFolha.length === 0,
  `fichas da folha fora de /camadas/: ${fichasErradasNaFolha.length}` +
    `${fichasErradasNaFolha.length ? ` — ${fichasErradasNaFolha.join(', ')}` : ''}`,
)

await recorte('trilho aberto como folha, em 390px', '#rx-trilho-folha')
await pg.click('#rx-fechar-trilho')
await pg.waitForTimeout(120)
await recorte('raio-x em 390px com o trilho recolhido', '#rx-takeover')

// Montador ("Monte o seu"): nasce com o trilho aberto, sem o botão — a ação principal ali
// não passa por folha. Rota provisória `?lanche=montar`, ver o comentário em `page.tsx`.
await pg.goto(`${URL}/?lanche=montar`, { waitUntil: 'networkidle' })
await pg.waitForSelector('#rx-takeover', { timeout: 5000 })
const montadorAberto = await pg.evaluate(() => ({
  trilhoExiste: !!document.getElementById('rx-trilho'),
  abrirExiste: !!document.getElementById('rx-abrir-trilho'),
}))
diz(
  montadorAberto.trilhoExiste && !montadorAberto.abrirExiste,
  `modo montador nasce com o trilho aberto: #rx-trilho ${montadorAberto.trilhoExiste ? 'presente' : 'ausente'}` +
    `, #rx-abrir-trilho ${montadorAberto.abrirExiste ? 'presente' : 'ausente'}`,
)

// volta ao lanche cheio para o resto da passada de celular (recortes, aviso, 16 camadas).
await abrir(LANCHE_CHEIO)
await encarar()

// ---------- 3. recortes ----------

// explodido e medidor normal saem do lanche cheio: dez camadas.
await recorte('prensado-completo explodido em 390px', '#rx-desenho')

// Um toque na camada revela a chamada dela — e só a dela. O toque vai pelo mouse, em
// coordenada: é o que um dedo faz. `click(seletor)` faria a checagem de acionabilidade do
// Playwright, que não sabe que tira sobreposta é o desenho, não um defeito.
const alvoToque = await pg.evaluate(() => {
  const t = document.querySelector('#rx-toques [data-toque="4"]')
  if (!t) return null
  const r = t.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
})
if (alvoToque) await pg.mouse.click(alvoToque.x, alvoToque.y)
await pg.waitForTimeout(120)
const reveladas = await pg.evaluate(() => document.querySelectorAll('[data-chamada]').length)
diz(reveladas === 1, `toque na camada revela ${reveladas} chamada (esperado 1)`)
await recorte('raio-x com uma chamada revelada', '#rx-desenho')
await recorte('medidor · faixa horizontal, 10 camadas', '#rx-medidor')

// A ficha de 56px, truncada, só existe hoje na tira sempre aberta do modo montador — no
// editor ela mora dentro da folha, maior e sem reticências (recorte já feito acima, em
// "trilho recolhível"). Página à parte para não perturbar o estado de `pg` (dez camadas,
// chamada revelada) no meio da passada.
{
  const pgMontador = await ctx.newPage()
  await pgMontador.goto(`${URL}/?lanche=montar`, { waitUntil: 'networkidle' })
  await pgMontador.waitForSelector('#rx-trilho', { timeout: 5000 })
  // Na tira de 56px é o oposto da folha: nenhuma ficha carrega de /camadas/, senão a
  // camada inteira encolhida perde a silhueta e sobra a cor média — ver AGENTS.md.
  const fichasErradasNaTira = await pgMontador.evaluate(() =>
    [...document.querySelectorAll('#rx-trilho [data-ficha-foto]')]
      .map((e) => getComputedStyle(e).backgroundImage)
      .filter((bg) => bg.includes('/camadas/') || !bg.includes('/fichas/')))
  diz(
    fichasErradasNaTira.length === 0,
    `fichas da tira de 56px fora de /fichas/: ${fichasErradasNaTira.length}` +
      `${fichasErradasNaTira.length ? ` — ${fichasErradasNaTira.join(', ')}` : ''}`,
  )
  await recorte('trilho · fichas de 56px (modo montador)', '#rx-trilho', pgMontador)
  await pgMontador.close()
}

// aviso: uma camada acima do limiar. Entra pelo trilho, que é o gesto sem arrasto.
await abrirTrilhoSeRecolhido(pg)
const ficha = await pg.$('#rx-trilho [data-slug="ovo"]:not([disabled])')
if (ficha) { await ficha.click(); await pg.waitForTimeout(500) }
const nAviso = await pg.evaluate(() => document.querySelectorAll('#rx-pilha [id^="rx-camada-"]').length)
diz(nAviso === 11, `medidor em aviso com ${nAviso} camadas (limiar 10)`)
await recorte('medidor em aviso · 11 camadas', '#rx-medidor')

// Pilha de 16 camadas: o teto do contrato, e o pior caso vertical para a escala e o piso.
// Continua enchendo a partir do estado de aviso acima, em vez de remontar do zero. Evita
// molho de propósito: como o recheio novo entra ordenado por `ordem` e molho tem a menor
// de todas, uma segunda instância nunca cai adjacente a um pão e a validação a barra sem
// nunca desabilitar a ficha — "botão habilitado" e "adição bem-sucedida" divergem só nele.
const contarPilhaEm = (pagina) =>
  pagina.evaluate(() => document.querySelectorAll('#rx-pilha [id^="rx-camada-"]').length)
const contarPilha = () => contarPilhaEm(pg)

/** Enche a pilha até `MAX_CAMADAS_QA`, na página que for passada. Mesmo gesto do trilho
 * usado no teste de celular — reaproveitado depois para forçar o mesmo teto em 900px. */
async function encherPilha16(pagina) {
  for (const slug of CANDIDATOS_ENCHIMENTO) {
    if ((await contarPilhaEm(pagina)) >= MAX_CAMADAS_QA) break
    for (let i = 0; i < MAX_REPETICOES_QA; i++) {
      if ((await contarPilhaEm(pagina)) >= MAX_CAMADAS_QA) break
      // No editor cada escolha fecha a folha de novo — reabre antes de cada clique. No
      // montador `#rx-abrir-trilho` não existe e a função não faz nada.
      await abrirTrilhoSeRecolhido(pagina)
      const btn = await pagina.$(`#rx-trilho [data-slug="${slug}"]:not([disabled])`)
      if (!btn) break
      await btn.click()
      await pagina.waitForTimeout(50)
    }
  }
  // Cada clique dispara a transição de 300ms do rótulo (`top 300ms linear` em `Camada.tsx`)
  // — cliques em sequência rápida interrompem a transição anterior, e o navegador retoma
  // do valor animado corrente, então o alvo final só é alcançado 300ms depois do ÚLTIMO
  // clique. Sem esperar aqui, `getBoundingClientRect()` mede posição em trânsito, não a
  // do leque já distribuído — e um par que está no meio do caminho pode medir mais perto
  // (ou mais sobreposto) do que o vão mínimo real.
  await pagina.waitForTimeout(350)
  return contarPilhaEm(pagina)
}
const CANDIDATOS_ENCHIMENTO = ['presunto', 'cebola', 'frango-desfiado', 'queijo', 'ovo', 'tomate', 'alface', 'milho']
const n16 = await encherPilha16(pg)
diz(n16 === MAX_CAMADAS_QA, `pilha de 16 camadas montada: ${n16} camadas`)
const escala16 = await medirEscala()
if (escala16) {
  escalas.push({ rotulo: `${MAX_CAMADAS_QA} camadas (sintético, teto do contrato)`, ...escala16 })
  // Único caso autorizado a rolar: o sintético de 16 camadas é o teto do contrato, fora
  // das seis composições fixas — `exigirSemRolagem` false não cobra `!estourou`.
  validaGeometria(escala16, '16 camadas', false)
} else {
  diz(false, '16 camadas: #rx-painel sem atributos de escala')
}
await recorte('sintético de 16 camadas', '#rx-desenho')
await recorte('medidor com pilha de 16 camadas', '#rx-medidor')

// prensado sai do mais magro: é nele que a fresta entre os pães aparece primeiro.
await abrir(LANCHE_MAGRO)
await encarar()
// O preço que o medidor mostra é o que tem de aterrar na barra. Ler os dois e comparar
// dispensa repetir a tabela de preços aqui — e pega qualquer divergência entre as contas.
const precoNoMedidor = await pg.evaluate(() => document.getElementById('rx-preco-valor')?.textContent ?? '')

const selar = await pg.$('#rx-selar')
if (selar) {
  await selar.click()
  await pg.waitForTimeout(ESPERA_PRENSA_MS)
  const antes = await pg.$('#rx-painel[data-prensado]')
  await recorte(`raio-x prensado · ${LANCHE_MAGRO}`, '#rx-desenho')
  const depois = await pg.$('#rx-painel[data-prensado]')
  // O painel despacha o lanche aos 660ms. Se o recorte saiu fora dessa janela, ele mostra
  // o painel já vazio — e a folha de contato mentiria em silêncio.
  diz(!!antes && !!depois, `recorte do prensado dentro da janela da prensa (${ESPERA_PRENSA_MS}ms)`)
} else {
  diz(false, 'botão #rx-selar não encontrado')
}

// A sombra vem de baselines.json. Só faz sentido cobrar depois de uma prensa, que é
// quando ela é construída.
await pg.waitForTimeout(900)
const lidoDeVolta = await pg.evaluate(() => window.__lidoDeVolta)
diz(lidoDeVolta === 0, `getImageData em runtime: ${lidoDeVolta} chamadas`)

// O salto aterra na barra. Despacho aos 660ms, chegada 560ms depois, e o total ainda
// sobe contando por 320ms — só depois disso o número parou de mudar.
await pg.waitForTimeout(1400)
const barra = await pg.evaluate(() => ({
  itens: document.querySelector('[data-barra-pedido] [aria-live]')?.textContent ?? '',
  total: document.getElementById('barra-total')?.textContent ?? '',
}))
diz(
  barra.total === precoNoMedidor && barra.itens === '1 item',
  `barra depois do salto: ${barra.itens || 'sem contagem'} / ${barra.total || 'sem total'}` +
    ` (medidor pediu ${precoNoMedidor})`,
)

pula('recorte do carrinho aberto', 'carrinho')

// prefers-reduced-motion vale para tudo que se move, sem exceção. Sob ele a prensa não
// tem quadros e o salto não existe — mas o lanche precisa chegar ao pedido do mesmo jeito.
const ctxParado = await navegador.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
})
const pgParada = await ctxParado.newPage()
await pgParada.goto(`${URL}/?lanche=${LANCHE_MAGRO}`, { waitUntil: 'networkidle' })
await pgParada.waitForSelector('#rx-selar:not([disabled])', { timeout: 5000 })
const precoParado = await pgParada.evaluate(() => document.getElementById('rx-preco-valor')?.textContent ?? '')
await pgParada.click('#rx-selar')
await pgParada.waitForTimeout(600)
const totalParado = await pgParada.evaluate(() => document.getElementById('barra-total')?.textContent ?? '')
diz(
  totalParado === precoParado,
  `sob prefers-reduced-motion o lanche chega ao pedido: ${totalParado || 'nada'} (pedia ${precoParado})`,
)
await ctxParado.close()

// ---------- o outro lado do corte: 900 × 800 ----------
//
// Acima de 900px sobra largura, e a leitura simultânea das chamadas é o ganho. É a única
// coisa que muda de comportamento com o corte — o resto do layout é CSS e não precisa de
// segunda passada. O caminho por teclado (Delete na chamada) também é cobrado aqui: no
// celular ele mora na lista de composição, aqui mora na chamada.
const ctxAmplo = await navegador.newContext({ viewport: AMPLO, deviceScaleFactor: 1 })
const pgAmpla = await ctxAmplo.newPage()
const excecoesAmplo = []
pgAmpla.on('pageerror', (erro) => excecoesAmplo.push(String(erro)))
await pgAmpla.goto(`${URL}/?lanche=${LANCHE_CHEIO}`, { waitUntil: 'networkidle' })
await pgAmpla.waitForSelector('#rx-pilha [id^="rx-camada-"]', { timeout: 5000 })
await pgAmpla.waitForTimeout(200)
const noAmplo = await pgAmpla.evaluate(() => ({
  camadas: document.querySelectorAll('#rx-pilha [id^="rx-camada-"]').length,
  chamadas: document.querySelectorAll('[data-chamada]').length,
  colunaW: Math.round(document.querySelector('[data-chamada]')?.getBoundingClientRect().width ?? 0),
}))
diz(
  noAmplo.chamadas === noAmplo.camadas && noAmplo.camadas > 0,
  `em ${AMPLO.width}px as chamadas voltam todas: ${noAmplo.chamadas} de ${noAmplo.camadas} camadas` +
    ` (coluna de ${noAmplo.colunaW}px)`,
)

/** Espaço mínimo entre rótulos vizinhos — ESPACO_MIN_ROTULO em `rotulos.ts`. Duplicado
 * aqui pelo mesmo motivo de ESPALHA_X_TETO e PISO_ESCALA: este script é Node puro. */
const ESPACO_MIN_ROTULO = 22

/** Lê os retângulos de `[data-chamada]`, ordenados de cima para baixo (a leitura na
 * tela), junto com o índice (`data-chamada`, a posição na pilha) de cada um. */
async function leituraDeChamadas(pagina) {
  return pagina.evaluate(() =>
    [...document.querySelectorAll('[data-chamada]')]
      .map((e) => ({ indice: Number(e.dataset.chamada), r: e.getBoundingClientRect() }))
      .map((o) => ({ indice: o.indice, top: o.r.top, bottom: o.r.bottom }))
      .sort((a, b) => a.top - b.top))
}

/**
 * O leque dos rótulos: cobra as duas garantias do prompt 16 de uma vez.
 *   - `menorGap`: a menor distância entre o fim de um rótulo e o começo do próximo, na
 *     coluna inteira — nunca pode ficar abaixo de `ESPACO_MIN_ROTULO`.
 *   - `foraDeOrdem`: quantos pares vizinhos, lidos de cima para baixo, têm o índice na
 *     ordem errada. Índice cresce da base para o topo da pilha, e a tela decresce (a base
 *     fica embaixo); por isso, lendo de cima para baixo, o índice tem de vir sempre
 *     decrescendo — nunca pode inverter.
 */
function checarLequeDeChamadas(lista) {
  let menorGap = lista.length ? Infinity : 0
  let foraDeOrdem = 0
  for (let i = 1; i < lista.length; i++) {
    const gap = lista[i].top - lista[i - 1].bottom
    if (gap < menorGap) menorGap = gap
    if (lista[i].indice >= lista[i - 1].indice) foraDeOrdem++
  }
  return { menorGap, foraDeOrdem, n: lista.length }
}

// A folga cede primeiro quando a pilha não cabe (ver "Quando a pilha não cabe na altura"
// no AGENTS.md); o risco dela ceder até o piso é o rótulo de uma camada fina precisar de
// mais leque. Cobrado aqui, onde a coluna de chamadas existe — no celular não há coluna.
const escalaAmplo = await medirEscala(pgAmpla)
if (escalaAmplo) {
  escalas.push({ rotulo: `${LANCHE_CHEIO} em ${AMPLO.width}px`, ...escalaAmplo })
  validaGeometria(escalaAmplo, `${LANCHE_CHEIO} em ${AMPLO.width}px`, true)
}
const lequeCheio = checarLequeDeChamadas(await leituraDeChamadas(pgAmpla))
diz(
  lequeCheio.menorGap >= ESPACO_MIN_ROTULO - 0.5 && lequeCheio.foraDeOrdem === 0,
  `leque de rótulos em ${AMPLO.width}px, ${noAmplo.camadas} camadas: menor vão ` +
    `${lequeCheio.menorGap.toFixed(1)}px (piso ${ESPACO_MIN_ROTULO}), ` +
    `${lequeCheio.foraDeOrdem} par(es) fora de ordem` +
    ` (folga aplicada ${escalaAmplo ? escalaAmplo.folga.toFixed(3) : 'n/d'})`,
)

// A mesma checagem, nas seis composições fixas do cardápio — não só na mais cheia. É o
// "nas seis composições" do prompt: cada fixo abre do zero em 900px, sem herdar estado.
for (const slug of [...PRENSADOS, ...REDONDOS]) {
  await pgAmpla.goto(`${URL}/?lanche=${slug}`, { waitUntil: 'networkidle' })
  await pgAmpla.waitForSelector('#rx-pilha [id^="rx-camada-"]', { timeout: 5000 })
  await pgAmpla.waitForTimeout(150)
  const leque = checarLequeDeChamadas(await leituraDeChamadas(pgAmpla))
  diz(
    leque.n > 0 && leque.menorGap >= ESPACO_MIN_ROTULO - 0.5 && leque.foraDeOrdem === 0,
    `leque de rótulos em ${AMPLO.width}px, ${slug} (${leque.n} camadas): menor vão ` +
      `${Number.isFinite(leque.menorGap) ? leque.menorGap.toFixed(1) : 'n/d'}px` +
      ` (piso ${ESPACO_MIN_ROTULO}), ${leque.foraDeOrdem} par(es) fora de ordem`,
  )
}
// Volta ao lanche cheio: o resto da passada de 900px continua a partir dele.
await pgAmpla.goto(`${URL}/?lanche=${LANCHE_CHEIO}`, { waitUntil: 'networkidle' })
await pgAmpla.waitForSelector('#rx-pilha [id^="rx-camada-"]', { timeout: 5000 })
await pgAmpla.waitForTimeout(150)

const estorvosAmplo = await estorvosHorizontais(pgAmpla)
diz(
  estorvosAmplo.length === 0,
  `sem rolagem horizontal acidental em ${AMPLO.width}px${estorvosAmplo.length ? `: ${estorvosAmplo.join(', ')}` : ''}`,
)
const pequenosAmplo = await alvosPequenos(pgAmpla, TOQUE_MIN)
diz(
  pequenosAmplo.length === 0,
  `alvos abaixo de ${TOQUE_MIN}×${TOQUE_MIN} em ${AMPLO.width}px: ${pequenosAmplo.length}` +
    `${pequenosAmplo.length ? ` — ${pequenosAmplo.join(', ')}` : ''}`,
)
await pgAmpla.focus('[data-chamada="1"]')
await pgAmpla.keyboard.press('Delete')
await pgAmpla.waitForTimeout(120)
const depoisDoDelete = await pgAmpla.evaluate(
  () => document.querySelectorAll('#rx-pilha [id^="rx-camada-"]').length)
diz(
  depoisDoDelete === noAmplo.camadas - 1 && excecoesAmplo.length === 0,
  `Delete na chamada tira uma camada: ${noAmplo.camadas} → ${depoisDoDelete}` +
    `${excecoesAmplo.length ? `, ${excecoesAmplo.length} exceção(ões)` : ''}`,
)

// O caso mais duro para a folga: a mesma pilha de 16 camadas do teste de celular, agora
// nesta viewport mais larga — é onde a coluna de chamadas existe para medir a sobreposição.
// Vem por último nesta passada porque enche a pilha até o teto e o resto dos testes acima
// já rodou contra a composição original de dez camadas.
const n16Amplo = await encherPilha16(pgAmpla)
const escala16Amplo = await medirEscala(pgAmpla)
if (escala16Amplo) {
  escalas.push({ rotulo: `16 camadas em ${AMPLO.width}px`, ...escala16Amplo })
  validaGeometria(escala16Amplo, `16 camadas em ${AMPLO.width}px`, false)
}
const leque16 = checarLequeDeChamadas(await leituraDeChamadas(pgAmpla))
diz(
  leque16.menorGap >= ESPACO_MIN_ROTULO - 0.5 && leque16.foraDeOrdem === 0,
  `leque de rótulos em ${AMPLO.width}px, ${n16Amplo} camadas (o sintético, teto do` +
    ` contrato): menor vão ${leque16.menorGap.toFixed(1)}px (piso ${ESPACO_MIN_ROTULO}), ` +
    `${leque16.foraDeOrdem} par(es) fora de ordem` +
    ` (folga aplicada ${escala16Amplo ? escala16Amplo.folga.toFixed(3) : 'n/d'})`,
)
await recorte('chamadas em leque · 16 camadas em 900px', '#rx-desenho', pgAmpla)

await ctxAmplo.close()

// ---------- resumo do espalhamento ----------
//
// Uma linha por composição prensada: o fator calculado, o recheio que decidiu o fator, e
// o alcance final contra a largura do pão. As mesmas medidas da asserção de fresta acima,
// só que juntas — para não ter que caçar cinco linhas espalhadas pelo texto.
linhas.push('', 'resumo do espalhamento (fator · recheio mais largo · alcance / pão):')
frestas.forEach((f) => {
  linhas.push(
    `  ${f.rotulo}: fator ${f.fator.toFixed(3)} · ${f.maisLargo} (${larguraDe(f.maisLargo)}px)` +
      ` · alcança ${f.alcance}/${f.pao}`,
  )
})

linhas.push(
  '',
  `resumo da escala e da folga (escala aplicada · natural · piso ${PISO_ESCALA} — folga aplicada · piso ${PISO_FOLGA}):`,
)
escalas.forEach((e) => {
  linhas.push(
    `  ${e.rotulo}: escala ${e.escala.toFixed(3)} · natural ${e.escalaNatural.toFixed(3)}` +
      ` — folga ${e.folga.toFixed(3)}` +
      `${e.estourou ? ' · BATEU NO PISO, painel rola' : ' · sem rolagem'}`,
  )
})

// ---------- folha de contato ----------

if (recortes.length) {
  const html = `<body style="margin:0;background:#120D0B;display:grid;
    grid-template-columns:repeat(2,${LARGURA_RECORTE}px);gap:8px;padding:8px;
    font:11px/1.4 monospace;color:#A8C6D4">
    ${recortes.map((r) => `<div><div style="padding:2px 0">${r.nome}</div>
      <img src="data:image/jpeg;base64,${r.b64}" style="width:100%;display:block"></div>`).join('')}
    </body>`
  const folha = await ctx.newPage()
  await folha.setContent(html)
  await folha.waitForTimeout(200)
  const buf = await folha.screenshot({ type: 'jpeg', quality: QUALIDADE, fullPage: true })
  writeFileSync('qa/folha-de-contato.jpg', buf)
  linhas.push('', `folha de contato: qa/folha-de-contato.jpg (${(buf.length / 1024).toFixed(0)} KB, ${recortes.length} recortes)`)
}

await navegador.close()
console.log(linhas.join('\n'))
const falhou = linhas.some((l) => l.startsWith('FALHA'))
process.exit(falhou ? 1 : 0)
