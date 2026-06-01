import React, { useState, useEffect } from 'react';

export default function MathEditor({ levelData, onUpdate }) {
  const [tab, setTab] = useState('DATA'); // DATA | GOALS
  
  // États existants
  const [newVarName, setNewVarName] = useState("");
  const [newVarValue, setNewVarValue] = useState(0);
  
  const inputs = levelData.inputs || {};
  const hiddenVars = levelData.hiddenVars || [];
  const lockedVars = levelData.lockedVars || [];
  const targets = levelData.targets || {};
  
  // Nouvelle config de validation
  const validation = levelData.validation || { stars: { blocks: 10, steps: 50 } };

  // Nettoyage des cibles orphelines (si une variable est supprimée)
  useEffect(() => {
      const inputKeys = Object.keys(inputs);
      const targetKeys = Object.keys(targets);
      const orphans = targetKeys.filter(k => !inputKeys.includes(k));
      if (orphans.length > 0) {
          const newTargets = { ...targets };
          orphans.forEach(k => delete newTargets[k]);
          onUpdate({ ...levelData, targets: newTargets });
      }
  }, [inputs, targets]);

  const smartParse = (val) => {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) { try { return JSON.parse(trimmed); } catch { return val; } }
      if (trimmed.startsWith('@')) return val;
      if (trimmed === '' || trimmed.endsWith('.') || trimmed.endsWith(',')) return val;
      const num = Number(trimmed.replace(',', '.'));
      if (!isNaN(num)) return num;
    }
    return val;
  };

  const addVariable = () => {
    if (!newVarName) return;
    const newInputs = { ...inputs, [newVarName]: smartParse(newVarValue) };
    onUpdate({ ...levelData, inputs: newInputs });
    setNewVarName("");
    setNewVarValue(0);
  };

  const removeVariable = (key) => {
    const newInputs = { ...inputs };
    delete newInputs[key];
    const newHidden = hiddenVars.filter(k => k !== key);
    const newLocked = lockedVars.filter(k => k !== key);
    const newTargets = { ...targets };
    delete newTargets[key];
    onUpdate({ ...levelData, inputs: newInputs, hiddenVars: newHidden, lockedVars: newLocked, targets: newTargets });
  };

  const cycleState = (key) => {
    let newHidden = [...hiddenVars];
    let newLocked = [...lockedVars];
    const isHidden = hiddenVars.includes(key);
    const isLocked = lockedVars.includes(key);

    if (!isHidden && !isLocked) newLocked.push(key);
    else if (isLocked) { newLocked = newLocked.filter(k => k !== key); newHidden.push(key); } 
    else { newHidden = newHidden.filter(k => k !== key); }
    onUpdate({ ...levelData, hiddenVars: newHidden, lockedVars: newLocked });
  };

  const updateVariableValue = (key, val) => {
    const newInputs = { ...inputs, [key]: smartParse(val) };
    onUpdate({ ...levelData, inputs: newInputs });
  };

  const toggleTarget = (key) => {
    const newTargets = { ...targets };
    if (newTargets[key] !== undefined) delete newTargets[key];
    else newTargets[key] = inputs[key]; 
    onUpdate({ ...levelData, targets: newTargets });
  };

  const updateTargetValue = (key, val) => {
    const newTargets = { ...targets, [key]: smartParse(val) };
    onUpdate({ ...levelData, targets: newTargets });
  };

  // Mise à jour des objectifs de score
  const updateStarTarget = (field, value) => {
      const newStars = { ...validation.stars, [field]: parseInt(value) || 0 };
      onUpdate({ ...levelData, validation: { ...validation, stars: newStars } });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
        
      {/* ONGLETS */}
      <div className="flex border-b border-slate-200 bg-white">
          <button onClick={() => setTab('DATA')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${tab==='DATA' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-400 hover:text-slate-600'}`}>
              🧪 Données
          </button>
          <button onClick={() => setTab('GOALS')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${tab==='GOALS' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-400 hover:text-slate-600'}`}>
              🏆 Objectifs
          </button>
      </div>

      <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
        
        {/* ONGLET 1 : VARIABLES */}
        {tab === 'DATA' && (
            <div className="flex flex-col gap-6">
                {/* Création */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <h5 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b pb-2">1. Mémoire (Variables)</h5>
                    <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="Nom (ex: x)" value={newVarName} onChange={e => setNewVarName(e.target.value)} className="flex-1 border p-2 rounded text-sm outline-none focus:border-purple-400" />
                        <input type="text" placeholder="Valeur (ex: 0)" value={newVarValue} onChange={e => setNewVarValue(e.target.value)} className="w-24 border p-2 rounded text-sm outline-none focus:border-purple-400" />
                        <button onClick={addVariable} className="bg-purple-500 text-white px-3 rounded font-bold hover:bg-purple-600 transition-colors">+</button>
                    </div>

                    <div className="space-y-2">
                        {Object.entries(inputs).map(([key, val]) => {
                            const isHidden = hiddenVars.includes(key);
                            const isLocked = lockedVars.includes(key);
                            let icon = '✏️';
                            let bgClass = 'bg-white';
                            if (isLocked) { icon = '🔒'; bgClass='bg-amber-50'; }
                            if (isHidden) { icon = '👻'; bgClass='bg-slate-100'; }

                            return (
                            <div key={key} className={`flex items-center gap-2 p-2 rounded border border-slate-200 ${bgClass}`}>
                                <button onClick={() => cycleState(key)} className="text-lg hover:scale-110 transition-transform" title="Changer statut">{icon}</button>
                                <span className="font-bold font-mono text-slate-700 min-w-[20px]">{key}</span>
                                <span className="text-slate-400">=</span>
                                <input 
                                    type="text" 
                                    value={(typeof val === 'object') ? JSON.stringify(val) : val} 
                                    onChange={(e) => updateVariableValue(key, e.target.value)}
                                    className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm font-mono"
                                />
                                <button onClick={() => removeVariable(key)} className="text-red-400 hover:text-red-600 font-bold px-2">×</button>
                            </div>
                            );
                        })}
                        {Object.keys(inputs).length === 0 && <p className="text-xs text-slate-400 italic text-center">Aucune variable.</p>}
                    </div>
                </div>

                {/* Objectifs de Valeur */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <h5 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b pb-2">2. État Final Attendu</h5>
                    <div className="space-y-2">
                        {Object.keys(inputs).map(key => {
                            const isTarget = targets[key] !== undefined;
                            const targetVal = targets[key];
                            const targetDisplay = (typeof targetVal === 'object') ? JSON.stringify(targetVal) : (targetVal ?? '');

                            return (
                            <div key={key} className={`flex items-center gap-3 p-2 rounded transition-colors ${isTarget ? 'bg-emerald-50 border border-emerald-100' : 'opacity-50'}`}>
                                <input type="checkbox" checked={isTarget} onChange={() => toggleTarget(key)} className="accent-emerald-500 w-4 h-4 cursor-pointer" />
                                <span className="font-bold font-mono text-slate-700 w-8">{key}</span>
                                {isTarget && (
                                    <>
                                    <span className="text-emerald-500 font-bold">=</span>
                                    <input 
                                        type="text" 
                                        value={targetDisplay} 
                                        onChange={(e) => updateTargetValue(key, e.target.value)} 
                                        className="flex-1 border border-emerald-300 rounded px-2 py-1 text-sm font-mono text-emerald-700 bg-white" 
                                    />
                                    </>
                                )}
                            </div>
                            );
                        })}
                        {Object.keys(inputs).length === 0 && <p className="text-xs text-slate-400 italic text-center">Créez des variables d'abord.</p>}
                    </div>
                </div>
            </div>
        )}

        {/* ONGLET 2 : OBJECTIFS DE SCORE */}
        {tab === 'GOALS' && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Critères ⭐⭐⭐</h4>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-600">Max Blocs</label>
                            <input 
                                type="number" min="1" max="50" 
                                value={validation.stars?.blocks || 10}
                                onChange={(e) => updateStarTarget('blocks', e.target.value)}
                                className="w-20 p-2 text-center border border-slate-300 rounded font-mono font-bold text-slate-700"
                            />
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-600">Max Opérations (Pas)</label>
                            <input 
                                type="number" min="1" max="500" 
                                value={validation.stars?.steps || 50}
                                onChange={(e) => updateStarTarget('steps', e.target.value)}
                                className="w-20 p-2 text-center border border-slate-300 rounded font-mono font-bold text-slate-700"
                            />
                        </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <p className="text-[10px] text-blue-800 leading-relaxed">
                            💡 <strong>Le "Pas" en Algo :</strong>
                            <br/>
                            Chaque bloc exécuté compte pour 1 pas. Les boucles multiplient les pas. 
                            <br/>
                            Une solution en <span className="font-mono">O(1)</span> coûtera moins de pas qu'une solution en <span className="font-mono">O(n)</span>.
                        </p>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}