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
  if (!extname(arquivo)) arquivo += '.ts'
  if (cache.has(arquivo)) return cache.get(arquivo)
  const fonte = readFileSync(arquivo, 'utf8')
  if (arquivo.endsWith('.json')) return JSON.parse(fonte)
  const js = ts.transpileModule(fonte, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText
  const m = { exports: {} }; cache.set(arquivo, m.exports)
  const localRequire = caminho => caminho.startsWith('@/') ? carregar(resolve(raiz, caminho.slice(2))) : caminho.startsWith('.') ? carregar(resolve(dirname(arquivo), caminho)) : require(caminho)
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`, { filename: arquivo })(localRequire, m, m.exports)
  cache.set(arquivo, m.exports); return m.exports
}
const { horarioDaCasa } = carregar(resolve(raiz, 'lib/horario.ts'))
const { itemFixo, itemExtra, itemLanche, ganchoDoPedido, comBacon, resumoPedido, totalPedido } = carregar(resolve(raiz, 'lib/pedido.ts'))
const { FIXOS, EXTRAS } = carregar(resolve(raiz, 'data/fixos.ts'))
const { CAMADAS, MAPA_CAMADAS } = carregar(resolve(raiz, 'data/camadas.ts'))
const { geometria, PISO_ESCALA, PISO_FOLGA, espalhaXDe } = carregar(resolve(raiz, 'components/raio-x/prensa.ts'))
const { precoDoFixo, precoDaComposicao } = carregar(resolve(raiz, 'lib/precos.ts'))
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
teste('resumo de WhatsApp inclui composição e quantidades, não só nomes', () => {
  const ped = [{ ...base, qtd: 2 }, bebida]
  const texto = resumoPedido(ped)
  assert.ok(texto.includes('2 × Prensado de Frango'))
  assert.ok(texto.includes(base.resumo))
  assert.equal(totalPedido(ped), base.cent * 2 + bebida.cent)
  assert.ok(texto.includes('Pagamento: Dinheiro, Pix, Débito, Crédito.'))
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
teste('CSS tem apenas os seis tokens de cor', () => {
  const css = readFileSync(join(raiz, 'app/globals.css'), 'utf8')
  const tokens = [...css.matchAll(/(--[\w-]+):\s*#[\dA-Fa-f]{6}/g)].map(m => m[1]).sort()
  assert.deepEqual(tokens, ['--borra', '--fumo', '--traco', '--osso', '--latao', '--letreiro'].sort())
  const cores = new Set([...css.matchAll(/#[\dA-Fa-f]{6}\b/g)].map(m => m[0].toUpperCase()))
  assert.deepEqual([...cores].sort(), ['#120D0B', '#1C1512', '#33251E', '#E9E0D3', '#A9762F', '#A8C6D4'].sort())
})
console.log(`\n${total} testes de regras passaram. Geometria de tela e capturas dependem de npm run qa.`)
