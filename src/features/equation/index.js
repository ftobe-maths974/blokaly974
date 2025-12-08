import { EquationLogic } from './logic';
import Editor from './Editor';
import Runner from './Runner';

export default {
    id: 'EQUATION',
    name: 'Équation',
    icon: '📐',
    
    registerBlocks: EquationLogic.registerBlocks,
    getToolbox: (allowedBlocks) => ({ 
        xml: EquationLogic.getToolboxXML(allowedBlocks), 
        category: 'Algèbre' 
    }),
    executeStep: EquationLogic.executeStep,
    evaluateResult: (state, levelData, metrics) => {
         // ... (Ton code evaluateResult existant) ...
         return { status: 'RUNNING' }; // Placeholder
    },
    
    // 👇 LE CATALOGUE VISUEL
    catalog: [
        {
            category: 'Résolution',
            color: 'indigo-500',
            blocks: [
                { type: 'equation_op_both', label: 'Opération (Les 2 côtés)', icon: '⚖️' },
                { type: 'equation_term_x', label: 'Terme X', icon: '𝒙' },
                { type: 'equation_verify', label: 'Vérifier la réponse', icon: '✅' },
                { type: 'math_number', label: 'Nombre', icon: '123' }
            ]
        },
        {
            category: 'Solutions',
            color: 'purple-500',
            blocks: [
                { type: 'equation_solution_state', label: 'Conclusion (Vide/Infini)', icon: '∅' },
                { type: 'equation_solution_s', label: 'Écrire S = ...', icon: 'S' },
                { type: 'equation_interval', label: 'Intervalle [ ; ]', icon: '[ ]' },
                { type: 'math_infinity', label: 'Infini (∞)', icon: '∞' }
            ]
        }
    ],
    
    RenderComponent: Runner,
    EditorComponent: Editor,
    config: {}
};