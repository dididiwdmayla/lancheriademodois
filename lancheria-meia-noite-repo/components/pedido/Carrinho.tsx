'use client'

import { useState } from 'react'
import { CASA } from '@/data/casa'
import { brl } from '@/lib/precos'
import { resumoPedido, totalPedido, type Gancho, type ItemPedido } from '@/lib/pedido'
import Modal from './Modal'

type Props = { pedido: ItemPedido[]; gancho: Gancho | null; onSair: () => void; onQuantidade: (id: string, d: number) => void; onRemover: (id: string) => void; onModificar: (id: string, bacon?: boolean) => void; onGancho: () => void; onDispensar: () => void }
export default function Carrinho({ pedido, gancho, onSair, onQuantidade, onRemover, onModificar, onGancho, onDispensar }: Props) {
  const [resumo, setResumo] = useState(false)
  const [recado, setRecado] = useState('')
  const texto = resumoPedido(pedido)
  const telefonePronto = !/0{6,}/.test(CASA.whatsapp)
  const copiar = async () => {
    try { await navigator.clipboard.writeText(texto); setRecado('Resumo copiado.') }
    catch { setRecado('Selecione o resumo acima para copiar.'); document.querySelector<HTMLTextAreaElement>('#resumo-pedido')?.select() }
  }
  return <Modal className="carrinho-modal" titulo={resumo ? 'Resumo do pedido' : 'Seu pedido'} onSair={onSair}>
    <div data-carrinho className="carrinho-folha">
      <header className="carrinho-cabeca"><h2>{resumo ? 'Resumo do pedido' : 'Seu pedido'}</h2><button id="carrinho-fechar" className="botao-texto" onClick={onSair} aria-label="Fechar pedido e voltar ao cardápio">Fechar</button></header>
      <div className="carrinho-miolo">
        {resumo ? <>
          <p>Confira a composição. A casa confirma o pedido pelo WhatsApp.</p>
          <textarea id="resumo-pedido" aria-label="Resumo para WhatsApp" readOnly value={texto} rows={10} />
          {!telefonePronto && <p className="aviso-contato">Telefone da casa ainda não cadastrado. Por enquanto, copie o resumo.</p>}
          <p role="status">{recado}</p>
        </> : <>
          {!pedido.length && <div className="vazio"><p>Seu pedido está vazio.</p><button className="botao-quente" onClick={onSair}>Escolher um lanche</button></div>}
          <ul className="pedido-linhas">{pedido.map(p => <li key={p.id} data-linha-pedido={p.id} className="pedido-linha">
            {p.foto ? <img src={p.foto} alt="" width={64} height={64} /> : <span className="extra-inicial" aria-hidden="true">{p.nome[0]}</span>}
            <div className="pedido-descricao"><h3>{p.nome}</h3><p>{p.resumo}</p></div>
            <div className="quantidade"><button data-qtd-menos={p.id} aria-label={`Menos um ${p.nome}`} onClick={() => onQuantidade(p.id, -1)}>−</button><span aria-label={`Quantidade: ${p.qtd}`}>{p.qtd}</span><button data-qtd-mais={p.id} aria-label={`Mais um ${p.nome}`} onClick={() => onQuantidade(p.id, 1)}>+</button></div>
            <span className="linha-preco" data-preco>{brl(p.cent * p.qtd)}</span>
            <div className="linha-acoes">{p.grupo === 'lanche' && <button className="botao-texto" data-modificar={p.id} onClick={() => onModificar(p.id)}>Modificar{p.qtd > 1 ? ` (${p.qtd})` : ''}</button>}<button className="botao-texto" data-remover={p.id} aria-label={`Remover ${p.nome}`} onClick={() => onRemover(p.id)}>Remover</button></div>
          </li>)}</ul>
          {gancho && <aside data-gancho={gancho.id} className="gancho"><h3>{gancho.texto}</h3>
            {gancho.extra && <p>{gancho.extra.nome} <span data-preco>{brl(gancho.extra.precoCent)}</span></p>}
            <div><button className="botao-quente" data-gancho-agir onClick={onGancho}>{gancho.extra ? 'Adicionar' : 'Pôr bacon nesse'}</button><button className="botao-texto" data-gancho-dispensar onClick={onDispensar}>Dispensar</button></div>
          </aside>}
        </>}
      </div>
      {!!pedido.length && <div className="carrinho-base">
        <div className="carrinho-total"><span>Total</span><span data-preco>{brl(totalPedido(pedido))}</span></div>
        <p className="pagamentos">{CASA.pagamento.join(' / ')}</p>
        {resumo ? <div className="resumo-acoes">
          {telefonePronto && <a id="carrinho-enviar" className="botao-quente" href={`https://wa.me/${CASA.whatsapp}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener noreferrer">Enviar no WhatsApp</a>}
          <button id="carrinho-copiar" className={telefonePronto ? 'botao-texto' : 'botao-quente'} onClick={copiar}>Copiar o resumo</button><button className="botao-texto" onClick={() => setResumo(false)}>Voltar à lista</button>
        </div> : <button id="carrinho-resumo" className="botao-quente" onClick={() => setResumo(true)}>Fechar pedido</button>}
      </div>}
    </div>
  </Modal>
}
