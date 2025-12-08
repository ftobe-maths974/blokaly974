import React, { useState } from 'react';
import { MAZE_CONFIG } from './config';

export default function MazeEditor({ levelData, onUpdate }) {
  const [tab, setTab] = useState('GRID'); // GRID | SETTINGS
  const [selectedTool, setSelectedTool] = useState(4); 

  const startPos = levelData.startPos || { x: 1, y: 1, dir: 1 };
  const grid = levelData.grid || MAZE_CONFIG.defaultGrid;
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  
  // Validation config
  const validation = levelData.validation || { stars: { blocks: 5, steps: 30 } };

  // ... (Garde tes fonctions handleResize, handleCellClick, updateDirection) ...
  const handleResize = (dRows, dCols) => { const nextRows = Math.max(3, Math.min(50, dRows)); const nextCols = Math.max(3, Math.min(50, dCols)); if (nextRows === rows && nextCols === cols) return; const newGrid = MAZE_CONFIG.resizeGrid(grid, nextRows, nextCols); onUpdate({ ...levelData, grid: newGrid }); };
  const handleCellClick = (r, c) => { const newGrid = grid.map(row => [...row]); if (selectedTool === 2) { for(let y=0; y<newGrid.length; y++) { for(let x=0; x<newGrid[y].length; x++) { if(newGrid[y][x] === 2) newGrid[y][x] = 1; } } newGrid[r][c] = 2; onUpdate({ ...levelData, grid: newGrid, startPos: { ...startPos, x: c, y: r } }); } else { newGrid[r][c] = selectedTool; onUpdate({ ...levelData, grid: newGrid }); } };
  const updateDirection = (newDir) => { onUpdate({ ...levelData, startPos: { ...startPos, dir: parseInt(newDir) } }); };
  const updateStarTarget = (field, value) => { const newStars = { ...validation.stars, [field]: parseInt(value) || 0 }; onUpdate({ ...levelData, validation: { ...validation, stars: newStars } }); };

  const tools = [ { id: 1, label: "Chemin", icon: "⬜" }, { id: 4, label: "Mur", icon: "🧱" }, { id: 3, label: "Arrivée", icon: "🏁" } ];
  const visualRotation = startPos.dir * 90 + 90;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      
      {/* TABS */}
      <div className="flex border-b border-slate-200 bg-white">
          <button onClick={() => setTab('GRID')} className={`flex-1 py-3 text-xs font-bold uppercase ${tab==='GRID' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>🗺️ Carte</button>
          <button onClick={() => setTab('SETTINGS')} className={`flex-1 py-3 text-xs font-bold uppercase ${tab==='SETTINGS' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-400'}`}>⚙️ Config</button>
      </div>

      {tab === 'GRID' && (
        <>
          <div className="p-2 bg-slate-100 flex justify-center gap-4 items-center border-b border-slate-200">
             {/* Toolbar Grille (Garde ton code existant ici) */}
             <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border">
                <span className="text-xs font-bold text-slate-400">Dim:</span>
                <input type="number" value={cols} onChange={(e) => handleResize(rows, parseInt(e.target.value)||3)} className="w-8 text-center text-xs border rounded" />
                <span className="text-slate-300">x</span>
                <input type="number" value={rows} onChange={(e) => handleResize(parseInt(e.target.value)||3, cols)} className="w-8 text-center text-xs border rounded" />
             </div>
             <div className="flex items-center gap-2">
                <input type="range" min="0" max="3" step="1" value={startPos.dir} onChange={(e) => updateDirection(e.target.value)} className="w-16" />
                <span style={{transform: `rotate(${visualRotation}deg)`}}>🤖</span>
             </div>
          </div>
          
          <div className="p-2 bg-slate-200 flex justify-center gap-2">
             <button onClick={() => setSelectedTool(2)} className={`px-2 py-1 text-xs rounded font-bold ${selectedTool===2?'bg-green-500 text-white':'bg-white text-slate-600'}`}>🤖 Départ</button>
             {tools.map(tool => (
                <button key={tool.id} onClick={() => setSelectedTool(tool.id)} className={`px-2 py-1 text-xs rounded font-bold ${selectedTool===tool.id?'bg-blue-500 text-white':'bg-white text-slate-600'}`}>
                    {tool.icon} {tool.label}
                </button>
             ))}
          </div>

          <div className="flex-1 p-4 overflow-hidden flex justify-center items-center bg-slate-300">
             <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1px', aspectRatio: `${cols}/${rows}`, height: '100%', maxHeight: '400px' }}>
                {grid.map((row, r) => row.map((cell, c) => (
                    <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} className="flex items-center justify-center cursor-pointer relative bg-white hover:opacity-90">
                        {cell === 4 && <div className="absolute inset-0 bg-slate-700" />}
                        {cell === 3 && <span className="text-2xl">🏁</span>}
                        {cell === 2 && <span className="text-2xl opacity-50">🟩</span>}
                        {startPos.x === c && startPos.y === r && <span className="absolute text-2xl z-10" style={{transform: `rotate(${visualRotation}deg)`}}>🤖</span>}
                    </div>
                )))}
             </div>
          </div>
        </>
      )}

      {tab === 'SETTINGS' && (
          <div className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-md mx-auto">
                  <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Objectifs de Victoire</h4>
                  <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-600">Max Blocs (pour ⭐)</label>
                            <input type="number" min="1" value={validation.stars?.blocks || 5} onChange={(e) => updateStarTarget('blocks', e.target.value)} className="w-20 p-2 text-center border border-slate-300 rounded font-bold" />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-600">Max Pas (pour ⭐)</label>
                            <input type="number" min="1" value={validation.stars?.steps || 30} onChange={(e) => updateStarTarget('steps', e.target.value)} className="w-20 p-2 text-center border border-slate-300 rounded font-bold" />
                        </div>
                  </div>
                  <p className="mt-4 text-xs text-slate-400 bg-slate-50 p-2 rounded">
                      Astuce : Pour les labyrinthes, comptez le nombre de cases + les virages pour estimer les "Pas".
                  </p>
              </div>
          </div>
      )}
    </div>
  );
}