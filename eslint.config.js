import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Diagnostics React Compiler (eslint-plugin-react-hooks v7) : le projet
      // n'utilise pas (encore) le compiler. Ces règles signalent ici des cas
      // volontaires/faux positifs (effets d'animation, reset d'état au changement
      // de prop, Date.now() dans un handler, récursion mutuelle de callbacks via
      // setTimeout) → on les rétrograde en warn sans bloquer. rules-of-hooks et
      // exhaustive-deps restent actives. À réévaluer si le compiler est adopté.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
])
