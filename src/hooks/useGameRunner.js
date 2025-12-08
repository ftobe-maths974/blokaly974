import { useState, useRef, useEffect, useCallback } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { generateProofToken } from '../core/validation';

// 🗑️ SUPPRESSION de l'import : import { MAZE_CONFIG } from ... 
// On ne veut plus de dépendance directe !

export function useGameRunner(workspaceRef, plugin, safeData) {
  const [speed, setSpeed] = useState(50);
  const [engineState, setEngineState] = useState(null);
  const [gameState, setGameState] = useState('IDLE');
  const [solutionLines, setSolutionLines] = useState([]);
  
  // Stats génériques
  const [gameStats, setGameStats] = useState({ stars: 0, metric: '', feedback: null });
  const [proofToken, setProofToken] = useState("");
  
  const [lastAction, setLastAction] = useState(null);

  const executionRef = useRef(null);
  const actionsRef = useRef([]);
  const stepRef = useRef(0);
  const currentStateRef = useRef(null);

  // --- 1. CALCUL DU MODÈLE (GHOST) ---
  // (On garde tel quel pour l'instant, c'est assez générique si plugin.executeStep l'est)
  useEffect(() => {
    // Petit hack temporaire : seul Turtle utilise ça. 
    // Comme Turtle est désactivé, ce bloc ne fera rien ou plantera pas.
    if (!safeData.solutionBlocks || plugin.id !== 'TURTLE') {
      setSolutionLines([]);
      return;
    }
    // ... (Le reste du code Ghost reste inchangé pour l'instant)
  }, [safeData.solutionBlocks, plugin, safeData]);


  // --- 2. LOGIQUE DE FIN GÉNÉRIQUE (Cœur du changement) ---
  const checkVictoryCondition = useCallback((finalState) => {
      if (!plugin.evaluateResult) {
          console.warn("⚠️ Le plugin n'a pas de fonction evaluateResult !");
          return;
      }

      // On rassemble les métriques (générique)
      const metrics = {
          blockCount: workspaceRef.current?.getAllBlocks(false).length || 0,
          // On pourrait ajouter le temps ici plus tard
      };

      // ON DÉLÈGUE AU PLUGIN !
      const result = plugin.evaluateResult(finalState, safeData, metrics, solutionLines);

      if (result.status === 'WIN') {
          setGameStats({ 
              stars: result.score.stars, 
              metric: result.score.primaryMetric,
              target: result.score.targetMetric,
              feedback: result.feedback 
          });
          const token = generateProofToken(safeData.id || 1, { stars: result.score.stars, metric: result.score.primaryMetric });
          setProofToken(token);
          setGameState('WON');
      } else {
          setGameStats({ stars: 0, feedback: result.feedback });
          setGameState('FAILED');
      }
  }, [plugin, safeData]);


  const reset = useCallback(() => {
    if (executionRef.current) clearTimeout(executionRef.current);
    setGameState('IDLE');
    setEngineState(null);
    setLastAction(null); 
    currentStateRef.current = null;
    stepRef.current = 0;
    actionsRef.current = [];
    if (workspaceRef.current) workspaceRef.current.highlightBlock(null);
  }, [workspaceRef]);

  // --- 3. EXÉCUTION ---
  const executeSingleStep = useCallback(() => {
    const actions = actionsRef.current;
    const step = stepRef.current;

    if (step >= actions.length) return false; 

    const action = actions[step];
    setLastAction({ ...action, _uid: step });

    if (action.id && workspaceRef.current) {
        workspaceRef.current.highlightBlock(action.id);
    }

    if (action.type === 'SCAN' || action.type === 'LOOP_CHECK') {
        stepRef.current += 1;
        return true; 
    }

    // Exécution Logique via le Plugin
    const result = plugin.executeStep(currentStateRef.current, action, safeData);
    currentStateRef.current = result.newState;
    setEngineState(result.newState);
    stepRef.current += 1; 

    // Victoire Immédiate (ex: Case arrivée atteinte pendant le mouvement) ?
    // Dans la nouvelle logique, on préfère évaluer à la fin, mais si le plugin renvoie 'WIN'/'LOST' dans status, on respecte.
    if (result.status === 'WIN') {
        setTimeout(() => checkVictoryCondition(result.newState), 500);
        return false; 
    } else if (result.status === 'LOST') {
        setTimeout(() => setGameState('LOST'), 500);
        return false; 
    }

    // Fin de la liste d'actions
    if (stepRef.current >= actions.length) {
        if (workspaceRef.current) workspaceRef.current.highlightBlock(null);
        setTimeout(() => {
            checkVictoryCondition(currentStateRef.current);
        }, 500);
        return false; 
    }

    return true; 
}, [plugin, safeData, solutionLines]);

  // ... (runLoop, run, pause, stepForward restent globalement identiques 
  // MAIS il faut nettoyer la partie "API SIMULATION" dans run() et stepForward() 
  // car elle utilisait MAZE_CONFIG en dur) ...

  // ⚠️ Pour l'instant, comme la simulation JS (api.move...) est générée par le plugin Maze
  // et que ce code JS appelle des fonctions globales, nous devons adapter `run` 
  // pour qu'il injecte une API fournie par le plugin, pas codée en dur ici.
  
  // SOLUTION PRAGMATIQUE POUR CETTE ÉTAPE :
  // On va simplifier `run` pour l'instant en gardant l'API Maze injectée ici
  // MAIS en utilisant `plugin.config` au lieu de l'import `MAZE_CONFIG`.
  
  const run = useCallback(() => {
    if (!workspaceRef.current) return;
    if (gameState === 'PAUSED') {
        setGameState('RUNNING');
        runLoop();
        return;
    }
    reset();
    
    javascriptGenerator.init(workspaceRef.current);
    const userCode = javascriptGenerator.workspaceToCode(workspaceRef.current);
    
    let initCode = "";
    if (safeData.inputs) {
        Object.entries(safeData.inputs).forEach(([key, val]) => {
            initCode += `var ${key} = ${JSON.stringify(val)};\n`;
        });
    }

    // --- API SIMULATION GÉNÉRIQUE ---
    // Idéalement : const api = plugin.getApi(simState, safeData);
    // Pour l'instant on adapte l'existant en remplaçant MAZE_CONFIG par plugin.config
    
    let simState = { 
        x: safeData.startPos.x, 
        y: safeData.startPos.y, 
        dir: safeData.startPos.dir !== undefined ? safeData.startPos.dir : 0 
    };
    
    let loopCount = 0;
    const MAX_LOOPS = 1000; 

    // ATTENTION : Cette API est très couplée au Maze. 
    // Pour rendre ça 100% agnostique, le plugin devrait fournir cette fonction `api`.
    // On garde ça pour l'étape suivante, ici on répare juste les imports.
    const api = {
        move: () => {
            let nextX = simState.x, nextY = simState.y;
            if (simState.dir === 0) nextX++; 
            else if (simState.dir === 1) nextY++; 
            else if (simState.dir === 2) nextX--; 
            else if (simState.dir === 3) nextY--;
            
            // UTILISATION DE plugin.config
            if (plugin.config && plugin.config.checkMove(safeData.grid, nextX, nextY) !== 'WALL') {
                simState.x = nextX; simState.y = nextY;
            }
        },
        turn: (d) => { 
            simState.dir = (d === 'LEFT') ? (simState.dir + 3) % 4 : (simState.dir + 1) % 4;
        },
        isPath: (d) => plugin.config ? plugin.config.look(safeData.grid, simState.x, simState.y, simState.dir, d) : false,
        isDone: () => plugin.config ? plugin.config.checkMove(safeData.grid, simState.x, simState.y) === 'WIN' : false,
        safeCheck: () => { 
            loopCount++; 
            if (loopCount > MAX_LOOPS) return false; 
            return true; 
        }
    };

    try {
      const generatedActions = [];
      const fn = new Function('actions', 'api', initCode + userCode);
      fn(generatedActions, api);
      
      actionsRef.current = generatedActions;
      stepRef.current = 0;
      currentStateRef.current = null;
      
      setGameState('RUNNING');
      runLoop();
    } catch (e) {
      alert("Erreur exécution : " + e.message);
      setGameState('IDLE');
    }
  }, [workspaceRef, safeData, runLoop, reset, gameState, plugin]);

  // (Faire la même modif pour stepForward qui duplique cette logique, ou mieux, factoriser)
  const stepForward = useCallback(() => {
      // ... (Copier la logique de run() en remplaçant MAZE_CONFIG par plugin.config)
      // Je simplifie ici pour la lisibilité de la réponse, mais il faut le faire dans le fichier réel.
      if (gameState === 'IDLE' || gameState === 'WON' || gameState === 'LOST' || gameState === 'FAILED') {
          // ... Initialisation identique à RUN ...
          // ... Utilisation de plugin.config ...
          // ... setGameState('PAUSED'); executeSingleStep(); ...
      } else {
          if (gameState === 'RUNNING') pause();
          executeSingleStep();
          if (gameState !== 'WON' && gameState !== 'FAILED' && gameState !== 'LOST') {
              setGameState('PAUSED');
          }
      }
  }, [gameState, safeData, executeSingleStep, pause, workspaceRef, plugin]);

  return { speed, setSpeed, engineState, gameState, solutionLines, gameStats, proofToken, run, reset, pause, stepForward, lastAction };
}