import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

// ICÔNES ANIMÉES (SVG en Base64)
const ICON_RADAR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIzIiBmaWxsPSJ3aGl0ZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEwIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9IjAuNSI+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0iciIgZnJvbT0iMyIgdG89IjEwIiBkdXI9IjEuNXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgZnJvbT0iMSIgdG89IjAiIGR1cj0iMS41cyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz48L2NpcmNsZT48L3N2Zz4=";
const ICON_FLAG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48cGF0aCBkPSZNMiwyIFYxOCBNMiwyIEgxMiBMOSw1IEwxMiw4IEgyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48L3N2Zz4=";

let isRegistered = false;

export const registerAllBlocks = () => {
  if (isRegistered) return;
  isRegistered = true;

  console.log("🏗️ Enregistrement global des blocs (V3 Animée)...");

  // --- 1. MAZE ---
  Blockly.defineBlocksWithJsonArray([
    {
      "type": "maze_move_forward", 
      "message0": "Avancer ✥",
      "previousStatement": null, "nextStatement": null, "colour": 160
    },
    {
      "type": "maze_turn", 
      "message0": "Pivoter %1 🗘",
      "args0": [ { "type": "field_dropdown", "name": "DIR", "options": [["à gauche ↺", "LEFT"], ["à droite ↻", "RIGHT"]] } ],
      "previousStatement": null, "nextStatement": null, "colour": 160
    },
    // --- RADAR ANIMÉ ---
    {
      "type": "maze_forever", 
      "message0": "Répéter jusqu'à %1 %2 %3",
      "args0": [
        { "type": "field_image", "src": ICON_FLAG, "width": 15, "height": 15, "alt": "Flag" },
        { "type": "input_dummy" }, 
        { "type": "input_statement", "name": "DO" }
      ],
      "previousStatement": null, "nextStatement": null, "colour": 120
    },
    {
      "type": "maze_if", 
      "message0": "Si chemin %1 %2 %3 faire %4",
      "args0": [
        { "type": "field_dropdown", "name": "DIR", "options": [["devant ⬆️", "AHEAD"], ["à gauche ↺", "LEFT"], ["à droite ↻", "RIGHT"]] },
        { "type": "field_image", "src": ICON_RADAR, "width": 15, "height": 15, "alt": "Radar" },
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "DO" }
      ],
      "previousStatement": null, "nextStatement": null, "colour": 210
    },
    {
      "type": "maze_if_else", 
      "message0": "Si chemin %1 %2 %3 faire %4 sinon %5",
      "args0": [
        { "type": "field_dropdown", "name": "DIR", "options": [["devant ⬆️", "AHEAD"], ["à gauche ↺", "LEFT"], ["à droite ↻", "RIGHT"]] },
        { "type": "field_image", "src": ICON_RADAR, "width": 15, "height": 15, "alt": "Radar" },
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "DO" },
        { "type": "input_statement", "name": "ELSE" }
      ],
      "previousStatement": null, "nextStatement": null, "colour": 210
    }
  ]);
  
  // GÉNÉRATEURS AVEC API
  javascriptGenerator.forBlock['maze_move_forward'] = (block) => 
    `actions.push({type: "MOVE", id: "${block.id}"}); api.move();\n`;
  
  javascriptGenerator.forBlock['maze_turn'] = (block) => {
    const dir = block.getFieldValue('DIR');
    return `actions.push({type: "TURN_${dir}", id: "${block.id}"}); api.turn('${dir}');\n`;
  };

  // --- MODIFICATION ICI : Action neutre "LOOP_CHECK" ---
  javascriptGenerator.forBlock['maze_forever'] = (block) => {
    const branch = javascriptGenerator.statementToCode(block, 'DO');
    // On ajoute une action LOOP_CHECK qui provoquera une pause visuelle + highlight
    // Mais comme le type n'est pas "SCAN", MazeRender n'affichera pas de radar.
    return `while (!api.isDone() && api.safeCheck()) {
      actions.push({type: "LOOP_CHECK", id: "${block.id}"}); 
      ${branch}
    }\n`;
  };

  javascriptGenerator.forBlock['maze_if'] = (block) => {
    const dir = block.getFieldValue('DIR');
    const branch = javascriptGenerator.statementToCode(block, 'DO');
    // Ici on garde SCAN car c'est un capteur, donc on veut le radar
    return `actions.push({type: "SCAN", dir: "${dir}", id: "${block.id}"}); if (api.isPath('${dir}')) {\n${branch}}\n`;
  };

  javascriptGenerator.forBlock['maze_if_else'] = (block) => {
    const dir = block.getFieldValue('DIR');
    const branch0 = javascriptGenerator.statementToCode(block, 'DO');
    const branch1 = javascriptGenerator.statementToCode(block, 'ELSE');
    // Ici aussi SCAN
    return `actions.push({type: "SCAN", dir: "${dir}", id: "${block.id}"}); if (api.isPath('${dir}')) {\n${branch0}} else {\n${branch1}}\n`;
  };

  // ... (Le reste du fichier pour Turtle et Standards reste inchangé) ...
  // Je remets les définitions Turtle pour être complet mais sans changement
  Blockly.defineBlocksWithJsonArray([
    { "type": "turtle_move", "message0": "avancer ✥ de %1", "args0": [{ "type": "input_value", "name": "VALUE", "check": "Number" }], "previousStatement": null, "nextStatement": null, "colour": 160 },
    { "type": "turtle_turn", "message0": "pivoter %1 de %2 degrés 🗘", "args0": [ { "type": "field_dropdown", "name": "DIR", "options": [["↺ gauche", "LEFT"], ["↻ droite", "RIGHT"]] }, { "type": "input_value", "name": "VALUE", "check": "Number" } ], "previousStatement": null, "nextStatement": null, "colour": 160 },
    { "type": "turtle_pen", "message0": "stylo %1", "args0": [ { "type": "field_dropdown", "name": "STATE", "options": [["levé ⬆️", "UP"], ["baissé ⬇️", "DOWN"]] } ], "previousStatement": null, "nextStatement": null, "colour": 160 },
    { "type": "turtle_color", "message0": "couleur %1", "args0": [{ "type": "field_colour", "name": "COLOR", "colour": "#ff0000" }], "previousStatement": null, "nextStatement": null, "colour": 160 }
  ]);

  javascriptGenerator.forBlock['turtle_move'] = (block) => `actions.push({type: 'MOVE', id: "${block.id}", dist: ${javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '0'}});\n`;
  javascriptGenerator.forBlock['turtle_turn'] = (block) => {
    const dir = block.getFieldValue('DIR');
    const val = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '0';
    return `actions.push({type: 'TURN', id: "${block.id}", angle: ${dir === 'LEFT' ? val : `-${val}`}});\n`;
  };
  javascriptGenerator.forBlock['turtle_pen'] = (block) => `actions.push({type: 'PEN', id: "${block.id}", state: '${block.getFieldValue('STATE')}'});\n`;
  javascriptGenerator.forBlock['turtle_color'] = (block) => `actions.push({type: 'COLOR', id: "${block.id}", color: '${block.getFieldValue('COLOR')}'});\n`;

  javascriptGenerator.forBlock['variables_set'] = (block) => {
    const argument0 = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '0';
    const varName = block.getField('VAR').getText();
    return `try { ${varName} = ${argument0}; actions.push({type: 'SET', id: "${block.id}", var: '${varName}', val: ${varName}}); } catch(e) { console.error(e); }\n`;
  };
  if (!Blockly.Blocks['text_print']) {
    Blockly.defineBlocksWithJsonArray([{ "type": "text_print", "message0": "afficher %1", "args0": [{ "type": "input_value", "name": "TEXT" }], "previousStatement": null, "nextStatement": null, "colour": 160 }]);
  }
  javascriptGenerator.forBlock['text_print'] = (block) => {
    const msg = javascriptGenerator.valueToCode(block, 'TEXT', javascriptGenerator.ORDER_NONE) || "''";
    return `actions.push({type: 'PRINT', id: "${block.id}", msg: ${msg}});\n`;
  };
  if (!Blockly.Blocks['system_var_get']) {
    Blockly.Blocks['system_var_get'] = { init: function() { this.jsonInit({ "message0": "%1", "args0": [{ "type": "field_label_serializable", "name": "VAR_NAME", "text": "VAR" }], "output": null, "colour": 60, "editable": false }); } };
  }
  javascriptGenerator.forBlock['system_var_get'] = (block) => [block.getField('VAR_NAME').getText(), javascriptGenerator.ORDER_ATOMIC];

  const getListIndex = (block, listName) => {
      const where = block.getFieldValue('WHERE') || 'FROM_START';
      let at = '0';
      switch (where) {
          case 'FIRST': at = '0'; break;
          case 'LAST': at = `${listName}.length - 1`; break;
          case 'FROM_START': at = String(javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1').match(/^\d+$/) ? parseInt(javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1', 10) - 1 : `(${javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1'} - 1)`; break;
          case 'FROM_END': at = `${listName}.length - ${javascriptGenerator.valueToCode(block, 'AT', javascriptGenerator.ORDER_NONE) || '1'}`; break;
          case 'RANDOM': at = `Math.floor(Math.random() * ${listName}.length)`; break;
      }
      return at;
  };
  javascriptGenerator.forBlock['lists_create_with'] = (block) => {
      const elements = new Array(block.itemCount_);
      for (let i = 0; i < block.itemCount_; i++) { elements[i] = javascriptGenerator.valueToCode(block, 'ADD' + i, javascriptGenerator.ORDER_NONE) || '0'; }
      return ['[' + elements.join(', ') + ']', javascriptGenerator.ORDER_ATOMIC];
  };
  javascriptGenerator.forBlock['lists_getIndex'] = (block) => [`${javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]'}[${getListIndex(block, javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]')}]`, javascriptGenerator.ORDER_MEMBER];
  javascriptGenerator.forBlock['lists_setIndex'] = (block) => `${javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]'}[${getListIndex(block, javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]')}] = ${javascriptGenerator.valueToCode(block, 'TO', javascriptGenerator.ORDER_ASSIGNMENT) || 'null'};\nactions.push({type: 'SET', id: "${block.id}", var: '${javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]'}', val: ${javascriptGenerator.valueToCode(block, 'LIST', javascriptGenerator.ORDER_MEMBER) || '[]'}});\n`;
  javascriptGenerator.forBlock['lists_length'] = (block) => [`${javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_MEMBER) || '[]'}.length`, javascriptGenerator.ORDER_MEMBER];
};