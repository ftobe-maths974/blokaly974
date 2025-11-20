export const MAZE_CONFIG = {
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
    if (!grid || y < 0 || x < 0 || y >= grid.length || x >= grid[0].length) return 'WALL';
    const cell = grid[y][x];
    if (cell === 4 || cell === 0) return 'WALL';
    if (cell === 3) return 'WIN';
    return 'OK';
  }
};
