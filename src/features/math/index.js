import Editor from './Editor';
import Runner from './Runner';

// Logique interne pour le Labo (pas de fichier logic.js séparé pour l'instant)
const MathLogic = {
    executeStep: (state, action, levelData) => {
        const currentState = state || { variables: { ...levelData.inputs }, logs: [] };
        
        if (!action) return { newState: currentState, status: 'RUNNING' };

        // Copie profonde pour éviter les mutations
        const newVariables = JSON.parse(JSON.stringify(currentState.variables));
        const newLogs = [...currentState.logs];

        if (action.type === 'SET') {
            newVariables[action.var] = action.val;
            // Petit formatage pour l'affichage dans la console
            const displayVal = Array.isArray(action.val) ? JSON.stringify(action.val) : action.val;
            newLogs.push(`${action.var} <- ${displayVal}`);
        } else if (action.type === 'PRINT') {
            newLogs.push(`🖨️ ${action.msg}`);
        }

        return { newState: { variables: newVariables, logs: newLogs }, status: 'RUNNING' };
    },

    // --- JUGE DU LABO (Validateur) ---
    evaluateResult: (state, levelData, metrics) => {
        // 1. VÉRIFICATION DES OBJECTIFS (Variables cibles)
        const targets = levelData.targets || {};
        const variables = state?.variables || {};
        
        // Fonction de comparaison souple (Nombre, Chaîne ou Tableau)
        const checkEqual = (val1, val2) => {
            if (Array.isArray(val1) || Array.isArray(val2)) {
                return JSON.stringify(val1) === JSON.stringify(val2);
            }
            // Tolérance numérique pour les flottants
            const n1 = parseFloat(val1);
            const n2 = parseFloat(val2);
            if (!isNaN(n1) && !isNaN(n2)) return Math.abs(n1 - n2) < 0.0001;
            
            return String(val1) == String(val2);
        };

        const targetKeys = Object.keys(targets);
        // Si aucun objectif n'est défini, on ne peut pas gagner
        if (targetKeys.length === 0) return { status: 'RUNNING', feedback: null };

        // On vérifie chaque variable cible
        const results = targetKeys.map(key => {
            let targetVal = targets[key];
            // Support des références dynamiques (ex: @a signifie "valeur initiale de a")
            if (typeof targetVal === 'string' && targetVal.startsWith('@')) {
                const refVar = targetVal.substring(1);
                targetVal = levelData.inputs?.[refVar];
            }
            return checkEqual(variables[key], targetVal);
        });

        const isSuccess = results.every(r => r === true);

        if (!isSuccess) {
            return { status: 'RUNNING', feedback: null };
        }

        // 2. CALCUL DU SCORE (ÉTOILES)
        const validation = levelData.validation || {};
        const targetBlocks = validation.stars?.blocks || levelData.maxBlocks || 10;
        const targetSteps = validation.stars?.steps || 50; 

        const usedBlocks = metrics.blockCount || 0;
        const usedSteps = metrics.steps || 0;

        let stars = 3;
        const penalties = [];

        if (usedBlocks > targetBlocks) { stars--; penalties.push("trop de blocs"); }
        if (usedSteps > targetSteps) { stars--; penalties.push("trop d'opérations"); }

        stars = Math.max(1, stars);

        let message = "Toutes les variables sont correctes.";
        if (stars < 3) message += ` Attention : ${penalties.join(", ")}.`;
        else message += " Code optimal !";

        return {
            status: 'WIN',
            score: {
                stars: stars,
                primaryMetric: "Objectifs atteints",
                targetMetric: `Obj: ${targetBlocks} blocs`,
                details: { blocks: usedBlocks, steps: usedSteps }
            },
            feedback: { title: "Succès !", message: message }
        };
    }
};

export default {
    id: 'MATH',
    name: 'Labo Algo',
    icon: '🧪',
    
    // Le Labo n'a pas de blocs "Custom", il utilise la bibliothèque standard
    // On renvoie une catégorie vide pour ne pas casser le chargeur
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