import React from 'react';

const PALETTE = { R: '#e74c3c', B: '#3498db', J: '#f1c40f', V: '#2ecc71' };
const ORDER = ['R', 'B', 'J', 'V'];

// Éditeur minimal : on clique sur chaque case pour cycler la couleur cible.
export default function MotifEditor({ levelData, onUpdate }) {
  const target = levelData.target || ['R', 'B', 'R', 'B'];

  const cycle = (i) => {
    const next = [...target];
    const idx = ORDER.indexOf(next[i]);
    next[i] = ORDER[(idx + 1) % ORDER.length];
    onUpdate({ ...levelData, target: next });
  };
  const resize = (n) => {
    const next = Array.from({ length: n }, (_, i) => target[i] || 'R');
    onUpdate({ ...levelData, target: next });
  };

  return (
    <div className="p-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm max-w-md mx-auto">
        <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Motif cible</h4>
        <div className="flex flex-wrap gap-1 mb-4">
          {target.map((c, i) => (
            <button key={i} onClick={() => cycle(i)} className="w-7 h-7 rounded border border-black/10" style={{ background: PALETTE[c] }} title="Cliquer pour changer la couleur" />
          ))}
        </div>
        <label className="text-sm text-slate-600">Longueur : <b>{target.length}</b>
          <input type="range" min="2" max="20" value={target.length} onChange={(e) => resize(parseInt(e.target.value))} className="w-full accent-purple-500 mt-1" />
        </label>
      </div>
    </div>
  );
}
