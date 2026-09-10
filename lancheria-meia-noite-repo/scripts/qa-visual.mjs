// QA visual — desenhado para custar POUCOS TOKENS ao agente que vai olhar.
//
// Duas camadas, nesta ordem:
//   1. Asserções numéricas em texto. Uma linha por checagem, custo desprezível.
//      A maior parte dos defeitos aparece aqui e nunca precisa de imagem.
//   2. UMA folha de contato: quatro recortes num único JPEG, qualidade 55.
//      Quatro capturas separadas em 2x custariam mais de dez vezes mais tokens.
//
// Regra para o agente: leia o texto primeiro. Só abra a folha de contato se uma
// asserção falhar ou se a tarefa for de julgamento visual. Nunca capture a página
// inteira em 2x — é o jeito mais rápido de queimar a janela de contexto.
//
// Linhas começadas por `pula` são checagens cujo alvo ainda não foi portado. Elas dizem
// qual fase traz o alvo. Nunca transforme uma delas em `ok` sem o alvo existir.
//
// uso:  node scripts/qa-visual.mjs [url]

import { chromium } from 'playwright'
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs'

/** Caixa de cada silhueta, a mesma que a sombra de contato usa. Nenhuma imagem é lida. */
const CAIXAS = JSON.parse(readFileSync('data/baselines.json', 'utf8'))
const larguraDe = (slug) => CAIXAS[slug].caixa[2] - CAIXAS[slug].caixa[0]

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
/** Depois de mandar prensar: 60ms de espera + 340ms de prensa. Antes do despacho, aos 660ms. */
const ESPERA_PRENSA_MS = 430
/** O mesmo scaleX da prensa (components/raio-x/prensa.ts). */
const ESPALHA_X = 1.14

mkdirSync('qa', { recursive: true })

// Em alguns ambientes de execução (contêiner efêmero do Claude Code), o download do
// Chromium do Playwright é bloqueado e um binário já vem pré-instalado num caminho fixo.
// Fora desses ambientes essa variável/caminho não existem e o Playwright resolve sozinho.
const CHROMIUM_FIXO = '/opt/pw-browsers/chromium'
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ?? (existsSync(CHROMIUM_FIXO) ? CHROMIUM_FIXO : undefined)

const navegador = await chromium.launch(executablePath ? { executablePath } : undefined)
const ctx = await navegador.newContext({
  viewport: { width: 390, height: 844 },
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

const linhas = []
const recortes = []
const diz = (ok, txt) => linhas.push(`${ok ? 'ok  ' : 'FALHA'} ${txt}`)
const pula = (txt, fase) => linhas.push(`pula  ${txt} — chega na fase: ${fase}`)
// Medida sem veredito: número que ninguém calibrou ainda. Reportar move o assunto;
// inventar um limiar aqui seria fabricar calibragem.
const mede = (txt) => linhas.push(`medida ${txt}`)

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

/** Rola o raio-x para dentro da viewport, para o recorte não precisar rolar depois. */
async function encarar() {
  await pg.evaluate(() => document.getElementById('rx-painel')?.scrollIntoView({ block: 'start' }))
  await pg.waitForTimeout(80)
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

  // Fresta da prensa: com o recheio espalhado em scaleX, o mais largo dele tem de alcançar
  // a largura do pão — senão as duas metades se encostam sem nada entre elas nas pontas.
  // A composição sai dos próprios ids da pilha desenhada, não de uma segunda lista.
  if (!PRENSADOS.includes(slug)) continue
  const naPilha = camadas.map((c) => c.id.replace(/-\d+$/, ''))
  const pao = larguraDe(naPilha[0])
  const maisLargo = naPilha
    .filter((s) => !s.startsWith('pao-'))
    .reduce((a, s) => (larguraDe(s) > larguraDe(a) ? s : a))
  const alcance = Math.round(larguraDe(maisLargo) * ESPALHA_X)
  mede(
    `${slug}: recheio mais largo é ${maisLargo}, alcança ${alcance} de ${pao} do pão` +
      ` (${alcance >= pao ? 'cobre' : `${pao - alcance}px a menos`})`,
  )
}

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

// ---------- 2. recortes ----------

// explodido e medidor normal saem do lanche cheio: dez camadas, dez chamadas.
await encarar()
await recorte('raio-x explodido · completo', '#rx-desenho')
await recorte('medidor normal · 10 camadas', '#rx-medidor')

// aviso: uma camada acima do limiar. Entra pelo trilho, que é o gesto sem arrasto.
const ficha = await pg.$('#rx-trilho [data-slug="ovo"]:not([disabled])')
if (ficha) { await ficha.click(); await pg.waitForTimeout(500) }
const nAviso = await pg.evaluate(() => document.querySelectorAll('#rx-pilha [id^="rx-camada-"]').length)
diz(nAviso === 11, `medidor em aviso com ${nAviso} camadas (limiar 10)`)
await recorte('medidor em aviso · 11 camadas', '#rx-medidor')

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
