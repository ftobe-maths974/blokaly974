import TurtleRender from '../components/runner/TurtleRender';
import { generateToolbox } from '../core/BlockDefinitions';

export const TurtlePlugin = {
  id: 'TURTLE',
  RenderComponent: TurtleRender,

  registerBlocks: (Blockly, javascriptGenerator) => {
    Blockly.defineBlocksWithJsonArray([
      {
        "type": "turtle_move", "message0": "avancer de %1",
        "args0": [{ "type": "input_value", "name": "VALUE", "check": "Number" }],
        "previousStatement": null, "nextStatement": null, "colour": 160
      },
      {
        "type": "turtle_turn", "message0": "tourner %1 de %2 degrés",
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

    javascriptGenerator.forBlock['turtle_move'] = (block) => `actions.push({type: 'MOVE', dist: ${javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '0'}});\n`;
    javascriptGenerator.forBlock['turtle_turn'] = (block) => {
      const dir = block.getFieldValue('DIR');
      const val = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ATOMIC) || '0';
      return `actions.push({type: 'TURN', angle: ${dir === 'LEFT' ? val : `-${val}`}});\n`;
    };
    javascriptGenerator.forBlock['turtle_pen'] = (block) => `actions.push({type: 'PEN', state: '${block.getFieldValue('STATE')}'});\n`;
    javascriptGenerator.forBlock['turtle_color'] = (block) => `actions.push({type: 'COLOR', color: '${block.getFieldValue('COLOR')}'});\n`;
  },

  getToolboxXML: (allowedBlocks) => generateToolbox(allowedBlocks, null, [], []),

  executeStep: (currentState, action, levelData) => {
    const state = currentState || { 
      x: levelData.startPos?.x || 0, y: levelData.startPos?.y || 0, dir: levelData.startPos?.dir || 0, 
      penDown: true, color: '#2c3e50', lines: [] 
    };
    
    let { x, y, dir, penDown, color, lines } = state;
    const newLines = [...lines];

    if (action.type === 'MOVE') {
      const dist = parseFloat(action.dist);
      const rad = dir * (Math.PI / 180);
      const newX = x + dist * Math.cos(rad);
      const newY = y + dist * Math.sin(rad);
      if (penDown) newLines.push({ x1: x, y1: y, x2: newX, y2: newY, color });
      x = newX; y = newY;
    } 
    else if (action.type === 'TURN') dir += parseFloat(action.angle);
    else if (action.type === 'PEN') penDown = (action.state === 'DOWN');
    else if (action.type === 'COLOR') color = action.color;

    return { newState: { x, y, dir, penDown, color, lines: newLines }, status: 'RUNNING' };
  },

  // --- VALIDATION PIXEL MATCH ---
  checkVictory: (finalState, levelData, solutionLines) => {
    if (!solutionLines || solutionLines.length === 0) return false;
    const userLines = finalState?.lines || [];
    
    // On crée deux canvas virtuels pour comparer
    const WIDTH = 400, HEIGHT = 400;
    const c1 = document.createElement('canvas'); c1.width = WIDTH; c1.height = HEIGHT;
    const ctx1 = c1.getContext('2d');
    const c2 = document.createElement('canvas'); c2.width = WIDTH; c2.height = HEIGHT;
    const ctx2 = c2.getContext('2d');

    const draw = (ctx, lines) => {
        ctx.lineWidth = 5; // Trait épais pour tolérance
        ctx.lineCap = 'round';
        lines.forEach(l => {
            ctx.beginPath();
            ctx.moveTo(WIDTH/2 + l.x1, HEIGHT/2 - l.y1);
            ctx.lineTo(WIDTH/2 + l.x2, HEIGHT/2 - l.y2);
            ctx.stroke();
        });
    };

    draw(ctx1, solutionLines);
    draw(ctx2, userLines);

    const data1 = ctx1.getImageData(0,0,WIDTH,HEIGHT).data;
    const data2 = ctx2.getImageData(0,0,WIDTH,HEIGHT).data;
    
    let diff = 0;
    let totalPixels = 0;

    for(let i=3; i<data1.length; i+=4) {
        // Si le modèle a un pixel (Alpha > 0)
        if (data1[i] > 50) {
            totalPixels++;
            // Si l'utilisateur n'a PAS de pixel à cet endroit
            if (data2[i] < 50) diff++;
        }
    }

    // Si on a couvert 90% du modèle, c'est gagné !
    const accuracy = 1 - (diff / (totalPixels || 1));
    console.log(`Précision: ${(accuracy*100).toFixed(1)}%`);
    return accuracy > 0.9;
  }
};