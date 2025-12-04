import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { pythonGenerator } from 'blockly/python'; 
import { MazePlugin } from '../../plugins/MazePlugin';
import { MathPlugin } from '../../plugins/MathPlugin';
import { TurtlePlugin } from '../../plugins/TurtlePlugin';
import { EquationPlugin } from '../../plugins/EquationPlugin';
import FeedbackModal from './FeedbackModal';
import InstructionPanel from './InstructionPanel';
import { MAZE_CONFIG } from '../../core/adapters/MazeAdapter';
import { registerAllBlocks } from '../../core/BlockRegistry';
import { registerPythonDefinitions } from '../../core/PythonDefinitions'; 
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
  const [isPythonOpen, setIsPythonOpen] = useState(false); 
  const [pythonCode, setPythonCode] = useState(""); 
  const [isReady, setIsReady] = useState(false);
  const [gamePanelWidth, setGamePanelWidth] = useState(40);
  const [isDragging, setIsDragging] = useState(false);

  const workspaceRef = useRef(null);
  const containerRef = useRef(null);
  const blocklyContainerRef = useRef(null); 
  
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
    gameStats, proofToken, run, reset, pause, stepForward, lastAction,
    currentStep, totalSteps, goToStep, clearSimulation // On récupère clearSimulation
  } = useGameRunner(workspaceRef, plugin, safeData);

  const initialPlayerState = useMemo(() => ({
    x: safeData.startPos.x, y: safeData.startPos.y, dir: safeData.startPos.dir
  }), [safeData.startPos]);

  useEffect(() => {
    if (gameState === 'WON' && onWin) { onWin(gameStats); }
  }, [gameState, onWin, gameStats]);

  useEffect(() => {
    const timer = setTimeout(() => { 
        try { 
            registerAllBlocks(); 
            registerPythonDefinitions(); 
            setIsReady(true); 
        } catch(e){} 
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const currentToolbox = useMemo(() => {
      const result = plugin.getToolboxXML(safeData.allowedBlocks, safeData.inputs, safeData.hiddenVars, safeData.lockedVars);
      return result.xml || result;
  }, [plugin, safeData]);

  const updatePythonCode = () => {
      if(workspaceRef.current) {
          try {
              const code = pythonGenerator.workspaceToCode(workspaceRef.current);
              setPythonCode(code || "# Ajoute des blocs pour voir le code...");
          } catch(e) {
              setPythonCode("# Erreur génération : " + e.message);
          }
      }
  };

  const handleInject = (newWorkspace) => {
    workspaceRef.current = newWorkspace;
    javascriptGenerator.init(newWorkspace);
    
    // LISTENER UNIFIÉ
    newWorkspace.addChangeListener((e) => {
        // Si c'est un événement UI (clic, sélection), on ne fait rien
        if (e.type === Blockly.Events.UI || e.type === Blockly.Events.FINISHED_LOADING) return;

        // Si le code change vraiment (création, déplacement, suppression, modif de champ)
        // On invalide la timeline car elle ne correspond plus au code
        clearSimulation();
        
        if(isPythonOpen) updatePythonCode();
    });

    newWorkspace.updateToolbox(currentToolbox);
    if (safeData.startBlocks) {
       try {
           const xmlDom = Blockly.utils.xml.textToDom(safeData.startBlocks);
           Blockly.Xml.domToWorkspace(xmlDom, newWorkspace);
       } catch (e) {}
    }
    window.setTimeout(() => Blockly.svgResize(newWorkspace), 0);
  };

  useEffect(() => { if(isPythonOpen) updatePythonCode(); }, [isPythonOpen]);

  useEffect(() => {
    if (workspaceRef.current && isReady) workspaceRef.current.updateToolbox(currentToolbox);
  }, [currentToolbox, isReady]); 

  useEffect(() => {
      if (!blocklyContainerRef.current) return;
      const resizeObserver = new ResizeObserver(() => {
          if (workspaceRef.current) Blockly.svgResize(workspaceRef.current);
      });
      resizeObserver.observe(blocklyContainerRef.current);
      return () => resizeObserver.disconnect();
  }, [isReady]); 

  const handleMouseDown = (e) => { setIsDragging(true); e.preventDefault(); };
  useEffect(() => {
      const handleMouseMove = (e) => {
          if (!isDragging || !containerRef.current) return;
          const containerRect = containerRef.current.getBoundingClientRect();
          const newWidth = ((containerRect.right - e.clientX) / containerRect.width) * 100;
          setGamePanelWidth(Math.min(70, Math.max(20, newWidth)));
      };
      const handleMouseUp = () => { setIsDragging(false); };
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
  const displayTitle = levelIndex !== undefined ? `Niveau ${levelIndex + 1}` : `Niveau ${safeData.id}`;

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

        <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsPythonOpen(!isPythonOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all
                    ${isPythonOpen ? 'bg-yellow-50 border-yellow-300 text-yellow-700 shadow-inner' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                `}
            >
                <span>🐍</span> <span className="hidden md:inline">Code Python</span>
            </button>

            <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-full">
                <span className="text-lg">🐢</span>
                <input type="range" min="0" max="100" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-24 h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                <span className="text-lg">🐇</span>
            </div>
        </div>
      </div>

      <div ref={containerRef} className="flex flex-1 overflow-hidden relative" style={{ cursor: isDragging ? 'col-resize' : 'auto' }}>
        
        <InstructionPanel title={displayTitle} content={safeData.instruction} isCollapsed={!isPanelOpen} onToggle={() => setIsPanelOpen(!isPanelOpen)} />

        <div ref={blocklyContainerRef} className="flex-1 min-w-0 bg-slate-50 relative flex flex-col">
          <div className="flex-1 relative">
              <BlocklyWorkspace
                key={`${safeData.id}-${plugin.id}-${JSON.stringify(safeData.allowedBlocks || [])}`} 
                className="blockly-div absolute inset-0"
                toolboxConfiguration={currentToolbox}
                workspaceConfiguration={workspaceConfig}
                onInject={handleInject}
              />
              {isDragging && <div className="absolute inset-0 z-50 bg-transparent"></div>}
          </div>
        </div>
      
        <div onMouseDown={handleMouseDown} className="w-2 bg-slate-200 hover:bg-blue-400 cursor-col-resize z-30 flex items-center justify-center transition-colors flex-shrink-0">
            <div className="h-8 w-1 bg-slate-400 rounded-full"></div>
        </div>

        <div 
            style={{ width: `${gamePanelWidth}%` }}
            className="bg-slate-800 flex flex-col shadow-inner flex-shrink-0 relative border-l border-slate-700"
        >
          <div className="flex-1 relative overflow-hidden">
              {isPythonOpen ? (
                  <div className="absolute inset-0 bg-[#1e1e1e] p-6 overflow-auto font-mono text-sm text-gray-300">
                      <h3 className="text-yellow-500 font-bold mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
                          <span>🐍</span> Code Python généré
                      </h3>
                      <pre className="whitespace-pre-wrap font-mono leading-relaxed">{pythonCode}</pre>
                  </div>
              ) : (
                  <div className="w-full h-full flex items-center justify-center">
                      <GameView {...renderProps} />
                  </div>
              )}
          </div>

          {/* TIMELINE (Toujours visible tant qu'il y a des étapes et pas Python) */}
          {!isPythonOpen && totalSteps > 0 && (
             <div className="h-16 bg-slate-900 border-t border-slate-700 px-4 flex items-center gap-4 shrink-0 animate-in slide-in-from-bottom duration-300">
                <span className="text-xs font-bold text-slate-400 uppercase w-12">Temps</span>
                <input 
                    type="range" 
                    min="0" max={totalSteps} 
                    value={currentStep} 
                    onChange={(e) => goToStep(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    title={`Étape ${currentStep} / ${totalSteps}`}
                />
                <span className="text-xs font-mono text-blue-400 font-bold w-12 text-right">{currentStep}/{totalSteps}</span>
             </div>
          )}

          {isDragging && <div className="absolute inset-0 z-50 bg-transparent"></div>}
        </div>

        <FeedbackModal 
          isOpen={gameState === 'WON' || gameState === 'LOST' || gameState === 'FAILED'} 
          status={gameState}
          stats={gameStats} token={proofToken} 
          onReplay={() => { reset(); }} // Rejouer = Ferme modale + Reset curseur
          onMenu={() => window.location.reload()} 
          onNext={onNextLevel} 
        />
      </div>
    </div>
  );
}