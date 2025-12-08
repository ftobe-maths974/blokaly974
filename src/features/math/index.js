import Editor from './Editor';
import Runner from './Runner';

// Logique minimale (les blocs sont standards)
const MathLogic = {
    executeStep: (state, action, levelData) => {
        const currentState = state || { variables: { ...levelData.inputs }, logs: [] };
        
        if (!action) return { newState: currentState, status: 'RUNNING' };

        // Copie profonde pour éviter les mutations
        const newVariables = JSON.parse(JSON.stringify(currentState.variables));
        const newLogs = [...currentState.logs];

        if (action.type === 'SET') {
            newVariables[action.var] = action.val;
            const displayVal = Array.isArray(action.val) ? JSON.stringify(action.val) : action.val;
            newLogs.push(`${action.var} <- ${displayVal}`);
        } else if (action.type === 'PRINT') {
            newLogs.push(`🖨️ ${action.msg}`);
        }

        return { newState: { variables: newVariables, logs: newLogs }, status: 'RUNNING' };
    },

    evaluateResult: (state, levelData) => {
        // Validation des objectifs (cibles)
        const targets = levelData.targets || {};
        const variables = state?.variables || {};
        
        const checkEqual = (val1, val2) => {
            if (Array.isArray(val1) || Array.isArray(val2)) return JSON.stringify(val1) === JSON.stringify(val2);
            // Tolérance numérique
            const n1 = parseFloat(val1);
            const n2 = parseFloat(val2);
            if (!isNaN(n1) && !isNaN(n2)) return Math.abs(n1 - n2) < 0.0001;
            return String(val1) == String(val2);
        };

        const targetKeys = Object.keys(targets);
        if (targetKeys.length === 0) return { status: 'RUNNING', feedback: null };

        const results = targetKeys.map(key => {
            let targetVal = targets[key];
            // Support @variable (ex: cible = valeur initiale de 'a')
            if (typeof targetVal === 'string' && targetVal.startsWith('@')) {
                const refVar = targetVal.substring(1);
                targetVal = levelData.inputs?.[refVar];
            }
            return checkEqual(variables[key], targetVal);
        });

        const isSuccess = results.every(r => r === true);

        if (isSuccess) {
            return {
                status: 'WIN',
                score: { stars: 3, primaryMetric: "Objectifs atteints", details: {} },
                feedback: { title: "Succès !", message: "Toutes les variables sont correctes." }
            };
        }
        return { status: 'RUNNING', feedback: null };
    }
};

export default {
    id: 'MATH',
    name: 'Labo Algo',
    icon: '🧪',
    
    // Le Labo n'a pas de blocs spéciaux, il utilise les blocs système (StandardBlocks)
    // On peut renvoyer une catégorie vide ou "Variables" pour forcer l'affichage si besoin
    getToolbox: (allowedBlocks) => ({ 
        xml: '', 
        category: 'Mathématiques' 
    }),
    executeStep: MathLogic.executeStep,
    evaluateResult: MathLogic.evaluateResult,
    
    RenderComponent: Runner,
    EditorComponent: Editor,
    
    config: {}
};