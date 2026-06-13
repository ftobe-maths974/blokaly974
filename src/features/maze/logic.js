import Runner from './Runner';
import { MAZE_CONFIG } from './config';

const ICON_RADAR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIzIiBmaWxsPSJ3aGl0ZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEwIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9IjAuNSI+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0iciIgZnJvbT0iMyIgdG89IjEwIiBkdXI9IjEuNXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgZnJvbT0iMSIgdG89IjAiIGR1cj0iMS41cyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz48L2NpcmNsZT48L3N2Zz4=";

let isRegistered = false;

export const MazePlugin = {
  id: 'MAZE',
  RenderComponent: Runner,

  registerBlocks: (Blockly, javascriptGenerator) => {
    if (isRegistered) return;
    isRegistered = true;
    console.log("🏰 Enregistrement blocs MAZE...");

    const blocks = [
      {
        // Bloc-chapeau « départ du programme » : même vert que le bouton ▶️ Exécuter.
        // Hat (pas de previousStatement). Seuls les blocs accrochés DESSOUS s'exécutent.
        "type": "program_start",
        "message0": "▶️ Exécuter",
        "nextStatement": null,
        "colour": "#27ae60",
        "tooltip": "Le départ du programme : accroche tes blocs sous ce bloc."
      },
      {
        "type": "maze_move_forward",
        "message0": "avancer",
        "previousStatement": null,
        "nextStatement": null,
        "colour": 290,
        "tooltip": "Avance le personnage d'une case."
      },
      // ... (Les définitions de blocs ne changent pas, copie-les de ton ancien fichier)
      {
        "type": "maze_turn",
        "message0": "tourner à %1",
        "args0": [ { "type": "field_dropdown", "name": "DIR", "options": [["gauche", "LEFT"], ["droite", "RIGHT"]] } ],
        "previousStatement": null, "nextStatement": null, "colour": 290
      },
      {
        "type": "maze_if",
        "message0": "si chemin %1 %2 %3 faire %4",
        "args0": [
          { "type": "field_dropdown", "name": "DIR", "options": [["devant", "AHEAD"], ["à gauche", "LEFT"], ["à droite", "RIGHT"]] },
          { "type": "field_image", "src": ICON_RADAR, "width": 15, "height": 15, "alt": "*" },
          { "type": "input_dummy" },
          { "type": "input_statement", "name": "DO" }
        ],
        "previousStatement": null, "nextStatement": null, "colour": 210
      },
      {
        "type": "maze_if_else",
        "message0": "si chemin %1 %2 %3 faire %4 sinon %5",
        "args0": [
          { "type": "field_dropdown", "name": "DIR", "options": [["devant", "AHEAD"], ["à gauche", "LEFT"], ["à droite", "RIGHT"]] },
          { "type": "field_image", "src": ICON_RADAR, "width": 15, "height": 15, "alt": "*" },
          { "type": "input_dummy" },
          { "type": "input_statement", "name": "DO" },
          { "type": "input_statement", "name": "ELSE" }
        ],
        "previousStatement": null, "nextStatement": null, "colour": 210
      },
      {
        "type": "maze_forever",
        "message0": "répéter jusqu'à l'arrivée %1 %2",
        "args0": [ { "type": "input_dummy" }, { "type": "input_statement", "name": "DO" } ],
        "previousStatement": null, "colour": 120
      }
    ];

    Blockly.common.defineBlocksWithJsonArray(blocks);

    // --- GÉNÉRATEURS ---
    // Le chapeau n'émet rien lui-même : sa pile « suivante » est ajoutée par scrub_.
    javascriptGenerator.forBlock['program_start'] = () => '';
    javascriptGenerator.forBlock['maze_move_forward'] = (b) => `actions.push({type: 'MOVE', id: '${b.id}'}); api.move();\n`;
    javascriptGenerator.forBlock['maze_turn'] = (b) => `actions.push({type: 'TURN_${b.getFieldValue('DIR')}', id: '${b.id}'}); api.turn('${b.getFieldValue('DIR')}');\n`;
    javascriptGenerator.forBlock['maze_if'] = (b) => `actions.push({type: 'SCAN', dir: '${b.getFieldValue('DIR')}', id: '${b.id}'}); if (api.isPath('${b.getFieldValue('DIR')}')) {\n${javascriptGenerator.statementToCode(b, 'DO')}}\n`;
    javascriptGenerator.forBlock['maze_if_else'] = (b) => `actions.push({type: 'SCAN', dir: '${b.getFieldValue('DIR')}', id: '${b.id}'}); if (api.isPath('${b.getFieldValue('DIR')}')) {\n${javascriptGenerator.statementToCode(b, 'DO')}} else {\n${javascriptGenerator.statementToCode(b, 'ELSE')}}\n`;
    javascriptGenerator.forBlock['maze_forever'] = (b) => `while (!api.isDone() && api.safeCheck()) {\n actions.push({type: 'LOOP_CHECK', id: '${b.id}'});\n${javascriptGenerator.statementToCode(b, 'DO')}}\n`;
  },

  getToolboxXML: (allowedBlocks) => {
    // 1. Définition complète des blocs disponibles pour ce plugin
    const allBlocks = [
      { type: 'maze_move_forward', xml: '<block type="maze_move_forward"></block>' },
      { type: 'maze_turn', xml: '<block type="maze_turn"><field name="DIR">LEFT</field></block><block type="maze_turn"><field name="DIR">RIGHT</field></block>' },
      { type: 'maze_if', xml: '<block type="maze_if"><field name="DIR">AHEAD</field></block>' },
      { type: 'maze_if_else', xml: '<block type="maze_if_else"><field name="DIR">AHEAD</field></block>' },
      { type: 'maze_forever', xml: '<block type="maze_forever"></block>' }
    ];

    let xml = '<category name="Labyrinthe" colour="#5C81A6">';
    
    allBlocks.forEach(b => {
        // Si allowedBlocks est null (Mode Prof/Solution), on affiche tout.
        // Sinon, on affiche seulement si c'est dans la liste.
        if (!allowedBlocks || allowedBlocks.includes(b.type)) {
            xml += b.xml;
        }
    });

    xml += '</category>';
    return xml;
  },

  getCategory: () => 'Labyrinthe',

  // Garantit le bloc-chapeau « Exécuter » : toujours présent, non supprimable,
  // unique. Si absent (niveau d'avant le chapeau), on le crée et on MIGRE les
  // piles existantes en les accrochant dessous. Appelé après chaque chargement
  // d'espace de travail (runner élève + éditeur prof).
  ensureStartBlock: (workspace) => {
    if (!workspace || !workspace.getBlocksByType) return null;
    const existing = workspace.getBlocksByType('program_start', false);
    let hat = existing[0];
    if (!hat) {
      hat = workspace.newBlock('program_start');
      if (hat.initSvg) hat.initSvg();
      if (hat.moveBy) hat.moveBy(24, 24);
      // Migration : accrocher les piles libres existantes SOUS le chapeau, en ordre.
      const tops = workspace.getTopBlocks(true).filter((b) => b !== hat && b.previousConnection);
      let tail = hat;
      for (const b of tops) {
        if (tail.nextConnection && b.previousConnection) {
          tail.nextConnection.connect(b.previousConnection);
          let last = b;
          while (last.getNextBlock && last.getNextBlock()) last = last.getNextBlock();
          tail = last;
        }
      }
      if (hat.render) hat.render();
    } else {
      // Un seul chapeau : on retire d'éventuels doublons (duplication manuelle).
      existing.slice(1).forEach((b) => b.dispose(true));
    }
    if (hat.setDeletable) hat.setDeletable(false); // non supprimable
    return hat;
  },

  executeStep: (currentState, action, levelData) => {
    // 1. Initialisation de l'état (Position de départ)
    const state = currentState || { 
        x: levelData.startPos?.x || 0, 
        y: levelData.startPos?.y || 0, 
        dir: levelData.startPos?.dir !== undefined ? levelData.startPos.dir : 1 
    };

    // 🛑 SÉCURITÉ CRITIQUE : Si aucune action n'est demandée (Initialisation), on renvoie l'état intact.
    // C'est ce qui manquait et causait le crash "Cannot read properties of null".
    if (!action) return { newState: state, status: 'RUNNING' };

    let { x, y, dir } = state;
    let status = 'RUNNING';
    
    const cmd = action.type || action;
    const normalizeDir = (d) => ((d % 4) + 4) % 4;

    if (cmd === 'MOVE') {
      let nextX = x, nextY = y;
      const effectiveDir = normalizeDir(dir);
      // 0=Est, 1=Sud, 2=Ouest, 3=Nord (Selon votre config)
      if (effectiveDir === 0) nextX++; 
      else if (effectiveDir === 1) nextY++; 
      else if (effectiveDir === 2) nextX--; 
      else if (effectiveDir === 3) nextY--; 
      
      const moveStatus = MAZE_CONFIG.checkMove(levelData.grid || MAZE_CONFIG.defaultGrid, nextX, nextY);

      if (moveStatus === 'OK' || moveStatus === 'WIN') {
          x = nextX;
          y = nextY;
          if (moveStatus === 'WIN') status = 'WIN';
      } else if (moveStatus === 'DANGER') {
          // Franchissable mais fatal : on AVANCE sur la case piège, puis c'est perdu.
          x = nextX;
          y = nextY;
          status = 'LOST';
      } else {
          status = 'LOST';
      }
    } 
    else if (cmd && typeof cmd === 'string' && cmd.startsWith('TURN_')) {
      dir = (cmd.includes('LEFT')) ? dir - 1 : dir + 1;
    }

    return { newState: { x, y, dir }, status };
  }
};