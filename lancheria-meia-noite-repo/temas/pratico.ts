import type { Tema } from './index'

export default {
  slug: 'pratico', nome: 'Prático', fundo: 'claro',
  cores: { base: '#FFFFFF', superficie: '#F4F4F5', traco: '#E0E0E2', texto: '#18181B', quente: '#E23744', frio: '#6B7280' },
  fontes: { display: 'Inter', corpo: 'Inter', medida: 'Inter' },
  raio: 12, densidade: 'apertada', assinatura: 'nenhuma', mascote: false,
} satisfies Tema
