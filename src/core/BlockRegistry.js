import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

// --- CORRECTIF VITAL POUR VITE / BLOCKLY ---
// On force l'enregistrement du champ Couleur s'il n'est pas trouvé
// On utilise l'objet Blockly global pour récupérer la classe FieldColour
try {
    if (Blockly.FieldColour) {
        // On tente de l'enregistrer (si déjà fait, ça lèvera une erreur qu'on ignore)
        Blockly.fieldRegistry.register('field_colour', Blockly.FieldColour);
    }
} catch (e) {
    // Si l'erreur est "déjà enregistré", c'est parfait, on continue.
    // console.log("FieldColour déjà enregistré ou autre erreur non critique");
}

let isRegistered = false;

export const registerAllBlocks = () => {
  if (isRegistered) return;
  isRegistered = true;

  console.log("🏗️ Enregistrement global des blocs (V9 - Fix Infinity)...");
 
  // --- VARIABLES ---
  javascriptGenerator.forBlock['variables_set'] = (block) => `try { ${block.getField('VAR').getText()} = ${javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '0'}; actions.push({type: 'SET', id: "${block.id}", var: '${block.getField('VAR').getText()}', val: ${block.getField('VAR').getText()}}); } catch(e) { console.error(e); }\n`;
  if (!Blockly.Blocks['text_print']) { Blockly.defineBlocksWithJsonArray([{ "type": "text_print", "message0": "afficher %1", "args0": [{ "type": "input_value", "name": "TEXT" }], "previousStatement": null, "nextStatement": null, "colour": 160 }]); }
  javascriptGenerator.forBlock['text_print'] = (block) => `actions.push({type: 'PRINT', id: "${block.id}", msg: ${javascriptGenerator.valueToCode(block, 'TEXT', javascriptGenerator.ORDER_NONE) || "''"}});\n`;
  if (!Blockly.Blocks['system_var_get']) { Blockly.Blocks['system_var_get'] = { init: function() { this.jsonInit({ "message0": "%1", "args0": [{ "type": "field_label_serializable", "name": "VAR_NAME", "text": "VAR" }], "output": null, "colour": 60, "editable": false }); } }; }
  javascriptGenerator.forBlock['system_var_get'] = (block) => [block.getField('VAR_NAME').getText(), javascriptGenerator.ORDER_ATOMIC];

  // --- LISTES ---
  const getListIndex = (block, listName) => { const where = block.getFieldValue('WHERE') || 'FROM_START'; let at = '0'; switch (where) { case 'FIRST': at = '0'; break; case 'LAST': at = `${listName}.length - 1`; break; case 'FROM_START': at = String(javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1').match(/^\d+$/) ? parseInt(javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1', 10) - 1 : `(${javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1'} - 1)`; break; case 'FROM_END': at = `${listName}.length - ${javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1'}`; break; case 'RANDOM': at = `Math.floor(Math.random() * ${listName}.length)`; break; } return at; };
  javascriptGenerator.forBlock['lists_create_with'] = (block) => { const elements = new Array(block.itemCount_); for (let i = 0; i < block.itemCount_; i++) { elements[i] = javascriptGenerator.valueToCode(block, 'ADD' + i, javascriptGenerator.ORDER_NONE) || '0'; } return ['[' + elements.join(', ') + ']', javascriptGenerator.ORDER_ATOMIC]; };
  javascriptGenerator.forBlock['lists_getIndex'] = (block) => [`${javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]'}[${getListIndex(block, javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]')}]`, javascriptGenerator.ORDER_MEMBER];
  javascriptGenerator.forBlock['lists_setIndex'] = (block) => `${javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]'}[${getListIndex(block, javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]')}] = ${javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_ASSIGNMENT) || 'null'};\nactions.push({type: 'SET', id: "${block.id}", var: '${javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]'}', val: ${javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]'}});\n`;
  javascriptGenerator.forBlock['lists_length'] = (block) => [`${javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]'}.length`, javascriptGenerator.ORDER_MEMBER];
};