import React, { useEffect, useState, useRef, useMemo } from 'react';
import MazeEditor from './editors/MazeEditor';
import MathEditor from './editors/MathEditor';
import TurtleEditor from './editors/TurtleEditor';
import EquationEditor from './editors/EquationEditor';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { registerAllBlocks } from '../../core/BlockRegistry';
import { 
    generateToolbox, 
    generateMasterToolbox, 
    CATEGORIES_BY_TYPE, 
    CATEGORY_CONTENTS,
    BLOCK_LABELS 
} from '../../core/BlockDefinitions'; 

export default function LevelEditor({ levelData, onUpdate }) {
  const workspaceRef = useRef(null);
  const [codeMode, setCodeMode] = useState('START');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
        try { registerAllBlocks(); setIsReady(true); } catch(e) { console.error(e); }
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const editorConfig = { 
    scrollbars: true, trashcan: true, readOnly: false,
    zoom: { controls: true, wheel: true, startScale: 0.9 }
  };
  
  const currentType = levelData.type || 'MAZE';

  const studentToolboxResult = useMemo(() => generateToolbox(
      levelData.allowedBlocks, levelData.inputs, levelData.hiddenVars, levelData.lockedVars
  ), [levelData.allowedBlocks, levelData.inputs, levelData.hiddenVars, levelData.lockedVars]);

  const masterToolboxResult = useMemo(() => generateMasterToolbox(
      currentType, levelData.inputs, levelData.hiddenVars, levelData.lockedVars
  ), [currentType, levelData.inputs, levelData.hiddenVars, levelData.lockedVars]);

  const activeToolbox = codeMode === 'SOLUTION' ? masterToolboxResult : studentToolboxResult;
  const workspaceKey = `${levelData.id}-${currentType}-${codeMode}-${activeToolbox.hasCategories ? 'CAT' : 'FLY'}`;

  const handleInject = (newWorkspace) => {
    workspaceRef.current = newWorkspace;
    window.setTimeout(() => Blockly.svgResize(newWorkspace), 0);
  };

  useEffect(() => {
    if (workspaceRef.current && isReady) workspaceRef.current.updateToolbox(activeToolbox.xml);
  }, [activeToolbox, isReady]);

  // Handlers Toolbox
  const toggleBlock = (blockType) => {
    const currentAllowed = levelData.allowedBlocks || [];
    const newAllowed = currentAllowed.includes(blockType) ? currentAllowed.filter(t => t !== blockType) : [...currentAllowed, blockType];
    onUpdate({ ...levelData, allowedBlocks: newAllowed });
  };

  const toggleCategory = (catName) => {
    const categoryBlocks = CATEGORY_CONTENTS[catName] || [];
    const currentAllowed = levelData.allowedBlocks || [];
    const allChecked = categoryBlocks.every(type => currentAllowed.includes(type));
    const newAllowed = allChecked 
        ? currentAllowed.filter(type => !categoryBlocks.includes(type)) 
        : [...currentAllowed, ...categoryBlocks.filter(t => !currentAllowed.includes(t))];
    onUpdate({ ...levelData, allowedBlocks: newAllowed });
  };

  const displayedCategories = CATEGORIES_BY_TYPE[currentType] || [];

  if (!isReady) return <div className="p-10 text-center text-slate-400 animate-pulse">Chargement...</div>;

  return (
    <div className="flex flex-col h-full gap-4">
      
      {/* --- PARTIE HAUTE : VISUEL + PROPRIÉTÉS --- */}
      <div className="flex flex-col lg:flex-row gap-4 h-[55%] min-h-[400px]">
        
        {/* COLONNE GAUCHE : Éditeur Visuel (Maintenant il prend toute la hauteur disponible) */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative flex flex-col">
            {/* On rend conditionnellement l'éditeur sans la barre d'onglets au-dessus */}
            {currentType === 'MAZE' && <MazeEditor levelData={levelData} onUpdate={onUpdate} />}
            {currentType === 'TURTLE' && <TurtleEditor levelData={levelData} onUpdate={onUpdate} />}
            {currentType === 'MATH' && <MathEditor levelData={levelData} onUpdate={onUpdate} />}
            {currentType === 'EQUATION' && <EquationEditor levelData={levelData} onUpdate={onUpdate} />}
        </div>

        {/* COLONNE DROITE : Propriétés & Toolbox */}
        <div className="w-full lg:w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <h4 className="m-0 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <span>⚙️</span> Configuration
            </h4>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-5">
              {/* Consigne */}
              <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Consigne</label>
                  <textarea 
                    value={levelData.instruction || ""} 
                    onChange={(e) => onUpdate({ ...levelData, instruction: e.target.value })} 
                    className="w-full h-24 p-2 text-sm text-slate-700 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none bg-slate-50 focus:bg-white"
                    placeholder="Instructions en Markdown..." 
                  />
              </div>

              {/* Objectif */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                <label className="text-xs font-bold text-emerald-600">🏆 Objectif (Par)</label>
                <div className="flex items-center gap-2">
                    <input 
                        type="number" min="1" 
                        value={levelData.maxBlocks || 5} 
                        onChange={(e) => onUpdate({ ...levelData, maxBlocks: parseInt(e.target.value) })} 
                        className="w-14 p-1 text-center font-bold text-sm text-slate-700 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 font-bold uppercase">blocs</span>
                </div>
              </div>

              {/* Toolbox */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 mb-2 uppercase border-t border-slate-100 pt-3">
                    🧰 Blocs autorisés
                </h4>
                <div className="space-y-1">
                    {displayedCategories.map(catName => {
                        const categoryBlocks = CATEGORY_CONTENTS[catName] || [];
                        const currentAllowed = levelData.allowedBlocks || [];
                        const allChecked = categoryBlocks.every(type => currentAllowed.includes(type));
                        const isIndeterminate = categoryBlocks.some(type => currentAllowed.includes(type)) && !allChecked;

                        if (catName === 'Variables' && (!levelData.inputs || Object.keys(levelData.inputs).length === 0)) return null;

                        return (
                        <details key={catName} open={allChecked || isIndeterminate} className="group border border-slate-100 rounded-lg overflow-hidden bg-white">
                            <summary className="flex items-center justify-between p-2 bg-slate-50/80 cursor-pointer select-none hover:bg-slate-100">
                                <span className="text-xs font-bold text-slate-600">{catName}</span>
                                <input 
                                    type="checkbox" 
                                    checked={allChecked} 
                                    ref={input => { if (input) input.indeterminate = isIndeterminate; }}
                                    onChange={(e) => { e.stopPropagation(); toggleCategory(catName); }}
                                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                                />
                            </summary>
                            <div className="p-2 space-y-1">
                                {categoryBlocks.map(blockType => (
                                <div key={blockType} className="flex items-center hover:bg-blue-50/50 p-1 rounded transition-colors">
                                    <label className="flex-1 cursor-pointer flex items-center text-[11px] text-slate-500 gap-2">
                                        <input 
                                            type="checkbox" 
                                            checked={currentAllowed.includes(blockType)} 
                                            onChange={() => toggleBlock(blockType)} 
                                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        {BLOCK_LABELS[blockType] || blockType}
                                    </label>
                                </div>
                                ))}
                            </div>
                        </details>
                        );
                    })}
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* --- PARTIE BASSE : BLOCKLY --- */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[300px]">
        <div className="flex border-b border-slate-100 bg-slate-50">
            {[
                { id: 'START', label: '🧩 Code Élève (Départ)', color: 'blue' },
                { id: 'SOLUTION', label: '✅ Solution Prof', color: 'emerald' }
            ].map(mode => (
                <button 
                    key={mode.id}
                    onClick={() => setCodeMode(mode.id)} 
                    className={`
                        flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all
                        ${codeMode === mode.id ? `text-${mode.color}-600 bg-white border-t-2 border-${mode.color}-500` : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}
                    `}
                >
                    {mode.label}
                </button>
            ))}
        </div>

        <div className={`flex-1 relative ${codeMode === 'SOLUTION' ? 'bg-emerald-50/30' : 'bg-white'}`}>
           <div className="absolute inset-0 blockly-container-custom">
               <BlocklyWorkspace
                  key={workspaceKey}
                  className="blockly-div w-full h-full"
                  toolboxConfiguration={activeToolbox.xml}
                  workspaceConfiguration={editorConfig}
                  initialXml={codeMode === 'START' ? (levelData.startBlocks || '<xml></xml>') : (levelData.solutionBlocks || '<xml></xml>')}
                  onXmlChange={(xml) => {
                      if (codeMode === 'START') onUpdate({ ...levelData, startBlocks: xml });
                      else onUpdate({ ...levelData, solutionBlocks: xml });
                  }}
                  onInject={handleInject}
               />
           </div>
        </div>
      </div>
    </div>
  );
}