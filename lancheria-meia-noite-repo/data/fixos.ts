// Preço do fixo é CALCULADO da composição: PRECO_BASE_CENT + soma dos precoCent.
// Nunca fixado à mão — senão editar o lanche não move o valor.

export type Fixo = {
  slug: string
  nome: string
  forma: 'prensado' | 'redondo'
  camadas: string[]
}

export const FIXOS: Fixo[] = [
    { slug: 'prensado-completo', nome: 'Prensado Completo', forma: 'prensado', camadas: ['pao-prensado-base', 'alface', 'tomate', 'carne', 'bacon', 'calabresa', 'milho', 'queijo-ralado', 'batata-palha', 'pao-prensado-topo'] },
    { slug: 'prensado-frango', nome: 'Prensado de Frango', forma: 'prensado', camadas: ['pao-prensado-base', 'alface', 'tomate', 'frango-desfiado', 'milho', 'queijo-ralado', 'pao-prensado-topo'] },
    { slug: 'prensado-calabresa', nome: 'Prensado de Calabresa', forma: 'prensado', camadas: ['pao-prensado-base', 'alface', 'calabresa', 'cebola', 'queijo-ralado', 'pao-prensado-topo'] },
    { slug: 'prensado-meia-noite', nome: 'Prensado Meia-Noite', forma: 'prensado', camadas: ['pao-prensado-base', 'tomate', 'carne', 'bacon', 'ovo', 'queijo-ralado', 'batata-palha', 'pao-prensado-topo'] },
    { slug: 'x-salada', nome: 'X-Salada', forma: 'redondo', camadas: ['pao-base', 'alface', 'tomate', 'carne', 'queijo', 'pao-topo'] },
    { slug: 'x-tudo', nome: 'X-Tudo', forma: 'redondo', camadas: ['pao-base', 'molho', 'alface', 'tomate', 'carne', 'presunto', 'queijo', 'bacon', 'ovo', 'batata-palha', 'pao-topo'] }
]

export type Extra = {
  slug: string
  nome: string
  grupo: 'bebida' | 'acompanhamento'
  precoCent: number
  icone: string
}

// icone vazio de propósito: não há foto de bebida nem acompanhamento.
// Renderizar como peça tipográfica. NUNCA gerar placeholder de imagem.
export const EXTRAS: Extra[] = [
    { slug: 'refri', nome: 'Refrigerante lata', grupo: 'bebida', precoCent: 700, icone: '' },
    { slug: 'guarana', nome: 'Guaraná', grupo: 'bebida', precoCent: 1200, icone: '' },
    { slug: 'suco-laranja', nome: 'Suco de laranja', grupo: 'bebida', precoCent: 1000, icone: '' },
    { slug: 'agua', nome: 'Água', grupo: 'bebida', precoCent: 400, icone: '' },
    { slug: 'milkshake', nome: 'Milkshake', grupo: 'bebida', precoCent: 1600, icone: '' },
    { slug: 'batata-frita', nome: 'Batata frita', grupo: 'acompanhamento', precoCent: 1800, icone: '' },
    { slug: 'batata-cheddar', nome: 'Batata com cheddar e bacon', grupo: 'acompanhamento', precoCent: 2600, icone: '' },
    { slug: 'aneis-cebola', nome: 'Anéis de cebola', grupo: 'acompanhamento', precoCent: 2000, icone: '' }
]
