import React, { useEffect, useRef } from 'react';

// On garde le style "Container Query" pour le responsive, mais on remet le design soigné
const stylesCSS = `
.turtle-wrapper {
    width: 100%;
    height: 100%;
    container-type: size;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    display: flex;
    justify-content: center;
    align-items: center;
}

.turtle-container {
    /* On garde un ratio carré mais on remplit l'espace */
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

// Taille virtuelle interne (pour la netteté du dessin)
const VIEW_SIZE = 800; 

export default function TurtleRunner({ state, playerPos, playerDir, modelLines }) {
  const canvasRef = useRef(null);
  const modelRef = useRef(null);

  // Valeurs par défaut sécurisées
  const x = state?.x ?? 0;
  const y = state?.y ?? 0;
  const dir = state?.dir ?? 0;
  const lines = state?.lines || [];

  // Fonction de conversion : Monde (0,0 au centre) -> Canvas (0,0 en haut à gauche)
  const toCanvas = (val, isY = false) => {
      const center = VIEW_SIZE / 2;
      // Pour Y, on inverse (le haut est négatif en canvas, positif en maths)
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
            // Traits plus épais car VIEW_SIZE est grand (800px)
            ctx.lineWidth = isModel ? 8 : 6; 
            if (isModel) ctx.globalAlpha = 0.5;
            
            ctx.moveTo(toCanvas(l.x1), toCanvas(l.y1, true));
            ctx.lineTo(toCanvas(l.x2), toCanvas(l.y2, true));
            ctx.stroke();
            
            ctx.globalAlpha = 1.0;
        });
    }
  };

  // Redessiner si le modèle change
  useEffect(() => {
      if (modelRef.current && modelLines) {
          draw(modelRef.current.getContext('2d'), modelLines, true);
      }
  }, [modelLines]);

  // Redessiner si les lignes du joueur changent
  useEffect(() => {
      if (canvasRef.current) {
          draw(canvasRef.current.getContext('2d'), lines, false);
      }
  }, [lines]);

  // L'avatar suit la position (en %)
  // x=0 -> 50%, x=200 -> 100% (si VIEW_SIZE/2 = 400)
  // On utilise des pourcentages pour que ça colle parfaitement au responsive CSS
  const getPercent = (val, isY = false) => {
      const range = VIEW_SIZE / 2; // ex: 400
      const percent = (val / range) * 50; // -400 -> -50%, 400 -> 50%
      return isY ? 50 - percent : 50 + percent;
  };

  return (
    <div className="turtle-wrapper">
      <style>{stylesCSS}</style>
      
      <div className="turtle-container">
          {/* GRILLE DECORATIVE (SVG) */}
          <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }}>
            <defs>
              <pattern id="gridLarge" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e2e8f0" strokeWidth="2"/>
              </pattern>
              <pattern id="gridSmall" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridSmall)" />
            <rect width="100%" height="100%" fill="url(#gridLarge)" />
            {/* Axes */}
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#cbd5e1" strokeWidth="2" />
          </svg>

          {/* Calque Modèle */}
          <canvas ref={modelRef} width={VIEW_SIZE} height={VIEW_SIZE} className="turtle-canvas" style={{zIndex: 1}} />
          
          {/* Calque Dessin */}
          <canvas ref={canvasRef} width={VIEW_SIZE} height={VIEW_SIZE} className="turtle-canvas" style={{zIndex: 2}} />

          {/* AVATAR */}
          <div 
            style={{
              position: 'absolute',
              left: `${getPercent(x)}%`,
              top: `${getPercent(y, true)}%`,
              width: '40px', height: '40px', 
              marginLeft: '-20px', marginTop: '-20px', // Centrage
              transform: `rotate(${-dir}deg)`, // Rotation (sens anti-horaire vs CSS)
              transformOrigin: 'center center', 
              zIndex: 10,
              transition: 'all 0.1s linear',
              pointerEvents: 'none'
            }}
          >
            {/* Le SVG original de la tortue (ou flèche) */}
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%', height:'100%', dropShadow: '0 2px 4px rgba(0,0,0,0.2)'}}>
              <circle cx="20" cy="20" r="14" stroke="#2c3e50" strokeWidth="3" fill="rgba(255,255,255,0.9)" />
              <path d="M 34 20 L 24 14 L 24 26 Z" fill="#2c3e50" />
            </svg>
          </div>
      </div>
    </div>
  );
}