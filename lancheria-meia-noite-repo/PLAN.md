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
