export const MAZE_CONFIG = {
  defaultGrid: [
    [4, 4, 4, 4, 4, 4, 4, 4],
    [4, 2, 1, 1, 1, 1, 3, 4], // 2=Départ, 3=Arrivée
    [4, 4, 4, 4, 4, 4, 4, 4],
    [4, 4, 4, 4, 4, 4, 4, 4],
    [4, 4, 4, 4, 4, 4, 4, 4]
  ],

  THEME: {
    0: '🌿', // Vide (gazon)
    1: '⬜', // Chemin (pas japonais)
    2: '🟩', // Départ
    3: '🏁', // Arrivée
    4: '🌿', // Mur (gazon)
    5: '☠️', // Danger (franchissable mais fatal)
    PLAYER: '🐢' // Tortue
  },

  victoryDelay: 1200,
  checkMove: (grid, x, y) => {
    if (!grid || !grid[y] || typeof grid[y][x] === 'undefined') return 'WALL';
    const cell = grid[y][x];
    if (cell === 4 || cell === 0) return 'WALL';
    if (cell === 5) return 'DANGER'; // case piège : on peut y aller, mais c'est perdu
    if (cell === 3) return 'WIN';
    return 'OK';
  },

  look: (grid, x, y, currentDir, lookDir) => {
      let testDir = currentDir;
      // +1 = Droite, +3 = Gauche
      if (lookDir === 'LEFT') testDir = (currentDir + 3) % 4;
      else if (lookDir === 'RIGHT') testDir = (currentDir + 1) % 4;
      
      let tx = x, ty = y;
      // 0=Est, 1=Sud, 2=Ouest, 3=Nord
      if (testDir === 0) tx++;      
      else if (testDir === 1) ty++; 
      else if (testDir === 2) tx--; 
      else if (testDir === 3) ty--; 

      const result = MAZE_CONFIG.checkMove(grid, tx, ty);
      return result !== 'WALL'; 
  },

  // --- NOUVEAU : Redimensionnement intelligent ---
  resizeGrid: (oldGrid, newRows, newCols) => {
    const newGrid = [];
    for (let r = 0; r < newRows; r++) {
        const row = [];
        for (let c = 0; c < newCols; c++) {
            // Si la case existe on la garde, sinon on met un Mur (4)
            if (oldGrid[r] && oldGrid[r][c] !== undefined) {
                row.push(oldGrid[r][c]);
            } else {
                row.push(4);
            }
        }
        newGrid.push(row);
    }
    return newGrid;
  }
};