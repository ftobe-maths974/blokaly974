import Editor from './Editor';
import Runner from './Runner';

const MathLogic = {
    executeStep: (state, action, levelData) => {
        const currentState = state || { variables: { ...levelData.inputs }, logs: [] };
        if (!action) return { newState: currentState, status: 'RUNNING' };

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

    // 👇 JUGE COMPLET
    evaluateResult: (state, levelData, metrics) => {
        const targets = levelData.targets || {};
        const variables = state?.variables || {};
        const targetKeys = Object.keys(targets);
        
        if (targetKeys.length === 0) return { status: 'RUNNING', feedback: null };

        // 1. VERIFICATION
        const checkEqual = (val1, val2) => {
            if (Array.isArray(val1) || Array.isArray(val2)) return JSON.stringify(val1) === JSON.stringify(val2);
            const n1 = parseFloat(val1);
            const n2 = parseFloat(val2);
            if (!isNaN(n1) && !isNaN(n2)) return Math.abs(n1 - n2) < 0.0001;
            return String(val1) == String(val2);
        };

        const results = targetKeys.map(key => {
            let targetVal = targets[key];
            if (typeof targetVal === 'string' && targetVal.startsWith('@')) {
                const refVar = targetVal.substring(1);
                targetVal = levelData.inputs?.[refVar];
            }
            return checkEqual(variables[key], targetVal);
        });

        const isSuccess = results.every(r => r === true);

        // 2. VERDICT ECHEC
        if (!isSuccess) {
            return { 
                status: 'FAIL', 
                feedback: { 
                    title: "Résultat Incorrect", 
                    message: "Les variables ne contiennent pas les valeurs attendues." 
                } 
            };
        }

        // 3. SCORING
        const validation = levelData.validation || {};
        const targetBlocks = validation.stars?.blocks || levelData.maxBlocks || 10;
        const targetSteps = validation.stars?.steps || 50; 

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
                primaryMetric: "Objectifs atteints", 
                targetMetric: `Obj: ${targetBlocks} blocs`,
                details: { blocks: usedBlocks, steps: usedSteps } 
            },
            feedback: { title: "Bravo !", message: stars === 3 ? "Algorithme optimal." : `Attention : ${penalties.join(", ")}.` }
        };
    }
};

export default {
    id: 'MATH',
    name: 'Labo Algo',
    icon: '🧪',
    getToolbox: () => ({ xml: '', category: 'Mathématiques' }),
    executeStep: MathLogic.executeStep,
    evaluateResult: MathLogic.evaluateResult,
    
    // 👇 CATALOGUE CORRIGÉ
    catalog: [
        {
            category: 'Variables',
            color: 'pink-500',
            blocks: [
                { type: 'variables_set', label: 'Affecter (=)', icon: '📥' },
                { type: 'variables_get', label: 'Lire valeur', icon: '👀' },
            ]
        },
        {
            category: 'Calculs',
            color: 'blue-500',
            blocks: [
                { type: 'math_number', label: 'Nombre', icon: '123' },
                { type: 'math_arithmetic', label: 'Opération', icon: '➕' },
                { type: 'math_random_int', label: 'Aléatoire', icon: '🎲' },
                { type: 'math_modulo', label: 'Reste (Eucl.)', icon: '%' }
            ]
        },
        {
            category: 'Logique',
            color: 'amber-500',
            blocks: [
                { type: 'controls_if', label: 'Si... Alors', icon: '❓' },
                { type: 'logic_compare', label: 'Comparer', icon: '≠' },
                { type: 'logic_operation', label: 'ET / OU', icon: '&&' }
            ]
        },
        {
            category: 'Entrées/Sorties',
            color: 'slate-500',
            blocks: [
                { type: 'text_print', label: 'Afficher', icon: '🖨️' },
                { type: 'text_prompt_ext', label: 'Demander', icon: '💬' }
            ]
        }
    ],
    RenderComponent: Runner,
    EditorComponent: Editor,
    config: {}
};