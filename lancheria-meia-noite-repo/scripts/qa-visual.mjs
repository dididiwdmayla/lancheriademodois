// QA visual — desenhado para custar POUCOS TOKENS ao agente que vai olhar.
//
// Duas camadas, nesta ordem:
//   1. Asserções numéricas em texto. Uma linha por checagem, custo desprezível.
//      A maior parte dos defeitos aparece aqui e nunca precisa de imagem.
//   2. UMA folha de contato: oito recortes num único JPEG, qualidade 55.
//      Oito capturas separadas em 2x custariam mais de dez vezes mais tokens.
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

async function recorte(nome, seletor) {
  const el = await pg.$(seletor)
  if (!el) { diz(false, `${nome}: seletor ${seletor} não encontrado`); return }
  const buf = await el.screenshot({ type: 'jpeg', quality: QUALIDADE })
  recortes.push({ nome, b64: buf.toString('base64') })
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
 * A escala aplicada à pilha e se ela bateu no piso, direto dos atributos que `RaioX.tsx`
 * expõe em `#rx-painel` (`data-escala`, `data-escala-natural`, `data-estourou`) — nenhum
 * recálculo aqui, só leitura do que o componente já decidiu.
 *
 * Não mede `scrollHeight`: cada camada embrulha o canvas de 1200px inteiro do arquivo
 * (o objeto raramente ocupa tudo), então a caixa da camada estoura `#rx-painel` mesmo
 * quando o desenho visível cabe sobrando — `overflow: hidden` corta essa transparência de
 * propósito. `estourou` é o sinal correto: só é `true` quando a conta do componente não
 * coube nem no piso, e é aí, e só aí, que o painel precisa rolar de verdade.
 */
async function medirEscala() {
  return pg.evaluate(() => {
    const el = document.getElementById('rx-painel')
    if (!el) return null
    return {
      escala: Number(el.dataset.escala),
      escalaNatural: Number(el.dataset.escalaNatural),
      estourou: el.dataset.estourou !== undefined,
    }
  })
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

  // A pilha cabe na altura disponível sem rolar, e a escala nunca cai abaixo do piso —
  // ver "Escala da pilha e piso" no AGENTS.md. `#rx-painel` expõe os dois números.
  const escala = await medirEscala()
  if (escala) {
    escalas.push({ rotulo: slug, ...escala })
    diz(
      escala.escala >= escala.escalaNatural * PISO_ESCALA - 1e-6 && !escala.estourou,
      `${slug}: escala aplicada ${escala.escala.toFixed(3)} (natural ${escala.escalaNatural.toFixed(3)}, piso ${PISO_ESCALA}× natural)` +
        `${escala.estourou ? ' — BATEU NO PISO, painel rola' : ', sem rolagem'}`,
    )
  } else {
    diz(false, `${slug}: #rx-painel sem atributos de escala`)
  }

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
await pg.click('#rx-trilho [data-slug="molho"]')
await pg.waitForTimeout(80)
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

// Olhar em cima, tocar embaixo: medidor, trilho e botão inteiros no terço inferior.
const terco = await pg.evaluate(() => {
  const caixa = (id) => {
    const r = document.getElementById(id)?.getBoundingClientRect()
    return r ? { topo: r.top, base: r.bottom } : null
  }
  return {
    altura: window.innerHeight,
    medidor: caixa('rx-medidor'),
    trilho: caixa('rx-trilho'),
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

// Nenhuma ficha do trilho carrega de /camadas/: a foto de 56px é sempre o recorte de
// /fichas/, senão a silhueta some e sobra a cor média — ver AGENTS.md.
const fichasErradas = await pg.evaluate(() =>
  [...document.querySelectorAll('#rx-trilho [data-ficha-foto]')]
    .map((e) => getComputedStyle(e).backgroundImage)
    .filter((bg) => bg.includes('/camadas/') || !bg.includes('/fichas/')))
diz(
  fichasErradas.length === 0,
  `fichas do trilho fora de /fichas/: ${fichasErradas.length}${fichasErradas.length ? ` — ${fichasErradas.join(', ')}` : ''}`,
)

// ---------- 3. recortes ----------

// explodido e medidor normal saem do lanche cheio: dez camadas.
await recorte('raio-x em repouso · completo', '#rx-desenho')

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
await recorte('trilho · fichas de 56px', '#rx-trilho')

// aviso: uma camada acima do limiar. Entra pelo trilho, que é o gesto sem arrasto.
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
const contarPilha = () => pg.evaluate(() => document.querySelectorAll('#rx-pilha [id^="rx-camada-"]').length)
const CANDIDATOS_ENCHIMENTO = ['presunto', 'cebola', 'frango-desfiado', 'queijo', 'ovo', 'tomate', 'alface', 'milho']
for (const slug of CANDIDATOS_ENCHIMENTO) {
  if ((await contarPilha()) >= MAX_CAMADAS_QA) break
  for (let i = 0; i < MAX_REPETICOES_QA; i++) {
    if ((await contarPilha()) >= MAX_CAMADAS_QA) break
    const btn = await pg.$(`#rx-trilho [data-slug="${slug}"]:not([disabled])`)
    if (!btn) break
    await btn.click()
    await pg.waitForTimeout(50)
  }
}
const n16 = await contarPilha()
diz(n16 === MAX_CAMADAS_QA, `pilha de 16 camadas montada: ${n16} camadas`)
const escala16 = await medirEscala()
if (escala16) {
  escalas.push({ rotulo: `${MAX_CAMADAS_QA} camadas (sintético, teto do contrato)`, ...escala16 })
  diz(
    escala16.escala >= escala16.escalaNatural * PISO_ESCALA - 1e-6 && !escala16.estourou,
    `16 camadas: escala aplicada ${escala16.escala.toFixed(3)} (natural ${escala16.escalaNatural.toFixed(3)}, piso ${PISO_ESCALA}× natural)` +
      `${escala16.estourou ? ' — BATEU NO PISO, painel rola' : ', sem rolagem'}`,
  )
} else {
  diz(false, '16 camadas: #rx-painel sem atributos de escala')
}
await recorte('pilha de 16 camadas com aviso visível', '#rx-desenho')
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

linhas.push('', `resumo da escala (aplicada · natural · piso ${PISO_ESCALA}):`)
escalas.forEach((e) => {
  linhas.push(
    `  ${e.rotulo}: ${e.escala.toFixed(3)} · natural ${e.escalaNatural.toFixed(3)}` +
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
