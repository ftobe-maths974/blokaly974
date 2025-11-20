// src/components/runner/MazeRender.jsx
import React from 'react';
import { MAZE_CONFIG } from '../../core/adapters/MazeAdapter';

export default function MazeRender({ grid, playerPos, playerDir }) {
  // Conversion direction (0,1,2,3) en rotation CSS (degrés)
  // 0: Nord, 1: Est, 2: Sud, 3: Ouest
  const rotation = playerDir * 90; 

  return (
    <div style={styles.container}>
      <div style={{
        ...styles.grid,
        gridTemplateColumns: `repeat(${grid[0].length}, 1fr)`
      }}>
        {grid.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            // Est-ce que le joueur est ici ?
            const isPlayerHere = playerPos.x === colIndex && playerPos.y === rowIndex;

            return (
              <div key={`${rowIndex}-${colIndex}`} style={styles.cell}>
                {/* Affiche le sol (Mur, Chemin...) */}
                <span style={styles.floor}>
                  {MAZE_CONFIG.THEME[cell] || '❓'}
                </span>

                {/* Affiche le joueur par dessus si présent */}
                {isPlayerHere && (
                  <div style={{...styles.player, transform: `rotate(${rotation}deg)`}}>
                    {MAZE_CONFIG.THEME.PLAYER}
                  </div>
                )}
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
}

// Petit style inline pour aller vite (on pourra mettre ça dans un CSS plus tard)
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#2c3e50',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
  },
  grid: {
    display: 'grid',
    gap: '2px',
    backgroundColor: '#34495e',
    border: '5px solid #34495e'
  },
  cell: {
    width: '40px',
    height: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '24px',
    position: 'relative',
    background: '#ecf0f1'
  },
  floor: {
    zIndex: 1
  },
  player: {
    position: 'absolute',
    zIndex: 10,
    transition: 'transform 0.2s ease, top 0.2s ease, left 0.2s ease' // Animation fluide
  }
};