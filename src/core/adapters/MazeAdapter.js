export const MAZE_CONFIG = {
  // LA LIGNE MANQUANTE EST ICI VVV
  defaultGrid: [
    [4, 4, 4, 4, 4, 4, 4, 4],
    [4, 2, 1, 1, 1, 1, 3, 4],
    [4, 4, 4, 4, 4, 4, 4, 4],
    [4, 4, 4, 4, 4, 4, 4, 4],
    [4, 4, 4, 4, 4, 4, 4, 4]
  ],

  THEME: {
    0: '⬛', 1: '⬜', 2: '🏁', 3: '🏆', 4: '🧱', PLAYER: '🤖'
  },

  // RETOUR AUX CATÉGORIES (XML)
  defaultToolbox: `
    <xml id="toolbox" style="display: none">
      <category name="🏃 Actions" colour="120">
        <block type="maze_move_forward"></block>
        <block type="maze_turn">
          <field name="DIR">LEFT</field>
        </block>
        <block type="maze_turn">
          <field name="DIR">RIGHT</field>
        </block>
      </category>
      
      <category name="🔄 Boucles" colour="210">
        <block type="controls_repeat_ext">
          <value name="TIMES">
            <shadow type="math_number">
              <field name="NUM">5</field>
            </shadow>
          </value>
        </block>
      </category>
    </xml>
  `,

  checkMove: (grid, x, y) => {
    // Sécurité : si la grille n'est pas définie, on considère que c'est un mur
    if (!grid || !grid[y] || typeof grid[y][x] === 'undefined') return 'WALL';
    
    const cell = grid[y][x];
    if (cell === 4 || cell === 0) return 'WALL';
    if (cell === 3) return 'WIN';
    return 'OK';
  }
};