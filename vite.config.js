import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './', // <--- Le "Passe-partout" universel
  // En production uniquement : retire les console.* et debugger du bundle.
  // (conservés en développement pour le debug)
  esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : {},
  build: {
    // Sépare les grosses dépendances en chunks distincts pour éviter un seul
    // bundle monolithique (et améliorer la mise en cache navigateur).
    rollupOptions: {
      output: {
        manualChunks: {
          blockly: ['blockly'],
          katex: ['katex', 'react-katex', 'rehype-katex', 'remark-math'],
          math: ['nerdamer', 'function-plot'],
          markdown: ['react-markdown', 'remark-gfm'],
        },
      },
    },
  },
}))