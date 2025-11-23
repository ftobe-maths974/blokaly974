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

  checkMove: (grid, x, y) => {
    if (!grid || !grid[y] || typeof grid[y][x] === 'undefined') return 'WALL';
    const cell = grid[y][x];
    if (cell === 4 || cell === 0) return 'WALL';
    if (cell === 3) return 'WIN';
    return 'OK';
  },

  // --- MISE À JOUR CONVENTION (0=Est, 1=Sud, 2=Ouest, 3=Nord) ---
  look: (grid, x, y, currentDir, lookDir) => {
      let testDir = currentDir;
      
      // Gestion de la rotation relative (reste inchangée : +1 = Droite, +3 = Gauche)
      if (lookDir === 'LEFT') testDir = (currentDir + 3) % 4;
      else if (lookDir === 'RIGHT') testDir = (currentDir + 1) % 4;
      
      let tx = x, ty = y;
      
      // NOUVEAU MAPPING DIRECTIONNEL
      if (testDir === 0) tx++;      // 0 = Est  (x + 1)
      else if (testDir === 1) ty++; // 1 = Sud  (y + 1)
      else if (testDir === 2) tx--; // 2 = Ouest (x - 1)
      else if (testDir === 3) ty--; // 3 = Nord (y - 1)

      const result = MAZE_CONFIG.checkMove(grid, tx, ty);
      return result !== 'WALL'; 
  }
};