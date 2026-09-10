# Prompt — correção do letreiro (Fase 1, movimento 2)

---

## Regra permanente, válida a partir de agora

Toda entrega sua termina com este bloco, sem exceção. Uma linha cada, no máximo duas.

```
RELATÓRIO
Feito:     o que foi implementado nesta entrega
Não feito: o que eu pedi e você não fez, com o motivo
Adiado:    o que você deixou pra depois, com a fase
Risco:     o que pode quebrar e onde — ou "nenhum"
```

Não escreva "nenhum" em **Não feito** ou **Adiado** para parecer completo. Se cortou algo,
diga. Prefiro saber agora.

---

## O que está errado no letreiro

Ele está lendo como **neon**, e o briefing pede **caixa de acrílico retroiluminada** — o
letreiro de lancheria de esquina. São dois objetos diferentes.

Neon é tubo de vidro: a luz nasce no contorno da letra e sangra pra fora. É o que está na
tela — cada letra com halo próprio. Caixa retroiluminada é o contrário: a luz vem de trás
do painel inteiro, uniforme, e as letras são acrílico translúcido recortado. Elas não
emitem, elas transmitem.

## Correções

**1. Troque o modelo de luz.**

- `#lt-halo` deixa de ser glow por letra e vira **um retângulo de luz atrás do painel
  inteiro**, com queda mais acentuada nos quatro cantos que no centro. Reator não ilumina
  acrílico por igual.
- As letras perdem o brilho próprio. Preenchimento chapado em `--letreiro` com opacidade
  alta; todo o brilho vem do painel atrás delas.
- Cada letra ganha um traço de 1px em `--traco` no contorno interno — é a borda do recorte
  do acrílico. É esse detalhe que separa acrílico de neon a olho nu.
- Os dois estalos passam a piscar **o painel inteiro**, não as letras. Em reator velho é a
  caixa toda que dispara, e fica mais dramático que letra piscando.

**2. Recomponha o texto em duas linhas.**

`MEIA` sobre `NOITE`, centralizadas, o painel ficando mais alto e mais quadrado. Letreiro
de lancheria quase nunca é uma linha larga e baixa.

Isso resolve dois problemas de uma vez: hoje as letras estão esticadas de borda a borda e
quase se tocam, e o hífen no peso 900 virou uma barra pesada no meio da palavra. Em duas
linhas o hífen simplesmente deixa de existir.

Deixe respiro lateral: o texto ocupa no máximo 82% da largura interna do painel.

**3. Dê evidência de objeto.**

A caixa hoje é um retângulo geométrico perfeito, e um letreiro que trabalha das 18h às 4h
não é. Não quero textura nem sujeira desenhada — quero duas assimetrias sutis:

- a caixa levemente fora de esquadro, uns 0,4° de rotação, ou uma borda 2px mais grossa
  que a oposta;
- um dos dois tubos permanentemente um pouco mais fraco que o outro, uns 6% de diferença.

O segundo conversa direto com o tremor fora de fase que você já implementou.

## O que preservar sem tocar

- O clock único em WAAPI escrevendo nas duas custom properties. A arquitetura está certa.
- O `#lt-tremor` como `<g>` separado, iniciado no mount e nunca removido.
- A flag de `sessionStorage` escrita antes do primeiro paint.
- O tratamento de `prefers-reduced-motion`.
- Os seis IDs contratados.
- Os controles de dev que você adicionou — mantenha os três.

## Verificação antes de me entregar

Rode você mesmo e me diga o resultado no **Risco**:

1. CPU estrangulada em 6×, com "acender sempre" ligado: o estalo de 60ms sobrevive ou vira
   fade?
2. Recarregar duas vezes na mesma aba: na segunda ele nasce aceso, sem nenhum frame apagado?
3. Rolar pra fora e voltar: a sequência não repete e o tremor não dá salto?

Fontes self-hosted continuam adiadas para a Fase 3. Registre no `PLAN.md` e não perca.
