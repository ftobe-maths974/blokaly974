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
  const rotation = playerDir * 90 + 90; 

  const isScanning = lastAction && lastAction.type === 'SCAN';
  let scanTarget = null;

  // Helper normalisation (pour le radar)
  const normalizeDir = (d) => ((d % 4) + 4) % 4;

  if (isScanning) {
      // CAS 1 : Scan sur soi-même (Répéter jusqu'à Arrivée)
      if (lastAction.dir === 'SELF') {
          scanTarget = { x: playerPos.x, y: playerPos.y };
      } 
      // CAS 2 : Scan directionnel (Si chemin...)
      else {
          const currentDirNorm = normalizeDir(playerDir);
          let lookDirIdx = currentDirNorm;

          if (lastAction.dir === 'LEFT') lookDirIdx = (currentDirNorm + 3) % 4;
          if (lastAction.dir === 'RIGHT') lookDirIdx = (currentDirNorm + 1) % 4;

          let dx = 0, dy = 0;
          if (lookDirIdx === 0) dx = 1;  // Est
          if (lookDirIdx === 1) dy = 1;  // Sud
          if (lookDirIdx === 2) dx = -1; // Ouest
          if (lookDirIdx === 3) dy = -1; // Nord

          scanTarget = { x: playerPos.x + dx, y: playerPos.y + dy };
      }
  }

  return (
    <div style={styles.container}>
      <style>{stylesCSS}</style>
      <div style={{
        ...styles.grid,
        gridTemplateColumns: `repeat(${grid[0].length}, 1fr)`
      }}>
        {grid.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            const isPlayerHere = playerPos.x === colIndex && playerPos.y === rowIndex;
            const isScanned = scanTarget && scanTarget.x === colIndex && scanTarget.y === rowIndex;

            return (
              <div key={`${rowIndex}-${colIndex}`} style={styles.cell}>
                <span style={styles.floor}>
                  {MAZE_CONFIG.THEME[cell] || '❓'}
                </span>

                {isPlayerHere && (
                  <div style={{...styles.player, transform: `rotate(${rotation}deg)`}}>
                    {MAZE_CONFIG.THEME.PLAYER}
                  </div>
                )}

                {isScanned && (
                    <div key={lastAction._uid} style={pulseStyle}></div>
                )}
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
    background: '#2c3e50', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
  },
  grid: {
    display: 'grid', gap: '2px', backgroundColor: '#34495e', border: '5px solid #34495e'
  },
  cell: {
    width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center',
    fontSize: '24px', position: 'relative', background: '#ecf0f1', overflow: 'visible'
  },
  floor: { zIndex: 1 },
  player: {
    position: 'absolute', zIndex: 10, transition: 'transform 0.2s ease, top 0.2s ease, left 0.2s ease'
  }
};