import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { MazePlugin } from '../../plugins/MazePlugin';
import { MathPlugin } from '../../plugins/MathPlugin';
import { TurtlePlugin } from '../../plugins/TurtlePlugin';
import FeedbackModal from './FeedbackModal';
import InstructionPanel from './InstructionPanel';
import { MAZE_CONFIG } from '../../core/adapters/MazeAdapter';
import { registerAllBlocks } from '../../core/BlockRegistry';
import { useGameRunner } from '../../hooks/useGameRunner';
import { generateToolbox } from '../../core/BlockDefinitions';

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
  const [isReady, setIsReady] = useState(false);
  
  const workspaceRef = useRef(null);
  
  const safeData = useMemo(() => ({
    ...levelData,
    grid: levelData?.grid || MAZE_CONFIG.defaultGrid,
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

  // Utilisation du nouveau Hook
  const {
    speed, setSpeed,
    engineState, gameState,
    solutionLines,
    gameStats, proofToken,
    run, reset, pause, stepForward // <--- Nouvelles actions
  } = useGameRunner(workspaceRef, plugin, safeData);

  const initialPlayerState = useMemo(() => ({
    x: safeData.startPos.x, y: safeData.startPos.y, dir: safeData.startPos.dir
  }), [safeData.startPos]);

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
      // On récupère juste la propriété .xml de l'objet retourné
      const { xml } = generateToolbox(
        safeData.allowedBlocks, safeData.inputs, safeData.hiddenVars, safeData.lockedVars 
      );
      return xml;
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
  };

  useEffect(() => {
    if (workspaceRef.current && isReady) workspaceRef.current.updateToolbox(currentToolbox);
  }, [currentToolbox, isReady]); 

  const renderProps = {
      grid: safeData.grid,
      playerPos: engineState ? {x: engineState.x, y: engineState.y} : initialPlayerState,
      playerDir: engineState ? engineState.dir : initialPlayerState.dir,
      state: engineState || { variables: safeData.inputs },
      history: engineState?.logs,
      hiddenVars: safeData.hiddenVars || [],
      modelLines: solutionLines
  };

  if (!isReady) return <div style={{padding: 20}}>Chargement...</div>;

  return (
    <div style={{display: 'flex', height: '100%', flexDirection: 'column'}}>
      {/* TOOLBAR */}
      <div style={{padding: '10px', background: '#eee', display: 'flex', alignItems: 'center', gap: '10px', borderBottom:'1px solid #ccc'}}>
        
        {/* Bouton PLAY / RESUME */}
        {gameState === 'RUNNING' ? (
            <button onClick={pause} style={{...btnStyle, background: '#f39c12'}}>⏸️ Pause</button>
        ) : (
            <button onClick={run} style={{...btnStyle, background: '#27ae60'}}>
                {gameState === 'PAUSED' ? '▶️ Reprendre' : '▶️ Exécuter'}
            </button>
        )}

        {/* Bouton PAS À PAS */}
        <button onClick={stepForward} style={{...btnStyle, background: '#3498db'}} title="Exécuter le prochain bloc">
            👣 Pas à pas
        </button>
        
        {/* Bouton STOP */}
        <button onClick={reset} style={{...btnStyle, background: '#e74c3c'}}>🔄 Stop</button>
        
        {/* Slider Vitesse */}
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
          isOpen={gameState === 'WON' || gameState === 'LOST' || gameState === 'FAILED'} 
          status={gameState} // <--- On passe l'état brut (WON, LOST, FAILED)
          stats={gameStats} 
          token={proofToken} 
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