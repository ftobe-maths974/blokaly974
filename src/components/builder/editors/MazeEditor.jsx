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
    // On s'assure que la grille existe, sinon on utilise celle par défaut
    const currentGrid = levelData.grid || MAZE_CONFIG.defaultGrid;
    // Copie profonde pour éviter les bugs de référence
    const newGrid = currentGrid.map(row => [...row]);
    
    newGrid[rIndex][cIndex] = selectedTool;
    onUpdate({ ...levelData, grid: newGrid });
  };

  // Sécurité : Fallback si la grille est vide
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
    </div>
  );
}