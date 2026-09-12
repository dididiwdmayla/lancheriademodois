import type { Tema } from './index'

export default {
  slug: 'meia-noite', nome: 'Meia-Noite', fundo: 'escuro',
  cores: { base: '#120D0B', superficie: '#1C1512', traco: '#33251E', texto: '#E9E0D3', quente: '#A9762F', frio: '#A8C6D4' },
  fontes: { display: 'Fraunces', corpo: 'Archivo', medida: 'IBM Plex Mono' },
  raio: 2, densidade: 'media', assinatura: 'letreiro', mascote: true,
} satisfies Tema
