# RELATÓRIO — Prompt 18

## Feito

- Página completa em torno do raio-x: intro do letreiro com saída automática e botão de entrada; faixa com `chapa-selagem.webp`; grade; filtros separados; trilho de prensados; bebidas; acompanhamentos; história da chapa; horário; rodapé e pedido.
- O raio-x nasce fechado. Abre pelo pedido já adicionado ou pelo Monte o seu, fecha sem confirmar uma edição e devolve o foco. Removida a leitura de `?lanche=montar` e das demais portas provisórias por query.
- Grade com os ícones existentes, ingredientes em uma linha, preço derivado da composição e Adicionar como ação principal. Modificar permanece disponível depois da adição na grade, na barra e no carrinho.
- Trilho Na prensa: geometria dirigida pelo deslocamento, usando `espalhaXDe` de `prensa.ts`; apenas centro e dois vizinhos montados por camada. O restante usa ícone. Botões anterior/próximo e teclado complementam o deslize. Movimento reduzido troca o estado sem interpolação contínua.
- Extras de `EXTRAS` em peças tipográficas, com macro existente a 10%; nenhuma imagem de bebida ou acompanhamento criada ou referenciada.
- Carrinho com folha limitada a 85% da viewport, resumo de composição, quantidade, edição, remoção, total e formas aceitas. Edição substitui a linha e conserva a quantidade. Quantidade não dispara salto. Adições rápidas não cancelam pedidos anteriores.
- Ganchos um por vez e no máximo dois por sessão. Dispensados ficam em `sessionStorage`. A regra da batata conta unidades, inclusive duas unidades do mesmo lanche. Bacon entra na composição respeitando a ordem existente e o molho adjacente ao pão; nada é cobrado antes de salvar.
- Resumo para WhatsApp contém quantidades, composição de cada lanche, valores e pagamento. Há cópia do resumo e link de WhatsApp condicionado ao cadastro de um telefone real.
- Horário em `America/Sao_Paulo`, atualizado a cada 60 segundos e ao voltar à aba, inclusive 03h30, 04h00, 04h01 e 18h00.
- Comparação de piso com epsilon `1e-3` em `prensa.ts`, mantendo a escala limitada ao piso. O QA usa a mesma tolerância para os atributos arredondados. Constantes calibradas preservadas.
- Lista da composição ganhou Subir/Descer por toque: reordenar não depende de arrastar nem de teclado.
- Todos os assets existentes preservados sem renomear, redimensionar ou reprocessar. Nenhum asset necessário estava ausente.
- Adaptador mínimo do comando de desenvolvimento para o preview supervisionado aceitar as opções de host/porta sem substituir Next.js ou sua arquitetura.

### Verificação executada

- `npm test`: **36 testes aprovados** de horário, filtros de ganchos, teto de ofertas, quantidades, composição, preço, resumo, geometria pura, tokens e existência de assets.
- `npx tsc --noEmit`: passou.
- Build de produção: passou, com `/` prerenderizada estaticamente. Saída real: **28,1 kB da rota; 131 kB First Load JS**. Estes são números do build, não de desempenho medido no navegador.
- Sintaxe dos scripts de QA e `git diff --check`: passaram.
- Asserções anteriores do QA visual mantidas e adaptadas para entrar pelo cardápio real. Acrescentadas asserções de primeira dobra, hero, filtros em AND, independência dos eixos, toques rápidos, edição, quantidade sem salto, carrinho, ganchos, barra, estados intermediários do trilho, imagens de extras e desktop em 1280px.
- O script está preparado para gerar `cardapio-390.jpg`, `trilho-390.jpg`, `carrinho-390.jpg`, `a-chapa-390.jpg`, `rodape-390.jpg`, `desktop-1280.jpg` e a folha de contato.

## Não feito

- **QA visual e seis capturas não executados.** O preview iniciou, mas a política de segurança do navegador bloqueou o acesso ao endereço interno. A rejeição proíbe contornar por outro navegador ou acesso indireto. Portanto não executei o QA em uma superfície alternativa. Não há capturas nesta entrega e não afirmo ter medido primeira dobra, alvos, overflow ou aparência do trilho.
- **Envio efetivo por WhatsApp indisponível com os dados atuais.** `data/casa.ts` contém Rua Exemplo, 000, telefone `(44) 0000-0000` e WhatsApp `5544000000000`. Preservei a fonte canônica em vez de copiar o endereço diferente do protótipo. O resumo funciona; o botão de envio aparece quando o número real for cadastrado. Nenhuma mensagem foi enviada.

## Adiado

- Na próxima rodada de lapidação: executar `npm run qa` em ambiente com navegador autorizado e inspecionar os seis recortes antes de aprovar visualmente a rodada. A implementação das seções não foi adiada.
- Substituir endereço/telefone demonstrativos quando os dados da casa forem fornecidos.
- Permanecem os dois itens aceitos no `PLAN.md`: primeiro quadro estreito no desktop e fresta tolerada em composições estreitas no teto de espalhamento.

## Risco

- O site passou na compilação e nos testes de regras; os fluxos de interface e o enquadramento **ainda precisam de execução no navegador**. Os novos testes visuais também não foram executados neste ambiente.
- O ponto que considero mais fraco é a repetição dos cartões de bebidas e acompanhamentos. A tipografia separa esses produtos dos lanches, mas as duas sequências repetem a mesma estrutura; podem ficar monótonas. O desktop usa uma grade de quatro colunas bastante direta e pode parecer mais convencional do que o raio-x. Isto é uma avaliação da composição implementada, **não uma observação de capturas que eu não consegui obter**.
- O painel de camadas do trilho reserva altura para a pilha aberta. Com o item central prensado, pode sobrar ar vertical demais. Confirmar no recorte, sem mexer nos números calibrados para preencher espaço.
- O pedido existe enquanto a página fica aberta; recarregar esvazia os itens. As dispensas dos ganchos sobrevivem à recarga na mesma sessão.
- Fotografias de camadas são pré-carregadas para o salto. Não houve medição de consumo de rede, FPS ou CLS nesta rodada.

## Decisões

1. **Grade primeiro, trilho depois.** O acesso à comida acontece antes da demonstração das camadas. Não inseri Destaques antes do cardápio.
2. **Um trilho de lanche, chamado Na prensa.** Reuni a função de destaque/sugestão nos quatro prensados. Evita repetir duas vezes o mesmo catálogo e concentra o gesto. Os redondos permanecem na grade e mantêm sua gravidade própria no raio-x.
3. **Modificar sem contagem regressiva.** A ação fica na grade enquanto aquela composição estiver no pedido, na barra para o último lanche e em toda linha de lanche do carrinho. Um prazo de poucos segundos seria fácil de perder.
4. **Ingredientes recolhidos, forma sempre visível.** Há contagem de ingredientes ativos e de resultados. A expansão mostra as fichas e seus nomes. As escolhas são combinadas em AND e persistem ao trocar a forma.
5. **Extras como fichas de geladeira/fritadeira.** Fraunces grande, preço em Plex Mono, número carimbado e macro existente discreta. Mantive todos os oito produtos dos dados, sem inventar tamanhos ou fotografias.
6. **Desktop em quatro colunas.** A largura adicional serve à comparação de lanches, ao trilho com vizinhos visíveis e ao carrinho alinhado à direita. O corte do raio-x em 900px permanece.
7. **Horário perto do pedido e no fim.** Uma linha compacta abaixo da faixa responde imediatamente se a casa está aberta; a seção completa junto ao rodapé serve a quem chegou procurando informações da casa.
8. **História depois dos itens compráveis.** Usei somente o relato pedido sobre Maringá e a prensa. Não portei espessura de chapa, temperaturas e tempos específicos que apareciam no protótipo como se fossem dados confirmados desta casa.
9. **Batata por quantidade, não por número de linhas.** Dois lanches idênticos também são dois lanches. Corrigi esse detalhe do comportamento de referência.
10. **Edição conserva a linha e o número de unidades.** O carrinho explicita `Modificar (N)` quando há mais de uma. Cancelar o raio-x não modifica o pedido.
11. **Contato demonstrativo não vira envio falso.** Copiar o resumo funciona agora; enviar usa exclusivamente o WhatsApp de `CASA` quando configurado.
