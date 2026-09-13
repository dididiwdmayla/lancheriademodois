'use client'

import { useNegocio } from '@/components/NegocioAtivo'

import { useTema } from '@/components/TemaAtivo'

import { useEffect, useRef, useState } from 'react'
import { Mascote } from '@/components/letreiro/Mascote'

import { brl } from '@/lib/precos'
import { totalPedido, type Confirmacao, type Gancho, type ItemPedido } from '@/lib/pedido'
import { transicionar } from '@/lib/transicoes'
import Modal from './Modal'
import ConfirmacaoPedido from './ConfirmacaoPedido'

type Props = { dados: Confirmacao; onDados: (dados: Confirmacao) => void; pedido: ItemPedido[]; gancho: Gancho | null; onSair: () => void; onQuantidade: (id: string, d: number) => void; onRemover: (id: string) => void; onModificar: (id: string, origem?: Element | null) => void; onGancho: (origem: Element | null) => void; onDispensar: () => void }
export default function Carrinho({ dados, onDados, pedido, gancho, onSair, onQuantidade, onRemover, onModificar, onGancho, onDispensar }: Props) {
  const { CASA } = useNegocio()
  const tema = useTema()
  const [resumo, setResumo] = useState(false)
  const titulo = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (resumo) titulo.current?.focus({ preventScroll: true }) }, [resumo])
  return <Modal className="carrinho-modal" titulo={resumo ? 'Confirmar pedido' : 'Seu pedido'} onSair={onSair}>
    <div data-carrinho className="carrinho-folha">
      <header className="carrinho-cabeca"><h2 ref={titulo} tabIndex={-1}>{resumo ? 'Confirmar pedido' : 'Seu pedido'}</h2><button id="carrinho-fechar" className="botao-texto" onClick={onSair} aria-label="Fechar pedido e voltar ao cardápio">Fechar</button></header>
      {/* Os dois passos dividem um lugar só, e é esse lugar que desliza: a confirmação
          entra pela direita, como passo seguinte, e volta por onde entrou. */}
      <div className="carrinho-miolo"><div data-passo-pedido={resumo ? 'confirmacao' : 'itens'}>
        {resumo ? <ConfirmacaoPedido pedido={pedido} dados={dados} onDados={onDados} /> : <>
          {!pedido.length && <div className="vazio carrinho-vazio">
            <Mascote largura={150} />
            <p>Seu pedido está vazio.</p>
            <button className="botao-quente" onClick={onSair}>Escolher um lanche</button>
          </div>}
          <ul className="pedido-linhas">{pedido.map(p => <li key={p.id} data-linha-pedido={p.id} className="pedido-linha">
            {p.foto ? <img src={p.foto} alt="" width={64} height={64} /> : <span className="extra-inicial" aria-hidden="true">{p.nome[0]}</span>}
            <div className="pedido-descricao"><h3>{p.nome}</h3><p>{p.resumo}</p>{p.observacao && <p className="item-observacao">obs: {p.observacao}</p>}</div>
            <div className="quantidade"><button data-qtd-menos={p.id} aria-label={`Menos um ${p.nome}`} onClick={() => onQuantidade(p.id, -1)}>−</button><span aria-label={`Quantidade: ${p.qtd}`}>{p.qtd}</span><button data-qtd-mais={p.id} aria-label={`Mais um ${p.nome}`} onClick={() => onQuantidade(p.id, 1)}>+</button></div>
            <span className="linha-preco" data-preco>{brl(p.cent * p.qtd)}</span>
            <div className="linha-acoes">{p.grupo === 'lanche' && <button className="botao-texto" data-modificar={p.id} onClick={e => onModificar(p.id, e.currentTarget.closest('[data-linha-pedido]'))}>{tema.rotulos.modificarCurto}{p.qtd > 1 ? ` (${p.qtd})` : ''}</button>}<button className="botao-texto" data-remover={p.id} aria-label={`Remover ${p.nome}`} onClick={() => onRemover(p.id)}>Remover</button></div>
          </li>)}</ul>
          {gancho && <aside data-gancho={gancho.id} className="gancho"><h3>{gancho.texto}</h3>
            {gancho.extra && <p>{gancho.extra.nome} <span data-preco>{brl(gancho.extra.precoCent)}</span></p>}
            <div><button className="botao-quente" data-gancho-agir onClick={e => onGancho(e.currentTarget.closest('[data-gancho]'))}>{gancho.extra ? 'Adicionar' : 'Pôr bacon nesse'}</button><button className="botao-texto" data-gancho-dispensar onClick={onDispensar}>Dispensar</button></div>
          </aside>}
        </>}
      </div></div>
      {!!pedido.length && <div className="carrinho-base">
        <div className="carrinho-total"><span>Total</span><span data-preco>{brl(totalPedido(pedido))}</span></div>
        <p className="pagamentos">{CASA.pagamento.join(' / ')}</p>
        {resumo ? <div className="resumo-acoes">
          <button id="carrinho-enviar" form="confirmacao-pedido" type="submit" className="botao-quente">Confirmar e abrir WhatsApp</button>
          <button className="botao-texto" onClick={() => transicionar('confirma-sai', () => setResumo(false))}>Voltar aos itens</button>
        </div> : <button id="carrinho-resumo" className="botao-quente" onClick={() => transicionar('confirma-entra', () => setResumo(true))}>Fechar pedido</button>}
      </div>}
    </div>
  </Modal>
}
