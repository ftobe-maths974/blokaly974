import React, { useEffect, useRef } from 'react';

const stylesCSS = `
.turtle-wrapper {
    width: 100%;
    height: 100%;
    container-type: size;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    box-shadow: inset 0 0 20px rgba(0,0,0,0.05);
}
.turtle-canvas {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
`;

// Dimensions virtuelles du monde tortue
const VIEW_SIZE = 400; 

export default function TurtleRunner({ state, playerPos, playerDir, modelLines }) {
  const canvasRef = useRef(null);
  const modelRef = useRef(null);

  const x = state?.x ?? 0;
  const y = state?.y ?? 0;
  const dir = state?.dir ?? 0;
  const lines = state?.lines || [];

  // Dessin générique
  const draw = (ctx, linesToDraw, isModel = false) => {
    ctx.clearRect(0, 0, VIEW_SIZE, VIEW_SIZE);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Grille de fond légère
    if (!isModel) {
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=0; i<=VIEW_SIZE; i+=50) {
            ctx.moveTo(i, 0); ctx.lineTo(i, VIEW_SIZE);
            ctx.moveTo(0, i); ctx.lineTo(VIEW_SIZE, i);
        }
        ctx.stroke();
    }

    // Lignes
    if (linesToDraw) {
        linesToDraw.forEach(l => {
            ctx.beginPath();
            ctx.strokeStyle = isModel ? '#bdc3c7' : (l.color || '#2c3e50');
            ctx.lineWidth = isModel ? 4 : 3;
            if (isModel) ctx.setLineDash([5, 5]); else ctx.setLineDash([]);
            
            // Conversion Math (0,0 au centre) vers Canvas (0,0 en haut à gauche)
            // Y Math vers le haut, Y Canvas vers le bas
            const cx = VIEW_SIZE / 2;
            const cy = VIEW_SIZE / 2;
            
            ctx.moveTo(cx + l.x1, cy - l.y1);
            ctx.lineTo(cx + l.x2, cy - l.y2);
            ctx.stroke();
        });
    }
  };

  useEffect(() => {
      if (modelRef.current && modelLines) {
          draw(modelRef.current.getContext('2d'), modelLines, true);
      }
  }, [modelLines]);

  useEffect(() => {
      if (canvasRef.current) {
          draw(canvasRef.current.getContext('2d'), lines, false);
      }
  }, [lines]);

  return (
    <div className="turtle-wrapper">
      <style>{stylesCSS}</style>
      
      {/* Canvas Modèle (Fantôme) */}
      <canvas ref={modelRef} width={VIEW_SIZE} height={VIEW_SIZE} className="turtle-canvas" style={{zIndex: 1, opacity: 0.5}} />
      
      {/* Canvas Joueur */}
      <canvas ref={canvasRef} width={VIEW_SIZE} height={VIEW_SIZE} className="turtle-canvas" style={{zIndex: 2}} />

      {/* Avatar Tortue */}
      <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          // On applique la translation X/Y + la rotation
          // Attention : Y est inversé (Math vs CSS)
          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${-y}px)) rotate(${-dir}deg)`, 
          transition: 'all 0.1s linear',
          width: '30px', height: '30px',
          zIndex: 10,
          pointerEvents: 'none'
      }}>
          <span style={{fontSize: '30px', display: 'block', transform: 'rotate(90deg)'}}>🐢</span>
      </div>
    </div>
  );
}