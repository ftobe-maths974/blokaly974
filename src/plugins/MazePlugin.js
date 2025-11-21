import MazeRender from '../components/runner/MazeRender';
import { MAZE_CONFIG } from '../core/adapters/MazeAdapter';
import { generateToolbox } from '../core/BlockDefinitions';

export const MazePlugin = {
  id: 'MAZE',
  RenderComponent: MazeRender,

  // CORRECTION : Utilisation de defineBlocksWithJsonArray (Plus robuste)
  registerBlocks: (Blockly, javascriptGenerator) => {
    
    // Définition des blocs en JSON Array (Écrase les anciennes définitions si elles existent)
    Blockly.defineBlocksWithJsonArray([
      {
        "type": "maze_move_forward",
        "message0": "Avancer ⬆️",
        "previousStatement": null,
        "nextStatement": null,
        "colour": 160,
        "tooltip": "Avance d'une case"
      },
      {
        "type": "maze_turn",
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
      }
    ]);

    // Générateurs JavaScript
    javascriptGenerator.forBlock['maze_move_forward'] = () => 'actions.push("MOVE");\n';
    
    javascriptGenerator.forBlock['maze_turn'] = (block) => {
      const dir = block.getFieldValue('DIR');
      return `actions.push("TURN_${dir}");\n`;
    };
  },

  getToolboxXML: (allowedBlocks, levelInputs, hiddenVars, lockedVars) => {
    return generateToolbox(allowedBlocks, levelInputs, hiddenVars, lockedVars);
  },

  executeStep: (currentState, action, levelData) => {
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