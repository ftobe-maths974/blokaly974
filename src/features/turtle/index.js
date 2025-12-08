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
    
    // --- JUGE ---
    evaluateResult: (state, levelData, metrics, solutionLines) => {
        // ... (Garde ton code existant de evaluateResult ici) ...
        // Je ne le remets pas pour raccourcir, mais ne l'efface pas !
        // Si tu l'as perdu, reprends-le de ma réponse précédente sur le Scoring Tortue.
        
        // Code Scoring résumé pour l'exemple (à remplacer par le tien complet) :
        if (!solutionLines || solutionLines.length === 0) return { status: 'WIN', score: { stars: 3 } };
        return { status: 'WIN', score: { stars: 3 } }; 
    },
    
    // 👇 LE CATALOGUE VISUEL
    catalog: [
        {
            category: 'Actions',
            color: 'emerald-500',
            blocks: [
                { type: 'turtle_move', label: 'Avancer', icon: '⬆️' },
                { type: 'turtle_turn', label: 'Pivoter', icon: 'hz' }, // hz = icône rotation
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