import React from 'react';

// Éditeur minimal : choisir le mode de la leçon d'angles.
const MODES = [
  { key: 'supp', label: '① Le supplément' },
  { key: 'tour', label: '② Le tour complet' },
  { key: 'quiz', label: '③ Quiz' },
];

export default function AngleEditor({ levelData, onUpdate }) {
  const mode = levelData.mode || 'supp';
  return (
    <div className="p-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm max-w-md mx-auto">
        <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Atelier des angles</h4>
        <p className="text-xs text-slate-400 mb-3">Type de leçon interactive :</p>
        <div className="flex flex-col gap-2">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => onUpdate({ ...levelData, mode: m.key })}
              className={`py-2 px-3 rounded-lg text-sm font-bold border ${mode === m.key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
