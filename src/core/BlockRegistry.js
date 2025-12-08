import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

// --- CORRECTIF VITAL POUR VITE / BLOCKLY ---
try {
    if (Blockly.FieldColour) {
        Blockly.fieldRegistry.register('field_colour', Blockly.FieldColour);
    }
} catch (e) {}

let isRegistered = false;

export const registerAllBlocks = () => {
  if (isRegistered) return;
  isRegistered = true;

  console.log("🏗️ Enregistrement des blocs SYSTÈME uniquement...");

  // ---------------------------------------------------------
  // 🗑️ ZONE NETTOYÉE : On a supprimé la section "1. MAZE"
  // Les blocs Maze sont maintenant gérés par features/maze/logic.js
  // ---------------------------------------------------------

  // --- VARIABLES & SYSTÈME (On garde tout ça) ---
  javascriptGenerator.forBlock['variables_set'] = (block) => `try { ${block.getField('VAR').getText()} = ${javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '0'}; actions.push({type: 'SET', id: "${block.id}", var: '${block.getField('VAR').getText()}', val: ${block.getField('VAR').getText()}}); } catch(e) { console.error(e); }\n`;
  if (!Blockly.Blocks['text_print']) { Blockly.defineBlocksWithJsonArray([{ "type": "text_print", "message0": "afficher %1", "args0": [{ "type": "input_value", "name": "TEXT" }], "previousStatement": null, "nextStatement": null, "colour": 160 }]); }
  javascriptGenerator.forBlock['text_print'] = (block) => `actions.push({type: 'PRINT', id: "${block.id}", msg: ${javascriptGenerator.valueToCode(block, 'TEXT', javascriptGenerator.ORDER_NONE) || "''"}});\n`;
  if (!Blockly.Blocks['system_var_get']) { Blockly.Blocks['system_var_get'] = { init: function() { this.jsonInit({ "message0": "%1", "args0": [{ "type": "field_label_serializable", "name": "VAR_NAME", "text": "VAR" }], "output": null, "colour": 60, "editable": false }); } }; }
  javascriptGenerator.forBlock['system_var_get'] = (block) => [block.getField('VAR_NAME').getText(), javascriptGenerator.ORDER_ATOMIC];

  // --- 3. EQUATION (On garde pour l'instant) ---
  Blockly.defineBlocksWithJsonArray([
    { "type": "equation_op_both", "message0": "Aux deux côtés %1 %2", "args0": [ { "type": "field_dropdown", "name": "OP", "options": [["Ajouter +", "ADD"], ["Soustraire -", "SUB"], ["Multiplier ×", "MUL"], ["Diviser /", "DIV"]] }, { "type": "input_value", "name": "VAL" } ], "previousStatement": null, "nextStatement": null, "colour": 230 },
    { "type": "equation_term_x", "message0": "%1 x", "args0": [ { "type": "field_number", "name": "COEFF", "value": 1, "precision": 1 } ], "output": null, "colour": 230 },
    { "type": "equation_verify", "message0": "Vérifier si x = %1", "args0": [ { "type": "input_value", "name": "VAL", "check": "Number" } ], "previousStatement": null, "nextStatement": null, "colour": 100 },
    { "type": "equation_solution_state", "message0": "Conclusion : %1", "args0": [ { "type": "field_dropdown", "name": "STATE", "options": [["Pas de solution ∅", "NO_SOLUTION"], ["Infinité de solutions (Tout x)", "INFINITE"]] } ], "previousStatement": null, "nextStatement": null, "colour": 100 }
  ]);
  javascriptGenerator.forBlock['equation_op_both'] = (block) => {
    const op = block.getFieldValue('OP'); const val = javascriptGenerator.valueToCode(block, 'VAL', javascriptGenerator.ORDER_ATOMIC) || '0';
    const symbolMap = { 'ADD': '+', 'SUB': '-', 'MUL': '*', 'DIV': '/' };
    return `actions.push({ type: 'OP_BOTH', operator: '${symbolMap[op]}', value: ${val} });\n`;
  };
  javascriptGenerator.forBlock['equation_term_x'] = (block) => [`"${block.getFieldValue('COEFF')}*x"`, javascriptGenerator.ORDER_ATOMIC];
  javascriptGenerator.forBlock['equation_verify'] = (block) => `actions.push({ type: 'VERIFY', value: ${javascriptGenerator.valueToCode(block, 'VAL', javascriptGenerator.ORDER_ATOMIC) || '0'} });\n`;
  javascriptGenerator.forBlock['equation_solution_state'] = (block) => `actions.push({ type: 'DECLARE_SOLUTION', kind: '${block.getFieldValue('STATE')}' });\n`;

  // --- 4. INTERVALLES & INFINI (On garde) ---
  Blockly.defineBlocksWithJsonArray([
    { "type": "equation_solution_s", "message0": "Solution S = %1", "args0": [ { "type": "input_value", "name": "INTERVAL" } ], "previousStatement": null, "nextStatement": null, "colour": 290 },
    { "type": "equation_interval", "message0": "%1 %2 ; %3 %4", "args0": [ { "type": "field_dropdown", "name": "L_BRACKET", "options": [["[", "["], ["]", "]"]] }, { "type": "input_value", "name": "MIN" }, { "type": "input_value", "name": "MAX" }, { "type": "field_dropdown", "name": "R_BRACKET", "options": [["]", "]"], ["[", "["]] } ], "output": null, "colour": 290, "inputsInline": true },
    { "type": "math_infinity", "message0": "%1 ∞", "args0": [ { "type": "field_dropdown", "name": "SIGN", "options": [["+", "POS"], ["-", "NEG"]] } ], "output": "Number", "colour": 230 }
  ]);
  javascriptGenerator.forBlock['equation_solution_s'] = (block) => { const interval = javascriptGenerator.valueToCode(block, 'INTERVAL', javascriptGenerator.ORDER_ATOMIC) || 'null'; return `actions.push({ type: 'DECLARE_INTERVAL', interval: ${interval} });\n`; };
  javascriptGenerator.forBlock['equation_interval'] = (block) => { const left = block.getFieldValue('L_BRACKET'); const right = block.getFieldValue('R_BRACKET'); const min = javascriptGenerator.valueToCode(block, 'MIN', javascriptGenerator.ORDER_ATOMIC) || '0'; const max = javascriptGenerator.valueToCode(block, 'MAX', javascriptGenerator.ORDER_ATOMIC) || '0'; return [`{ left: '${left}', right: '${right}', min: '${min}', max: '${max}' }`, javascriptGenerator.ORDER_ATOMIC]; };
  javascriptGenerator.forBlock['math_infinity'] = (block) => { const sign = block.getFieldValue('SIGN') === 'NEG' ? '-' : ''; return [`${sign}Infinity`, javascriptGenerator.ORDER_ATOMIC]; };

  // --- 5. LISTES (On garde) ---
  const getListIndex = (block, listName) => { const where = block.getFieldValue('WHERE') || 'FROM_START'; let at = '0'; switch (where) { case 'FIRST': at = '0'; break; case 'LAST': at = `${listName}.length - 1`; break; case 'FROM_START': at = String(javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1').match(/^\d+$/) ? parseInt(javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1', 10) - 1 : `(${javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1'} - 1)`; break; case 'FROM_END': at = `${listName}.length - ${javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1'}`; break; case 'RANDOM': at = `Math.floor(Math.random() * ${listName}.length)`; break; } return at; };
  javascriptGenerator.forBlock['lists_create_with'] = (block) => { const elements = new Array(block.itemCount_); for (let i = 0; i < block.itemCount_; i++) { elements[i] = javascriptGenerator.valueToCode(block, 'ADD' + i, javascriptGenerator.ORDER_NONE) || '0'; } return ['[' + elements.join(', ') + ']', javascriptGenerator.ORDER_ATOMIC]; };
  javascriptGenerator.forBlock['lists_getIndex'] = (block) => [`${javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]'}[${getListIndex(block, javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]')}]`, javascriptGenerator.ORDER_MEMBER];
  javascriptGenerator.forBlock['lists_setIndex'] = (block) => `${javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]'}[${getListIndex(block, javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]')}] = ${javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_ASSIGNMENT) || 'null'};\nactions.push({type: 'SET', id: "${block.id}", var: '${javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]'}', val: ${javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]'}});\n`;
  javascriptGenerator.forBlock['lists_length'] = (block) => [`${javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]'}.length`, javascriptGenerator.ORDER_MEMBER];
};