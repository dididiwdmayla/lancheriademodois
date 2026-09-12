// Sem navegador. Analisa @keyframes/transition com PostCSS e strings inline com a AST TS.
// node scripts/qa-movimento-estatico.mjs [ref-git] — ref opcional para inventário anterior.
import { readFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import postcss from 'postcss'
import ts from 'typescript'

const ref = process.argv[2]
const prefixo = execFileSync('git', ['rev-parse', '--show-prefix'], { encoding: 'utf8' }).trim()
const ler = arquivo => ref
  ? execFileSync('git', ['show', `${ref}:${prefixo}${arquivo}`], { encoding: 'utf8' })
  : readFileSync(arquivo, 'utf8')
const listar = pasta => readdirSync(pasta, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? listar(`${pasta}/${e.name}`) : [`${pasta}/${e.name}`])
const fontes = (ref ? execFileSync('git', ['ls-tree', '-r', '--name-only', ref, '--', 'app', 'components', 'lib'], { encoding: 'utf8' }).trim().split('\n')
  : ['app', 'components', 'lib'].flatMap(listar)).filter(f => /\.(css|tsx?)$/.test(f))
const permitidas = new Set(['transform', 'opacity'])
const falhas = []
let keyframes = 0, transicoes = 0
const nomes = new Set()

function transicao(valor, onde, lista = false) {
  transicoes++
  const ast = postcss.list.comma(valor)
  for (const parte of ast) {
    const prop = (lista ? parte : postcss.list.space(parte)[0]).trim()
    if (!permitidas.has(prop) && prop !== 'none') falhas.push(`${onde}: transition ${prop} (${valor})`)
  }
}
function css(texto, onde) {
  const raiz = postcss.parse(texto, { from: onde })
  raiz.walkAtRules(/keyframes$/, regra => {
    keyframes++
    regra.walkDecls(d => { nomes.add(d.prop); if (!permitidas.has(d.prop)) falhas.push(`${onde}:${d.source.start.line} @keyframes ${regra.params}: ${d.prop}`) })
  })
  raiz.walkDecls(/^(transition|transition-property)$/, d => transicao(d.value, `${onde}:${d.source.start.line}`, d.prop === 'transition-property'))
}

// Parâmetros limitados deste projeto: transicao vem de RaioX.tsx, auditado abaixo;
// os outros interpolantes são durações/curvas. Qualquer interpolação nova falha fechada.
function valor(no) {
  if (ts.isStringLiteral(no) || ts.isNoSubstitutionTemplateLiteral(no)) return no.text
  if (ts.isIdentifier(no) && no.text === 'transicao') return 'transform 0ms'
  if (ts.isTemplateExpression(no)) {
    let s = no.head.text
    for (const parte of no.templateSpans) {
      const nome = parte.expression.getText()
      if (nome === 'transicao') s += 'transform 0ms'
      else if (['PRENSA_MS'].includes(nome)) s += '0'
      else if (['PRENSA_CURVA', 'CURVA_ASSENTA', 'CURVA_EXPLODE'].includes(nome)) s += 'linear'
      else if (nome === 'transicaoBarra') s += '0ms linear'
      else throw new Error(`Interpolação não auditada: ${nome}`)
      s += parte.literal.text
    }
    return s
  }
  throw new Error(`Expressão não auditada: ${no.getText()}`)
}
function alternativas(no) {
  return ts.isConditionalExpression(no) ? [...alternativas(no.whenTrue), ...alternativas(no.whenFalse)] : [no]
}
for (const arquivo of fontes) {
  let fonte
  try { fonte = ler(arquivo) } catch (erro) { if (ref && /does not exist|exists on disk, but not in/.test(String(erro.stderr))) continue; throw erro }
  if (arquivo.endsWith('.css')) { css(fonte, arquivo); continue }
  const ast = ts.createSourceFile(arquivo, fonte, ts.ScriptTarget.Latest, true, arquivo.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const visitar = no => {
    let expressao
    if (ts.isPropertyAssignment(no) && ['transition', 'transitionProperty'].includes(no.name.getText())) expressao = no.initializer
    if (ts.isBinaryExpression(no) && no.operatorToken.kind === ts.SyntaxKind.EqualsToken && /\.style\.transition$/.test(no.left.getText())) expressao = no.right
    if (ts.isVariableDeclaration(no) && no.name.getText() === 'transicao') expressao = no.initializer
    if (expressao) for (const item of alternativas(expressao)) {
      const onde = `${arquivo}:${ast.getLineAndCharacterOfPosition(no.getStart()).line + 1}`
      try { transicao(valor(item), onde) } catch (erro) { falhas.push(`${onde}: ${erro.message}`) }
    }
    // CSS inline dentro de <style>: aqui só há durações interpoladas.
    if (ts.isJsxElement(no) && no.openingElement.tagName.getText() === 'style') {
      for (const filho of no.children) if (ts.isJsxExpression(filho) && filho.expression) {
        const literal = filho.expression
        const texto = ts.isTemplateExpression(literal)
          ? literal.head.text + literal.templateSpans.map(p => `0${p.literal.text}`).join('') : literal.text
        if (typeof texto === 'string') css(texto, arquivo)
        else falhas.push(`${arquivo}: <style> não auditável`)
      }
    }
    ts.forEachChild(no, visitar)
  }
  visitar(ast)
}
console.log(`Arquivos: ${fontes.length}; @keyframes: ${keyframes}; declarações transition: ${transicoes}`)
console.log(`Propriedades em @keyframes: ${[...nomes].sort().join(', ')}`)
if (falhas.length) {
  falhas.forEach(f => console.log(`FALHA ${f}`))
  process.exitCode = 1
} else console.log('ok: somente transform/opacity em @keyframes e transition; nenhuma interpolação desconhecida.')
