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
    
    evaluateResult: (state, levelData) => {
        if (state.finalSolutionLatex) {
            return {
                status: 'WIN',
                score: { stars: 3, primaryMetric: "Résolu", details: {} },
                feedback: { title: "Bravo !", message: "Solution correcte." }
            };
        }
        return { status: 'RUNNING', feedback: null };
    },
    
    RenderComponent: Runner,
    EditorComponent: Editor,
    config: {}
};