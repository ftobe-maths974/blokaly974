import { pythonGenerator } from 'blockly/python';

export const registerPythonDefinitions = () => {
  // ... (Tout le reste inchangé)
  // Copie-colle le contenu précédent de PythonDefinitions.js ici et ajoute à la fin :

  // --- EQUATION (Suite) ---
  pythonGenerator.forBlock['equation_op_both'] = (block) => {
    const op = block.getFieldValue('OP');
    const val = pythonGenerator.valueToCode(block, 'VAL', pythonGenerator.ORDER_ATOMIC) || '0';
    const symbolMap = { 'ADD': '+', 'SUB': '-', 'MUL': '*', 'DIV': '/' };
    return `# Opération sur les deux membres\nequation.appliquer('${symbolMap[op]}', ${val})\n`;
  };
  pythonGenerator.forBlock['equation_term_x'] = (block) => {
    const coeff = block.getFieldValue('COEFF');
    return [`"${coeff}*x"`, pythonGenerator.ORDER_ATOMIC];
  };
  pythonGenerator.forBlock['equation_verify'] = (block) => {
    const val = pythonGenerator.valueToCode(block, 'VAL', pythonGenerator.ORDER_ATOMIC) || '0';
    return `equation.verifier(${val})\n`;
  };
  // NOUVEAU
  pythonGenerator.forBlock['equation_solution_state'] = (block) => {
    const state = block.getFieldValue('STATE');
    const label = state === 'NO_SOLUTION' ? 'pas_de_solution' : 'infinite_solutions';
    return `equation.conclure('${label}')\n`;
  };
  
  // ... (Reste Maths/Logique inchangé)
  pythonGenerator.forBlock['maze_move_forward'] = () => 'robot.avancer()\n';
  pythonGenerator.forBlock['maze_turn'] = (block) => `robot.pivoter('${block.getFieldValue('DIR') === 'LEFT' ? 'gauche' : 'droite'}')\n`;
  pythonGenerator.forBlock['maze_forever'] = (block) => `while not robot.est_arrive():\n${pythonGenerator.statementToCode(block, 'DO') || '  pass\n'}`;
  pythonGenerator.forBlock['maze_if'] = (block) => `if robot.chemin_disponible('${block.getFieldValue('DIR')}'):\n${pythonGenerator.statementToCode(block, 'DO') || '  pass\n'}`;
  pythonGenerator.forBlock['maze_if_else'] = (block) => `if robot.chemin_disponible('${block.getFieldValue('DIR')}'):\n${pythonGenerator.statementToCode(block, 'DO') || '  pass\n'}else:\n${pythonGenerator.statementToCode(block, 'ELSE') || '  pass\n'}`;
  pythonGenerator.forBlock['turtle_move'] = (block) => `tortue.avancer(${pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_NONE) || '0'})\n`;
  pythonGenerator.forBlock['turtle_turn'] = (block) => block.getFieldValue('DIR') === 'LEFT' ? `tortue.gauche(${pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_NONE) || '0'})\n` : `tortue.droite(${pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_NONE) || '0'})\n`;
  pythonGenerator.forBlock['turtle_pen'] = (block) => block.getFieldValue('STATE') === 'UP' ? `tortue.lever_stylo()\n` : `tortue.baisser_stylo()\n`;
  pythonGenerator.forBlock['turtle_color'] = (block) => `tortue.couleur('${block.getFieldValue('COLOR')}')\n`;
  pythonGenerator.forBlock['text_print'] = (block) => `print(${pythonGenerator.valueToCode(block, 'TEXT', pythonGenerator.ORDER_NONE) || "''"})\n`;
};