import type { Tema } from './index'

export default {
  slug: 'pratico', nome: 'Prático', fundo: 'claro',
  cores: { base: '#FFFFFF', superficie: '#F4F4F5', traco: '#E0E0E2', texto: '#18181B', quente: '#E23744', frio: '#6B7280' },
  fontes: { display: 'Inter', corpo: 'Inter', medida: 'Inter' },
  raio: 12, densidade: 'apertada', assinatura: 'nenhuma', mascote: false,
  filtroInicial: 'primeira-forma', abrirComposicao: 'nenhuma',
  cardapio: 'lista', intro: false, hero: 'nenhum', adicionarIcone: true,
  rotulos: { modificar: 'Personalizar', modificarCurto: 'Personalizar' },
  movimento: { grade: false, transicaoMs: 120, captura: false },
  medida: { fallback: 'sans-serif', numerais: 'tabular-nums' },
  folhaFontes: '/fontes/pratico.css',
} satisfies Tema
