import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

// Variable pour éviter les doubles chargements (Warnings)
let isRegistered = false;

export const registerAllBlocks = () => {
  if (isRegistered) return;
  isRegistered = true;

  console.log("🏗️ Enregistrement global des blocs (Design v2)...");

  // --- 1. MAZE ---
  Blockly.defineBlocksWithJsonArray([
    {
      "type": "maze_move_forward", 
      "message0": "Avancer ✥", // Icône Move
      "previousStatement": null, 
      "nextStatement": null, 
      "colour": 160,
      "tooltip": "Avance d'une case dans la direction actuelle"
    },
    {
      "type": "maze_turn", 
      "message0": "Pivoter %1 🗘", // Icône Refresh/Rotation
      "args0": [
        { "type": "field_dropdown", "name": "DIR", "options": [["à gauche ↺", "LEFT"], ["à droite ↻", "RIGHT"]] }
      ],
      "previousStatement": null, 
      "nextStatement": null, 
      "colour": 160
    }
  ]);
  
  javascriptGenerator.forBlock['maze_move_forward'] = (block) => 
    `actions.push({type: "MOVE", id: "${block.id}"});\n`;
  
  javascriptGenerator.forBlock['maze_turn'] = (block) => {
    const dir = block.getFieldValue('DIR');
    return `actions.push({type: "TURN_${dir}", id: "${block.id}"});\n`;
  };

  // --- 2. TURTLE ---
  Blockly.defineBlocksWithJsonArray([
    {
      "type": "turtle_move", 
      "message0": "avancer ✥ de %1", // Cohérence avec Maze
      "args0": [{ "type": "input_value", "name": "VALUE", "check": "Number" }],
      "previousStatement": null, "nextStatement": null, "colour": 160
    },
    {
      "type": "turtle_turn", 
      "message0": "pivoter à %1 de %2 degrés 🗘", // Cohérence avec Maze
      "args0": [
        { "type": "field_dropdown", "name": "DIR", "options": [["↺ gauche", "LEFT"], ["↻ droite", "RIGHT"]] },
        { "type": "input_value", "name": "VALUE", "check": "Number" }
      ],
      "previousStatement": null, "nextStatement": null, "colour": 160
    },
    {
      "type": "turtle_pen", "message0": "stylo %1",
      "args0": [ { "type": "field_dropdown", "name": "STATE", "options": [["levé ⬆️", "UP"], ["baissé ⬇️", "DOWN"]] } ],
      "previousStatement": null, "nextStatement": null, "colour": 160
    },
    {
      "type": "turtle_color", "message0": "couleur %1",
      "args0": [{ "type": "field_colour", "name": "COLOR", "colour": "#ff0000" }],
      "previousStatement": null, "nextStatement": null, "colour": 160
    }
  ]);

  javascriptGenerator.forBlock['turtle_move'] = (block) => {
    const val = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '0';
    return `actions.push({type: 'MOVE', id: "${block.id}", dist: ${val}});\n`;
  };
  
  javascriptGenerator.forBlock['turtle_turn'] = (block) => {
    const dir = block.getFieldValue('DIR');
    const val = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '0';
    const angle = dir === 'LEFT' ? val : `-${val}`;
    return `actions.push({type: 'TURN', id: "${block.id}", angle: ${angle}});\n`;
  };
  
  javascriptGenerator.forBlock['turtle_pen'] = (block) => 
    `actions.push({type: 'PEN', id: "${block.id}", state: '${block.getFieldValue('STATE')}'});\n`;
  
  javascriptGenerator.forBlock['turtle_color'] = (block) => 
    `actions.push({type: 'COLOR', id: "${block.id}", color: '${block.getFieldValue('COLOR')}'});\n`;

  // --- 3. STANDARDS ---
  javascriptGenerator.forBlock['variables_set'] = (block) => {
    const argument0 = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '0';
    const varName = block.getField('VAR').getText();
    return `try { ${varName} = ${argument0}; actions.push({type: 'SET', id: "${block.id}", var: '${varName}', val: ${varName}}); } catch(e) { console.error(e); }\n`;
  };

  if (!Blockly.Blocks['text_print']) {
    Blockly.defineBlocksWithJsonArray([{
      "type": "text_print", "message0": "afficher %1", "args0": [{ "type": "input_value", "name": "TEXT" }],
      "previousStatement": null, "nextStatement": null, "colour": 160
    }]);
  }
  javascriptGenerator.forBlock['text_print'] = (block) => {
    const msg = javascriptGenerator.valueToCode(block, 'TEXT', javascriptGenerator.ORDER_NONE) || "''";
    return `actions.push({type: 'PRINT', id: "${block.id}", msg: ${msg}});\n`;
  };

  if (!Blockly.Blocks['system_var_get']) {
    Blockly.Blocks['system_var_get'] = {
        init: function() {
            this.jsonInit({ "message0": "%1", "args0": [{ "type": "field_label_serializable", "name": "VAR_NAME", "text": "VAR" }], "output": null, "colour": 60, "editable": false });
        }
    };
  }
  javascriptGenerator.forBlock['system_var_get'] = (block) => [block.getField('VAR_NAME').getText(), javascriptGenerator.ORDER_ATOMIC];

  // Listes
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
      return `${list}[${at}] = ${value};\nactions.push({type: 'SET', id: "${block.id}", var: '${list}', val: ${list}});\n`;
  };
  javascriptGenerator.forBlock['lists_length'] = (block) => {
      const list = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]';
      return [`${list}.length`, javascriptGenerator.ORDER_MEMBER];
  };
};