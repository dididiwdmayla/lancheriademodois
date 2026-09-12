// Contratos do Prompt 24 em navegador real. --serve mantém servidor e browser juntos.
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/caminho/chromium npm run qa:temas -- --serve
import { chromium } from 'playwright'
import { spawn, execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, openSync } from 'node:fs'
import { createHash } from 'node:crypto'

const URL = process.env.QA_URL ?? 'http://127.0.0.1:3000'
mkdirSync('qa/prompt-24', { recursive: true })
let servidor
if (process.argv.includes('--serve')) {
  const log = openSync('qa/prompt-24/servidor.log', 'w')
  servidor = spawn(process.execPath, ['node_modules/next/dist/bin/next', process.env.QA_PRODUCTION ? 'start' : 'dev', '--hostname', '127.0.0.1', '--port', '3000'], { stdio: ['ignore', log, log] })
  let pronto = false
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(URL)).ok) { pronto = true; break } } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  if (!pronto) { servidor.kill(); throw new Error('Servidor não respondeu; ver qa/prompt-24/servidor.log') }
}

const temas = ['meia-noite', 'diner', 'pratico', 'cantina']
const familias = { 'meia-noite': ['Archivo', 'Fraunces', 'IBM Plex Mono'], diner: ['Alfa Slab One', 'Space Mono', 'Work Sans'], pratico: ['Inter'], cantina: ['Lora', 'Playfair Display'] }
const linhas = [], detalhes = {}, capturas = []
let falhas = 0
const diz = (ok, texto) => { const l = `${ok ? 'ok' : 'FALHA'} ${texto}`; linhas.push(l); console.log(l); if (!ok) falhas++ }
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader'] })
const pronto = async page => {
  await page.waitForSelector('#conteudo:not([inert])', { timeout: 40000 })
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.querySelectorAll('[data-cardapio] img, .hero-faixa > img')].map(img => img.decode().catch(() => {})))
  })
}
async function tela(page, nome, seletor) {
  const path = `qa/prompt-24/${nome}.jpg`
  if (seletor) await page.locator(seletor).screenshot({ path, type: 'jpeg', quality: 82 })
  else await page.screenshot({ path, type: 'jpeg', quality: 82 })
  capturas.push(path)
}
async function verificarUI(page, tema, local) {
  const r = await page.evaluate(() => {
    const visivel = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[inert]') }
    const ruins = [...document.querySelectorAll('button, a[href], input:not([type="hidden"]), select, textarea, summary')]
      .filter(visivel).filter(el => !el.matches('[data-toque]'))
      .map(el => { const r = el.getBoundingClientRect(); return { nome: el.id || el.getAttribute('aria-label') || el.textContent.slice(0,60), w: r.width, h: r.height } })
      .filter(r => r.w < 43.9 || r.h < 43.9)
    const raiz = getComputedStyle(document.documentElement)
    const normalizar = cor => { const el = document.createElement('span'); el.style.color = cor; document.body.append(el); const c = getComputedStyle(el).color; el.remove(); return c }
    const quente = normalizar(raiz.getPropertyValue('--latao')), frio = normalizar(raiz.getPropertyValue('--letreiro'))
    const precos = [...document.querySelectorAll('[data-preco]')].filter(visivel)
    const medidas = [...document.querySelectorAll('[data-medida]')].filter(visivel)
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      ruins, precos: precos.length, medidas: medidas.length,
      precosCorretos: precos.every(el => getComputedStyle(el).color === quente),
      medidasCorretas: medidas.every(el => getComputedStyle(el).color === frio),
      barraFria: !document.querySelector('#rx-medida > div') || getComputedStyle(document.querySelector('#rx-medida > div')).backgroundColor === frio,
    }
  })
  diz(!r.overflow, `${tema}/${local}: sem overflow horizontal`)
  diz(!r.ruins.length, `${tema}/${local}: alvos >= 44px${r.ruins.length ? ' '+JSON.stringify(r.ruins) : ''}`)
  diz(r.precos > 0 && r.precosCorretos && r.medidasCorretas && r.barraFria, `${tema}/${local}: preços quentes (${r.precos}), medições frias (${r.medidas})`)
  return r
}
try {
  const prefixo = execFileSync('git', ['rev-parse', '--show-prefix'], { encoding: 'utf8' }).trim()
  for (const file of ['components/raio-x/prensa.ts', 'components/raio-x/sombra.ts', 'components/raio-x/salto.ts', 'data/baselines.json', 'data/camadas.ts', 'data/fixos.ts', 'data/casa.ts']) {
    const antes = execFileSync('git', ['show', `4c02acb:${prefixo}${file}`])
    const depois = readFileSync(file)
    diz(antes.equals(depois), `motor/dados intactos: ${file} sha256=${createHash('sha256').update(depois).digest('hex').slice(0,16)}`)
  }
  const fotos = execFileSync('git', ['ls-tree', '-r', '--name-only', '4c02acb', '--', 'public/camadas', 'public/fixos', 'public/chapa', 'public/macro', 'public/fichas'], { encoding: 'utf8' }).trim().split('\n')
  diz(fotos.length === 54 && fotos.every(p => readFileSync(p).equals(execFileSync('git', ['show', `4c02acb:${prefixo}${p}`]))), '54 fotografias originais idênticas byte a byte; nenhuma nova')

  for (const tema of temas) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
    const page = await ctx.newPage(), erros = [], fontes = new Set()
    page.on('pageerror', e => erros.push(e.message))
    page.on('request', req => { if (/\.woff2(?:\?|$)/.test(req.url())) fontes.add(new globalThis.URL(req.url()).pathname) })
    await page.goto(`${URL}/?tema=${tema}`, { waitUntil: 'networkidle' })
    await pronto(page)
    diz(await page.locator('[data-item-cardapio]').count() === 4 && await page.locator('html').getAttribute('data-tema') === tema, `${tema}: renderiza os quatro prensados`)
    await verificarUI(page, tema, 'inicial')
    detalhes[tema] = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('[data-item-cardapio]')].map(el => { const r = el.getBoundingClientRect(); return { top:r.top, bottom:r.bottom, height:r.height } })
      const svg = document.querySelector('[data-hero-mascote]'), head = svg?.querySelector('[data-mascote-cabeca]')
      const range = document.createRange(), titulo = document.querySelector('#titulo-casa')
      if(titulo) range.selectNodeContents(titulo)
      const h = svg?.getBoundingClientRect(), t = titulo ? range.getBoundingClientRect() : null
      const visH = Number(svg?.dataset.alturaVisivel)
      return { cards, completosNaEntrada:cards.filter(c=>c.top>=0 && c.bottom <= innerHeight - 70).length,
        densidade: (844 - 70) / cards[0].height * (getComputedStyle(document.querySelector('.cardapio-grade')).display === 'flex' ? 1 : getComputedStyle(document.querySelector('.cardapio-grade')).gridTemplateColumns.split(' ').length),
        cabeca: head?.getBoundingClientRect().width ?? 0, mascoteVisivel: !!svg && getComputedStyle(svg).visibility === 'visible',
        sobrepoeTitulo: h && t ? !(h.right <= t.left || h.left >= t.right || h.top + visH <= t.top || h.top >= t.bottom) : false }
    })
    if (['meia-noite','diner'].includes(tema)) diz(detalhes[tema].cabeca >= 97.5 && detalhes[tema].cabeca <= 130 && detalhes[tema].mascoteVisivel && !detalhes[tema].sobrepoeTitulo,
      `${tema}: cabeça ${detalhes[tema].cabeca.toFixed(1)}px, visível e fora do título`)
    else diz(await page.locator('[data-mascote], [data-hero-mascote]').count() === 0, `${tema}: mascote ausente do DOM`)
    if (tema === 'pratico') {
      diz(await page.locator('#intro, .hero-faixa').count() === 0, 'pratico: entrada direta no cardápio, sem intro nem hero')
      diz((await page.locator('.lanche-icone').first().boundingBox()).width === 88, 'pratico: fotografia com 88px')
    }
    await tela(page, `${tema}-entrada`)
    if (tema === 'diner' || tema === 'cantina') await tela(page, `${tema}-hero`, '.hero-faixa')
    await page.locator('[data-cardapio]').scrollIntoViewIfNeeded()
    await page.evaluate(() => document.querySelector('[data-cardapio]').scrollIntoView({block:'start'}))
    await tela(page, `${tema}-cardapio`)
    await page.locator('[data-cardapio] [data-add="prensado-completo"]').click()
    await page.waitForSelector('[data-item-cardapio="prensado-completo"] [data-modificar]')
    if (tema === 'pratico') await page.evaluate(() => {
      window.__duracoesTema = []
      new MutationObserver(() => { const ms = document.documentElement.style.getPropertyValue('--tr-ms'); if(ms) window.__duracoesTema.push(ms) }).observe(document.documentElement, {attributes:true})
    })
    await page.locator('[data-item-cardapio="prensado-completo"] [data-modificar]').click()
    await page.waitForSelector('#rx-painel[data-escala]')
    await page.waitForFunction(() => !document.documentElement.dataset.transicao)
    await page.evaluate(async () => { await document.fonts.ready })
    if (tema === 'pratico') diz(await page.evaluate(() => window.__duracoesTema.includes('120ms') && window.__duracoesTema.every(ms => ms === '120ms')), 'pratico: transição real do raio-x em 120ms')
    await verificarUI(page, tema, 'raio-x')
    diz(await page.locator('[data-mascote], [data-hero-mascote]').count() === 0, `${tema}: nenhum mascote no DOM com raio-x aberto`)
    diz(await page.locator('#rx-pilha [data-foto-camada]').count() === 10, `${tema}: mesma composição de dez camadas`)
    detalhes[tema].geometria = await page.locator('#rx-painel').evaluate(el => ({...el.dataset}))
    await tela(page, `${tema}-raio-x`)
    const carregadas = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f=>f.family.replaceAll('"','')).sort())
    diz(JSON.stringify(carregadas) === JSON.stringify(familias[tema]), `${tema}: fontes carregadas = ${carregadas.join(', ')}`)
    detalhes[tema].fontes = [...fontes]
    if (tema === 'cantina') diz(await page.locator('#rx-preco-valor').evaluate(el => getComputedStyle(el).fontVariantNumeric.includes('oldstyle-nums')), 'cantina: preço e medidor com algarismos antiquários')
    await page.locator('#rx-ver-composicao').click()
    await page.locator('[data-slug="tomate"] [data-mover-cima]').click()
    diz(await page.locator('[data-aviso-ordem]').isVisible(), `${tema}: primeiro movimento mostra aviso`)
    if (tema === 'meia-noite') {
      await page.waitForSelector('[data-aviso-ordem]', { state: 'detached', timeout: 9000 })
      diz(true, 'meia-noite: aviso some sozinho após sete segundos')
    } else await page.locator('[data-aviso-ordem]').click()
    await page.locator('[data-slug="tomate"] [data-mover-baixo]').click()
    diz(await page.locator('[data-aviso-ordem]').count() === 0, `${tema}: segundo movimento não repete aviso`)
    await page.locator('#rx-fechar-composicao').click()
    // Exercita o próprio gesto depois do aviso: a mudança usa mover(), como os botões.
    const antesDoArrasto = await page.locator('#rx-camada-tomate-1').getAttribute('data-inst')
    const tira = page.locator('[data-toque="2"]')
    const caixa = await tira.boundingBox()
    await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2)
    await page.mouse.down()
    await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2 - 60, {steps:3})
    await page.mouse.up()
    await page.locator('#rx-ver-composicao').click()
    const indiceDepois = await page.locator('[data-slug="tomate"] [data-mover-cima]').getAttribute('data-mover-cima')
    diz(antesDoArrasto && indiceDepois !== '2' && await page.locator('[data-aviso-ordem]').count() === 0, `${tema}: arrasto real reordena sem repetir o aviso`)
    await page.locator('#rx-fechar-composicao').click()
    await page.locator('#rx-fechar').click()
    await page.waitForFunction(() => !document.documentElement.dataset.transicao)
    await page.reload({waitUntil:'networkidle'}); await pronto(page)
    await page.locator('[data-cardapio] [data-add="prensado-completo"]').click()
    await page.waitForSelector('[data-item-cardapio="prensado-completo"] [data-modificar]')
    await page.locator('[data-item-cardapio="prensado-completo"] [data-modificar]').click()
    await page.waitForSelector('#rx-painel[data-escala]')
    await page.waitForFunction(() => !document.documentElement.dataset.transicao)
    await page.locator('#rx-ver-composicao').click()
    await page.locator('[data-slug="tomate"] [data-mover-cima]').click()
    diz(await page.locator('[data-aviso-ordem]').count() === 0, `${tema}: recarregar na mesma sessão não repete aviso`)
    diz(!erros.length, `${tema}: sem erros de página${erros.length ? ' '+JSON.stringify(erros) : ''}`)
    await ctx.close()
  }
  diz(temas.filter(t=>t!=='pratico').every(t=>detalhes.pratico.completosNaEntrada > detalhes[t].completosNaEntrada && detalhes.pratico.densidade > detalhes[t].densidade),
    `densidade: ${temas.map(t=>`${t}=${detalhes[t].completosNaEntrada} completos na entrada / ${detalhes[t].densidade.toFixed(1)} itens por tela de lista`).join('; ')}`)

  // Horário real: o relógio do browser cruza as fronteiras de Maringá.
  const ctx = await browser.newContext({viewport:{width:390,height:844}}), page = await ctx.newPage()
  await page.clock.install({time:new Date('2026-09-12T17:59:00-03:00')})
  await page.goto(`${URL}/?tema=diner`); await pronto(page)
  diz(await page.locator('[data-placa-porta]').getAttribute('data-aberto') === 'false', 'diner 17:59: placa FECHADO')
  await page.clock.fastForward(61000)
  diz(await page.locator('[data-placa-porta]').getAttribute('data-aberto') === 'true' && await page.locator('[data-horario]').first().getAttribute('data-aberto') === 'true', 'diner 18:00: placa e horário viram ABERTO juntos')
  await page.clock.setSystemTime(new Date('2026-09-13T04:00:59-03:00')); await page.clock.fastForward(61000)
  diz(await page.locator('[data-placa-porta]').getAttribute('data-aberto') === 'false', 'diner após 04:00: placa fecha conforme contrato atual')
  await page.emulateMedia({reducedMotion:'reduce'})
  diz(await page.locator('.placa-giro').evaluate(el=>getComputedStyle(el).animationName==='none' && getComputedStyle(el).transitionProperty==='none'), 'diner: movimento reduzido mantém estado sem rotação')
  await page.goto(`${URL}/?tema=cantina`); await pronto(page)
  diz(await page.locator('.toldo-tecido').evaluate(el=>getComputedStyle(el).animationName==='none'), 'cantina: movimento reduzido abre toldo sem animação')
  await ctx.close()

  for (const tema of temas) {
    const ctx = await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'})
    const page=await ctx.newPage(); await page.goto(`${URL}/?tema=${tema}`,{waitUntil:'networkidle'}); await pronto(page)
    await verificarUI(page, tema, 'desktop')
    await page.setViewportSize({width:320,height:740})
    await verificarUI(page, tema, '320px')
    await ctx.close()
  }
} catch (erro) {
  diz(false, `QA interrompido: ${erro.stack}`)
} finally {
  writeFileSync('qa/prompt-24/resultados.json', JSON.stringify({falhas,linhas,detalhes},null,2))
  writeFileSync('qa/prompt-24/resultados.txt', linhas.join('\n')+'\n')
  if (temas.every(t=>capturas.includes(`qa/prompt-24/${t}-raio-x.jpg`))) {
    const page = await browser.newPage({viewport:{width:1280,height:1600},deviceScaleFactor:1})
    const img = nome => `<img src="data:image/jpeg;base64,${readFileSync(`qa/prompt-24/${nome}.jpg`).toString('base64')}" />`
    await page.setContent(`<style>body{margin:0;padding:12px;background:#dedbd5;font:15px Arial}main{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}h2{font-size:18px;margin:4px 0 8px}img{width:100%;display:block;margin-bottom:12px}p{margin:8px 0}</style><main>${temas.map(t=>`<section><h2>${t}</h2><p>Entrada · 390×844</p>${img(`${t}-entrada`)}<p>Raio-x · 390×844</p>${img(`${t}-raio-x`)}</section>`).join('')}</main>`)
    await page.screenshot({path:'qa/prompt-24/folha-de-contato.jpg',type:'jpeg',quality:76,fullPage:true})
  }
  await browser.close()
  servidor?.kill('SIGTERM')
}
console.log(`${linhas.length} asserções; ${falhas} falhas. Recortes: qa/prompt-24/`)
process.exitCode = falhas ? 1 : 0
