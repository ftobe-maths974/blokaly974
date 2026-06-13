import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { BlocklyWorkspace } from '../BlocklyWorkspace';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

import { registerAllBlocks } from '../../core/BlockRegistry';
import { generateToolbox } from '../../core/BlockDefinitions';
import FeedbackModal from './FeedbackModal';
import { useGameRunner } from '../../hooks/useGameRunner';

const workspaceConfig = {
  collapse: true, comments: true, disable: true, maxBlocks: Infinity,
  trashcan: true, horizontalLayout: false, toolboxPosition: 'start',
  css: true, media: 'https://blockly-demo.appspot.com/static/media/',
  rtl: false, scrollbars: true, oneBasedIndex: true,
};

const btnStyle = { padding: '8px 16px', color: 'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold', display: 'flex', alignItems: 'center', gap: '5px' };

// 👇 AJOUT DES PROPS savedCode ET onCodeChange
export default function BlocklyRunner({ levelData, plugin, onWin, onNextLevel, savedCode, onCodeChange }) {
  const GameView = plugin.RenderComponent;
  const [isReady, setIsReady] = useState(false);
  const [gameWidth, setGameWidth] = useState(40);
  const isResizing = useRef(false);
  const workspaceRef = useRef(null);

  // Sécurisation des données du niveau
  const safeData = useMemo(() => ({
    ...levelData,
    grid: levelData?.grid || (plugin.config?.defaultGrid),
    startPos: { 
        x: Number(levelData?.startPos?.x) || 0, 
        y: Number(levelData?.startPos?.y) || 0, 
        dir: Number(levelData?.startPos?.dir) || 0 
    },
    equation: levelData?.equation,
    targets: levelData?.targets
  }), [levelData, plugin]);

  // Hook principal d'exécution
  const {
    speed, setSpeed,
    engineState, gameState,
    solutionLines,
    gameStats, proofToken,
    run, reset, pause, stepForward,
    lastAction,
    currentStep, totalSteps, timeTravel
  } = useGameRunner(workspaceRef, plugin, safeData);

  // Remontée de la victoire
  useEffect(() => {
    if (gameState === 'WON' && onWin) onWin(gameStats);
  }, [gameState, onWin, gameStats]);

  // Initialisation des blocs
  useEffect(() => {
    const timer = setTimeout(() => {
        registerAllBlocks();
        if (plugin.registerBlocks) plugin.registerBlocks(Blockly, javascriptGenerator);
        setIsReady(true);
    }, 10);
    return () => clearTimeout(timer);
  }, [plugin]);

  // --- SPLITTER (Redimensionnement) ---
  // On utilise un AbortController pour attacher/détacher mousemove+mouseup d'un
  // seul coup, ce qui évite qu'un handler ait à se référencer lui-même.
  const handleMouseMove = useCallback((e) => {
      if (!isResizing.current) return;
      const newWidth = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) setGameWidth(newWidth);
  }, []);
  const startResizing = useCallback(() => {
      isResizing.current = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      const controller = new AbortController();
      const stop = () => {
          isResizing.current = false;
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          controller.abort(); // retire mousemove ET mouseup en une fois
          if (workspaceRef.current) Blockly.svgResize(workspaceRef.current);
      };
      document.addEventListener('mousemove', handleMouseMove, { signal: controller.signal });
      document.addEventListener('mouseup', stop, { signal: controller.signal });
  }, [handleMouseMove]);

  // --- TOOLBOX ---
  const currentToolbox = useMemo(() => {
      const standardResult = generateToolbox(safeData.allowedBlocks, safeData.inputs, safeData.hiddenVars, safeData.lockedVars);
      let featureXml = '';
      if (plugin.getToolbox) {
          const tb = plugin.getToolbox(safeData.allowedBlocks);
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
    
    // 👇 LOGIQUE DE CHARGEMENT CORRIGÉE
    // Priorité : 1. Code sauvegardé (Session élève) > 2. Code de départ (Prof) > 3. Vide
    const codeToLoad = savedCode || safeData.startBlocks;

    if (codeToLoad) {
       try {
           newWorkspace.clear();
           const xmlDom = Blockly.utils.xml.textToDom(codeToLoad);
           Blockly.Xml.domToWorkspace(xmlDom, newWorkspace);
       } catch (e) { console.warn("Erreur code:", e); }
    }
    // Bloc-chapeau « Exécuter » toujours présent (+ migration des piles libres).
    if (plugin.ensureStartBlock) plugin.ensureStartBlock(newWorkspace);
    window.setTimeout(() => Blockly.svgResize(newWorkspace), 0);
  };

  useEffect(() => {
    if (workspaceRef.current && isReady) workspaceRef.current.updateToolbox(currentToolbox);
  }, [currentToolbox, isReady]);

  useEffect(() => {
    if (!workspaceRef.current) return;
    const timer = setTimeout(() => Blockly.svgResize(workspaceRef.current), 350);
    return () => clearTimeout(timer);
  }, [gameWidth]);

  const renderProps = {
      grid: safeData.grid,
      playerPos: engineState ? {x: engineState.x, y: engineState.y} : {x: safeData.startPos.x, y: safeData.startPos.y},
      playerDir: engineState ? engineState.dir : safeData.startPos.dir,
      state: engineState,
      levelData: safeData,
      history: engineState?.logs,
      hiddenVars: safeData.hiddenVars || [],
      modelLines: solutionLines,
      lastAction: lastAction
  };

  if (!isReady) return <div style={{padding: 20}}>Chargement du moteur...</div>;

  return (
    <div style={{display: 'flex', height: '100%', flexDirection: 'column', flex: 1, minWidth: 0}}>
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

        {/* TIME TRAVELLER */}
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

      {/* ZONE DE JEU */}
      <div style={{display: 'flex', flex: 1, overflow: 'hidden', position: 'relative'}}>
        <div className="blocklyContainer" style={{flex: 1, position: 'relative', minWidth: '0'}}>
          <BlocklyWorkspace 
            key={`${safeData.id}-${plugin.id}`} 
            className="blockly-div" 
            toolboxConfiguration={currentToolbox} 
            workspaceConfiguration={workspaceConfig} 
            onInject={handleInject} 
            onXmlChange={onCodeChange} // 👈 CONNEXION AU PARENT
          />
        </div>
        
        <div onMouseDown={startResizing} style={{width: '8px', background: '#ddd', cursor: 'col-resize', display: 'flex', justifyContent: 'center', alignItems: 'center', borderLeft: '1px solid #ccc', borderRight: '1px solid #ccc', zIndex: 10}} title="Redimensionner">
            <div style={{height: '20px', width: '2px', background: '#999', borderRadius:'2px'}}></div>
        </div>
        
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
            onAnalyze={() => pause()}
        />
      </div>
    </div>
  );
}