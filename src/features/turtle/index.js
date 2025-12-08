import { TurtleLogic } from './logic';
import Editor from './Editor';
import Runner from './Runner';
import { TURTLE_CONFIG } from './config';

export default {
    id: 'TURTLE',
    name: 'Tortue',
    icon: '🐢',
    
    registerBlocks: TurtleLogic.registerBlocks,
    getToolbox: (allowedBlocks) => ({
        xml: TurtleLogic.getToolboxXML(allowedBlocks), 
        category: 'Tortue'
    }),

    executeStep: TurtleLogic.executeStep,
    
    // 👇 JUGE COMPLET (Comparaison Visuelle + Scoring)
    evaluateResult: (state, levelData, metrics, solutionLines) => {
        // 1. Cas "Bac à sable" (Pas de modèle = Victoire auto)
        if (!solutionLines || solutionLines.length === 0) {
             return { 
                 status: 'WIN', 
                 score: { stars: 3, primaryMetric: "Dessin libre", details: {} },
                 feedback: { title: "Art Libre", message: "Joli dessin !" } 
             }; 
        }

        const userLines = state?.lines || [];
        
        // --- ALGO DE COMPARAISON (Simplifié) ---
        // On vérifie si les lignes de l'utilisateur "couvrent" celles du modèle.
        // Pour une vraie comparaison pixel-perfect, c'est lourd, ici on fait une approx sur les coordonnées.
        
        let matchedLines = 0;
        const TOLERANCE = 5; // Pixels de tolérance

        // On vérifie que chaque ligne du modèle a une correspondance chez l'élève
        const isMatch = solutionLines.every(solLine => {
            return userLines.some(userLine => {
                // Vérifier les deux sens (A->B ou B->A)
                const matchDirect = (Math.abs(solLine.x1 - userLine.x1) < TOLERANCE && Math.abs(solLine.y1 - userLine.y1) < TOLERANCE && Math.abs(solLine.x2 - userLine.x2) < TOLERANCE && Math.abs(solLine.y2 - userLine.y2) < TOLERANCE);
                const matchReverse = (Math.abs(solLine.x1 - userLine.x2) < TOLERANCE && Math.abs(solLine.y1 - userLine.y2) < TOLERANCE && Math.abs(solLine.x2 - userLine.x1) < TOLERANCE && Math.abs(solLine.y2 - userLine.y1) < TOLERANCE);
                return matchDirect || matchReverse;
            });
        });

        // 2. VERDICT
        if (!isMatch) {
            return {
                status: 'FAIL',
                feedback: { 
                    title: "Dessin incorrect", 
                    message: "Le dessin ne correspond pas exactement au modèle gris." 
                }
            };
        }

        // 3. SCORING
        const validation = levelData.validation || {};
        const targetBlocks = validation.stars?.blocks || levelData.maxBlocks || 10;
        const targetSteps = validation.stars?.steps || 1000;

        const usedBlocks = metrics.blockCount || 0;
        const usedSteps = metrics.steps || 0;
        
        let stars = 3;
        const penalties = [];

        if (usedBlocks > targetBlocks) { stars--; penalties.push("trop de blocs"); }
        if (usedSteps > targetSteps) { stars--; penalties.push("trop d'étapes"); }

        stars = Math.max(1, stars);

        return {
            status: 'WIN',
            score: {
                stars: stars,
                primaryMetric: "Dessin Conforme",
                targetMetric: `Obj: ${targetBlocks} blocs`,
                details: { blocks: usedBlocks, steps: usedSteps }
            },
            feedback: { 
                title: stars === 3 ? "Artiste !" : "Validé", 
                message: stars === 3 ? "Code parfait." : `Attention : ${penalties.join(", ")}.` 
            }
        };
    },
    
    // Catalogue Visuel
    catalog: [
        {
            category: 'Actions',
            color: 'emerald-500',
            blocks: [
                { type: 'turtle_move', label: 'Avancer', icon: '⬆️' },
                { type: 'turtle_turn', label: 'Pivoter', icon: 'hz' },
                { type: 'turtle_pen', label: 'Stylo', icon: '✏️' },
                { type: 'turtle_color', label: 'Couleur', icon: '🎨' }
            ]
        },
        {
            category: 'Boucles',
            color: 'yellow-500',
            blocks: [
                { type: 'controls_repeat_ext', label: 'Répéter N fois', icon: 'jq' }
            ]
        }
    ],
    
    RenderComponent: Runner,
    EditorComponent: Editor,
    config: TURTLE_CONFIG
};