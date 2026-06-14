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
        const expected = levelData.expectedOutput; // tableau de lignes attendues (optionnel)
        const hasOutput = Array.isArray(expected);

        // Pas d'objectif → bac à sable
        if (targetKeys.length === 0 && !hasOutput) return { status: 'RUNNING', feedback: null };

        // 1a. VÉRIFICATION DES VARIABLES
        const checkEqual = (val1, val2) => {
            if (Array.isArray(val1) || Array.isArray(val2)) return JSON.stringify(val1) === JSON.stringify(val2);
            const n1 = parseFloat(val1);
            const n2 = parseFloat(val2);
            if (!isNaN(n1) && !isNaN(n2)) return Math.abs(n1 - n2) < 0.0001;
            return String(val1) == String(val2);
        };
        const varsOk = targetKeys.every((key) => {
            let targetVal = targets[key];
            if (typeof targetVal === 'string' && targetVal.startsWith('@')) {
                targetVal = levelData.inputs?.[targetVal.substring(1)];
            }
            return checkEqual(variables[key], targetVal);
        });

        // 1b. VÉRIFICATION DE L'AFFICHAGE (lignes imprimées, dans l'ordre)
        let outputOk = true;
        if (hasOutput) {
            const printed = (state?.logs || [])
                .filter((l) => typeof l === 'string' && l.indexOf('🖨️') === 0)
                .map((l) => l.replace(/^🖨️\s*/, ''));
            outputOk = printed.length === expected.length && expected.every((e, i) => String(e) === String(printed[i]));
        }

        // 2. VERDICT ÉCHEC
        if (!varsOk || !outputOk) {
            return {
                status: 'FAIL',
                feedback: {
                    title: 'Pas encore…',
                    message: !varsOk
                        ? 'Les variables ne contiennent pas les valeurs attendues.'
                        : "L'affichage ne correspond pas à ce qui est attendu.",
                },
            };
        }

        // 3. SCORING — barème 4 ⭐ (récompense un code court)
        const v = levelData.validation?.stars || {};
        const optimal = v.blocks ?? levelData.maxBlocks ?? 8;
        const flat = v.blocksFlat ?? Math.max(optimal * 3, optimal + 6);
        const usedBlocks = metrics.blockCount || 0;

        let stars, message;
        if (usedBlocks <= optimal) { stars = 4; message = 'Parfait, code efficace ! 💡'; }
        else if (usedBlocks <= Math.round((optimal + flat) / 2)) { stars = 3; message = 'Bien joué ! Peux-tu faire plus court ?'; }
        else if (usedBlocks <= flat) { stars = 2; message = "Réussi ! Essaie d'utiliser moins de blocs."; }
        else { stars = 1; message = 'Réussi, mais avec beaucoup de blocs.'; }

        return {
            status: 'WIN',
            score: { stars, maxStars: 4, primaryMetric: 'Objectif atteint', targetMetric: `Optimal : ${optimal} blocs`, details: { blocks: usedBlocks } },
            feedback: { title: 'Bravo !', message },
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
            category: 'Boucles',
            color: 'yellow-500',
            blocks: [
                { type: 'controls_repeat_ext', label: 'Répéter N fois', icon: '🔁' },
                { type: 'controls_whileUntil', label: 'Répéter tant que', icon: '🔄' }
            ]
        },
        {
            category: 'Texte',
            color: 'teal-500',
            blocks: [
                { type: 'text', label: 'Texte', icon: '🔤' },
                { type: 'text_join', label: 'Assembler', icon: '🔗' }
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