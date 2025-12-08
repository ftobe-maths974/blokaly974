import Editor from './Editor';
import Runner from './Runner';

const MathLogic = {
    executeStep: (state, action, levelData) => {
        // ... (Ton code executeStep existant) ...
        const currentState = state || { variables: { ...levelData.inputs }, logs: [] };
        if (!action) return { newState: currentState, status: 'RUNNING' };
        const newVariables = JSON.parse(JSON.stringify(currentState.variables));
        const newLogs = [...currentState.logs];
        if (action.type === 'SET') {
            newVariables[action.var] = action.val;
            newLogs.push(`${action.var} <- ${JSON.stringify(action.val)}`);
        } else if (action.type === 'PRINT') {
            newLogs.push(`🖨️ ${action.msg}`);
        }
        return { newState: { variables: newVariables, logs: newLogs }, status: 'RUNNING' };
    },

    evaluateResult: (state, levelData, metrics) => {
        // ... (Ton code evaluateResult existant avec le scoring étoiles) ...
        return { status: 'WIN', score: { stars: 3 } }; // Placeholder
    }
};

export default {
    id: 'MATH',
    name: 'Labo Algo',
    icon: '🧪',
    
    getToolbox: (allowedBlocks) => ({ xml: '', category: 'Mathématiques' }),
    executeStep: MathLogic.executeStep,
    evaluateResult: MathLogic.evaluateResult,
    
    // 👇 LE CATALOGUE VISUEL
    catalog: [
        {
            category: 'Variables',
            color: 'pink-500',
            blocks: [
                { type: 'variables_set', label: 'Affecter (=)', icon: 'Df' },
                { type: 'variables_get', label: 'Lire valeur', icon: 'Lr' },
                // math_change (incrémenter) supprimé car souvent confusant au collège, à remettre si besoin
            ]
        },
        {
            category: 'Calculs',
            color: 'blue-500',
            blocks: [
                { type: 'math_number', label: 'Nombre', icon: '123' },
                { type: 'math_arithmetic', label: 'Opération (+ - * /)', icon: '+-' },
                { type: 'math_random_int', label: 'Aléatoire', icon: '🎲' },
                { type: 'math_modulo', label: 'Reste (Eucl.)', icon: '%' }
            ]
        },
        {
            category: 'Logique',
            color: 'amber-500',
            blocks: [
                { type: 'controls_if', label: 'Si... Alors', icon: 'qt' },
                { type: 'logic_compare', label: 'Comparer (= < >)', icon: '≠' },
                { type: 'logic_operation', label: 'ET / OU', icon: '&' }
            ]
        },
        {
            category: 'Entrées/Sorties',
            color: 'slate-500',
            blocks: [
                { type: 'text_print', label: 'Afficher', icon: '🖨️' },
                { type: 'text_prompt_ext', label: 'Demander', icon: 'wq' }
            ]
        }
    ],
    
    RenderComponent: Runner,
    EditorComponent: Editor,
    config: {}
};