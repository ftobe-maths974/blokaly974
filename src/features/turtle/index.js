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
                 score: { stars: 4, maxStars: 4, primaryMetric: "Dessin libre", details: {} },
                 feedback: { title: "Art Libre", message: "Joli dessin !" }
             };
        }

        const userLines = state?.lines || [];
        
        // --- ALGO DE COMPARAISON (Simplifié) ---
        // On vérifie si les lignes de l'utilisateur "couvrent" celles du modèle.
        // Pour une vraie comparaison pixel-perfect, c'est lourd, ici on fait une approx sur les coordonnées.
        
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

        // 3. SCORING — barème 4 ⭐ : récompense les boucles / variables (moins de blocs)
        const v = levelData.validation?.stars || {};
        const optimal = v.blocks ?? levelData.maxBlocks ?? 10;
        const flat = v.blocksFlat ?? Math.max(optimal * 4, optimal + 8);
        const usedBlocks = metrics.blockCount || 0;

        let stars, message;
        if (usedBlocks <= optimal) { stars = 4; message = "Code parfait : boucles bien utilisées ! 🎨"; }
        else if (usedBlocks <= Math.round((optimal + flat) / 2)) { stars = 3; message = "Beau dessin ! Peux-tu raccourcir avec une boucle ?"; }
        else if (usedBlocks <= flat) { stars = 2; message = "Dessin conforme ! Essaie une boucle « Répéter » pour faire plus court."; }
        else { stars = 1; message = "Conforme, mais beaucoup de blocs. Pense aux boucles / variables !"; }

        return {
            status: 'WIN',
            score: {
                stars,
                maxStars: 4,
                primaryMetric: "Dessin conforme",
                targetMetric: `Optimal : ${optimal} blocs`,
                details: { blocks: usedBlocks }
            },
            feedback: { title: "Figure réussie", message }
        };
    },
    
    // 👇 CATALOGUE CORRIGÉ
    catalog: [
        {
            category: 'Actions',
            color: 'emerald-500',
            blocks: [
                { type: 'turtle_move', label: 'Avancer', icon: '⬆️' },
                { type: 'turtle_turn', label: 'Pivoter', icon: '↺' },
                { type: 'turtle_pen', label: 'Stylo', icon: '✏️' },
                { type: 'turtle_color', label: 'Couleur', icon: '🎨' }
            ]
        },
        {
            category: 'Boucles',
            color: 'yellow-500',
            blocks: [
                { type: 'controls_repeat_ext', label: 'Répéter N fois', icon: '🔁' }
            ]
        }
    ],
    
    RenderComponent: Runner,
    EditorComponent: Editor,
    config: TURTLE_CONFIG
};