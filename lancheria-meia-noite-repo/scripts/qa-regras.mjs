// Testes das regras reais, sem navegador e sem cópia das funções de produção.
import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, extname, join } from 'node:path'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
const require = createRequire(import.meta.url)
const raiz = resolve(import.meta.dirname, '..')
const cache = new Map()
function carregar(arquivo) {
  if (!extname(arquivo)) arquivo += existsSync(arquivo + '.ts') ? '.ts' : '.tsx'
  if (cache.has(arquivo)) return cache.get(arquivo)
  const fonte = readFileSync(arquivo, 'utf8')
  if (arquivo.endsWith('.json')) return JSON.parse(fonte)
  const js = ts.transpileModule(fonte, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const m = { exports: {} }; cache.set(arquivo, m.exports)
  const localRequire = caminho => caminho.startsWith('@/') ? carregar(resolve(raiz, caminho.slice(2))) : caminho.startsWith('.') ? carregar(resolve(dirname(arquivo), caminho)) : require(caminho)
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`, { filename: arquivo })(localRequire, m, m.exports)
  cache.set(arquivo, m.exports); return m.exports
}
const { horarioDaCasa } = carregar(resolve(raiz, 'lib/horario.ts'))
const { itemFixo, itemExtra, itemLanche, ganchoDoPedido, comBacon, resumoPedido, totalPedido, validarConfirmacao, urlWhatsApp, CONFIRMACAO_INICIAL } = carregar(resolve(raiz, 'lib/pedido.ts'))
const { FIXOS, EXTRAS } = carregar(resolve(raiz, 'data/fixos.ts'))
const { CAMADAS, MAPA_CAMADAS } = carregar(resolve(raiz, 'data/camadas.ts'))
const { geometria, PISO_ESCALA, PISO_FOLGA, espalhaXDe } = carregar(resolve(raiz, 'components/raio-x/prensa.ts'))
const { precoDoFixo, precoDaComposicao, precoDoLanche, camadaFixa, diferencaCamadas } = carregar(resolve(raiz, 'lib/precos.ts'))
let total = 0
function teste(nome, fn) { fn(); total++; console.log(`ok  ${nome}`) }
for (const [hora, aberto, ultimos] of [['03:29', true, false], ['03:30', true, true], ['04:00', true, true], ['04:01', false, false], ['17:59', false, false], ['18:00', true, false], ['23:59', true, false], ['00:00', true, false]]) {
  teste(`horário de São Paulo ${hora}: aberto=${aberto}, últimos=${ultimos}`, () => {
    const h = horarioDaCasa(new Date(`2026-09-11T${hora}:00-03:00`))
    assert.equal(h.aberto, aberto); assert.equal(h.ultimos, ultimos)
    if (!aberto) assert.equal(h.texto, 'Fechada. Abre hoje às 18h.')
    if (ultimos) assert.equal(h.texto, 'Aberto. Últimos pedidos.')
  })
}
teste('um mesmo instante não depende do fuso do dispositivo', () => {
  assert.deepEqual(horarioDaCasa(new Date('2026-09-11T21:00:00Z')), horarioDaCasa(new Date('2026-09-11T18:00:00-03:00')))
})
for (const f of FIXOS) teste(`${f.slug}: preço, chave e composição coerentes entre grade e raio-x`, () => {
  const item = itemFixo(f)
  assert.equal(item.cent, precoDoFixo(f))
  assert.equal(item.cent, precoDaComposicao(f.camadas))
  assert.equal(itemLanche(item).chave, item.chave)
  assert.ok(existsSync(join(raiz, 'public', item.foto)))
  assert.equal(item.camadas.filter(s => MAPA_CAMADAS[s].pao).length, 2)
})
const base = { ...itemFixo(FIXOS.find(f => f.slug === 'prensado-frango')), id: 'p1', qtd: 1 }
const bebida = { ...itemExtra(EXTRAS.find(e => e.slug === 'refri')), id: 'p2', qtd: 1 }
const batata = { ...itemExtra(EXTRAS.find(e => e.slug === 'batata-frita')), id: 'p3', qtd: 1 }
teste('sem lanche não há gancho', () => assert.equal(ganchoDoPedido([bebida], [], []), null))
teste('bebida tem prioridade', () => assert.equal(ganchoDoPedido([base], [], []).id, 'bebida'))
teste('duas unidades da mesma linha contam para batata', () => assert.equal(ganchoDoPedido([{ ...base, qtd: 2 }, bebida], [], []).id, 'batata'))
teste('bebida dispensada não volta', () => assert.notEqual(ganchoDoPedido([base], ['bebida'], ['bebida'])?.id, 'bebida'))
teste('no máximo dois ganchos distintos na sessão', () => assert.equal(ganchoDoPedido([base, bebida, batata], ['bebida', 'batata'], []), null))
teste('o segundo gancho visto continua até resolução', () => assert.equal(ganchoDoPedido([base, bebida], ['bebida', 'bacon'], []).id, 'bacon'))
teste('dispensar os dois não abre um terceiro', () => assert.equal(ganchoDoPedido([base], ['bebida', 'bacon'], ['bebida', 'bacon']), null))
teste('bacon não aparece quando não cabe no teto de 16 camadas', () => assert.equal(ganchoDoPedido([{ ...base, camadas: Array.from({ length: 16 }, () => 'carne') }, bebida], [], []), null))
teste('bacon respeita molho no pão de cima e conserva a ordem existente', () => {
  const original = ['pao-prensado-base', 'carne', 'tomate', 'molho', 'pao-prensado-topo']
  const nova = comBacon(original)
  assert.deepEqual(nova.filter(s => s !== 'bacon'), original)
  assert.equal(nova.at(-2), 'molho')
  assert.deepEqual(comBacon(nova), nova)
  assert.equal(precoDaComposicao(nova) - precoDaComposicao(original), MAPA_CAMADAS.bacon.precoCent)
})
teste('resumo de WhatsApp inclui alterações, composição do montador e quantidades', () => {
  const editado = itemLanche({ ...base, camadas: comBacon(base.camadas.filter(s => s !== 'tomate')), observacao: 'bem passado' })
  const montado = itemLanche({ ...base, fixoSlug: undefined, nome: 'Seu prensado' })
  const ped = [{ ...editado, id: 'p1', qtd: 2 }, bebida, { ...montado, id: 'p3', qtd: 1 }]
  const dados = { ...CONFIRMACAO_INICIAL, nome: 'Ana', pagamento: 'Pix' }
  const texto = resumoPedido(ped, dados)
  assert.ok(texto.includes('2× Prensado de Frango'))
  assert.ok(texto.includes('   + bacon\n   − tomate\n   obs: bem passado'))
  assert.ok(texto.includes(montado.resumo))
  assert.equal(totalPedido(ped), editado.cent * 2 + bebida.cent + montado.cent)
  assert.ok(texto.includes('Pagamento: Pix'))
  assert.ok(texto.includes('Retirada no balcão'))
})
teste('extras sem foto, sem composição e sem salto de lanche', () => {
  for (const e of EXTRAS) { const item = itemExtra(e); assert.equal(e.icone, ''); assert.equal(item.foto, ''); assert.equal(item.camadas.length, 0); assert.equal(item.grupo, e.grupo) }
})
for (const f of FIXOS) teste(`${f.slug}: geometria respeita folga, escala e espalhamento`, () => {
  for (const [w, h, chamadas] of [[390, 550, false], [612, 640, true], [990, 640, true]]) {
    for (const comprimido of [false, true]) {
      const g = geometria({ slugs: f.camadas, areaW: w, areaH: h, forma: f.forma, chamadas, comprimido })
      assert.ok(g.k >= g.escalaNatural * PISO_ESCALA - 1e-9)
      assert.ok(g.folga >= PISO_FOLGA && g.folga <= 1)
    }
  }
  assert.ok(espalhaXDe(f.camadas) >= 1.16 && espalhaXDe(f.camadas) <= 1.3)
})
teste('piso de escala continua rígido mesmo na vizinhança do epsilon', () => {
  const slugs = ['pao-prensado-base', ...Array(3).fill('carne'), ...Array(3).fill('alface'), ...Array(3).fill('ovo'), ...Array(3).fill('queijo'), 'bacon', 'pao-prensado-topo']
  for (let areaH = 200; areaH < 800; areaH += .5) {
    const g = geometria({ slugs, areaW: 612, areaH, forma: 'prensado', chamadas: true, comprimido: false })
    assert.ok(g.k >= g.escalaNatural * PISO_ESCALA - 1e-9)
    assert.ok(g.folga >= PISO_FOLGA)
  }
})
teste('todos os assets exigidos existem sem reprocessamento', () => {
  for (const c of CAMADAS) { assert.ok(existsSync(join(raiz, 'public', c.arquivo))); assert.ok(existsSync(join(raiz, 'public', c.ficha))) }
  for (const p of ['chapa/chapa-selagem.webp', 'chapa/chapa-vazia.webp', 'macro/macro-corte.webp', 'macro/macro-chapa.webp']) assert.ok(existsSync(join(raiz, 'public', p)))
})
const fontes = ['components/cardapio', 'components/pedido', 'lib'].flatMap(dir => readdirSync(join(raiz, dir)).filter(f => /\.tsx?$/.test(f)).map(f => join(raiz, dir, f)))
teste('código novo não introduz medida em gramas ou centímetros', () => {
  for (const p of fontes) assert.doesNotMatch(readFileSync(p, 'utf8'), /alturaCm|pesoG|\b\d+\s*(?:cm|gramas)\b/)
})
const { TEMAS, TEMA, selecionarTema, estiloTema } = carregar(resolve(raiz, 'temas/index.ts'))
teste('os quatro temas declaram exatamente seis cores e o CSS não duplica paletas', () => {
  assert.equal(TEMAS.length, 4)
  const css = ['app/globals.css', 'app/temas.css'].map(p => readFileSync(join(raiz, p), 'utf8')).join('\n')
  assert.doesNotMatch(css, /#[\dA-Fa-f]{6}\b|--accent\b/)
  for (const tema of TEMAS) {
    assert.deepEqual(Object.keys(tema.cores).sort(), ['base','superficie','traco','texto','quente','frio'].sort())
    assert.notEqual(tema.cores.quente, tema.cores.frio)
    assert.equal(estiloTema(tema)['--latao'], tema.cores.quente)
    assert.equal(estiloTema(tema)['--letreiro'], tema.cores.frio)
  }
  assert.equal(TEMA.slug, 'meia-noite')
  assert.equal(selecionarTema('inexistente').slug, 'meia-noite')
  assert.equal(selecionarTema('__proto__').slug, 'meia-noite')
})
teste('Prático carrega só Inter e Cantina não registra fonte monoespaçada', () => {
  for (const tema of TEMAS) {
    const css = readFileSync(join(raiz, `public/fontes/${tema.slug}.css`), 'utf8')
    const familias = [...new Set([...css.matchAll(/font-family: '([^']+)'/g)].map(m => m[1]))].sort()
    assert.deepEqual(familias, [...new Set(Object.values(tema.fontes))].sort())
    if (tema.slug === 'pratico') assert.deepEqual(familias, ['Inter'])
    if (tema.slug === 'cantina') {
      assert.deepEqual(familias, ['Lora', 'Playfair Display'])
      assert.ok(!estiloTema(tema)['--fonte-medida'].includes('mono'))
    }
  }
})


for (const f of FIXOS) {
  teste(`${f.slug}: remover originais não desconta; acrescentar cobra por ocorrência`, () => {
    const original = precoDoFixo(f)
    const removivel = f.camadas.find(s => !camadaFixa(s, f.slug))
    const menos = f.camadas.filter(s => s !== removivel)
    assert.equal(precoDoLanche(menos, f.slug), original)
    assert.equal(precoDoLanche([...menos, removivel], f.slug), original)
    assert.equal(precoDoLanche([...menos, 'bacon'], f.slug), original + MAPA_CAMADAS.bacon.precoCent)
    assert.equal(precoDoLanche([...f.camadas, 'carne', 'carne'], f.slug), original + 2 * MAPA_CAMADAS.carne.precoCent)
    assert.equal(precoDoLanche(f.camadas.slice().reverse(), f.slug), original)
  })
}
teste('montador desconta a camada retirada e mantém o modo depois de salvar', () => {
  const completo = itemLanche({ ...base, fixoSlug: undefined })
  const reduzido = itemLanche({ ...completo, camadas: completo.camadas.filter(s => s !== 'tomate') })
  assert.equal(completo.cent - reduzido.cent, MAPA_CAMADAS.tomate.precoCent)
  assert.equal(reduzido.fixoSlug, undefined)
  assert.equal(camadaFixa('carne'), false)
  assert.equal(camadaFixa('pao-base'), true)
})
teste('identidade e piso do fixo sobrevivem a duas edições', () => {
  const menos = itemLanche({ ...base, camadas: base.camadas.filter(s => s !== 'tomate') })
  const mais = itemLanche({ ...menos, camadas: comBacon(menos.camadas) })
  const voltou = itemLanche({ ...mais, camadas: mais.camadas.filter(s => s !== 'bacon') })
  assert.equal(mais.fixoSlug, base.fixoSlug)
  assert.equal(menos.cent, base.cent)
  assert.equal(mais.cent, base.cent + MAPA_CAMADAS.bacon.precoCent)
  assert.equal(voltou.cent, base.cent)
  assert.equal(voltou.foto, base.foto)
})
teste('repetições são diferenças de multiconjunto, não de posição ou conjunto', () => {
  assert.deepEqual(diferencaCamadas(['queijo', 'queijo', 'carne'], ['queijo', 'tomate', 'carne']), { acrescentadas: ['queijo'], removidas: ['tomate'] })
})
teste('observações distintas e modos de preço distintos não fundem linhas', () => {
  assert.notEqual(itemLanche({ ...base, observacao: 'bem passado' }).chave, itemLanche({ ...base, observacao: 'sem molho' }).chave)
  assert.notEqual(itemLanche(base).chave, itemLanche({ ...base, fixoSlug: undefined }).chave)
  assert.equal(itemLanche({ ...base, observacao: 'x'.repeat(121) }).observacao.length, 120)
})
const { createElement } = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const Composicao = carregar(resolve(raiz, 'components/raio-x/Composicao.tsx')).default
for (const f of FIXOS) teste(`${f.slug}: essenciais marcadas não renderizam controle de remover`, () => {
  const html = renderToStaticMarkup(createElement(Composicao, {
    pilha: f.camadas.map((slug, uid) => ({ slug, uid })), fixa: slug => camadaFixa(slug, f.slug),
    onTirar() {}, onMover() {}, onFechar() {},
  }))
  const linhas = [...html.matchAll(/<li\b[^>]*data-slug="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g)]
  assert.equal(linhas.length, f.camadas.length)
  for (const [linha, slug, conteudo] of linhas) {
    if (f.essenciais.includes(slug)) {
      assert.ok(linha.includes('data-fixa=""'))
      assert.ok(conteudo.includes('fixa'))
      assert.ok(!conteudo.includes('data-tirar='))
    } else assert.ok(conteudo.includes('data-tirar='))
  }
})
teste('validação aponta cada falta e exige endereço apenas na entrega', () => {
  assert.deepEqual(validarConfirmacao(CONFIRMACAO_INICIAL), { nome: 'Falta o nome', pagamento: 'Falta a forma de pagamento' })
  const entrega = { ...CONFIRMACAO_INICIAL, nome: ' Ana ', recebimento: 'entrega', pagamento: 'Dinheiro' }
  assert.deepEqual(validarConfirmacao(entrega), { endereco: 'Falta o endereço' })
  assert.deepEqual(validarConfirmacao({ ...entrega, endereco: 'Rua 1, 2' }), {})
  assert.deepEqual(validarConfirmacao({ ...entrega, recebimento: 'retirada', troco: 'abc' }), { troco: 'Confira o valor do troco' })
})
teste('WhatsApp tem o número real e texto codificado, com entrega, troco e notas', () => {
  const dados = { ...CONFIRMACAO_INICIAL, nome: 'João & Maria', recebimento: 'entrega', endereco: 'Rua São João, 10', complemento: 'apto 2', pagamento: 'Dinheiro', troco: '100,50', observacao: 'Chamar no portão #2' }
  const ped = [{ ...base, observacao: 'bem passado', qtd: 1 }]
  const url = urlWhatsApp(ped, dados)
  assert.ok(url.startsWith('https://wa.me/5544984570105?text='))
  assert.ok(url.includes('%0A') && url.includes('%26') && url.includes('%23'))
  const lida = new URL(url)
  assert.equal(lida.searchParams.get('text'), resumoPedido(ped, dados))
  assert.equal([...lida.searchParams.keys()].length, 1)
  assert.ok(lida.searchParams.get('text').includes('Entrega: Rua São João, 10, apto 2'))
  assert.ok(lida.searchParams.get('text').includes('Pagamento: Dinheiro (troco para R$ 100,50)'))
  const retirada = resumoPedido(ped, { ...dados, recebimento: 'retirada', pagamento: 'Pix' })
  assert.ok(!retirada.includes('Entrega:') && !retirada.includes('troco para'))
})
const { SCRIPT_ENTRADA, DURACAO_IGNICAO_MS, DURACAO_ENTRADA_MS, DURACAO_TOTAL_MS } = carregar(resolve(raiz, 'components/letreiro/sequencia.ts'))
function simularEntrada(segunda = false, reduzido = false) {
  const atributos = new Map(), timers = [], sessao = new Map(segunda ? [['lm:letreiro-aceso', '1']] : [])
  vm.runInNewContext(SCRIPT_ENTRADA, {
    document: { documentElement: { setAttribute: (k, v) => atributos.set(k, v) } },
    window: { matchMedia: () => ({ matches: reduzido }), setTimeout: (fn, ms) => timers.push({ fn, ms }) },
    performance: { now: () => 70 }, sessionStorage: { getItem: k => sessao.get(k), setItem: (k, v) => sessao.set(k, v) },
  })
  return { atributos, timers, sessao, desbloqueado: () => atributos.get('data-lt-aceso') === '1' }
}
teste('entrada: orçamento do script pré-paint <= 1,4s, ignição <= 800ms e subida <= 500ms', () => {
  assert.ok(DURACAO_IGNICAO_MS <= 800 && DURACAO_ENTRADA_MS <= 500)
  assert.equal(DURACAO_TOTAL_MS, DURACAO_IGNICAO_MS + DURACAO_ENTRADA_MS)
  const entrada = simularEntrada()
  assert.equal(entrada.atributos.get('data-lt-inicio'), '70')
  assert.equal(entrada.desbloqueado(), false)
  assert.equal(entrada.timers.length, 1)
  assert.ok(entrada.timers[0].ms <= 1400)
  entrada.timers[0].fn()
  assert.equal(entrada.desbloqueado(), true)
  assert.equal(entrada.atributos.get('data-lt-aceso'), '1')
  assert.equal(entrada.sessao.get('lm:letreiro-aceso'), '1')
})
teste('segunda visita e movimento reduzido não têm timer de entrada', () => {
  for (const entrada of [simularEntrada(true), simularEntrada(false, true)]) {
    assert.equal(entrada.timers.length, 0)
    assert.equal(entrada.desbloqueado(), true)
  }
})
console.log(`\n${total} testes de regras passaram. Geometria de tela e capturas dependem de npm run qa.`)
