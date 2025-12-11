import nerdamer from 'nerdamer/all.min';

// Gardien anti-doublon
let isRegistered = false;

export const EquationLogic = {
  registerBlocks: (Blockly, javascriptGenerator) => {
    if (isRegistered) return;
    isRegistered = true;
    console.log("📐 Enregistrement blocs EQUATION...");


    // Définitions
    const blocks = [
        { "type": "equation_op_both", "message0": "Aux deux côtés %1 %2", "args0": [ { "type": "field_dropdown", "name": "OP", "options": [["Ajouter +", "ADD"], ["Soustraire -", "SUB"], ["Multiplier ×", "MUL"], ["Diviser /", "DIV"]] }, { "type": "input_value", "name": "VAL" } ], "previousStatement": null, "nextStatement": null, "colour": 230 },
        { "type": "equation_term_x", "message0": "%1 x", "args0": [ { "type": "field_number", "name": "COEFF", "value": 1, "precision": 1 } ], "output": null, "colour": 230 },
        { "type": "equation_verify", "message0": "Vérifier si x = %1", "args0": [ { "type": "input_value", "name": "VAL", "check": "Number" } ], "previousStatement": null, "nextStatement": null, "colour": 100 },
        { "type": "equation_solution_state", "message0": "Conclusion : %1", "args0": [ { "type": "field_dropdown", "name": "STATE", "options": [["Pas de solution ∅", "NO_SOLUTION"], ["Infinité de solutions", "INFINITE"]] } ], "previousStatement": null, "nextStatement": null, "colour": 100 },
        { "type": "equation_solution_s", "message0": "Solution S = %1", "args0": [ { "type": "input_value", "name": "INTERVAL" } ], "previousStatement": null, "nextStatement": null, "colour": 290 },
        { "type": "equation_interval", "message0": "%1 %2 ; %3 %4", "args0": [ { "type": "field_dropdown", "name": "L_BRACKET", "options": [["[", "["], ["]", "]"]] }, { "type": "input_value", "name": "MIN" }, { "type": "input_value", "name": "MAX" }, { "type": "field_dropdown", "name": "R_BRACKET", "options": [["]", "]"], ["[", "["]] } ], "output": null, "colour": 290, "inputsInline": true },
        { "type": "math_infinity", "message0": "%1 ∞", "args0": [ { "type": "field_dropdown", "name": "SIGN", "options": [["+", "POS"], ["-", "NEG"]] } ], "output": "Number", "colour": 230 }
    ];
    Blockly.common.defineBlocksWithJsonArray(blocks);

    // Générateurs
    javascriptGenerator.forBlock['equation_op_both'] = (block) => {
        const op = block.getFieldValue('OP'); 
        const val = javascriptGenerator.valueToCode(block, 'VAL', javascriptGenerator.ORDER_ATOMIC) || '0';
        const symbolMap = { 'ADD': '+', 'SUB': '-', 'MUL': '*', 'DIV': '/' };
        return `actions.push({ type: 'OP_BOTH', operator: '${symbolMap[op]}', value: ${val}, id: '${block.id}' });\n`;
    };
    javascriptGenerator.forBlock['equation_term_x'] = (block) => [`"${block.getFieldValue('COEFF')}*x"`, javascriptGenerator.ORDER_ATOMIC];
    javascriptGenerator.forBlock['equation_verify'] = (block) => `actions.push({ type: 'VERIFY', value: ${javascriptGenerator.valueToCode(block, 'VAL', javascriptGenerator.ORDER_ATOMIC) || '0'}, id: '${block.id}' });\n`;
    javascriptGenerator.forBlock['equation_solution_state'] = (block) => `actions.push({ type: 'DECLARE_SOLUTION', kind: '${block.getFieldValue('STATE')}', id: '${block.id}' });\n`;
    javascriptGenerator.forBlock['equation_solution_s'] = (block) => {
        const interval = javascriptGenerator.valueToCode(block, 'INTERVAL', javascriptGenerator.ORDER_ATOMIC) || 'null';
        return `actions.push({ type: 'DECLARE_INTERVAL', interval: ${interval}, id: '${block.id}' });\n`;
    };
    javascriptGenerator.forBlock['equation_interval'] = (block) => {
        const left = block.getFieldValue('L_BRACKET'); const right = block.getFieldValue('R_BRACKET');
        const min = javascriptGenerator.valueToCode(block, 'MIN', javascriptGenerator.ORDER_ATOMIC) || '0';
        const max = javascriptGenerator.valueToCode(block, 'MAX', javascriptGenerator.ORDER_ATOMIC) || '0';
        return [`{ left: '${left}', right: '${right}', min: '${min}', max: '${max}' }`, javascriptGenerator.ORDER_ATOMIC];
    };
    javascriptGenerator.forBlock['math_infinity'] = (block) => {
        const sign = block.getFieldValue('SIGN') === 'NEG' ? '-' : '';
        return [`${sign}Infinity`, javascriptGenerator.ORDER_ATOMIC];
    };
  },

  getToolboxXML: (allowedBlocks) => {
    const allBlocks = [
        { type: 'equation_op_both', xml: '<block type="equation_op_both"><value name="VAL"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block>' },
        { type: 'equation_term_x', xml: '<block type="equation_term_x"></block>' },
        { type: 'equation_verify', xml: '<block type="equation_verify"><value name="VAL"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block>' },
        { type: 'equation_solution_state', xml: '<block type="equation_solution_state"></block>' },
        { type: 'equation_solution_s', xml: '<block type="equation_solution_s"></block>' },
        { type: 'equation_interval', xml: '<block type="equation_interval"><value name="MIN"><shadow type="math_number"><field name="NUM">0</field></shadow></value><value name="MAX"><shadow type="math_number"><field name="NUM">10</field></shadow></value></block>' },
        { type: 'math_infinity', xml: '<block type="math_infinity"></block>' },
        { type: 'math_number', xml: '<block type="math_number"></block>' }
    ];

    let xml = '<category name="Algèbre" colour="#5b67a5">';
    allBlocks.forEach(b => {
        if (!allowedBlocks || allowedBlocks.includes(b.type)) {
            xml += b.xml;
        }
    });
    xml += '</category>';
    return xml;
  },

  executeStep: (currentState, action, levelData) => {
    // 1. Initialisation complète avec Options (Implicit, Graph)
    const state = currentState || { 
      lhs: levelData.equation?.lhs || "x", 
      rhs: levelData.equation?.rhs || "0", 
      initialLhs: levelData.equation?.lhs || "x",
      initialRhs: levelData.equation?.rhs || "0",
      sign: levelData.equation?.sign || '=', 
      initialSign: levelData.equation?.sign || '=', 
      // 👇 RECUPERATION DES OPTIONS
      implicit: levelData.equation?.implicit || false, 
      showGraph: levelData.equation?.showGraph || false,
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

    // --- 3. DÉCLARATION INTERVALLE ---
    if (action.type === 'DECLARE_INTERVAL') {
        const userInterval = action.interval; 
        if (!userInterval) return { newState: state, status: 'RUNNING' };


        const rawDiff = `${state.initialLhs} - (${state.initialRhs})`;
        const diffText = nerdamer(rawDiff).simplify().text();
        
        const valAt0 = nerdamer(diffText).evaluate({x: 0}).text();
        const valAt1 = nerdamer(diffText).evaluate({x: 1}).text();

        const B = parseFloat(valAt0);
        const AplusB = parseFloat(valAt1);
        const A = AplusB - B;

        const pivot = (A === 0) ? 0 : -B / A; 
        const startSign = state.initialSign;

        const uMin = userInterval.min === '-Infinity' ? -Infinity : parseFloat(userInterval.min);
        const uMax = userInterval.max === 'Infinity' ? Infinity : parseFloat(userInterval.max);
        
        const minIsPivot = Math.abs(uMin - pivot) < 0.01;
        const maxIsPivot = Math.abs(uMax - pivot) < 0.01;
        let isPivotCorrect = (uMin === -Infinity && maxIsPivot) || (uMax === Infinity && minIsPivot);
        
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

        const isSuccess = isPivotCorrect && isDirectionCorrect;
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

    if (action.type === 'DECLARE_SOLUTION') {
        return { newState: state, status: 'RUNNING' };
    return { newState: state, status: 'RUNNING' };
  }
};