import type { Tema } from './index'

export default {
  slug: 'cantina', nome: 'Cantina', fundo: 'claro',
  cores: { base: '#F2EDE3', superficie: '#E8E0D2', traco: '#C4B79E', texto: '#26211C', quente: '#B6553B', frio: '#3E5240' },
  fontes: { display: 'Playfair Display', corpo: 'Lora', medida: 'Lora' },
  raio: 2, densidade: 'solta', assinatura: 'toldo', mascote: false,
  filtroInicial: 'primeira-forma', abrirComposicao: 'nenhuma',
  cardapio: 'folha', intro: false, hero: 'menu', adicionarIcone: true,
  rotulos: { modificar: 'Modificar lanche', modificarCurto: 'Modificar' },
  movimento: { grade: true, transicaoMs: null, captura: true },
  medida: { fallback: 'serif', numerais: 'oldstyle-nums proportional-nums' },
  folhaFontes: '/fontes/cantina.css',
} satisfies Tema
