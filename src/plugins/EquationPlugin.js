import EquationRender from '../components/runner/EquationRender';
import { generateToolbox } from '../core/BlockDefinitions';
import nerdamer from 'nerdamer';

export const EquationPlugin = {
  id: 'EQUATION',
  RenderComponent: EquationRender,

  getToolboxXML: (allowedBlocks) => generateToolbox(allowedBlocks),

  executeStep: (currentState, action, levelData) => {
    // État initial
    const state = currentState || { 
      lhs: levelData.equation?.lhs || "x", 
      rhs: levelData.equation?.rhs || "0",
      // MÉMOIRE : On fige l'équation de départ pour le graphique de référence
      initialLhs: levelData.equation?.lhs || "x",
      initialRhs: levelData.equation?.rhs || "0",
      sign: levelData.equation?.sign || '=',
      implicit: levelData.equation?.implicit || false, 
      history: [],
      verification: null,
      solutionState: null,
      finalSolutionLatex: null
    };

    if (!action) return { newState: state, status: 'RUNNING' };

    let { lhs, rhs, history } = state;

    // --- 1. CALCUL ---
    if (action.type === 'OP_BOTH') {
      const val = action.value; 
      const op = action.operator; 
      
      if (op === '/' && (val == 0 || val === '0')) {
          return { newState: { ...state, lastOp: { error: "Division par zéro impossible !" } }, status: 'RUNNING' };
      }
      
      const rawLhs = `(${lhs}) ${op} (${val})`;
      const rawRhs = `(${rhs}) ${op} (${val})`;
      const simpleLhs = nerdamer(rawLhs).text(); 
      const simpleRhs = nerdamer(rawRhs).text();

      const newHistory = [...history, { lhs: simpleLhs, rhs: simpleRhs, op, val }];

      return { 
        newState: { 
          ...state, // On garde initialLhs/initialRhs
          lhs: simpleLhs, rhs: simpleRhs, 
          history: newHistory,
          lastOp: { op, val, rawLhs, rawRhs },
          verification: null, solutionState: null, finalSolutionLatex: null
        },
        status: 'RUNNING'
      };
    }

    // --- 2. VÉRIFICATION ---
    if (action.type === 'VERIFY') {
        const testVal = action.value;
        // On utilise l'équation DE DÉPART pour la démonstration
        const originLhs = state.initialLhs;
        const originRhs = state.initialRhs;

        const valLhs = nerdamer(originLhs, { x: testVal }).evaluate().text();
        const valRhs = nerdamer(originRhs, { x: testVal }).evaluate().text();
        const isCorrect = Math.abs(parseFloat(valLhs) - parseFloat(valRhs)) < 0.0001;
        
        let solutionLatex = null;
        if (isCorrect) solutionLatex = `S = \\{ ${testVal} \\}`;

        return {
            newState: { 
                ...state, 
                verification: { testVal, originLhs, originRhs, valLhs, valRhs, isCorrect },
                finalSolutionLatex: solutionLatex,
                lastOp: null 
            },
            status: 'RUNNING'
        };
    }

    // --- 3. CONCLUSION ---
    if (action.type === 'DECLARE_SOLUTION') {
        const diff = nerdamer(`${lhs} - (${rhs})`).simplify().text();
        const isZero = diff === '0'; 
        const isConstant = !diff.includes('x');

        let isSuccess = false;
        let msg = "";
        let solutionLatex = null;

        if (action.kind === 'NO_SOLUTION') {
            if (isConstant && !isZero) { isSuccess = true; solutionLatex = "S = \\emptyset"; } 
            else { msg = "Faux ! Il y a une solution ou une infinité."; }
        } else if (action.kind === 'INFINITE') {
            if (isZero) { isSuccess = true; solutionLatex = "S = \\mathbb{R}"; } 
            else { msg = "Faux !"; }
        }

        return {
            newState: { ...state, solutionState: { kind: action.kind, isSuccess, msg }, finalSolutionLatex: solutionLatex, lastOp: null },
            status: 'RUNNING'
        };
    }

    return { newState: state, status: 'RUNNING' };
  },

  checkVictory: (finalState) => {
    if (!finalState) return false;
    if (finalState.verification && finalState.verification.isCorrect) {
        const cleanLhs = finalState.lhs.replace(/\s/g, '');
        const cleanRhs = finalState.rhs.replace(/\s/g, '');
        return (cleanLhs === 'x' && !isNaN(parseFloat(cleanRhs))) || (cleanRhs === 'x' && !isNaN(parseFloat(cleanLhs)));
    }
    if (finalState.solutionState && finalState.solutionState.isSuccess) return true;
    return false;
  }
};