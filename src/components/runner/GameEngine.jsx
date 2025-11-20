import React, { useState, useRef, useEffect } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

// IMPORT DES PLUGINS
import { MazePlugin } from '../../plugins/MazePlugin';
import { MathPlugin } from '../../plugins/MathPlugin';

import FeedbackModal from './FeedbackModal';
import { generateProofToken } from '../../core/validation';
import InstructionPanel from './InstructionPanel';

// REGISTRE DES PLUGINS
const PLUGINS = {
  'MAZE': MazePlugin,
  'MATH': MathPlugin
};

const workspaceConfig = {
  collapse: true, comments: true, disable: true, maxBlocks: Infinity,
  trashcan: true, horizontalLayout: false, toolboxPosition: 'start',
  css: true, media: 'https://blockly-demo.appspot.com/static/media/',
  rtl: false, scrollbars: true, oneBasedIndex: true,
};

export default function GameEngine({ levelData, onWin }) {
  // 1. SÉLECTION DU PLUGIN
  const plugin = PLUGINS[levelData?.type] || MazePlugin;
  const GameView = plugin.RenderComponent;

  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const safeData = levelData || {};
  
  // État générique (sera x/y pour Maze, variables pour Math)
  const [engineState, setEngineState] = useState(null); 
  const [xml, setXml] = useState(safeData.startBlocks || "");
  const [gameState, setGameState] = useState('IDLE');
  const [showModal, setShowModal] = useState(false);
  const [gameStats, setGameStats] = useState({ stars: 0, blockCount: 0, target: 0 });
  const [proofToken, setProofToken] = useState("");

  const executionRef = useRef(null);
  const workspaceRef = useRef(null);

  // 2. INITIALISATION BLOCS & TOOLBOX
  useEffect(() => {
    plugin.registerBlocks(Blockly, javascriptGenerator);
  }, [plugin]);

  const currentToolbox = plugin.getToolboxXML(safeData.allowedBlocks);

  const handleInject = (newWorkspace) => {
    workspaceRef.current = newWorkspace;
    javascriptGenerator.init(newWorkspace); 
    newWorkspace.updateToolbox(currentToolbox);
    
    // Création des variables initiales si besoin (Mode Math)
    if (safeData.inputs) {
        Object.keys(safeData.inputs).forEach(v => newWorkspace.createVariable(v));
    }
  };

  useEffect(() => {
    if (workspaceRef.current) {
        workspaceRef.current.updateToolbox(currentToolbox);
    }
  }, [safeData, currentToolbox]); 
  
  // 3. MOTEUR D'EXÉCUTION GÉNÉRIQUE
  const runCode = () => {
    if (!workspaceRef.current) return;
    setGameState('RUNNING');
    
    // Reset de l'état via le plugin (si implémenté) ou null pour reset par défaut
    setEngineState(null); 

    javascriptGenerator.init(workspaceRef.current);
    let code = javascriptGenerator.workspaceToCode(workspaceRef.current);
    
    const actions = [];
    try {
      const fn = new Function('actions', code);
      fn(actions);
    } catch (e) {
      alert("Erreur code : " + e.message);
      setGameState('IDLE');
      return;
    }

    let step = 0;
    let currentState = null; // État courant local à l'exécution

    const playStep = () => {
      if (step >= actions.length) {
        setGameState('IDLE'); // Fin sans victoire
        return;
      }

      const action = actions[step];
      step++;

      // --- DÉLÉGATION AU PLUGIN ---
      const result = plugin.executeStep(currentState, action, safeData);
      
      currentState = result.newState;
      setEngineState(currentState); // Mise à jour visuelle

      if (result.status === 'WIN') {
        setGameState('WON');
        handleWin(); 
        return;
      } else if (result.status === 'LOST') {
        setGameState('LOST');
        return;
      }

      executionRef.current = setTimeout(playStep, plugin.id === 'MATH' ? 800 : 300); // Plus lent pour les maths pour bien voir
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
    setEngineState(null); // Reset visuel
  }

  return (
    <div style={{display: 'flex', height: '100%', flexDirection: 'column'}}>
      <div style={{padding: '10px', background: '#eee', display: 'flex', gap: '10px', borderBottom:'1px solid #ccc'}}>
        <button onClick={runCode} disabled={gameState === 'RUNNING'} style={{padding: '8px 16px', background: '#27ae60', color: 'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>▶️ Exécuter</button>
        <button onClick={handleReset} style={{padding: '8px 16px', background: '#e74c3c', color: 'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>🔄 Reset</button>
      </div>

      <div style={{display: 'flex', flex: 1, overflow: 'hidden'}}>
        <InstructionPanel 
            title={`Niveau ${safeData.id || ""}`} content={safeData.instruction}
            isCollapsed={!isPanelOpen} onToggle={() => setIsPanelOpen(!isPanelOpen)}
        />

        <div className="blocklyContainer" style={{flex: 1, position: 'relative', minWidth: '0'}}>
          <BlocklyWorkspace
            className="blockly-div" toolboxConfiguration={currentToolbox} initialXml={xml}
            onXmlChange={setXml} workspaceConfiguration={workspaceConfig} onInject={handleInject}
          />
        </div>
      
        {/* ZONE DE DROITE DYNAMIQUE */}
        <div style={{width: '40%', background: '#2c3e50', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow:'hidden'}}>
          {/* On passe 'state' qui contient soit {x,y} pour Maze, soit {variables} pour Math */}
          {/* On passe aussi 'history' (les logs) si le plugin en a besoin */}
          <GameView 
             // Props Maze
             grid={safeData.grid} 
             playerPos={engineState ? {x: engineState.x, y: engineState.y} : (safeData.startPos || {x:0, y:1})} 
             playerDir={engineState ? engineState.dir : 1}
             
             // Props Math
             state={engineState || { variables: safeData.inputs }} 
             history={engineState?.logs}
          />
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