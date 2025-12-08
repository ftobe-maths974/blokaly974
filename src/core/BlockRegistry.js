import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

// --- CORRECTIF VITAL POUR VITE / BLOCKLY ---
try {
    if (Blockly.FieldColour) {
        // On check si déjà enregistré pour éviter l'erreur
        if (!Blockly.fieldRegistry.registry['field_colour']) {
            Blockly.fieldRegistry.register('field_colour', Blockly.FieldColour);
        }
    }
} catch (e) {}

let isRegistered = false;

export const registerAllBlocks = () => {
  if (isRegistered) return;
  isRegistered = true;

  console.log("🧹 Nettoyage et 🏗️ Enregistrement des blocs SYSTÈME...");

  // MODIFICATION ICI : On ne nettoie QUE les blocs système
  const blocksToClean = [
      'variables_set', 'text_print', 'system_var_get',
      'lists_create_with', 'lists_getIndex', 'lists_setIndex', 'lists_length'
      // J'ai RETIRÉ : maze_*, turtle_*, equation_*
  ];

  blocksToClean.forEach(b => {
      delete Blockly.Blocks[b];
      if (javascriptGenerator.forBlock) delete javascriptGenerator.forBlock[b];
  });

  blocksToClean.forEach(b => {
      delete Blockly.Blocks[b];
      delete javascriptGenerator.forBlock[b];
  });

  // --- 2. TURTLE (À migrer plus tard, mais on garde pour compatibilité si besoin) ---
  // (Si vous avez migré Turtle, vous pouvez commenter ce bloc, sinon gardez-le)
  /*
  Blockly.defineBlocksWithJsonArray([
    { "type": "turtle_move", "message0": "avancer ✥ de %1 pas", "args0": [{ "type": "input_value", "name": "VALUE", "check": "Number" }], "previousStatement": null, "nextStatement": null, "colour": 160 },
    { "type": "turtle_turn", "message0": "pivoter %1 de %2 degrés 🗘", "args0": [ { "type": "field_dropdown", "name": "DIR", "options": [["↺ gauche", "LEFT"], ["↻ droite", "RIGHT"]] }, { "type": "input_value", "name": "VALUE", "check": "Number" } ], "previousStatement": null, "nextStatement": null, "colour": 160 },
    { "type": "turtle_pen", "message0": "stylo %1", "args0": [ { "type": "field_dropdown", "name": "STATE", "options": [["levé ⬆️", "UP"], ["baissé ⬇️", "DOWN"]] } ], "previousStatement": null, "nextStatement": null, "colour": 160 },
    { "type": "turtle_color", "message0": "couleur %1", "args0": [{ "type": "field_colour", "name": "COLOR", "colour": "#ff0000" }], "previousStatement": null, "nextStatement": null, "colour": 160 }
  ]);
  */
  // NOTE: Comme Turtle est migré dans features/turtle, on ne le définit plus ici !

  // --- VARIABLES & SYSTÈME ---
  // On redéfinit variables_set pour ajouter le try/catch
  Blockly.Blocks['variables_set'] = {
      init: function() {
          this.jsonInit({
              "message0": "%{BKY_VARIABLES_SET}",
              "args0": [
                  { "type": "field_variable", "name": "VAR", "variable": "%{BKY_VARIABLES_DEFAULT_NAME}" },
                  { "type": "input_value", "name": "VALUE" }
              ],
              "previousStatement": null,
              "nextStatement": null,
              "style": "variable_blocks",
              "tooltip": "%{BKY_VARIABLES_SET_TOOLTIP}",
              "helpUrl": "%{BKY_VARIABLES_SET_HELPURL}"
          });
      }
  };
  
  javascriptGenerator.forBlock['variables_set'] = (block) => {
      const argument0 = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || '0';
      const varName = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
      return `try { ${varName} = ${argument0}; actions.push({type: 'SET', id: "${block.id}", var: '${varName}', val: ${varName}}); } catch(e) { console.error(e); }\n`;
  };

  if (!Blockly.Blocks['text_print']) { 
      Blockly.defineBlocksWithJsonArray([{ "type": "text_print", "message0": "afficher %1", "args0": [{ "type": "input_value", "name": "TEXT" }], "previousStatement": null, "nextStatement": null, "colour": 160 }]); 
  }
  javascriptGenerator.forBlock['text_print'] = (block) => `actions.push({type: 'PRINT', id: "${block.id}", msg: ${javascriptGenerator.valueToCode(block, 'TEXT', javascriptGenerator.ORDER_NONE) || "''"}});\n`;

  if (!Blockly.Blocks['system_var_get']) { 
      Blockly.Blocks['system_var_get'] = { init: function() { this.jsonInit({ "message0": "%1", "args0": [{ "type": "field_label_serializable", "name": "VAR_NAME", "text": "VAR" }], "output": null, "colour": 60, "editable": false }); } }; 
  }
  javascriptGenerator.forBlock['system_var_get'] = (block) => [block.getField('VAR_NAME').getText(), javascriptGenerator.ORDER_ATOMIC];

  // --- LISTES ---
  // On écrase les générateurs de listes par défaut pour ajouter l'enregistrement des actions
  const getListIndex = (block, listName) => { const where = block.getFieldValue('WHERE') || 'FROM_START'; let at = '0'; switch (where) { case 'FIRST': at = '0'; break; case 'LAST': at = `${listName}.length - 1`; break; case 'FROM_START': at = String(javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1').match(/^\d+$/) ? parseInt(javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1', 10) - 1 : `(${javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1'} - 1)`; break; case 'FROM_END': at = `${listName}.length - ${javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1'}`; break; case 'RANDOM': at = `Math.floor(Math.random() * ${listName}.length)`; break; } return at; };
  
  javascriptGenerator.forBlock['lists_create_with'] = (block) => { const elements = new Array(block.itemCount_); for (let i = 0; i < block.itemCount_; i++) { elements[i] = javascriptGenerator.valueToCode(block, 'ADD' + i, javascriptGenerator.ORDER_NONE) || '0'; } return ['[' + elements.join(', ') + ']', javascriptGenerator.ORDER_ATOMIC]; };
  
  javascriptGenerator.forBlock['lists_getIndex'] = (block) => [`${javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]'}[${getListIndex(block, javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]')}]`, javascriptGenerator.ORDER_MEMBER];
  
  javascriptGenerator.forBlock['lists_setIndex'] = (block) => {
      const listName = javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]';
      const value = javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
      const index = getListIndex(block, listName);
      return `${listName}[${index}] = ${value};\nactions.push({type: 'SET', id: "${block.id}", var: '${listName}', val: ${listName}});\n`;
  };
  
  javascriptGenerator.forBlock['lists_length'] = (block) => [`${javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]'}.length`, javascriptGenerator.ORDER_MEMBER];
};