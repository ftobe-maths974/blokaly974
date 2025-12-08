// 📄 src/features/maze/index.js
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
    evaluateResult: MazePlugin.evaluateResult, // (Ta fonction existante)
    
    // 👇 NOUVEAU : LE CATALOGUE EST DÉFINI ICI (LOCALEMENT)
    catalog: [
        {
            category: 'Mouvements',
            color: 'blue-500', // Classe Tailwind ou code couleur
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
                { type: 'maze_forever', label: 'Boucle Finale', icon: 'jq' }
            ]
        }
    ],

    RenderComponent: Runner,
    EditorComponent: Editor,
    config: MAZE_CONFIG
};