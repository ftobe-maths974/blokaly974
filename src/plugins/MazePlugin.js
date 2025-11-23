import MazeRender from '../components/runner/MazeRender';
import { MAZE_CONFIG } from '../core/adapters/MazeAdapter';
import { generateToolbox } from '../core/BlockDefinitions';

export const MazePlugin = {
  id: 'MAZE',
  RenderComponent: MazeRender,

  registerBlocks: (Blockly, javascriptGenerator) => {},

  getToolboxXML: (allowedBlocks, levelInputs, hiddenVars, lockedVars) => {
    return generateToolbox(allowedBlocks, levelInputs, hiddenVars, lockedVars);
  },

  executeStep: (currentState, action, levelData) => {
    const state = currentState || { 
      x: levelData.startPos?.x || 0, 
      y: levelData.startPos?.y || 1, 
      dir: levelData.startPos?.dir !== undefined ? levelData.startPos.dir : 0 
    };
    
    let { x, y, dir } = state;
    let status = 'RUNNING';

    const cmd = (typeof action === 'object' && action.type) ? action.type : action;

    // Helper pour normaliser la direction (gère les négatifs correctement)
    const normalizeDir = (d) => ((d % 4) + 4) % 4;

    if (cmd === 'MOVE') {
      let nextX = x, nextY = y;
      
      // On normalise juste pour savoir dans quelle direction on bouge (0, 1, 2, 3)
      const effectiveDir = normalizeDir(dir);

      // MAPPING 0=Est, 1=Sud, 2=Ouest, 3=Nord
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
    } else if (cmd && cmd.startsWith('TURN_')) {
      const side = cmd.split('_')[1];
      // ICI : On ne fait plus de modulo ! On laisse le chiffre monter ou descendre.
      // Ex: 0 -> -1 (Nord). CSS fera une rotation de 0° à -90° (gauche, court chemin).
      dir = (side === 'LEFT') ? dir - 1 : dir + 1;
    }

    return { newState: { x, y, dir }, status };
  }
};