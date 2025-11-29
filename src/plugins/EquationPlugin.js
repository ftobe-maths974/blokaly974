import EquationRender from '../components/runner/EquationRender';
import { generateToolbox } from '../core/BlockDefinitions';
import nerdamer from 'nerdamer';

export const EquationPlugin = {
  id: 'EQUATION',
  RenderComponent: EquationRender,

  getToolboxXML: (allowedBlocks) => generateToolbox(allowedBlocks),

  // Initialisation du niveau
  executeStep: (currentState, action, levelData) => {
    // État initial par défaut
    const state = currentState || { 
      lhs: levelData.equation?.lhs || "x", 
      rhs: levelData.equation?.rhs || "0", 
      sign: levelData.equation?.sign || '=',
      history: [] // Pour garder une trace si besoin
    };

    // Si c'est juste l'initialisation, on retourne l'état tel quel
    if (!action) return { newState: state, status: 'RUNNING' };

    let { lhs, rhs } = state;

    // --- GESTION DES ACTIONS (BLOCS) ---
    if (action.type === 'OP_BOTH') {
      const val = action.value; 
      const op = action.operator; // +, -, *, /
      
      // 1. Construction de l'expression brute (ex: "(2x+3) - 3")
      const rawLhs = `(${lhs}) ${op} (${val})`;
      const rawRhs = `(${rhs}) ${op} (${val})`;
      
      // 2. Simplification via Nerdamer
      // On utilise .text() pour récupérer la version string simplifiée
      // Note: nerdamer gère très bien les fractions et les x
      const simpleLhs = nerdamer(rawLhs).text(); 
      const simpleRhs = nerdamer(rawRhs).text();

      return { 
        newState: { 
          lhs: simpleLhs, 
          rhs: simpleRhs, 
          sign: state.sign,
          // On passe l'opération brute pour l'animation visuelle
          lastOp: { op, val, rawLhs, rawRhs } 
        },
        status: 'RUNNING'
      };
    }

    return { newState: state, status: 'RUNNING' };
  },

  // Vérification de la victoire : x est-il isolé ?
  checkVictory: (finalState) => {
    const cleanLhs = finalState.lhs.replace(/\s/g, '');
    const cleanRhs = finalState.rhs.replace(/\s/g, '');

    // Cas 1 : x = N
    const xLeft = cleanLhs === 'x' && !isNaN(parseFloat(cleanRhs));
    // Cas 2 : N = x
    const xRight = cleanRhs === 'x' && !isNaN(parseFloat(cleanLhs));

    return xLeft || xRight;
  }
};