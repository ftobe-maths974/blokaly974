import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

export const registerStandardBlocks = () => {
  console.log("🔧 Initialisation des blocs standards (Core)...");

  // --- 1. VARIABLES (Sécurisées avec Try/Catch) ---
  javascriptGenerator.forBlock['variables_set'] = (block) => {
    const argument0 = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '0';
    const varName = block.getField('VAR').getText();
    return `
      try {
        ${varName} = ${argument0};
        actions.push({type: 'SET', var: '${varName}', val: ${varName}});
      } catch(e) { console.error(e); }
    \n`;
  };

  // --- 2. INTERACTIONS (Print) ---
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

  // --- 3. CONSTANTES SYSTÈME ---
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

  // --- 4. LISTES (Notre version robuste corrigée) ---
  const getListIndex = (block, listName) => {
    const where = block.getFieldValue('WHERE') || 'FROM_START';
    let at = '0';
    switch (where) {
      case 'FIRST': at = '0'; break;
      case 'LAST': at = `${listName}.length - 1`; break;
      case 'FROM_START': {
        const atInput = javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1';
        at = String(atInput).match(/^\d+$/) ? parseInt(atInput, 10) - 1 : `(${atInput} - 1)`;
        break;
      }
      case 'FROM_END': {
        const atInput = javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1';
        at = `${listName}.length - ${atInput}`;
        break;
      }
      case 'RANDOM': at = `Math.floor(Math.random() * ${listName}.length)`; break;
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
    return ['[' + elements.join(', ') + ']', javascriptGenerator.ORDER_ATOMIC];
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
    return `
      ${list}[${at}] = ${value};
      actions.push({type: 'SET', var: '${list}', val: ${list}});
    \n`;
  };

  javascriptGenerator.forBlock['lists_length'] = (block) => {
    const list = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]';
    return [`${list}.length`, javascriptGenerator.ORDER_MEMBER];
  };
};