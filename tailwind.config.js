/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // On peut ajouter tes couleurs personnalisées ici plus tard
      colors: {
        brand: {
          light: '#3498db',
          dark: '#2c3e50',
          accent: '#e67e22'
        }
      }
    },
  },
  corePlugins: {
    preflight: false, // <--- LA SÉCURITÉ
  },
  plugins: [],
}