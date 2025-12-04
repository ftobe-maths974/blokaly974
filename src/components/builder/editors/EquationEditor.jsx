import React, { useEffect } from 'react';

export default function EquationEditor({ levelData, onUpdate }) {
  // Valeurs par défaut avec l'option "implicit"
  const params = levelData.equation || { a: 2, b: 4, c: 0, d: 10, implicit: false };

  // Initialisation
  useEffect(() => {
    if (!levelData.allowedBlocks || levelData.allowedBlocks.length === 0) {
       onUpdate({
         ...levelData,
         equation: params,
         allowedBlocks: ['equation_op_both', 'equation_term_x', 'math_number']
       });
    }
  }, []);

  const updateParam = (changes) => {
    const newParams = { ...params, ...changes };
    
    // Construction des chaînes pour Nerdamer
    // Note : on garde le '*' explicite ici pour le moteur de calcul (Nerdamer en a besoin)
    // C'est le composant de rendu (Render) qui décidera de le cacher ou non.
    const lhs = `${newParams.a}*x + ${newParams.b}`;
    const rhs = `${newParams.c}*x + ${newParams.d}`;
    
    onUpdate({ 
      ...levelData, 
      equation: { ...newParams, lhs, rhs, sign: '=' },
      allowedBlocks: ['equation_op_both', 'equation_term_x', 'math_number'] 
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              🎛️ Générateur d'Équation
          </h3>
          <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
              <input 
                type="checkbox" 
                checked={params.implicit || false} 
                onChange={(e) => updateParam({ implicit: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-blue-700">Multiplication Implicite (2x)</span>
          </label>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {['a', 'b', 'c', 'd'].map(p => (
            <div key={p} className="flex items-center gap-4">
            <label className="w-6 font-bold text-slate-500 uppercase">{p}</label>
            <input 
                type="range" min="-20" max="20" step="1"
                value={params[p]} 
                onChange={(e) => updateParam({ [p]: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="w-8 text-right font-mono font-bold text-slate-700">{params[p]}</span>
            </div>
        ))}
      </div>

      {/* Aperçu */}
      <div className="bg-slate-800 text-white p-4 rounded-xl text-center font-mono text-xl shadow-inner">
        {params.a}x {params.b >=0 ? '+' : ''}{params.b} = {params.c}x {params.d >=0 ? '+' : ''}{params.d}
      </div>
    </div>
  );
}