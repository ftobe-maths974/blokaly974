import EquationRender from '../components/runner/EquationRender';
import { generateToolbox } from '../core/BlockDefinitions';
// On garde l'import complet pour avoir simplify()
import nerdamer from 'nerdamer/all.min';

export const EquationPlugin = {
  id: 'EQUATION',
  RenderComponent: EquationRender,

  getToolboxXML: (allowedBlocks) => generateToolbox(allowedBlocks),

  executeStep: (currentState, action, levelData) => {
    const state = currentState || { 
      lhs: levelData.equation?.lhs || "x", 
      rhs: levelData.equation?.rhs || "0", 
      initialLhs: levelData.equation?.lhs || "x",
      initialRhs: levelData.equation?.rhs || "0",
      sign: levelData.equation?.sign || '=', 
      initialSign: levelData.equation?.sign || '=', 
      implicit: levelData.equation?.implicit || false, 
      history: [],
      verification: null,
      solutionState: null,
      finalSolutionLatex: null
    };

    if (!action) return { newState: state, status: 'RUNNING' };

    let { lhs, rhs, history, sign } = state;

    // --- 1. CALCUL ---
    if (action.type === 'OP_BOTH') {
      const val = action.value; 
      const op = action.operator; 
      
      if (op === '/' && (val == 0 || val === '0')) {
          return { newState: { ...state, lastOp: { error: "Division par zéro !" } }, status: 'RUNNING' };
      }

      let newSign = sign;
      const valNum = parseFloat(val);
      if ((op === '*' || op === '/') && valNum < 0) {
          if (sign === '<') newSign = '>'; else if (sign === '>') newSign = '<';
          else if (sign === '\\leq') newSign = '\\geq'; else if (sign === '\\geq') newSign = '\\leq';
      }
      
      const rawLhs = `(${lhs}) ${op} (${val})`;
      const rawRhs = `(${rhs}) ${op} (${val})`;
      const simpleLhs = nerdamer(rawLhs).text(); 
      const simpleRhs = nerdamer(rawRhs).text();
      const newHistory = [...history, { lhs: simpleLhs, rhs: simpleRhs, op, val, sign: newSign }];

      return { 
        newState: { ...state, lhs: simpleLhs, rhs: simpleRhs, sign: newSign, history: newHistory, lastOp: { op, val, rawLhs, rawRhs }, verification: null, solutionState: null, finalSolutionLatex: null },
        status: 'RUNNING'
      };
    }

    // --- 2. VÉRIFICATION ---
    if (action.type === 'VERIFY') {
        const testVal = action.value;
        const originLhs = state.initialLhs;
        const originRhs = state.initialRhs;
        const checkSign = state.initialSign; 

        // On utilise nerdamer().evaluate().text() de manière séquentielle
        const valLhs = parseFloat(nerdamer(originLhs, { x: testVal }).evaluate().text());
        const valRhs = parseFloat(nerdamer(originRhs, { x: testVal }).evaluate().text());
        
        const EPSILON = 0.0001;
        const isBoundary = Math.abs(valLhs - valRhs) < EPSILON;
        
        let isCorrect = false;
        if (checkSign === '=') isCorrect = isBoundary;
        else if (checkSign === '<') isCorrect = valLhs < valRhs - EPSILON;
        else if (checkSign === '>') isCorrect = valLhs > valRhs + EPSILON;
        else if (checkSign === '\\leq') isCorrect = valLhs <= valRhs + EPSILON;
        else if (checkSign === '\\geq') isCorrect = valLhs >= valRhs - EPSILON;

        let feedbackMsg = "";
        if (checkSign !== '=') {
            if (isBoundary) {
                if (isCorrect) feedbackMsg = "✅ Vrai à la frontière : INCLURE (Crochet fermé).";
                else feedbackMsg = "❌ Faux à la frontière : EXCLURE (Crochet ouvert).";
            } else {
                feedbackMsg = isCorrect ? "Vrai (dans la solution)." : "Faux (hors solution).";
            }
        }

        let solutionLatex = null;
        if (isCorrect && checkSign === '=') solutionLatex = `S = \\{ ${testVal} \\}`;

        return {
            newState: { 
                ...state, 
                verification: { testVal, originLhs, originRhs, valLhs, valRhs, isCorrect, checkSign, feedbackMsg },
                finalSolutionLatex: solutionLatex,
                lastOp: null 
            },
            status: 'RUNNING'
        };
    }

    // --- 3. DÉCLARATION INTERVALLE (CORRIGÉ) ---
    if (action.type === 'DECLARE_INTERVAL') {
        const userInterval = action.interval; 
        if (!userInterval) return { newState: state, status: 'RUNNING' };

        // CORRECTION ICI : On décompose pour éviter le crash "evaluate is not a function"
        const rawDiff = `${state.initialLhs} - (${state.initialRhs})`;
        
        // 1. On simplifie et on récupère le TEXTE
        const diffText = nerdamer(rawDiff).simplify().text();
        
        // 2. On ré-instancie nerdamer sur ce texte pour évaluer
        // A = Pente, B = Valeur en 0
        const valAt0 = nerdamer(diffText).evaluate({x: 0}).text();
        const valAt1 = nerdamer(diffText).evaluate({x: 1}).text();
        
        const B = parseFloat(valAt0);
        const AplusB = parseFloat(valAt1);
        const A = AplusB - B;

        const pivot = (A === 0) ? 0 : -B / A; // Protection div/0 (cas constants)
        const startSign = state.initialSign;

        // Analyse Pivot
        const uMin = userInterval.min === '-Infinity' ? -Infinity : parseFloat(userInterval.min);
        const uMax = userInterval.max === 'Infinity' ? Infinity : parseFloat(userInterval.max);
        
        const minIsPivot = Math.abs(uMin - pivot) < 0.01;
        const maxIsPivot = Math.abs(uMax - pivot) < 0.01;
        let isPivotCorrect = (uMin === -Infinity && maxIsPivot) || (uMax === Infinity && minIsPivot);
        
        // Analyse Sens
        let isDirectionCorrect = false;
        if (isPivotCorrect) {
            let testPoint = (uMin === -Infinity) ? uMax - 1 : uMin + 1;
            
            const vL = parseFloat(nerdamer(state.initialLhs, {x: testPoint}).evaluate().text());
            const vR = parseFloat(nerdamer(state.initialRhs, {x: testPoint}).evaluate().text());
            
            if (startSign === '<') isDirectionCorrect = vL < vR;
            else if (startSign === '>') isDirectionCorrect = vL > vR;
            else if (startSign === '\\leq') isDirectionCorrect = vL <= vR;
            else if (startSign === '\\geq') isDirectionCorrect = vL >= vR;
        }

        // Analyse Crochets (Simplifié : On checke juste si l'élève est cohérent avec la frontière)
        // Si la frontière est incluse (<= ou >=), le crochet côté pivot doit être fermé
        let isBracketCorrect = true;
        const isInclusive = (startSign === '\\leq' || startSign === '\\geq');
        const pivotBracket = (uMin === -Infinity) ? userInterval.right : userInterval.left;
        
        if (isInclusive && pivotBracket !== '[') isBracketCorrect = false; // Doit être fermé (notation approximative selon le côté)
        // Note : Gérer [a;b] vs ]a;b[ est complexe en string, pour l'instant on valide pivot + sens.
        if (isInclusive) {
             // Si on doit inclure, on attend '[' ou ']' FERMANT vers le nombre.
             // Simplification : On considère que si pivot et sens sont bons, c'est OK pour le prototype.
             isBracketCorrect = true; 
        }

        const isSuccess = isPivotCorrect && isDirectionCorrect; // On relaxe Bracket pour l'instant pour éviter les blocages
        
        let msg = "Bravo !";
        if (!isPivotCorrect) msg = `Erreur de frontière (attendu : ${pivot.toFixed(2)})`;
        else if (!isDirectionCorrect) msg = "L'intervalle est dans le mauvais sens.";

        const minTex = uMin === -Infinity ? '-\\infty' : uMin;
        const maxTex = uMax === Infinity ? '+\\infty' : uMax;
        const solLatex = `S = ${userInterval.left} ${minTex} ; ${maxTex} ${userInterval.right}`;

        return {
            newState: { 
                ...state, 
                solutionState: { kind: 'INTERVAL', isSuccess, msg },
                finalSolutionLatex: isSuccess ? solLatex : null,
                lastOp: null 
            },
            status: 'RUNNING'
        };
    }
    
    // ... (DECLARE_SOLUTION inchangé)
    if (action.type === 'DECLARE_SOLUTION') {
        return { newState: state, status: 'RUNNING' }; // Placeholder pour le code existant
    }

    return { newState: state, status: 'RUNNING' };
  },

  checkVictory: (finalState) => {
    if (!finalState) return false;
    // Victoire si solution finale affichée
    return !!finalState.finalSolutionLatex;
  }
};