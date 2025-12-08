import { TurtleLogic } from './logic';
import Editor from './Editor';
import Runner from './Runner';
import { TURTLE_CONFIG } from './config';

export default {
    id: 'TURTLE',
    name: 'Tortue',
    icon: '🐢',
    
    // API Blockly
    registerBlocks: TurtleLogic.registerBlocks,
    getToolbox: (allowedBlocks) => ({
        xml: TurtleLogic.getToolboxXML(allowedBlocks), 
        category: 'Tortue'
    }),

    // Moteur Logique
    executeStep: TurtleLogic.executeStep,
    
    // --- LE JUGE (Appelé par le moteur à la fin) ---
    evaluateResult: (state, levelData, metrics, solutionLines) => {
        // 1. Cas particulier : Pas de modèle = Bac à sable (Toujours gagné ou neutre)
        if (!solutionLines || solutionLines.length === 0) {
             return { 
                 status: 'WIN', 
                 score: { stars: 3, primaryMetric: "Dessin libre", details: {} },
                 feedback: { title: "Art Libre", message: "Joli dessin !" } 
             }; 
        }

        const userLines = state?.lines || [];
        
        // --- ALGORITHME DE COMPARAISON VISUELLE (Pixel perfect) ---
        // On crée deux canvas virtuels pour comparer les dessins
        const WIDTH = 200; 
        const HEIGHT = 200;
        
        // Fonction utilitaire pour dessiner sur un canvas virtuel
        const renderToContext = (lines) => {
            const canvas = document.createElement('canvas');
            canvas.width = WIDTH; canvas.height = HEIGHT;
            const ctx = canvas.getContext('2d');
            ctx.lineWidth = 5; // Trait épais pour tolérance
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000';
            
            const scale = WIDTH / 400; // Adapter à la taille virtuelle vs taille réelle (400)
            const cx = WIDTH / 2; const cy = HEIGHT / 2;

            lines.forEach(l => {
                ctx.beginPath();
                ctx.moveTo(cx + l.x1 * scale, cy - l.y1 * scale);
                ctx.lineTo(cx + l.x2 * scale, cy - l.y2 * scale);
                ctx.stroke();
            });
            return ctx.getImageData(0,0,WIDTH,HEIGHT).data;
        };

        const dataModel = renderToContext(solutionLines);
        const dataUser = renderToContext(userLines);
        
        let matchPixels = 0;
        let totalModelPixels = 0;
        let errorPixels = 0;

        // On scanne les pixels (tous les 4 car RGBA)
        for(let i=3; i<dataModel.length; i+=4) {
            const alphaModel = dataModel[i];
            const alphaUser = dataUser[i];
            
            if (alphaModel > 50) {
                totalModelPixels++;
                if (alphaUser > 50) matchPixels++;
            } else if (alphaUser > 50) {
                // Le joueur a dessiné là où il ne fallait pas
                errorPixels++;
            }
        }

        const coverage = totalModelPixels > 0 ? (matchPixels / totalModelPixels) : 0;
        // On pénalise les traits en trop (erreurs)
        const penalty = errorPixels > 0 ? (errorPixels / (totalModelPixels || 1)) * 0.5 : 0;
        
        const finalScore = coverage - penalty;
        const isMatch = finalScore > 0.85; // 85% de précision requise

        if (!isMatch) {
            return {
                status: 'FAIL',
                feedback: { 
                    title: "Forme incorrecte", 
                    message: `Précision : ${Math.round(Math.max(0, finalScore)*100)}%. Regarde bien le modèle gris.` 
                }
            };
        }

        // 2. Calcul du Score (Basé sur les blocs si le dessin est bon)
        const target = levelData.maxBlocks || 5;
        const used = metrics.blockCount || 0;
        
        let stars = 1;
        if (used <= target) stars = 3;
        else if (used <= Math.ceil(target * 1.5)) stars = 2;

        return {
            status: 'WIN',
            score: {
                stars: stars,
                primaryMetric: `${Math.round(finalScore*100)}% Précision`,
                targetMetric: `Obj: ${target} blocs`,
                details: { blocks: used, accuracy: finalScore }
            },
            feedback: { 
                title: stars === 3 ? "Artiste !" : "Dessin Valide", 
                message: stars === 3 ? "Code optimisé et dessin parfait." : "Le dessin est bon, mais tu peux simplifier le code." 
            }
        };
    },
    
    RenderComponent: Runner,
    EditorComponent: Editor,
    config: TURTLE_CONFIG
};