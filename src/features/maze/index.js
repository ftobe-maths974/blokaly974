import { MazePlugin } from './logic';
import Editor from './Editor';
import Runner from './Runner';
import { MAZE_CONFIG } from './config';

export default {
    id: 'MAZE',
    name: 'Labyrinthe',
    icon: '🏰',
    
    // API Blockly
    registerBlocks: MazePlugin.registerBlocks,
    getToolbox: () => ({
        xml: MazePlugin.getToolboxXML(), 
        category: 'Labyrinthe'
    }),

    // Moteur Logique
    executeStep: MazePlugin.executeStep,
    
    // --- NOUVEAU : Logique de Notation Standardisée ---
    evaluateResult: (state, levelData, metrics) => {
        // 1. Vérification de la victoire (Position actuelle vs Objectif)
        // Note: Dans Maze, executeStep renvoie déjà 'WIN' dans status, on peut s'en servir.
        // Mais pour être robuste, on revérifie ici ou on se base sur le status passé par le moteur.
        
        // Ici, on va simplifier : le moteur nous dit "Le robot s'est arrêté".
        // On regarde si la case actuelle est la sortie (3).
        const cell = MAZE_CONFIG.checkMove(levelData.grid, state.x, state.y);
        const isWin = (cell === 'WIN');

        if (!isWin) {
            return { 
                status: 'FAIL', 
                feedback: { title: "Pas tout à fait...", message: "Le robot n'a pas atteint l'arrivée." } 
            };
        }

        // 2. Calcul du Score (Basé sur le nombre de blocs)
        const target = levelData.maxBlocks || 5;
        const used = metrics.blockCount || 0;
        
        let stars = 1;
        let message = "Tu peux faire mieux !";
        
        if (used <= target) {
            stars = 3;
            message = "✨ Code Parfait ! Optimisation maximale.";
        } else if (used <= Math.ceil(target * 1.5)) {
            stars = 2;
            message = "Bien joué ! Mais tu utilises un peu trop de blocs.";
        }

        return {
            status: 'WIN',
            score: {
                stars: stars,
                primaryMetric: `${used} blocs`, // Ce qu'on affiche au joueur
                targetMetric: `Objectif : ${target}`,
                details: { blocks: used, target: target }
            },
            feedback: { 
                title: stars === 3 ? "Excellent !" : "Niveau Réussi", 
                message: message 
            }
        };
    },
    
    // Composants React
    RenderComponent: Runner,
    EditorComponent: Editor,
    config: MAZE_CONFIG
};