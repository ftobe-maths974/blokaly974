import MazeRender from '../components/runner/MazeRender';
import { MAZE_CONFIG } from '../core/adapters/MazeAdapter';
import { generateToolbox } from '../core/BlockDefinitions';

export const MazePlugin = {
  id: 'MAZE',
  RenderComponent: MazeRender,

  // On laisse l'enregistrement au Core, mais on garde la fonction pour compatibilité si besoin
  registerBlocks: (Blockly, javascriptGenerator) => {
     // Les blocs sont désormais définis dans src/core/BlockRegistry.js
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

    // --- CORRECTION CRITIQUE ICI ---
    // On récupère la commande, qu'elle soit une String (vieux) ou un Objet (nouveau avec ID)
    const cmd = (typeof action === 'object' && action.type) ? action.type : action;

    if (cmd === 'MOVE') {
      let nextX = x, nextY = y;
      if (dir === 0) nextY--; else if (dir === 1) nextX++; else if (dir === 2) nextY++; else if (dir === 3) nextX--;
      
      const moveStatus = MAZE_CONFIG.checkMove(levelData.grid || MAZE_CONFIG.defaultGrid, nextX, nextY);
      if (moveStatus === 'OK' || moveStatus === 'WIN') {
        x = nextX; y = nextY;
        if (moveStatus === 'WIN') status = 'WIN';
      } else {
        status = 'LOST';
      }
    } else if (cmd && cmd.startsWith('TURN_')) {
      const side = cmd.split('_')[1];
      dir = (side === 'LEFT') ? (dir + 3) % 4 : (dir + 1) % 4;
    }

    return { newState: { x, y, dir }, status };
  }
};