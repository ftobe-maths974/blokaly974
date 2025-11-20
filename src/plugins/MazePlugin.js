import MazeRender from '../components/runner/MazeRender';
import { MAZE_CONFIG } from '../core/adapters/MazeAdapter';

export const MazePlugin = {
  id: 'MAZE',
  RenderComponent: MazeRender,

  // Définition des blocs spécifiques au Labyrinthe
  registerBlocks: (Blockly, javascriptGenerator) => {
    // Bloc Avancer
    if (!Blockly.Blocks['maze_move_forward']) {
      Blockly.Blocks['maze_move_forward'] = {
        init: function() {
          this.jsonInit({ "message0": "Avancer ⬆️", "previousStatement": null, "nextStatement": null, "colour": 160 });
        }
      };
    }
    javascriptGenerator.forBlock['maze_move_forward'] = () => 'actions.push("MOVE");\n';

    // Bloc Tourner
    if (!Blockly.Blocks['maze_turn']) {
      Blockly.Blocks['maze_turn'] = {
        init: function() {
          this.jsonInit({ "message0": "Tourner %1 ↪️", "args0": [{ "type": "field_dropdown", "name": "DIR", "options": [["à gauche ↺", "LEFT"], ["à droite ↻", "RIGHT"]] }], "previousStatement": null, "nextStatement": null, "colour": 160 });
        }
      };
    }
    javascriptGenerator.forBlock['maze_turn'] = (block) => {
      const dir = block.getFieldValue('DIR');
      return `actions.push("TURN_${dir}");\n`;
    };
  },

  // Génération de la Toolbox
  getToolboxXML: (allowedBlocks) => {
    const allowed = allowedBlocks || ['maze_move_forward', 'maze_turn', 'controls_repeat_ext'];
    let xml = '<xml id="toolbox" style="display: none">';
    
    if (allowed.includes('maze_move_forward') || allowed.includes('maze_turn')) {
      xml += '<category name="🏃 Actions" colour="120">';
      if (allowed.includes('maze_move_forward')) xml += '<block type="maze_move_forward"></block>';
      if (allowed.includes('maze_turn')) {
        xml += '<block type="maze_turn"><field name="DIR">LEFT</field></block>';
        xml += '<block type="maze_turn"><field name="DIR">RIGHT</field></block>';
      }
      xml += '</category>';
    }
    if (allowed.includes('controls_repeat_ext')) {
      xml += '<category name="🔄 Boucles" colour="210"><block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">5</field></shadow></value></block></category>';
    }
    xml += '</xml>';
    return xml;
  },

  // Logique d'exécution (Physique)
  executeStep: (currentState, action, levelData) => {
    // État initial par défaut
    const state = currentState || { 
      x: levelData.startPos?.x || 0, 
      y: levelData.startPos?.y || 1, 
      dir: 1 
    };
    
    let { x, y, dir } = state;
    let status = 'RUNNING';

    if (action === 'MOVE') {
      let nextX = x, nextY = y;
      if (dir === 0) nextY--; else if (dir === 1) nextX++; else if (dir === 2) nextY++; else if (dir === 3) nextX--;
      
      const moveStatus = MAZE_CONFIG.checkMove(levelData.grid || MAZE_CONFIG.defaultGrid, nextX, nextY);
      if (moveStatus === 'OK' || moveStatus === 'WIN') {
        x = nextX; y = nextY;
        if (moveStatus === 'WIN') status = 'WIN';
      } else {
        status = 'LOST';
      }
    } else if (action.startsWith('TURN_')) {
      const side = action.split('_')[1];
      dir = (side === 'LEFT') ? (dir + 3) % 4 : (dir + 1) % 4;
    }

    return { newState: { x, y, dir }, status };
  }
};