import React from 'react';
import { MAZE_CONFIG } from '../../core/adapters/MazeAdapter';

const pulseStyle = {
  position: 'absolute',
  width: '100%', height: '100%',
  top: 0, left: 0,
  backgroundColor: 'rgba(46, 204, 113, 0.5)', 
  borderRadius: '50%',
  animation: 'radarPing 0.5s ease-out forwards',
  zIndex: 5
};

const stylesCSS = `
@keyframes radarPing {
  0% { transform: scale(0.2); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}
`;

export default function MazeRender({ grid, playerPos, playerDir, lastAction }) {
  // Rotation visuelle (+90 car robot pointe au Nord)
  const rotation = playerDir * 90 + 90; 
  const rows = grid.length;
  const cols = grid[0].length;

  const isScanning = lastAction && lastAction.type === 'SCAN';
  let scanTarget = null;
  
  // Helper normalisation
  const normalizeDir = (d) => ((d % 4) + 4) % 4;

  if (isScanning) {
      if (lastAction.dir === 'SELF') {
          scanTarget = { x: playerPos.x, y: playerPos.y };
      } else {
          const currentDirNorm = normalizeDir(playerDir);
          let lookDirIdx = currentDirNorm;
          if (lastAction.dir === 'LEFT') lookDirIdx = (currentDirNorm + 3) % 4;
          if (lastAction.dir === 'RIGHT') lookDirIdx = (currentDirNorm + 1) % 4;

          let dx = 0, dy = 0;
          // 0=Est, 1=Sud, 2=Ouest, 3=Nord
          if (lookDirIdx === 0) dx = 1;
          if (lookDirIdx === 1) dy = 1;
          if (lookDirIdx === 2) dx = -1;
          if (lookDirIdx === 3) dy = -1;
          scanTarget = { x: playerPos.x + dx, y: playerPos.y + dy };
      }
  }

  return (
    <div style={styles.container}>
      <style>{stylesCSS}</style>
      <div 
        style={{
            ...styles.grid,
            // Responsive Grid Layout
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            // RATIO 1:1 STRICT
            aspectRatio: `${cols} / ${rows}`,
        }}
      >
        {grid.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            const isPlayerHere = playerPos.x === colIndex && playerPos.y === rowIndex;
            const isScanned = scanTarget && scanTarget.x === colIndex && scanTarget.y === rowIndex;

            // Calcul dynamique de la taille de police
            // On utilise vmin pour s'adapter à la plus petite dimension de l'écran
            // 60 / max(L,H) permet d'avoir une taille correcte que ce soit 5x5 ou 50x50
            const fontSize = `min(40px, ${60/Math.max(rows,cols)}vmin)`;

            return (
              <div key={`${rowIndex}-${colIndex}`} style={styles.cell}>
                <span style={{zIndex: 1, fontSize}}>
                  {MAZE_CONFIG.THEME[cell] || '❓'}
                </span>

                {isPlayerHere && (
                  <div style={{
                      ...styles.player, 
                      transform: `rotate(${rotation}deg)`,
                      fontSize
                  }}>
                    {MAZE_CONFIG.THEME.PLAYER}
                  </div>
                )}

                {isScanned && <div key={lastAction._uid} style={pulseStyle}></div>}
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    background: '#2c3e50', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    width: '100%', height: '100%', overflow: 'hidden'
  },
  grid: {
    display: 'grid', gap: '1px', backgroundColor: '#34495e', border: '4px solid #34495e',
    // Ces 4 lignes garantissent que la grille prend toute la place 
    // MAIS respecte son aspect-ratio (défini dans le JSX)
    width: 'auto', height: 'auto', 
    maxWidth: '100%', maxHeight: '100%',
    margin: 'auto' 
  },
  cell: {
    width: '100%', height: '100%', 
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    position: 'relative', background: '#ecf0f1', overflow: 'visible'
  },
  player: {
    position: 'absolute', zIndex: 10, transition: 'transform 0.2s ease, top 0.2s ease, left 0.2s ease',
    display:'flex', justifyContent:'center', alignItems:'center', width:'100%', height:'100%'
  }
};