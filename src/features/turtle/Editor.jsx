import React from 'react';

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

  return (
    <div className="p-4 bg-slate-50 h-full flex flex-col gap-4 overflow-y-auto">
        <h3 className="text-sm font-bold text-slate-500 uppercase">Configuration Tortue</h3>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">X (Horizontal)</label>
                    <input type="number" value={startX} onChange={e => updateStartPos('x', e.target.value)} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Y (Vertical)</label>
                    <input type="number" value={startY} onChange={e => updateStartPos('y', e.target.value)} className="w-full border p-2 rounded" />
                </div>
            </div>
            
            <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Direction (Degrés)</label>
                <div className="flex items-center gap-2">
                    <input type="range" min="0" max="360" step="90" value={startDir} onChange={e => updateStartPos('dir', e.target.value)} className="flex-1" />
                    <span className="font-mono font-bold text-blue-600 w-12 text-right">{startDir}°</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0° (Est)</span>
                    <span>90° (Nord)</span>
                    <span>180°</span>
                    <span>270°</span>
                </div>
            </div>
        </div>

        <div className="text-xs text-slate-500 bg-blue-50 p-3 rounded border border-blue-100">
            💡 Astuce : Utilisez la vue <strong>Solution Prof</strong> ci-dessous pour tracer le dessin que l'élève devra reproduire. Il apparaîtra en gris (modèle) pour l'élève.
        </div>
    </div>
  );
}