/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'ui-sans-serif', 'sans-serif']
      },
      colors: {
        // Terminal surface tokens (driven by CSS variables so light/dark both work)
        term: {
          bg: 'rgb(var(--term-bg) / <alpha-value>)',
          panel: 'rgb(var(--term-panel) / <alpha-value>)',
          panel2: 'rgb(var(--term-panel2) / <alpha-value>)',
          border: 'rgb(var(--term-border) / <alpha-value>)',
          text: 'rgb(var(--term-text) / <alpha-value>)',
          muted: 'rgb(var(--term-muted) / <alpha-value>)',
          faint: 'rgb(var(--term-faint) / <alpha-value>)',
          accent: 'rgb(var(--term-accent) / <alpha-value>)',
          good: 'rgb(var(--term-good) / <alpha-value>)',
          warn: 'rgb(var(--term-warn) / <alpha-value>)',
          bad: 'rgb(var(--term-bad) / <alpha-value>)'
        }
      }
    }
  },
  plugins: []
};
