import type { Tema } from './index'

export default {
  slug: 'cantina', nome: 'Cantina', fundo: 'claro',
  cores: { base: '#F2EDE3', superficie: '#E8E0D2', traco: '#C4B79E', texto: '#26211C', quente: '#B6553B', frio: '#3E5240' },
  fontes: { display: 'Playfair Display', corpo: 'Lora', medida: 'Lora' },
  raio: 2, densidade: 'solta', assinatura: 'toldo', mascote: false,
} satisfies Tema
