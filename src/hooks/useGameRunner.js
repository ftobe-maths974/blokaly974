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

    if (action.type === 'SCAN') {
        stepRef.current += 1;
        return true; 
    }

    let actionForPlugin = action;
    const result = plugin.executeStep(currentStateRef.current, actionForPlugin, safeData);
    currentStateRef.current = result.newState;
    setEngineState(result.newState);
    stepRef.current += 1; 

    // 6. Vérif Victoire Immédiate
    if (result.status === 'WIN') {
        // CORRECTION TIMING : On laisse le temps à l'animation de se finir
        // 3000ms pour les équations (pour voir le calcul), 500ms pour le reste
        const winDelay = safeData.type === 'EQUATION' ? 3000 : 500;
        setTimeout(() => handleWin(workspaceRef.current.getAllBlocks(false).length), winDelay);
        return false; 
    } else if (result.status === 'LOST') {
        setTimeout(() => setGameState('LOST'), 500);
        return false; 
    }

    if (stepRef.current >= actions.length) {
        if (workspaceRef.current) workspaceRef.current.highlightBlock(null);
        
        // CORRECTION TIMING FIN DE SÉQUENCE
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
        // CORRECTION VITESSE : Calcul du délai entre les blocs
        let baseDelay = Math.max(5, (100 - speed) * 10); // De 5ms à 1000ms
        
        // Pour les équations, on veut que l'élève ait le temps de voir l'animation
        // On force un délai minimum de 2.5s entre chaque étape d'équation pour laisser l'animation se jouer
        if (safeData.type === 'EQUATION') {
            baseDelay = Math.max(baseDelay, 2500);
        }
        
        // Pour le radar, on garde un délai mini aussi
        const prevAction = actionsRef.current[stepRef.current - 1];
        if (prevAction && prevAction.type === 'SCAN') {
            baseDelay = Math.max(baseDelay, 500);
        }

        executionRef.current = setTimeout(runLoop, baseDelay);
    }
  }, [executeSingleStep, speed, safeData.type]);

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

    // API SIMULATION
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
  }, [workspaceRef, safeData, runLoop, reset, gameState]);

  const pause = useCallback(() => { if (executionRef.current) clearTimeout(executionRef.current); setGameState('PAUSED'); }, []);

  const stepForward = useCallback(() => {
      if (gameState === 'IDLE' || gameState === 'WON' || gameState === 'LOST' || gameState === 'FAILED') {
          // ... (logique stepForward inchangée, elle utilise executeSingleStep)
          // Pour faire court, je ne répète pas tout le bloc stepForward ici car il est identique
          // sauf qu'il appelle executeSingleStep qui a été mis à jour plus haut.
          if (!workspaceRef.current) return;
          javascriptGenerator.init(workspaceRef.current);
          const userCode = javascriptGenerator.workspaceToCode(workspaceRef.current);
          let initCode = "";
          if (safeData.inputs) { Object.entries(safeData.inputs).forEach(([k, v]) => initCode += `var ${k} = ${JSON.stringify(v)};\n`); }
          let simState = { x: safeData.startPos.x, y: safeData.startPos.y, dir: safeData.startPos.dir !== undefined ? safeData.startPos.dir : 0 };
          let loopCount = 0;
          const MAX_LOOPS = 1000;
          const api = {
            move: () => { 
                let nextX = simState.x, nextY = simState.y;
                if (simState.dir === 0) nextX++; else if (simState.dir === 1) nextY++; else if (simState.dir === 2) nextX--; else if (simState.dir === 3) nextY--; 
                if (MAZE_CONFIG.checkMove(safeData.grid, nextX, nextY) !== 'WALL') { simState.x = nextX; simState.y = nextY; } 
            },
            turn: (d) => { simState.dir = (d === 'LEFT') ? (simState.dir + 3) % 4 : (simState.dir + 1) % 4; },
            isPath: (d) => MAZE_CONFIG.look(safeData.grid, simState.x, simState.y, simState.dir, d),
            isDone: () => MAZE_CONFIG.checkMove(safeData.grid, simState.x, simState.y) === 'WIN',
            safeCheck: () => { loopCount++; if (loopCount > MAX_LOOPS) return false; return true; }
          };
          try {
            const gen = [];
            const fn = new Function('actions', 'api', initCode + userCode);
            fn(gen, api);
            actionsRef.current = gen;
            stepRef.current = 0;
            currentStateRef.current = null;
            setGameState('PAUSED');
            executeSingleStep();
          } catch(e) { alert("Erreur code : " + e.message); }
      } else {
          if (gameState === 'RUNNING') pause();
          executeSingleStep();
          if (gameState !== 'WON' && gameState !== 'FAILED' && gameState !== 'LOST') {
              setGameState('PAUSED');
          }
      }
  }, [gameState, safeData, executeSingleStep, pause, workspaceRef]);

  return { speed, setSpeed, engineState, gameState, solutionLines, gameStats, proofToken, run, reset, pause, stepForward, lastAction };
}