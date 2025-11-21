import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' 

// --- AJOUT : Chargement du Core ---
import { registerStandardBlocks } from './core/StandardBlocks';
registerStandardBlocks(); 
// ----------------------------------

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)