import { useState, useRef, useEffect, useCallback } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { generateProofToken } from '../core/validation';
import { MAZE_CONFIG } from '../core/adapters/MazeAdapter';

export function useGameRunner(workspaceRef, plugin, safeData) {
  // --- ÉTATS ---
  const [speed, setSpeed] = useState(50);
  const [engineState, setEngineState] = useState(null);
  const [gameState, setGameState] = useState('IDLE'); // IDLE, RUNNING, PAUSED, WON, LOST, FAILED
  const [solutionLines, setSolutionLines] = useState([]);
  
  const [gameStats, setGameStats] = useState({ stars: 0, blockCount: 0, target: 0 });
  const [proofToken, setProofToken] = useState("");

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
    if (action.id && workspaceRef.current) workspaceRef.current.highlightBlock(action.id);

    let actionForPlugin = action;
    if (plugin.id === 'MAZE' && typeof action === 'object' && action.type) {
        if (action.type.startsWith('TURN')) actionForPlugin = action.type; 
        else actionForPlugin = action.type; 
    }

    const result = plugin.executeStep(currentStateRef.current, actionForPlugin, safeData);
    currentStateRef.current = result.newState;
    setEngineState(result.newState);
    stepRef.current += 1; 

    if (result.status === 'WIN') {
        setTimeout(() => handleWin(workspaceRef.current.getAllBlocks(false).length), 500);
        return false; 
    } else if (result.status === 'LOST') {
        setTimeout(() => setGameState('LOST'), 500);
        return false; 
    }

    if (stepRef.current >= actions.length) {
        if (workspaceRef.current) workspaceRef.current.highlightBlock(null);
        setTimeout(() => {
            let success = false;
            if (plugin.checkVictory) success = plugin.checkVictory(currentStateRef.current, safeData, solutionLines);
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
        const delay = Math.max(5, (100 - speed) * 10);
        executionRef.current = setTimeout(runLoop, delay);
    }
  }, [executeSingleStep, speed]);

  // --- 4. COMMANDES PUBLIQUES (AVEC API RADAR) ---

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

    // --- API SIMULATION RADAR ---
    let simState = { 
        x: safeData.startPos.x, 
        y: safeData.startPos.y, 
        dir: safeData.startPos.dir 
    };
    let loopCount = 0;

    const api = {
        move: () => {
            let nextX = simState.x, nextY = simState.y;
            if (simState.dir === 0) nextY--; else if (simState.dir === 1) nextX++; 
            else if (simState.dir === 2) nextY++; else if (simState.dir === 3) nextX--;
            
            // On met à jour l'état virtuel même si c'est un mur (pour que la simu soit fidèle au crash)
            // MAIS pour le radar, on veut juste savoir où on *serait*.
            // Le `executeStep` réel gérera le crash.
            // Ici on suppose que si c'est pas un mur, on avance.
            if (MAZE_CONFIG.checkMove(safeData.grid, nextX, nextY) !== 'WALL') {
                simState.x = nextX; simState.y = nextY;
            }
        },
        turn: (d) => { 
            const side = d; // 'LEFT' ou 'RIGHT'
            simState.dir = (side === 'LEFT') ? (simState.dir + 3) % 4 : (simState.dir + 1) % 4;
        },
        isPath: (d) => MAZE_CONFIG.look(safeData.grid, simState.x, simState.y, simState.dir, d),
        isDone: () => MAZE_CONFIG.checkMove(safeData.grid, simState.x, simState.y) === 'WIN',
        safeCheck: () => { 
            loopCount++; 
            // On augmente la limite pour les grands labyrinthes
            if (loopCount > 10000) throw new Error("Boucle infinie !"); 
            return true; 
        }
    };

    try {
      const generatedActions = [];
      const fn = new Function('actions', 'api', initCode + userCode);
      fn(generatedActions, api); // Injection de l'API
      
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

  const pause = useCallback(() => {
      if (executionRef.current) clearTimeout(executionRef.current);
      setGameState('PAUSED');
  }, []);

  const stepForward = useCallback(() => {
      if (gameState === 'IDLE' || gameState === 'WON' || gameState === 'LOST' || gameState === 'FAILED') {
          if (!workspaceRef.current) return;
          javascriptGenerator.init(workspaceRef.current);
          const userCode = javascriptGenerator.workspaceToCode(workspaceRef.current);
          let initCode = "";
          if (safeData.inputs) { Object.entries(safeData.inputs).forEach(([k, v]) => initCode += `var ${k} = ${JSON.stringify(v)};\n`); }
          
          // Initialisation API pour le stepForward aussi (cas "Démarrer en pas à pas")
          let simState = { x: safeData.startPos.x, y: safeData.startPos.y, dir: safeData.startPos.dir };
          let loopCount = 0;
          const api = {
            move: () => { let nextX = simState.x, nextY = simState.y; if (simState.dir === 0) nextY--; else if (simState.dir === 1) nextX++; else if (simState.dir === 2) nextY++; else if (simState.dir === 3) nextX--; if (MAZE_CONFIG.checkMove(safeData.grid, nextX, nextY) !== 'WALL') { simState.x = nextX; simState.y = nextY; } },
            turn: (d) => { simState.dir = (d === 'LEFT') ? (simState.dir + 3) % 4 : (simState.dir + 1) % 4; },
            isPath: (d) => MAZE_CONFIG.look(safeData.grid, simState.x, simState.y, simState.dir, d),
            isDone: () => MAZE_CONFIG.checkMove(safeData.grid, simState.x, simState.y) === 'WIN',
            safeCheck: () => { loopCount++; if (loopCount > 10000) throw new Error("Boucle infinie !"); return true; }
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
          } catch(e) { alert(e.message); }
      } else {
          if (gameState === 'RUNNING') pause();
          executeSingleStep();
          if (gameState !== 'WON' && gameState !== 'FAILED' && gameState !== 'LOST') setGameState('PAUSED');
      }
  }, [gameState, safeData, executeSingleStep, pause, workspaceRef]);

  return { speed, setSpeed, engineState, gameState, solutionLines, gameStats, proofToken, run, reset, pause, stepForward };
}