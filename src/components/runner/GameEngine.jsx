import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

import { getPlugin } from '../../core/PluginRegistry'; 
import { registerAllBlocks } from '../../core/BlockRegistry';
import { generateToolbox } from '../../core/BlockDefinitions'; 

import FeedbackModal from './FeedbackModal';
import InstructionPanel from './InstructionPanel';
import { useGameRunner } from '../../hooks/useGameRunner';

const workspaceConfig = {
  collapse: true, comments: true, disable: true, maxBlocks: Infinity,
  trashcan: true, horizontalLayout: false, toolboxPosition: 'start',
  css: true, media: 'https://blockly-demo.appspot.com/static/media/',
  rtl: false, scrollbars: true, oneBasedIndex: true,
};

export default function GameEngine({ levelData, onWin, levelIndex, onNextLevel }) {
  const plugin = getPlugin(levelData?.type);
  if (!plugin) return <div className="p-10">🚫 Plugin introuvable</div>;

  const GameView = plugin.RenderComponent;
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [gameWidth, setGameWidth] = useState(40);
  const isResizing = useRef(false);
  const workspaceRef = useRef(null);
  
  const safeData = useMemo(() => ({
    ...levelData, // On garde tout, y compris 'equation', 'targets' etc.
    grid: levelData?.grid || (plugin.config?.defaultGrid), 
    startPos: { 
        x: Number(levelData?.startPos?.x) || 0, 
        y: Number(levelData?.startPos?.y) || 0, 
        dir: Number(levelData?.startPos?.dir) || 0 
    },
    // On s'assure que les champs spécifiques ne sont pas undefined
    equation: levelData?.equation, 
    targets: levelData?.targets
  }), [levelData, plugin]); 

  const {
    speed, setSpeed,
    engineState, gameState,
    solutionLines,
    gameStats, proofToken,
    run, reset, pause, stepForward,
    lastAction,
    // TIME TRAVEL
    currentStep, totalSteps, timeTravel
  } = useGameRunner(workspaceRef, plugin, safeData);

  useEffect(() => {
    if (gameState === 'WON' && onWin) onWin(gameStats);
  }, [gameState, onWin, gameStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
        registerAllBlocks();
        if (plugin.registerBlocks) plugin.registerBlocks(Blockly, javascriptGenerator);
        setIsReady(true);
    }, 10);
    return () => clearTimeout(timer);
  }, [plugin]);

  // --- SPLITTER ---
  const startResizing = useCallback(() => {
      isResizing.current = true;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
  }, []);
  const stopResizing = useCallback(() => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (workspaceRef.current) Blockly.svgResize(workspaceRef.current);
  }, []);
  const handleMouseMove = useCallback((e) => {
      if (!isResizing.current) return;
      const newWidth = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) setGameWidth(newWidth);
  }, []);

  // --- TOOLBOX ---
  const currentToolbox = useMemo(() => {
      const standardResult = generateToolbox(safeData.allowedBlocks, safeData.inputs, safeData.hiddenVars, safeData.lockedVars);
      let featureXml = '';
      if (plugin.getToolbox) {
          const tb = plugin.getToolbox(safeData.allowedBlocks); // Correction: passer allowedBlocks
          featureXml = tb.xml || '';
      }
      if (featureXml) {
          let finalXml = standardResult.xml;
          if (!standardResult.hasCategories) {
              const content = finalXml.match(/<xml[^>]*>([\s\S]*)<\/xml>/)?.[1] || '';
              const wrappedContent = content.trim() ? `<category name="Outils" colour="#A0A0A0">${content}</category>` : '';
              finalXml = `<xml xmlns="https://developers.google.com/blockly/xml">${featureXml}${wrappedContent}</xml>`;
          } else {
              finalXml = finalXml.replace(/(<xml[^>]*>)/, `$1${featureXml}`);
          }
          return finalXml;
      }
      return standardResult.xml;
  }, [plugin, safeData]);

  const handleInject = (newWorkspace) => {
    workspaceRef.current = newWorkspace;
    javascriptGenerator.init(newWorkspace); 
    newWorkspace.updateToolbox(currentToolbox);
    if (safeData.startBlocks) {
       try {
           newWorkspace.clear();
           const xmlDom = Blockly.utils.xml.textToDom(safeData.startBlocks);
           Blockly.Xml.domToWorkspace(xmlDom, newWorkspace);
       } catch (e) { console.warn("Erreur code:", e); }
    }
    window.setTimeout(() => Blockly.svgResize(newWorkspace), 0);
  };

  useEffect(() => {
    if (workspaceRef.current && isReady) workspaceRef.current.updateToolbox(currentToolbox);
  }, [currentToolbox, isReady]); 

  useEffect(() => {
    if (!workspaceRef.current) return;
    const timer = setTimeout(() => Blockly.svgResize(workspaceRef.current), 350); 
    return () => clearTimeout(timer);
  }, [isPanelOpen, gameWidth]);

  // --- PROPS DU JEU ---
  const renderProps = {
      grid: safeData.grid,
      playerPos: engineState ? {x: engineState.x, y: engineState.y} : {x: safeData.startPos.x, y: safeData.startPos.y},
      playerDir: engineState ? engineState.dir : safeData.startPos.dir,
      // Ici, on passe safeData complet ou au moins levelData pour que EquationRunner retrouve ses petits
      state: engineState, // Sera null au départ, mais le hook l'initialisera vite
      levelData: safeData, // IMPORTANT pour EquationRunner si state est incomplet
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
      {/* BARRE OUTILS */}
      <div style={{padding: '10px', background: '#eee', borderBottom:'1px solid #ccc'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom: totalSteps > 0 ? '5px' : '0'}}>
            {gameState === 'RUNNING' ? (
                <button onClick={pause} style={{...btnStyle, background: '#f39c12'}}>⏸️ Pause</button>
            ) : (
                <button onClick={run} style={{...btnStyle, background: '#27ae60'}}>
                    {gameState === 'PAUSED' ? '▶️ Reprendre' : '▶️ Exécuter'}
                </button>
            )}
            <button onClick={stepForward} style={{...btnStyle, background: '#3498db'}} title="Pas à pas">👣 Pas à pas</button>
            <button onClick={reset} style={{...btnStyle, background: '#e74c3c'}}>🔄 Stop</button>
            
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', background: 'white', padding: '5px 10px', borderRadius: '20px', border: '1px solid #ddd'}}>
                <span style={{fontSize: '1.2rem'}}>🐢</span>
                <input type="range" min="0" max="100" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{width: '100px', cursor: 'pointer'}} />
                <span style={{fontSize: '1.2rem'}}>🐇</span>
            </div>
        </div>

        {/* TIME TRAVELLER (Seulement si des actions existent) */}
        {totalSteps > 0 && (
            <div className="animate-in slide-in-from-top-2 duration-300" style={{display:'flex', alignItems:'center', gap:'10px', background:'#e0f7fa', padding:'5px 10px', borderRadius:'4px', border:'1px solid #b2ebf2', marginTop:'5px'}}>
                <span style={{fontSize:'0.8rem', fontWeight:'bold', color:'#006064', whiteSpace:'nowrap'}}>⏳ Time Traveller :</span>
                <input 
                    type="range" 
                    min="0" 
                    max={totalSteps} 
                    value={currentStep} 
                    onChange={(e) => timeTravel(Number(e.target.value))}
                    style={{width:'100%', cursor:'pointer', accentColor:'#00bcd4'}}
                />
                <span style={{fontSize:'0.8rem', fontMono:true, color:'#006064', minWidth:'40px', textAlign:'right'}}>
                    {currentStep}/{totalSteps}
                </span>
            </div>
        )}
      </div>

      <div style={{display: 'flex', flex: 1, overflow: 'hidden', position: 'relative'}}>
        <InstructionPanel title={displayTitle} content={safeData.instruction} isCollapsed={!isPanelOpen} onToggle={() => setIsPanelOpen(!isPanelOpen)} />
        <div className="blocklyContainer" style={{flex: 1, position: 'relative', minWidth: '0'}}>
          <BlocklyWorkspace key={`${safeData.id}-${plugin.id}`} className="blockly-div" toolboxConfiguration={currentToolbox} workspaceConfiguration={workspaceConfig} onInject={handleInject} />
        </div>
        <div onMouseDown={startResizing} style={{width: '8px', background: '#ddd', cursor: 'col-resize', display: 'flex', justifyContent: 'center', alignItems: 'center', borderLeft: '1px solid #ccc', borderRight: '1px solid #ccc', zIndex: 10}} title="Redimensionner"><div style={{height: '20px', width: '2px', background: '#999', borderRadius:'2px'}}></div></div>
        <div style={{width: `${gameWidth}%`, background: '#2c3e50', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow:'hidden', position: 'relative'}}>
          <GameView {...renderProps} />
        </div>
        <FeedbackModal 
            isOpen={gameState === 'WON' || gameState === 'LOST' || gameState === 'FAILED'} 
            status={gameState} 
            stats={gameStats} 
            token={proofToken} 
            onReplay={() => reset()} 
            onMenu={() => window.location.reload()} 
            onNext={onNextLevel}
            onAnalyze={() => pause()}  // 👈 AJOUT ICI : Ferme la modale, passe en PAUSE
        />      </div>
    </div>
  );
}
const btnStyle = { padding: '8px 16px', color: 'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold', display: 'flex', alignItems: 'center', gap: '5px' };
