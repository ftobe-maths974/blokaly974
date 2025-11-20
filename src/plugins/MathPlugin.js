import MemoryVisualizer from '../components/runner/visualizers/MemoryVisualizer';

export const MathPlugin = {
  id: 'MATH',
  RenderComponent: MemoryVisualizer,

  registerBlocks: (Blockly, javascriptGenerator) => {
    
    // 1. SURCHARGE : VARIABLE SET (Pour l'espionnage mémoire)
    javascriptGenerator.forBlock['variables_set'] = (block) => {
      const argument0 = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || '0';
      const varName = block.getField('VAR').getText();
      return `${varName} = ${argument0};\n actions.push({type: 'SET', var: '${varName}', val: ${varName}});\n`;
    };

    // 2. SURCHARGE : AFFICHER (PRINT) -> Vers notre console
    javascriptGenerator.forBlock['text_print'] = (block) => {
      const msg = javascriptGenerator.valueToCode(block, 'TEXT', javascriptGenerator.ORDER_NONE) || "''";
      return `actions.push({type: 'PRINT', msg: ${msg}});\n`;
    };

    // 3. SURCHARGE : DEMANDER (PROMPT) -> Utilise window.prompt (bloquant mais simple)
    // On ne change pas le comportement standard car window.prompt marche bien avec notre eval()
    // Mais on peut ajouter un log pour dire qu'on a demandé quelque chose.
  },

  // Ajout des catégories Texte et Logique
  getToolboxXML: (allowedBlocks) => {
    const allowed = allowedBlocks || ['math_number', 'math_arithmetic', 'variables_set', 'text_print', 'text_prompt_ext'];
    
    let xml = '<xml id="toolbox" style="display: none">';
    
    // Catégorie Maths
    if (allowed.some(b => b.startsWith('math_'))) {
      xml += '<category name="Calculs" colour="230">';
      if (allowed.includes('math_number')) xml += '<block type="math_number"></block>';
      if (allowed.includes('math_arithmetic')) xml += '<block type="math_arithmetic"></block>';
      // Petit bonus : le modulo et l'aléatoire
      xml += '<block type="math_modulo"></block>';
      xml += '<block type="math_random_int"><value name="FROM"><shadow type="math_number"><field name="NUM">1</field></shadow></value><value name="TO"><shadow type="math_number"><field name="NUM">100</field></shadow></value></block>';
      xml += '</category>';
    }

    // Catégorie Textes & Interactions (NOUVEAU)
    if (allowed.includes('text_print') || allowed.includes('text_prompt_ext')) {
        xml += '<category name="Texte & E/S" colour="160">';
        if (allowed.includes('text_print')) xml += '<block type="text_print"><value name="TEXT"><shadow type="text"><field name="TEXT">Bonjour</field></shadow></value></block>';
        if (allowed.includes('text_prompt_ext')) xml += '<block type="text_prompt_ext"><value name="TEXT"><shadow type="text"><field name="TEXT">Quel est ton nom ?</field></shadow></value></block>';
        xml += '<block type="text"><field name="TEXT"></field></block>'; // Bloc texte simple "..."
        xml += '<block type="text_join"></block>'; // Créer texte avec...
        xml += '</category>';
    }

    // Catégorie Variables
    if (allowed.includes('variables_set')) {
      xml += '<category name="Variables" colour="330" custom="VARIABLE"></category>';
    }
    
    // Catégorie Logique
    xml += '<category name="Logique" colour="210">';
    if (allowed.includes('controls_repeat_ext')) xml += '<block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">5</field></shadow></value></block>';
    // Ajout des Si/Sinon et Comparaisons
    xml += '<block type="controls_if"></block>';
    xml += '<block type="controls_if"><mutation else="1"></mutation></block>';
    xml += '<block type="logic_compare"></block>';
    xml += '</category>';

    xml += '</xml>';
    return xml;
  },

  executeStep: (currentState, action, levelData) => {
    const state = currentState || { 
      variables: { ...levelData.inputs }, 
      logs: [] 
    };

    const newVariables = { ...state.variables };
    const newLogs = [...state.logs];
    let status = 'RUNNING';

    // --- GESTION DES ACTIONS ---
    
    if (action.type === 'SET') {
      newVariables[action.var] = action.val;
      if (!action.var.startsWith('_')) newLogs.push(`📝 ${action.var} <- ${action.val}`);
    }
    
    else if (action.type === 'PRINT') {
      newLogs.push(`🖨️ ${action.msg}`); // Petit icône imprimante
    }

    // --- VALIDATION ---
    const targets = levelData.targets || {};
    const targetKeys = Object.keys(targets);

    if (targetKeys.length > 0) {
      // On vérifie que les variables correspondent aux attentes
      const isWin = targetKeys.every(key => newVariables[key] == targets[key]);
      if (isWin) status = 'WIN';
    }

    return { 
      newState: { variables: newVariables, logs: newLogs }, 
      status 
    };
  }
};