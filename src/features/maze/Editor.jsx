import React, { useEffect, useState } from 'react';
import nerdamer from 'nerdamer';

export default function EquationEditor({ levelData, onUpdate }) {
  const params = levelData.equation || { a: 2, b: 4, c: 0, d: 10, sign: '=', implicit: false, showGraph: false };
  const validation = levelData.validation || { strategy: 'ISOLATION', stars: { blocks: 5, steps: 20 } };

  const [manualMode, setManualMode] = useState(false);
  const [manualEq, setManualEq] = useState("");
  const [tab, setTab] = useState('EQUATION'); 

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
    const updates = { ...levelData, equation: { ...newParams, lhs, rhs, sign: newParams.sign } };
    if (resetBlocks) updates.allowedBlocks = ['equation_op_both', 'equation_term_x', 'equation_verify', 'equation_solution_state', 'math_number'];
    onUpdate(updates);
  };

  const updateValidation = (field, value) => {
      const newValidation = { ...validation, [field]: value };
      onUpdate({ ...levelData, validation: newValidation });
  };
  
  const updateStarTarget = (field, value) => {
      const newStars = { ...validation.stars, [field]: parseInt(value) || 0 };
      onUpdate({ ...levelData, validation: { ...validation, stars: newStars } });
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
      const signs = ['=', '<', '>', '\\leq', '\\geq'];
      const randomSign = signs[Math.floor(Math.random() * signs.length)];
      updateParam({ a, b, c, d, sign: randomSign });
  };

  const handleManualChange = (e) => {
      const val = e.target.value;
      setManualEq(val);
      const match = val.match(/(.*?)(<=|>=|<|>|=)(.*)/);
      if (match) {
          try {
            const lhs = match[1].trim();
            const sign = match[2].trim();
            const rhs = match[3].trim();
            let latexSign = sign;
            if (sign === '<=') latexSign = '\\leq';
            if (sign === '>=') latexSign = '\\geq';
            nerdamer(lhs); nerdamer(rhs);
            updateGlobal({ ...params, manualLhs: lhs, manualRhs: rhs, sign: latexSign });
          } catch(e) {}
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      
      {/* ONGLETS */}
      <div className="flex border-b border-slate-200 bg-white">
          <button onClick={() => setTab('EQUATION')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${tab==='EQUATION' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
              📐 Équation
          </button>
          <button onClick={() => setTab('VALIDATION')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${tab==='VALIDATION' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
              🏆 Objectifs
          </button>
      </div>

      <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
        
        {/* VUE ÉQUATION */}
        {tab === 'EQUATION' && (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase">Générateur</span>
                    <div className="flex gap-2">
                        <button onClick={generateRandom} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200">🎲 Aléatoire</button>
                        <button onClick={() => setManualMode(!manualMode)} className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600 hover:bg-slate-200">
                            {manualMode ? "Simple" : "Expert"}
                        </button>
                    </div>
                </div>

                {manualMode ? (
                    <input type="text" value={manualEq} onChange={handleManualChange} className="w-full p-3 font-mono text-lg border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none text-center text-slate-700" />
                ) : (
                    <div className="space-y-5">
                        {['a', 'b', 'c', 'd'].map(p => (
                            <div key={p} className="flex items-center gap-4">
                                <label className="w-4 text-xs font-bold text-slate-400 uppercase">{p}</label>
                                <input type="range" min="-20" max="20" step="1" value={params[p]} onChange={(e) => updateParam({ [p]: parseInt(e.target.value) })} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                <span className="w-8 text-right font-mono font-bold text-slate-700">{params[p]}</span>
                            </div>
                        ))}
                        <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-lg justify-center">
                            {['=', '<', '>', '\\leq', '\\geq'].map(s => (
                                <button key={s} onClick={() => updateParam({ sign: s })} className={`w-8 h-8 rounded font-bold ${params.sign === s ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>
                                    {s === '\\leq' ? '≤' : (s === '\\geq' ? '≥' : s)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mt-2 flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={params.implicit || false} onChange={(e) => updateParam({ implicit: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-xs font-bold text-slate-600">Implicit</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={params.showGraph || false} onChange={(e) => updateParam({ showGraph: e.target.checked })} className="w-4 h-4 text-emerald-600 rounded" />
                        <span className="text-xs font-bold text-slate-600">Graphique</span>
                    </label>
                </div>
            </div>
        )}

        {/* VUE VALIDATION */}
        {tab === 'VALIDATION' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Condition de Victoire</h4>
                    <select 
                        value={validation.strategy || 'ISOLATION'} 
                        onChange={(e) => updateValidation('strategy', e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50"
                    >
                        <option value="ISOLATION">Isolation (x = ...)</option>
                        <option value="VERIFICATION">Vérification (Bloc Vert)</option>
                        <option value="FLEXIBLE">Flexible (L'un ou l'autre)</option>
                        <option value="COMPLETE">Expert (Les deux requis)</option>
                    </select>
                    <p className="text-[10px] text-slate-400 mt-2 leading-snug bg-slate-50 p-2 rounded">
                        {validation.strategy === 'ISOLATION' && "L'élève gagne dès que x est isolé."}
                        {validation.strategy === 'VERIFICATION' && "L'élève doit utiliser le bloc de vérification."}
                        {validation.strategy === 'FLEXIBLE' && "L'élève peut choisir sa méthode."}
                        {validation.strategy === 'COMPLETE' && "L'élève doit isoler x PUIS vérifier le résultat."}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Critères ⭐⭐⭐</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-600">Max Blocs</label>
                            <input type="number" min="1" value={validation.stars?.blocks || 10} onChange={(e) => updateStarTarget('blocks', e.target.value)} className="w-16 p-1 text-center border border-slate-300 rounded font-mono text-sm" />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-600">Max Étapes</label>
                            <input type="number" min="1" value={validation.stars?.steps || 20} onChange={(e) => updateStarTarget('steps', e.target.value)} className="w-16 p-1 text-center border border-slate-300 rounded font-mono text-sm" />
                        </div>
                    </div>
                </div>

            </div>
        )}

      </div>
    </div>
  );
}