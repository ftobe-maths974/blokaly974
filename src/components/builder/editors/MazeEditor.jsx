import React, { useState } from 'react';
import { MAZE_CONFIG } from '../../../core/adapters/MazeAdapter';

export default function MazeEditor({ levelData, onUpdate }) {
  const [selectedTool, setSelectedTool] = useState(4); 

  const startPos = levelData.startPos || { x: 1, y: 1, dir: 1 };
  const grid = levelData.grid || MAZE_CONFIG.defaultGrid;
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  const tools = [
    { id: 1, label: "Chemin", icon: "⬜" },
    { id: 4, label: "Mur", icon: "🧱" },
    { id: 3, label: "Arrivée", icon: "🏁" },
  ];

  // --- LOGIQUE (Inchangée) ---
  const handleResize = (dRows, dCols) => {
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
        onUpdate({ ...levelData, grid: newGrid, startPos: { ...startPos, x: cIndex, y: rIndex } });
    } else {
        newGrid[rIndex][cIndex] = selectedTool;
        onUpdate({ ...levelData, grid: newGrid });
    }
  };

  const updateDirection = (newDir) => {
      onUpdate({ ...levelData, startPos: { ...startPos, dir: parseInt(newDir) } });
  };

  const visualRotation = startPos.dir * 90 + 90;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      
      {/* HEADER : BARRE D'OUTILS (Modifié : flex-wrap pour éviter que ça sorte) */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm z-10 flex flex-wrap items-center justify-between gap-4">
        
        {/* Partie Gauche : Dimensions & Direction */}
        <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-400 px-1">DIM</span>
                <input 
                    type="number" min="3" max="50" value={cols} 
                    onChange={(e) => handleResize(rows, parseInt(e.target.value)||3)}
                    className="w-12 text-center text-sm font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-slate-400 font-bold">×</span>
                <input 
                    type="number" min="3" max="50" value={rows} 
                    onChange={(e) => handleResize(parseInt(e.target.value)||3, cols)}
                    className="w-12 text-center text-sm font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-400 px-1">DIR</span>
                <input 
                    type="range" min="0" max="3" step="1" value={startPos.dir}
                    onChange={(e) => updateDirection(e.target.value)}
                    className="w-20 cursor-pointer accent-blue-600"
                />
                <span className="text-xl transition-transform duration-300" style={{ transform: `rotate(${visualRotation}deg)` }}>
                    🤖
                </span>
            </div>
        </div>

        {/* Partie Droite : Outils de dessin (flex-wrap) */}
        <div className="flex flex-wrap gap-2">
            <button 
                onClick={() => setSelectedTool(2)} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border whitespace-nowrap
                    ${selectedTool === 2 ? 'bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
                🤖 Départ
            </button>
            {tools.map(tool => (
                <button 
                    key={tool.id} 
                    onClick={() => setSelectedTool(tool.id)} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border whitespace-nowrap
                        ${selectedTool === tool.id ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                    <span>{tool.icon}</span> {tool.label}
                </button>
            ))}
        </div>
      </div>

      {/* ZONE DE DESSIN (Modifié : Scrolling corrigé) */}
      <div className="flex-1 overflow-auto bg-slate-200/50 relative checkerboard-bg">
        
        {/* Wrapper pour centrer proprement sans couper le haut en cas d'overflow */}
        <div className="min-h-full min-w-full flex items-center justify-center p-8">
            <div 
                className="shadow-2xl border-4 border-slate-700 bg-slate-800"
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gap: '1px',
                    // On retire l'aspect-ratio strict qui peut écraser la grille
                    // On préfère des tailles minimales pour les cases
                    width: 'fit-content', 
                    maxWidth: '100%',
                }}
            >
                {grid.map((row, rIndex) => (
                    row.map((cell, cIndex) => {
                        const isStart = (cell === 2);
                        // Taille de cellule fixe minimale (40px) pour éviter que ça devienne illisible
                        const cellSize = "40px"; 

                        return (
                            <div 
                                key={`${rIndex}-${cIndex}`}
                                onClick={() => handleCellClick(rIndex, cIndex)}
                                style={{ width: cellSize, height: cellSize }} // Taille forcée
                                className={`relative flex items-center justify-center cursor-pointer transition-colors duration-100
                                    ${cell === 4 ? 'bg-slate-700 hover:bg-slate-600' : (cell === 2 ? 'bg-emerald-400' : 'bg-white hover:bg-blue-50')}
                                `}
                            >
                                <span style={{fontSize: '20px', opacity: isStart ? 0.3 : 1, userSelect: 'none'}}>
                                    {cell === 2 ? '' : MAZE_CONFIG.THEME[cell]}
                                </span>

                                {isStart && (
                                    <div style={{
                                        position: 'absolute', 
                                        transform: `rotate(${visualRotation}deg)`, 
                                        fontSize: '20px',
                                        transition: 'transform 0.2s',
                                        pointerEvents: 'none'
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
      
      <style>{`
        .checkerboard-bg {
            background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
            background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}