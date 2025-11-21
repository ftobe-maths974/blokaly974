import React, { useState } from 'react';

export default function MathEditor({ levelData, onUpdate }) {
  // États locaux pour l'ajout
  const [newVarName, setNewVarName] = useState("");
  const [newVarValue, setNewVarValue] = useState(0);
  
  const inputs = levelData.inputs || {};
  const hiddenVars = levelData.hiddenVars || [];
  const lockedVars = levelData.lockedVars || [];
  const targets = levelData.targets || {};

  // Fonction utilitaire pour convertir intelligemment l'entrée
  const parseValue = (val) => {
    // Si c'est un tableau [1,2]
    if (typeof val === 'string' && val.trim().startsWith('[') && val.trim().endsWith(']')) {
        try {
            return JSON.parse(val);
        } catch (e) {
            return val; // Si invalide, on garde le texte
        }
    }
    // Si c'est un nombre
    if (!isNaN(Number(val)) && val.toString().trim() !== '') return Number(val);
    
    // Sinon texte
    return val;
  };

  const addVariable = () => {
    if (!newVarName) return;
    const newInputs = { ...inputs, [newVarName]: parseValue(newVarValue) };
    onUpdate({ ...levelData, inputs: newInputs });
    setNewVarName("");
  };

  const removeVariable = (key) => {
    const newInputs = { ...inputs };
    delete newInputs[key];
    const newHidden = hiddenVars.filter(k => k !== key);
    const newLocked = lockedVars.filter(k => k !== key);
    onUpdate({ ...levelData, inputs: newInputs, hiddenVars: newHidden, lockedVars: newLocked });
  };

  const cycleState = (key) => {
    let newHidden = [...hiddenVars];
    let newLocked = [...lockedVars];
    const isHidden = hiddenVars.includes(key);
    const isLocked = lockedVars.includes(key);

    if (!isHidden && !isLocked) {
        newLocked.push(key);
    } else if (isLocked) {
        newLocked = newLocked.filter(k => k !== key);
        newHidden.push(key);
    } else {
        newHidden = newHidden.filter(k => k !== key);
    }

    onUpdate({ ...levelData, hiddenVars: newHidden, lockedVars: newLocked });
  };

  const updateVariableValue = (key, val) => {
    const newInputs = { ...inputs, [key]: parseValue(val) };
    onUpdate({ ...levelData, inputs: newInputs });
  };

  const toggleTarget = (key) => {
    const newTargets = { ...targets };
    if (newTargets[key] !== undefined) delete newTargets[key];
    else newTargets[key] = inputs[key];
    onUpdate({ ...levelData, targets: newTargets });
  };

  const updateTargetValue = (key, val) => {
    const isRef = val.toString().startsWith('@');
    const newVal = isRef ? val : parseValue(val);
    const newTargets = { ...targets, [key]: newVal };
    onUpdate({ ...levelData, targets: newTargets });
  };

  return (
    <div style={{padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '2px dashed #3498db'}}>
      <h3 style={{marginTop: 0, color: '#2c3e50'}}>🧪 Labo Algo : Configuration</h3>
      
      <div style={{display: 'flex', gap: '40px'}}>
        {/* COLONNE 1 : MÉMOIRE */}
        <div style={{flex: 1}}>
          <h4>1. Variables</h4>
          <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
            <input type="text" placeholder="Nom" value={newVarName} onChange={e => setNewVarName(e.target.value)} style={{flex: 1, padding: '5px'}} />
            <input 
                type="text" 
                placeholder="Val ou [1,2]" 
                value={newVarValue} 
                onChange={e => setNewVarValue(e.target.value)} 
                style={{width: '80px', padding: '5px', border:'1px solid #ccc', borderRadius:'4px'}} 
            />
            <button onClick={addVariable} style={{cursor:'pointer', background:'#27ae60', color:'white', border:'none', borderRadius:'4px'}}>OK</button>
          </div>

          {Object.entries(inputs).map(([key, val]) => {
            const isHidden = hiddenVars.includes(key);
            const isLocked = lockedVars.includes(key);
            let icon = '✏️';
            let style = {};
            if (isLocked) { icon = '🔒'; style={background:'#fff3cd'}; }
            if (isHidden) { icon = '👻'; style={background:'#eee', color:'#999'}; }

            // CORRECTION ICI : Définition de displayVal
            const displayVal = Array.isArray(val) ? JSON.stringify(val) : val;

            return (
              <div key={key} style={{...style, padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <button onClick={() => cycleState(key)} style={{border:'none', background:'none', cursor:'pointer', fontSize:'1.2rem'}}>
                        {icon}
                    </button>
                    <span style={{fontWeight: 'bold'}}>{key}</span> 
                    
                    {/* Affichage Joli */}
                    <span style={{fontFamily: 'monospace', background: '#fff', padding: '2px 5px', borderRadius: '4px'}}>
                        = {displayVal}
                    </span>
                </div>
                <button onClick={() => removeVariable(key)} style={{color:'red', border:'none', background:'none', cursor:'pointer'}}>×</button>
              </div>
            );
          })}
        </div>

        {/* COLONNE 2 : VALIDATION */}
        <div style={{flex: 1, borderLeft: '1px solid #ddd', paddingLeft: '20px'}}>
          <h4>2. Objectifs</h4>
          {Object.keys(inputs).map(key => {
            const isTarget = targets[key] !== undefined;
            return (
              <div key={key} style={{marginBottom: '10px', opacity: isTarget ? 1 : 0.7}}>
                <label style={{display:'flex', alignItems:'center', cursor:'pointer'}}>
                  <input type="checkbox" checked={isTarget} onChange={() => toggleTarget(key)} style={{marginRight:'10px'}} />
                  <span style={{fontWeight:'bold', width:'80px'}}>{key}</span>
                  {isTarget && (
                    <input type="text" value={targets[key]} onChange={(e) => updateTargetValue(key, e.target.value)} style={{width:'80px', padding:'5px', borderColor:'#27ae60'}} />
                  )}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}