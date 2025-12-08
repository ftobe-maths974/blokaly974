import React, { useState, useEffect } from 'react';

export default function MathEditor({ levelData, onUpdate }) {
  const [newVarName, setNewVarName] = useState("");
  const [newVarValue, setNewVarValue] = useState(0);
  
  const inputs = levelData.inputs || {};
  const hiddenVars = levelData.hiddenVars || [];
  const lockedVars = levelData.lockedVars || [];
  const targets = levelData.targets || {};

  // Nettoyage des cibles orphelines
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
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try { return JSON.parse(trimmed); } catch(e) { return val; }
      }
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
    else if (isLocked) {
        newLocked = newLocked.filter(k => k !== key);
        newHidden.push(key);
    } else {
        newHidden = newHidden.filter(k => k !== key);
    }
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

  return (
    <div className="p-4 bg-slate-50 h-full overflow-y-auto">
      <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">🧪 Configuration Labo</h3>
      
      <div className="flex flex-col gap-6">
        {/* VARIABLES */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <h5 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b pb-2">1. Variables (Mémoire)</h5>
          
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="Nom (x)" value={newVarName} onChange={e => setNewVarName(e.target.value)} className="flex-1 border p-2 rounded text-sm" />
            <input type="text" placeholder="Val (0)" value={newVarValue} onChange={e => setNewVarValue(e.target.value)} className="w-20 border p-2 rounded text-sm" />
            <button onClick={addVariable} className="bg-emerald-500 text-white px-3 rounded font-bold hover:bg-emerald-600 transition-colors">+</button>
          </div>

          <div className="space-y-2">
            {Object.entries(inputs).map(([key, val]) => {
                const isHidden = hiddenVars.includes(key);
                const isLocked = lockedVars.includes(key);
                let icon = '✏️';
                let bgClass = 'bg-white';
                if (isLocked) { icon = '🔒'; bgClass='bg-amber-50'; }
                if (isHidden) { icon = '👻'; bgClass='bg-slate-100'; }

                const inputValue = (typeof val === 'object') ? JSON.stringify(val) : val;

                return (
                <div key={key} className={`flex items-center gap-2 p-2 rounded border border-slate-200 ${bgClass}`}>
                    <button onClick={() => cycleState(key)} className="text-lg hover:scale-110 transition-transform" title="Changer statut">{icon}</button>
                    <span className="font-bold font-mono text-slate-700 min-w-[20px]">{key}</span>
                    <span className="text-slate-400">=</span>
                    <input 
                        type="text" 
                        value={inputValue} 
                        onChange={(e) => updateVariableValue(key, e.target.value)}
                        className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm font-mono"
                    />
                    <button onClick={() => removeVariable(key)} className="text-red-400 hover:text-red-600 font-bold px-2">×</button>
                </div>
                );
            })}
            {Object.keys(inputs).length === 0 && <p className="text-xs text-slate-400 italic text-center">Aucune variable définie.</p>}
          </div>
        </div>

        {/* OBJECTIFS */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <h5 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b pb-2">2. Objectifs (Fin)</h5>
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
    </div>
  );
}