// Gardien pour éviter la double-inscription
let isRegistered = false;

export const TurtleLogic = {
  registerBlocks: (Blockly, javascriptGenerator) => {
    if (isRegistered) return;
    isRegistered = true;
    console.log("🐢 Enregistrement des blocs TORTUE...");

    const blocks = [
      {
        "type": "turtle_move",
        "message0": "avancer ✥ de %1 pas",
        "args0": [{ "type": "input_value", "name": "VALUE", "check": "Number" }],
        "previousStatement": null, "nextStatement": null, "colour": 160,
        "tooltip": "Avance la tortue dans sa direction actuelle."
      },
      {
        "type": "turtle_turn",
        "message0": "pivoter %1 de %2 degrés 🗘",
        "args0": [
          { "type": "field_dropdown", "name": "DIR", "options": [["↺ gauche", "LEFT"], ["↻ droite", "RIGHT"]] },
          { "type": "input_value", "name": "VALUE", "check": "Number" }
        ],
        "previousStatement": null, "nextStatement": null, "colour": 160,
        "tooltip": "Fait tourner la tortue sur elle-même."
      },
      {
        "type": "turtle_pen",
        "message0": "stylo %1",
        "args0": [
          { "type": "field_dropdown", "name": "STATE", "options": [["levé ⬆️", "UP"], ["baissé ⬇️", "DOWN"]] }
        ],
        "previousStatement": null, "nextStatement": null, "colour": 160
      },
      {
        "type": "turtle_color",
        "message0": "couleur %1",
        "args0": [{ "type": "field_colour", "name": "COLOR", "colour": "#ff0000" }],
        "previousStatement": null, "nextStatement": null, "colour": 160
      }
    ];

    Blockly.common.defineBlocksWithJsonArray(blocks);

    // --- GÉNÉRATEURS ---
    javascriptGenerator.forBlock['turtle_move'] = (block) => {
      const val = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '0';
      return `actions.push({type: 'MOVE', id: "${block.id}", dist: ${val}}); api.move(${val});\n`;
    };
    javascriptGenerator.forBlock['turtle_turn'] = (block) => {
      const val = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '0';
      const dir = block.getFieldValue('DIR') === 'LEFT' ? '-' : ''; // Gauche = angle négatif ou positif selon convention, ici on gère dans executeStep
      return `actions.push({type: 'TURN', id: "${block.id}", angle: ${dir}${val}}); api.turn(${dir}${val});\n`;
    };
    javascriptGenerator.forBlock['turtle_pen'] = (block) => {
      return `actions.push({type: 'PEN', id: "${block.id}", state: '${block.getFieldValue('STATE')}'}); api.pen('${block.getFieldValue('STATE')}');\n`;
    };
    javascriptGenerator.forBlock['turtle_color'] = (block) => {
      return `actions.push({type: 'COLOR', id: "${block.id}", color: '${block.getFieldValue('COLOR')}'}); api.color('${block.getFieldValue('COLOR')}');\n`;
    };
  },

  getToolboxXML: () => `
    <category name="Tortue" colour="#4a90e2">
        <block type="turtle_move"><value name="VALUE"><shadow type="math_number"><field name="NUM">50</field></shadow></value></block>
        <block type="turtle_turn"><value name="VALUE"><shadow type="math_number"><field name="NUM">90</field></shadow></value></block>
        <block type="turtle_pen"><field name="STATE">UP</field></block>
        <block type="turtle_pen"><field name="STATE">DOWN</field></block>
        <block type="turtle_color"></block>
    </category>
  `,

  executeStep: (currentState, action, levelData) => {
    const state = currentState || { 
      x: levelData.startPos?.x || 0, 
      y: levelData.startPos?.y || 0, 
      dir: levelData.startPos?.dir !== undefined ? levelData.startPos.dir : 0,
      penDown: true, 
      color: '#2c3e50', 
      lines: [] 
    };
    
    // Si c'est juste une action visuelle (comme un scan dans maze, mais pas utilisé ici), on ignore
    if (!action.type) return { newState: state, status: 'RUNNING' };

    let { x, y, dir, penDown, color, lines } = state;
    const newLines = [...lines];

    if (action.type === 'MOVE') {
      const dist = parseFloat(action.dist || 0);
      const rad = (dir - 90) * (Math.PI / 180); // -90 car 0° est souvent vers le haut/droite, ajuster selon convention math
      // Convention : 0 = Est (Droite). Dans Canvas : 0 = Droite.
      // Mais attention, dans TurtleEditor on a : 0=Est, 90=Sud.
      // Utilisons la convention standard Canvas : 0 rad = Droite (Est).
      
      // Rectification : Dans les blocs précédents, startPos.dir était en degrés.
      // Si 0 = Est, alors :
      const rads = dir * (Math.PI / 180);
      const finalX = x + dist * Math.cos(rads);
      const finalY = y - dist * Math.sin(rads); // Y inversé dans un repère math standard vs canvas, on gère ça au rendu
      // Note: On stocke des coordonnées "Logiques". Le rendu fera la conversion Y.
      
      if (penDown) newLines.push({ x1: x, y1: y, x2: finalX, y2: finalY, color });
      x = finalX;
      y = finalY;
    } 
    else if (action.type === 'TURN') { 
        // angle est déjà signé par le générateur (-90 pour gauche, +90 pour droite ou inversement)
        // Ici : Left = - , Right = + (selon générateur ci-dessus : Left = '-' + val)
        // Si on veut tourner à gauche (sens trigo), on AJOUTE l'angle. Si sens horaire, on SOUSTRAIT.
        // Générateur : LEFT -> -90. 
        // Si on est à 0 (Est) et on tourne à gauche (-90), on va à -90 (Nord ?).
        // Convention habituelle : Est=0, Nord=90, Ouest=180.
        // On va dire : Angle += action.angle.
        dir -= parseFloat(action.angle); 
    }
    else if (action.type === 'PEN') penDown = (action.state === 'DOWN');
    else if (action.type === 'COLOR') color = action.color;

    return { newState: { x, y, dir, penDown, color, lines: newLines }, status: 'RUNNING' };
  }
};