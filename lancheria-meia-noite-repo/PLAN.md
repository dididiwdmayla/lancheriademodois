# PLAN.md — checklist de memória persistente

Coisas registradas para depois, não esquecidas por acidente. Ver `AGENTS.md` para o
contrato; aqui mora só o que foi adiado com uma razão.

---

## Desktop nasce estreito por um quadro

`RaioX.tsx` decide `amplo` (o corte de 900px) num `useEffect` com `matchMedia`, que só roda
depois da hidratação. No primeiro quadro em desktop o componente nasce com `amplo = false`
(mobile-first também no JS, de propósito — ver o comentário em `RaioX.tsx`), e o layout
corrige no quadro seguinte. Em máquina rápida é imperceptível.

**Aceito por ora, não conserte sem eu pedir.** Se aparecer visível numa máquina lenta, a
saída é ler `matchMedia` durante a própria inicialização do estado (`useState(() =>
window.matchMedia(...).matches)`) em vez de esperar o efeito — mas isso só é seguro em
componente que já roda client-side sem SSR de verdade, e precisa confirmar que não introduz
divergência de hidratação.

---

## Fresta do `ESPALHA_X` no teto

Composição estreita (recheio bem mais estreito que o pão) bate no teto de 1.30 e sobra vão
visível entre os pães nas pontas. Documentado como aceitável em `AGENTS.md` — pilha estreita
é pilha baixa, os dois pães ficam quase encostados. Se aparecer visível num lanche real do
cardápio (hoje só o sintético de QA bate no teto), avisar antes de corrigir.

---

## Injeção de tema pelo Radar — após Prompt 24

O parâmetro `?tema=` serve somente à revisão das quatro identidades. O padrão continua
Meia-Noite. Na fase de portabilidade, Radar seleciona `Tema` no servidor e entrega o
objeto ao mesmo `ProvedorTema`, com `estiloTema` no contêiner raiz e somente as fontes
ativas. Não copiar balcão, prensa, dados ou fotos quatro vezes.

O repositório creatingmk1 foi consultado nesta rodada. Sua `SkinDefinition`/`Theme`
não substitui o contrato de temperatura deste motor: a adaptação deve preservar
`quente` e `frio` como papéis distintos. A publicação das quatro skins no registro do
Radar pertence à fase de integração, não ao seletor provisório pedido aqui.
