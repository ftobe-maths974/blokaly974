import React, { useState } from 'react';
import { MAZE_CONFIG } from '../../../core/adapters/MazeAdapter';

export default function MazeEditor({ levelData, onUpdate }) {
  const [selectedTool, setSelectedTool] = useState(4); 

  const startPos = levelData.startPos || { x: 1, y: 1, dir: 1 };
  const grid = levelData.grid || MAZE_CONFIG.defaultGrid;
  
  // Dimensions actuelles
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  const tools = [
    { id: 1, label: "Chemin", icon: "⬜" },
    { id: 4, label: "Mur", icon: "🧱" },
    { id: 3, label: "Arrivée", icon: "🏁" },
  ];

  // --- GESTION TAILLE ---
  const handleResize = (dRows, dCols) => {
      // Bornes de sécurité : 3x3 min, 50x50 max
      const nextRows = Math.max(3, Math.min(50, dRows));
      const nextCols = Math.max(3, Math.min(50, dCols));
      
      if (nextRows === rows && nextCols === cols) return;

      const newGrid = MAZE_CONFIG.resizeGrid(grid, nextRows, nextCols);
      onUpdate({ ...levelData, grid: newGrid });
  };

  const handleCellClick = (rIndex, cIndex) => {
    const newGrid = grid.map(row => [...row]);
    
    if (selectedTool === 2) {
        for(let y=0; y<newGrid.length; y++) {
            for(let x=0; x<newGrid[y].length; x++) {
                if(newGrid[y][x] === 2) newGrid[y][x] = 1;
            }
        }
        newGrid[rIndex][cIndex] = 2;
        onUpdate({ 
            ...levelData, 
            grid: newGrid,
            startPos: { ...startPos, x: cIndex, y: rIndex } 
        });
    } else {
        newGrid[rIndex][cIndex] = selectedTool;
        onUpdate({ ...levelData, grid: newGrid });
    }
  };

  const updateDirection = (newDir) => {
      onUpdate({ ...levelData, startPos: { ...startPos, dir: parseInt(newDir) } });
  };

  // Rotation Visuelle pour l'éditeur (+90 car 🤖 pointe au Nord)
  const visualRotation = startPos.dir * 90 + 90;

  return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      
      {/* HEADER : TAILLE & OUTILS */}
      <div style={{background:'#f8f9fa', padding:'10px', borderBottom:'1px solid #ddd'}}>
        <div style={{display:'flex', justifyContent:'center', gap:'20px', marginBottom:'10px', alignItems:'center'}}>
            {/* Inputs Taille */}
            <div style={{display:'flex', alignItems:'center', gap:'5px', background:'white', padding:'5px', borderRadius:'4px', border:'1px solid #eee'}}>
                <label style={{fontSize:'0.8rem', fontWeight:'bold', color:'#7f8c8d'}}>L:</label>
                <input 
                    type="number" min="3" max="50" 
                    value={cols} 
                    onChange={(e) => handleResize(rows, parseInt(e.target.value)||3)}
                    style={{width:'40px', textAlign:'center', border:'1px solid #ccc', borderRadius:'3px'}} 
                />
                <span style={{color:'#ccc'}}>x</span>
                <label style={{fontSize:'0.8rem', fontWeight:'bold', color:'#7f8c8d'}}>H:</label>
                <input 
                    type="number" min="3" max="50" 
                    value={rows} 
                    onChange={(e) => handleResize(parseInt(e.target.value)||3, cols)}
                    style={{width:'40px', textAlign:'center', border:'1px solid #ccc', borderRadius:'3px'}} 
                />
            </div>

            {/* Slider Direction */}
            <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                <label style={{fontSize:'0.8rem'}}>Dir:</label>
                <input 
                    type="range" min="0" max="3" step="1" value={startPos.dir}
                    onChange={(e) => updateDirection(e.target.value)}
                    style={{width:'50px'}}
                />
                <span style={{fontSize:'1.2rem', transform: `rotate(${visualRotation}deg)`, display:'inline-block'}}>
                    🤖
                </span>
            </div>
        </div>

        <div className="editor-toolbar" style={{display:'flex', justifyContent:'center', gap:'5px', margin:0, boxShadow:'none', background:'transparent', padding:0}}>
            <button onClick={() => setSelectedTool(2)} className={`tool-btn ${selectedTool === 2 ? 'active' : ''}`} style={{padding:'4px 8px', fontSize:'0.8rem', border: selectedTool===2?'2px solid #27ae60':'1px solid #ccc'}}>🤖 Départ</button>
            {tools.map(tool => (
                <button key={tool.id} onClick={() => setSelectedTool(tool.id)} className={`tool-btn ${selectedTool === tool.id ? 'active' : ''}`} style={{padding:'4px 8px', fontSize:'0.8rem', border: selectedTool===tool.id?'2px solid #3498db':'1px solid #ccc'}}>
                    {tool.icon} {tool.label}
                </button>
            ))}
        </div>
      </div>

      {/* ZONE DE DESSIN RESPONSIVE */}
      <div style={{flex: 1, padding: '20px', overflow: 'hidden', display:'flex', justifyContent:'center', alignItems:'center', background:'#e0e0e0'}}>
        
        {/* GRILLE */}
        <div 
            className="editor-grid"
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: '1px',
                padding: '2px',
                backgroundColor: '#34495e',
                
                /* C'EST ICI QUE LA MAGIE OPÈRE POUR LE RATIO 1:1 */
                aspectRatio: `${cols} / ${rows}`,
                width: '100%',      // Essaie de prendre toute la largeur...
                height: '100%',     // ...et toute la hauteur
                maxWidth: '100%',   // ...sans dépasser
                maxHeight: '100%',
                
                // En Flex, ceci centre et contraint
                margin: 'auto'
            }}
        >
            {grid.map((row, rIndex) => (
                row.map((cell, cIndex) => {
                    const isStart = (cell === 2);
                    return (
                        <div 
                            key={`${rIndex}-${cIndex}`}
                            onClick={() => handleCellClick(rIndex, cIndex)}
                            style={{ 
                                width: '100%', height: '100%', 
                                display:'flex', justifyContent:'center', alignItems:'center',
                                cursor:'pointer', 
                                background: cell === 4 ? '#2c3e50' : (cell === 2 ? '#2ecc71' : '#fff'),
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Police dynamique : min(40px, X vmin) pour s'adapter à la case */}
                            <span style={{fontSize: `min(40px, ${60/Math.max(rows,cols)}vmin)`, opacity: isStart ? 0.3 : 1}}>
                                {cell === 2 ? '' : MAZE_CONFIG.THEME[cell]}
                            </span>

                            {isStart && (
                                <div style={{
                                    position: 'absolute', 
                                    transform: `rotate(${visualRotation}deg)`, 
                                    fontSize: `min(40px, ${60/Math.max(rows,cols)}vmin)`,
                                    transition: 'transform 0.2s'
                                }}>
                                    {MAZE_CONFIG.THEME.PLAYER}
                                </div>
                            )}
                        </div>
                    );
                })
            ))}
        </div>
      </div>
    </div>
  );
}