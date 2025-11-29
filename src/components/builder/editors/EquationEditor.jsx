import React, { useEffect } from 'react';

export default function EquationEditor({ levelData, onUpdate }) {
  // Valeurs par défaut
  const params = levelData.equation || { a: 2, b: 4, c: 0, d: 10 };

  // --- CORRECTIF : Initialisation au démarrage ---
  useEffect(() => {
    // Si aucun bloc n'est autorisé (cas d'une création), on met les défauts
    if (!levelData.allowedBlocks || levelData.allowedBlocks.length === 0) {
       onUpdate({
         ...levelData,
         // On force l'initialisation des paramètres ET des blocs
         equation: params,
         allowedBlocks: ['equation_op_both', 'math_number']
       });
    }
  }, []); // [] = Se lance une seule fois au montage
  // -----------------------------------------------

  const updateParam = (key, val) => {
    const newParams = { ...params, [key]: parseInt(val) };
    
    // Construction des chaînes pour Nerdamer
    const lhs = `${newParams.a}*x + ${newParams.b}`;
    const rhs = `${newParams.c}*x + ${newParams.d}`;
    
    onUpdate({ 
      ...levelData, 
      equation: { ...newParams, lhs, rhs, sign: '=' },
      allowedBlocks: ['equation_op_both', 'math_number'] 
    });
  };

  return (
    <div style={{padding: '20px'}}>
      <h3 style={{color:'#2c3e50'}}>🎛️ Générateur d'Équation</h3>
      <p style={{color:'#7f8c8d', marginBottom:'20px'}}>Forme : <b>ax + b = cx + d</b></p>

      {/* Sliders */}
      {['a', 'b', 'c', 'd'].map(p => (
        <div key={p} style={{marginBottom:'15px'}}>
          <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold'}}>
            <label>{p.toUpperCase()}</label>
            <span>{params[p]}</span>
          </div>
          <input 
            type="range" min="-20" max="20" step="1"
            value={params[p]} 
            onChange={(e) => updateParam(p, e.target.value)}
            style={{width: '100%', cursor:'pointer'}}
          />
        </div>
      ))}

      {/* Aperçu */}
      <div style={{
        marginTop: '20px', padding: '15px', 
        background: '#ecf0f1', borderRadius: '8px', 
        textAlign: 'center', fontSize: '1.2rem', fontFamily: 'monospace'
      }}>
        {params.a}x {params.b >=0 ? '+' : ''}{params.b} = {params.c}x {params.d >=0 ? '+' : ''}{params.d}
      </div>
    </div>
  );
}