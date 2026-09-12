# RELATÓRIO — Prompt 19

## Feito

- Entrada com ignição em **800ms** e travessia em **420ms**, total programado de **1.220ms**. Os sete tempos conservam as alternâncias de luz e a hesitação do reator; o intervalo escuro longo ocupa 200ms. Sem espera por fontes nem pausa depois de estabilizar. A segunda visita da sessão e movimento reduzido entram diretamente. O prazo é registrado antes da hidratação e não recomeça quando o React carrega.
- O letreiro sobe com sua cortina até sair pelo topo. Hero e cardápio sobem 80px ao mesmo tempo, usando transformação, sem fade. O texto do SVG passou a usar a família Fraunces carregada pelo projeto.
- Corrigida a causa da folha de ingredientes: `#rx-trilho` herdava `grid-area: trilho` dentro de uma grade sem essa área nomeada. Isso criava trilhas implícitas. Na folha, a área é reiniciada e a grade ocupa explicitamente a única coluna do pai. São duas colunas de fichas, com linhas dimensionadas pelo conteúdo, altura mínima, imagem, nome e preço contidos. A grade rola verticalmente dentro da folha; o toque não inicia arrasto enquanto a pessoa rola.
- Preço do editor calculado pelo fixo original mais as ocorrências acrescentadas além da composição original. Remoções não diminuem esse piso. Reordenar, remover e recolocar uma camada original não cobra novamente. No montador, cada camada continua entrando e saindo do preço.
- `fixoSlug` acompanha o item durante salvamento, reabertura e gancho de bacon. A chave do carrinho distingue composição, origem fixa/montador e observação. O caminho Modificar da grade permanece disponível depois de mudar a composição do fixo.
- Acrescentadas as listas `essenciais` dos seis fixos exatamente como pedidas. As camadas desses slugs são marcadas como **fixa**, sem controle de remoção na composição e na chamada da pilha. Delete e arrasto também respeitam a trava. No montador, somente os pães são obrigatórios.
- Observação por item no raio-x, limitada a 120 caracteres, preservada ao salvar/reabrir e exibida no carrinho e no texto do WhatsApp.
- Confirmação dentro da folha do pedido, com nome, entrega/retirada, endereço e complemento condicionados à entrega, pagamento, troco condicionado a dinheiro e observação geral. Erros específicos em `--latao`. Os dados sobrevivem a voltar aos itens, fechar/reabrir o carrinho e modificar um lanche enquanto a página permanece aberta.
- A ação Confirmar valida e abre `https://wa.me/5544984570105?text=...`. A mensagem contém quantidades, valores, diferenças `+` e `−`, observação por item, total, identificação, recebimento, pagamento/troco e observação geral. Montagens livres incluem a composição completa. A mensagem é preparada; o cliente ainda envia pelo WhatsApp.
- Telefone e WhatsApp da casa atualizados em `casa.ts`. Formulário mantém o foco dentro da folha, incluindo inputs e selects; erros levam ao primeiro campo faltante. Alvos e campos têm piso de 44px. Nenhum asset ou número calibrado de `prensa.ts` foi alterado.

### Verificação executada

- `npm test`: **56 testes aprovados**. Incluem os testes anteriores e regras de preço dos seis fixos, reedição, duplicatas, observações, validação, número/URL codificada e orçamento temporal da entrada.
- A ausência de controles nas camadas essenciais também foi conferida renderizando o componente real da composição para HTML, nos seis fixos.
- Build de produção aprovado, incluindo TypeScript. Rota `/` estática, **29,6 kB**; First Load JS **132 kB**. Não são medidas de carregamento em um celular.
- Sintaxe dos scripts de QA e `git diff --check` aprovados.
- QA visual anterior mantido. O cenário sintético de pão/molho/tomate agora usa Monte o seu, pois os fixos têm essenciais. A asserção do resumo foi adaptada ao formato de alterações.
- `scripts/qa-prompt19.mjs`, chamado por `npm run qa`, acrescenta asserções de interatividade real até 1,4s, segunda visita, essenciais também por Delete, preço nos dois modos, largura/duas colunas e `scrollHeight <= clientHeight` de cada ficha, rolagem interna, alvos, overflow, notas, validação e abertura da URL correta. Intercepta `window.open` para não abrir uma conversa durante o teste.
- Recortes preparados: `qa/ingredientes-390.jpg`, `qa/essencial-390.jpg`, `qa/confirmacao-390.jpg`, mais o trecho inferior da confirmação na folha de contato.

## Não feito

- **Não executei o QA de navegador nem produzi os recortes.** A política de segurança do navegador bloqueou o endereço interno na rodada anterior e explicitamente proibiu contornar o bloqueio por outro navegador ou acesso indireto. Não tentei esse contorno nesta rodada. As asserções estão implementadas, mas largura, ausência de cortes, alvos, tempo de interação e aparência ainda não têm aprovação visual medida.
- Nenhuma mensagem foi enviada à casa. O número, a codificação e o texto foram testados como dados; abrir e enviar no aplicativo depende da execução do fluxo no navegador autorizado.

## Adiado

- Executar `npm run qa` e inspecionar os três recortes na validação visual desta rodada, em ambiente com acesso autorizado ao site. A implementação funcional dos seis itens está entregue.
- Cadastrar o endereço real da casa quando fornecido: `Rua Exemplo, 000 — Zona 7` continua nos dados existentes. O telefone já foi substituído pelo número informado.

## Risco

- **A travessia tem uma função clara na composição:** conectar a placa à entrada no salão. A duração curta, sem pulso adicional e sem pausa, deve impedir que vire uma vinheta gratuita. Porém, não posso afirmar que ficou boa em movimento sem ter visto a execução. O risco visual específico é a cortina parecer uma página deslizando, em vez de uma porta sendo atravessada; é o primeiro ponto a julgar no navegador.
- **O site continua mais fraco nas bebidas e acompanhamentos.** A repetição da mesma peça tipográfica ainda pode parecer monótona perto do raio-x. O desktop segue mais convencional que o centro do projeto. Esta avaliação vem da composição implementada, não de capturas obtidas nesta rodada.
- A confirmação é a parte mais utilitária desta alteração. Na entrega com dinheiro, os campos exigidos formam uma folha longa; o miolo rola e o total/CTA ficam na base. Pode ficar pesado com o teclado aberto, apesar dos campos condicionais. Esse estado precisa de inspeção em celular.
- O campo de observação usa uma faixa adicional no raio-x. A geometria continua derivada da área disponível e os pisos calibrados foram preservados; verificar as seis pilhas reais no recorte estreito.
- O orçamento de animação é 1.220ms desde o script de entrada. Rede e hidratação podem atrasar a primeira interação: o teste preparado mede a resposta efetiva de um filtro React, não apenas o sumiço da cortina. Esse teste ainda não foi executado.
- Pedido, observações e confirmação ficam na memória da página; recarregar continua esvaziando o pedido. Não foi acrescentada persistência de endereço ou outros dados pessoais.

## Decisões

1. **800ms + 420ms, sem intervalo.** Deixa 180ms de margem dentro de 1,4s para a conclusão da entrada, sem gastar tempo olhando o letreiro já estável. A pausa escura de 200ms mantém a hesitação; os outros trechos foram comprimidos preservando as sete mudanças.
2. **Letreiro e conteúdo começam juntos.** A cortina percorre sua altura inteira; o conteúdo sobe só 80px. Essa diferença cria profundidade e permite reconhecer o cardápio enquanto a entrada se abre, sem um segundo escalonamento que prolongue a espera.
3. **Sem último pulso.** O reator já hesita durante a ignição. Outra piscada acrescentaria uma ênfase que o gesto de entrada não precisa.
4. **Segunda visita e movimento reduzido diretos.** A marca da sessão é lida antes do primeiro paint. Não há espera por fontes, animação adicional ou pausa de acessibilidade. O botão de pular também libera a entrada imediatamente.
