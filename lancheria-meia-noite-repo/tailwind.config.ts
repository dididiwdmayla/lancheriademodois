import type { Config } from 'tailwindcss'

// Os seis tokens, e só eles. Nenhum accent genérico.
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        borra: 'var(--borra)',
        fumo: 'var(--fumo)',
        traco: 'var(--traco)',
        osso: 'var(--osso)',
        latao: 'var(--latao)',
        letreiro: 'var(--letreiro)',
      },
      fontFamily: {
        display: ['var(--fonte-display)'],
        corpo: ['var(--fonte-corpo)'],
        medida: ['var(--fonte-medida)'],
      },
    },
  },
  plugins: [],
} satisfies Config
