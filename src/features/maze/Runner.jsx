import React from 'react';
import { MAZE_CONFIG } from './config';

const stylesCSS = `
@keyframes radarPing {
  0% { transform: scale(0.2); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}

.maze-wrapper {
    width: 100%;
    height: 100%;
    container-type: size;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #2c3e50;
    padding: 20px;
    box-sizing: border-box;
}

.maze-grid {
    display: grid;
    gap: 1px;
    background-color: #34495e;
    border: 4px solid #34495e;
    box-sizing: content-box;
    
    /* Calcul dynamique pour garder le ratio carré */
    --safe-w: calc(100cqw - 40px - 8px);
    --safe-h: calc(100cqh - 40px - 8px);
    --cell-size: min(var(--safe-w) / var(--cols), var(--safe-h) / var(--rows));
    
    width: calc(var(--cell-size) * var(--cols));
    height: calc(var(--cell-size) * var(--rows));
    
    grid-template-columns: repeat(var(--cols), 1fr);
    grid-template-rows: repeat(var(--rows), 1fr);
    
    margin: auto;
}

.maze-cell {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    background: #ecf0f1;
    overflow: visible;
}

.maze-emoji {
    z-index: 1;
    font-size: calc(var(--cell-size) * 0.7);
    line-height: 1;
    user-select: none;
    cursor: default;
}

.maze-player {
    position: absolute;
    z-index: 10;
    transition: transform 0.2s ease, top 0.2s ease, left 0.2s ease;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    font-size: calc(var(--cell-size) * 0.7);
}

.scan-pulse {
    position: absolute;
    width: 100%; 
    height: 100%;
    top: 0; 
    left: 0;
    background-color: rgba(46, 204, 113, 0.5); 
    border-radius: 50%;
    animation: radarPing 0.5s ease-out forwards;
    z-index: 5;
}
`;

export default function MazeRunner({ grid, playerPos, playerDir, lastAction }) {
  // Sécurité si la grille n'est pas encore chargée
  if (!grid || grid.length === 0) return <div>Chargement du Labyrinthe...</div>;

  const rows = grid.length;
  const cols = grid[0].length;
  
  // Conversion de la direction (0=Est, 1=Sud...) en degrés pour CSS
  // +90 car l'emoji pointe souvent vers le haut par défaut, à ajuster si besoin
  const rotation = (playerDir * 90) + 90; 

  // Logique du "Scanner" (Radar)
  const isScanning = lastAction && lastAction.type === 'SCAN';
  let scanTarget = null;
  const normalizeDir = (d) => ((d % 4) + 4) % 4;

  if (isScanning) {
      if (lastAction.dir === 'SELF') {
          scanTarget = { x: playerPos.x, y: playerPos.y };
      } else {
          const currentDirNorm = normalizeDir(playerDir);
          let lookDirIdx = currentDirNorm;
          // Logique relative (Gauche/Droite/Devant)
          if (lastAction.dir === 'LEFT') lookDirIdx = (currentDirNorm + 3) % 4;
          if (lastAction.dir === 'RIGHT') lookDirIdx = (currentDirNorm + 1) % 4;

          let dx = 0, dy = 0;
          if (lookDirIdx === 0) dx = 1;
          if (lookDirIdx === 1) dy = 1;
          if (lookDirIdx === 2) dx = -1;
          if (lookDirIdx === 3) dy = -1;
          scanTarget = { x: playerPos.x + dx, y: playerPos.y + dy };
      }
  }

  return (
    <>
      <style>{stylesCSS}</style>
      <div className="maze-wrapper">
        <div 
          className="maze-grid"
          style={{
              '--rows': rows,
              '--cols': cols,
          }}
        >
          {grid.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const isPlayerHere = playerPos.x === colIndex && playerPos.y === rowIndex;
              const isScanned = scanTarget && scanTarget.x === colIndex && scanTarget.y === rowIndex;

              return (
                <div key={`${rowIndex}-${colIndex}`} className="maze-cell">
                  {/* Décors (Mur, Départ, Arrivée) */}
                  <span className="maze-emoji">
                    {MAZE_CONFIG.THEME[cell] || ''}
                  </span>

                  {/* Joueur */}
                  {isPlayerHere && (
                    <div 
                        className="maze-player"
                        style={{ transform: `rotate(${rotation}deg)` }}
                    >
                      {MAZE_CONFIG.THEME.PLAYER}
                    </div>
                  )}

                  {/* Effet Radar */}
                  {isScanned && <div key={lastAction._uid} className="scan-pulse"></div>}
                </div>
              );
            })
          ))}
        </div>
      </div>
    </>
  );
}