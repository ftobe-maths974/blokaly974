import React, { useEffect, useState } from 'react';
import nerdamer from 'nerdamer';

export default function EquationEditor({ levelData, onUpdate }) {
  // On récupère les params ou on met des défauts
  const params = levelData.equation || { a: 2, b: 4, c: 0, d: 10, implicit: false, showGraph: false };
  
  const [manualMode, setManualMode] = useState(false);
  const [manualEq, setManualEq] = useState("");

  // Initialisation au premier chargement
  useEffect(() => {
    if (!levelData.allowedBlocks || levelData.allowedBlocks.length === 0) {
       updateGlobal({ ...params }, true);
    }
    // Synchro initiale du champ texte
    const startEq = `${params.a}*x + ${params.b} = ${params.c}*x + ${params.d}`;
    setManualEq(startEq);
  }, []);

  const updateGlobal = (newParams, resetBlocks = false) => {
    const lhs = newParams.manualLhs || `${newParams.a}*x + ${newParams.b}`;
    const rhs = newParams.manualRhs || `${newParams.c}*x + ${newParams.d}`;
    
    const updates = { 
      ...levelData, 
      equation: { ...newParams, lhs, rhs, sign: '=' }
    };

    if (resetBlocks) {
        updates.allowedBlocks = ['equation_op_both', 'equation_term_x', 'equation_verify', 'equation_solution_state', 'math_number'];
    }
    onUpdate(updates);
  };

  const updateParam = (changes) => {
    const newParams = { ...params, ...changes, manualLhs: null, manualRhs: null };
    updateGlobal(newParams);
    setManualEq(`${newParams.a}*x + ${newParams.b} = ${newParams.c}*x + ${newParams.d}`);
  };

  const generateRandom = () => {
      // Algo pour garantir une solution entière
      const x = Math.floor(Math.random() * 10) - 5; // Solution entre -5 et 5
      const a = Math.floor(Math.random() * 5) + 2;  
      const c = Math.floor(Math.random() * a);      // c < a pour garder x positif à gauche au début
      const b = Math.floor(Math.random() * 10);
      
      // ax + b = cx + d  =>  d = ax + b - cx
      const d = a*x + b - c*x;

      updateParam({ a, b, c, d });
  };

  const handleManualChange = (e) => {
      const val = e.target.value;
      setManualEq(val);
      const parts = val.split('=');
      if (parts.length === 2) {
          try {
            // On vérifie si nerdamer comprend
            nerdamer(parts[0]); nerdamer(parts[1]);
            // On met à jour en mode "Manuel"
            updateGlobal({ ...params, manualLhs: parts[0], manualRhs: parts[1] });
          } catch(e) {}
      }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      
      {/* BARRE D'OUTILS */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider">
              🎛️ Générateur
          </h3>
          <div className="flex gap-2">
             <button onClick={generateRandom} className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-200 transition-colors flex items-center gap-1">
                <span>🎲</span> Aléatoire
             </button>
             <button onClick={() => setManualMode(!manualMode)} className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${manualMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {manualMode ? "Mode Sliders" : "Mode Texte"}
             </button>
          </div>
      </div>

      {/* CONTRÔLES */}
      {manualMode ? (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Équation Libre</label>
              <input 
                type="text" 
                value={manualEq} 
                onChange={handleManualChange}
                className="w-full p-3 font-mono text-lg border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none text-center text-slate-700"
                placeholder="3*x + 5 = 2*x - 1"
              />
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                  Utilisez <code className="bg-slate-100 px-1 rounded">*</code> pour multiplier (ex: 3*x).
              </p>
          </div>
      ) : (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
            {['a', 'b', 'c', 'd'].map(p => (
                <div key={p} className="flex items-center gap-4 group">
                    <label className="w-4 text-xs font-bold text-slate-400 uppercase">{p}</label>
                    <input 
                        type="range" min="-20" max="20" step="1"
                        value={params[p]} 
                        onChange={(e) => updateParam({ [p]: parseInt(e.target.value) })}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500 group-hover:accent-blue-400"
                    />
                    <span className="w-8 text-right font-mono font-bold text-slate-700">{params[p]}</span>
                </div>
            ))}
        </div>
      )}

      {/* OPTIONS & APERÇU */}
      <div className="space-y-3 border-t border-slate-100 pt-4">
        <div className="flex justify-between gap-2">
            <label className="flex-1 flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={params.implicit || false} onChange={(e) => updateParam({ implicit: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
              <span className="text-xs font-bold text-slate-600">Implicit (2x)</span>
            </label>
            
            <label className="flex-1 flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={params.showGraph || false} onChange={(e) => updateParam({ showGraph: e.target.checked })} className="w-4 h-4 text-emerald-600 rounded" />
              <span className="text-xs font-bold text-slate-600">Graphique</span>
            </label>
        </div>

        <div className="bg-slate-800 text-white p-4 rounded-xl text-center font-mono text-lg shadow-inner overflow-hidden text-ellipsis whitespace-nowrap">
            {levelData.equation?.lhs} = {levelData.equation?.rhs}
        </div>
      </div>
    </div>
  );
}