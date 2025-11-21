import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { MazePlugin } from '../../plugins/MazePlugin';
import { MathPlugin } from '../../plugins/MathPlugin';
import { TurtlePlugin } from '../../plugins/TurtlePlugin';
import FeedbackModal from './FeedbackModal';
import { generateProofToken } from '../../core/validation';
import InstructionPanel from './InstructionPanel';
import { MAZE_CONFIG } from '../../core/adapters/MazeAdapter';
import { registerStandardBlocks } from '../../core/StandardBlocks'; // Import du Core

const PLUGINS = { 'MAZE': MazePlugin, 'MATH': MathPlugin, 'TURTLE': TurtlePlugin };

const workspaceConfig = {
  collapse: true, comments: true, disable: true, maxBlocks: Infinity,
  trashcan: true, horizontalLayout: false, toolboxPosition: 'start',
  css: true, media: 'https://blockly-demo.appspot.com/static/media/',
  rtl: false, scrollbars: true, oneBasedIndex: true,
};

export default function GameEngine({ levelData, onWin }) {
  const plugin = PLUGINS[levelData?.type] || MazePlugin;
  const GameView = plugin.RenderComponent;

  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isReady, setIsReady] = useState(false); // Bloque l'affichage tant que pas prêt
  
  // 1. SÉCURISATION DES DONNÉES DU NIVEAU
  // On utilise useMemo pour ne pas recréer l'objet à chaque rendu (cause de boucle infinie)
  const safeData = useMemo(() => ({
    ...levelData,
    grid: levelData?.grid || MAZE_CONFIG.defaultGrid,
    startPos: { 
        x: Number(levelData?.startPos?.x) || 0, 
        y: Number(levelData?.startPos?.y) || 0, 
        dir: Number(levelData?.startPos?.dir) || 0 
    },
    // On s'assure que solutionBlocks est une chaine ou null
    solutionBlocks: levelData?.solutionBlocks || null,
    allowedBlocks: levelData?.allowedBlocks,
    inputs: levelData?.inputs,
    hiddenVars: levelData?.hiddenVars,
    lockedVars: levelData?.lockedVars,
    id: levelData?.id,
    instruction: levelData?.instruction,
    startBlocks: levelData?.startBlocks,
    maxBlocks: levelData?.maxBlocks
  }), [levelData]); 
  
  // Position initiale (Reset)
  const initialPlayerState = useMemo(() => ({
    x: safeData.startPos.x, 
    y: safeData.startPos.y, 
    dir: safeData.startPos.dir
  }), [safeData.startPos]);

  const [speed, setSpeed] = useState(50); 
  const [engineState, setEngineState] = useState(null); 
  const [gameState, setGameState] = useState('IDLE');
  const [showModal, setShowModal] = useState(false);
  const [gameStats, setGameStats] = useState({ stars: 0, blockCount: 0, target: 0 });
  const [proofToken, setProofToken] = useState("");
  const [solutionLines, setSolutionLines] = useState([]);

  const executionRef = useRef(null);
  const workspaceRef = useRef(null);

  // 2. ENREGISTREMENT DES BLOCS (Une seule fois au chargement du plugin)
  useEffect(() => {
    const B = Blockly.default || Blockly;
    if (B) {
        // On enregistre le standard
        registerStandardBlocks();
        
        // Et les blocs spécifiques du plugin actuel
        if (plugin.registerBlocks) {
            plugin.registerBlocks(B, javascriptGenerator);
        }
        
        // On signale que c'est prêt
        setIsReady(true);
    }
  }, [plugin]); // Ne se relance que si on change de type de jeu (Maze <-> Turtle)

  // 3. CALCUL DE LA TOOLBOX
  const currentToolbox = useMemo(() => {
      return plugin.getToolboxXML(
        safeData.allowedBlocks, safeData.inputs, safeData.hiddenVars, safeData.lockedVars 
      );
  }, [plugin, safeData.allowedBlocks, safeData.inputs, safeData.hiddenVars, safeData.lockedVars]);

  // 4. CALCUL DU MODÈLE (GHOST) - SANS BOUCLE INFINIE
  useEffect(() => {
    // Conditions strictes pour ne pas calculer pour rien
    if (!safeData.solutionBlocks || plugin.id !== 'TURTLE' || !isReady) {
        setSolutionLines([]);
        return;
    }

    // On utilise un timeout pour sortir du cycle de rendu React
    const timer = setTimeout(() => {
        try {
            const headlessWs = new Blockly.Workspace();
            const xml = Blockly.utils.xml.textToDom(safeData.solutionBlocks);
            Blockly.Xml.domToWorkspace(xml, headlessWs);
            
            javascriptGenerator.init(headlessWs);
            const code = javascriptGenerator.workspaceToCode(headlessWs);
            
            // Simulation
            const actions = [];
            new Function('actions', code)(actions);
            
            let simState = null;
            actions.forEach(action => {
                const res = plugin.executeStep(simState, action, safeData);
                simState = res.newState;
            });
            
            // Mise à jour de l'état SEULEMENT si les lignes ont changé (Deep Compare simple)
            if (simState?.lines) {
                setSolutionLines(prev => {
                    if (JSON.stringify(prev) === JSON.stringify(simState.lines)) return prev;
                    return simState.lines;
                });
            }
            headlessWs.dispose();
        } catch (e) { 
            console.error("Erreur modèle:", e); 
        }
    }, 50);

    return () => clearTimeout(timer);
  }, [safeData.solutionBlocks, plugin.id, isReady, safeData]); // Dépendances précises

  // Gestion de l'injection Blockly
  const handleInject = (newWorkspace) => {
    workspaceRef.current = newWorkspace;
    javascriptGenerator.init(newWorkspace); 
    newWorkspace.updateToolbox(currentToolbox);
    
    if (safeData.startBlocks) {
       try {
           const xmlDom = Blockly.utils.xml.textToDom(safeData.startBlocks);
           Blockly.Xml.domToWorkspace(xmlDom, newWorkspace);
       } catch (e) { console.error(e); }
    }
  };

  // Mise à jour toolbox si elle change
  useEffect(() => {
    if (workspaceRef.current && isReady) {
        workspaceRef.current.updateToolbox(currentToolbox);
    }
  }, [currentToolbox, isReady]); 
  
  // --- EXÉCUTION ---
  const runCode = () => {
    if (!workspaceRef.current) return;
    setGameState('RUNNING');
    setEngineState(null); 

    javascriptGenerator.init(workspaceRef.current);
    let userCode = javascriptGenerator.workspaceToCode(workspaceRef.current);
    
    let initCode = "";
    if (safeData.inputs) {
        Object.entries(safeData.inputs).forEach(([key, val]) => {
            initCode += `var ${key} = ${JSON.stringify(val)};\n`;
        });
    }
    
    const actions = [];
    try {
      new Function('actions', initCode + userCode)(actions);
    } catch (e) {
      alert("Erreur code : " + e.message);
      setGameState('IDLE');
      return;
    }

    let step = 0;
    let currentState = null; 

    const playStep = () => {
      if (step >= actions.length) {
        // Vérification Victoire
        if (plugin.checkVictory) {
            const success = plugin.checkVictory(currentState, safeData, solutionLines);
            if (success) {
                setGameState('WON');
                handleWin();
                return;
            }
        }
        setGameState('IDLE');
        return;
      }

      const action = actions[step];
      step++;

      const result = plugin.executeStep(currentState, action, safeData);
      currentState = result.newState;
      setEngineState(currentState);

      if (result.status === 'WIN') {
        setGameState('WON');
        handleWin(); 
        return;
      } else if (result.status === 'LOST') {
        setGameState('LOST');
        return;
      }

      const delay = Math.max(5, (100 - speed) * 10);
      executionRef.current = setTimeout(playStep, delay);
    };
    playStep();
  };

  const handleWin = () => {
    const currentBlocks = workspaceRef.current.getAllBlocks(false).length;
    const targetBlocks = safeData.maxBlocks || 5; 
    let stars = (currentBlocks <= targetBlocks) ? 3 : 2;
    setGameStats({ stars, blockCount: currentBlocks, target: targetBlocks });
    if (onWin) onWin({ stars, blockCount: currentBlocks });
    const token = generateProofToken(safeData.id || 1, { stars, blocks: currentBlocks });
    setProofToken(token);
    setTimeout(() => setShowModal(true), 500);
  };

  const handleReset = () => {
    if (executionRef.current) clearTimeout(executionRef.current);
    setGameState('IDLE');
    setEngineState(null);
  }

  // Props pour le rendu graphique (Sécurisées)
  const renderProps = {
      grid: safeData.grid,
      // Important : fallback sur initialPlayerState si le moteur est à l'arrêt
      playerPos: engineState ? {x: engineState.x, y: engineState.y} : initialPlayerState,
      playerDir: engineState ? engineState.dir : initialPlayerState.dir,
      state: engineState || { variables: safeData.inputs },
      history: engineState?.logs,
      hiddenVars: safeData.hiddenVars || [],
      modelLines: solutionLines
  };

  // Si les blocs ne sont pas chargés, on n'affiche rien pour éviter le crash
  if (!isReady) return <div style={{padding: 20, color: '#666'}}>Chargement du moteur...</div>;

  return (
    <div style={{display: 'flex', height: '100%', flexDirection: 'column'}}>
      <div style={{padding: '10px', background: '#eee', display: 'flex', alignItems: 'center', gap: '15px', borderBottom:'1px solid #ccc'}}>
        <button onClick={runCode} disabled={gameState === 'RUNNING'} style={{padding: '8px 16px', background: '#27ae60', color: 'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>▶️ Go</button>
        <button onClick={handleReset} style={{padding: '8px 16px', background: '#e74c3c', color: 'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>🔄 Stop</button>
        
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', background: 'white', padding: '5px 10px', borderRadius: '20px', border: '1px solid #ddd'}}>
            <span style={{fontSize: '1.2rem'}}>🐢</span>
            <input type="range" min="0" max="100" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{width: '100px', cursor: 'pointer'}} title={`Vitesse : ${speed}%`} />
            <span style={{fontSize: '1.2rem'}}>🐇</span>
        </div>
      </div>

      <div style={{display: 'flex', flex: 1, overflow: 'hidden'}}>
        <InstructionPanel 
            title={`Niveau ${safeData.id || ""}`} content={safeData.instruction}
            isCollapsed={!isPanelOpen} onToggle={() => setIsPanelOpen(!isPanelOpen)}
        />

        <div className="blocklyContainer" style={{flex: 1, position: 'relative', minWidth: '0'}}>
          <BlocklyWorkspace
            key={`${safeData.id}-${plugin.id}`} 
            className="blockly-div"
            toolboxConfiguration={currentToolbox}
            workspaceConfiguration={workspaceConfig}
            onInject={handleInject}
          />
        </div>
      
        <div style={{width: '40%', background: '#2c3e50', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow:'hidden'}}>
          <GameView {...renderProps} />
        </div>

        <FeedbackModal 
          isOpen={showModal} stats={gameStats} token={proofToken} 
          onReplay={() => {setShowModal(false); handleReset();}} 
          onMenu={() => window.location.reload()}
        />
      </div>
    </div>
  );
}