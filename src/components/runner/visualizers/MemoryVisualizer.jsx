import React from 'react';

export default function MemoryVisualizer({ state, history }) {
  // state = { variables: { A: 5, B: 10 }, logs: [...] }
  const variables = state?.variables || {};
  const logs = history || [];

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%', width: '100%', padding: '10px', boxSizing: 'border-box', gap: '15px', background: '#2c3e50'}}>
      
      {/* 1. LES REGISTRES (ARDOISES) */}
      <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center'}}>
        {Object.entries(variables).map(([name, value]) => (
          <div key={name} style={{
            background: 'white', borderRadius: '8px', width: '100px', height: '120px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px', boxShadow: '0 4px 0 #bdc3c7'
          }}>
            <div style={{fontWeight: 'bold', color: '#7f8c8d', borderBottom: '2px solid #eee', width: '100%', textAlign: 'center'}}>
              {name}
            </div>
            <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#2c3e50'}}>
              {value}
            </div>
            <div style={{fontSize: '0.7rem', color: '#ccc'}}>INTEGER</div>
          </div>
        ))}
        {Object.keys(variables).length === 0 && <div style={{color:'white'}}>Aucune variable initialisée</div>}
      </div>

      {/* 2. TABLEAU DE TRACE (HISTORIQUE) */}
      <div style={{flex: 1, background: '#ecf0f1', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
        <div style={{padding: '10px', background: '#bdc3c7', fontWeight: 'bold', color: '#2c3e50'}}>
          📋 Journal d'exécution (Console)
        </div>
        <div style={{flex: 1, overflowY: 'auto', padding: '10px', fontFamily: 'monospace', fontSize: '0.9rem'}}>
          {logs.map((log, i) => (
            <div key={i} style={{marginBottom: '5px', borderBottom: '1px dashed #ccc', paddingBottom: '2px'}}>
              <span style={{color: '#7f8c8d', marginRight: '10px'}}>[Étape {i+1}]</span>
              {log}
            </div>
          ))}
          <div style={{animation: 'blink 1s infinite'}}>_</div>
        </div>
      </div>

      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}