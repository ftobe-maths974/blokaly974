import MemoryVisualizer from '../components/runner/visualizers/MemoryVisualizer';

export const MathPlugin = {
  id: 'MATH',
  RenderComponent: MemoryVisualizer,

  registerBlocks: (Blockly, javascriptGenerator) => {
    javascriptGenerator.forBlock['variables_set'] = (block) => {
      // Utiliser ORDER_ATOMIC ici est plus sûr pour éviter des parenthèses bizarres
      const argument0 = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '0';
      const varName = block.getField('VAR').getText();
      
      // On ajoute un try/catch dans le code généré pour que l'élève ne voit pas l'erreur technique
      return `
        try {
          ${varName} = ${argument0};
          actions.push({type: 'SET', var: '${varName}', val: ${varName}});
        } catch(e) { console.error(e); }
      \n`;
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

    // --- GESTION DES LISTES (CORRIGÉE) ---
    
    // Helper pour calculer l'index selon le menu (Premier, Dernier, #...)
    const getListIndex = (block, listName) => {
        const where = block.getFieldValue('WHERE') || 'FROM_START';
        let at = '0';

        switch (where) {
            case 'FIRST': 
                at = '0'; 
                break;
            case 'LAST': 
                at = `${listName}.length - 1`; 
                break;
            case 'FROM_START': {
                const atInput = javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1';
                // Si c'est un chiffre simple, on optimise, sinon on génère la formule
                at = String(atInput).match(/^\d+$/) ? parseInt(atInput, 10) - 1 : `(${atInput} - 1)`;
                break;
            }
            case 'FROM_END': {
                const atInput = javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1';
                at = `${listName}.length - ${atInput}`;
                break;
            }
            case 'RANDOM':
                at = `Math.floor(Math.random() * ${listName}.length)`;
                break;
        }
        return at;
    };

    javascriptGenerator.forBlock['lists_create_with'] = (block) => {
        const elements = new Array(block.itemCount_);
        for (let i = 0; i < block.itemCount_; i++) {
            let val = javascriptGenerator.valueToCode(block, 'ADD' + i, javascriptGenerator.ORDER_NONE);
            if (!val) val = '0'; 
            elements[i] = val;
        }
        const code = '[' + elements.join(', ') + ']';
        return [code, javascriptGenerator.ORDER_ATOMIC];
    };

    javascriptGenerator.forBlock['lists_getIndex'] = (block) => {
        const list = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]';
        const at = getListIndex(block, list);
        return [`${list}[${at}]`, javascriptGenerator.ORDER_MEMBER];
    };

    javascriptGenerator.forBlock['lists_setIndex'] = (block) => {
        const list = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
        const value = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
        const at = getListIndex(block, list);

        // IMPORTANT : On modifie la liste JS, PUIS on envoie l'info 'SET' au moteur pour mettre à jour l'affichage
        return `
          ${list}[${at}] = ${value};
          actions.push({type: 'SET', var: '${list}', val: ${list}});
        \n`;
    };

    javascriptGenerator.forBlock['lists_length'] = (block) => {
        const list = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]';
        return [`${list}.length`, javascriptGenerator.ORDER_MEMBER];
    };
  },

  getToolboxXML: (allowedBlocks, levelInputs, hiddenVars = [], lockedVars = []) => {
    const allowed = allowedBlocks || ['math_number', 'math_arithmetic', 'variables_set', 'text_print', 'text_prompt_ext', 'controls_repeat_ext'];
    let xml = '<xml id="toolbox" style="display: none">';
    
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

    if (allowed.includes('lists_create_with') || allowed.includes('lists_getIndex') || allowed.includes('lists_setIndex') || allowed.includes('lists_length')) {
        xml += '<category name="Listes" colour="260">';
        if (allowed.includes('lists_create_with')) xml += '<block type="lists_create_with"><mutation items="3"></mutation></block>';
        if (allowed.includes('lists_getIndex')) xml += '<block type="lists_getIndex"></block>';
        if (allowed.includes('lists_setIndex')) xml += '<block type="lists_setIndex"></block>';
        if (allowed.includes('lists_length')) xml += '<block type="lists_length"></block>';
        xml += '</category>';
    }

    if (allowed.some(b => b.startsWith('math_'))) {
      xml += '<category name="Calculs" colour="230">';
      if (allowed.includes('math_number')) xml += '<block type="math_number"></block>';
      if (allowed.includes('math_arithmetic')) xml += '<block type="math_arithmetic"></block>';
      xml += '<block type="math_modulo"></block>';
      xml += '<block type="math_random_int"><value name="FROM"><shadow type="math_number"><field name="NUM">1</field></shadow></value><value name="TO"><shadow type="math_number"><field name="NUM">100</field></shadow></value></block>';
      xml += '</category>';
    }

    if (allowed.includes('text_print') || allowed.includes('text_prompt_ext')) {
        xml += '<category name="Interactions" colour="160">';
        if (allowed.includes('text_print')) xml += '<block type="text_print"></block>';
        if (allowed.includes('text_prompt_ext')) xml += '<block type="text_prompt_ext"><value name="TEXT"><shadow type="text"><field name="TEXT">?</field></shadow></value></block>';
        xml += '<block type="text"></block>';
        xml += '<block type="logic_compare"></block>';
        xml += '</category>';
    }
    
    xml += '<category name="Logique" colour="210">';
    if (allowed.includes('controls_repeat_ext')) {
        xml += '<block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">5</field></shadow></value></block>';
        xml += '<block type="controls_whileUntil"></block>';
    }
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