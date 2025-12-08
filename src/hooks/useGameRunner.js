import { useState, useRef, useEffect, useCallback } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { generateProofToken } from '../core/validation';

export function useGameRunner(workspaceRef, plugin, safeData) {
  const [speed, setSpeed] = useState(50);
  const [engineState, setEngineState] = useState(null);
  const [gameState, setGameState] = useState('IDLE');
  const [solutionLines, setSolutionLines] = useState([]);
  
  const [gameStats, setGameStats] = useState({ stars: 0, metric: '', feedback: null });
  const [proofToken, setProofToken] = useState("");
  
  const [lastAction, setLastAction] = useState(null);

  const executionRef = useRef(null);
  const actionsRef = useRef([]);
  const stepRef = useRef(0);
  const currentStateRef = useRef(null);

  // --- 1. CALCUL DU MODÈLE (GHOST) ---
  useEffect(() => {
    // Hack temporaire pour Turtle (sera nettoyé quand tous les plugins seront migrés)
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
        // Mock API pour le calcul silencieux
        const api = {
            move: () => {}, turn: () => {}, pen: () => {}, color: () => {},
            isPath: () => false, isDone: () => false, safeCheck: () => true
        };
        const fn = new Function('actions', 'api', code);
        fn(actions, api);
        
        let simState = null;
        actions.forEach(action => {
          if (plugin.executeStep) {
              const res = plugin.executeStep(simState, action, safeData);
              simState = res.newState;
          }
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

  // --- 2. FONCTIONS DE FIN (Définies en premier) ---
  const checkVictoryCondition = useCallback((finalState) => {
      if (!plugin.evaluateResult) return;

      const metrics = {
          blockCount: workspaceRef.current?.getAllBlocks(false).length || 0,
      };

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
  }, [plugin, safeData, solutionLines]);

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

  // --- 3. EXECUTE SINGLE STEP (Définie avant runLoop) ---
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

    if (result.status === 'WIN') {
        setTimeout(() => checkVictoryCondition(result.newState), 500);
        return false; 
    } else if (result.status === 'LOST') {
        setTimeout(() => setGameState('LOST'), 500);
        return false; 
    }

    if (stepRef.current >= actions.length) {
        if (workspaceRef.current) workspaceRef.current.highlightBlock(null);
        setTimeout(() => {
            checkVictoryCondition(currentStateRef.current);
        }, 500);
        return false; 
    }

    return true; 
  }, [plugin, safeData, checkVictoryCondition, workspaceRef]);

  // --- 4. RUN LOOP (Définie avant run) ---
  const runLoop = useCallback(() => {
    const shouldContinue = executeSingleStep();
    
    if (shouldContinue) {
        const prevAction = actionsRef.current[stepRef.current - 1];
        let delay = Math.max(5, (100 - speed) * 10);
        
        if (prevAction && (prevAction.type === 'SCAN' || prevAction.type === 'LOOP_CHECK')) {
            delay = Math.max(delay, 500);
        }

        executionRef.current = setTimeout(runLoop, delay);
    }
  }, [executeSingleStep, speed]);

  const pause = useCallback(() => { 
      if (executionRef.current) clearTimeout(executionRef.current); 
      setGameState('PAUSED'); 
  }, []);

  // --- 5. RUN (Utilise runLoop) ---
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
    // Utilisation de plugin.config au lieu de MAZE_CONFIG en dur
    const config = plugin.config || {}; 

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
            if (simState.dir === 0) nextX++; 
            else if (simState.dir === 1) nextY++; 
            else if (simState.dir === 2) nextX--; 
            else if (simState.dir === 3) nextY--;
            
            // Vérification générique si le plugin fournit une config grid
            if (config.checkMove) {
                if (config.checkMove(safeData.grid, nextX, nextY) !== 'WALL') {
                    simState.x = nextX; simState.y = nextY;
                }
            } else {
                // Par défaut (ex: Turtle), on bouge sans collision murale
                simState.x = nextX; simState.y = nextY;
            }
        },
        turn: (d) => { 
            // Simulation direction simple 0-3
            simState.dir = (d === 'LEFT') ? (simState.dir + 3) % 4 : (simState.dir + 1) % 4;
        },
        isPath: (d) => config.look ? config.look(safeData.grid, simState.x, simState.y, simState.dir, d) : true,
        isDone: () => config.checkMove ? config.checkMove(safeData.grid, simState.x, simState.y) === 'WIN' : false,
        safeCheck: () => { 
            loopCount++; 
            if (loopCount > MAX_LOOPS) {
                console.warn("Arrêt préventif boucle infinie");
                return false; 
            }
            return true; 
        },
        // Méthodes Turtle (vides pour Maze, mais évitent crash si bloc présent)
        pen: () => {},
        color: () => {} 
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

  // --- 6. STEP FORWARD ---
  const stepForward = useCallback(() => {
      // Si on n'est pas déjà en train de courir, on initialise comme RUN
      if (gameState === 'IDLE' || gameState === 'WON' || gameState === 'LOST' || gameState === 'FAILED') {
          // On appelle RUN, mais on force la pause tout de suite après
          // (C'est un peu tricky car RUN est asynchrone dans sa logique de state)
          // Duplication simplifiée de l'init de RUN pour le mode Pas-à-Pas
          if (!workspaceRef.current) return;
          
          javascriptGenerator.init(workspaceRef.current);
          const userCode = javascriptGenerator.workspaceToCode(workspaceRef.current);
          
          const config = plugin.config || {};
          let simState = { x: safeData.startPos.x, y: safeData.startPos.y, dir: safeData.startPos.dir || 0 };
          let loopCount = 0;
          
          const api = {
            move: () => { 
                let nextX = simState.x, nextY = simState.y;
                if (simState.dir === 0) nextX++; else if (simState.dir === 1) nextY++; else if (simState.dir === 2) nextX--; else if (simState.dir === 3) nextY--; 
                if (!config.checkMove || config.checkMove(safeData.grid, nextX, nextY) !== 'WALL') { simState.x = nextX; simState.y = nextY; } 
            },
            turn: (d) => { simState.dir = (d === 'LEFT') ? (simState.dir + 3) % 4 : (simState.dir + 1) % 4; },
            isPath: (d) => config.look ? config.look(safeData.grid, simState.x, simState.y, simState.dir, d) : true,
            isDone: () => config.checkMove ? config.checkMove(safeData.grid, simState.x, simState.y) === 'WIN' : false,
            safeCheck: () => (++loopCount <= 1000),
            pen: () => {}, color: () => {}
          };

          try {
            const gen = [];
            const fn = new Function('actions', 'api', userCode);
            fn(gen, api);
            
            actionsRef.current = gen;
            stepRef.current = 0;
            currentStateRef.current = null;
            
            // On lance 1 step
            setGameState('PAUSED');
            executeSingleStep();
          } catch(e) { alert("Erreur code : " + e.message); }

      } else {
          // Si déjà lancé (PAUSED ou RUNNING)
          if (gameState === 'RUNNING') pause();
          executeSingleStep();
          // On reste en PAUSED après le pas
          if (gameState !== 'WON' && gameState !== 'FAILED' && gameState !== 'LOST') {
              setGameState('PAUSED');
          }
      }
  }, [gameState, safeData, executeSingleStep, pause, workspaceRef, plugin]);

  return { speed, setSpeed, engineState, gameState, solutionLines, gameStats, proofToken, run, reset, pause, stepForward, lastAction };
}