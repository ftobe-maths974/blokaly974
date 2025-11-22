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
      dir: levelData.startPos?.dir || 0, // 0 = NORD
      penDown: true, 
      color: '#2c3e50', 
      lines: [] 
    };
    
    let { x, y, dir, penDown, color, lines } = state;
    const newLines = [...lines];

    if (action.type === 'MOVE') {
      const dist = parseFloat(action.dist);
      
      // --- CORRECTION ANGLE ---
      // 0° = Nord.
      // Dans le cercle trigonométrique standard : 0° = Est.
      // Pour que 0° pointe vers le Nord (Haut), il faut décaler de -90°.
      // De plus, l'axe Y mathématique monte (+), mais l'axe Y Canvas descend (+).
      // MAIS TurtleRender gère l'inversion Y (toCanvasY).
      // Donc on reste en logique mathématique pure (Y+ = Haut).
      
      // Angle corrigé pour Math.cos/sin : (dir - 90)
      const rad = (dir - 90) * (Math.PI / 180);
      
      const newX = x + dist * Math.cos(rad);
      const newY = y - dist * Math.sin(rad); // Y inversé car dans Canvas Y va vers le bas
      
      // ATTENTION : Dans TurtleRender, on a : toCanvasY = HEIGHT/2 - mathY.
      // Cela signifie que si mathY augmente, on monte à l'écran.
      // Donc on doit utiliser +sin(rad) si on veut monter.
      // Sauf que (dir-90) à 0° donne -90°. sin(-90) = -1.
      // Donc pour monter il faut soustraire ? Non.
      // Reprenons :
      // 0° (Nord) -> rad = -90. cos=0, sin=-1.
      // On veut aller vers le HAUT.
      // Dans notre repère logique (x,y), Y+ est le haut.
      // Donc newY doit augmenter.
      // newY = y - (dist * -1) = y + dist. C'est correct !
      // SAUF qu'en Canvas, Y+ est en bas.
      // Dans TurtleRender on a : const toCanvasY = (mathY) => HEIGHT / 2 - mathY;
      // Donc Y+ est bien vers le HAUT visuellement.
      
      const finalX = x + dist * Math.cos(rad);
      const finalY = y - dist * Math.sin(rad); // Correction : Moins car sin(-90)=-1, donc -(-1)=+1 (Monte)
      
      if (penDown) {
        newLines.push({ x1: x, y1: y, x2: finalX, y2: finalY, color });
      }
      x = finalX;
      y = finalY;
    } 
    else if (action.type === 'TURN') {
      // En mode boussole :
      // Tourner à droite (horaire) ajoute des degrés
      // Tourner à gauche (anti-horaire) retire des degrés
      // C'est l'inverse de la trigo standard, mais c'est intuitif pour une boussole (N=0, E=90)
      dir += parseFloat(action.angle);
      
      // Normalisation 0-360 pour être propre (optionnel mais mieux pour le debug)
      dir = dir % 360;
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

    // Tolérance de 85% (dessin "assez" proche)
    const accuracy = 1 - (diff / (total || 1));
    // console.log(`Précision: ${(accuracy*100).toFixed(1)}%`);
    return accuracy > 0.85;
  }
};