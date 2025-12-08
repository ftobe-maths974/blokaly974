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
    box-shadow: inset 0 0 20px rgba(0,0,0,0.02);
    display: flex;
    justify-content: center;
    align-items: center;
}
.turtle-container {
    width: 100cqmin;
    height: 100cqmin;
    position: relative;
    background: white;
}
.turtle-canvas {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
}
`;

const VIEW_SIZE = 800; 

export default function TurtleRunner({ state, playerPos, playerDir, modelLines }) {
  const canvasRef = useRef(null);
  const modelRef = useRef(null);

  // --- CORRECTION INITIALISATION ---
  // Si state.x existe, c'est que le code tourne. Sinon on prend la position de départ.
  // ?? est important pour ne pas ignorer la valeur 0.
  const x = state?.x ?? playerPos?.x ?? 0;
  const y = state?.y ?? playerPos?.y ?? 0;
  const dir = state?.dir ?? playerDir ?? 0;
  const lines = state?.lines || [];

  // Conversion Math (0,0 centre) -> Canvas (0,0 haut-gauche)
  const toCanvas = (val, isY = false) => {
      const center = VIEW_SIZE / 2;
      return isY ? center - val : center + val;
  };

  const draw = (ctx, linesToDraw, isModel = false) => {
    ctx.clearRect(0, 0, VIEW_SIZE, VIEW_SIZE);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (linesToDraw) {
        linesToDraw.forEach(l => {
            ctx.beginPath();
            ctx.strokeStyle = isModel ? '#bdc3c7' : (l.color || '#2c3e50');
            ctx.lineWidth = isModel ? 8 : 4; 
            if (isModel) {
                ctx.setLineDash([10, 10]);
                ctx.globalAlpha = 0.5;
            } else {
                ctx.setLineDash([]);
                ctx.globalAlpha = 1.0;
            }
            
            ctx.moveTo(toCanvas(l.x1), toCanvas(l.y1, true));
            ctx.lineTo(toCanvas(l.x2), toCanvas(l.y2, true));
            ctx.stroke();
        });
    }
  };

  useEffect(() => {
      if (modelRef.current && modelLines) draw(modelRef.current.getContext('2d'), modelLines, true);
  }, [modelLines]);

  useEffect(() => {
      if (canvasRef.current) draw(canvasRef.current.getContext('2d'), lines, false);
  }, [lines]);

  // Calcul position en % pour le responsive
  const getPercent = (val, isY = false) => {
      const range = VIEW_SIZE / 2; 
      const percent = (val / range) * 50; 
      return isY ? 50 - percent : 50 + percent;
  };

  return (
    <div className="turtle-wrapper">
      <style>{stylesCSS}</style>
      <div className="turtle-container">
          {/* GRILLE */}
          <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            <defs>
              <pattern id="gridLarge" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#f1f5f9" strokeWidth="2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridLarge)" />
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#e2e8f0" strokeWidth="2" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#e2e8f0" strokeWidth="2" />
          </svg>

          <canvas ref={modelRef} width={VIEW_SIZE} height={VIEW_SIZE} className="turtle-canvas" style={{zIndex: 1}} />
          <canvas ref={canvasRef} width={VIEW_SIZE} height={VIEW_SIZE} className="turtle-canvas" style={{zIndex: 2}} />

          {/* AVATAR (SVG Flèche qui pointe à Droite par défaut) */}
          <div 
            style={{
              position: 'absolute',
              left: `${getPercent(x)}%`,
              top: `${getPercent(y, true)}%`,
              width: '30px', height: '30px', 
              marginLeft: '-15px', marginTop: '-15px',
              // Note : En Canvas/CSS, Y va vers le bas. En math (Tortue), Y va vers le haut.
              // Une rotation positive (ex: 90°) en math est anti-horaire (Est -> Nord).
              // Une rotation positive en CSS est horaire.
              // Donc pour matcher : CSS Rotate = - Math Angle.
              transform: `rotate(${-dir}deg)`, 
              transformOrigin: 'center center', 
              zIndex: 10,
              transition: 'all 0.2s linear', // Animation fluide
            }}
          >
            {/* Forme : Triangle isocèle pointant à droite (Est) */}
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 12L2 2L5 12L2 22L22 12Z" fill="#2c3e50" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
      </div>
    </div>
  );
}