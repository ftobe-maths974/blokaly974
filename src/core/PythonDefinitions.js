import { pythonGenerator } from 'blockly/python';

export const registerPythonDefinitions = () => {
  // --- MAZE ---
  pythonGenerator.forBlock['maze_move_forward'] = () => 'robot.avancer()\n';
  pythonGenerator.forBlock['maze_turn'] = (block) => {
    const dir = block.getFieldValue('DIR');
    return `robot.pivoter('${dir}')\n`;
  };
  pythonGenerator.forBlock['maze_forever'] = (block) => {
    const branch = pythonGenerator.statementToCode(block, 'DO') || '  pass\n';
    return `while not robot.est_arrive():\n${branch}`;
  };
  pythonGenerator.forBlock['maze_if'] = (block) => {
    const dir = block.getFieldValue('DIR');
    const branch = pythonGenerator.statementToCode(block, 'DO') || '  pass\n';
    return `if robot.chemin_disponible('${dir}'):\n${branch}`;
  };
  pythonGenerator.forBlock['maze_if_else'] = (block) => {
    const dir = block.getFieldValue('DIR');
    const branch0 = pythonGenerator.statementToCode(block, 'DO') || '  pass\n';
    const branch1 = pythonGenerator.statementToCode(block, 'ELSE') || '  pass\n';
    return `if robot.chemin_disponible('${dir}'):\n${branch0}else:\n${branch1}`;
  };

  // --- TURTLE ---
  pythonGenerator.forBlock['turtle_move'] = (block) => {
    const val = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_NONE) || '0';
    return `tortue.avancer(${val})\n`;
  };
  pythonGenerator.forBlock['turtle_turn'] = (block) => {
    const dir = block.getFieldValue('DIR');
    const val = pythonGenerator.valueToCode(block, 'VALUE', pythonGenerator.ORDER_NONE) || '0';
    return dir === 'LEFT' ? `tortue.gauche(${val})\n` : `tortue.droite(${val})\n`;
  };
  pythonGenerator.forBlock['turtle_pen'] = (block) => {
    const state = block.getFieldValue('STATE');
    return state === 'UP' ? `tortue.lever_stylo()\n` : `tortue.baisser_stylo()\n`;
  };
  pythonGenerator.forBlock['turtle_color'] = (block) => {
    const color = block.getFieldValue('COLOR');
    return `tortue.couleur('${color}')\n`;
  };

  // --- MATHS & LOGIQUE ---
  // Blockly gère déjà les blocs standards (if, repeat, math), on n'a pas besoin de les redéfinir !
  // On surcharge juste l'affichage pour 'print'
  pythonGenerator.forBlock['text_print'] = (block) => {
    const msg = pythonGenerator.valueToCode(block, 'TEXT', pythonGenerator.ORDER_NONE) || "''";
    return `print(${msg})\n`;
  };
};