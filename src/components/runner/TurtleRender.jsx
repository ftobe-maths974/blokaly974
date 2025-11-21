import React, { useEffect, useRef } from 'react';

const WIDTH = 400;
const HEIGHT = 400;

export default function TurtleRender({ state, playerPos, playerDir, modelLines }) {
  const canvasRef = useRef(null);
  const modelCanvasRef = useRef(null);

  // SÉCURITÉ ULTIME : On nettoie les entrées pour éviter le NaN
  const rawX = state?.x !== undefined ? state.x : playerPos?.x;
  const rawY = state?.y !== undefined ? state.y : playerPos?.y;
  const rawDir = state?.dir !== undefined ? state.dir : playerDir;

  const x = Number.isFinite(Number(rawX)) ? Number(rawX) : 0;
  const y = Number.isFinite(Number(rawY)) ? Number(rawY) : 0;
  const dir = Number.isFinite(Number(rawDir)) ? Number(rawDir) : 0;
  
  const lines = state?.lines || [];

  const toCanvasX = (mathX) => WIDTH / 2 + mathX;
  const toCanvasY = (mathY) => HEIGHT / 2 - mathY;

  const drawLines = (ctx, linesToDraw, overrideColor = null) => {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (linesToDraw) {
      linesToDraw.forEach(line => {
        ctx.beginPath();
        ctx.strokeStyle = overrideColor || line.color || '#2c3e50';
        ctx.lineWidth = overrideColor ? 4 : (line.width || 2);
        if (overrideColor) ctx.globalAlpha = 0.3;
        
        ctx.moveTo(toCanvasX(line.x1), toCanvasY(line.y1));
        ctx.lineTo(toCanvasX(line.x2), toCanvasY(line.y2));
        ctx.stroke();
        
        if (overrideColor) ctx.globalAlpha = 1.0;
      });
    }
  };

  // Dessin Modèle (Ghost)
  useEffect(() => {
    if (modelCanvasRef.current && modelLines) {
        const ctx = modelCanvasRef.current.getContext('2d');
        drawLines(ctx, modelLines, '#95a5a6'); 
    }
  }, [modelLines]);

  // Dessin Joueur
  useEffect(() => {
    if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        drawLines(ctx, lines);
    }
  }, [lines]);

  const rotation = -dir; 

  return (
    <div style={{ position: 'relative', width: WIDTH, height: HEIGHT, background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
      
      {/* GRILLE */}
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <line x1={WIDTH/2} y1="0" x2={WIDTH/2} y2={HEIGHT} stroke="#e0e0e0" strokeWidth="2" />
        <line x1="0" y1={HEIGHT/2} x2={WIDTH} y2={HEIGHT/2} stroke="#e0e0e0" strokeWidth="2" />
      </svg>

      {/* MODELE */}
      <canvas ref={modelCanvasRef} width={WIDTH} height={HEIGHT} style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, pointerEvents: 'none' }} />

      {/* DESSIN */}
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} style={{ position: 'absolute', top: 0, left: 0, zIndex: 3 }} />

      {/* AVATAR */}
      <div 
        style={{
          position: 'absolute',
          left: toCanvasX(x),
          top: toCanvasY(y),
          width: '40px', height: '40px',
          marginLeft: '-20px', marginTop: '-20px',
          fontSize: '30px',
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center center', 
          zIndex: 4,
          transition: 'all 0.1s linear', 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        🐢
      </div>
    </div>
  );
}