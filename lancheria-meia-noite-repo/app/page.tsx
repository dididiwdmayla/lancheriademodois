// PORTE PENDENTE.
// O comportamento vive em /export/lancheria-meia-noite.dc.html — letreiro, raio-x,
// prensa, salto, carrinho e trilhos já funcionam ali.
// Ver /design/PROMPT-09-porte.md. Portar, não redesenhar.

export default function Page() {
  return (
    <main style={{ padding: '4rem 1.5rem', maxWidth: '46rem' }}>
      <h1 style={{ fontFamily: 'var(--fonte-display)', fontWeight: 900, fontSize: '3rem', lineHeight: 0.9, margin: 0 }}>
        Porte pendente
      </h1>
      <p style={{ marginTop: '1.5rem', lineHeight: 1.6 }}>
        Os componentes ainda não foram portados do export. Andaime, dados e assets estão prontos.
      </p>
    </main>
  )
}
