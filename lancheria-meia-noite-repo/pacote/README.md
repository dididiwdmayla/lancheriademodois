# Lancheria para o Radar

Uma fonte de componentes, quatro identidades por dados. O pacote deriva deste repositório;
`creatingmk1/vendor/lancheria-rx` é uma entrega compilada, não outra implementação editável.

```sh
npm ci
npm test
npm run qa:contrato
npm run exportar:radar -- /caminho/creatingmk1
```

A exportação usa o commit atual como origem. Execute de um checkout commitado. Atualize a
versão no package.json a cada nova entrega. No Radar, `npm ci` instala a dependência local
`file:vendor/lancheria-rx`, sem registry privado, credencial de build ou fetch entre repos.

Entradas:

- `@radar/lancheria-rx/contrato`: tipos, quatro temas, exemplo, validação comercial,
  cálculo de preços/pedido e horário; importável pelo servidor.
- `@radar/lancheria-rx/client`: componente `Lancheria({tema,dados})`, sem dependência de Next,
  sem seletor por URL e sem singleton contendo dados de cliente.

O servidor entrega o objeto Tema escolhido pela SkinDefinition. As fontes são locais e só a
folha ativa é carregada. O CSS derivado fica sob `html:has([data-lancheria-app])`, inclusive
portais e View Transitions. A exportação leva os 54 WebP existentes e as nove fontes, com
licenças e hashes. Não muda pixels nem produz fotografias.

Dados comerciais: casa, intervalo diário, pagamento, preço-base do montador, ingredientes,
composições, essenciais, preço explícito dos fixos, extras e textos. Campos desconhecidos
são recusados. A associação ingrediente→camada calibrada é fechada nesta versão. A receita
pode ter outro slug sem mudar o caminho de sua foto. Dados físicos nunca são campos da skin.

As funções de preço e pedido são instanciadas por estabelecimento. O preço explícito do
fixo continua sendo seu piso ao personalizar; ocorrências adicionais usam os preços dos
ingredientes do mesmo estabelecimento. Reordenação, limites e montagem física não mudam.

Na integração, a identidade ausente permanece ausente. O Radar não herda o telefone/cidade
Meia-Noite para um lead vazio. Horário importado é texto até o operador configurar o intervalo
diário; a placa mostra CONSULTE enquanto não houver intervalo confirmado. A microcópia e os
preços desta entrega são pt-BR/BRL. Localização e fotografia por cliente são próximas etapas.

Os scripts de QA dos Prompts 24/25 são evidência histórica do seletor provisório. A validação
atual de quatro skins roda no Radar em `node scripts/qa-lancheria.mjs`, com Chromium indicado
por `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`; o script sobe a produção e usa sessão local
assinada efêmera. Rotas de cliente, proxy e permissões permanecem os reais.
