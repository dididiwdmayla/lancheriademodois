// O tremor conserva os tempos do protótipo. A ignição foi encurtada no Prompt 19.

export const CHAVE_SESSAO = 'lm:letreiro-aceso'

/** Cada grupo do tremor roda fora de fase dos outros — é o que dá o "reator velho". */
export const TREMOR_GRUPOS = [
  { id: 'lt-tremor', duracaoS: 4, atrasoS: -1.2 },
  { id: 'lt-tubo-a', duracaoS: 4.3, atrasoS: -2.6 },
  { id: 'lt-tubo-b', duracaoS: 3.7, atrasoS: -0.4 },
  { id: 'lt-texto', duracaoS: 4.6, atrasoS: -3.1 },
] as const

/** Prompt 19: ignição compacta e travessia, sem espera por fontes ou pausa extra. */
export const DURACAO_IGNICAO_MS = 800
export const DURACAO_ENTRADA_MS = 420
export const DURACAO_TOTAL_MS = DURACAO_IGNICAO_MS + DURACAO_ENTRADA_MS

/** Executa antes do primeiro paint. O prazo não recomeça quando o React hidrata. */
export const SCRIPT_ENTRADA = `(function(){
  var raiz=document.documentElement, inicio=performance.now(), pronta=false;
  raiz.setAttribute('data-lt-inicio',String(inicio));
  try{pronta=sessionStorage.getItem('${CHAVE_SESSAO}')==='1'}catch(e){}
  pronta=pronta||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function concluir(){
    raiz.setAttribute('data-lt-aceso','1');
    try{sessionStorage.setItem('${CHAVE_SESSAO}','1')}catch(e){}
  }
  if(pronta) concluir();
  else window.setTimeout(concluir,${DURACAO_TOTAL_MS});
})();`
