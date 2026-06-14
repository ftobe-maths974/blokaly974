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

    evaluateResult: (state, levelData, metrics) => {
        const moveResult = MAZE_CONFIG.checkMove(levelData.grid, state.x, state.y);
        const isWin = (moveResult === 'WIN');

        if (!isWin) {
            return { 
                status: 'FAIL', 
                feedback: { title: "Perdu", message: "Le robot n'est pas arrivé." } 
            };
        }

        const validation = levelData.validation || {};
        const stars0 = validation.stars || {};
        const optimal = stars0.blocks ?? levelData.maxBlocks ?? 99;          // solution élégante (avec boucle)
        const flat = stars0.blocksFlat ?? Math.max(optimal * 3, optimal + 6); // solution « à plat » (sans boucle)
        const usedBlocks = metrics.blockCount || 0;

        // Conseil contextuel : on ne suggère « Répéter » que si la boucle est
        // réellement disponible dans ce niveau (sinon, sur les niveaux découverte,
        // on conseillerait un bloc absent).
        const loop = (levelData.allowedBlocks || []).some((b) => b === 'controls_repeat_ext' || b === 'maze_forever');
        const tip = loop ? ' avec **Répéter**' : '';

        // Barème 4 ⭐ : récompense la solution la plus courte (boucle si dispo).
        let stars, message;
        if (usedBlocks <= optimal) { stars = 4; message = loop ? "Parfait ! Tu as utilisé la boucle au mieux. 🐢✨" : "Parfait ! Pile le bon nombre de blocs. 🐢✨"; }
        else if (usedBlocks <= Math.round((optimal + flat) / 2)) { stars = 3; message = `Bien joué ! Peux-tu faire encore plus court${tip} ?`; }
        else if (usedBlocks <= flat) { stars = 2; message = `Réussi ! Essaie d'utiliser moins de blocs${tip}.`; }
        else { stars = 1; message = `Réussi, mais avec beaucoup de blocs. Essaie de faire plus court${tip} !`; }

        return {
            status: 'WIN',
            score: {
                stars,
                maxStars: 4,
                primaryMetric: `${usedBlocks} blocs`,
                targetMetric: `Optimal : ${optimal}`,
                details: { blocks: usedBlocks }
            },
            feedback: { title: "Figure réussie", message }
        };
    },
    
    // 👇 CATALOGUE CORRIGÉ AVEC EMOJIS STANDARDS
    catalog: [
        {
            category: 'Mouvements',
            color: 'blue-500',
            blocks: [
                { type: 'maze_move_forward', label: 'Avancer', icon: '⬆️' },
                { type: 'maze_turn', label: 'Pivoter', icon: '↺' }
            ]
        },
        {
            category: 'Boucles',
            color: 'yellow-500',
            blocks: [
                { type: 'controls_repeat_ext', label: 'Répéter N fois', icon: '🔁' },
                { type: 'maze_forever', label: 'Jusqu\'à l\'Arrivée', icon: '🏁' }
            ]
        },
        {
            category: 'Capteurs',
            color: 'emerald-500',
            blocks: [
                { type: 'maze_if', label: 'Si Chemin...', icon: '❓' },
                { type: 'maze_if_else', label: 'Si... Sinon...', icon: '🔀' }
            ]
        }
    ],

    RenderComponent: Runner,
    EditorComponent: Editor,
    config: MAZE_CONFIG
};