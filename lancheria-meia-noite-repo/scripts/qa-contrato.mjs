// Contratos do Prompt 26: compara com os bytes da base APROVADA do Prompt 25.
import {execFileSync} from 'node:child_process'
import {readFileSync,readdirSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
const base='8510f857b0f1ed0bb773445cda54f2f764e6b9e7'
const prefixo=execFileSync('git',['rev-parse','--show-prefix'],{encoding:'utf8'}).trim()
const motor=['components/raio-x/prensa.ts','components/raio-x/sombra.ts','components/raio-x/salto.ts','components/raio-x/rotulos.ts','components/raio-x/Camada.tsx','components/raio-x/Medidor.tsx','data/baselines.json','data/camadas.ts','data/casa.ts','lib/motion.ts','lib/avisoOrdem.ts']
const assets=['camadas','fixos','chapa','macro','fichas'].flatMap(p=>readdirSync(`public/${p}`).map(f=>`public/${p}/${f}`))
const arquivos={}
for(const path of [...motor,...assets]) {
 const atual=readFileSync(path),antes=execFileSync('git',['show',`${base}:${prefixo}${path}`])
 if(!atual.equals(antes))throw Error(`Bytes alterados: ${path}`)
 arquivos[path]={bytes:atual.length,sha256:createHash('sha256').update(atual).digest('hex')}
}
const todos=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?todos(`${dir}/${e.name}`):[`${dir}/${e.name}`])
for(const path of [...todos('components'),...todos('lib')].filter(p=>/\.tsx?$/.test(p))) {
 const texto=readFileSync(path,'utf8')
 if(/tema\.slug|useTema\(\)\.slug|dataset\.tema|\{\s*slug\s*\}\s*=\s*useTema/.test(texto))throw Error(`Comportamento consulta identidade: ${path}`)
 if(path.startsWith('components/')&&/Maringá|Meia-Noite|98457-0105|5544984570105|DAS 18H|ÀS 4H/.test(texto))throw Error(`Dado da casa dentro de componente: ${path}`)
}
mkdirSync('qa/prompt-26',{recursive:true})
writeFileSync('qa/prompt-26/contrato.json',JSON.stringify({base,motor: motor.length,assets:assets.length,arquivos,slugEmComponente:false,dadosDaCasaEmComponente:false},null,2)+'\n')
console.log(`OK: ${motor.length} arquivos fixos e ${assets.length} fotos idênticos à base; zero consultas de slug ou dados da casa dentro de componente.`)
