import { useState, useRef, useEffect, useCallback } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { generateProofToken } from '../core/validation';
import { MAZE_CONFIG } from '../core/adapters/MazeAdapter';

export function useGameRunner(workspaceRef, plugin, safeData) {
  // --- ÉTATS ---
  const [speed, setSpeed] = useState(50);
  const [engineState, setEngineState] = useState(null);
  const [gameState, setGameState] = useState('IDLE');
  const [solutionLines, setSolutionLines] = useState([]);
  
  const [gameStats, setGameStats] = useState({ stars: 0, blockCount: 0, target: 0 });
  const [proofToken, setProofToken] = useState("");
  
  // NOUVEAU : On expose la dernière action pour l'animation Radar
  const [lastAction, setLastAction] = useState(null);

  const executionRef = useRef(null);
  const actionsRef = useRef([]);
  const stepRef = useRef(0);
  const currentStateRef = useRef(null);

  // --- 1. CALCUL DU MODÈLE (GHOST) ---
  useEffect(() => {
    if (!safeData.solutionBlocks || plugin.id !== 'TURTLE') {
      setSolutionLines([]);
      return;
    }
    const timer = setTimeout(() => {
      try {
        const headlessWs = new Blockly.Workspace();
        const xml = Blockly.utils.xml.textToDom(safeData.solutionBlocks);
        Blockly.Xml.domToWorkspace(xml, headlessWs);
        
        javascriptGenerator.init(headlessWs);
        const code = javascriptGenerator.workspaceToCode(headlessWs);
        
        const actions = [];
        new Function('actions', code)(actions);
        
        let simState = null;
        actions.forEach(action => {
          const res = plugin.executeStep(simState, action, safeData);
          simState = res.newState;
        });

        if (simState?.lines) {
            setSolutionLines(prev => {
                if (JSON.stringify(prev) === JSON.stringify(simState.lines)) return prev;
                return simState.lines;
            });
        }
        headlessWs.dispose();
      } catch (e) { console.error("Erreur modèle:", e); }
    }, 50);
    return () => clearTimeout(timer);
  }, [safeData.solutionBlocks, plugin, safeData]);

  // --- 2. LOGIQUE DE FIN ---
  const handleWin = useCallback((currentBlocks) => {
    const targetBlocks = safeData.maxBlocks || 5; 
    let stars = 1;
    if (currentBlocks <= targetBlocks) stars = 3;
    else if (currentBlocks <= Math.ceil(targetBlocks * 1.5)) stars = 2;

    setGameStats({ stars, blockCount: currentBlocks, target: targetBlocks });
    const token = generateProofToken(safeData.id || 1, { stars, blocks: currentBlocks });
    setProofToken(token);
    setGameState('WON'); 
  }, [safeData]);

  const handleFail = useCallback(() => {
    setGameStats({ stars: 0, blockCount: workspaceRef.current?.getAllBlocks(false).length || 0, target: safeData.maxBlocks });
    setGameState('FAILED');
  }, [safeData]);

  const reset = useCallback(() => {
    if (executionRef.current) clearTimeout(executionRef.current);
    setGameState('IDLE');
    setEngineState(null);
    setLastAction(null); // Reset visuel
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

    // 1. On récupère l'action
    const action = actions[step];
    setLastAction({ ...action, _uid: step });
    setLastAction(action); // Mise à jour pour l'UI (Radar)

    // 2. Highlight du bloc
    if (action.id && workspaceRef.current) {
        workspaceRef.current.highlightBlock(action.id);
    }

    // 3. CAS SPÉCIAL : SCAN (Juste visuel, pas de logique moteur)
    if (action.type === 'SCAN') {
        stepRef.current += 1;
        return true; // On continue, le délai sera géré par runLoop
    }

    // 4. Compatibilité Plugin
    let actionForPlugin = action;
    if (plugin.id === 'MAZE' && typeof action === 'object' && action.type) {
        // Pour Maze, on peut avoir besoin d'adapter si le plugin attend des strings
        // Mais notre MazePlugin v2 lit action.type, donc c'est bon.
    }

    // 5. Exécution logique
    const result = plugin.executeStep(currentStateRef.current, actionForPlugin, safeData);
    currentStateRef.current = result.newState;
    setEngineState(result.newState);
    stepRef.current += 1; 

    // 6. Vérif Victoire Immédiate
    if (result.status === 'WIN') {
        setTimeout(() => handleWin(workspaceRef.current.getAllBlocks(false).length), 500);
        return false; 
    } else if (result.status === 'LOST') {
        setTimeout(() => setGameState('LOST'), 500);
        return false; 
    }

    // 7. Fin de liste
    if (stepRef.current >= actions.length) {
        if (workspaceRef.current) workspaceRef.current.highlightBlock(null);
        setTimeout(() => {
            let success = false;
            if (plugin.checkVictory) {
                success = plugin.checkVictory(currentStateRef.current, safeData, solutionLines);
            }
            if (success) handleWin(workspaceRef.current.getAllBlocks(false).length);
            else handleFail();
        }, 500);
        return false; 
    }

    return true; 
  }, [plugin, safeData, solutionLines, handleWin, handleFail, workspaceRef]);

  const runLoop = useCallback(() => {
    const shouldContinue = executeSingleStep();
    
    if (shouldContinue) {
        // Gestion délai : plus lent si c'est un SCAN pour bien voir l'animation
        const prevAction = actionsRef.current[stepRef.current - 1];
        let delay = Math.max(5, (100 - speed) * 10);
        
        // Si on vient de scanner, on impose un délai minimum de 500ms
        if (prevAction && prevAction.type === 'SCAN') {
            delay = Math.max(delay, 500);
        }

        executionRef.current = setTimeout(runLoop, delay);
    }
  }, [executeSingleStep, speed]);

  // --- 4. COMMANDES PUBLIQUES ---
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

    // --- API SIMULATION ---
    // On initialise l'état avec la direction par défaut correcte (0=Est)
    let simState = { 
        x: safeData.startPos.x, 
        y: safeData.startPos.y, 
        dir: safeData.startPos.dir !== undefined ? safeData.startPos.dir : 0 
    };
    
    let loopCount = 0;
    // On augmente la limite pour permettre une animation longue avant l'échec
    const MAX_LOOPS = 1000; 

    const api = {
        move: () => {
            let nextX = simState.x, nextY = simState.y;
            // MAPPING 0=Est, 1=Sud...
            if (simState.dir === 0) nextX++; 
            else if (simState.dir === 1) nextY++; 
            else if (simState.dir === 2) nextX--; 
            else if (simState.dir === 3) nextY--;
            
            if (MAZE_CONFIG.checkMove(safeData.grid, nextX, nextY) !== 'WALL') {
                simState.x = nextX; simState.y = nextY;
            }
        },
        turn: (d) => { 
            const side = d; 
            simState.dir = (side === 'LEFT') ? (simState.dir + 3) % 4 : (simState.dir + 1) % 4;
        },
        isPath: (d) => MAZE_CONFIG.look(safeData.grid, simState.x, simState.y, simState.dir, d),
        isDone: () => MAZE_CONFIG.checkMove(safeData.grid, simState.x, simState.y) === 'WIN',
        
        // --- CORRECTION SOFT STOP ---
        safeCheck: () => { 
            loopCount++; 
            if (loopCount > MAX_LOOPS) {
                console.warn("⚠️ Simulation : Limite de boucles atteinte (" + MAX_LOOPS + "). Arrêt préventif.");
                // On retourne FALSE pour dire à la boucle 'while' du code généré de s'arrêter
                // MAIS on ne lance pas d'erreur, donc les actions générées jusqu'ici sont conservées !
                return false; 
            }
            return true; 
        }
    };

    try {
      const generatedActions = [];
      const fn = new Function('actions', 'api', initCode + userCode);
      fn(generatedActions, api);
      
      // Si on a atteint la limite, on ajoute une action explicite "FAIL" pour l'interface si on veut
      // Mais le simple fait de jouer les actions jusqu'au bout suffira :
      // À la fin, executeSingleStep appellera checkVictory, qui verra que ce n'est pas fini -> FAILED.
      
      actionsRef.current = generatedActions;
      stepRef.current = 0;
      currentStateRef.current = null;
      
      if (generatedActions.length === 0) {
          console.warn("Aucune action générée (Code vide ?)");
          // On laisse couler, ça finira en échec immédiat mais propre
      }

      setGameState('RUNNING');
      runLoop();
    } catch (e) {
      // Erreur de syntaxe ou crash JS pur
      alert("Erreur exécution : " + e.message);
      setGameState('IDLE');
    }
  }, [workspaceRef, safeData, runLoop, reset, gameState]);

  // ... (Le reste stepForward et return restent inchangés) ...
  // Juste s'assurer que stepForward utilise la même logique de safeCheck si nécessaire.
  
  const pause = useCallback(() => { if (executionRef.current) clearTimeout(executionRef.current); setGameState('PAUSED'); }, []);

  const stepForward = useCallback(() => {
      // Si le jeu n'est pas en cours, on initialise la simulation (comme "run")
      if (gameState === 'IDLE' || gameState === 'WON' || gameState === 'LOST' || gameState === 'FAILED') {
          if (!workspaceRef.current) return;
          
          javascriptGenerator.init(workspaceRef.current);
          const userCode = javascriptGenerator.workspaceToCode(workspaceRef.current);
          
          let initCode = "";
          if (safeData.inputs) { 
              Object.entries(safeData.inputs).forEach(([k, v]) => initCode += `var ${k} = ${JSON.stringify(v)};\n`); 
          }
          
          // --- 1. INITIALISATION SIMULATION (Mise à jour 0=Est) ---
          let simState = { 
              x: safeData.startPos.x, 
              y: safeData.startPos.y, 
              dir: safeData.startPos.dir !== undefined ? safeData.startPos.dir : 0 
          };
          
          let loopCount = 0;
          const MAX_LOOPS = 1000;

          const api = {
            move: () => { 
                let nextX = simState.x, nextY = simState.y;
                // MAPPING 0=Est, 1=Sud, 2=Ouest, 3=Nord
                if (simState.dir === 0) nextX++; 
                else if (simState.dir === 1) nextY++; 
                else if (simState.dir === 2) nextX--; 
                else if (simState.dir === 3) nextY--; 
                
                if (MAZE_CONFIG.checkMove(safeData.grid, nextX, nextY) !== 'WALL') { 
                    simState.x = nextX; simState.y = nextY; 
                } 
            },
            turn: (d) => { 
                // Simulation logique (reste en 0-3 pour isPath)
                simState.dir = (d === 'LEFT') ? (simState.dir + 3) % 4 : (simState.dir + 1) % 4; 
            },
            isPath: (d) => MAZE_CONFIG.look(safeData.grid, simState.x, simState.y, simState.dir, d),
            isDone: () => MAZE_CONFIG.checkMove(safeData.grid, simState.x, simState.y) === 'WIN',
            
            // --- 2. SOFT STOP (Comme dans run) ---
            safeCheck: () => { 
                loopCount++; 
                if (loopCount > MAX_LOOPS) return false; // On continue sans crasher
                return true; 
            }
          };

          try {
            const gen = [];
            const fn = new Function('actions', 'api', initCode + userCode);
            fn(gen, api); // Exécution silencieuse pour générer la liste
            
            actionsRef.current = gen;
            stepRef.current = 0;
            currentStateRef.current = null;
            
            // On passe en PAUSED immédiatement pour attendre le clic suivant
            setGameState('PAUSED');
            // On exécute le tout premier pas immédiatement pour feedback visuel
            executeSingleStep();
          } catch(e) { 
              alert("Erreur code : " + e.message); 
          }
      } else {
          // Si déjà lancé : on avance d'un cran
          if (gameState === 'RUNNING') pause(); // Si ça courait, on pause
          
          executeSingleStep();
          
          // Si la partie n'est pas finie après ce pas, on reste en PAUSED
          if (gameState !== 'WON' && gameState !== 'FAILED' && gameState !== 'LOST') {
              setGameState('PAUSED');
          }
      }
  }, [gameState, safeData, executeSingleStep, pause, workspaceRef]);

  return { speed, setSpeed, engineState, gameState, solutionLines, gameStats, proofToken, run, reset, pause, stepForward, lastAction };
}