import React from 'react';
import { MAZE_CONFIG } from '../../core/adapters/MazeAdapter';

// CSS Animation pour le scan (Pulse)
const pulseStyle = {
  position: 'absolute',
  width: '100%', height: '100%',
  top: 0, left: 0,
  backgroundColor: 'rgba(46, 204, 113, 0.5)', // Vert semi-transparent
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
  // Conversion direction joueur
  const rotation = playerDir * 90; 

  // Est-ce qu'on est en train de scanner ?
  // lastAction contient { type: "SCAN", dir: "LEFT" ... }
  const isScanning = lastAction && lastAction.type === 'SCAN';
  let scanTarget = null;

  if (isScanning) {
      // Calculer quelle case est scannée
      // dir = AHEAD, LEFT, RIGHT
      // playerDir = 0(N), 1(E), 2(S), 3(W)
      let lookDirIdx = playerDir;
      if (lastAction.dir === 'LEFT') lookDirIdx = (playerDir + 3) % 4;
      if (lastAction.dir === 'RIGHT') lookDirIdx = (playerDir + 1) % 4;

      // Coordonnées relatives
      let dx = 0, dy = 0;
      if (lookDirIdx === 0) dy = -1;
      if (lookDirIdx === 1) dx = 1;
      if (lookDirIdx === 2) dy = 1;
      if (lookDirIdx === 3) dx = -1;

      scanTarget = { x: playerPos.x + dx, y: playerPos.y + dy };
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
            
            // Est-ce que cette case est celle qu'on scanne ?
            const isScanned = scanTarget && scanTarget.x === colIndex && scanTarget.y === rowIndex;

            return (
              <div key={`${rowIndex}-${colIndex}`} style={styles.cell}>
                <span style={styles.floor}>
                  {MAZE_CONFIG.THEME[cell] || '❓'}
                </span>

                {/* Robot */}
                {isPlayerHere && (
                  <div style={{...styles.player, transform: `rotate(${rotation}deg)`}}>
                    {MAZE_CONFIG.THEME.PLAYER}
                    {/* Si on scanne "AHEAD" (tout droit) ou "SELF", on peut mettre l'anim ici aussi */}
                  </div>
                )}

                {/* Animation Radar sur la case visée */}
                {isScanned && (
                    <div 
                        key={lastAction._uid} // <--- LE SECRET EST ICI
                        style={pulseStyle}
                    ></div>
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
    fontSize: '24px', position: 'relative', background: '#ecf0f1', overflow: 'visible' // Important pour que l'onde dépasse un peu
  },
  floor: { zIndex: 1 },
  player: {
    position: 'absolute', zIndex: 10, transition: 'transform 0.2s ease, top 0.2s ease, left 0.2s ease'
  }
};