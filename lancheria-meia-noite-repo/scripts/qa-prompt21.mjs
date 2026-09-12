// Prompt 21: transições entre telas e o mascote do letreiro.
//
// A tabela de durações não é copiada para cá — ela é LIDA de lib/transicoes.ts. Duas
// cópias de um número divergem, e este número é contrato.
import { readFileSync } from 'node:fs'

const TETO_MS = 240
const CELULAR = { width: 390, height: 844 }

/** A tabela do prompt, para conferir contra a que o código realmente usa. `folha-sai`
 * não está no prompt: é o fechamento espelhado da folha, decidido aqui. */
const TABELA_DO_PROMPT = {
  'rx-entra': 240,
  'rx-sai': 200,
  'carrinho-entra': 220,
  'carrinho-sai': 180,
  'folha-entra': 200,
  'confirma-entra': 220,
  'confirma-sai': 180,
}

function lerTabela() {
  const fonte = readFileSync('lib/transicoes.ts', 'utf8')
  const bloco = /export const TRANSICOES[^=]*=\s*\{([\s\S]*?)\n\}/.exec(fonte)
  if (!bloco) return null
  return Object.fromEntries(
    [...bloco[1].matchAll(/'([\w-]+)':\s*\{\s*ms:\s*(\d+)/g)].map((m) => [m[1], Number(m[2])]),
  )
}

/**
 * Liga um observador de animações ANTES da ação e devolve tudo que rodou durante ela:
 * pseudos de view transition e as keyframes `tr-*` dos elementos reais (a queda).
 * Amostra por quadro porque uma transição de 180ms não espera a viagem de ida e volta.
 */
async function observar(pg, acao, limite = 800) {
  const colheita = pg.evaluate(
    (ms) =>
      new Promise((resolve) => {
        const achados = new Map()
        const fim = performance.now() + ms
        const passo = () => {
          for (const a of document.getAnimations()) {
            const pseudo = a.effect?.pseudoElement ?? null
            const nome = a.animationName ?? ''
            const daTransicao = (pseudo && pseudo.startsWith('::view-transition')) || nome.startsWith('tr-')
            // Só o que está rodando AGORA: animação com `fill: both` fica para sempre
            // em `getAnimations()` depois de acabar, e contaria de novo na troca seguinte.
            if (!daTransicao || a.playState !== 'running') continue
            const chave = `${pseudo ?? 'elemento'}|${nome}`
            if (achados.has(chave)) continue
            const t = a.effect.getComputedTiming()
            let recorte = null
            try {
              recorte = a.effect.getKeyframes()[0]?.clipPath ?? null
            } catch {}
            achados.set(chave, {
              pseudo,
              nome,
              dur: Number(t.duration) || 0,
              atraso: Number(t.delay) || 0,
              recorte,
            })
          }
          if (performance.now() < fim) requestAnimationFrame(passo)
          else resolve([...achados.values()])
        }
        requestAnimationFrame(passo)
      }),
    limite,
  )
  await acao()
  return colheita
}

const maisLonga = (lista) => lista.reduce((m, a) => Math.max(m, a.dur + a.atraso), 0)
const comMovimento = (lista) => lista.filter((a) => a.nome && a.nome !== 'tr-segura' && !a.nome.startsWith('-ua-'))

async function entrar(pg, url) {
  await pg.goto(url, { waitUntil: 'networkidle' })
  await pg.waitForFunction(() => !document.querySelector('#conteudo')?.hasAttribute('inert'), { timeout: 10000 })
}

async function abrirRaioX(pg, url, slug = 'prensado-completo') {
  await entrar(pg, url)
  await pg.click(`[data-item-cardapio="${slug}"] [data-add]`)
  await pg.waitForSelector(`[data-item-cardapio="${slug}"] [data-modificar]`, { timeout: 5000 })
}

export async function verificarPrompt21(navegador, url, diz, recorte, guardarFoto) {
  // ---------- a tabela ----------
  const tabela = lerTabela()
  if (!tabela) {
    diz(false, 'P21: tabela de transições ilegível em lib/transicoes.ts')
  } else {
    const divergentes = Object.entries(TABELA_DO_PROMPT).filter(([k, v]) => tabela[k] !== v)
    diz(
      divergentes.length === 0,
      `P21: tabela do código bate com a do prompt em ${Object.keys(TABELA_DO_PROMPT).length} trocas` +
        `${divergentes.length ? `: ${divergentes.map(([k, v]) => `${k} ${tabela[k]}≠${v}`).join(', ')}` : ''}`,
    )
    const acima = Object.entries(tabela).filter(([, v]) => v > TETO_MS)
    diz(
      acima.length === 0,
      `P21: nenhuma duração declarada acima de ${TETO_MS}ms (maior: ${Math.max(...Object.values(tabela))}ms)` +
        `${acima.length ? ` — ${acima.map(([k, v]) => `${k} ${v}`).join(', ')}` : ''}`,
    )
  }

  const ctx = await navegador.newContext({ viewport: CELULAR, deviceScaleFactor: 1 })
  const pg = await ctx.newPage()
  const medidas = []
  try {
    // ---------- cardápio → raio-x: cresce do retângulo do cartão tocado ----------
    await abrirRaioX(pg, url)
    // O retângulo tem de ser lido NO instante do toque: o clique do Playwright rola a
    // página para o botão aparecer, e um retângulo medido antes disso mede outra tela.
    await pg.evaluate(() => {
      document.addEventListener(
        'click',
        (e) => {
          const cartao = e.target.closest('[data-item-cardapio]')
          if (!cartao) return
          const r = cartao.getBoundingClientRect()
          window.__cartaoQA = { x: r.x, y: r.y, width: r.width, height: r.height }
        },
        true,
      )
    })
    const entrada = await observar(pg, () =>
      pg.click('[data-item-cardapio="prensado-completo"] [data-modificar]'))
    const cartao = await pg.evaluate(() => window.__cartaoQA)
    medidas.push({ nome: 'cardápio → raio-x', ms: maisLonga(entrada), n: entrada.length })
    await pg.waitForSelector('#rx-takeover', { timeout: 5000 })

    // Prompt 23 substituiu clip-path por deslocamento + scale leve.
    const origem = await pg.evaluate(() => {
      const cs = getComputedStyle(document.documentElement)
      return { x: parseFloat(cs.getPropertyValue('--tr-origem-x')), y: parseFloat(cs.getPropertyValue('--tr-origem-y')) }
    })
    const erro = Math.max(Math.abs(origem.x - cartao.x - cartao.width / 2), Math.abs(origem.y - cartao.y - cartao.height / 2))
    diz(erro <= 1, `P23: origem do gesto é o cartão tocado (erro ${erro.toFixed(1)}px)`)
    const cresce = entrada.find(a => a.nome === 'tr-cresce-do-cartao')
    diz(!!cresce && !cresce.pseudo && !cresce.recorte, 'P23: celular usa crescimento no elemento real, sem clip-path e sem captura')

    // ---------- o mascote não existe no DOM com o raio-x aberto ----------
    const comRaioX = await pg.evaluate(() => ({
      mascotes: document.querySelectorAll('[data-mascote]').length,
      takeover: !!document.querySelector('#rx-takeover'),
    }))
    diz(
      comRaioX.takeover && comRaioX.mascotes === 0,
      `P21: com o raio-x aberto o mascote não existe no DOM (${comRaioX.mascotes} encontrados)`,
    )

    // ---------- folha de ingredientes ----------
    const folha = await observar(pg, () => pg.click('#rx-abrir-trilho'))
    medidas.push({ nome: 'folha de ingredientes', ms: maisLonga(folha), n: folha.length })
    await pg.waitForSelector('#rx-trilho-folha')
    const sobe = folha.find((a) => a.nome === 'tr-sobe-da-base')
    diz(!!sobe, `P21: a folha de ingredientes sobe da base (${sobe ? `${sobe.dur}ms` : 'não subiu'})`)
    const fechaFolha = await observar(pg, () => pg.click('#rx-fechar-trilho'))
    medidas.push({ nome: 'fechar folha', ms: maisLonga(fechaFolha), n: fechaFolha.length })

    // ---------- raio-x → cardápio ----------
    const volta = await observar(pg, () => pg.click('#rx-fechar'))
    medidas.push({ nome: 'raio-x → cardápio', ms: maisLonga(volta), n: volta.length })
    await pg.waitForSelector('#rx-takeover', { state: 'detached', timeout: 5000 })
    diz(
      !!volta.find((a) => a.nome === 'tr-encolhe-no-cartao'),
      `P21: a volta encolhe para o cartão de origem (${volta.map((a) => a.nome).join(', ') || 'nada'})`,
    )

    // ---------- o mascote volta, e o cardápio tem o dele ----------
    const depois = await pg.evaluate(() => document.querySelectorAll('[data-mascote]').length)
    diz(depois > 0, `P21: fechado o raio-x, o mascote volta ao DOM (${depois})`)

    // ---------- carrinho ----------
    const abre = await observar(pg, () => pg.click('[data-abrir-carrinho]'))
    medidas.push({ nome: 'abrir carrinho', ms: maisLonga(abre), n: abre.length })
    await pg.waitForSelector('[data-carrinho]')
    diz(
      !!abre.find((a) => a.nome === 'tr-sobe-da-base'),
      `P21: o carrinho sobe da base (${abre.map((a) => a.nome).join(', ') || 'nada'})`,
    )

    // ---------- confirmação: entra pela direita ----------
    const passo = await observar(pg, () => pg.click('#carrinho-resumo'))
    medidas.push({ nome: 'confirmação do pedido', ms: maisLonga(passo), n: passo.length })
    diz(
      !!passo.find((a) => a.nome === 'tr-vem-da-direita'),
      `P21: a confirmação entra pela direita (${passo.map((a) => a.nome).join(', ') || 'nada'})`,
    )
    const voltaPasso = await observar(pg, () => pg.click('button:has-text("Voltar aos itens")'))
    medidas.push({ nome: 'voltar da confirmação', ms: maisLonga(voltaPasso), n: voltaPasso.length })
    diz(
      !!voltaPasso.find((a) => a.nome === 'tr-vai-pra-direita'),
      `P21: voltar da confirmação sai pela direita (${voltaPasso.map((a) => a.nome).join(', ') || 'nada'})`,
    )
    const fecha = await observar(pg, () => pg.click('#carrinho-fechar'))
    medidas.push({ nome: 'fechar carrinho', ms: maisLonga(fecha), n: fecha.length })

    // ---------- troca de filtro: a grade reencaixa escalonada ----------
    const grade = await observar(pg, () => pg.click('[data-filtro-forma="redondo"]'))
    diz(!grade.some(a => a.nome === 'tr-reencaixa'), 'P23: filtro no celular troca de uma vez, sem escalonamento por item')

    // ---------- o teto ----------
    const estouros = medidas.filter((m) => m.ms > TETO_MS + 0.5)
    diz(
      estouros.length === 0,
      `P21: nenhuma transição medida acima de ${TETO_MS}ms — a mais longa foi ` +
        `${Math.max(...medidas.map((m) => m.ms))}ms` +
        `${estouros.length ? ` (${estouros.map((m) => `${m.nome} ${m.ms}ms`).join(', ')})` : ''}`,
    )
    medidas.forEach((m) => diz(m.ms <= TETO_MS + 0.5 && m.n > 0, `P21: ${m.nome}: ${m.ms}ms em ${m.n} animações`))

    // ---------- os olhos seguem, e o carrinho vazio recebe o mascote ----------
    await entrar(pg, url)
    await pg.locator('.hero-faixa').scrollIntoViewIfNeeded()
    await pg.mouse.move(20, 120)
    await pg.waitForTimeout(650)
    const olharEsquerda = await pg.evaluate(() =>
      document.querySelector('[data-hero-mascote] [data-pupila]')?.getBoundingClientRect().x)
    await pg.mouse.move(370, 700)
    await pg.waitForTimeout(650)
    const olharDireita = await pg.evaluate(() =>
      document.querySelector('[data-hero-mascote] [data-pupila]')?.getBoundingClientRect().x)
    const lerX = (x) => x ?? null
    diz(
      olharEsquerda !== null && olharDireita !== null && lerX(olharDireita) > lerX(olharEsquerda) + 1,
      `P21: a pupila acompanha o cursor (x ${lerX(olharEsquerda)} → ${lerX(olharDireita)})`,
    )

    await pg.click('[data-abrir-carrinho]')
    await pg.waitForSelector('[data-carrinho]')
    const vazio = await pg.evaluate(() => ({
      mascotes: document.querySelectorAll('[data-carrinho] [data-mascote]').length,
      texto: document.querySelector('[data-carrinho] .vazio p')?.textContent ?? '',
    }))
    diz(
      vazio.mascotes === 1 && vazio.texto.includes('vazio'),
      `P21: o carrinho vazio recebe o mascote (${vazio.mascotes}) junto de "${vazio.texto}"`,
    )
    await recorte('carrinho vazio com o mascote · 390px', '[data-carrinho]', pg)
    await pg.click('#carrinho-fechar')

    // ---------- recortes: o letreiro pintado, e a transição em três quadros ----------
    await pg.locator('#rodape').scrollIntoViewIfNeeded()
    await pg.waitForTimeout(200)
    await recorte('letreiro do rodapé com o mascote · 390px', '#rodape .letreiro-pequeno', pg)
    await congelarLetreiro(pg, url)
    // A tabuleta deixou o letreiro mais alto. Ele continua tendo de caber na intro
    // inteiro, sem cortar e sem empurrar o botão de pular para fora.
    const naIntro = await pg.evaluate(() => {
      const intro = document.getElementById('intro').getBoundingClientRect()
      const placa = document.querySelector('.intro-letreiro').getBoundingClientRect()
      const pular = document.getElementById('intro-pular').getBoundingClientRect()
      return {
        cabe: placa.top >= intro.top - 0.5 && placa.bottom <= intro.bottom + 0.5 &&
          placa.left >= intro.left - 0.5 && placa.right <= intro.right + 0.5,
        livre: placa.bottom <= pular.top + 0.5,
        placa: [Math.round(placa.width), Math.round(placa.height)],
        intro: [Math.round(intro.width), Math.round(intro.height)],
      }
    })
    diz(
      naIntro.cabe && naIntro.livre,
      `P21: o letreiro com a tabuleta cabe inteiro na intro — ${naIntro.placa.join('×')} ` +
        `dentro de ${naIntro.intro.join('×')}, sem encostar no botão de pular`,
    )
    await recorte('letreiro da intro com o mascote · 390px', '.intro-letreiro', pg)

    await quadrosDaTransicao(pg, url, guardarFoto)
  } finally {
    await ctx.close()
  }

  // ---------- movimento reduzido ----------
  const ctxParado = await navegador.newContext({
    viewport: CELULAR,
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  const pgParado = await ctxParado.newPage()
  try {
    await abrirRaioX(pgParado, url)
    const semAnimacao = await observar(pgParado, () =>
      pgParado.click('[data-item-cardapio="prensado-completo"] [data-modificar]'), 600)
    await pgParado.waitForSelector('#rx-takeover', { timeout: 5000 })
    const marca = await pgParado.evaluate(() => document.documentElement.dataset.transicao ?? null)
    diz(
      comMovimento(semAnimacao).length === 0 && marca === null,
      `P21: com movimento reduzido nenhuma transição anima (${comMovimento(semAnimacao).length} animações, ` +
        `marca ${marca ?? 'nenhuma'}) e a troca é direta`,
    )
    await pgParado.click('#rx-fechar')
    await pgParado.waitForSelector('#rx-takeover', { state: 'detached' })
    const antes = await pgParado.evaluate(() =>
      document.querySelector('[data-mascote] [data-pupila]')?.getAttribute('transform') ?? 'sem-transform')
    await pgParado.mouse.move(20, 100)
    await pgParado.waitForTimeout(300)
    await pgParado.mouse.move(360, 780)
    await pgParado.waitForTimeout(700)
    const depois = await pgParado.evaluate(() =>
      document.querySelector('[data-mascote] [data-pupila]')?.getAttribute('transform') ?? 'sem-transform')
    diz(
      antes === 'sem-transform' && depois === 'sem-transform',
      `P21: com movimento reduzido os olhos não se mexem (${antes} → ${depois})`,
    )
  } finally {
    await ctxParado.close()
  }

  // ---------- a queda, sem View Transitions API ----------
  const ctxQueda = await navegador.newContext({ viewport: CELULAR, deviceScaleFactor: 1 })
  await ctxQueda.addInitScript(() => {
    delete Document.prototype.startViewTransition
  })
  const pgQueda = await ctxQueda.newPage()
  try {
    await abrirRaioX(pgQueda, url)
    const semVT = await observar(pgQueda, () =>
      pgQueda.click('[data-item-cardapio="prensado-completo"] [data-modificar]'))
    await pgQueda.waitForSelector('#rx-takeover', { timeout: 5000 })
    const nosElementos = semVT.filter((a) => !a.pseudo)
    diz(
      nosElementos.some((a) => a.nome === 'tr-cresce-do-cartao') && maisLonga(semVT) <= TETO_MS + 0.5,
      `P21: sem a View Transitions API a queda anima os elementos reais ` +
        `(${nosElementos.map((a) => `${a.nome} ${a.dur}ms`).join(', ') || 'nada'})`,
    )
    const saida = await observar(pgQueda, () => pgQueda.click('#rx-fechar'))
    await pgQueda.waitForSelector('#rx-takeover', { state: 'detached', timeout: 5000 })
    diz(
      saida.some((a) => a.nome === 'tr-encolhe-no-cartao') && maisLonga(saida) <= TETO_MS + 0.5,
      `P21: na queda a saída também anima antes de sumir ` +
        `(${saida.map((a) => `${a.nome} ${a.dur}ms`).join(', ') || 'nada'})`,
    )
  } finally {
    await ctxQueda.close()
  }
}

const creske = (a) =>
  a ? `${a.nome}, ${a.dur}ms, recorte ${a.recorte ?? 'não legível pela API'}` : 'nenhuma animação de crescimento'

/**
 * Segura a intro acesa para o recorte: a sequência já terminou quando o QA chega aqui,
 * então a marca de aceso é removida à mão e a ignição é fixada no fim por style inline —
 * cancelar a animação deixaria o CSS recriá-la.
 */
async function congelarLetreiro(pg, url) {
  await pg.goto(url, { waitUntil: 'networkidle' })
  await pg.waitForFunction(() => !document.querySelector('#conteudo')?.hasAttribute('inert'), { timeout: 10000 })
  await pg.evaluate(() => {
    const intro = document.getElementById('intro')
    document.documentElement.removeAttribute('data-lt-aceso')
    intro.hidden = false
    intro.style.animation = 'none'
    intro.style.transform = 'none'
    const svg = document.getElementById('lt-svg')
    svg.style.animation = 'none'
    for (const el of svg.querySelectorAll('#lt-halo, #lt-letras-acesas')) { el.style.animation = 'none'; el.style.opacity = '1' }
  })
  await pg.waitForTimeout(250)
}

/** Três quadros da transição do cardápio para o raio-x, com as animações pausadas. */
async function quadrosDaTransicao(pg, url, guardarFoto) {
  if (!guardarFoto) return
  await pg.goto(url, { waitUntil: 'networkidle' })
  await pg.waitForFunction(() => !document.querySelector('#conteudo')?.hasAttribute('inert'), { timeout: 10000 })
  await pg.click('[data-item-cardapio="prensado-completo"] [data-add]')
  await pg.waitForSelector('[data-item-cardapio="prensado-completo"] [data-modificar]')
  const pausado = pg.evaluate(
    () =>
      new Promise((resolve) => {
        const fim = performance.now() + 1500
        const passo = () => {
          const as = document.getAnimations().filter((a) => a.effect?.pseudoElement?.startsWith('::view-transition'))
          if (as.length) {
            as.forEach((a) => {
              a.pause()
              a.currentTime = 30
            })
            resolve(as.length)
          } else if (performance.now() < fim) requestAnimationFrame(passo)
          else resolve(0)
        }
        requestAnimationFrame(passo)
      }),
  )
  await pg.click('[data-item-cardapio="prensado-completo"] [data-modificar]')
  const quantas = await pausado
  if (!quantas) return
  for (const t of [30, 110, 200]) {
    await pg.evaluate((ms) => {
      for (const a of document.getAnimations()) {
        if (a.effect?.pseudoElement?.startsWith('::view-transition')) a.currentTime = ms
      }
    }, t)
    await pg.waitForTimeout(60)
    guardarFoto(`cardápio → raio-x · ${t}ms de 240`, await pg.screenshot({ type: 'jpeg', quality: 55 }))
  }
  await pg.evaluate(() => {
    for (const a of document.getAnimations()) {
      if (a.effect?.pseudoElement?.startsWith('::view-transition')) a.finish()
    }
  })
}
