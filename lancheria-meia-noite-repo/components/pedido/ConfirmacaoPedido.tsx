'use client'

import { useRef, useState, type FormEvent } from 'react'
import { CASA } from '@/data/casa'
import { resumoPedido, urlWhatsApp, validarConfirmacao, type Confirmacao, type ItemPedido } from '@/lib/pedido'

type Props = { pedido: ItemPedido[]; dados: Confirmacao; onDados: (dados: Confirmacao) => void }
export default function ConfirmacaoPedido({ pedido, dados, onDados }: Props) {
  const [erros, setErros] = useState<Partial<Record<keyof Confirmacao, string>>>({})
  const [enviado, setEnviado] = useState(false)
  const form = useRef<HTMLFormElement>(null)
  const mudar = (campo: keyof Confirmacao, valor: string) => {
    onDados({ ...dados, [campo]: valor })
    setErros(antes => ({ ...antes, [campo]: undefined }))
    setEnviado(false)
  }
  const atributos = (campo: keyof Confirmacao) => ({
    id: `pedido-${campo}`,
    'aria-invalid': !!erros[campo],
    'aria-describedby': erros[campo] ? `erro-${campo}` : undefined,
  })
  const erro = (campo: keyof Confirmacao) => erros[campo] && <span className="campo-erro" id={`erro-${campo}`}>{erros[campo]}</span>
  const confirmar = (e: FormEvent) => {
    e.preventDefault()
    const falhas = validarConfirmacao(dados)
    setErros(falhas)
    const primeiro = Object.keys(falhas)[0]
    if (primeiro) { form.current?.querySelector<HTMLElement>(`#pedido-${primeiro}`)?.focus(); return }
    if (!pedido.length) return
    window.open(urlWhatsApp(pedido, dados), '_blank', 'noopener,noreferrer')
    setEnviado(true)
  }
  return <form ref={form} id="confirmacao-pedido" className="confirmacao" onSubmit={confirmar} noValidate>
    <details className="conferir-itens"><summary>Conferir itens e alterações</summary><pre>{resumoPedido(pedido)}</pre></details>
    <label className="campo"><span>Nome</span><input {...atributos('nome')} autoComplete="name" required value={dados.nome} onChange={e => mudar('nome', e.target.value)} />{erro('nome')}</label>
    <fieldset className="recebimento"><legend>Como vai receber?</legend><div>
      {(['retirada', 'entrega'] as const).map(valor => <label key={valor} data-escolhido={dados.recebimento === valor ? '' : undefined}>
        <input type="radio" name="recebimento" value={valor} checked={dados.recebimento === valor} onChange={() => mudar('recebimento', valor)} />
        {valor === 'retirada' ? 'Retirada' : 'Entrega'}
      </label>)}
    </div></fieldset>
    {dados.recebimento === 'entrega' && <>
      <label className="campo"><span>Endereço</span><input {...atributos('endereco')} autoComplete="street-address" placeholder="Rua, número e bairro" required value={dados.endereco} onChange={e => mudar('endereco', e.target.value)} />{erro('endereco')}</label>
      <label className="campo"><span>Complemento <small>se tiver</small></span><input {...atributos('complemento')} autoComplete="address-line2" value={dados.complemento} onChange={e => mudar('complemento', e.target.value)} /></label>
    </>}
    <label className="campo"><span>Pagamento</span><select {...atributos('pagamento')} required value={dados.pagamento} onChange={e => mudar('pagamento', e.target.value)}>
      <option value="">Escolha a forma</option>{CASA.pagamento.map(p => <option key={p} value={p}>{p}</option>)}
    </select>{erro('pagamento')}</label>
    {dados.pagamento === 'Dinheiro' && <label className="campo"><span>Troco para quanto? <small>se precisar</small></span>
      <input {...atributos('troco')} inputMode="decimal" placeholder="R$" value={dados.troco} onChange={e => mudar('troco', e.target.value)} />{erro('troco')}
    </label>}
    <label className="campo"><span>Observação do pedido <small>se tiver</small></span><textarea {...atributos('observacao')} rows={3} value={dados.observacao} onChange={e => mudar('observacao', e.target.value)} /></label>
    <p className="confirmacao-recado" role="status">{enviado ? 'Pedido pronto no WhatsApp. Envie a mensagem para a casa.' : 'A casa confirma o pedido pelo WhatsApp.'}</p>
  </form>
}
