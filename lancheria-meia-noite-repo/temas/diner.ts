import type { Tema } from './index'

export default {
  slug: 'diner', nome: 'Diner', fundo: 'claro',
  cores: { base: '#EAF4F8', superficie: '#FFFBF2', traco: '#9AA7AE', texto: '#1E2A30', quente: '#D2312B', frio: '#5B7C8D' },
  fontes: { display: 'Alfa Slab One', corpo: 'Work Sans', medida: 'Space Mono' },
  raio: 4, densidade: 'media', assinatura: 'placa-de-porta', mascote: true,
} satisfies Tema
