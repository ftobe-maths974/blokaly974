import React, { useState, useRef, useEffect } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { MazePlugin } from '../../plugins/MazePlugin';
import { MathPlugin } from '../../plugins/MathPlugin';
import FeedbackModal from './FeedbackModal';
import { generateProofToken } from '../../core/validation';
import InstructionPanel from './InstructionPanel';
import { MAZE_CONFIG } from '../../core/adapters/MazeAdapter';

const PLUGINS = { 'MAZE': MazePlugin, 'MATH': MathPlugin };

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
  const safeData = levelData || { grid: MAZE_CONFIG.defaultGrid, startPos: {x:0, y:1} };
  
  const [playerState, setPlayerState] = useState({
    x: safeData.startPos?.x || 0, y: safeData.startPos?.y || 1, dir: 1
  });

  const [engineState, setEngineState] = useState(null); 
  const [xml, setXml] = useState(safeData.startBlocks || "");
  const [gameState, setGameState] = useState('IDLE');
  const [showModal, setShowModal] = useState(false);
  const [gameStats, setGameStats] = useState({ stars: 0, blockCount: 0, target: 0 });
  const [proofToken, setProofToken] = useState("");

  const executionRef = useRef(null);
  const workspaceRef = useRef(null);

  // --- CORRECTION CRITIQUE : ENREGISTREMENT IMMÉDIAT ---
  // On enregistre les blocs AVANT de calculer la Toolbox
  // On utilise un flag useRef pour ne pas le refaire à chaque render
  const blocksRegistered = useRef(false);
  if (!blocksRegistered.current || blocksRegistered.current !== plugin.id) {
     plugin.registerBlocks(Blockly, javascriptGenerator);
     blocksRegistered.current = plugin.id;
  }

  const currentToolbox = plugin.getToolboxXML(
    safeData.allowedBlocks, 
    safeData.inputs, 
    safeData.hiddenVars,
    safeData.lockedVars 
  );

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

    if (safeData.inputs) {
        const hiddenList = safeData.hiddenVars || [];
        const lockedList = safeData.lockedVars || [];
        
        Object.keys(safeData.inputs).forEach(v => {
            const isEditable = !hiddenList.includes(v) && !lockedList.includes(v);
            if (isEditable && !newWorkspace.getVariable(v)) {
                newWorkspace.createVariable(v);
            }
        });
    }
  };

  // Mise à jour dynamique si le niveau change
  useEffect(() => {
    if (workspaceRef.current) {
      workspaceRef.current.updateToolbox(currentToolbox);
    }
  }, [safeData, currentToolbox]); 
  
  const runCode = () => {
    if (!workspaceRef.current) return;
    setGameState('RUNNING');
    setEngineState(null); 

    javascriptGenerator.init(workspaceRef.current);
    let userCode = javascriptGenerator.workspaceToCode(workspaceRef.current);
    
    let initCode = "";
    if (safeData.inputs) {
        Object.entries(safeData.inputs).forEach(([key, val]) => {
            const value = typeof val === 'string' ? `'${val}'` : val;
            initCode += `var ${key} = ${value};\n`;
        });
    }
    
    const fullCode = initCode + userCode;

    const actions = [];
    try {
      const fn = new Function('actions', fullCode);
      fn(actions);
    } catch (e) {
      console.error("Erreur exécution :", e);
      alert("Erreur dans ton code : " + e.message);
      setGameState('IDLE');
      return;
    }

    let step = 0;
    let currentState = null; 

    const playStep = () => {
      if (step >= actions.length) {
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
      executionRef.current = setTimeout(playStep, plugin.id === 'MATH' ? 800 : 300);
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
    if (plugin.id === 'MAZE') {
        setPlayerState({
            x: safeData.startPos?.x || 0,
            y: safeData.startPos?.y || 1,
            dir: 1
        });
    }
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
            key={`${safeData.id}-${plugin.id}`} // FORCE RESET SUR CHANGEMENT DE PLUGIN
            className="blockly-div"
            toolboxConfiguration={currentToolbox}
            workspaceConfiguration={workspaceConfig}
            onInject={handleInject}
          />
        </div>
      
        <div style={{width: '40%', background: '#2c3e50', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow:'hidden'}}>
          <GameView 
             grid={safeData.grid} 
             playerPos={engineState ? {x: engineState.x, y: engineState.y} : (safeData.startPos || {x:0, y:1})} 
             playerDir={engineState ? engineState.dir : 1}
             state={engineState || { variables: safeData.inputs }} 
             history={engineState?.logs}
             hiddenVars={safeData.hiddenVars || []}
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