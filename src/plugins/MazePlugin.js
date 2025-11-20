// src/plugins/MazePlugin.js
import MazeRender from '../components/runner/MazeRender';
import { MAZE_CONFIG } from '../core/adapters/MazeAdapter';

export const MazePlugin = {
  id: 'MAZE',
  
  // 1. Le Visuel à afficher à droite
  RenderComponent: MazeRender,

  // 2. Enregistrement des blocs Blockly
  registerBlocks: (Blockly, javascriptGenerator) => {
    // Bloc Avancer
    if (!Blockly.Blocks['maze_move_forward']) {
      Blockly.Blocks['maze_move_forward'] = {
        init: function() {
          this.jsonInit({
            "message0": "Avancer ⬆️",
            "previousStatement": null,
            "nextStatement": null,
            "colour": 160,
            "tooltip": "Avance d'une case"
          });
        }
      };
    }
    javascriptGenerator.forBlock['maze_move_forward'] = () => 'actions.push("MOVE");\n';

    // Bloc Tourner
    if (!Blockly.Blocks['maze_turn']) {
      Blockly.Blocks['maze_turn'] = {
        init: function() {
          this.jsonInit({
            "message0": "Tourner %1 ↪️",
            "args0": [
              {
                "type": "field_dropdown",
                "name": "DIR",
                "options": [["à gauche ↺", "LEFT"], ["à droite ↻", "RIGHT"]]
              }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 160
          });
        }
      };
    }
    javascriptGenerator.forBlock['maze_turn'] = (block) => {
      const dir = block.getFieldValue('DIR');
      return `actions.push("TURN_${dir}");\n`;
    };
  },

  // 3. Génération de la Toolbox (XML)
  getToolboxXML: (allowedBlocks) => {
    // Si pas de restrictions, on autorise tout par défaut
    const allowed = allowedBlocks || ['maze_move_forward', 'maze_turn', 'controls_repeat_ext'];
    
    let xml = '<xml id="toolbox" style="display: none">';
    
    // Catégorie Actions
    if (allowed.includes('maze_move_forward') || allowed.includes('maze_turn')) {
      xml += '<category name="🏃 Actions" colour="120">';
      if (allowed.includes('maze_move_forward')) xml += '<block type="maze_move_forward"></block>';
      if (allowed.includes('maze_turn')) {
        xml += '<block type="maze_turn"><field name="DIR">LEFT</field></block>';
        xml += '<block type="maze_turn"><field name="DIR">RIGHT</field></block>';
      }
      xml += '</category>';
    }

    // Catégorie Boucles
    if (allowed.includes('controls_repeat_ext')) {
      xml += '<category name="🔄 Boucles" colour="210">';
      xml += '<block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">5</field></shadow></value></block>';
      xml += '</category>';
    }

    xml += '</xml>';
    return xml;
  },

  // 4. Le Moteur Physique (Calcul de l'état suivant)
  updateState: (currentState, action, gridData) => {
    // On clone l'état pour ne pas modifier l'original
    let { x, y, dir } = currentState; // dir: 0:N, 1:E, 2:S, 3:O
    let status = 'RUNNING';

    if (action === 'MOVE') {
      let nextX = x;
      let nextY = y;
      
      if (dir === 0) nextY--; 
      if (dir === 1) nextX++; 
      if (dir === 2) nextY++; 
      if (dir === 3) nextX--; 

      // Vérification des collisions (On réutilise la logique existante)
      const moveStatus = MAZE_CONFIG.checkMove(gridData, nextX, nextY);
      
      if (moveStatus === 'OK' || moveStatus === 'WIN') {
        x = nextX;
        y = nextY;
        if (moveStatus === 'WIN') status = 'WIN';
      } else {
        status = 'LOST';
      }
    } 
    else if (action.startsWith('TURN_')) {
      const side = action.split('_')[1];
      if (side === 'LEFT') dir = (dir + 3) % 4;
      else dir = (dir + 1) % 4;
    }

    return { 
      playerState: { x, y, dir }, 
      status 
    };
  }
};