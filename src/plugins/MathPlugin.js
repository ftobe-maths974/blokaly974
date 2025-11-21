import MemoryVisualizer from '../components/runner/visualizers/MemoryVisualizer';
import { generateToolbox } from '../core/BlockDefinitions';

export const MathPlugin = {
  id: 'MATH',
  RenderComponent: MemoryVisualizer,

  // Plus besoin d'enregistrer les blocs ici, c'est fait dans le Core !
  registerBlocks: (Blockly, javascriptGenerator) => {
     // On laisse vide ou on mettra ici uniquement des blocs
     // EXCLUSIFS aux maths avancées si besoin plus tard.
     console.log("MathPlugin: Blocs standards utilisés.");
  },

  getToolboxXML: (allowedBlocks, levelInputs, hiddenVars, lockedVars) => {
    return generateToolbox(allowedBlocks, levelInputs, hiddenVars, lockedVars);
  },

  executeStep: (currentState, action, levelData) => {
    const state = currentState || { variables: { ...levelData.inputs }, logs: [] };
    const newVariables = { ...state.variables };
    const newLogs = [...state.logs];
    const hiddenVars = levelData.hiddenVars || [];
    const lockedVars = levelData.lockedVars || [];
    let status = 'RUNNING';

    if (action.type === 'SET') {
      if (hiddenVars.includes(action.var) || lockedVars.includes(action.var)) {
        newLogs.push(`⛔ ERREUR : ${action.var} est protégée.`);
      } else {
        newVariables[action.var] = action.val;
        
        let displayVal = action.val;
        if (Array.isArray(action.val)) displayVal = JSON.stringify(action.val);
        
        newLogs.push(`📝 ${action.var} <- ${displayVal}`);
      }
    } else if (action.type === 'PRINT') {
      newLogs.push(`🖨️ ${action.msg}`);
    }

    const targets = levelData.targets || {};
    const targetKeys = Object.keys(targets);
    if (targetKeys.length > 0) {
      const isWin = targetKeys.every(key => {
        const currentVal = newVariables[key];
        let expectedVal = targets[key];
        if (typeof expectedVal === 'string' && expectedVal.startsWith('@')) {
            expectedVal = newVariables[expectedVal.substring(1)];
        }
        
        if (Array.isArray(currentVal) || Array.isArray(expectedVal)) {
            return JSON.stringify(currentVal) === JSON.stringify(expectedVal);
        }
        // eslint-disable-next-line eqeqeq
        return currentVal == expectedVal;
      });
      if (isWin) status = 'WIN';
    }

    return { newState: { variables: newVariables, logs: newLogs }, status };
  }
};