import { MazePlugin } from './logic';
import Editor from './Editor';
import Runner from './Runner';
import { MAZE_CONFIG } from './config';

export default {
    id: 'MAZE',
    name: 'Labyrinthe',
    icon: '🏰',
    
    registerBlocks: MazePlugin.registerBlocks,
    getToolbox: (allowedBlocks) => ({ 
        xml: MazePlugin.getToolboxXML(allowedBlocks), 
        category: 'Labyrinthe' 
    }),
    executeStep: MazePlugin.executeStep,
    
    // 👇 JUGE COMPLET
    evaluateResult: (state, levelData, metrics) => {
        const moveResult = MAZE_CONFIG.checkMove(levelData.grid, state.x, state.y);
        const isWin = (moveResult === 'WIN');

        if (!isWin) {
            return { 
                status: 'FAIL', 
                feedback: { title: "Perdu", message: "Le robot n'est pas arrivé." } 
            };
        }

        // SCORING
        const validation = levelData.validation || {};
        const targetBlocks = validation.stars?.blocks || levelData.maxBlocks || 99;
        const targetSteps = validation.stars?.steps || 100;
        const usedBlocks = metrics.blockCount || 0;
        const usedSteps = metrics.steps || 0;
        
        let stars = 3;
        const penalties = [];
        if (usedBlocks > targetBlocks) { stars--; penalties.push("trop de blocs"); }
        if (usedSteps > targetSteps) { stars--; penalties.push("trop lent"); }
        stars = Math.max(1, stars);

        return {
            status: 'WIN',
            score: {
                stars: stars,
                primaryMetric: `${usedBlocks} blocs`,
                targetMetric: `Obj: ${targetBlocks}`,
                details: { blocks: usedBlocks, steps: usedSteps }
            },
            feedback: { title: "Niveau réussi", message: stars === 3 ? "Parfait !" : penalties.join(", ") }
        };
    },
    
    catalog: [
        {
            category: 'Mouvements',
            color: 'blue-500',
            blocks: [
                { type: 'maze_move_forward', label: 'Avancer', icon: '⬆️' },
                { type: 'maze_turn', label: 'Pivoter', icon: 'Ql' }
            ]
        },
        {
            category: 'Capteurs',
            color: 'emerald-500',
            blocks: [
                { type: 'maze_if', label: 'Si Chemin...', icon: 'qa' },
                { type: 'maze_if_else', label: 'Si... Sinon...', icon: 'qt' },
                { type: 'maze_forever', label: 'Jusqu\'à l\'Arrivée', icon: 'jq' }
            ]
        }
    ],

    RenderComponent: Runner,
    EditorComponent: Editor,
    config: MAZE_CONFIG
};