import MemoryVisualizer from '../components/runner/visualizers/MemoryVisualizer';
import { generateToolbox } from '../core/BlockDefinitions';

// Comparateur souple (Nombre vs Texte, Virgule vs Point)
const checkEqual = (val1, val2) => {
  // 1. Tableaux
  if (Array.isArray(val1) || Array.isArray(val2)) {
      return JSON.stringify(val1) === JSON.stringify(val2);
  }
  
  // 2. Conversion string propre pour comparaison
  const s1 = String(val1).replace(',', '.').trim();
  const s2 = String(val2).replace(',', '.').trim();
  
  // 3. Tentative conversion nombre
  const n1 = parseFloat(s1);
  const n2 = parseFloat(s2);

  // Si les deux sont des nombres valides, on compare mathématiquement
  if (!isNaN(n1) && !isNaN(n2) && s1 !== '' && s2 !== '') {
      const diff = Math.abs(n1 - n2);
      const isEqual = diff < 0.000001;
      // Petit log interne si besoin
      // console.log(`   [Compare] Num: ${n1} vs ${n2} (Diff: ${diff}) => ${isEqual}`);
      return isEqual;
  }

  // 4. Sinon comparaison texte stricte
  return s1 === s2;
};

export const MathPlugin = {
  id: 'MATH',
  RenderComponent: MemoryVisualizer,

  registerBlocks: () => {}, 

  getToolboxXML: (allowedBlocks, levelInputs, hiddenVars, lockedVars) => {
    return generateToolbox(allowedBlocks, levelInputs, hiddenVars, lockedVars);
  },

  executeStep: (currentState, action, levelData) => {
    const state = currentState || { variables: { ...levelData.inputs }, logs: [] };
    const newVariables = { ...state.variables };
    const newLogs = [...state.logs];
    const hiddenVars = levelData.hiddenVars || [];
    const lockedVars = levelData.lockedVars || [];

    if (action.type === 'SET') {
      if (hiddenVars.includes(action.var) || lockedVars.includes(action.var)) {
        newLogs.push(`⛔ ERREUR : ${action.var} est protégée.`);
        console.warn(`[MathPlugin] Tentative d'écriture sur variable protégée : ${action.var}`);
      } else {
        // LOG DE L'ACTION
        console.log(`[MathPlugin] SET ${action.var} =`, action.val, `(Type: ${typeof action.val})`);
        
        newVariables[action.var] = action.val;
        let displayVal = action.val;
        if (Array.isArray(action.val)) displayVal = JSON.stringify(action.val);
        newLogs.push(`📝 ${action.var} <- ${displayVal}`);
      }
    } else if (action.type === 'PRINT') {
      newLogs.push(`🖨️ ${action.msg}`);
    }

    return { newState: { variables: newVariables, logs: newLogs }, status: 'RUNNING' };
  },

  // --- VÉRIFICATION AVEC LOGS DÉTAILLÉS ---
  checkVictory: (finalState, levelData) => {
      const targets = levelData.targets || {};
      const targetKeys = Object.keys(targets);
      const variables = finalState?.variables || {};

      console.group("🕵️‍♂️ DEBUG VALIDATION MATHS");
      console.log("1️⃣ Variables en fin de jeu :", JSON.parse(JSON.stringify(variables)));
      console.log("2️⃣ Objectifs (Targets) définis :", JSON.parse(JSON.stringify(targets)));
      
      if (targetKeys.length === 0) {
          console.log("⚠️ Aucun objectif défini -> Pas de victoire auto.");
          console.groupEnd();
          return false; 
      }

      // Vérification clé par clé
      const results = targetKeys.map(key => {
          const currentVal = variables[key];
          let expectedVal = targets[key];
          
          // Gestion des références dynamiques (ex: @a)
          if (typeof expectedVal === 'string' && expectedVal.startsWith('@')) {
              const refVar = expectedVal.substring(1);
              // On compare avec la valeur INITIALE de la référence (inputs)
              if (levelData.inputs && levelData.inputs[refVar] !== undefined) {
                  expectedVal = levelData.inputs[refVar];
                  console.log(`   ℹ️ Référence ${targets[key]} résolue en :`, expectedVal);
              } else {
                  console.warn(`   ⚠️ Référence ${targets[key]} introuvable dans les inputs !`);
              }
          }
          
          const isEqual = checkEqual(currentVal, expectedVal);
          
          console.log(`👉 Test Variable '${key}' :`);
          console.log(`   - Attendu :`, expectedVal, `(Type: ${typeof expectedVal})`);
          console.log(`   - Reçu    :`, currentVal, `(Type: ${typeof currentVal})`);
          console.log(`   - Résultat: ${isEqual ? "✅ OK" : "❌ ÉCHEC"}`);
          
          return isEqual;
      });

      const isWin = results.every(r => r === true);
      console.log("🏁 RÉSULTAT FINAL :", isWin ? "VICTOIRE" : "ÉCHEC (Essaye encore)");
      console.groupEnd();

      return isWin;
  }
};