import Runner from './Runner';
import { MAZE_CONFIG } from './config';

// Icône radar (Base64)
const ICON_RADAR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIzIiBmaWxsPSJ3aGl0ZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEwIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9IjAuNSI+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0iciIgZnJvbT0iMyIgdG89IjEwIiBkdXI9IjEuNXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgZnJvbT0iMSIgdG89IjAiIGR1cj0iMS41cyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz48L2NpcmNsZT48L3N2Zz4=";

// --- GARDIEN ANTI-DOUBLON ---
let isRegistered = false;

export const MazePlugin = {
  id: 'MAZE',
  RenderComponent: Runner,

  registerBlocks: (Blockly, javascriptGenerator) => {
    // Si déjà enregistré, on ne fait rien !
    if (isRegistered) return;
    isRegistered = true;

    console.log("🏰 Enregistrement des blocs MAZE...");

    const blocks = [
      // 1. AVANCER
      {
        "type": "maze_move_forward",
        "message0": "avancer",
        "previousStatement": null,
        "nextStatement": null,
        "colour": 290,
        "tooltip": "Avance le personnage d'une case."
      },
      // 2. TOURNER
      {
        "type": "maze_turn",
        "message0": "tourner à %1",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "DIR", 
            "options": [["gauche", "LEFT"], ["droite", "RIGHT"]]
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 290,
        "tooltip": "Tourne le personnage de 90 degrés."
      },
      // 3. SI CHEMIN
      {
        "type": "maze_if",
        "message0": "si chemin %1 %2 %3 faire %4",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "DIR",
            "options": [["devant", "AHEAD"], ["à gauche", "LEFT"], ["à droite", "RIGHT"]]
          },
          { "type": "field_image", "src": ICON_RADAR, "width": 15, "height": 15, "alt": "*" },
          { "type": "input_dummy" },
          { "type": "input_statement", "name": "DO" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 210,
        "tooltip": "Exécute si un chemin existe."
      },
      // 4. SI CHEMIN SINON
      {
        "type": "maze_if_else",
        "message0": "si chemin %1 %2 %3 faire %4 sinon %5",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "DIR",
            "options": [["devant", "AHEAD"], ["à gauche", "LEFT"], ["à droite", "RIGHT"]]
          },
          { "type": "field_image", "src": ICON_RADAR, "width": 15, "height": 15, "alt": "*" },
          { "type": "input_dummy" },
          { "type": "input_statement", "name": "DO" },
          { "type": "input_statement", "name": "ELSE" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 210,
        "tooltip": "Exécute si un chemin existe, sinon exécute l'autre bloc."
      },
      // 5. BOUCLE FOREVER
      {
        "type": "maze_forever",
        "message0": "répéter jusqu'à l'arrivée %1 %2",
        "args0": [
          { "type": "input_dummy" },
          { "type": "input_statement", "name": "DO" }
        ],
        "previousStatement": null,
        "colour": 120,
        "tooltip": "Boucle jusqu'à la fin du niveau."
      }
    ];

    Blockly.common.defineBlocksWithJsonArray(blocks);

    // --- GÉNÉRATEURS JS ---

    javascriptGenerator.forBlock['maze_move_forward'] = function(block) {
      return `actions.push({type: 'MOVE', id: '${block.id}'}); api.move();\n`;
    };

    javascriptGenerator.forBlock['maze_turn'] = function(block) {
      const dir = block.getFieldValue('DIR');
      return `actions.push({type: 'TURN_${dir}', id: '${block.id}'}); api.turn('${dir}');\n`;
    };

    javascriptGenerator.forBlock['maze_if'] = function(block) {
      const dir = block.getFieldValue('DIR');
      const branch = javascriptGenerator.statementToCode(block, 'DO');
      return `actions.push({type: 'SCAN', dir: '${dir}', id: '${block.id}'}); if (api.isPath('${dir}')) {\n${branch}}\n`;
    };

    javascriptGenerator.forBlock['maze_if_else'] = function(block) {
      const dir = block.getFieldValue('DIR');
      const branch = javascriptGenerator.statementToCode(block, 'DO');
      const branchElse = javascriptGenerator.statementToCode(block, 'ELSE');
      return `actions.push({type: 'SCAN', dir: '${dir}', id: '${block.id}'}); if (api.isPath('${dir}')) {\n${branch}} else {\n${branchElse}}\n`;
    };

    javascriptGenerator.forBlock['maze_forever'] = function(block) {
      const branch = javascriptGenerator.statementToCode(block, 'DO');
      return `while (!api.isDone() && api.safeCheck()) {\n actions.push({type: 'LOOP_CHECK', id: '${block.id}'});\n${branch}}\n`;
    };
  },

  getToolboxXML: () => {
    return `
      <category name="Labyrinthe" colour="#5C81A6">
        <block type="maze_move_forward"></block>
        <block type="maze_turn"><field name="DIR">LEFT</field></block>
        <block type="maze_turn"><field name="DIR">RIGHT</field></block>
        <block type="maze_if"><field name="DIR">AHEAD</field></block>
        <block type="maze_if_else"><field name="DIR">AHEAD</field></block>
        <block type="maze_forever"></block>
      </category>
    `;
  },

  getCategory: () => { /* Optionnel */ },

  executeStep: (currentState, action, levelData) => {
    const state = currentState || { 
      x: levelData.startPos?.x || 0, 
      y: levelData.startPos?.y || 1, 
      dir: levelData.startPos?.dir !== undefined ? levelData.startPos.dir : 1 
    };
    
    let { x, y, dir } = state;
    let status = 'RUNNING';

    const cmd = (typeof action === 'object' && action.type) ? action.type : action;
    const normalizeDir = (d) => ((d % 4) + 4) % 4;

    if (cmd === 'MOVE') {
      let nextX = x, nextY = y;
      const effectiveDir = normalizeDir(dir);
      if (effectiveDir === 0) nextX++;      
      else if (effectiveDir === 1) nextY++; 
      else if (effectiveDir === 2) nextX--; 
      else if (effectiveDir === 3) nextY--; 
      
      const moveStatus = MAZE_CONFIG.checkMove(levelData.grid || MAZE_CONFIG.defaultGrid, nextX, nextY);
      if (moveStatus === 'OK' || moveStatus === 'WIN') {
        x = nextX; y = nextY;
        if (moveStatus === 'WIN') status = 'WIN';
      } else {
        status = 'LOST';
      }
    } else if (cmd && cmd.startsWith('TURN_')) {
      let side = 'RIGHT';
      if (cmd.includes('LEFT')) side = 'LEFT';
      dir = (side === 'LEFT') ? dir - 1 : dir + 1;
    }

    return { newState: { x, y, dir }, status };
  }
};