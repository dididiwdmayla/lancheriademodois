import { CAMADAS, MAPA_CAMADAS } from './camadas'
import { CASA, PRECO_BASE_CENT, MAX_CAMADAS, MAX_REPETICOES } from './casa'
import { FIXOS, EXTRAS, type Fixo, type Extra } from './fixos'

export type Casa = { nome: string; marca: string; cidade: string; endereco: string; telefone: string; whatsapp: string;
  fuso: string; abre: string; fecha: string; pagamento: string[]; horarioConfirmado?: boolean; horarioTexto?: string; instagram?: string }
export type IngredienteComercial = { slug: string; nome: string; precoCent: number }
export type LancheComercial = Fixo & { precoCent: number; foto: string }
export type TextosCasa = { registro: string; categoria: string; heroTitulo: string; heroDescricao: string;
  heroFoto: string; heroAlt: string; historiaTitulo: string; historia: string[]; carimbo: string; rodape: string }
export type DadosLancheria = { casa: Casa; precoBaseCent: number; ingredientes: IngredienteComercial[];
  lanches: LancheComercial[]; extras: Extra[]; textos: TextosCasa }

export const TEXTOS_CASA: Record<'chapa' | 'balcao' | 'menu' | 'nenhum', TextosCasa> = {
  chapa: { registro: '', categoria: 'Lancheria', heroTitulo: 'A noite pede\num prensado.', heroDescricao: 'Pão na chapa. Recheio no lugar.',
    heroFoto: '/chapa/chapa-selagem.webp', heroAlt: 'Prensado fechando na chapa', historiaTitulo: 'Antes do prato,\num carrinho.',
    historia: ['O prensado nasceu em Maringá, dentro de um carrinho de lanches. Alguém instalou uma prensa na chapa e passou a fechar o pão sobre o recheio.', 'Os concorrentes copiaram. Virou prato típico da cidade e saiu do estado.'],
    carimbo: 'MARINGÁ / PÃO / CHAPA / PRENSA', rodape: '' },
  balcao: { registro: 'Lancheria de esquina', categoria: 'Lancheria', heroTitulo: 'Da esquina. Da chapa.', heroDescricao: '',
    heroFoto: '/fixos/prensado-meia-noite.webp', heroAlt: 'Prensado Meia-Noite', historiaTitulo: 'Antes do prato,\num carrinho.',
    historia: ['O prensado nasceu em Maringá, dentro de um carrinho de lanches. Alguém instalou uma prensa na chapa e passou a fechar o pão sobre o recheio.', 'Os concorrentes copiaram. Virou prato típico da cidade e saiu do estado.'],
    carimbo: 'MARINGÁ / PÃO / CHAPA / PRENSA', rodape: '' },
  menu: { registro: '', categoria: 'Sanduicheria', heroTitulo: 'Pão, recheio e boa mesa.', heroDescricao: 'O prensado da casa. Desde o primeiro pão.',
    heroFoto: '', heroAlt: '', historiaTitulo: 'Antes do prato,\num carrinho.',
    historia: ['O prensado nasceu em Maringá, dentro de um carrinho de lanches. Alguém instalou uma prensa na chapa e passou a fechar o pão sobre o recheio.', 'Os concorrentes copiaram. Virou prato típico da cidade e saiu do estado.'],
    carimbo: 'MARINGÁ / PÃO / CHAPA / PRENSA', rodape: 'Da chapa para a mesa.' },
  nenhum: { registro: '', categoria: 'Lancheria', heroTitulo: '', heroDescricao: '', heroFoto: '', heroAlt: '', historiaTitulo: 'Antes do prato,\num carrinho.',
    historia: ['O prensado nasceu em Maringá, dentro de um carrinho de lanches. Alguém instalou uma prensa na chapa e passou a fechar o pão sobre o recheio.', 'Os concorrentes copiaram. Virou prato típico da cidade e saiu do estado.'],
    carimbo: 'MARINGÁ / PÃO / CHAPA / PRENSA', rodape: '' },
}

export const DADOS_EXEMPLO: DadosLancheria = {
  casa: { ...CASA, marca: 'Meia-Noite', abre: `${String(CASA.abre).padStart(2,'0')}:00`, fecha: `${String(CASA.fecha).padStart(2,'0')}:00`, pagamento: [...CASA.pagamento] },
  precoBaseCent: PRECO_BASE_CENT,
  ingredientes: CAMADAS.map(({slug,nome,precoCent})=>({slug,nome,precoCent})),
  lanches: FIXOS.map(f=>({...f,precoCent:PRECO_BASE_CENT+f.camadas.reduce((s,c)=>s+MAPA_CAMADAS[c].precoCent,0),foto:`/fixos/${f.slug}.webp`})),
  extras: EXTRAS,
  textos: TEXTOS_CASA.chapa,
}
export function exemploLancheria(hero: keyof typeof TEXTOS_CASA): DadosLancheria {
  return structuredClone({...DADOS_EXEMPLO,textos:TEXTOS_CASA[hero]})
}

/** Só conteúdo comercial atravessa a fronteira. Geometria e calibração não são slots. */
export function validarDadosLancheria(valor: unknown): string[] {
  const erros: string[] = []
  const objeto=(v:unknown):v is Record<string,unknown>=>!!v && typeof v==='object' && !Array.isArray(v)
  const chaves=(v:Record<string,unknown>,permitidas:string[],path:string)=>Object.keys(v).forEach(k=>{if(!permitidas.includes(k))erros.push(`${path}.${k}: campo não permitido`)})
  const texto=(v:unknown,path:string,vazio=false)=>{if(typeof v!=='string' || v.length>5000 || (!vazio && !v.trim()))erros.push(`${path}: texto inválido`)}
  const cent=(v:unknown,path:string)=>{if(!Number.isSafeInteger(v) || Number(v)<0 || Number(v)>10000000)erros.push(`${path}: centavos inválidos`)}
  if(!objeto(valor))return ['lancheria: objeto obrigatório']
  chaves(valor,['casa','precoBaseCent','ingredientes','lanches','extras','textos'],'lancheria')
  if(!objeto(valor.casa))erros.push('casa: objeto obrigatório')
  else {
    const c=valor.casa;chaves(c,['nome','marca','cidade','endereco','telefone','whatsapp','fuso','abre','fecha','pagamento','horarioConfirmado','horarioTexto','instagram'],'casa')
    for(const k of ['nome','marca','cidade','endereco','telefone','whatsapp','fuso','abre','fecha'])texto(c[k],`casa.${k}`,!['nome','marca','fuso','abre','fecha'].includes(k))
    if(c.horarioConfirmado!==undefined&&typeof c.horarioConfirmado!=='boolean')erros.push('casa.horarioConfirmado: booleano obrigatório')
    for(const k of ['horarioTexto','instagram'])if(c[k]!==undefined)texto(c[k],`casa.${k}`,true)
    for(const k of ['abre','fecha'])if(typeof c[k]!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(c[k] as string))erros.push(`casa.${k}: use HH:mm`)
    try{new Intl.DateTimeFormat('pt-BR',{timeZone:String(c.fuso)})}catch{erros.push('casa.fuso: inválido')}
    if(c.whatsapp && !/^\d{8,15}$/.test(String(c.whatsapp)))erros.push('casa.whatsapp: use apenas dígitos com código do país')
    if(!Array.isArray(c.pagamento)||!c.pagamento.length||c.pagamento.length>12)erros.push('casa.pagamento: lista inválida')
    else c.pagamento.forEach((p,i)=>texto(p,`casa.pagamento[${i}]`))
  }
  cent(valor.precoBaseCent,'precoBaseCent')
  const ids=new Set<string>()
  if(!Array.isArray(valor.ingredientes)||valor.ingredientes.length>CAMADAS.length)erros.push('ingredientes: lista do acervo calibrado obrigatória')
  else for(const [i,v] of valor.ingredientes.entries()) {
    if(!objeto(v)){erros.push(`ingredientes[${i}]: objeto inválido`);continue}
    chaves(v,['slug','nome','precoCent'],`ingredientes[${i}]`)
    if(typeof v.slug!=='string'||!Object.hasOwn(MAPA_CAMADAS,v.slug))erros.push(`ingredientes[${i}]: camada sem asset calibrado`)
    else {if(ids.has(v.slug))erros.push(`ingredientes[${i}]: slug repetido`);ids.add(v.slug)}
    texto(v.nome,`ingredientes[${i}].nome`);cent(v.precoCent,`ingredientes[${i}].precoCent`)
  }
  for(const c of CAMADAS.filter(c=>c.pao))if(!ids.has(c.slug))erros.push(`ingredientes: falta o pão ${c.slug}`)
  const slugs=new Set<string>()
  if(!Array.isArray(valor.lanches)||!valor.lanches.length||valor.lanches.length>60)erros.push('lanches: informe de 1 a 60 receitas')
  else for(const [i,v] of valor.lanches.entries()) {
    if(!objeto(v)){erros.push(`lanches[${i}]: objeto inválido`);continue}
    chaves(v,['slug','nome','forma','camadas','essenciais','precoCent','foto'],`lanches[${i}]`)
    if(typeof v.slug!=='string'||! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.slug)||slugs.has(v.slug))erros.push(`lanches[${i}].slug: inválido ou repetido`)
    slugs.add(String(v.slug));texto(v.nome,`lanches[${i}].nome`);cent(v.precoCent,`lanches[${i}].precoCent`)
    if(!['prensado','redondo'].includes(String(v.forma)))erros.push(`lanches[${i}].forma: inválida`)
    if(typeof v.foto!=='string'||!/^\/fixos\/[a-z0-9-]+\.webp$/.test(v.foto)||!FIXOS.some(f=>`/fixos/${f.slug}.webp`===v.foto))erros.push(`lanches[${i}].foto: escolha uma fotografia do acervo`)
    const cam=v.camadas
    if(!Array.isArray(cam)||cam.length<2||cam.length>MAX_CAMADAS||cam.some(s=>typeof s!=='string'||!ids.has(s))) {erros.push(`lanches[${i}].camadas: composição inválida`);continue}
    const paes=CAMADAS.filter(c=>c.pao===v.forma).sort((a,b)=>a.ordem-b.ordem)
    if(cam[0]!==paes[0]?.slug||cam.at(-1)!==paes.at(-1)?.slug||cam.filter(s=>MAPA_CAMADAS[s]?.pao).length!==2)erros.push(`lanches[${i}]: pães devem estar nas extremidades`)
    if(cam.some(s=>cam.filter(c=>c===s).length>MAX_REPETICOES))erros.push(`lanches[${i}]: ingrediente acima do limite de repetições`)
    if(cam.some((s,n)=>s==='molho' && n!==1 && n!==cam.length-2))erros.push(`lanches[${i}]: molho deve ficar junto ao pão`)
    if(!Array.isArray(v.essenciais)||v.essenciais.some(s=>!cam.includes(s)))erros.push(`lanches[${i}].essenciais: ingrediente fora da receita`)
  }
  const extrasSlugs=new Set<string>()
  if(!Array.isArray(valor.extras)||valor.extras.length>60)erros.push('extras: lista inválida')
  else for(const [i,v] of valor.extras.entries()) {
    if(!objeto(v)){erros.push(`extras[${i}]: objeto inválido`);continue}
    chaves(v,['slug','nome','grupo','precoCent','icone'],`extras[${i}]`)
    if(typeof v.slug!=='string'||! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.slug)||extrasSlugs.has(v.slug))erros.push(`extras[${i}].slug: inválido ou repetido`)
    extrasSlugs.add(String(v.slug))
    texto(v.slug,`extras[${i}].slug`);texto(v.nome,`extras[${i}].nome`);cent(v.precoCent,`extras[${i}].precoCent`)
    if(!['bebida','acompanhamento'].includes(String(v.grupo))||v.icone!=='')erros.push(`extras[${i}]: grupo ou ícone inválido`)
  }
  if(!objeto(valor.textos))erros.push('textos: objeto obrigatório')
  else {chaves(valor.textos,Object.keys(TEXTOS_CASA.chapa),'textos');for(const k of Object.keys(TEXTOS_CASA.chapa)) {
    const v=valor.textos[k];if(k==='historia'){if(!Array.isArray(v)||v.some(t=>typeof t!=='string'))erros.push('textos.historia: lista inválida')}else texto(v,`textos.${k}`,true)
  }}
  return erros
}
