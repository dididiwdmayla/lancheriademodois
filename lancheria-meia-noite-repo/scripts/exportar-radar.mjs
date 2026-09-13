// Artefato derivado de UMA fonte. Não editar vendor no Radar: rode esta exportação.
import {readFileSync,writeFileSync,mkdirSync,cpSync,readdirSync,existsSync,rmSync} from 'node:fs'
import {resolve,join} from 'node:path'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'
const radar=process.argv[2]
if(!radar)throw Error('Uso: npm run exportar:radar -- /caminho/creatingmk1')
rmSync('dist',{recursive:true,force:true})
execFileSync(process.execPath,['node_modules/tsup/dist/cli-default.js'],{stdio:'inherit'})
const css=postcss.parse(readFileSync('app/globals.css','utf8')+'\n'+readFileSync('app/temas.css','utf8'))
css.walkRules(rule=>{
  if(rule.parent.type==='atrule' && /keyframes$/.test(rule.parent.name))return
  rule.selector=selectorParser(root=>root.each(sel=>{
    const texto=sel.toString().trim()
    if(/^(html|:root)(?=[\s[.:#]|$)/.test(texto)) {
      const primeiro=sel.nodes[0]
      primeiro.parent.insertAfter(primeiro,selectorParser.pseudo({value:':where(:has([data-lancheria-app]))'}))
    } else if(texto.startsWith('[data-layout]') || texto.startsWith("[data-layout=")) {
      sel.walkAttributes(a=>{if(a.attribute==='data-layout')a.replaceWith(selectorParser.pseudo({value:`:is(html:has([data-lancheria-app]${a.toString()}))`}))})
    } else if(texto.startsWith('::view-transition')) {
      sel.prepend(selectorParser.pseudo({value:':where(html:has([data-lancheria-app]))'}))
    } else sel.prepend(selectorParser.combinator({value:' '})),sel.prepend(selectorParser.pseudo({value:':where(html:has([data-lancheria-app]))'}))
  })).processSync(rule.selector)
})
const vendor=resolve(radar,'vendor/lancheria-rx')
mkdirSync(vendor,{recursive:true});cpSync('dist',join(vendor,'dist'),{recursive:true})
writeFileSync(join(vendor,'package.json'),JSON.stringify({name:'@radar/lancheria-rx',version:JSON.parse(readFileSync('package.json','utf8')).version,private:true,type:'module',sideEffects:false,
  exports:{'./client':{types:'./dist/client.d.mts',import:'./dist/client.js'},'./contrato':{types:'./dist/contrato.d.mts',import:'./dist/contrato.js'}},peerDependencies:{react:'^19.0.0','react-dom':'^19.0.0'}},null,2)+'\n')
const publico=resolve(radar,'public');mkdirSync(join(publico,'lancheria-rx'),{recursive:true})
writeFileSync(join(publico,'lancheria-rx/estrutura.css'),css.toString())
const hashes={}
const guardar=(origem,destino)=>{
 const bytes=readFileSync(origem);mkdirSync(resolve(destino,'..'),{recursive:true});writeFileSync(destino,bytes)
 hashes[origem]=createHash('sha256').update(bytes).digest('hex')
}
for(const pasta of ['camadas','fixos','chapa','macro','fichas','fontes'])for(const file of readdirSync('public/'+pasta)) {
 const origem='public/'+pasta+'/'+file,destino=join(publico,pasta,file)
 if(existsSync(destino)&&!readFileSync(destino).equals(readFileSync(origem)))throw Error(`Colisão de asset: ${destino}`)
 guardar(origem,destino)
}
const motor=['components/raio-x/prensa.ts','components/raio-x/sombra.ts','components/raio-x/salto.ts','components/raio-x/rotulos.ts','data/baselines.json','data/camadas.ts']
for(const file of motor)guardar(file,join(vendor,'fonte-calibrada',file))
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()
writeFileSync(join(vendor,'origem.json'),JSON.stringify({repositorio:'dididiwdmayla/lancheriademodois',base:commit,motor,sha256:hashes},null,2)+'\n')
console.log(`Exportado para ${vendor}; ${Object.keys(hashes).length} hashes verificáveis.`)
