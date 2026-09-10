# Prompt de abertura — Claude Design

Cole o conteúdo de `BRIEFING.md` primeiro, e logo abaixo, na **mesma mensagem**, o texto
que está entre as linhas.

---

Esse é o briefing completo do projeto Lancheria Meia-Noite. Leia inteiro antes de responder.

**Não construa nada ainda. Não escreva código nesta resposta.**

Devolva quatro coisas, nesta ordem:

**1. O sistema de tokens que você vai escrever.** Os seis tokens de cor exatamente como
estão na tabela, mais a escala tipográfica que você propõe para Fraunces, Archivo e IBM
Plex Mono — tamanhos, pesos e os eixos variáveis que vai usar em cada um.

**2. A árvore de arquivos que vai criar na Fase 1.** Só a Fase 1.

**3. Como você vai implementar a sequência do letreiro.** Descreva a técnica — SVG com
filtros, keyframes CSS, biblioteca de animação — e diga como vai garantir que os sete tempos
da seção 4 aconteçam na ordem certa e que o tremor residual continue em loop sem reiniciar
a sequência quando o elemento sair e voltar ao viewport.

**4. Qualquer ponto do briefing que você considere ambíguo, contraditório ou tecnicamente
arriscado.** Seja específico. Se algo na spec do raio-x não fecha, quero saber agora e não
na Fase 2.

Três coisas que eu vou conferir na sua resposta, então trate-as com atenção:

- A regra de temperatura. Frio é só sistema — medição, linhas de chamada, letreiro.
  Quente é só comida — gordura, chapa, preço, CTA. Se você propuser um token de destaque
  genérico ou usar `--letreiro` num preço, está errado.
- O mono restrito. IBM Plex Mono só dentro dos leitores do raio-x e das fichas técnicas.
  Se ele aparecer em rótulo de seção ou em navegação, está errado.
- Os assets. Os 24 arquivos já existem, estão normalizados e são finais. Não gere
  placeholders, não invente nomes, não proponha redimensionar. Use os caminhos da seção 7
  exatamente como estão.

Aguarde minha aprovação antes de escrever a primeira linha de código.

---

## Depois da aprovação

Fase 1, em uma mensagem só:

> Aprovado. Construa a Fase 1: tokens, tipografia, shell de layout, preloader e o letreiro
> completo com os sete tempos e o tremor residual. Nada além disso — sem hero, sem raio-x,
> sem seções. Quando terminar, me diga em no máximo quatro linhas o que ficou pronto e o
> que ficou pendente.

Entre as fases: `/clear`.
