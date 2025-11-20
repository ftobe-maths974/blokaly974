import React, { useState, useRef, useEffect } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

// NOUVEAU : On importe le Plugin
import { MazePlugin } from '../../plugins/MazePlugin';

import { MAZE_CONFIG } from '../../core/adapters/MazeAdapter'; 
import FeedbackModal from './FeedbackModal';
import { generateProofToken } from '../../core/validation';
import InstructionPanel from './InstructionPanel';

// Registre des plugins
const PLUGINS = {
  'MAZE': MazePlugin
};

const workspaceConfig = {
  collapse: true, comments: true, disable: true, maxBlocks: Infinity,
  trashcan: true, horizontalLayout: false, toolboxPosition: 'start',
  css: true, media: 'https://blockly-demo.appspot.com/static/media/',
  rtl: false, scrollbars: true, oneBasedIndex: true,
};

export default function GameEngine({ levelData, onWin }) {
  // 1. Chargement du Plugin adapté
  const plugin = PLUGINS[levelData?.type] || MazePlugin;
  const GameView = plugin.RenderComponent;

  // --- ÉTATS ---
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const safeData = levelData || { grid: MAZE_CONFIG.defaultGrid, startPos: {x:0, y:1} };
  
  const [playerState, setPlayerState] = useState({
    x: safeData.startPos?.x || 0,
    y: safeData.startPos?.y || 1,
    dir: 1
  });

  // --- CORRECTION ICI : UNE SEULE DÉCLARATION DE XML ---
  // On initialise avec le code de départ s'il existe, sinon vide
  const [xml, setXml] = useState(safeData.startBlocks || "");
  
  const [gameState, setGameState] = useState('IDLE');
  const [showModal, setShowModal] = useState(false);
  const [gameStats, setGameStats] = useState({ stars: 0, blockCount: 0, target: 0 });
  const [proofToken, setProofToken] = useState("");

  const executionRef = useRef(null);
  const workspaceRef = useRef(null);

  // 2. Enregistrement des blocs VIA LE PLUGIN
  useEffect(() => {
    plugin.registerBlocks(Blockly, javascriptGenerator);
  }, [plugin]);

  // 3. Toolbox VIA LE PLUGIN
  const currentToolbox = plugin.getToolboxXML(safeData.allowedBlocks);

  const handleInject = (newWorkspace) => {
    workspaceRef.current = newWorkspace;
    javascriptGenerator.init(newWorkspace); 
    newWorkspace.updateToolbox(currentToolbox);
  };

  useEffect(() => {
    if (workspaceRef.current) {
      workspaceRef.current.updateToolbox(currentToolbox);
    }
  }, [safeData, currentToolbox]); 
  
  // --- MOTEUR D'EXÉCUTION ---
  const runCode = () => {
    if (!workspaceRef.current) return;
    setGameState('RUNNING');
    
    let currentState = {
      x: safeData.startPos?.x || 0,
      y: safeData.startPos?.y || 1,
      dir: 1
    };
    setPlayerState(currentState);

    javascriptGenerator.init(workspaceRef.current);
    let code = javascriptGenerator.workspaceToCode(workspaceRef.current);
    
    const actions = [];
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('actions', code);
      fn(actions);
    } catch (e) {
      alert("Erreur : " + e.message);
      setGameState('IDLE');
      return;
    }

    let step = 0;
    const playStep = () => {
      if (step >= actions.length) {
        setGameState('IDLE');
        return;
      }

      const action = actions[step];
      step++;

      const result = plugin.updateState(currentState, action, safeData.grid);
      
      currentState = result.playerState;
      setPlayerState(currentState);

      if (result.status === 'WIN') {
        setGameState('WON');
        handleWin(); 
        return;
      } else if (result.status === 'LOST') {
        setGameState('LOST');
        return;
      }

      executionRef.current = setTimeout(playStep, 500);
    };
    
    playStep();
  };

  const handleWin = () => {
    const currentBlocks = workspaceRef.current.getAllBlocks(false).length;
    const targetBlocks = safeData.maxBlocks || 5; 
    let stars = 1;
    if (currentBlocks <= targetBlocks) stars = 3;
    else if (currentBlocks <= targetBlocks + 2) stars = 2;

    setGameStats({ stars, blockCount: currentBlocks, target: targetBlocks });
    if (onWin) onWin({ stars, blockCount: currentBlocks });
    
    const token = generateProofToken(safeData.id || 1, { stars, blocks: currentBlocks });
    setProofToken(token);
    setTimeout(() => setShowModal(true), 500);
  };

  const handleReset = () => {
    if (executionRef.current) clearTimeout(executionRef.current);
    setGameState('IDLE');
    setPlayerState({
        x: safeData.startPos?.x || 0,
        y: safeData.startPos?.y || 1,
        dir: 1
    });
  }

  return (
    <div style={{display: 'flex', height: '100%', flexDirection: 'column'}}>
      <div style={{padding: '10px', background: '#eee', display: 'flex', gap: '10px', borderBottom:'1px solid #ccc'}}>
        <button onClick={runCode} disabled={gameState === 'RUNNING'} style={{padding: '8px 16px', background: '#27ae60', color: 'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>▶️ Exécuter</button>
        <button onClick={handleReset} style={{padding: '8px 16px', background: '#e74c3c', color: 'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>🔄 Reset</button>
      </div>

      <div style={{display: 'flex', flex: 1, overflow: 'hidden'}}>
        <InstructionPanel 
            title={`Niveau ${safeData.id || ""}`}
            content={safeData.instruction}
            isCollapsed={!isPanelOpen}
            onToggle={() => setIsPanelOpen(!isPanelOpen)}
        />

        <div className="blocklyContainer" style={{flex: 1, position: 'relative', minWidth: '0'}}>
          <BlocklyWorkspace
            className="blockly-div"
            toolboxConfiguration={currentToolbox}
            initialXml={xml}
            onXmlChange={setXml}
            workspaceConfiguration={workspaceConfig}
            onInject={handleInject}
          />
        </div>
      
        <div style={{width: '40%', background: '#2c3e50', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <GameView 
             grid={safeData.grid} 
             playerPos={{x: playerState.x, y: playerState.y}} 
             playerDir={playerState.dir} 
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