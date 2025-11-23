import TurtleRender from '../components/runner/TurtleRender';
import { generateToolbox } from '../core/BlockDefinitions';

export const TurtlePlugin = {
  id: 'TURTLE',
  RenderComponent: TurtleRender,

  // L'enregistrement se fait dans BlockRegistry, mais on garde la signature
  registerBlocks: () => {},

  getToolboxXML: (allowedBlocks) => generateToolbox(allowedBlocks, null, [], []),

  executeStep: (currentState, action, levelData) => {
    const state = currentState || { 
      x: levelData.startPos?.x || 0, 
      y: levelData.startPos?.y || 0, 
      dir: levelData.startPos?.dir !== undefined ? levelData.startPos.dir : 0, // 0 = EST (Standard)
      penDown: true, 
      color: '#2c3e50', 
      lines: [] 
    };
    
    let { x, y, dir, penDown, color, lines } = state;
    const newLines = [...lines];

    if (action.type === 'MOVE') {
      const dist = parseFloat(action.dist);
      
      // --- CONVENTION STANDARD (0° = EST, Horaire) ---
      // Plus besoin de décalage -90. cos(0) = 1 (Est).
      const rad = dir * (Math.PI / 180);
      
      const finalX = x + dist * Math.cos(rad);
      // Y Mathématique (Y+ vers le haut). 
      // Avec rotation horaire : Sud (90°) -> sin(90)=1. On veut descendre (diminuer Y), donc on soustrait.
      const finalY = y - dist * Math.sin(rad); 
      
      if (penDown) {
        newLines.push({ x1: x, y1: y, x2: finalX, y2: finalY, color });
      }
      x = finalX;
      y = finalY;
    } 
    else if (action.type === 'TURN') {
      // Rotation Horaire (Clockwise) : +angle = Tourner à Droite
      dir += parseFloat(action.angle);
      
      // SUPPRIMER OU COMMENTER CETTE LIGNE :
      // dir = dir % 360; 
      
      // On laisse dir grandir/diminuer librement pour que l'animation CSS soit fluide
    }
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

    // Helper de dessin aligné avec le rendu
    const draw = (ctx, lines) => {
        ctx.lineWidth = 6; // Un peu plus gras pour la tolérance
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
        lines.forEach(l => {
            ctx.beginPath();
            // Mêmes formules que TurtleRender
            const toX = (val) => WIDTH / 2 + val;
            const toY = (val) => HEIGHT / 2 - val; // Y inversé ici aussi
            ctx.moveTo(toX(l.x1), toY(l.y1));
            ctx.lineTo(toX(l.x2), toY(l.y2));
            ctx.stroke();
        });
    };

    draw(ctx1, solutionLines);
    draw(ctx2, userLines);

    const data1 = ctx1.getImageData(0,0,WIDTH,HEIGHT).data;
    const data2 = ctx2.getImageData(0,0,WIDTH,HEIGHT).data;
    
    let diff = 0, total = 0;
    for(let i=3; i<data1.length; i+=4) {
        if (data1[i] > 50) { // Si le pixel fait partie du modèle
            total++;
            if (data2[i] < 50) diff++; // Et qu'il manque chez l'élève
        }
    }

    // Tolérance de 85%
    const accuracy = 1 - (diff / (total || 1));
    return accuracy > 0.85;
  }
};