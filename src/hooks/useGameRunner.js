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
  
  const [gameStats, setGameStats] = useState({ stars: 0, metric: '', feedback: null });
  const [proofToken, setProofToken] = useState("");
  const [lastAction, setLastAction] = useState(null);
  
  // Time Traveller
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  // --- REFS (Pour la stabilité de la boucle) ---
  const executionRef = useRef(null);
  const actionsRef = useRef([]);
  const stepRef = useRef(0);
  const currentStateRef = useRef(null);
  
  // 👉 NOUVEAU : SpeedRef pour lecture immédiate dans la boucle sans redémarrage
  const speedRef = useRef(speed);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  // --- 0. INITIALISATION ÉTAT (Pour voir l'équation/tortue au départ) ---
  useEffect(() => {
      if (plugin.executeStep) {
          try {
            // On génère un état "vide" pour initialiser l'affichage
            const initialState = plugin.executeStep(null, null, safeData).newState;
            setEngineState(initialState);
            currentStateRef.current = initialState;
          } catch(e) { console.warn("Init error", e); }
      }
  }, [safeData, plugin]);

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
        const api = { move:()=>{}, turn:()=>{}, pen:()=>{}, color:()=>{}, isPath:()=>false, isDone:()=>false, safeCheck:()=>true };
        new Function('actions', 'api', code)(actions, api);
        
        let simState = null;
        actions.forEach(a => { if (plugin.executeStep) simState = plugin.executeStep(simState, a, safeData).newState; });
        if (simState?.lines) setSolutionLines(simState.lines);
        headlessWs.dispose();
      } catch (e) { console.error("Erreur modèle:", e); }
    }, 50);
    return () => clearTimeout(timer);
  }, [safeData.solutionBlocks, plugin, safeData]);

  // --- 2. GESTION FIN DE JEU (Mise à jour) ---
  const handleGameEnd = useCallback((finalState, statusTrigger) => {
      // Annuler toute boucle en cours
      if (executionRef.current) clearTimeout(executionRef.current);

      // Récupérer le délai configuré
      const delay = plugin.config?.victoryDelay || 800;

      console.log(`🏁 Fin détectée (${statusTrigger}). Attente de ${delay}ms...`);

      executionRef.current = setTimeout(() => {
          let result = { status: 'RUNNING', feedback: null };
          
          if (plugin.evaluateResult) {
              // 👇 C'EST ICI LA MODIFICATION IMPORTANTE
              const metrics = { 
                  blockCount: workspaceRef.current?.getAllBlocks(false).length || 0,
                  steps: stepRef.current // On envoie le nombre d'actions exécutées au juge
              };
              
              result = plugin.evaluateResult(finalState, safeData, metrics, solutionLines);
          } else {
              // Fallback (Sandbox)
              if (statusTrigger === 'WIN') result = { status: 'WIN', score: { stars: 3 } };
              if (statusTrigger === 'LOST') result = { status: 'LOST' };
          }

          // 2. Mise à jour de l'UI
          if (result.status === 'WIN') {
              setGameStats({ 
                  stars: result.score.stars, 
                  metric: result.score.primaryMetric,
                  target: result.score.targetMetric,
                  feedback: result.feedback 
              });
              const token = generateProofToken(safeData.id || 1, { stars: result.score.stars });
              setProofToken(token);
              setGameState('WON');
          } 
          else if (result.status === 'FAIL') { // Ajout explicite du cas FAIL
              setGameStats({ stars: 0, feedback: result.feedback });
              setGameState('FAILED');
          }
          else if (statusTrigger === 'LOST') {
              setGameStats({ stars: 0, feedback: { message: "Le robot a heurté un obstacle." } });
              setGameState('LOST');
          }
          // Si RUNNING, on ne fait rien (on attend)
      }, delay);

  }, [plugin, safeData, solutionLines]);

  const reset = useCallback(() => {
    if (executionRef.current) clearTimeout(executionRef.current);
    setGameState('IDLE');
    const initialState = plugin.executeStep ? plugin.executeStep(null, null, safeData).newState : null;
    setEngineState(initialState);
    currentStateRef.current = initialState;
    setLastAction(null); 
    stepRef.current = 0;
    setCurrentStep(0);
    actionsRef.current = [];
    setTotalSteps(0);
    if (workspaceRef.current) workspaceRef.current.highlightBlock(null);
  }, [workspaceRef, plugin, safeData]);

  // --- 3. EXÉCUTION D'UNE ÉTAPE ---
  const executeSingleStep = useCallback(() => {
    const actions = actionsRef.current;
    const step = stepRef.current;

    // A. Fin de script atteinte
    if (step >= actions.length) {
        if (workspaceRef.current) workspaceRef.current.highlightBlock(null);
        handleGameEnd(currentStateRef.current, 'CHECK'); // On lance la vérification finale
        return false; // Stop boucle
    }

    const action = actions[step];
    setLastAction({ ...action, _uid: step }); // Pour animer l'UI
    if (action.id && workspaceRef.current) workspaceRef.current.highlightBlock(action.id);
    setCurrentStep(step + 1);

    // B. Actions "virtuelles" (Scanner, Boucle) qui ne changent pas l'état visible
    if (action.type === 'SCAN' || action.type === 'LOOP_CHECK') {
        stepRef.current += 1;
        return true; // Continue
    }

    // C. Exécution réelle
    const result = plugin.executeStep(currentStateRef.current, action, safeData);
    currentStateRef.current = result.newState;
    setEngineState(result.newState);
    stepRef.current += 1; 

    // D. Vérification immédiate (Crash ou Victoire anticipée)
    if (result.status === 'WIN') {
        handleGameEnd(result.newState, 'WIN');
        return false; 
    } 
    else if (result.status === 'LOST') {
        handleGameEnd(result.newState, 'LOST');
        return false; 
    }

    return true; // Continue la boucle
  }, [plugin, safeData, handleGameEnd, workspaceRef]);

  // --- 4. BOUCLE DE JEU (Loop) ---
  const runLoop = useCallback(() => {
    const shouldContinue = executeSingleStep();
    
    if (shouldContinue) {
        // 👉 Calcul du délai basé sur la Ref (Lecture instantanée)
        // 0 (Tortue) -> 1500ms
        // 50 (Normal) -> 500ms
        // 100 (Lapin) -> 50ms
        const s = speedRef.current;
        let delay = 50; 
        if (s < 90) delay = 200 + (100 - s) * 10; 
        if (s < 10) delay = 1500; // Mode présentation très lent

        // Ralentissement sur les scans pour visualisation
        const prevAction = actionsRef.current[stepRef.current - 1];
        if (prevAction && (prevAction.type === 'SCAN')) {
            delay = Math.max(delay, 800); 
        }

        executionRef.current = setTimeout(runLoop, delay);
    }
  }, [executeSingleStep]); // Plus de dépendance à 'speed' ici !

  const pause = useCallback(() => { 
      if (executionRef.current) clearTimeout(executionRef.current); 
      setGameState('PAUSED'); 
  }, []);

  // --- 5. LANCEMENT (RUN) ---
  const run = useCallback(() => {
    if (!workspaceRef.current) return;
    
    // Reprise après Pause
    if (gameState === 'PAUSED' && actionsRef.current.length > 0) {
        setGameState('RUNNING');
        runLoop();
        return;
    }

    reset();
    
    // Génération du Code
    javascriptGenerator.init(workspaceRef.current);
    const userCode = javascriptGenerator.workspaceToCode(workspaceRef.current);
    let initCode = "";
    if (safeData.inputs) Object.entries(safeData.inputs).forEach(([k, v]) => initCode += `var ${k} = ${JSON.stringify(v)};\n`);

    // Mock API
    const config = plugin.config || {}; 
    let simState = { x: safeData.startPos.x, y: safeData.startPos.y, dir: safeData.startPos.dir || 0 };
    let loopCount = 0;
    const api = {
        move: () => {
            let nextX = simState.x, nextY = simState.y;
            if (simState.dir === 0) nextX++; else if (simState.dir === 1) nextY++; else if (simState.dir === 2) nextX--; else if (simState.dir === 3) nextY--;
            if (config.checkMove && config.checkMove(safeData.grid, nextX, nextY) !== 'WALL') { simState.x = nextX; simState.y = nextY; }
            else if (!config.checkMove) { simState.x = nextX; simState.y = nextY; }
        },
        turn: (d) => { simState.dir = (d === 'LEFT') ? (simState.dir + 3) % 4 : (simState.dir + 1) % 4; },
        isPath: (d) => config.look ? config.look(safeData.grid, simState.x, simState.y, simState.dir, d) : true,
        isDone: () => config.checkMove ? config.checkMove(safeData.grid, simState.x, simState.y) === 'WIN' : false,
        safeCheck: () => (++loopCount <= 1000),
        pen: () => {}, color: () => {} 
    };

    try {
      const generatedActions = [];
      new Function('actions', 'api', initCode + userCode)(generatedActions, api);
      
      actionsRef.current = generatedActions;
      setTotalSteps(generatedActions.length);
      
      // Init état propre
      const initialState = plugin.executeStep(null, null, safeData).newState;
      currentStateRef.current = initialState;
      setEngineState(initialState);
      
      setGameState('RUNNING');
      runLoop();
    } catch (e) {
      alert("Erreur dans votre code : " + e.message);
      setGameState('IDLE');
    }
  }, [workspaceRef, safeData, runLoop, reset, gameState, plugin]);

  // --- 6. PAS À PAS ---
  const stepForward = useCallback(() => {
      if (actionsRef.current.length === 0) { run(); setTimeout(pause, 20); return; }
      if (gameState === 'RUNNING') pause();
      executeSingleStep();
      if (gameState !== 'WON' && gameState !== 'FAILED' && gameState !== 'LOST') setGameState('PAUSED');
  }, [gameState, executeSingleStep, pause, run]);

  // --- 7. TIME TRAVEL ---
  const timeTravel = useCallback((targetStep) => {
      if (actionsRef.current.length === 0) return;
      if (executionRef.current) clearTimeout(executionRef.current);
      setGameState('PAUSED');

      let tempState = plugin.executeStep(null, null, safeData).newState;
      for (let i = 0; i < targetStep; i++) {
          const action = actionsRef.current[i];
          if (action.type !== 'SCAN' && action.type !== 'LOOP_CHECK') {
              tempState = plugin.executeStep(tempState, action, safeData).newState;
          }
      }
      currentStateRef.current = tempState;
      stepRef.current = targetStep;
      setCurrentStep(targetStep);
      setEngineState(tempState);
      
      if (targetStep > 0 && workspaceRef.current) {
          const id = actionsRef.current[targetStep - 1]?.id;
          if (id) workspaceRef.current.highlightBlock(id);
      }
  }, [plugin, safeData, workspaceRef]);

  return { 
      speed, setSpeed, engineState, gameState, solutionLines, gameStats, proofToken, 
      run, reset, pause, stepForward, lastAction, currentStep, totalSteps, timeTravel 
  };
}