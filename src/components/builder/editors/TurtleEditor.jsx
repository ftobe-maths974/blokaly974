import React from 'react';

// On réutilise les constantes de taille pour l'aperçu
const PREVIEW_SIZE = 300;

export default function TurtleEditor({ levelData, onUpdate }) {
  const startX = levelData.startPos?.x ?? 0;
  const startY = levelData.startPos?.y ?? 0;
  const startDir = levelData.startPos?.dir ?? 0;

  const updateStartPos = (field, value) => {
    const newStartPos = { 
        x: startX, 
        y: startY, 
        dir: startDir,
        ...levelData.startPos,
        [field]: parseInt(value) || 0 
    };
    onUpdate({ ...levelData, startPos: newStartPos });
  };

  // Conversion simple pour l'aperçu (échelle réduite si besoin, ici 1:1 sur une zone plus petite)
  // On centre 0,0 au milieu de la zone de preview
  const toCanvasX = (mathX) => PREVIEW_SIZE / 2 + mathX;
  const toCanvasY = (mathY) => PREVIEW_SIZE / 2 - mathY;
  
  const rotation = startDir - 90; // Même logique que le renderer principal

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
      
      {/* ZONE DE VISUALISATION (GRILLE + AVATAR) */}
      <div style={{
          width: PREVIEW_SIZE, height: PREVIEW_SIZE, 
          background: 'white', border: '1px solid #ccc', 
          borderRadius: '8px', position: 'relative', overflow: 'hidden',
          margin: '0 auto', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)'
      }}>
         {/* Grille SVG */}
         <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
            <defs>
              <pattern id="gridSmall" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridSmall)" />
            <line x1={PREVIEW_SIZE/2} y1="0" x2={PREVIEW_SIZE/2} y2={PREVIEW_SIZE} stroke="#ccc" strokeWidth="1" />
            <line x1="0" y1={PREVIEW_SIZE/2} x2={PREVIEW_SIZE} y2={PREVIEW_SIZE/2} stroke="#ccc" strokeWidth="1" />
         </svg>

         {/* AVATAR (o>) */}
         <div 
            style={{
              position: 'absolute',
              left: toCanvasX(startX),
              top: toCanvasY(startY),
              width: '40px', height: '40px',
              marginLeft: '-20px', marginTop: '-20px',
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="12" stroke="#2c3e50" strokeWidth="3" fill="rgba(255,255,255,0.8)" />
              <path d="M 34 20 L 26 15 L 26 25 Z" fill="#2c3e50" />
            </svg>
         </div>
      </div>

      {/* FORMULAIRE DE CONFIGURATION */}
      <div style={{padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee'}}>
        <h4 style={{marginTop: 0, color: '#2c3e50'}}>📍 Position de départ</h4>
        
        <div style={{marginBottom: '15px', display:'flex', gap:'10px', justifyContent:'center'}}>
            <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                <label style={{fontSize:'0.8rem', color:'#777'}}>X</label>
                <input type="number" value={startX} onChange={(e) => updateStartPos('x', e.target.value)} style={{width: '60px', padding: '5px', textAlign:'center'}} />
            </div>
            <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                <label style={{fontSize:'0.8rem', color:'#777'}}>Y</label>
                <input type="number" value={startY} onChange={(e) => updateStartPos('y', e.target.value)} style={{width: '60px', padding: '5px', textAlign:'center'}} />
            </div>
        </div>

        <div style={{marginBottom: '5px'}}>
            <label style={{display:'block', marginBottom:'5px', fontSize:'0.9rem', fontWeight:'bold', textAlign:'center'}}>
                Direction : {startDir}°
            </label>
            <input 
                type="range" min="0" max="360" step="90" 
                value={startDir} 
                onChange={(e) => updateStartPos('dir', e.target.value)} 
                style={{width: '100%', cursor:'pointer'}}
            />
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'#999'}}>
                <span>0° (Nord)</span>
                <span>90° (Est)</span>
                <span>180° (Sud)</span>
                <span>270° (Ouest)</span>
            </div>
        </div>
      </div>
    </div>
  );
}