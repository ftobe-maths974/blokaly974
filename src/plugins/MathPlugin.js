import MemoryVisualizer from '../components/runner/visualizers/MemoryVisualizer';

export const MathPlugin = {
  id: 'MATH',
  RenderComponent: MemoryVisualizer,

  registerBlocks: (Blockly, javascriptGenerator) => {
    // Surcharge du bloc "Définir variable" pour créer des logs
    const originalVarSet = javascriptGenerator.forBlock['variables_set'];
    javascriptGenerator.forBlock['variables_set'] = (block) => {
      const argument0 = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || '0';
      const varName = block.getField('VAR').getText();
      return `${varName} = ${argument0};\n actions.push({type: 'SET', var: '${varName}', val: ${varName}});\n`;
    };
  },

  // CORRECTION ICI : On utilise 'allowedBlocks' pour filtrer la toolbox
  getToolboxXML: (allowedBlocks) => {
    const allowed = allowedBlocks || ['math_number', 'math_arithmetic', 'variables_set'];
    
    let xml = '<xml id="toolbox" style="display: none">';
    
    // Catégorie Maths
    if (allowed.includes('math_number') || allowed.includes('math_arithmetic')) {
      xml += '<category name="Maths" colour="230">';
      if (allowed.includes('math_number')) xml += '<block type="math_number"></block>';
      if (allowed.includes('math_arithmetic')) xml += '<block type="math_arithmetic"></block>';
      xml += '</category>';
    }

    // Catégorie Variables
    if (allowed.includes('variables_set')) {
      xml += '<category name="Variables" colour="330" custom="VARIABLE"></category>';
    }
    
    // Catégorie Logique (Si activée)
    if (allowed.includes('controls_repeat_ext')) {
        xml += '<category name="Logique" colour="210">';
        xml += '<block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">5</field></shadow></value></block>';
        xml += '</category>';
    }

    xml += '</xml>';
    return xml;
  },

  executeStep: (currentState, action, levelData) => {
    // ... (Le reste ne change pas, voir code précédent si besoin) ...
    const state = currentState || { variables: { ...levelData.inputs }, logs: [] };
    const newVariables = { ...state.variables };
    const newLogs = [...state.logs];
    let status = 'RUNNING';

    if (action.type === 'SET') {
      newVariables[action.var] = action.val;
      if (!action.var.startsWith('_')) newLogs.push(`${action.var} <- ${action.val}`);
    }

    const targets = levelData.targets || {};
    const targetKeys = Object.keys(targets);
    if (targetKeys.length > 0) {
      // Comparaison souple (==) pour gérer string/number
      // eslint-disable-next-line eqeqeq
      const isWin = targetKeys.every(key => newVariables[key] == targets[key]);
      if (isWin) status = 'WIN';
    }

    return { newState: { variables: newVariables, logs: newLogs }, status };
  }
};