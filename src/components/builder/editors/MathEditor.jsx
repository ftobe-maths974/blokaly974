import React from 'react';

export default function MathEditor({ levelData, onUpdate }) {
  // Gestion des variables d'entrée
  const handleInputChange = (key, value) => {
    const currentInputs = levelData.inputs || {};
    const newInputs = { ...currentInputs, [key]: parseInt(value) || 0 };
    onUpdate({ ...levelData, inputs: newInputs });
  };

  // Gestion de l'objectif
  const handleTargetChange = (key, value) => {
    const currentTargets = levelData.targets || {};
    const newTargets = { ...currentTargets, [key]: parseInt(value) || 0 };
    onUpdate({ ...levelData, targets: newTargets });
  };

  const inputs = levelData.inputs || { "A": 5, "B": 3 };
  const targets = levelData.targets || { "Resultat": 8 };

  return (
    <div style={{padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '2px dashed #3498db'}}>
      <h3 style={{marginTop: 0, color: '#2c3e50'}}>🧪 Labo Algo : Paramètres</h3>
      
      <div style={{display: 'flex', gap: '40px'}}>
        <div style={{flex: 1}}>
          <h4>1. Variables de départ (Mémoire)</h4>
          {Object.entries(inputs).map(([key, val]) => (
            <div key={key} style={{marginBottom: '10px'}}>
              <span style={{fontWeight: 'bold'}}>{key} = </span>
              <input 
                type="number" value={val} 
                onChange={(e) => handleInputChange(key, e.target.value)}
                style={{width: '60px', padding: '5px'}}
              />
            </div>
          ))}
        </div>

        <div style={{flex: 1, borderLeft: '1px solid #ddd', paddingLeft: '20px'}}>
          <h4>2. Condition de Victoire</h4>
          {Object.entries(targets).map(([key, val]) => (
            <div key={key} style={{marginBottom: '10px'}}>
              <span style={{fontWeight: 'bold'}}>{key} == </span>
              <input 
                type="number" value={val} 
                onChange={(e) => handleTargetChange(key, e.target.value)}
                style={{width: '60px', padding: '5px', borderColor: '#27ae60'}}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}