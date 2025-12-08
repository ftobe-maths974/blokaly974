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
    
    // --- NOUVELLE LOGIQUE DE VALIDATION FLEXIBLE ---
    evaluateResult: (state, levelData, metrics) => {
        const validation = levelData.validation || { strategy: 'ISOLATION' };
        const strategy = validation.strategy || 'ISOLATION';
        
        let isSuccess = false;
        let successMessage = "Niveau réussi.";

        // 1. VÉRIFICATION DES CONDITIONS DE VICTOIRE
        const hasSolvedIsolation = !!state.finalSolutionLatex; // A trouvé x = ...
        const hasVerifiedCorrectly = state.verification && state.verification.isCorrect; // Le bloc vert a dit VRAI

        if (strategy === 'ISOLATION' && hasSolvedIsolation) {
            isSuccess = true;
            successMessage = "Équation résolue !";
        } 
        else if (strategy === 'VERIFICATION' && hasVerifiedCorrectly) {
            isSuccess = true;
            successMessage = "Vérification correcte !";
        }
        else if (strategy === 'FLEXIBLE') {
            if (hasSolvedIsolation) {
                isSuccess = true; 
                successMessage = "Équation résolue !";
            } else if (hasVerifiedCorrectly) {
                isSuccess = true;
                successMessage = "Vérification validée !";
            }
        }

        if (!isSuccess) {
            return { status: 'RUNNING', feedback: null };
        }

        // 2. CALCUL DU SCORE (ÉTOILES)
        // On récupère les seuils définis dans le niveau (ou valeurs par défaut)
        const targetBlocks = validation.stars?.blocks || levelData.maxBlocks || 10;
        const targetSteps = validation.stars?.steps || 20; // Nouveau critère : Pas d'exécution

        const usedBlocks = metrics.blockCount || 0;
        const usedSteps = metrics.steps || 0;

        let stars = 3;
        const penalties = [];

        // Pénalité BLOCS
        if (usedBlocks > targetBlocks) {
            stars -= 1;
            penalties.push("Trop de blocs");
        }
        
        // Pénalité ÉTAPES (Optionnel, si configuré)
        if (validation.stars?.steps && usedSteps > targetSteps) {
            stars -= 1;
            penalties.push("Trop d'étapes");
        }

        // Bornage des étoiles (Min 1 si réussi)
        stars = Math.max(1, stars);

        let feedbackMsg = successMessage;
        if (stars < 3) {
            feedbackMsg += " " + penalties.join(", ") + ".";
        } else {
            feedbackMsg += " Code optimal !";
        }

        return {
            status: 'WIN',
            score: { 
                stars: stars, 
                primaryMetric: `${usedBlocks} blocs`, 
                targetMetric: `Obj: ${targetBlocks}`,
                details: { blocks: usedBlocks, steps: usedSteps } 
            },
            feedback: { title: "Bravo !", message: feedbackMsg }
        };
    },
    
    RenderComponent: Runner,
    EditorComponent: Editor,
    config: {}
};