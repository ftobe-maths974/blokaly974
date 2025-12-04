import EquationRender from '../components/runner/EquationRender';
import { generateToolbox } from '../core/BlockDefinitions';
import nerdamer from 'nerdamer';

export const EquationPlugin = {
  id: 'EQUATION',
  RenderComponent: EquationRender,

  getToolboxXML: (allowedBlocks) => generateToolbox(allowedBlocks),

  executeStep: (currentState, action, levelData) => {
    // 1. État initial : On récupère l'option 'implicit' depuis les données du niveau
    const state = currentState || { 
      lhs: levelData.equation?.lhs || "x", 
      rhs: levelData.equation?.rhs || "0", 
      sign: levelData.equation?.sign || '=',
      implicit: levelData.equation?.implicit || false, // <--- C'est ici que ça se joue !
      history: [] 
    };

    if (!action) return { newState: state, status: 'RUNNING' };

    let { lhs, rhs } = state;

    // --- TRAITEMENT ---
    if (action.type === 'OP_BOTH') {
      const val = action.value; 
      const op = action.operator; 
      
      const rawLhs = `(${lhs}) ${op} (${val})`;
      const rawRhs = `(${rhs}) ${op} (${val})`;
      
      const simpleLhs = nerdamer(rawLhs).text(); 
      const simpleRhs = nerdamer(rawRhs).text();

      return { 
        newState: { 
          lhs: simpleLhs, 
          rhs: simpleRhs, 
          sign: state.sign,
          implicit: state.implicit, // <--- On doit absolument le copier ici pour l'étape suivante
          lastOp: { op, val, rawLhs, rawRhs } 
        },
        status: 'RUNNING'
      };
    }

    return { newState: state, status: 'RUNNING' };
  },

  checkVictory: (finalState) => {
    const cleanLhs = finalState.lhs.replace(/\s/g, '');
    const cleanRhs = finalState.rhs.replace(/\s/g, '');
    const xLeft = cleanLhs === 'x' && !isNaN(parseFloat(cleanRhs));
    const xRight = cleanRhs === 'x' && !isNaN(parseFloat(cleanLhs));
    return xLeft || xRight;
  }
};