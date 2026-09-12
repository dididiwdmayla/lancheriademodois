// Medição independente do QA de duração do Prompt 21.
// Produção já iniciada: node scripts/qa-quadros.mjs http://localhost:3000 nativa
// Controle A/B, sem editar o produto: ... http://localhost:3000 queda
// Captura o intervalo que contém o clique, até dois quadros após a conclusão.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const url = process.argv[2] ?? 'http://localhost:3000'
const modo = process.argv[3] ?? 'nativa'
if (!['nativa', 'queda'].includes(modo)) throw new Error('Modo: nativa ou queda')
const navegador = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
})
const resultados = []
const erros = []
const controles = []
const ctx = await navegador.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 1,
  isMobile: true, hasTouch: true, reducedMotion: 'no-preference',
})
await ctx.addInitScript(({ queda }) => {
  if (queda) Object.defineProperty(Document.prototype, 'startViewTransition', { value: undefined })
  // Mantém rAF anterior ao input. Sem getAnimations/getComputedStyle no laço medido:
  // a própria coleta não pode provocar layout e depois culpar a aplicação.
  let anterior = 0
  let coleta = null
  const raiz = document.documentElement
  const observer = new MutationObserver(() => {
    if (!coleta) return
    const nome = document.documentElement.dataset.transicao
    if (nome) { coleta.viuTransicao = true; coleta.nomeReal = nome }
    else if (coleta.viuTransicao && coleta.fimEstado === null) coleta.fimEstado = performance.now()
  })
  const observar = () => observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-transicao'] })
  if (raiz) observar()
  else document.addEventListener('DOMContentLoaded', observar, { once: true })
  document.addEventListener('click', () => {
    if (!window.__quadrosArmado || coleta) return
    coleta = { inicio: performance.now(), anteriorAoInput: anterior, intervalos: [], viuTransicao: false, nomeReal: null, fimEstado: null, cauda: 0 }
    window.__quadrosArmado = false
  }, true)
  const passo = t => {
    if (coleta && anterior) {
      coleta.intervalos.push({ de: anterior, ate: t, ms: t - anterior })
      // Grade não usa data-transicao; mede a janela contratada de 200ms + cauda.
      // Troca seca também precisa medir o custo da mutação, não devolver zero amostras.
      const terminou = coleta.fimEstado !== null || (!coleta.viuTransicao && t - coleta.inicio >= 250)
      if (terminou) coleta.cauda++
      if (coleta.cauda >= 2 || t - coleta.inicio > 5000) {
        window.__quadrosResultado = { ...coleta, fim: t, timeout: t - coleta.inicio > 5000 }
        coleta = null
      }
    }
    anterior = t
    requestAnimationFrame(passo)
  }
  requestAnimationFrame(passo)
}, { queda: modo === 'queda' })
const pg = await ctx.newPage()
pg.on('pageerror', e => erros.push(String(e)))
const cdp = await ctx.newCDPSession(pg)

async function medir(nome, locator, rodada) {
  await locator.scrollIntoViewIfNeeded()
  // Fora da janela de coleta: deixa rolagem, salto e decodificação anteriores terminar.
  await pg.waitForTimeout(400)
  const respostaThrottle = await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const aplicadoEm = new Date().toISOString()
  await pg.evaluate(() => { window.__quadrosResultado = null; window.__quadrosArmado = true })
  await locator.click()
  // A espera usa polling rAF; não enumera estilos/animações enquanto mede.
  await pg.waitForFunction(() => !!window.__quadrosResultado, { timeout: 8000 })
  const bruto = await pg.evaluate(() => window.__quadrosResultado)
  const intervalos = bruto.intervalos.map(q => q.ms)
  if (!intervalos.length || bruto.timeout) throw new Error(`Coleta inválida: ${nome}`)
  const maxMs = Math.max(...intervalos)
  const acima32 = intervalos.filter(ms => ms > 32).length
  // Quadros não apresentados ESTIMADOS a 60Hz; intervalos rAF são a evidência bruta.
  const perdidos60Hz = intervalos.reduce((n, ms) => n + Math.max(0, Math.round(ms / (1000 / 60)) - 1), 0)
  const item = { rodada, nome, modo, cpu: 4, aplicadoEm, respostaThrottle,
    maxMs, acima32, perdidos60Hz, amostras: intervalos.length,
    inputAteFimMs: bruto.fim - bruto.inicio, bruto }
  resultados.push(item)
  console.log(`${acima32 ? 'FALHA' : 'ok'} ${rodada} ${nome}: max ${maxMs.toFixed(2)}ms; >32ms ${acima32}; perdidos estimados ${perdidos60Hz}; amostras ${intervalos.length}`)
}

try {
  // Controle negativo de CPU: mesma carga fixa em 1×, 4× e 20×; retorna resultados
  // reais, sem tratar mero sucesso do comando CDP como prova de estrangulamento.
  await pg.goto(url, { waitUntil: 'networkidle' })
  for (const rate of [1, 4, 20]) {
    const resposta = await cdp.send('Emulation.setCPUThrottlingRate', { rate })
    const medidas = []
    for (let i = 0; i < 4; i++) medidas.push(await pg.evaluate(() => {
      const inicio = performance.now()
      let valor = 7
      for (let n = 0; n < 2000000; n++) valor = Math.imul(valor ^ n, 1664525) + 1013904223 | 0
      return { ms: performance.now() - inicio, checksum: valor }
    }))
    controles.push({ rate, resposta, medidas })
  }
  console.log('Controles CPU:', JSON.stringify(controles))
  for (let rodada = 1; rodada <= 3; rodada++) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await pg.goto(url, { waitUntil: 'networkidle' })
    await pg.waitForFunction(() => !document.querySelector('#conteudo')?.hasAttribute('inert'))
    await pg.locator('[data-item-cardapio="prensado-completo"] [data-add]').click()
    const modificar = pg.locator('[data-item-cardapio="prensado-completo"] [data-modificar]')
    await modificar.waitFor()
    await medir('rx-entra', modificar, rodada)
    await pg.locator('#rx-takeover').waitFor()
    await medir('folha-entra', pg.locator('#rx-abrir-trilho'), rodada)
    await medir('folha-sai', pg.locator('#rx-fechar-trilho'), rodada)
    await medir('rx-sai', pg.locator('#rx-fechar'), rodada)
    await medir('carrinho-entra', pg.locator('[data-abrir-carrinho]'), rodada)
    await medir('confirma-entra', pg.locator('#carrinho-resumo'), rodada)
    await medir('confirma-sai', pg.getByRole('button', { name: 'Voltar aos itens', exact: true }), rodada)
    await medir('carrinho-sai', pg.locator('#carrinho-fechar'), rodada)
    await medir('grade', pg.locator('[data-filtro-forma="redondo"]'), rodada)
  }
} finally {
  mkdirSync('qa', { recursive: true })
  writeFileSync(`qa/quadros-${modo}.json`, JSON.stringify({
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    navegador: navegador.version(), viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1, cpu: 4, modo, controles, resultados, erros,
    limiteMs: 32, criterioPerdidos: 'max(0, round(intervalo/(1000/60))-1), estimativa a 60Hz',
  }, null, 2))
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }).catch(() => {})
  await navegador.close()
}
if (resultados.length !== 27 || resultados.some(r => r.acima32) || erros.length) process.exitCode = 1
