import React, { useEffect, useState } from 'react';
import nerdamer from 'nerdamer';

export default function EquationEditor({ levelData, onUpdate }) {
  // On ajoute 'sign' aux paramètres par défaut
  const params = levelData.equation || { a: 2, b: 4, c: 0, d: 10, sign: '=', implicit: false, showGraph: false };
  
  const [manualMode, setManualMode] = useState(false);
  const [manualEq, setManualEq] = useState("");

  useEffect(() => {
    if (!levelData.allowedBlocks || levelData.allowedBlocks.length === 0) {
       updateGlobal({ ...params }, true);
    }
    const startEq = `${params.a}*x + ${params.b} ${params.sign} ${params.c}*x + ${params.d}`;
    setManualEq(startEq);
  }, []);

  const updateGlobal = (newParams, resetBlocks = false) => {
    const lhs = newParams.manualLhs || `${newParams.a}*x + ${newParams.b}`;
    const rhs = newParams.manualRhs || `${newParams.c}*x + ${newParams.d}`;
    
    const updates = { 
      ...levelData, 
      // On s'assure que 'sign' est bien sauvegardé
      equation: { ...newParams, lhs, rhs, sign: newParams.sign }
    };

    if (resetBlocks) {
        updates.allowedBlocks = ['equation_op_both', 'equation_term_x', 'equation_verify', 'equation_solution_state', 'math_number'];
    }
    onUpdate(updates);
  };

  const updateParam = (changes) => {
    const newParams = { ...params, ...changes, manualLhs: null, manualRhs: null };
    updateGlobal(newParams);
    setManualEq(`${newParams.a}*x + ${newParams.b} ${newParams.sign} ${newParams.c}*x + ${newParams.d}`);
  };

  const generateRandom = () => {
      const x = Math.floor(Math.random() * 10) - 5;
      const a = Math.floor(Math.random() * 5) + 2;  
      const c = Math.floor(Math.random() * a);
      const b = Math.floor(Math.random() * 10);
      const d = a*x + b - c*x;
      // On choisit un signe au hasard
      const signs = ['=', '<', '>', '\\leq', '\\geq'];
      const randomSign = signs[Math.floor(Math.random() * signs.length)];

      updateParam({ a, b, c, d, sign: randomSign });
  };

  const handleManualChange = (e) => {
      const val = e.target.value;
      setManualEq(val);
      // Parsing basique pour détecter le signe central
      // On cherche =, <, >, <=, >=
      const match = val.match(/(.*?)(<=|>=|<|>|=)(.*)/);
      if (match) {
          try {
            const lhs = match[1].trim();
            const sign = match[2].trim();
            const rhs = match[3].trim();
            
            // Conversion symboles LaTeX si besoin
            let latexSign = sign;
            if (sign === '<=') latexSign = '\\leq';
            if (sign === '>=') latexSign = '\\geq';

            nerdamer(lhs); nerdamer(rhs);
            updateGlobal({ ...params, manualLhs: lhs, manualRhs: rhs, sign: latexSign });
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
                placeholder="3*x + 5 <= 2*x - 1"
              />
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
            
            {/* SÉLECTEUR DE SIGNE */}
            <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-lg">
                <label className="w-16 text-xs font-bold text-slate-500 uppercase">Signe :</label>
                <div className="flex gap-2 flex-1 justify-center">
                    {['=', '<', '>', '\\leq', '\\geq'].map(s => (
                        <button
                            key={s}
                            onClick={() => updateParam({ sign: s })}
                            className={`w-10 h-10 flex items-center justify-center rounded font-bold text-lg font-mono transition-all ${params.sign === s ? 'bg-white shadow text-blue-600 ring-2 ring-blue-200' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`}
                        >
                            {s === '\\leq' ? '≤' : (s === '\\geq' ? '≥' : s)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* OPTIONS */}
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
      </div>
    </div>
  );
}