import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { MazePlugin } from '../../plugins/MazePlugin';
import { MathPlugin } from '../../plugins/MathPlugin';
import { TurtlePlugin } from '../../plugins/TurtlePlugin';
import { EquationPlugin } from '../../plugins/EquationPlugin';
import FeedbackModal from './FeedbackModal';
import InstructionPanel from './InstructionPanel';
import { MAZE_CONFIG } from '../../core/adapters/MazeAdapter';
import { registerAllBlocks } from '../../core/BlockRegistry';
import { useGameRunner } from '../../hooks/useGameRunner';

const PLUGINS = { 'MAZE': MazePlugin, 'MATH': MathPlugin, 'TURTLE': TurtlePlugin, 'EQUATION': EquationPlugin };

const workspaceConfig = {
  collapse: true, comments: true, disable: true, maxBlocks: Infinity,
  trashcan: true, horizontalLayout: false, toolboxPosition: 'start',
  css: true, media: 'https://blockly-demo.appspot.com/static/media/',
  rtl: false, scrollbars: true, oneBasedIndex: true,
  zoom: { controls: true, wheel: true, startScale: 1.0 }
};

export default function GameEngine({ levelData, onWin, levelIndex, onNextLevel }) {
  const plugin = PLUGINS[levelData?.type] || MazePlugin;
  const GameView = plugin.RenderComponent;

  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isReady, setIsReady] = useState(false);
  // État pour la largeur du panneau de droite (Jeu) en pourcentage
  const [gamePanelWidth, setGamePanelWidth] = useState(40);
  const [isDragging, setIsDragging] = useState(false);

  const workspaceRef = useRef(null);
  const containerRef = useRef(null);
  
  const safeData = useMemo(() => ({
    ...levelData,
    grid: levelData?.grid || MAZE_CONFIG.defaultGrid,
    startPos: { x: Number(levelData?.startPos?.x) || 0, y: Number(levelData?.startPos?.y) || 0, dir: Number(levelData?.startPos?.dir) || 0 },
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
    speed, setSpeed, engineState, gameState, solutionLines,
    gameStats, proofToken, run, reset, pause, stepForward, lastAction
  } = useGameRunner(workspaceRef, plugin, safeData);

  const initialPlayerState = useMemo(() => ({
    x: safeData.startPos.x, y: safeData.startPos.y, dir: safeData.startPos.dir
  }), [safeData.startPos]);

  useEffect(() => {
    if (gameState === 'WON' && onWin) { onWin(gameStats); }
  }, [gameState, onWin, gameStats]);

  useEffect(() => {
    const timer = setTimeout(() => { try { registerAllBlocks(); setIsReady(true); } catch(e){} }, 10);
    return () => clearTimeout(timer);
  }, []);

  const currentToolbox = useMemo(() => {
      const result = plugin.getToolboxXML(safeData.allowedBlocks, safeData.inputs, safeData.hiddenVars, safeData.lockedVars);
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

  // Redimensionnement SVG quand le panneau ou le splitter bouge
  useEffect(() => {
    if (!workspaceRef.current) return;
    const timer = setTimeout(() => { Blockly.svgResize(workspaceRef.current); }, 50); 
    return () => clearTimeout(timer);
  }, [isPanelOpen, gamePanelWidth]);

  // --- GESTION DRAG SPLITTER ---
  const handleMouseDown = (e) => {
      setIsDragging(true);
      e.preventDefault();
  };

  useEffect(() => {
      const handleMouseMove = (e) => {
          if (!isDragging || !containerRef.current) return;
          const containerRect = containerRef.current.getBoundingClientRect();
          // On calcule la largeur restante à droite
          const newWidth = ((containerRect.right - e.clientX) / containerRect.width) * 100;
          // Bornes : min 20%, max 70%
          setGamePanelWidth(Math.min(70, Math.max(20, newWidth)));
      };

      const handleMouseUp = () => {
          setIsDragging(false);
      };

      if (isDragging) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isDragging]);

  const renderProps = {
      grid: safeData.grid,
      playerPos: engineState ? {x: engineState.x, y: engineState.y} : initialPlayerState,
      playerDir: engineState ? engineState.dir : initialPlayerState.dir,
      state: engineState || { variables: safeData.inputs, ...(safeData.equation || {}) },
      history: engineState?.logs,
      hiddenVars: safeData.hiddenVars || [],
      modelLines: solutionLines,
      lastAction: lastAction
  };

  if (!isReady) return <div className="flex h-full items-center justify-center text-slate-400">Chargement...</div>;

  const displayTitle = levelIndex !== undefined 
    ? `Niveau ${levelIndex + 1}` 
    : (typeof safeData.id === 'number' && safeData.id < 1000000 ? `Niveau ${safeData.id}` : "Niveau Test");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* BARRE D'OUTILS */}
      <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
            {gameState === 'RUNNING' ? (
                <button onClick={pause} className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg font-bold transition-colors">
                    <span>⏸️</span> Pause
                </button>
            ) : (
                <button onClick={run} className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg font-bold transition-colors shadow-sm hover:shadow-md">
                    <span>▶️</span> {gameState === 'PAUSED' ? 'Reprendre' : 'Exécuter'}
                </button>
            )}
            <button onClick={stepForward} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors" title="Pas à pas">
                👣 <span className="hidden sm:inline">Pas à pas</span>
            </button>
            <button onClick={reset} className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Réinitialiser">
                🔄
            </button>
        </div>
        <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-full">
            <span className="text-lg">🐢</span>
            <input type="range" min="0" max="100" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-24 h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            <span className="text-lg">🐇</span>
        </div>
      </div>

      <div ref={containerRef} className="flex flex-1 overflow-hidden relative" style={{ cursor: isDragging ? 'col-resize' : 'auto' }}>
        
        <InstructionPanel 
            title={displayTitle}
            content={safeData.instruction}
            isCollapsed={!isPanelOpen} onToggle={() => setIsPanelOpen(!isPanelOpen)}
        />

        {/* BLOCKLY ZONE */}
        <div className="flex-1 min-w-0 bg-slate-50 relative">
          <BlocklyWorkspace
            key={`${safeData.id}-${plugin.id}-${JSON.stringify(safeData.allowedBlocks || [])}`} 
            className="blockly-div absolute inset-0"
            toolboxConfiguration={currentToolbox}
            workspaceConfiguration={workspaceConfig}
            onInject={handleInject}
          />
          {/* Overlay anti-clic pendant le drag */}
          {isDragging && <div className="absolute inset-0 z-50 bg-transparent"></div>}
        </div>
      
        {/* SPLITTER (POIGNÉE) */}
        <div 
            onMouseDown={handleMouseDown}
            className="w-2 bg-slate-200 hover:bg-blue-400 cursor-col-resize z-30 flex items-center justify-center transition-colors flex-shrink-0"
        >
            <div className="h-8 w-1 bg-slate-400 rounded-full"></div>
        </div>

        {/* ZONE DE JEU (Largeur dynamique) */}
        <div 
            style={{ width: `${gamePanelWidth}%` }}
            className="bg-slate-800 flex justify-center items-center overflow-hidden shadow-inner flex-shrink-0 relative"
        >
          <GameView {...renderProps} />
          {/* Overlay anti-clic pendant le drag */}
          {isDragging && <div className="absolute inset-0 z-50 bg-transparent"></div>}
        </div>

        <FeedbackModal 
          isOpen={gameState === 'WON' || gameState === 'LOST' || gameState === 'FAILED'} 
          status={gameState}
          stats={gameStats} token={proofToken} 
          onReplay={() => { reset(); }} 
          onMenu={() => window.location.reload()} 
          onNext={onNextLevel} 
        />
      </div>
    </div>
  );
}