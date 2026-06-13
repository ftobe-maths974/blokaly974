// 📄 src/components/builder/LevelEditor.jsx
import React, { useState, useRef, useMemo } from 'react';
import { BlocklyWorkspace } from '../BlocklyWorkspace';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

import { getPlugin, getAllPlugins } from '../../core/PluginRegistry'; 
import { registerAllBlocks } from '../../core/BlockRegistry';
import { generateToolbox, generateMasterToolbox } from '../../core/BlockDefinitions'; 
import ToolboxConfigurator from './ToolboxConfigurator'; // 👈 IMPORT NOUVEAU

export default function LevelEditor({ levelData, onUpdate }) {
  const workspaceRef = useRef(null);
  const [codeMode, setCodeMode] = useState('START'); // START | SOLUTION
  
  // Sécurisation (mémoïsée : sinon recréée à chaque rendu, ce qui casse la
  // mémoïsation du useMemo de la toolbox et déclenche un avertissement React Compiler)
  const safeLevelData = useMemo(() => ({
      ...levelData,
      allowedBlocks: Array.isArray(levelData.allowedBlocks) ? levelData.allowedBlocks : []
  }), [levelData]);

  const currentType = safeLevelData.type || 'MAZE';
  const activeFeature = getPlugin(currentType); 
  const safeFeature = activeFeature || getAllPlugins()[0];
  const VisualEditor = safeFeature?.EditorComponent; 

  const editorConfig = { scrollbars: true, trashcan: true, readOnly: false, renderer: 'zelos' };

  // --- ACTIONS ---
  const handleTypeChange = (newType) => {
    const targetPlugin = getPlugin(newType);
    if (!targetPlugin) return;
    const newDefaults = targetPlugin.config?.defaultGrid ? { grid: targetPlugin.config.defaultGrid } : {};
    
    onUpdate({ 
        ...safeLevelData, 
        type: newType, 
        allowedBlocks: [], // Reset propre
        startBlocks: '<xml></xml>',
        solutionBlocks: '<xml></xml>',
        ...newDefaults
    });
  };

  const handleUpdateAllowed = (newAllowed) => {
      onUpdate({ ...safeLevelData, allowedBlocks: newAllowed });
  };

  // Plafonds d'usage par bloc { type: max }. Vide = illimité.
  const handleUpdateLimits = (newLimits) => {
      onUpdate({ ...safeLevelData, blockLimits: newLimits });
  };

  // --- GÉNÉRATION XML ---
  const editorToolboxXML = useMemo(() => {
      const isMaster = codeMode === 'SOLUTION';
      const blocksToShow = isMaster ? null : safeLevelData.allowedBlocks;

      // Base Standard
      const standardResult = isMaster
          ? generateMasterToolbox(currentType, safeLevelData.inputs, safeLevelData.hiddenVars, safeLevelData.lockedVars)
          : generateToolbox(blocksToShow, safeLevelData.inputs, safeLevelData.hiddenVars, safeLevelData.lockedVars);

      // Injection Plugin Filtrée
      if (safeFeature && safeFeature.getToolbox) {
          const featureToolbox = safeFeature.getToolbox(blocksToShow);
          
          if (featureToolbox.xml && featureToolbox.xml.trim() !== '') {
              // Fusion naïve pour l'instant (ajout à la fin)
              let finalXml = standardResult.xml;
              // Si pas de catégories dans le standard mais catégories dans le feature -> on wrap
              if (!standardResult.hasCategories) {
                  const content = finalXml.match(/<xml[^>]*>([\s\S]*)<\/xml>/)?.[1] || '';
                  const wrappedContent = content.trim() ? `<category name="Système" colour="#A0A0A0">${content}</category>` : '';
                  finalXml = `<xml xmlns="https://developers.google.com/blockly/xml">${wrappedContent}${featureToolbox.xml}</xml>`;
              } else {
                  finalXml = finalXml.replace(/(<\/xml>)/, `${featureToolbox.xml}$1`);
              }
              return finalXml;
          }
      }
      return standardResult.xml;
  }, [codeMode, currentType, safeFeature, safeLevelData]);

  // --- INJECTION & UPDATE ---
  const handleInject = (newWorkspace) => {
    workspaceRef.current = newWorkspace;
    try {
        registerAllBlocks();
        if (safeFeature?.registerBlocks) safeFeature.registerBlocks(Blockly, javascriptGenerator);
        // Bloc-chapeau « Exécuter » présent côté prof aussi (« Vue : ce que voit l'élève »).
        if (safeFeature?.ensureStartBlock) safeFeature.ensureStartBlock(newWorkspace);
    } catch(e) { console.error(e); }
    window.setTimeout(() => Blockly.svgResize(newWorkspace), 0);
  };

  // ⚠️ FIX CRASH : Utilisation d'une clé composée pour forcer le remount si le type change
  // On ajoute aussi codeMode pour être sûr que la toolbox change proprement entre Start/Solution
  const workspaceKey = `editor-${safeLevelData.id}-${currentType}-${codeMode}`;

  // Styles onglets
  const getTabStyle = (isActive) => ({ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: isActive ? 'white' : 'transparent', fontWeight: isActive ? 'bold' : 'normal', color: isActive ? '#3b82f6' : '#64748b', fontSize: '0.8rem', transition: 'all 0.2s', boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' });

  return (
    <div className="flex flex-col h-full gap-4">
      
      {/* 1. PARTIE HAUTE : CONTENU ET CONFIG */}
      <div className="flex flex-col md:flex-row gap-4 h-[500px]">
        
        {/* A. VISUAL EDITOR (GAUCHE) */}
        <div className="flex flex-col flex-[2] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Barre de sélection du type */}
            <div className="bg-slate-100 p-2 flex gap-2 border-b border-slate-200">
                {getAllPlugins().map(p => (
                    <button key={p.id} onClick={() => handleTypeChange(p.id)} style={getTabStyle(currentType === p.id)}>
                        <span className="mr-2">{p.icon}</span> {p.name}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-auto relative">
                {VisualEditor ? <VisualEditor levelData={safeLevelData} onUpdate={onUpdate} /> : <div className="p-10 text-center text-slate-400">Aucun éditeur visuel</div>}
            </div>
        </div>

        {/* B. TOOLBOX CONFIGURATOR (DROITE) */}
        <div className="flex flex-col flex-1 min-w-[280px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">🧰 Boîte à Outils Élève</h3>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full">
                    {safeLevelData.allowedBlocks.length} blocs
                </span>
            </div>
            <div className="flex-1 overflow-hidden p-2 bg-slate-50/50">
                <ToolboxConfigurator
                    currentType={currentType}
                    allowedBlocks={safeLevelData.allowedBlocks}
                    onUpdate={handleUpdateAllowed}
                    blockLimits={safeLevelData.blockLimits || {}}
                    onUpdateLimits={handleUpdateLimits}
                />
            </div>
            {/* Consigne rapide */}
            <div className="p-3 border-t border-slate-200 bg-white">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Consigne Élève</label>
                <textarea 
                    value={safeLevelData.instruction || ""} 
                    onChange={(e) => onUpdate({ ...safeLevelData, instruction: e.target.value })} 
                    className="w-full h-16 p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Écris la mission ici..." 
                />
            </div>
        </div>
      </div>

      {/* 2. PARTIE BASSE : CODE EDITOR */}
      <div className="flex flex-col h-[400px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50">
            <button onClick={() => setCodeMode('START')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${codeMode==='START' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                🧩 Code de Départ (Trous)
            </button>
            <button onClick={() => setCodeMode('SOLUTION')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${codeMode==='SOLUTION' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                ✅ Solution Idéale (Prof)
            </button>
        </div>
        
        <div className="flex-1 relative">
           <BlocklyWorkspace 
               key={workspaceKey} // 👈 LA CLÉ MAGIQUE ANTI-CRASH
               className="blockly-div" 
               toolboxConfiguration={editorToolboxXML} 
               workspaceConfiguration={editorConfig} 
               initialXml={codeMode === 'START' ? (safeLevelData.startBlocks || '<xml></xml>') : (safeLevelData.solutionBlocks || '<xml></xml>')} 
               onXmlChange={(xml) => { 
                   if (codeMode === 'START') onUpdate({ ...safeLevelData, startBlocks: xml }); 
                   else onUpdate({ ...safeLevelData, solutionBlocks: xml }); 
               }} 
               onInject={handleInject}
           />
           {codeMode === 'START' && (
               <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-slate-500 border border-slate-200 shadow-sm pointer-events-none">
                   Vue : Ce que voit l'élève
               </div>
           )}
        </div>
      </div>

    </div>
  );
}