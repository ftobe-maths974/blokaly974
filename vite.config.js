import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './', // <--- Le "Passe-partout" universel
  // En production uniquement : retire les console.* et debugger du bundle.
  // (conservés en développement pour le debug)
  esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : {},
}))