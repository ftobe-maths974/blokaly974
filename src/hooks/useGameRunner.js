import { useState, useRef, useEffect, useCallback } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { generateProofToken } from '../core/validation';
import { MAZE_CONFIG } from '../core/adapters/MazeAdapter';

export function useGameRunner(workspaceRef, plugin, safeData) {
  const [speed, setSpeed] = useState(50);
  const [engineState, setEngineState] = useState(null);
  const [gameState, setGameState] = useState('IDLE');
  const [solutionLines, setSolutionLines] = useState([]);
  
  const [gameStats, setGameStats] = useState({ stars: 0, blockCount: 0, target: 0 });
  const [proofToken, setProofToken] = useState("");
  const [lastAction, setLastAction] = useState(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

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
        if (simState?.lines) setSolutionLines(simState.lines);
        headlessWs.dispose();
      } catch (e) { console.error("Erreur modèle:", e); }
    }, 50);
    return () => clearTimeout(timer);
  }, [safeData.solutionBlocks, plugin, safeData]);

  // --- HELPER : Initial State ---
  const getInitialState = useCallback(() => {
      return plugin.executeStep(null, null, safeData).newState;
  }, [plugin, safeData]);

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

  // --- 3. GESTION DE L'ÉTAT (RESET vs CLEAR) ---

  // RESET : Revient au début (Stop / Rejouer) MAIS garde la Timeline
  const reset = useCallback(() => {
    if (executionRef.current) clearTimeout(executionRef.current);
    
    setGameState('IDLE');
    setEngineState(null); // Efface le visuel
    setLastAction(null); 
    currentStateRef.current = null;
    stepRef.current = 0;
    setCurrentStep(0);
    
    // NOTE IMPORTANTE : On NE vide PAS actionsRef ni totalSteps ici !
    // Cela permet de garder la Timeline active même après un stop/fail.

    if (workspaceRef.current) workspaceRef.current.highlightBlock(null);
  }, [workspaceRef]);

  // CLEAR : Efface tout (Quand on change le code)
  const clearSimulation = useCallback(() => {
      actionsRef.current = [];
      setTotalSteps(0);
      reset(); // Appelle aussi reset pour remettre à zéro le visuel
  }, [reset]);

  // --- 4. EXÉCUTION ---
  const executeSingleStep = useCallback(() => {
    const actions = actionsRef.current;
    const step = stepRef.current;

    if (step >= actions.length) return false; 

    const action = actions[step];
    setLastAction({ ...action, _uid: step });
    setCurrentStep(step + 1);

    if (action.id && workspaceRef.current) {
        workspaceRef.current.highlightBlock(action.id);
    }

    if (action.type === 'SCAN') {
        stepRef.current += 1;
        return true; 
    }

    const result = plugin.executeStep(currentStateRef.current, action, safeData);
    currentStateRef.current = result.newState;
    setEngineState(result.newState);
    stepRef.current += 1; 

    if (result.status === 'WIN') {
        const winDelay = safeData.type === 'EQUATION' ? 3000 : 500;
        setTimeout(() => handleWin(workspaceRef.current.getAllBlocks(false).length), winDelay);
        return false; 
    } else if (result.status === 'LOST') {
        setTimeout(() => setGameState('LOST'), 500);
        return false; 
    }

    if (stepRef.current >= actions.length) {
        if (workspaceRef.current) workspaceRef.current.highlightBlock(null);
        const checkDelay = safeData.type === 'EQUATION' ? 3000 : 500;
        setTimeout(() => {
            let success = false;
            if (plugin.checkVictory) {
                success = plugin.checkVictory(currentStateRef.current, safeData, solutionLines);
            }
            if (success) handleWin(workspaceRef.current.getAllBlocks(false).length);
            else handleFail();
        }, checkDelay);
        return false; 
    }

    return true; 
  }, [plugin, safeData, solutionLines, handleWin, handleFail, workspaceRef]);

  const runLoop = useCallback(() => {
    const shouldContinue = executeSingleStep();
    if (shouldContinue) {
        let baseDelay = Math.max(5, (100 - speed) * 10); 
        if (safeData.type === 'EQUATION') baseDelay = Math.max(baseDelay, 2500);
        const prevAction = actionsRef.current[stepRef.current - 1];
        if (prevAction && prevAction.type === 'SCAN') baseDelay = Math.max(baseDelay, 500);

        executionRef.current = setTimeout(runLoop, baseDelay);
    }
  }, [executeSingleStep, speed, safeData.type]);

  // --- TIME TRAVEL ---
  const goToStep = useCallback((targetStep) => {
      if (executionRef.current) clearTimeout(executionRef.current);
      setGameState('PAUSED');

      if (targetStep <= 0) {
          setEngineState(null);
          setLastAction(null);
          currentStateRef.current = null;
          stepRef.current = 0;
          setCurrentStep(0);
          if (workspaceRef.current) workspaceRef.current.highlightBlock(null);
          return;
      }

      let tempState = getInitialState();
      const actions = actionsRef.current;
      
      for (let i = 0; i < targetStep; i++) {
          if (i >= actions.length) break;
          const action = actions[i];
          const res = plugin.executeStep(tempState, action, safeData);
          tempState = res.newState;
          if (i === targetStep - 1) {
              if (action.id && workspaceRef.current) workspaceRef.current.highlightBlock(action.id);
              setLastAction(action);
          }
      }

      currentStateRef.current = tempState;
      setEngineState(tempState);
      stepRef.current = targetStep;
      setCurrentStep(targetStep);

  }, [getInitialState, plugin, safeData, workspaceRef]);

  // --- INITIALISATION ---
  const initSimulation = useCallback(() => {
    if (!workspaceRef.current) return false;
    javascriptGenerator.init(workspaceRef.current);
    const userCode = javascriptGenerator.workspaceToCode(workspaceRef.current);
    
    let initCode = "";
    if (safeData.inputs) { Object.entries(safeData.inputs).forEach(([key, val]) => initCode += `var ${key} = ${JSON.stringify(val)};\n`); }

    let simState = { x: safeData.startPos.x, y: safeData.startPos.y, dir: safeData.startPos.dir !== undefined ? safeData.startPos.dir : 0 };
    let loopCount = 0; const MAX_LOOPS = 1000; 
    const api = {
        move: () => {
            let nextX = simState.x, nextY = simState.y;
            if (simState.dir === 0) nextX++; else if (simState.dir === 1) nextY++; else if (simState.dir === 2) nextX--; else if (simState.dir === 3) nextY--;
            if (MAZE_CONFIG.checkMove(safeData.grid, nextX, nextY) !== 'WALL') { simState.x = nextX; simState.y = nextY; }
        },
        turn: (d) => { const side = d; simState.dir = (side === 'LEFT') ? (simState.dir + 3) % 4 : (simState.dir + 1) % 4; },
        isPath: (d) => MAZE_CONFIG.look(safeData.grid, simState.x, simState.y, simState.dir, d),
        isDone: () => MAZE_CONFIG.checkMove(safeData.grid, simState.x, simState.y) === 'WIN',
        safeCheck: () => { loopCount++; if (loopCount > MAX_LOOPS) return false; return true; }
    };

    try {
      const generatedActions = [];
      const fn = new Function('actions', 'api', initCode + userCode);
      fn(generatedActions, api);
      actionsRef.current = generatedActions;
      setTotalSteps(generatedActions.length);
      return true;
    } catch (e) {
      alert("Erreur exécution : " + e.message);
      return false;
    }
  }, [workspaceRef, safeData]);

  const run = useCallback(() => {
    if (gameState === 'PAUSED') {
        setGameState('RUNNING');
        runLoop();
        return;
    }
    reset(); // Ceci remet le curseur à 0 mais garde les actions...
    
    // ...Mais initSimulation va les recalculer de toute façon, ce qui est normal pour un RUN explicite
    setTimeout(() => {
        if(initSimulation()) {
            setGameState('RUNNING');
            runLoop();
        }
    }, 0);
  }, [runLoop, reset, gameState, initSimulation]);

  const pause = useCallback(() => { if (executionRef.current) clearTimeout(executionRef.current); setGameState('PAUSED'); }, []);

  const stepForward = useCallback(() => {
      if (gameState === 'IDLE' || gameState === 'WON' || gameState === 'FAILED' || gameState === 'LOST') {
          reset();
          setTimeout(() => {
              if(initSimulation()) {
                setGameState('PAUSED');
                executeSingleStep();
              }
          }, 0);
      } else {
          if (gameState === 'RUNNING') pause();
          executeSingleStep();
          if (gameState !== 'WON' && gameState !== 'FAILED' && gameState !== 'LOST') setGameState('PAUSED');
      }
  }, [gameState, executeSingleStep, pause, initSimulation, reset]);

  return { 
      speed, setSpeed, engineState, gameState, solutionLines, 
      gameStats, proofToken, run, reset, pause, stepForward, lastAction,
      currentStep, totalSteps, goToStep, clearSimulation // On exporte clearSimulation
  };
}