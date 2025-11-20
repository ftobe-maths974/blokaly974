import React, { useState } from 'react';
import { MAZE_CONFIG } from '../../core/adapters/MazeAdapter';

export default function LevelEditor({ levelData, onUpdate }) {
  const [selectedTool, setSelectedTool] = useState(4);

  // Liste des blocs disponibles (Pour les checkbox)
  const availableBlocks = [
    { type: 'maze_move_forward', label: 'Avancer' },
    { type: 'maze_turn', label: 'Tourner' },
    { type: 'controls_repeat_ext', label: 'Boucles (Répéter)' }
  ];

  // --- ACTIONS ---
  
  const handleCellClick = (rIndex, cIndex) => {
    const newGrid = levelData.grid.map(row => [...row]);
    newGrid[rIndex][cIndex] = selectedTool;
    onUpdate({ ...levelData, grid: newGrid });
  };

  const toggleBlock = (blockType) => {
    // Si allowedBlocks n'existe pas encore (vieux niveaux), on le crée
    const currentAllowed = levelData.allowedBlocks || availableBlocks.map(b => b.type);
    
    let newAllowed;
    if (currentAllowed.includes(blockType)) {
      newAllowed = currentAllowed.filter(t => t !== blockType);
    } else {
      newAllowed = [...currentAllowed, blockType];
    }
    onUpdate({ ...levelData, allowedBlocks: newAllowed });
  };

  const handleMaxBlocksChange = (e) => {
    onUpdate({ ...levelData, maxBlocks: parseInt(e.target.value) || 0 });
  };

  // --- RENDER ---

  const tools = [
    { id: 1, label: "Chemin", icon: "⬜" },
    { id: 4, label: "Mur", icon: "🧱" },
    { id: 2, label: "Départ", icon: "🏁" },
    { id: 3, label: "Arrivée", icon: "🏆" },
  ];

  // Sécurité : si allowedBlocks est undefined, tout est autorisé par défaut
  const allowed = levelData.allowedBlocks || availableBlocks.map(b => b.type);

  return (
    <div className="editor-wrapper" style={{display: 'flex', gap: '20px'}}>
      
      {/* COLONNE GAUCHE : Visuel */}
      <div style={{flex: 2}}>
        <div className="editor-toolbar">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`tool-btn ${selectedTool === tool.id ? 'active' : ''}`}
            >
              {tool.icon} {tool.label}
            </button>
          ))}
        </div>

        <div className="editor-grid">
          {levelData.grid.map((row, rIndex) => (
            <div key={rIndex} className="editor-row">
              {row.map((cell, cIndex) => (
                <div 
                  key={`${rIndex}-${cIndex}`}
                  className="editor-cell"
                  onClick={() => handleCellClick(rIndex, cIndex)}
                  style={{ background: cell === 4 ? '#34495e' : '#ecf0f1' }}
                >
                  {MAZE_CONFIG.THEME[cell]}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* COLONNE DROITE : Règles & Contraintes */}
      <div style={{flex: 1, background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
        <h3 style={{marginTop: 0}}>⚙️ Règles du niveau</h3>
        
        <div style={{marginBottom: '20px'}}>
          <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Objectif (Étoiles) :</label>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span>Max</span>
            <input 
              type="number" 
              value={levelData.maxBlocks || 5} 
              onChange={handleMaxBlocksChange}
              style={{width: '60px', padding: '5px'}}
            />
            <span>blocs</span>
          </div>
          <small style={{color: '#7f8c8d'}}>Si l'élève dépasse, il aura moins d'étoiles.</small>
        </div>

        <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '20px 0'}} />

        <div style={{marginBottom: '20px'}}>
          <label style={{fontWeight: 'bold', display: 'block', marginBottom: '10px'}}>Blocs autorisés :</label>
          {availableBlocks.map(b => (
            <div key={b.type} style={{marginBottom: '8px'}}>
              <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center'}}>
                <input 
                  type="checkbox" 
                  checked={allowed.includes(b.type)}
                  onChange={() => toggleBlock(b.type)}
                  style={{marginRight: '10px'}}
                />
                {b.label}
              </label>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
