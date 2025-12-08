// 📄 Fichier : src/features/maze/index.js

// 👇 L'ERREUR EST SOUVENT ICI : C'est bien MazePlugin, pas EquationLogic !
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
    
    // --- JUGE STANDARDISÉ ---
    evaluateResult: (state, levelData, metrics) => {
        // 1. Victoire : Robot sur la case 'WIN'
        const cell = MAZE_CONFIG.checkMove(levelData.grid, state.x, state.y);
        const isWin = (cell === 'WIN');

        if (!isWin) {
            return { 
                status: 'FAIL', 
                feedback: { title: "Incomplet", message: "Le robot n'est pas arrivé." } 
            };
        }

        // 2. Score (Blocs & Étapes)
        const validation = levelData.validation || {};
        const targetBlocks = validation.stars?.blocks || levelData.maxBlocks || 5;
        const targetSteps = validation.stars?.steps || 30; // ex: 30 mouvements max

        const used = metrics.blockCount || 0;
        const steps = metrics.steps || 0;
        
        let stars = 3;
        const penalties = [];
        
        if (used > targetBlocks) { stars--; penalties.push("trop de blocs"); }
        if (steps > targetSteps) { stars--; penalties.push("chemin trop long"); }

        stars = Math.max(1, stars);

        return {
            status: 'WIN',
            score: {
                stars: stars,
                primaryMetric: `${used} blocs`,
                targetMetric: `Obj: ${targetBlocks}`,
                details: { blocks: used, steps: steps }
            },
            feedback: { 
                title: stars === 3 ? "Parfait !" : "Niveau réussi", 
                message: stars === 3 ? "Code optimisé." : `Attention : ${penalties.join(", ")}.` 
            }
        };
    },
    
    // Composants React
    RenderComponent: Runner,
    EditorComponent: Editor,
    config: MAZE_CONFIG
};