import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

// --- NOUVEAU SYSTEME D'IMPORT ---
import MazeFeature from '../../features/maze'; // On importe tout le module Maze d'un coup
import { MathPlugin } from '../../plugins/MathPlugin';
import { TurtlePlugin } from '../../plugins/TurtlePlugin';

import FeedbackModal from './FeedbackModal';
import InstructionPanel from './InstructionPanel';
import { registerAllBlocks } from '../../core/BlockRegistry';
import { useGameRunner } from '../../hooks/useGameRunner';

const PLUGINS = { 
    'MAZE': MazeFeature, // On utilise le Feature complet
    'MATH': MathPlugin, 
    'TURTLE': TurtlePlugin 
};

const workspaceConfig = {
  collapse: true, comments: true, disable: true, maxBlocks: Infinity,
  trashcan: true, horizontalLayout: false, toolboxPosition: 'start',
  css: true, media: 'https://blockly-demo.appspot.com/static/media/',
  rtl: false, scrollbars: true, oneBasedIndex: true,
};

export default function GameEngine({ levelData, onWin, levelIndex }) {
  const plugin = PLUGINS[levelData?.type] || MazeFeature;
  const GameView = plugin.RenderComponent;

  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isReady, setIsReady] = useState(false);
  
  const workspaceRef = useRef(null);
  
  const safeData = useMemo(() => ({
    ...levelData,
    // On accède à la config via le Feature
    grid: levelData?.grid || MazeFeature.config.defaultGrid, 
    startPos: { 
        x: Number(levelData?.startPos?.x) || 0, 
        y: Number(levelData?.startPos?.y) || 0, 
        dir: Number(levelData?.startPos?.dir) || 0 
    },
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

  const {
    speed, setSpeed,
    engineState, gameState,
    solutionLines,
    gameStats, proofToken,
    run, reset, pause, stepForward,
    lastAction 
  } = useGameRunner(workspaceRef, plugin, safeData);

  useEffect(() => {
    if (gameState === 'WON' && onWin) {
        onWin(gameStats);
    }
  }, [gameState, onWin, gameStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
        registerAllBlocks();
        setIsReady(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const currentToolbox = useMemo(() => {
      const result = plugin.getToolboxXML(
        safeData.allowedBlocks, safeData.inputs, safeData.hiddenVars, safeData.lockedVars 
      );
      return result.xml || result;
  }, [plugin, safeData]);

  const handleInject = (newWorkspace) => {
    workspaceRef.current = newWorkspace;
    javascriptGenerator.init(newWorkspace); 
    newWorkspace.updateToolbox(currentToolbox);
    if (safeData.startBlocks) {
       try {
           const xmlDom = Blockly.utils.xml.textToDom(safeData.startBlocks);
           Blockly.Xml.domToWorkspace(xmlDom, newWorkspace);
       } catch (e) {}
    }
    window.setTimeout(() => Blockly.svgResize(newWorkspace), 0);
  };

  useEffect(() => {
    if (workspaceRef.current && isReady) workspaceRef.current.updateToolbox(currentToolbox);
  }, [currentToolbox, isReady]); 

  useEffect(() => {
    if (!workspaceRef.current) return;
    const timer = setTimeout(() => {
        Blockly.svgResize(workspaceRef.current);
    }, 350); 
    return () => clearTimeout(timer);
  }, [isPanelOpen]);

  const renderProps = {
      grid: safeData.grid,
      // Pour Turtle/Math, playerPos n'est pas utilisé de la même façon, mais ce n'est pas grave
      playerPos: engineState ? {x: engineState.x, y: engineState.y} : {x: safeData.startPos.x, y: safeData.startPos.y},
      playerDir: engineState ? engineState.dir : safeData.startPos.dir,
      state: engineState || { variables: safeData.inputs },
      history: engineState?.logs,
      hiddenVars: safeData.hiddenVars || [],
      modelLines: solutionLines,
      lastAction: lastAction
  };

  if (!isReady) return <div style={{padding: 20}}>Chargement...</div>;

  const displayTitle = levelIndex !== undefined 
    ? `Niveau ${levelIndex + 1}` 
    : (typeof safeData.id === 'number' && safeData.id < 1000000 ? `Niveau ${safeData.id}` : "Niveau Test");

  return (
    <div style={{display: 'flex', height: '100%', flexDirection: 'column'}}>
      <div style={{padding: '10px', background: '#eee', display: 'flex', alignItems: 'center', gap: '10px', borderBottom:'1px solid #ccc'}}>
        
        {gameState === 'RUNNING' ? (
            <button onClick={pause} style={{...btnStyle, background: '#f39c12'}}>⏸️ Pause</button>
        ) : (
            <button onClick={run} style={{...btnStyle, background: '#27ae60'}}>
                {gameState === 'PAUSED' ? '▶️ Reprendre' : '▶️ Exécuter'}
            </button>
        )}

        <button onClick={stepForward} style={{...btnStyle, background: '#3498db'}} title="Exécuter le prochain bloc">
            👣 Pas à pas
        </button>
        
        <button onClick={reset} style={{...btnStyle, background: '#e74c3c'}}>🔄 Stop</button>
        
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', background: 'white', padding: '5px 10px', borderRadius: '20px', border: '1px solid #ddd'}}>
            <span style={{fontSize: '1.2rem'}}>🐢</span>
            <input type="range" min="0" max="100" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{width: '100px', cursor: 'pointer'}} title={`Vitesse : ${speed}%`} />
            <span style={{fontSize: '1.2rem'}}>🐇</span>
        </div>
      </div>

      <div style={{display: 'flex', flex: 1, overflow: 'hidden'}}>
        <InstructionPanel 
            title={displayTitle}
            content={safeData.instruction}
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
          isOpen={gameState === 'WON' || gameState === 'LOST' || gameState === 'FAILED'} 
          status={gameState}
          stats={gameStats} token={proofToken} 
          onReplay={() => { reset(); }} 
          onMenu={() => window.location.reload()}
        />
      </div>
    </div>
  );
}

const btnStyle = {
    padding: '8px 16px', color: 'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold',
    display: 'flex', alignItems: 'center', gap: '5px'
};