import React, { useState } from 'react';

export default function MathEditor({ levelData, onUpdate }) {
  // États locaux pour les champs d'ajout
  const [newVarName, setNewVarName] = useState("");
  const [newVarValue, setNewVarValue] = useState(0);
  
  const inputs = levelData.inputs || {};
  const targets = levelData.targets || {};

  // --- GESTION DES VARIABLES (INPUTS) ---
  const addVariable = () => {
    if (!newVarName) return;
    const newInputs = { ...inputs, [newVarName]: parseInt(newVarValue) };
    onUpdate({ ...levelData, inputs: newInputs });
    setNewVarName(""); // Reset champ
  };

  const removeVariable = (key) => {
    const newInputs = { ...inputs };
    delete newInputs[key];
    onUpdate({ ...levelData, inputs: newInputs });
  };

  const updateVariableValue = (key, val) => {
    const newInputs = { ...inputs, [key]: parseInt(val) };
    onUpdate({ ...levelData, inputs: newInputs });
  };

  // --- GESTION DES OBJECTIFS (TARGETS) ---
  const toggleTarget = (key) => {
    const newTargets = { ...targets };
    if (newTargets[key] !== undefined) {
      delete newTargets[key]; // On retire la condition
    } else {
      newTargets[key] = inputs[key]; // On ajoute avec la valeur actuelle par défaut
    }
    onUpdate({ ...levelData, targets: newTargets });
  };

  const updateTargetValue = (key, val) => {
    const newTargets = { ...targets, [key]: parseInt(val) };
    onUpdate({ ...levelData, targets: newTargets });
  };

  return (
    <div style={{padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '2px dashed #3498db'}}>
      <h3 style={{marginTop: 0, color: '#2c3e50'}}>🧪 Labo Algo : Configuration Avancée</h3>
      
      {/* ZONE 1 : CRÉATION DE VARIABLES */}
      <div style={{marginBottom: '30px', padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #eee'}}>
        <h4 style={{margin:'0 0 10px 0'}}>1. Déclarer les Variables</h4>
        <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
          <input 
            type="text" placeholder="Nom (ex: A, _Secret)" 
            value={newVarName} onChange={e => setNewVarName(e.target.value)}
            style={{flex: 1, padding: '8px', border:'1px solid #ccc', borderRadius:'4px'}}
          />
          <input 
            type="number" placeholder="Valeur" 
            value={newVarValue} onChange={e => setNewVarValue(e.target.value)}
            style={{width: '80px', padding: '8px', border:'1px solid #ccc', borderRadius:'4px'}}
          />
          <button onClick={addVariable} style={{background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', padding: '0 15px', cursor: 'pointer', fontWeight:'bold'}}>+</button>
        </div>

        {/* Liste des variables existantes */}
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
          {Object.entries(inputs).map(([key, val]) => (
            <div key={key} style={{background: key.startsWith('_') ? '#eee' : '#e1f5fe', padding: '5px 10px', borderRadius: '20px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <strong>{key}</strong> = 
              <input 
                type="number" value={val} 
                onChange={(e) => updateVariableValue(key, e.target.value)}
                style={{width: '50px', border:'none', background:'transparent', borderBottom:'1px solid #999', textAlign:'center'}}
              />
              <button onClick={() => removeVariable(key)} style={{background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontWeight:'bold'}}>×</button>
            </div>
          ))}
          {Object.keys(inputs).length === 0 && <small style={{color:'#999'}}>Aucune variable définie.</small>}
        </div>
        <div style={{marginTop:'5px', fontSize:'0.8rem', color:'#666'}}>
            💡 Astuce : Commencez le nom par <code>_</code> pour créer une variable cachée (ex: <code>_Solution</code>).
        </div>
      </div>

      {/* ZONE 2 : CONDITIONS DE VICTOIRE */}
      <div style={{padding: '15px', background: '#fff3e0', borderRadius: '8px', border: '1px solid #ffe0b2'}}>
        <h4 style={{margin:'0 0 10px 0', color:'#e67e22'}}>2. Conditions de Victoire (ET)</h4>
        <p style={{fontSize:'0.9rem', margin:'0 0 15px 0'}}>Cochez les variables à vérifier à la fin du programme :</p>
        
        {Object.keys(inputs).map(key => {
          const isTarget = targets[key] !== undefined;
          return (
            <div key={key} style={{marginBottom: '8px', display: 'flex', alignItems: 'center', opacity: isTarget ? 1 : 0.6}}>
              <input 
                type="checkbox" 
                checked={isTarget} 
                onChange={() => toggleTarget(key)}
                style={{transform: 'scale(1.2)', marginRight: '10px', cursor: 'pointer'}}
              />
              <span style={{fontWeight: isTarget ? 'bold' : 'normal', width: '100px'}}>{key}</span>
              
              {isTarget && (
                <>
                  <span style={{marginRight: '10px'}}>DOIT VALOIR</span>
                  <input 
                    type="number" 
                    value={targets[key]} 
                    onChange={(e) => updateTargetValue(key, e.target.value)}
                    style={{width: '70px', padding: '5px', borderColor: '#e67e22', borderRadius:'4px', border:'2px solid #e67e22'}}
                  />
                </>
              )}
            </div>
          );
        })}
        {Object.keys(inputs).length === 0 && <small>Définissez des variables d'abord.</small>}
      </div>

    </div>
  );
}