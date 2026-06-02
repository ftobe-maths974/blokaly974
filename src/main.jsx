import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' 

// --- CHARGEMENT UNIQUE ET GLOBAL ---
import { registerAllBlocks } from './core/BlockRegistry';
registerAllBlocks();
// ----------------------------------

// DEV : inspecter les compétences captées depuis la console
// (ex. `maths974.getMastery()` après avoir réussi des niveaux)
if (import.meta.env.DEV) {
  import('./core/competences').then((c) => {
    window.maths974 = { getMastery: c.getMastery, getMacroMastery: c.getMacroMastery, getAttempts: c.getAttempts, clear: c.clearAttempts };
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)