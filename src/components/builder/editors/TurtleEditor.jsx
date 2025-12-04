import React from 'react';

const PREVIEW_SIZE = 300;

export default function TurtleEditor({ levelData, onUpdate }) {
  const startX = levelData.startPos?.x ?? 0;
  const startY = levelData.startPos?.y ?? 0;
  const startDir = levelData.startPos?.dir ?? 0;

  const updateStartPos = (field, value) => {
    // Petit nettoyage pour éviter 360 qui revient à 0 dans la UI
    let val = parseInt(value) || 0;
    if (field === 'dir' && val === 360) val = 0; 

    const newStartPos = { 
        x: startX, y: startY, dir: startDir,
        ...levelData.startPos,
        [field]: val
    };
    onUpdate({ ...levelData, startPos: newStartPos });
  };

  const toCanvasX = (mathX) => PREVIEW_SIZE / 2 + mathX;
  const toCanvasY = (mathY) => PREVIEW_SIZE / 2 - mathY;
  const rotation = startDir; 

  return (
    <div className="h-full w-full bg-slate-50 overflow-y-auto custom-scrollbar relative">
      
      {/* CONTENEUR PRINCIPAL */}
      <div className="min-h-full flex flex-col lg:flex-row items-center justify-center p-8 gap-8 lg:gap-12">
      
        {/* --- ZONE DE VISUALISATION (GRILLE) --- */}
        <div 
            className="relative bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden shrink-0 transition-all hover:shadow-2xl"
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
        >
            {/* Grille décorative */}
            <svg width="100%" height="100%" className="absolute inset-0 opacity-20 pointer-events-none">
                <defs>
                <pattern id="gridSmallTurtle" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#94a3b8" strokeWidth="1"/>
                </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#gridSmallTurtle)" />
                <line x1={PREVIEW_SIZE/2} y1="0" x2={PREVIEW_SIZE/2} y2={PREVIEW_SIZE} stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1={PREVIEW_SIZE/2} x2={PREVIEW_SIZE} y2={PREVIEW_SIZE/2} stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" />
            </svg>

            {/* AVATAR */}
            <div 
                className="absolute w-10 h-10 -ml-5 -mt-5 transition-transform duration-200 ease-out flex items-center justify-center"
                style={{
                left: toCanvasX(startX),
                top: toCanvasY(startY),
                transform: `rotate(${rotation}deg)`,
                }}
            >
                <svg viewBox="0 0 40 40" fill="none" className="w-full h-full drop-shadow-md">
                <circle cx="20" cy="20" r="12" stroke="#334155" strokeWidth="3" fill="rgba(255,255,255,0.9)" />
                <path d="M 34 20 L 26 15 L 26 25 Z" fill="#334155" />
                </svg>
            </div>
        </div>

        {/* --- PANNEAU DE CONFIGURATION --- */}
        <div className="w-full max-w-sm bg-white p-6 rounded-2xl border border-slate-200 shadow-md shrink-0">
            <h4 className="text-sm font-extrabold text-slate-600 uppercase tracking-widest mb-6 text-center flex items-center justify-center gap-2">
                <span>📍</span> Position de départ
            </h4>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Horizontal (X)</label>
                    <input 
                        type="number" 
                        value={startX} 
                        onChange={(e) => updateStartPos('x', e.target.value)} 
                        className="w-full text-center font-mono text-lg bg-slate-50 border border-slate-200 rounded-lg py-2 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Vertical (Y)</label>
                    <input 
                        type="number" 
                        value={startY} 
                        onChange={(e) => updateStartPos('y', e.target.value)} 
                        className="w-full text-center font-mono text-lg bg-slate-50 border border-slate-200 rounded-lg py-2 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                    />
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Direction</label>
                    <span className="text-xl font-bold text-blue-600 font-mono">{startDir}°</span>
                </div>
                {/* CORRECTION ICI : max="270" pour avoir 4 crans exacts */}
                <input 
                    type="range" min="0" max="270" step="90" 
                    value={startDir >= 360 ? 0 : startDir} 
                    onChange={(e) => updateStartPos('dir', e.target.value)} 
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-2"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    {/* Les labels s'alignent maintenant avec 0, 90, 180, 270 */}
                    <span>Est</span>
                    <span>Sud</span>
                    <span>Ouest</span>
                    <span>Nord</span>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}