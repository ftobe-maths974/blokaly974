import React, { useState } from 'react';
import { MAZE_CONFIG } from '../../../core/adapters/MazeAdapter';

export default function MazeEditor({ levelData, onUpdate }) {
  const [selectedTool, setSelectedTool] = useState(4); // Mur par défaut

  const tools = [
    { id: 1, label: "Chemin", icon: "⬜" },
    { id: 4, label: "Mur", icon: "🧱" },
    { id: 2, label: "Départ", icon: "🏁" },
    { id: 3, label: "Arrivée", icon: "🏆" },
  ];

  const handleCellClick = (rIndex, cIndex) => {
    const currentGrid = levelData.grid || MAZE_CONFIG.defaultGrid;
    // Copie profonde pour éviter les mutations directes
    const newGrid = currentGrid.map(row => [...row]);
    
    // LOGIQUE "UN SEUL DÉPART"
    if (selectedTool === 2) { // 2 = Départ 🏁
      // 1. On nettoie l'ancien départ s'il existe
      for (let y = 0; y < newGrid.length; y++) {
        for (let x = 0; x < newGrid[y].length; x++) {
          if (newGrid[y][x] === 2) {
            newGrid[y][x] = 1; // On remplace par du chemin blanc
          }
        }
      }
      
      // 2. On place le nouveau départ
      newGrid[rIndex][cIndex] = 2;

      // 3. CRUCIAL : On met à jour startPos pour que le robot suive !
      // On garde la direction existante (ou 1 par défaut)
      const newStartPos = { 
        x: cIndex, 
        y: rIndex, 
        dir: levelData.startPos?.dir || 1 
      };

      onUpdate({ 
        ...levelData, 
        grid: newGrid,
        startPos: newStartPos 
      });

    } else {
      // Cas normal (Mur, Chemin, Arrivée)
      
      // Si on écrase le départ, attention : le robot n'a plus de maison.
      // (Optionnel : on pourrait empêcher d'écraser le départ sans le déplacer)
      if (newGrid[rIndex][cIndex] === 2) {
         // Si on efface le départ, on ne met pas à jour startPos tout de suite
         // ou on pourrait le mettre à null, mais gardons ça simple.
      }

      newGrid[rIndex][cIndex] = selectedTool;
      onUpdate({ ...levelData, grid: newGrid });
    }
  };

  // Sécurité
  const gridToRender = levelData.grid || MAZE_CONFIG.defaultGrid;

  return (
    <div>
      <div className="editor-toolbar" style={{marginBottom:'10px'}}>
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setSelectedTool(tool.id)}
            className={`tool-btn ${selectedTool === tool.id ? 'active' : ''}`}
            style={{
                marginRight:'5px', padding:'5px 10px', 
                border: selectedTool === tool.id ? '2px solid #3498db' : '1px solid #ccc',
                background: selectedTool === tool.id ? '#e1f0fa' : 'white',
                cursor: 'pointer'
            }}
          >
            {tool.icon} {tool.label}
          </button>
        ))}
      </div>

      <div className="editor-grid" style={{display:'inline-block', border:'2px solid #333'}}>
        {gridToRender.map((row, rIndex) => (
          <div key={rIndex} className="editor-row" style={{display:'flex'}}>
            {row.map((cell, cIndex) => (
              <div 
                key={`${rIndex}-${cIndex}`}
                className="editor-cell"
                onClick={() => handleCellClick(rIndex, cIndex)}
                style={{ 
                    width:'40px', height:'40px', display:'flex', justifyContent:'center', alignItems:'center',
                    fontSize:'24px', cursor:'pointer', border:'1px solid #eee',
                    background: cell === 4 ? '#34495e' : '#ecf0f1' 
                }}
              >
                {MAZE_CONFIG.THEME[cell]}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      <p style={{fontSize: '0.8rem', color: '#666', marginTop: '10px'}}>
        💡 Astuce : Placer le drapeau "Départ" 🏁 déplace automatiquement le robot.
      </p>
    </div>
  );
}