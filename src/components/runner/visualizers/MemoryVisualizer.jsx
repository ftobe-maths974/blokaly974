import React from 'react';

export default function MemoryVisualizer({ state, history }) {
  const variables = state?.variables || {};
  const logs = history || [];

  // FILTRE : On cache les variables qui commencent par "_"
  const visibleVariables = Object.entries(variables).filter(([name]) => !name.startsWith('_'));

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%', width: '100%', padding: '10px', boxSizing: 'border-box', gap: '15px', background: '#2c3e50'}}>
      
      {/* ARDOISES (Variables Publiques) */}
      <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'flex-start', minHeight: '130px'}}>
        {visibleVariables.map(([name, value]) => (
          <div key={name} style={{
            background: 'white', borderRadius: '8px', width: '100px', height: '120px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px', boxShadow: '0 4px 0 #bdc3c7', animation: 'popIn 0.3s'
          }}>
            <div style={{fontWeight: 'bold', color: '#7f8c8d', borderBottom: '2px solid #eee', width: '100%', textAlign: 'center', overflow:'hidden', textOverflow:'ellipsis'}}>
              {name}
            </div>
            <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50'}}>
              {value}
            </div>
            <div style={{fontSize: '0.6rem', color: '#ccc', textTransform:'uppercase'}}>
              {typeof value}
            </div>
          </div>
        ))}
        {visibleVariables.length === 0 && (
           <div style={{color:'rgba(255,255,255,0.5)', fontStyle:'italic', marginTop:'20px'}}>
             Mémoire vide ou cachée...
           </div>
        )}
      </div>

      {/* CONSOLE */}
      <div style={{flex: 1, background: '#ecf0f1', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
        <div style={{padding: '8px 15px', background: '#bdc3c7', fontWeight: 'bold', color: '#2c3e50', fontSize: '0.9rem', borderBottom: '1px solid #95a5a6'}}>
          >_ Terminal / Historique
        </div>
        <div style={{flex: 1, overflowY: 'auto', padding: '10px', fontFamily: 'monospace', fontSize: '0.9rem', background:'#222', color:'#2ecc71'}}>
          {logs.map((log, i) => (
            <div key={i} style={{marginBottom: '4px'}}>
              <span style={{color: '#555', marginRight: '10px'}}>{i+1}.</span>
              {log}
            </div>
          ))}
          <div style={{animation: 'blink 1s infinite', display:'inline-block'}}>▋</div>
        </div>
      </div>
      <style>{`@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } } @keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}