import React, { useState, useEffect, useRef } from 'react';
import { MAZE_CONFIG } from './config';
import MazeCompass, { COMPASS_CSS } from './MazeCompass';

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
    background: #1e3a2b;
    padding: 20px;
    box-sizing: border-box;
}

.maze-grid {
    display: grid;
    gap: 0;
    border: 6px solid #5d4037;
    border-radius: 6px;
    box-sizing: content-box;
    box-shadow: 0 10px 25px rgba(0,0,0,0.35);

    /* Calcul dynamique pour garder le ratio carré */
    --safe-w: calc(100cqw - 40px - 12px);
    --safe-h: calc(100cqh - 40px - 12px);
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
    overflow: visible;
}

/* GAZON : pelouse tondue (deux verts en damier) */
.cell-grass-a { background: #6ab04c; }
.cell-grass-b { background: #61a346; }

/* PAS JAPONAIS : pierre plate posée sur le gazon.
   position:absolute → tuile de FOND : ne pousse plus ses voisins (drapeau),
   reste centrée. Le drapeau/robot se superposent au lieu de se partager la ligne. */
.stepping-stone {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 82%;
    height: 82%;
    background: radial-gradient(circle at 35% 30%, #cfc9bd 0%, #b3aa9b 70%, #a39888 100%);
    border-radius: 46% 54% 50% 50% / 52% 48% 52% 48%;
    box-shadow: inset -2px -2px 4px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.25);
    z-index: 1;
}

.maze-emoji {
    position: relative; /* reste centré par le flex de la cellule, MAIS au-dessus de la dalle */
    z-index: 2;
    font-size: calc(var(--cell-size) * 0.62);
    line-height: 1;
    user-select: none;
    cursor: default;
    filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));
}

/* Boussole « soleil opale » : voir le composant partagé MazeCompass (COMPASS_CSS). */

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

// Cases « praticables » (un pas japonais y est posé)
const isStone = (cell) => cell === 1 || cell === 2 || cell === 3;

export default function MazeRunner({ grid, playerPos, playerDir, lastAction }) {
  // --- Orientation du marqueur (flèche), en vue de dessus ---
  // Flèche pointe vers le haut (= Nord) par défaut. dir : 0=Est,1=Sud,2=Ouest,3=Nord.
  // angle « cible » sens horaire depuis le nord : E=90, S=180, O=270, N=0.
  // On ACCUMULE l'angle (toujours ±90 le plus court) pour éviter le tour à l'envers.
  const angleFor = (d) => ((d + 1) % 4) * 90;
  const [rotation, setRotation] = useState(angleFor(playerDir || 0));
  const prevDir = useRef(playerDir || 0);
  useEffect(() => {
    let delta = (((playerDir - prevDir.current) % 4) + 4) % 4; // 0..3
    if (delta === 3) delta = -1; // un quart de tour à gauche = chemin le plus court
    setRotation((r) => r + delta * 90);
    prevDir.current = playerDir;
  }, [playerDir]);

  if (!grid || grid.length === 0) return <div>Chargement du jardin...</div>;

  const rows = grid.length;
  const cols = grid[0].length;

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
      <style>{stylesCSS + COMPASS_CSS}</style>
      <div className="maze-wrapper">
        <div className="maze-grid" style={{ '--rows': rows, '--cols': cols }}>
          {grid.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              const isPlayerHere = playerPos.x === colIndex && playerPos.y === rowIndex;
              const isScanned = scanTarget && scanTarget.x === colIndex && scanTarget.y === rowIndex;
              const grassClass = (rowIndex + colIndex) % 2 === 0 ? 'cell-grass-a' : 'cell-grass-b';

              return (
                <div key={`${rowIndex}-${colIndex}`} className={`maze-cell ${grassClass}`}>
                  {/* Pas japonais (chemin / départ / arrivée) */}
                  {isStone(cell) && <div className="stepping-stone" />}

                  {/* Drapeau d'arrivée */}
                  {cell === 3 && <span className="maze-emoji">🏁</span>}

                  {/* Marqueur boussole orienté (vue de dessus) — composant partagé */}
                  {isPlayerHere && <MazeCompass rotation={rotation} />}

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
