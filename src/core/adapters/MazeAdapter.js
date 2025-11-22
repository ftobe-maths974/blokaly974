export const MAZE_CONFIG = {
  defaultGrid: [
    [4, 4, 4, 4, 4, 4, 4, 4],
    [4, 2, 1, 1, 1, 1, 3, 4], // 2=Départ, 3=Arrivée
    [4, 4, 4, 4, 4, 4, 4, 4],
    [4, 4, 4, 4, 4, 4, 4, 4],
    [4, 4, 4, 4, 4, 4, 4, 4]
  ],

  THEME: {
    0: '⬛', // Vide (Noir)
    1: '⬜', // Chemin (Blanc)
    2: '🟩', // Départ (Sol Vert) -> Le Robot sera posé dessus
    3: '🏁', // Arrivée (Drapeau) - Plus logique que la coupe
    4: '🧱', // Mur (Brique)
    PLAYER: '🤖' // Robot
  },

  // ... (Garde le reste : checkMove, look) ...
  
  checkMove: (grid, x, y) => {
    if (!grid || !grid[y] || typeof grid[y][x] === 'undefined') return 'WALL';
    const cell = grid[y][x];
    if (cell === 4 || cell === 0) return 'WALL';
    if (cell === 3) return 'WIN';
    return 'OK';
  },

  look: (grid, x, y, currentDir, lookDir) => {
      let testDir = currentDir;
      if (lookDir === 'LEFT') testDir = (currentDir + 3) % 4;
      else if (lookDir === 'RIGHT') testDir = (currentDir + 1) % 4;
      
      let tx = x, ty = y;
      if (testDir === 0) ty--; // Nord
      else if (testDir === 1) tx++; // Est
      else if (testDir === 2) ty++; // Sud
      else if (testDir === 3) tx--; // Ouest

      const result = MAZE_CONFIG.checkMove(grid, tx, ty);
      return result !== 'WALL'; 
  }
};