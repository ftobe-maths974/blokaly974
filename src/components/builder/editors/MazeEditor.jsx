import React, { useState } from 'react';
import { MAZE_CONFIG } from '../../../core/adapters/MazeAdapter';

export default function MazeEditor({ levelData, onUpdate }) {
  const [selectedTool, setSelectedTool] = useState(4); // Mur par défaut

  // Configuration initiale si absente
  const startPos = levelData.startPos || { x: 1, y: 1, dir: 1 };
  const grid = levelData.grid || MAZE_CONFIG.defaultGrid;

  const tools = [
    { id: 1, label: "Chemin", icon: "⬜" },
    { id: 4, label: "Mur", icon: "🧱" },
    // On sépare le départ des autres outils de dessin
    { id: 3, label: "Arrivée", icon: "🏁" },
  ];

  const handleCellClick = (rIndex, cIndex) => {
    const newGrid = grid.map(row => [...row]);
    
    // Si on veut placer le départ (Robot)
    if (selectedTool === 2) {
        // 1. On efface l'ancien départ (le remplace par du chemin)
        for(let y=0; y<newGrid.length; y++) {
            for(let x=0; x<newGrid[y].length; x++) {
                if(newGrid[y][x] === 2) newGrid[y][x] = 1;
            }
        }
        // 2. On place le nouveau
        newGrid[rIndex][cIndex] = 2;
        
        // 3. On met à jour la position
        onUpdate({ 
            ...levelData, 
            grid: newGrid,
            startPos: { ...startPos, x: cIndex, y: rIndex } // On garde la direction actuelle
        });
    } else {
        // Outils classiques
        if (newGrid[rIndex][cIndex] === 2) {
            // Si on écrase le départ, attention... (on laisse faire pour l'instant)
        }
        newGrid[rIndex][cIndex] = selectedTool;
        onUpdate({ ...levelData, grid: newGrid });
    }
  };

  const updateDirection = (newDir) => {
      onUpdate({
          ...levelData,
          startPos: { ...startPos, dir: parseInt(newDir) }
      });
  };

  return (
    <div>
      {/* BARRE D'OUTILS */}
      <div className="editor-toolbar" style={{marginBottom:'15px', display:'flex', flexWrap:'wrap', gap:'10px', justifyContent:'center'}}>
        {/* Outil Spécial Départ */}
        <button
            onClick={() => setSelectedTool(2)}
            className={`tool-btn ${selectedTool === 2 ? 'active' : ''}`}
            style={{
                border: selectedTool === 2 ? '2px solid #27ae60' : '1px solid #ccc',
                background: selectedTool === 2 ? '#eafaf1' : 'white',
            }}
        >
            🤖 Départ
        </button>

        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setSelectedTool(tool.id)}
            className={`tool-btn ${selectedTool === tool.id ? 'active' : ''}`}
            style={{
                border: selectedTool === tool.id ? '2px solid #3498db' : '1px solid #ccc',
                background: selectedTool === tool.id ? '#e1f0fa' : 'white',
            }}
          >
            {tool.icon} {tool.label}
          </button>
        ))}
      </div>

      {/* SLIDER DIRECTION (Visible seulement si on configure le départ ou toujours ?) */}
      <div style={{background: '#f8f9fa', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign:'center', border:'1px solid #eee'}}>
          <label style={{fontWeight:'bold', marginRight:'10px', color:'#2c3e50'}}>Orientation du Robot :</label>
          <input 
            type="range" min="0" max="3" step="1"
            value={startPos.dir}
            onChange={(e) => updateDirection(e.target.value)}
            style={{cursor: 'pointer', verticalAlign: 'middle'}}
          />
          <span style={{marginLeft:'10px', fontWeight:'bold', color:'#27ae60'}}>
            {['⬆️ Nord', '➡️ Est', '⬇️ Sud', '⬅️ Ouest'][startPos.dir]}
          </span>
      </div>

      {/* GRILLE AVEC ROBOT */}
      <div style={{display:'flex', justifyContent:'center'}}>
        <div className="editor-grid" style={{display:'inline-block', border:'4px solid #34495e', position:'relative'}}>
            {grid.map((row, rIndex) => (
            <div key={rIndex} className="editor-row" style={{display:'flex'}}>
                {row.map((cell, cIndex) => {
                    // On vérifie si c'est la case départ pour afficher le robot
                    const isStart = (cell === 2); // Ou on pourrait comparer avec startPos.x/y
                    
                    return (
                        <div 
                            key={`${rIndex}-${cIndex}`}
                            className="editor-cell"
                            onClick={() => handleCellClick(rIndex, cIndex)}
                            style={{ 
                                width:'40px', height:'40px', display:'flex', justifyContent:'center', alignItems:'center',
                                fontSize:'24px', cursor:'pointer', border:'1px solid #ecf0f1',
                                background: cell === 4 ? '#2c3e50' : (cell === 2 ? '#2ecc71' : '#fff'),
                                position: 'relative'
                            }}
                        >
                            {/* Fond de case (Mur, Arrivée...) */}
                            <span style={{opacity: isStart ? 0.3 : 1}}>
                                {cell === 2 ? '' : MAZE_CONFIG.THEME[cell]}
                            </span>

                            {/* Robot par dessus le départ */}
                            {isStart && (
                                <div style={{
                                    position: 'absolute', 
                                    transform: `rotate(${startPos.dir * 90}deg)`,
                                    fontSize: '28px',
                                    transition: 'transform 0.2s'
                                }}>
                                    {MAZE_CONFIG.THEME.PLAYER}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            ))}
        </div>
      </div>
      
      <p style={{fontSize: '0.8rem', color: '#95a5a6', marginTop: '10px', textAlign:'center'}}>
        Cliquez sur "Départ" puis sur la grille pour placer le robot. Utilisez le curseur pour le tourner.
      </p>
    </div>
  );
}