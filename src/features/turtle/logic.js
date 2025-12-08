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
      // GAUCHE (LEFT) = Angle POSITIF (Sens trigo)
      // DROITE (RIGHT) = Angle NÉGATIF
      const sign = block.getFieldValue('DIR') === 'LEFT' ? '' : '-'; 
      return `actions.push({type: 'TURN', id: "${block.id}", angle: ${sign}${val}}); api.turn(${sign}${val});\n`;
    };

    javascriptGenerator.forBlock['turtle_pen'] = (block) => {
      return `actions.push({type: 'PEN', id: "${block.id}", state: '${block.getFieldValue('STATE')}'}); api.pen('${block.getFieldValue('STATE')}');\n`;
    };

    javascriptGenerator.forBlock['turtle_color'] = (block) => {
      return `actions.push({type: 'COLOR', id: "${block.id}", color: '${block.getFieldValue('COLOR')}'}); api.color('${block.getFieldValue('COLOR')}');\n`;
    };
  },

  // 👇 Mise à jour du toolbox builder
  getToolboxXML: (allowedBlocks) => {
    const allBlocks = [
        { type: 'turtle_move', xml: '<block type="turtle_move"><value name="VALUE"><shadow type="math_number"><field name="NUM">50</field></shadow></value></block>' },
        { type: 'turtle_turn', xml: '<block type="turtle_turn"><value name="VALUE"><shadow type="math_number"><field name="NUM">90</field></shadow></value></block>' },
        { type: 'turtle_pen', xml: '<block type="turtle_pen"><field name="STATE">UP</field></block><block type="turtle_pen"><field name="STATE">DOWN</field></block>' },
        { type: 'turtle_color', xml: '<block type="turtle_color"></block>' }
    ];

    let xml = '<category name="Tortue" colour="#4a90e2">';
    allBlocks.forEach(b => {
        if (!allowedBlocks || allowedBlocks.includes(b.type)) {
            xml += b.xml;
        }
    });
    xml += '</category>';
    return xml;
  },

  executeStep: (currentState, action, levelData) => {
    // 1. Initialisation robuste
    const state = currentState || { 
      x: levelData.startPos?.x || 0, 
      y: levelData.startPos?.y || 0, 
      dir: levelData.startPos?.dir || 0, // Défaut à 0 (Est)
      penDown: true, 
      color: '#2c3e50', 
      lines: [] 
    };
    
    if (!action.type) return { newState: state, status: 'RUNNING' };

    let { x, y, dir, penDown, color, lines } = state;
    const newLines = [...lines];

    if (action.type === 'MOVE') {
      const dist = parseFloat(action.dist || 0);
      const rad = dir * (Math.PI / 180); // Conversion Degrés -> Radians
      
      const finalX = x + dist * Math.cos(rad);
      const finalY = y + dist * Math.sin(rad); // +sin car on est en repère Math (Haut = +)
      
      if (penDown) newLines.push({ x1: x, y1: y, x2: finalX, y2: finalY, color });
      x = finalX;
      y = finalY;
    } 
    else if (action.type === 'TURN') { 
        dir += parseFloat(action.angle); // Angle signé (+90 ou -90)
    }
    // ... (Reste Pen/Color inchangé)

    return { newState: { x, y, dir, penDown, color, lines: newLines }, status: 'RUNNING' };
  },
};