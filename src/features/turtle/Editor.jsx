import React from 'react';
import TurtleRunner from './Runner'; // On réutilise le visuel du jeu !

export default function TurtleEditor({ levelData, onUpdate }) {
  const startX = levelData.startPos?.x ?? 0;
  const startY = levelData.startPos?.y ?? 0;
  const startDir = levelData.startPos?.dir ?? 0;

  const updateStartPos = (field, value) => {
    let val = parseInt(value) || 0;
    const newStartPos = { 
        x: startX, y: startY, dir: startDir,
        ...levelData.startPos,
        [field]: val
    };
    onUpdate({ ...levelData, startPos: newStartPos });
  };

  // Props simulées pour le Runner
  const previewProps = {
      playerPos: { x: startX, y: startY },
      playerDir: startDir,
      state: { x: startX, y: startY, dir: startDir, lines: [] }, // État statique
      modelLines: levelData.solutionBlocks ? [] : [] // On pourrait afficher le modèle ici si on calculait la solution
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 p-4 bg-slate-50 overflow-hidden">
        
        {/* ZONE VISUELLE (GAUCHE) */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[300px]">
            <TurtleRunner {...previewProps} />
            <div className="absolute top-2 left-2 bg-white/80 px-2 py-1 rounded text-xs font-bold text-slate-500 pointer-events-none">
                Prévisualisation Départ
            </div>
        </div>

        {/* PANNEAU CONTROLES (DROITE) */}
        <div className="w-full md:w-64 flex flex-col gap-4 shrink-0 overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-500 uppercase">Configuration</h3>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">X (Horiz)</label>
                        <input type="number" value={startX} onChange={e => updateStartPos('x', e.target.value)} className="w-full border border-slate-200 p-2 rounded text-center font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Y (Vert)</label>
                        <input type="number" value={startY} onChange={e => updateStartPos('y', e.target.value)} className="w-full border border-slate-200 p-2 rounded text-center font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                </div>
                
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Direction</label>
                    <div className="flex items-center gap-2 mb-2">
                        <input type="range" min="0" max="360" step="15" value={startDir} onChange={e => updateStartPos('dir', e.target.value)} className="flex-1 accent-blue-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                        <span className="font-mono font-bold text-blue-600 w-10 text-right text-sm">{startDir}°</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                        {[0, 90, 180, 270].map(d => (
                            <button key={d} onClick={() => updateStartPos('dir', d)} className={`text-xs py-1 px-2 rounded border ${startDir===d ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                {d}°
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="text-xs text-slate-500 bg-blue-50 p-3 rounded border border-blue-100">
                <p><strong>Repère :</strong> (0,0) est au centre.</p>
                <p>0° = Est (Droite), 90° = Nord (Haut).</p>
            </div>
        </div>
    </div>
  );
}