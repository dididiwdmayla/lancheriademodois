// Parte do QA de navegador. Não envia mensagens: window.open é interceptado antes da página.
export async function verificarPrompt19(navegador, url, diz, recorte) {
  const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  await contexto.addInitScript(() => {
    window.__whatsappQA = []
    window.open = (url) => { window.__whatsappQA.push(String(url)); return null }
    // Medir a resposta de um controle React, e não apenas o desaparecimento da cortina.
    const observar = () => {
      const inicio = document.documentElement.getAttribute('data-lt-inicio')
      const main = document.querySelector('#conteudo')
      const filtro = document.querySelector('[data-filtro-forma="redondo"]')
      if (inicio && main && !main.inert && filtro) {
        if (filtro.getAttribute('aria-pressed') === 'true') {
          window.__entradaUtilQA = performance.now() - Number(inicio)
          return
        }
        filtro.click()
      }
      requestAnimationFrame(observar)
    }
    requestAnimationFrame(observar)
  })
  const pg = await contexto.newPage()
  const conferirAlvos = async (estado) => {
    const medidas = await pg.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      pequenos: [...document.querySelectorAll('button, a[href], input, select, textarea, summary')].filter(e => {
        if (e.closest('[inert]') || !e.getClientRects().length) return false
        const r = e.getBoundingClientRect()
        return r.width < 44 - .5 || r.height < 44 - .5
      }).map(e => e.id || e.textContent?.trim().slice(0, 40)),
    }))
    diz(!medidas.overflow, `P19: ${estado} sem rolagem horizontal acidental`)
    diz(medidas.pequenos.length === 0, `P19: ${estado} com alvos de 44px: ${medidas.pequenos.join(', ') || 'todos'}`)
  }
  try {
    await pg.goto(url, { waitUntil: 'domcontentloaded' })
    await pg.waitForFunction(() => window.__entradaUtilQA !== undefined)
    const tempo = await pg.evaluate(() => window.__entradaUtilQA)
    diz(tempo <= 1400, `P19: cardápio respondeu em ${tempo.toFixed(0)}ms desde o início da entrada (máximo 1400ms)`)
    await pg.reload({ waitUntil: 'domcontentloaded' })
    const segunda = await pg.evaluate(() => ({
      pronto: document.documentElement.dataset.ltAceso === '1',
      animacoes: document.querySelector('#intro').getAnimations().length,
    }))
    diz(segunda.pronto && segunda.animacoes === 0, 'P19: segunda visita já nasce sem sequência nem travessia')
    await pg.waitForFunction(() => window.__entradaUtilQA !== undefined)
    await pg.click('[data-filtro-forma="prensado"]')
    await pg.click('[data-item-cardapio="prensado-frango"] [data-add]')
    await pg.click('[data-item-cardapio="prensado-frango"] [data-modificar]')
    await pg.waitForSelector('#rx-pilha [id^="rx-camada-"]')
    const preco = () => pg.locator('#rx-medidor [data-preco]').innerText()
    const antes = await preco()
    await pg.click('#rx-ver-composicao')
    const essenciais = await pg.locator('#rx-composicao [data-fixa]').evaluateAll(els => els.map(e => ({ slug: e.dataset.slug, remover: !!e.querySelector('[data-tirar]'), marca: e.textContent.includes('fixa') })))
    diz(essenciais.length === 3 && essenciais.every(e => !e.remover && e.marca), 'P19: pães e frango marcados como fixa, sem remover')
    await pg.locator('#rx-composicao [data-slug="tomate"] [data-tirar]').click()
    diz(await preco() === antes, 'P19: remover tomate no editor conserva o preço')
    await pg.click('#rx-fechar-composicao')
    await pg.locator('#rx-toques [data-toque="2"]').click() // após remover tomate, frango fica no índice 2
    await conferirAlvos('raio-x com observação')
    const nEssencial = await pg.locator('#rx-pilha [id^="rx-camada-"]').count()
    await pg.focus('#rx-chamada-frango-desfiado-1')
    await pg.keyboard.press('Delete')
    diz(await pg.locator('#rx-pilha [id^="rx-camada-"]').count() === nEssencial, 'P19: Delete também preserva a camada essencial')
    await recorte('essencial marcada · 390px', '#rx-takeover', pg)
    await pg.locator('#rx-takeover').screenshot({ path: 'qa/essencial-390.jpg', type: 'jpeg', quality: 55 })
    await pg.click('#rx-abrir-trilho')
    const folha = await pg.locator('#rx-trilho-folha').evaluate(el => {
      const grade = el.querySelector('#rx-trilho')
      const r = el.getBoundingClientRect(), g = grade.getBoundingClientRect()
      return { largura: r.width, x: r.left, grade: g.width,
        colunas: getComputedStyle(grade).gridTemplateColumns.split(' ').length,
        cortes: [...grade.querySelectorAll(':scope > button')].filter(c => c.scrollHeight > c.clientHeight + 1 || c.scrollWidth > c.clientWidth + 1).map(c => c.dataset.slug),
        rolavel: grade.scrollHeight > grade.clientHeight && getComputedStyle(grade).overflowY === 'auto',
      }
    })
    diz(Math.abs(folha.largura - 390) <= 1 && Math.abs(folha.x) <= 1 && Math.abs(folha.grade - folha.largura) <= 2 && folha.colunas === 2, `P19: folha inteira em duas colunas (${folha.largura}px; grade ${folha.grade}px)`)
    diz(folha.cortes.length === 0, `P19: nenhum cartão corta conteúdo: ${folha.cortes.join(', ') || 'scrollHeight <= clientHeight em todos'}`)
    diz(folha.rolavel, 'P19: rolagem vertical pertence à grade dentro da folha')
    await conferirAlvos('folha de ingredientes')
    await recorte('ingredientes · 390px', '#rx-trilho-folha', pg)
    await pg.locator('#rx-trilho-folha').screenshot({ path: 'qa/ingredientes-390.jpg', type: 'jpeg', quality: 55 })
    await pg.click('#rx-trilho [data-slug="bacon"]')
    const reais = texto => Math.round(Number(texto.replace(/[^\d,]/g, '').replace(',', '.')) * 100)
    diz(reais(await preco()) - reais(antes) === 700, 'P19: bacon acrescentado cobra R$ 7,00 no editor')
    await pg.fill('#observacao-item', 'bem passado')
    diz(await pg.locator('#observacao-item').getAttribute('maxlength') === '120', 'P19: observação do item limitada a 120 caracteres')
    await pg.click('#rx-selar')
    await pg.waitForSelector('[data-barra-pedido]')
    await pg.waitForFunction(() => document.querySelector('[data-barra-pedido]')?.textContent.includes('1 item'))
    await pg.click('[data-abrir-carrinho]')
    diz((await pg.locator('.item-observacao').innerText()).includes('bem passado'), 'P19: observação acompanha o item no carrinho')
    await pg.click('#carrinho-resumo')
    await pg.click('#carrinho-enviar')
    diz(await pg.locator('#erro-nome').innerText() === 'Falta o nome' && await pg.locator('#erro-pagamento').innerText() === 'Falta a forma de pagamento', 'P19: faltas específicas em nome e pagamento')
    diz(await pg.evaluate(() => window.__whatsappQA.length) === 0, 'P19: confirmação inválida não abre WhatsApp')
    await pg.fill('#pedido-nome', 'Ana & João')
    await pg.check('input[value="entrega"]')
    await pg.selectOption('#pedido-pagamento', 'Dinheiro')
    await pg.click('#carrinho-enviar')
    diz(await pg.locator('#erro-endereco').innerText() === 'Falta o endereço', 'P19: entrega exige endereço')
    await pg.fill('#pedido-endereco', 'Rua das Palmeiras, 123 — Centro')
    await pg.fill('#pedido-complemento', 'Casa 2')
    await pg.fill('#pedido-troco', '100')
    await pg.fill('#pedido-observacao', 'Chamar no portão #2')
    await pg.locator('.carrinho-miolo').evaluate(el => { el.scrollTop = 0 })
    await conferirAlvos('confirmação preenchida')
    await recorte('confirmação preenchida · 390px', '[data-carrinho]', pg)
    await pg.locator('[data-carrinho]').screenshot({ path: 'qa/confirmacao-390.jpg', type: 'jpeg', quality: 55 })
    // Um segundo recorte documenta os campos que ficam abaixo da dobra da folha.
    await pg.locator('#pedido-observacao').scrollIntoViewIfNeeded()
    await recorte('confirmação · pagamento e observação', '[data-carrinho]', pg)
    await pg.click('#carrinho-enviar')
    const destino = await pg.evaluate(() => window.__whatsappQA.at(-1))
    const lida = new URL(destino), mensagem = lida.searchParams.get('text')
    diz(lida.origin === 'https://wa.me' && lida.pathname === '/5544984570105' && destino.includes('%0A') && destino.includes('%26'), 'P19: URL codificada e número correto na ação real de confirmar')
    diz(mensagem.includes('   + bacon') && mensagem.includes('   − tomate') && mensagem.includes('   obs: bem passado') && mensagem.includes('Pagamento: Dinheiro (troco para R$ 100,00)') && mensagem.includes('Obs: Chamar no portão #2'), 'P19: mensagem inclui mudanças, observações e troco')
    await pg.click('button:has-text("Voltar aos itens")')
    await pg.click('[data-carrinho] [data-modificar]')
    diz(await pg.locator('#observacao-item').inputValue() === 'bem passado', 'P19: observação persiste ao reabrir o item')
    await pg.click('#rx-fechar')
    await pg.click('#carrinho-resumo')
    diz(await pg.locator('#pedido-nome').inputValue() === 'Ana & João', 'P19: dados da confirmação persistem durante edição do item')
    await pg.check('input[value="retirada"]')
    await pg.selectOption('#pedido-pagamento', 'Pix')
    diz(await pg.locator('#pedido-endereco').count() === 0 && await pg.locator('#pedido-troco').count() === 0, 'P19: retirada e Pix recolhem endereço e troco')
    await pg.click('#carrinho-fechar')
    await pg.click('[data-filtro-forma="monte"]')
    await pg.click('#abrir-livre-prensado')
    await pg.click('#rx-trilho [data-slug="carne"]')
    await pg.click('#rx-trilho [data-slug="tomate"]')
    const antesMontar = await preco()
    await pg.click('#rx-ver-composicao')
    diz(await pg.locator('#rx-composicao [data-slug="carne"] [data-tirar]').count() === 1, 'P19: carne não é essencial no montador')
    await pg.locator('#rx-composicao [data-slug="tomate"] [data-tirar]').click()
    diz(reais(antesMontar) - reais(await preco()) === 200, 'P19: remover tomate no montador desconta R$ 2,00')
  } finally { await contexto.close() }
}
