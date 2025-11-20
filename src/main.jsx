import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// On importe un CSS de base pour être sûr que l'app prend toute la hauteur
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  /* Pas de StrictMode ici, c'est volontaire */
  <App />
)