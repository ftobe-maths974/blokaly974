import React, { useState, useEffect } from 'react';

export default function MathEditor({ levelData, onUpdate }) {
  const [newVarName, setNewVarName] = useState("");
  const [newVarValue, setNewVarValue] = useState(0);
  
  const inputs = levelData.inputs || {};
  const hiddenVars = levelData.hiddenVars || [];
  const lockedVars = levelData.lockedVars || [];
  const targets = levelData.targets || {};

  // --- NETTOYAGE AUTOMATIQUE DES CIBLES ORPHELINES ---
  // Si une cible existe pour une variable qui n'est plus dans 'inputs', on la vire.
  useEffect(() => {
      const inputKeys = Object.keys(inputs);
      const targetKeys = Object.keys(targets);
      
      // On cherche les cibles qui ne correspondent à aucune variable existante
      const orphans = targetKeys.filter(k => !inputKeys.includes(k));
      
      if (orphans.length > 0) {
          console.log("🧹 Nettoyage cibles orphelines :", orphans);
          const newTargets = { ...targets };
          orphans.forEach(k => delete newTargets[k]);
          onUpdate({ ...levelData, targets: newTargets });
      }
  }, [inputs, targets]); // Se lance dès que inputs ou targets changent

  // --- FONCTION DE PARSING INTELLIGENTE ---
  const smartParse = (val) => {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try { return JSON.parse(trimmed); } catch(e) { return val; }
      }
      if (trimmed.startsWith('@')) return val;
      if (trimmed === '' || trimmed.endsWith('.') || trimmed.endsWith(',')) {
        return val;
      }
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
    delete newTargets[key]; // On supprime aussi la cible associée !

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
    <div style={{padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd'}}>
      <h4 style={{marginTop: 0, color: '#2c3e50'}}>🧪 Configuration Labo</h4>
      
      <div style={{display: 'flex', flexDirection:'column', gap: '20px'}}>
        {/* VARIABLES */}
        <div>
          <h5 style={{margin:'0 0 10px 0', borderBottom:'1px solid #eee'}}>1. Variables (Mémoire)</h5>
          <div style={{display: 'flex', gap: '5px', marginBottom: '10px'}}>
            <input type="text" placeholder="Nom (x)" value={newVarName} onChange={e => setNewVarName(e.target.value)} style={{flex: 1, padding: '5px', width:'50px'}} />
            <input type="text" placeholder="Val (0)" value={newVarValue} onChange={e => setNewVarValue(e.target.value)} style={{flex: 1, padding: '5px', width:'50px'}} />
            <button onClick={addVariable} style={{cursor:'pointer', background:'#27ae60', color:'white', border:'none', borderRadius:'4px', padding:'0 10px'}}>ok</button>
          </div>

          {Object.entries(inputs).map(([key, val]) => {
            const isHidden = hiddenVars.includes(key);
            const isLocked = lockedVars.includes(key);
            let icon = '✏️';
            let bg = 'white';
            if (isLocked) { icon = '🔒'; bg='#fff3cd'; }
            if (isHidden) { icon = '👻'; bg='#eee'; }

            const inputValue = (typeof val === 'object') ? JSON.stringify(val) : val;

            return (
              <div key={key} style={{display: 'flex', alignItems: 'center', gap: '5px', marginBottom:'5px', background: bg, padding:'5px', borderRadius:'4px', border:'1px solid #ccc'}}>
                <button onClick={() => cycleState(key)} style={{border:'none', background:'none', cursor:'pointer'}}>{icon}</button>
                <span style={{fontWeight:'bold', width:'30px'}}>{key}</span>
                <span style={{color:'#888'}}>=</span>
                <input 
                    type="text" 
                    value={inputValue} 
                    onChange={(e) => updateVariableValue(key, e.target.value)}
                    style={{flex:1, border:'1px solid #ddd', borderRadius:'3px', padding:'2px'}}
                />
                <button onClick={() => removeVariable(key)} style={{color:'#e74c3c', border:'none', background:'none', cursor:'pointer'}}>×</button>
              </div>
            );
          })}
        </div>

        {/* OBJECTIFS */}
        <div>
          <h5 style={{margin:'0 0 10px 0', borderBottom:'1px solid #eee'}}>2. Objectifs (Fin)</h5>
          {Object.keys(inputs).map(key => {
            const isTarget = targets[key] !== undefined;
            const targetVal = targets[key];
            const targetDisplay = (typeof targetVal === 'object') ? JSON.stringify(targetVal) : (targetVal ?? '');

            return (
              <div key={key} style={{marginBottom: '5px', display:'flex', alignItems:'center', opacity: isTarget ? 1 : 0.5}}>
                <input type="checkbox" checked={isTarget} onChange={() => toggleTarget(key)} style={{marginRight:'8px'}} />
                <span style={{fontWeight:'bold', width:'30px'}}>{key}</span>
                {isTarget && (
                    <>
                    <span style={{marginRight:'5px'}}>=</span>
                    <input 
                        type="text" 
                        value={targetDisplay} 
                        onChange={(e) => updateTargetValue(key, e.target.value)} 
                        style={{width:'80px', padding:'2px', borderColor:'#27ae60', borderStyle:'solid', borderWidth:'1px', borderRadius:'3px'}} 
                    />
                    </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}