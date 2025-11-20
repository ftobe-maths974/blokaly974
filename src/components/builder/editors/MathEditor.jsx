import React, { useState } from 'react';

export default function MathEditor({ levelData, onUpdate }) {
  const [newVarName, setNewVarName] = useState("");
  const [newVarValue, setNewVarValue] = useState(0);
  
  const inputs = levelData.inputs || {};
  const hiddenVars = levelData.hiddenVars || []; // Liste des Fantômes
  const lockedVars = levelData.lockedVars || []; // Liste des Cadenas (Nouveau)
  const targets = levelData.targets || {};

  // --- GESTION VARIABLES ---
  const addVariable = () => {
    if (!newVarName) return;
    const newInputs = { ...inputs, [newVarName]: parseInt(newVarValue) };
    onUpdate({ ...levelData, inputs: newInputs });
    setNewVarName("");
  };

  const removeVariable = (key) => {
    const newInputs = { ...inputs };
    delete newInputs[key];
    // On nettoie aussi les listes d'états
    const newHidden = hiddenVars.filter(k => k !== key);
    const newLocked = lockedVars.filter(k => k !== key);
    onUpdate({ ...levelData, inputs: newInputs, hiddenVars: newHidden, lockedVars: newLocked });
  };

  // CYCLE DES ÉTATS : Éditable -> Verrouillé -> Fantôme -> Éditable
  const cycleState = (key) => {
    let newHidden = [...hiddenVars];
    let newLocked = [...lockedVars];

    const isHidden = hiddenVars.includes(key);
    const isLocked = lockedVars.includes(key);

    if (!isHidden && !isLocked) {
        // Était Éditable -> Devient Verrouillé
        newLocked.push(key);
    } else if (isLocked) {
        // Était Verrouillé -> Devient Fantôme
        newLocked = newLocked.filter(k => k !== key);
        newHidden.push(key);
    } else {
        // Était Fantôme -> Devient Éditable
        newHidden = newHidden.filter(k => k !== key);
    }

    onUpdate({ ...levelData, hiddenVars: newHidden, lockedVars: newLocked });
  };

  const updateVariableValue = (key, val) => {
    const newInputs = { ...inputs, [key]: parseInt(val) };
    onUpdate({ ...levelData, inputs: newInputs });
  };

  // --- GESTION OBJECTIFS ---
  const toggleTarget = (key) => {
    const newTargets = { ...targets };
    if (newTargets[key] !== undefined) delete newTargets[key];
    else newTargets[key] = inputs[key];
    onUpdate({ ...levelData, targets: newTargets });
  };

  const updateTargetValue = (key, val) => {
    const isRef = val.toString().startsWith('@');
    const newVal = isRef ? val : (isNaN(parseInt(val)) ? val : parseInt(val));
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
            <input type="number" placeholder="Val" value={newVarValue} onChange={e => setNewVarValue(e.target.value)} style={{width: '60px', padding: '5px'}} />
            <button onClick={addVariable} style={{cursor:'pointer', background:'#27ae60', color:'white', border:'none', borderRadius:'4px'}}>OK</button>
          </div>

          {Object.entries(inputs).map(([key, val]) => {
            const isHidden = hiddenVars.includes(key);
            const isLocked = lockedVars.includes(key);
            
            let icon = '✏️'; // Éditable
            let title = "Éditable (Lecture/Écriture)";
            let style = {};

            if (isLocked) { icon = '🔒'; title = "Verrouillée (Lecture seule)"; style={background:'#fff3cd'}; }
            if (isHidden) { icon = '👻'; title = "Fantôme (Invisible)"; style={background:'#eee', color:'#999'}; }

            return (
              <div key={key} style={{...style, padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <button onClick={() => cycleState(key)} title={title} style={{border:'none', background:'none', cursor:'pointer', fontSize:'1.2rem'}}>
                        {icon}
                    </button>
                    <span style={{fontWeight: 'bold'}}>{key}</span> 
                    <span>= {val}</span>
                </div>
                <button onClick={() => removeVariable(key)} style={{color:'red', border:'none', background:'none', cursor:'pointer'}}>×</button>
              </div>
            );
          })}
          <div style={{fontSize:'0.8em', color:'#666', marginTop:'10px'}}>
             Cliquez sur l'icône pour changer le mode :<br/>
             ✏️ <b>Éditable</b> : Élève total (Ardoise + Blocs)<br/>
             🔒 <b>Cadenas</b> : Lecture seule (Ardoise + Bloc Fixe)<br/>
             👻 <b>Fantôme</b> : Invisible (Pour le prof uniquement)
          </div>
        </div>

        {/* COLONNE 2 : VALIDATION (Reste inchangée) */}
        <div style={{flex: 1, borderLeft: '1px solid #ddd', paddingLeft: '20px'}}>
          <h4>2. Objectifs (Victoire)</h4>
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