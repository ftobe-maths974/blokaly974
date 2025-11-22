import { useState, useRef, useEffect, useCallback } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { generateProofToken } from '../core/validation';

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
    const targetBlocks = safeData.maxBlocks || 5; // Valeur par défaut si oubli
    
    // Logique de scoring gamifiée
    let stars = 1;
    if (currentBlocks <= targetBlocks) {
        stars = 3; // Parfait
    } else if (currentBlocks <= Math.ceil(targetBlocks * 1.5)) {
        stars = 2; // Bien, mais peut optimiser
    }
    
    setGameStats({ stars, blockCount: currentBlocks, target: targetBlocks });
    
    const token = generateProofToken(safeData.id || 1, { stars, blocks: currentBlocks });
    setProofToken(token);
    setGameState('WON');
  }, [safeData]);

  const handleFail = useCallback(() => {
    // Programme fini mais objectif non atteint
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

    // Si on a dépassé la fin (ne devrait pas arriver si on gère bien l'index)
    if (step >= actions.length) {
        return false; 
    }

    // 1. Highlight
    const action = actions[step];
    if (action.id && workspaceRef.current) {
        workspaceRef.current.highlightBlock(action.id);
    }

    // 2. Adaptateur Plugin (Compatibilité Maze)
    let actionForPlugin = action;
    if (plugin.id === 'MAZE' && typeof action === 'object' && action.type) {
        if (action.type.startsWith('TURN')) actionForPlugin = action.type; // "TURN_LEFT"
        else actionForPlugin = action.type; // "MOVE"
    }

    // 3. Exécution Logique
    const result = plugin.executeStep(currentStateRef.current, actionForPlugin, safeData);
    currentStateRef.current = result.newState;
    setEngineState(result.newState);
    stepRef.current += 1; // On avance l'index

    // 4. Vérification Immédiate (Crash mur ou Case Arrivée)
    if (result.status === 'WIN') {
        // Délai pour voir l'animation d'arrivée
        setTimeout(() => handleWin(workspaceRef.current.getAllBlocks(false).length), 500);
        return false; // Stop
    } else if (result.status === 'LOST') {
        setTimeout(() => setGameState('LOST'), 500);
        return false; // Stop
    }

    // 5. Vérification Fin de Programme (Est-ce la dernière instruction ?)
    if (stepRef.current >= actions.length) {
        if (workspaceRef.current) workspaceRef.current.highlightBlock(null);
        
        // On lance la validation finale (Pixel Match pour Tortue)
        // Avec un délai pour laisser le dernier trait se dessiner
        setTimeout(() => {
            let success = false;
            if (plugin.checkVictory) {
                success = plugin.checkVictory(currentStateRef.current, safeData, solutionLines);
            }
            
            if (success) handleWin(workspaceRef.current.getAllBlocks(false).length);
            else handleFail(); // <--- FEEDBACK "ESSAYE ENCORE"
            
        }, 500);

        return false; // Stop boucle
    }

    return true; // Continue
  }, [plugin, safeData, solutionLines, handleWin, handleFail, workspaceRef]);

  // BOUCLE
  const runLoop = useCallback(() => {
    const shouldContinue = executeSingleStep();
    if (shouldContinue) {
        const delay = Math.max(5, (100 - speed) * 10);
        executionRef.current = setTimeout(runLoop, delay);
    }
  }, [executeSingleStep, speed]);

  // --- COMMANDES ---
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

    try {
      const generatedActions = [];
      new Function('actions', initCode + userCode)(generatedActions);
      actionsRef.current = generatedActions;
      stepRef.current = 0;
      currentStateRef.current = null;
      
      setGameState('RUNNING');
      runLoop();
    } catch (e) {
      alert("Erreur code : " + e.message);
      setGameState('IDLE');
    }
  }, [workspaceRef, safeData, runLoop, reset, gameState]);

  const pause = useCallback(() => {
      if (executionRef.current) clearTimeout(executionRef.current);
      setGameState('PAUSED');
  }, []);

  const stepForward = useCallback(() => {
      if (gameState === 'IDLE' || gameState === 'WON' || gameState === 'LOST' || gameState === 'FAILED') {
          // Démarrage à froid en mode pas à pas
          if (!workspaceRef.current) return;
          javascriptGenerator.init(workspaceRef.current);
          const userCode = javascriptGenerator.workspaceToCode(workspaceRef.current);
          let initCode = "";
          if (safeData.inputs) {
              Object.entries(safeData.inputs).forEach(([key, val]) => {
                  initCode += `var ${key} = ${JSON.stringify(val)};\n`;
              });
          }
          try {
            const generatedActions = [];
            new Function('actions', initCode + userCode)(generatedActions);
            actionsRef.current = generatedActions;
            stepRef.current = 0;
            currentStateRef.current = null;
            
            setGameState('PAUSED');
            // Exécute le PREMIER pas tout de suite
            executeSingleStep(); 
          } catch(e) { alert("Erreur : " + e.message); }
      } else {
          // Pas suivant
          if (gameState === 'RUNNING') pause();
          executeSingleStep(); // La vérif de fin est intégrée dedans !
          if (gameState !== 'WON' && gameState !== 'FAILED') setGameState('PAUSED');
      }
  }, [gameState, safeData, executeSingleStep, pause, workspaceRef]);

  return {
    speed, setSpeed,
    engineState, gameState,
    solutionLines, gameStats, proofToken,
    run, reset, pause, stepForward
  };
}