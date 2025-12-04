import TurtleRender from '../components/runner/TurtleRender';
import { generateToolbox } from '../core/BlockDefinitions';

export const TurtlePlugin = {
  id: 'TURTLE',
  RenderComponent: TurtleRender,

  registerBlocks: () => {},

  getToolboxXML: (allowedBlocks) => generateToolbox(allowedBlocks, null, [], []),

  executeStep: (currentState, action, levelData) => {
    const state = currentState || { 
      x: levelData.startPos?.x || 0, 
      y: levelData.startPos?.y || 0, 
      dir: levelData.startPos?.dir !== undefined ? levelData.startPos.dir : 0,
      penDown: true, 
      color: '#2c3e50', 
      lines: [] 
    };
    
    // --- FIX CRASH TIME TRAVEL ---
    if (!action) return { newState: state, status: 'RUNNING' };
    
    let { x, y, dir, penDown, color, lines } = state;
    const newLines = [...lines];

    if (action.type === 'MOVE') {
      const dist = parseFloat(action.dist);
      const rad = dir * (Math.PI / 180);
      const finalX = x + dist * Math.cos(rad);
      const finalY = y - dist * Math.sin(rad); 
      if (penDown) newLines.push({ x1: x, y1: y, x2: finalX, y2: finalY, color });
      x = finalX;
      y = finalY;
    } 
    else if (action.type === 'TURN') { dir += parseFloat(action.angle); }
    else if (action.type === 'PEN') penDown = (action.state === 'DOWN');
    else if (action.type === 'COLOR') color = action.color;

    return { newState: { x, y, dir, penDown, color, lines: newLines }, status: 'RUNNING' };
  },

  checkVictory: (finalState, levelData, solutionLines) => {
    if (!solutionLines || solutionLines.length === 0) return false;
    const userLines = finalState?.lines || [];
    const WIDTH = 400, HEIGHT = 400;
    const c1 = document.createElement('canvas'); c1.width = WIDTH; c1.height = HEIGHT;
    const ctx1 = c1.getContext('2d');
    const c2 = document.createElement('canvas'); c2.width = WIDTH; c2.height = HEIGHT;
    const ctx2 = c2.getContext('2d');

    const draw = (ctx, lines) => {
        ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
        lines.forEach(l => {
            ctx.beginPath();
            const toX = (val) => WIDTH / 2 + val;
            const toY = (val) => HEIGHT / 2 - val; 
            ctx.moveTo(toX(l.x1), toY(l.y1));
            ctx.lineTo(toX(l.x2), toY(l.y2));
            ctx.stroke();
        });
    };

    draw(ctx1, solutionLines); draw(ctx2, userLines);
    const data1 = ctx1.getImageData(0,0,WIDTH,HEIGHT).data;
    const data2 = ctx2.getImageData(0,0,WIDTH,HEIGHT).data;
    let diff = 0, total = 0;
    for(let i=3; i<data1.length; i+=4) {
        if (data1[i] > 50) { total++; if (data2[i] < 50) diff++; }
    }
    const accuracy = 1 - (diff / (total || 1));
    return accuracy > 0.85;
  }
};