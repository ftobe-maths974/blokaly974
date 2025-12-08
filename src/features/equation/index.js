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
    
    // 👇 JUGE INTELLIGENT
    evaluateResult: (state, levelData, metrics) => {
        const validation = levelData.validation || { strategy: 'ISOLATION' };
        const strategy = validation.strategy || 'ISOLATION';
        
        // 1. ANALYSE DE L'ÉTAT
        // On nettoie la chaîne pour gérer les espaces éventuels
        const clean = (str) => str ? str.toString().replace(/\s+/g, '') : '';
        const currentLhs = clean(state.lhs);
        const currentRhs = clean(state.rhs);
        
        // x est isolé si gauche = "x" OU droite = "x" (ou "1*x")
        const isIsolated = (currentLhs === 'x' || currentLhs === '1*x') || 
                           (currentRhs === 'x' || currentRhs === '1*x');
        
        // Condition 1 : Isolation réussie (ou Intervalle trouvé)
        const hasSolvedIsolation = isIsolated || !!state.finalSolutionLatex; 
        
        // Condition 2 : Vérification réussie (Bloc vert retournant VRAI)
        const hasVerifiedCorrectly = state.verification && state.verification.isCorrect;

        let isSuccess = false;
        let failMessage = "Objectif non atteint.";

        // 2. LOGIQUE DE DÉCISION
        switch (strategy) {
            case 'ISOLATION':
                if (hasSolvedIsolation) isSuccess = true;
                else failMessage = "L'équation n'est pas résolue. Tu dois isoler x.";
                break;
            
            case 'VERIFICATION':
                if (hasVerifiedCorrectly) isSuccess = true;
                else failMessage = "Tu dois vérifier ta réponse avec le bloc de vérification.";
                break;

            case 'FLEXIBLE':
                if (hasSolvedIsolation || hasVerifiedCorrectly) isSuccess = true;
                else failMessage = "Tu dois soit isoler x, soit vérifier une solution.";
                break;

            case 'COMPLETE': // 🔥 LE NOUVEAU MODE "LES DEUX"
                if (hasSolvedIsolation && hasVerifiedCorrectly) {
                    isSuccess = true;
                } 
                else if (hasSolvedIsolation && !state.verification) {
                    failMessage = "C'est bien, tu as isolé x ! Maintenant, ajoute le bloc 'Vérifier' pour valider ta réponse.";
                }
                else if (hasSolvedIsolation && state.verification && !state.verification.isCorrect) {
                    failMessage = "Tu as isolé x, mais ta vérification indique FAUX. Il y a une erreur de calcul.";
                }
                else if (!hasSolvedIsolation && hasVerifiedCorrectly) {
                    failMessage = "La vérification est bonne, mais l'exercice demande aussi d'isoler x (x = ...).";
                }
                else {
                    failMessage = "Il faut isoler x (x = ...) PUIS vérifier le résultat.";
                }
                break;
                
            default: isSuccess = false;
        }

        // 3. VERDICT (ÉCHEC)
        if (!isSuccess) {
            return { 
                status: 'FAIL', 
                feedback: { title: "Incomplet", message: failMessage } 
            };
        }

        // 4. SCORING (VICTOIRE)
        const targetBlocks = validation.stars?.blocks || levelData.maxBlocks || 10;
        const targetSteps = validation.stars?.steps || 20;
        const usedBlocks = metrics.blockCount || 0;
        const usedSteps = metrics.steps || 0;

        let stars = 3;
        const penalties = [];
        if (usedBlocks > targetBlocks) { stars--; penalties.push("trop de blocs"); }
        if (usedSteps > targetSteps) { stars--; penalties.push("trop d'étapes"); }
        stars = Math.max(1, stars);

        return {
            status: 'WIN',
            score: { 
                stars: stars, 
                primaryMetric: `${usedBlocks} blocs`, 
                targetMetric: `Obj: ${targetBlocks}`,
                details: { blocks: usedBlocks, steps: usedSteps } 
            },
            feedback: { title: "Bravo !", message: stars === 3 ? "Résolution parfaite !" : penalties.join(", ") }
        };
    },
    
    // 👇 CATALOGUE CORRIGÉ
    catalog: [
        {
            category: 'Résolution',
            color: 'indigo-500',
            blocks: [
                { type: 'equation_op_both', label: 'Opération (2 côtés)', icon: '⚖️' },
                { type: 'equation_term_x', label: 'Terme X', icon: '𝒙' },
                { type: 'equation_verify', label: 'Vérifier la réponse', icon: '✅' },
                { type: 'math_number', label: 'Nombre', icon: '123' }
            ]
        },
        {
            category: 'Analyse',
            color: 'purple-500',
            blocks: [
                { type: 'equation_solution_state', label: 'Conclusion', icon: '∅' },
                { type: 'equation_solution_s', label: 'Écrire S = ...', icon: '📝' },
                { type: 'equation_interval', label: 'Intervalle [ ; ]', icon: '↔️' },
                { type: 'math_infinity', label: 'Infini', icon: '∞' }
            ]
        }
    ],
    
    RenderComponent: Runner,
    EditorComponent: Editor,
    config: {}
};