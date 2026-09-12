# Prompt 23 — transições e mascote do hero

## Bloqueio anterior, sem ambiguidade

- Skill: `control-browser`. Não houve mensagem de erro de execução nem rejeição automática de permissão.
- Instrução literal: “Only the Node REPL `js` tool (`mcp__node_repl__js`) can be used to control the browser.”
- A execução pretendida era Playwright local com `Emulation.setCPUThrottlingRate`, taxa 4, e coleta rAF. Ela não foi iniciada.
- Não havia uma permissão com nome na interface para liberar. A pausa anterior foi uma interpretação dessa instrução, não uma recusa da ferramenta. Este prompt autorizou seguir sem a medição.

## Feito

- Raio-x entra e sai com `translate` e escala leve de 0,96 a 1. O deslocamento deriva do centro do cartão tocado; a volta consulta novamente sua posição. Sem `clip-path` animado nem contra-escala dos filhos.
- View Transitions apenas na entrada/saída do takeover em desktop a partir de 900px com ponteiro fino. Um único nome, `tr-raiox`, no contêiner; nenhuma captura nomeada em filho, barra ou folha. Captura da raiz e animação geométrica automática dos grupos desativadas.
- No celular todas as oito trocas usam elementos reais. Carrinho, ingredientes e confirmação usam esse caminho também no desktop. Durações mantidas: 240/200, 220/180, 200/180 e 220/180ms.
- Pausa compartilhada cancela o relógio dos olhos e dos braços; o tremor CSS fica pausado. Cobre trocas de tela, intro, escalonamento desktop e salto. Retomada e limpeza têm caminhos de fim, cancelamento/desmontagem e movimento reduzido. Fora da tela e em aba oculta os mascotes não mantêm seu relógio rodando.
- Grade móvel troca inteira, sem animação por item. Desktop conserva o escalonamento. `will-change: transform` das telas depende do estado transitório, removido ao finalizar; nos clones do salto é removido quando a animação termina ou o clone sai.
- Hero reutiliza `DesenhoMascote`, invertido e recortado pela borda superior do SVG: corpo e boca ficam acima da faixa. Braços são duas linhas curvas de ponta arredondada. Nada gerado ou redesenhado para substituir o personagem.
- A caixa do mascote é absoluta; a largura é calculada pelo espaço livre ao lado ou acima dos glifos do título, recalculada no resize/carregamento de fontes. O alcance dos braços é recortado pela mesma caixa. Abaixo do espaço mínimo ele fica oculto; não empurra conteúdo.
- Braços: 300ms para tentar, 160ms de hesitação, 440ms para relaxar. Repouso de 5,5–9,5s; novos movimentos do ponteiro respeitam intervalo de 2,6–4,2s. O alcance desejado cobre no máximo 55% da distância ao alvo. Em movimento reduzido: olhos centrais, braços relaxados. No raio-x, inclusive o SVG do hero sai do DOM.

### Inventário da varredura

| Local | Encontrado antes | Tratamento |
|---|---|---|
| Entrada/saída do raio-x | `clip-path` em keyframes | `transform` |
| Ignição do letreiro | `--lt-acende`, `--lt-letras` animadas | `opacity` diretamente nos dois grupos, conservando os pontos da sequência |
| Camadas do raio-x | `top` na prensa, assentamento e explosão | `translateY`; escala/respiração em embrulho interno |
| Linhas, pontos e rótulos | `top`, `left`, `width` em transições | `translate`, `rotate`, `scaleX` |
| Medidor | `width`, `background-color` | barra por `scaleX`; troca de cor direta |
| Ghost de arrasto | escritas de `left`/`top` a cada pointermove | `translate` |
| SVG do letreiro e `.sr-only` | recortes estáticos | conservados; não são animados |
| Texturas, máscaras e dimensões | propriedades estáticas | conservadas; não entram em keyframes/transition |

### Verificação realmente executada

- `tsc --noEmit`: aprovado.
- `npm run build`: aprovado, incluindo verificação de tipos e geração das páginas.
- `npm test`: 56 regras aprovadas, incluindo dados, preços e geometria calculada.
- `node scripts/qa-movimento-estatico.mjs`: 31 arquivos; 17 keyframes; 12 declarações de transição; apenas `opacity` e `transform`. PostCSS examina CSS e TypeScript examina declarações inline e interpolações conhecidas; expressões novas desconhecidas falham.
- Controle da própria varredura contra `f5e4bba`: detectou as propriedades proibidas listadas acima. Isso valida a detecção estática, não mede desempenho.
- `git diff --check`: aprovado.
- QA antigo de movimento atualizado para não exigir clip-path, captura móvel ou escalonamento móvel. Sua sintaxe foi verificada; ele não foi executado no navegador.

## Não feito

Não executados: navegador, capturas 390/1280, CPU 4×, intervalos rAF, asserções visuais de sobreposição e prova em execução da pausa dos mascotes. A instrumentação `qa-quadros.mjs` permanece disponível, sem resultados inventados. Nenhuma afirmação de máximo de 32ms ou de zero quadros perdidos.

## Adiado

Validação de fluidez e aparência nesta rodada fica para o aparelho do usuário; uma próxima correção deve partir das trocas que ele apontar. As pendências anteriores de geometria de tela registradas no Prompt 21 não foram declaradas resolvidas pelos testes de regras.

## Risco

O crescimento do raio-x ficou mais discreto: deslocamento curto e escala leve substituem a revelação retangular exata. A grade móvel perdeu a cascata de entrada; as oito trocas continuam animadas. A intenção direcional permanece no código, mas melhora de fluidez e qualidade visual ainda precisam do teste real. O mascote é literalmente o mesmo componente da tabuleta, porém a pose invertida, o tamanho e o ritmo ainda não foram julgados em capturas. Em janelas muito estreitas ou com texto ampliado, ele pode encolher ou desaparecer para proteger o título.

## Toques para testar no celular

1. No cardápio, toque **Adicionar** em um prensado; após ele entrar no pedido, toque **Modificar lanche** — o raio-x deve entrar com deslocamento e leve crescimento, sem travada inicial.
2. No raio-x, toque **Acrescentar ingrediente** — a folha deve subir da base sem fazer a pilha piscar.
3. Toque **× / Fechar ingredientes** — a folha deve descer antes de desaparecer.
4. Toque **Voltar** no raio-x — a tela deve recuar levemente na direção do cartão e devolver o cardápio sem tremor.
5. Toque **Abrir pedido** na barra inferior — o carrinho deve subir de uma vez, sem pausa no começo.
6. No carrinho, toque **Fechar pedido** — a confirmação deve entrar pela direita sem puxar o conteúdo de trás.
7. Toque **Voltar aos itens** — a confirmação deve sair pela direita e revelar os itens.
8. Toque **Fechar** no carrinho — a folha deve descer e devolver o cardápio.

Extra: alterne **Prensados/Redondos**; a grade deve trocar inteira. No hero, toque/deslize, aguarde e role para fora: observe tentativas espaçadas dos braços e o título sempre livre. Não é necessário confirmar nem enviar um pedido no WhatsApp.
