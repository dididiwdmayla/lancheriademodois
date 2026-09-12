// Contratos do Prompt 25 em navegador real. --serve mantém servidor e browser juntos.
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/caminho/chromium npm run qa:temas -- --serve
import { chromium } from 'playwright'
import { spawn, execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, openSync } from 'node:fs'
import { createHash } from 'node:crypto'

const URL = process.env.QA_URL ?? 'http://127.0.0.1:3000'
mkdirSync('qa/prompt-25', { recursive: true })
let servidor
if (process.argv.includes('--serve')) {
  const log = openSync('qa/prompt-25/servidor.log', 'w')
  servidor = spawn(process.execPath, ['node_modules/next/dist/bin/next', process.env.QA_PRODUCTION ? 'start' : 'dev', '--hostname', '127.0.0.1', '--port', '3000'], { stdio: ['ignore', log, log] })
  let pronto = false
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(URL)).ok) { pronto = true; break } } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  if (!pronto) { servidor.kill(); throw new Error('Servidor não respondeu; ver qa/prompt-25/servidor.log') }
}

const temas = ['meia-noite', 'diner', 'pratico', 'cantina']
const familias = { 'meia-noite': ['Archivo', 'Fraunces', 'IBM Plex Mono'], diner: ['Alfa Slab One', 'Space Mono', 'Work Sans'], pratico: ['Inter'], cantina: ['Lora', 'Playfair Display'] }
const linhas = [], detalhes = {}, capturas = []
let falhas = 0
const diz = (ok, texto) => { const l = `${ok ? 'ok' : 'FALHA'} ${texto}`; linhas.push(l); console.log(l); if (!ok) falhas++ }
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader'] }).catch(erro => { servidor?.kill(); throw erro })
const pronto = async page => {
  await page.waitForSelector('#conteudo:not([inert])', { timeout: 40000 })
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.querySelectorAll('[data-cardapio] img, .hero-faixa > img')].map(img => img.decode().catch(() => {})))
  })
}
async function tela(page, nome, seletor) {
  const path = `qa/prompt-25/${nome}.jpg`
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
const BASE = process.env.QA_BASE ?? 'bb259e46ff0a1145bdab8bbd2023880e55bd144d'
const metas = {'meia-noite':3, diner:6, pratico:4, cantina:4}
const prefixo = execFileSync('git',['rev-parse','--show-prefix'],{encoding:'utf8'}).trim()
const original = file => execFileSync('git',['show',`${BASE}:${prefixo}${file}`])
async function nomesInteiros(page) {
  return page.locator('[data-item-cardapio] h3').evaluateAll(els => els.every(el => {
    const s=getComputedStyle(el), r=el.getBoundingClientRect()
    return s.textOverflow !== 'ellipsis' && s.webkitLineClamp === 'none' && el.scrollWidth<=r.width+1 && el.scrollHeight<=r.height+1
  }))
}
async function nomeLongo(page,largura) {
  const antes=await page.locator('.menu-nome-preco h3').first().textContent()
  await page.locator('.menu-nome-preco h3').first().evaluate(el=>el.textContent='Prensado da casa com frango, calabresa e queijo especial da madrugada')
  const resultado=await page.locator('.menu-nome-preco').first().evaluate(el=>{
    const h=el.querySelector('h3'), d=el.querySelector('.menu-pontilhado'), p=el.querySelector('[data-preco]')
    const n=h.getBoundingClientRect(), fio=d.getBoundingClientRect(), preco=p.getBoundingClientRect(), caixa=el.getBoundingClientRect()
    return {linhas:n.height/parseFloat(getComputedStyle(h).lineHeight),pontilhado:fio.width,
      ok:n.right<=fio.left && fio.right<=preco.left && preco.right<=caixa.right+1 && fio.width>=12 && getComputedStyle(d).borderBottomStyle==='dotted' && h.scrollWidth<=n.width+1}
  })
  diz(resultado.ok && resultado.linhas>1,`cantina/${largura}px: nome longo em ${resultado.linhas.toFixed(0)} linhas; pontilhado ${resultado.pontilhado.toFixed(1)}px sem colisão com preço`)
  await tela(page,`cantina-nome-longo-${largura}`)
  await page.locator('.menu-nome-preco h3').first().evaluate((el,texto)=>el.textContent=texto,antes)
}
try {
  const preservados=execFileSync('git',['ls-tree','-r','--name-only',BASE,'--','components/raio-x','components/pedido','lib','data','temas','public/fontes'],{encoding:'utf8'}).trim().split('\n')
  detalhes.integridade=preservados.map(file=>({arquivo:file,identico:original(file).equals(readFileSync(file)),sha256:createHash('sha256').update(readFileSync(file)).digest('hex')}))
  diz(detalhes.integridade.every(x=>x.identico),`${preservados.length} arquivos de motor, pedido, contratos, temas e fontes idênticos byte a byte à base ${BASE.slice(0,7)}`)
  const fotos=execFileSync('git',['ls-tree','-r','--name-only',BASE,'--','public/camadas','public/fixos','public/chapa','public/macro','public/fichas'],{encoding:'utf8'}).trim().split('\n')
  const atuais=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','--','public/camadas','public/fixos','public/chapa','public/macro','public/fichas'],{encoding:'utf8'}).trim().split('\n')
  diz(fotos.length===54 && atuais.length===54 && fotos.every(p=>original(p).equals(readFileSync(p))),'54 fotos compartilhadas idênticas; nenhuma nova')
  diz(original('app/globals.css').equals(readFileSync('app/globals.css')),'CSS global da mecânica preservado')
  const baseline=JSON.parse(readFileSync('qa/prompt-24/resultados.json','utf8'))
  for (const tema of temas) {
    const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'})
    const page=await ctx.newPage(), erros=[], fontes=new Set()
    page.on('pageerror',e=>erros.push(e.message))
    page.on('response',res=>{if(res.status()>=400)erros.push(`${res.status()} ${res.url()}`)})
    page.on('request',req=>{if(/\.woff2(?:\?|$)/.test(req.url()))fontes.add(new globalThis.URL(req.url()).pathname)})
    await page.clock.install({time:new Date('2026-09-12T19:30:00-03:00')})
    await page.goto(`${URL}/?tema=${tema}`,{waitUntil:'networkidle'}); await pronto(page)
    diz(await page.locator('[data-item-cardapio]').count()===(tema==='diner'?6:4),`${tema}: cardápio inicial renderizado`)
    detalhes[tema]=await page.evaluate(()=>{
      const rect=el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
      const cards=[...document.querySelectorAll('[data-item-cardapio]')].map(el=>({nome:el.querySelector('h3').textContent,...rect(el)}))
      const limite=document.querySelector('#barra-pedido').getBoundingClientRect().top
      const hero=document.querySelector('.hero-faixa'), svg=document.querySelector('[data-hero-mascote]'), head=svg?.querySelector('[data-mascote-cabeca]')
      const range=document.createRange(), titulo=document.querySelector('#titulo-casa')
      if(titulo)range.selectNodeContents(titulo)
      const m=svg?.getBoundingClientRect(),t=titulo?range.getBoundingClientRect():null
      return {cards,limite,completosNaEntrada:cards.filter(r=>r.top>=0 && r.bottom<=limite).length,
        hero:hero?rect(hero):null,mascote:svg?{cabeca:head.getBoundingClientRect().width,visivel:getComputedStyle(svg).visibility==='visible',
          colisao:!(m.right<=t.left || m.left>=t.right || m.top+Number(svg.dataset.alturaVisivel)<=t.top || m.top>=t.bottom)}:null,
        nomes:[...document.querySelectorAll('[data-item-cardapio] h3')].map(el=>({texto:el.textContent,...rect(el),fonte:getComputedStyle(el).fontSize}))}
    })
    diz(detalhes[tema].completosNaEntrada>=metas[tema],`${tema}/390×844: ${detalhes[tema].completosNaEntrada} itens completos >= ${metas[tema]}; barra começa em ${detalhes[tema].limite}px`)
    await verificarUI(page,tema,'390×844')
    if(detalhes[tema].mascote) {
      const m=detalhes[tema].mascote
      diz(m.cabeca>=97.5 && m.cabeca<=130 && m.visivel && !m.colisao,`${tema}: mascote de ${m.cabeca.toFixed(1)}px legível, fora do título`)
    }
    if(tema==='pratico') {
      diz(detalhes[tema].cards.every((r,i)=>['top','bottom','height'].every(k=>Math.abs(r[k]-baseline.detalhes.pratico.cards[i][k])<.1)),'pratico: geometria de todas as linhas exatamente igual à rodada 24')
      diz(await page.locator('#intro,.hero-faixa').count()===0 && (await page.locator('.lanche-icone').first().boundingBox()).width===88,'pratico: sem intro/hero, foto 88px mantida')
    }
    if(tema==='meia-noite')diz(detalhes[tema].hero.height<=844*.30,'meia-noite: hero limitado a 30% da viewport')
    await tela(page,`${tema}-entrada`)
    await page.evaluate(()=>document.querySelector('[data-cardapio]').scrollIntoView({block:'start'}))
    await tela(page,`${tema}-cardapio`)
    if(tema==='diner') {
      diz(await nomesInteiros(page),'diner/390px: seis nomes completos, sem reticência ou recorte')
      diz(await page.locator('.diner-recheio .lanche-icone').evaluateAll(els=>els.every(el=>Math.abs(el.getBoundingClientRect().width-el.getBoundingClientRect().height)<1)),'diner: seis fotos quadradas')
      const d=page.locator('.diner-recheio').first()
      await d.locator('summary').focus(); await page.keyboard.press('Enter')
      diz(await d.locator('p').isVisible() && (await d.locator('p').textContent()).includes('Batata palha'),'diner: foto revela ingredientes completos por teclado')
      await page.keyboard.press('Enter')
      await page.locator('[data-filtro-forma="redondo"]').click()
      diz(await page.locator('[data-item-cardapio]').count()===2,'diner: filtro redondos preservado')
      await page.locator('[data-filtro-forma="todos"]').click()
      await page.getByRole('button',{name:'Ingredientes',exact:false}).first().click()
      await page.locator('[data-filtro-ingrediente="bacon"]').click()
      diz(await page.locator('[data-item-cardapio]').count()===3,'diner: Todos respeita também o filtro por ingrediente')
      await page.getByRole('button',{name:'Limpar ingredientes',exact:true}).click()
      await page.getByRole('button',{name:'Ingredientes',exact:false}).first().click()
    }
    if(tema==='cantina') {
      diz(await page.locator('[data-item-cardapio] .lanche-icone').evaluateAll(els=>els.every(el=>el.getBoundingClientRect().width===64 && el.getBoundingClientRect().height===64)),'cantina: fotos de 64×64px')
      diz(await page.locator('[data-item-cardapio] .ingredientes-linha').evaluateAll(els=>els.every(el=>getComputedStyle(el).whiteSpace==='normal' && getComputedStyle(el).textOverflow!=='ellipsis' && el.scrollHeight<=el.getBoundingClientRect().height+1)),'cantina: ingredientes por extenso, sem truncar')
      await nomeLongo(page,390)
    }
    await page.setViewportSize({width:320,height:740}); await page.evaluate(()=>window.scrollTo(0,0))
    await verificarUI(page,tema,'320×740')
    await tela(page,`${tema}-320`)
    if(tema==='diner')diz(await nomesInteiros(page),'diner/320px: nomes completos, sem reticência ou recorte')
    if(tema==='cantina')await nomeLongo(page,320)
    await page.locator('[data-filtro-forma="monte"]').click()
    diz(await page.locator('.monte-grade button').count()===2,`${tema}: Monte o seu preserva as duas formas`)
    await verificarUI(page,tema,'320×740/montar')
    await page.locator('[data-filtro-forma="prensado"]').click()
    await page.locator('[data-cardapio] [data-add="prensado-completo"]').click()
    await page.waitForSelector('[data-item-cardapio="prensado-completo"] [data-modificar]')
    await verificarUI(page,tema,'320×740/adicionado')
    await page.locator('[data-item-cardapio="prensado-completo"] [data-modificar]').click()
    await page.waitForSelector('#rx-painel[data-escala]')
    await page.waitForFunction(()=>!document.documentElement.dataset.transicao)
    await verificarUI(page,tema,'320×740/raio-x')
    diz(await page.locator('#rx-pilha [data-foto-camada]').count()===10 && await page.locator('[data-mascote],[data-hero-mascote]').count()===0,`${tema}: raio-x mantém dez camadas e nenhum mascote`)
    const carregadas=await page.evaluate(()=>[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family.replaceAll('"','')).sort())
    diz(JSON.stringify(carregadas)===JSON.stringify(familias[tema]),`${tema}: famílias carregadas = ${carregadas.join(', ')}`)
    detalhes[tema].fontes=[...fontes]
    await page.setViewportSize({width:390,height:844}); await verificarUI(page,tema,'390×844/raio-x')
    await tela(page,`${tema}-raio-x`)
    diz(!erros.length,`${tema}: sem erros de página ou recursos${erros.length?' '+JSON.stringify(erros):''}`)
    await ctx.close()
    const desktop=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'})
    const pg=await desktop.newPage(); await pg.goto(`${URL}/?tema=${tema}`,{waitUntil:'networkidle'}); await pronto(pg)
    await verificarUI(pg,tema,'1280×900')
    if(['diner','cantina'].includes(tema))diz(await pg.locator('.cardapio-grade').first().evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length)===(tema==='diner'?5:2),`${tema}: ${tema==='diner'?5:2} colunas no desktop`)
    await tela(pg,`${tema}-desktop`)
    await desktop.close()
  }
} catch(erro) { diz(false,`QA interrompido: ${erro.stack}`) }
finally {
  writeFileSync('qa/prompt-25/resultados.json',JSON.stringify({base:BASE,falhas,linhas,detalhes},null,2))
  writeFileSync('qa/prompt-25/resultados.txt',linhas.join('\n')+'\n')
  if(temas.every(t=>capturas.includes(`qa/prompt-25/${t}-entrada.jpg`))) {
    const page=await browser.newPage({viewport:{width:1620,height:938},deviceScaleFactor:1})
    for(const recorte of ['entrada','cardapio']) {
      const img=t=>`<img width="390" height="844" src="data:image/jpeg;base64,${readFileSync(`qa/prompt-25/${t}-${recorte}.jpg`).toString('base64')}" />`
      await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;padding:12px;background:#dedbd5;color:#18181b;font:14px Arial}main{display:grid;grid-template-columns:repeat(4,390px);gap:12px}h2{font-size:20px;margin:4px 0 6px}p{margin:0 0 12px}img{display:block}</style><main>${temas.map(t=>`<section><h2>${t}</h2><p>${recorte==='entrada'?`${detalhes[t].completosNaEntrada} completos · sem rolagem`:'Cardápio · alinhado pelo título'} · 390×844</p>${img(t)}</section>`).join('')}</main>`)
      await page.screenshot({path:`qa/prompt-25/${recorte==='entrada'?'folha-de-contato':'folha-cardapios'}.jpg`,type:'jpeg',quality:90,fullPage:true})
    }
    await page.close()
  }
  await browser.close(); servidor?.kill('SIGTERM')
}
console.log(`${linhas.length} asserções; ${falhas} falhas. Recortes: qa/prompt-25/`)
process.exitCode=falhas?1:0
