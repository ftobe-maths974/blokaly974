import MemoryVisualizer from '../components/runner/visualizers/MemoryVisualizer';

export const MathPlugin = {
  id: 'MATH',
  RenderComponent: MemoryVisualizer,

  registerBlocks: (Blockly, javascriptGenerator) => {
    javascriptGenerator.forBlock['variables_set'] = (block) => {
      const argument0 = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || '0';
      const varName = block.getField('VAR').getText();
      return `${varName} = ${argument0};\n actions.push({type: 'SET', var: '${varName}', val: ${varName}});\n`;
    };

    if (!Blockly.Blocks['text_print']) {
        Blockly.defineBlocksWithJsonArray([{
            "type": "text_print", "message0": "afficher %1", "args0": [{ "type": "input_value", "name": "TEXT" }],
            "previousStatement": null, "nextStatement": null, "colour": 160
        }]);
    }
    javascriptGenerator.forBlock['text_print'] = (block) => {
      const msg = javascriptGenerator.valueToCode(block, 'TEXT', javascriptGenerator.ORDER_NONE) || "''";
      return `actions.push({type: 'PRINT', msg: ${msg}});\n`;
    };

    if (!Blockly.Blocks['system_var_get']) {
        Blockly.Blocks['system_var_get'] = {
            init: function() {
                this.jsonInit({
                    "message0": "%1",
                    "args0": [{ "type": "field_label_serializable", "name": "VAR_NAME", "text": "VAR" }],
                    "output": null, "colour": 60, "tooltip": "Constante (Lecture seule)", "editable": false
                });
            }
        };
    }
    javascriptGenerator.forBlock['system_var_get'] = (block) => {
        const varName = block.getField('VAR_NAME').getText();
        return [varName, javascriptGenerator.ORDER_ATOMIC];
    };
  },

  getToolboxXML: (allowedBlocks, levelInputs, hiddenVars = [], lockedVars = []) => {
    const allowed = allowedBlocks || ['math_number', 'math_arithmetic', 'variables_set', 'text_print', 'text_prompt_ext', 'controls_repeat_ext'];
    let xml = '<xml id="toolbox" style="display: none">';
    
    // 1. VARIABLES
    if (levelInputs) {
      const allVars = Object.keys(levelInputs);
      const visibleVars = allVars.filter(k => !hiddenVars.includes(k) && !lockedVars.includes(k));
      if (visibleVars.length > 0) {
         xml += '<category name="Mémoire" colour="330">';
         visibleVars.forEach(v => {
             xml += `<block type="variables_get"><field name="VAR">${v}</field></block>`;
             if (allowed.includes('variables_set')) {
                 xml += `<block type="variables_set"><field name="VAR">${v}</field></block>`;
             }
         });
         xml += '</category>';
      }
      const readOnlyVars = allVars.filter(k => lockedVars.includes(k));
      if (readOnlyVars.length > 0) {
        xml += '<category name="🔒 Constantes" colour="60">';
        readOnlyVars.forEach(v => {
           xml += `<block type="system_var_get"><field name="VAR_NAME">${v}</field></block>`;
        });
        xml += '</category>';
      }
    }

    // 2. MATHS
    if (allowed.some(b => b.startsWith('math_'))) {
      xml += '<category name="Calculs" colour="230">';
      if (allowed.includes('math_number')) xml += '<block type="math_number"></block>';
      if (allowed.includes('math_arithmetic')) xml += '<block type="math_arithmetic"></block>';
      xml += '<block type="math_modulo"></block>';
      xml += '<block type="math_random_int"><value name="FROM"><shadow type="math_number"><field name="NUM">1</field></shadow></value><value name="TO"><shadow type="math_number"><field name="NUM">100</field></shadow></value></block>';
      xml += '</category>';
    }

    // 3. INTERACTIONS
    if (allowed.includes('text_print') || allowed.includes('text_prompt_ext')) {
        xml += '<category name="Interactions" colour="160">';
        if (allowed.includes('text_print')) xml += '<block type="text_print"></block>';
        if (allowed.includes('text_prompt_ext')) xml += '<block type="text_prompt_ext"><value name="TEXT"><shadow type="text"><field name="TEXT">?</field></shadow></value></block>';
        xml += '<block type="text"></block>';
        xml += '<block type="logic_compare"></block>';
        xml += '</category>';
    }
    
    // 4. LOGIQUE & BOUCLES
    xml += '<category name="Logique" colour="210">';
    
    // --- CORRECTION ICI : AJOUT DU BLOC BOUCLE SI COCHÉ ---
    if (allowed.includes('controls_repeat_ext')) {
        xml += '<block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">5</field></shadow></value></block>';
        // On ajoute aussi le While (Tant que) car c'est souvent utile en algo
        xml += '<block type="controls_whileUntil"></block>';
    }
    // -------------------------------------------------------

    xml += '<block type="controls_if"></block>';
    xml += '<block type="logic_compare"></block>';
    xml += '<block type="logic_operation"></block>';
    xml += '<block type="math_number"></block>';
    xml += '</category>';

    xml += '</xml>';
    return xml;
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
        newLogs.push(`📝 ${action.var} <- ${action.val}`);
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
        // eslint-disable-next-line eqeqeq
        return currentVal == expectedVal;
      });
      if (isWin) status = 'WIN';
    }

    return { newState: { variables: newVariables, logs: newLogs }, status };
  }
};