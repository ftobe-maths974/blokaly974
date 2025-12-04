import MemoryVisualizer from '../components/runner/visualizers/MemoryVisualizer';
import { generateToolbox } from '../core/BlockDefinitions';

const checkEqual = (val1, val2) => {
  if (Array.isArray(val1) || Array.isArray(val2)) return JSON.stringify(val1) === JSON.stringify(val2);
  const s1 = String(val1).replace(',', '.').trim();
  const s2 = String(val2).replace(',', '.').trim();
  const n1 = parseFloat(s1);
  const n2 = parseFloat(s2);
  if (!isNaN(n1) && !isNaN(n2) && s1 !== '' && s2 !== '') return Math.abs(n1 - n2) < 0.000001;
  return s1 === s2;
};

export const MathPlugin = {
  id: 'MATH',
  RenderComponent: MemoryVisualizer,

  registerBlocks: () => {}, 

  getToolboxXML: (allowedBlocks, levelInputs, hiddenVars, lockedVars) => {
    return generateToolbox(allowedBlocks, levelInputs, hiddenVars, lockedVars);
  },

  executeStep: (currentState, action, levelData) => {
    const state = currentState || { variables: { ...levelData.inputs }, logs: [] };
    
    // --- FIX : Protection Time Travel ---
    if (!action) return { newState: state, status: 'RUNNING' };

    const newVariables = { ...state.variables };
    const newLogs = [...state.logs];
    const hiddenVars = levelData.hiddenVars || [];
    const lockedVars = levelData.lockedVars || [];

    if (action.type === 'SET') {
      if (hiddenVars.includes(action.var) || lockedVars.includes(action.var)) {
        newLogs.push(`⛔ ERREUR : ${action.var} est protégée.`);
      } else {
        console.log(`[MathPlugin] SET ${action.var} =`, action.val);
        newVariables[action.var] = action.val;
        let displayVal = action.val;
        if (Array.isArray(action.val)) displayVal = JSON.stringify(action.val);
        newLogs.push(`📝 ${action.var} <- ${displayVal}`);
      }
    } else if (action.type === 'PRINT') {
      newLogs.push(`🖨️ ${action.msg}`);
    }

    return { newState: { variables: newVariables, logs: newLogs }, status: 'RUNNING' };
  },

  checkVictory: (finalState, levelData) => {
      const targets = levelData.targets || {};
      const targetKeys = Object.keys(targets);
      const variables = finalState?.variables || {};
      
      if (targetKeys.length === 0) return false; 

      const results = targetKeys.map(key => {
          const currentVal = variables[key];
          let expectedVal = targets[key];
          if (typeof expectedVal === 'string' && expectedVal.startsWith('@')) {
              const refVar = expectedVal.substring(1);
              if (levelData.inputs && levelData.inputs[refVar] !== undefined) {
                  expectedVal = levelData.inputs[refVar];
              }
          }
          return checkEqual(currentVal, expectedVal);
      });

      return results.every(r => r === true);
  }
};