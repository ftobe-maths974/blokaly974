import Runner from './Runner';
import { MAZE_CONFIG } from './config';

export const MazePlugin = {
  id: 'MAZE',
  RenderComponent: Runner,

  /**
   * 1. Définition des blocs et générateurs JS.
   * Doit être appelé par l'App/GameManager au chargement.
   */
  registerBlocks: (Blockly, javascriptGenerator) => {
    // Définition JSON des blocs
    const blocks = [
      {
        "type": "maze_move_forward",
        "message0": "avancer",
        "previousStatement": null,
        "nextStatement": null,
        "colour": 290,
        "tooltip": "Avance le personnage d'une case."
      },
      {
        "type": "maze_turn",
        "message0": "tourner à %1",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "DIRECTION",
            "options": [
              ["gauche", "LEFT"],
              ["droite", "RIGHT"]
            ]
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 290,
        "tooltip": "Tourne le personnage de 90 degrés."
      },
      {
        "type": "maze_if_path",
        "message0": "si chemin %1 %2",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "DIRECTION",
            "options": [
              ["devant", "AHEAD"],
              ["à gauche", "LEFT"],
              ["à droite", "RIGHT"]
            ]
          },
          {
            "type": "input_statement",
            "name": "DO"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 210,
        "tooltip": "Exécute si un chemin existe."
      },
      {
        "type": "maze_forever",
        "message0": "répéter jusqu'à l'arrivée %1 %2",
        "args0": [
          {
            "type": "input_dummy"
          },
          {
            "type": "input_statement",
            "name": "DO"
          }
        ],
        "previousStatement": null,
        "colour": 120,
        "tooltip": "Boucle jusqu'à la fin du niveau."
      }
    ];

    // Enregistrement dans Blockly
    Blockly.common.defineBlocksWithJsonArray(blocks);

    // Générateurs JavaScript
    javascriptGenerator.forBlock['maze_move_forward'] = function(block) {
      return 'moveForward();\n';
    };

    javascriptGenerator.forBlock['maze_turn'] = function(block) {
      const dir = block.getFieldValue('DIRECTION');
      return 'turn("' + dir + '");\n';
    };

    javascriptGenerator.forBlock['maze_if_path'] = function(block) {
      const dir = block.getFieldValue('DIRECTION');
      const branch = javascriptGenerator.statementToCode(block, 'DO');
      return 'if (isPath("' + dir + '")) {\n' + branch + '}\n';
    };

    javascriptGenerator.forBlock['maze_forever'] = function(block) {
      const branch = javascriptGenerator.statementToCode(block, 'DO');
      return 'while (true) {\n' + branch + '}\n';
    };
  },

  /**
   * 2. COMPATIBILITÉ XML (Pour LevelEditor)
   * Renvoie la catégorie sous forme de chaîne XML pour l'ancien système.
   */
  getToolboxXML: () => {
    return `
      <category name="Labyrinthe" colour="#5C81A6">
        <block type="maze_move_forward"></block>
        <block type="maze_turn">
            <field name="DIRECTION">LEFT</field>
        </block>
        <block type="maze_if_path">
            <field name="DIRECTION">AHEAD</field>
        </block>
        <block type="maze_forever"></block>
      </category>
    `;
  },

  /**
   * 3. Nouvelle méthode (Format JSON)
   * Gardons-la pour le futur ou si l'éditeur évolue.
   */
  getCategory: () => {
    return {
      kind: 'category',
      name: 'Labyrinthe',
      colour: '#5C81A6',
      contents: [
        { kind: 'block', type: 'maze_move_forward' },
        { kind: 'block', type: 'maze_turn' },
        { kind: 'block', type: 'maze_if_path' },
        { kind: 'block', type: 'maze_forever' }
      ]
    };
  },

  // Logique d'exécution (inchangée)
  executeStep: (currentState, action, levelData) => {
    const state = currentState || { 
      x: levelData.startPos?.x || 0, 
      y: levelData.startPos?.y || 1, 
      dir: levelData.startPos?.dir !== undefined ? levelData.startPos.dir : 1 
    };
    
    let { x, y, dir } = state;
    let status = 'RUNNING';

    const cmd = (typeof action === 'object' && action.type) ? action.type : action;
    const normalizeDir = (d) => ((d % 4) + 4) % 4;

    if (cmd === 'MOVE' || action === 'moveForward();\n') {
      let nextX = x, nextY = y;
      const effectiveDir = normalizeDir(dir);
      if (effectiveDir === 0) nextX++;      
      else if (effectiveDir === 1) nextY++; 
      else if (effectiveDir === 2) nextX--; 
      else if (effectiveDir === 3) nextY--; 
      
      const moveStatus = MAZE_CONFIG.checkMove(levelData.grid || MAZE_CONFIG.defaultGrid, nextX, nextY);
      if (moveStatus === 'OK' || moveStatus === 'WIN') {
        x = nextX; y = nextY;
        if (moveStatus === 'WIN') status = 'WIN';
      } else {
        status = 'LOST';
      }
    } else if ((cmd && cmd.startsWith('TURN_')) || (typeof action === 'string' && action.includes('turn'))) {
      let side = 'RIGHT';
      if ((cmd && cmd.includes('LEFT')) || (action && action.includes('LEFT'))) side = 'LEFT';
      dir = (side === 'LEFT') ? dir - 1 : dir + 1;
    }

    return { newState: { x, y, dir }, status };
  }
};