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
        // On ne split QUE des libs autonomes (sans dépendances croisées). katex +
        // react-markdown + remark/rehype partagent le socle unified/micromark : les
        // séparer manuellement créait un cycle d'init (TDZ « Cannot access … before
        // initialization »). On les laisse à Rollup, qui ordonne l'init correctement.
        manualChunks: {
          blockly: ['blockly'],
          math: ['nerdamer', 'function-plot'],
        },
      },
    },
  },
}))