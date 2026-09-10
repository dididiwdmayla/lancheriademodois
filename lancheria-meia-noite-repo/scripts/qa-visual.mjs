// QA visual — desenhado para custar POUCOS TOKENS ao agente que vai olhar.
//
// Duas camadas, nesta ordem:
//   1. Asserções numéricas em texto. Uma linha por checagem, custo desprezível.
//      A maior parte dos defeitos aparece aqui e nunca precisa de imagem.
//   2. UMA folha de contato: seis recortes num único JPEG de ~760px, qualidade 55.
//      Seis capturas separadas em 2x custariam mais de dez vezes mais tokens.
//
// Regra para o agente: leia o texto primeiro. Só abra a folha de contato se uma
// asserção falhar ou se a tarefa for de julgamento visual. Nunca capture a página
// inteira em 2x — é o jeito mais rápido de queimar a janela de contexto.
//
// uso:  node scripts/qa-visual.mjs [url]

import { chromium } from 'playwright'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'

const URL = process.argv[2] ?? 'http://localhost:3000'
const LARGURA_RECORTE = 360
const QUALIDADE = 55

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
const pg = await ctx.newPage()

const linhas = []
const recortes = []
const diz = (ok, txt) => linhas.push(`${ok ? 'ok  ' : 'FALHA'} ${txt}`)

async function recorte(nome, seletor) {
  const el = await pg.$(seletor)
  if (!el) { diz(false, `${nome}: seletor ${seletor} não encontrado`); return }
  const buf = await el.screenshot({ type: 'jpeg', quality: QUALIDADE })
  recortes.push({ nome, b64: buf.toString('base64') })
}

await pg.goto(URL, { waitUntil: 'networkidle' })

// ---------- 1. asserções numéricas ----------

// intro do letreiro concluída
await pg.waitForTimeout(2200)
const acende = await pg.evaluate(() =>
  getComputedStyle(document.documentElement).getPropertyValue('--lt-acende').trim())
diz(acende === '1' || acende === '', `letreiro estabilizado (--lt-acende=${acende || 'n/d'})`)

// quantos itens do cardápio cabem sem rolagem
const visiveis = await pg.evaluate(() => {
  const itens = [...document.querySelectorAll('[data-item-cardapio]')]
  return itens.filter((e) => e.getBoundingClientRect().top < window.innerHeight).length
})
diz(visiveis >= 4, `${visiveis} itens do cardápio na primeira tela (mínimo 4)`)

// nenhuma medição em --latao
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

await recorte('cardápio', '[data-cardapio]')
await recorte('filtro', '[data-filtro-ingrediente]')

const item = await pg.$('[data-item-cardapio]')
if (item) { await item.click(); await pg.waitForTimeout(700) }
await recorte('raio-x aberto', '#rx-painel')

const selar = await pg.$('#rx-selar')
if (selar) { await selar.click(); await pg.waitForTimeout(900) }
await recorte('prensado', '#rx-painel, [data-prensado]')

await recorte('barra do pedido', '[data-barra-pedido]')

const abrir = await pg.$('[data-abrir-carrinho]')
if (abrir) { await abrir.click(); await pg.waitForTimeout(500) }
await recorte('carrinho', '[data-carrinho]')

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
