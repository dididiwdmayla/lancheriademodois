// Dados da casa. Único arquivo que muda quando isto virar template de outro cliente.

export const CASA = {
  nome: 'Lancheria Meia-Noite',
  cidade: 'Maringá, PR',
  endereco: 'Rua Exemplo, 000 — Zona 7',
  telefone: '(44) 98457-0105',
  whatsapp: '5544984570105',
  fuso: 'America/Sao_Paulo',
  abre: 18,   // hora local da casa
  fecha: 4,   // hora local da casa, no dia seguinte
  pagamento: ['Dinheiro', 'Pix', 'Débito', 'Crédito'],
} as const

export const PRECO_BASE_CENT = 1200
export const LIMIAR_AVISO_CAMADAS = 10
export const MAX_REPETICOES = 3
export const MAX_CAMADAS = 16
