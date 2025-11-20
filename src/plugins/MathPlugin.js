import MemoryVisualizer from '../components/runner/visualizers/MemoryVisualizer';

export const MathPlugin = {
  id: 'MATH',
  RenderComponent: MemoryVisualizer,

  registerBlocks: (Blockly, javascriptGenerator) => {
    // On s'assure que les blocs standards math/variables sont actifs
    // Pas besoin de définition complexe, Blockly les a par défaut,
    // mais on surcharge le générateur pour créer des "Logs"
    
    // Exemple : Quand on set une variable, on ajoute une instruction "log"
    const originalVarSet = javascriptGenerator.forBlock['variables_set'];
    javascriptGenerator.forBlock['variables_set'] = (block) => {
      const argument0 = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || '0';
      const varName = block.getField('VAR').getText();
      // On génère le code normal + une commande spéciale "SNAPSHOT"
      return `${varName} = ${argument0};\n actions.push({type: 'SET', var: '${varName}', val: ${varName}});\n`;
    };
  },

  getToolboxXML: () => `
    <xml id="toolbox" style="display: none">
      <category name="Maths" colour="230">
        <block type="math_number"></block>
        <block type="math_arithmetic"></block>
      </category>
      <category name="Variables" colour="330" custom="VARIABLE"></category>
    </xml>
  `,

  // Moteur d'exécution séquentielle
  executeStep: (currentState, action, levelData) => {
    // État initial
    const state = currentState || { 
      variables: levelData.inputs || {}, // Inputs définis par le prof
      logs: [] 
    };

    // On clone pour immutabilité
    const newVariables = { ...state.variables };
    const newLogs = [...state.logs];
    let status = 'RUNNING';

    // Traitement de l'action (générée par le bloc variables_set modifié)
    if (action.type === 'SET') {
      newVariables[action.var] = action.val;
      newLogs.push(`Mise à jour : ${action.var} <- ${action.val}`);
    }

    // Vérification Victoire : Est-ce que les variables cibles sont atteintes ?
    const targets = levelData.targets || {};
    const isWin = Object.entries(targets).every(([key, targetVal]) => newVariables[key] === targetVal);
    
    if (isWin && Object.keys(targets).length > 0) status = 'WIN';

    return { 
      newState: { variables: newVariables, logs: newLogs }, 
      status 
    };
  }
};