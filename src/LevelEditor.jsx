import React, { useEffect, useState, useRef, useMemo } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

import { getPlugin, getAllPlugins } from '../../core/PluginRegistry'; 
import { registerAllBlocks } from '../../core/BlockRegistry';
import { generateToolbox, generateMasterToolbox, CATEGORY_CONTENTS, BLOCK_LABELS } from '../../core/BlockDefinitions'; 

export default function LevelEditor({ levelData, onUpdate }) {
  const workspaceRef = useRef(null);
  const [codeMode, setCodeMode] = useState('START');
  const [isReady, setIsReady] = useState(false);
  
  const currentType = levelData.type || 'MAZE';
  const activeFeature = getPlugin(currentType); 
  
  const safeFeature = activeFeature || getAllPlugins()[0];
  const VisualEditor = safeFeature?.EditorComponent; 

  useEffect(() => {
    setIsReady(false);
    const timer = setTimeout(() => {
        try {
            registerAllBlocks();
            if (safeFeature && safeFeature.registerBlocks) {
                safeFeature.registerBlocks(Blockly, javascriptGenerator); 
            }
            setIsReady(true);
        } catch(e) { console.error(e); }
    }, 50);
    return () => clearTimeout(timer);
  }, [safeFeature]);

  const editorConfig = { scrollbars: true, trashcan: true, readOnly: false };
  
  const handleTypeChange = (newType) => {
    const targetPlugin = getPlugin(newType);
    if (!targetPlugin) return;

    let newDefaults = {};
    if (targetPlugin.config && targetPlugin.config.defaultGrid) {
        newDefaults.grid = targetPlugin.config.defaultGrid;
    }
    
    onUpdate({ 
        ...levelData, 
        type: newType, 
        allowedBlocks: [], 
        startBlocks: '<xml></xml>',
        solutionBlocks: '<xml></xml>',
        ...newDefaults
    });
  };

  // --- MERGE TOOLBOX ---
  const getMergedToolbox = (isMaster) => {
      const standardResult = isMaster
          ? generateMasterToolbox(currentType, levelData.inputs, levelData.hiddenVars, levelData.lockedVars)
          : generateToolbox(levelData.allowedBlocks, levelData.inputs, levelData.hiddenVars, levelData.lockedVars);

      if (safeFeature && safeFeature.getToolbox) {
          const featureToolbox = safeFeature.getToolbox();
          if (featureToolbox.xml) {
              let finalXml = standardResult.xml;
              // Si la toolbox standard est plate (pas de catégories), on doit l'adapter
              if (!standardResult.hasCategories) {
                  const content = finalXml.match(/<xml[^>]*>([\s\S]*)<\/xml>/)?.[1] || '';
                  const wrappedContent = content.trim() ? `<category name="Outils" colour="#A0A0A0">${content}</category>` : '';
                  finalXml = `<xml xmlns="https://developers.google.com/blockly/xml">${featureToolbox.xml}${wrappedContent}</xml>`;
                  // On force le mode catégorie car on vient d'en ajouter une
                  return { xml: finalXml, hasCategories: true };
              } else {
                  finalXml = finalXml.replace(/(<xml[^>]*>)/, `$1${featureToolbox.xml}`);
              }
              return { xml: finalXml, hasCategories: true };
          }
      }
      return standardResult;
  };

  const activeToolboxResult = useMemo(() => getMergedToolbox(codeMode === 'SOLUTION'), [codeMode, currentType, safeFeature, levelData]);
  
  const editorToolboxXML = activeToolboxResult.xml;
  // 👇 CORRECTION CRITIQUE : On ajoute hasCategories dans la clé pour forcer le remount si la structure change
  const workspaceKey = `editor-${currentType}-${levelData.id}-${codeMode}-${activeToolboxResult.hasCategories ? 'CAT' : 'FLY'}`;

  const handleInject = (newWorkspace) => {
    workspaceRef.current = newWorkspace;
    window.setTimeout(() => Blockly.svgResize(newWorkspace), 0);
  };

  useEffect(() => {
    if (workspaceRef.current && isReady) {
        try { 
            workspaceRef.current.updateToolbox(editorToolboxXML); 
            Blockly.svgResize(workspaceRef.current); 
        } catch(e) {
            // Si updateToolbox échoue (changement de mode incompatible), ce n'est pas grave
            // car la workspaceKey va changer et forcer le rechargement du composant.
            console.warn("Toolbox update skipped (mode change pending)");
        }
    }
  }, [editorToolboxXML, isReady]);

  const toggleBlock = (blockType) => {
    const currentAllowed = levelData.allowedBlocks || [];
    const newAllowed = currentAllowed.includes(blockType) ? currentAllowed.filter(t => t !== blockType) : [...currentAllowed, blockType];
    onUpdate({ ...levelData, allowedBlocks: newAllowed });
  };
  
  const toggleCategory = (catName, blocks) => {
    const categoryBlocks = blocks || CATEGORY_CONTENTS[catName] || [];
    const currentAllowed = levelData.allowedBlocks || [];
    const allChecked = categoryBlocks.every(type => currentAllowed.includes(type));
    const newAllowed = allChecked ? currentAllowed.filter(type => !categoryBlocks.includes(type)) : [...currentAllowed, ...categoryBlocks.filter(t => !currentAllowed.includes(t))];
    onUpdate({ ...levelData, allowedBlocks: newAllowed });
  };

  // 👇 CORRECTION DOUBLONS : Utilisation d'un Set
  const displayedCategories = useMemo(() => {
      const coreCats = ['Mouvements', 'Capteurs', 'Logique', 'Mathématiques', 'Variables'];
      
      let cats = [];
      if (safeFeature && safeFeature.getToolbox) {
          const tb = safeFeature.getToolbox();
          if (tb.category) cats.push(tb.category);
      }
      // Set élimine les doublons (ex: Mathématiques présent dans coreCats ET plugin)
      return [...new Set([...cats, ...coreCats])];
  }, [safeFeature]);

  const getTabStyle = (isActive) => ({ flex: 1, padding: '6px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: isActive ? 'white' : '#eee', fontWeight: isActive ? 'bold' : 'normal', fontSize: '0.8rem', transition: 'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' });
  const tabStyle = (isActive, mode) => ({ padding: '10px 20px', cursor: 'pointer', border: 'none', borderBottom: isActive ? (mode === 'SOLUTION' ? '3px solid #27ae60' : '3px solid #2980b9') : '3px solid transparent', background: isActive ? (mode === 'SOLUTION' ? '#f0fbf4' : '#f0f8ff') : 'transparent', fontWeight: isActive ? 'bold' : 'normal', color: isActive ? (mode === 'SOLUTION' ? '#27ae60' : '#2980b9') : '#7f8c8d', fontSize: '0.95rem', transition: 'all 0.2s' });

  if (!isReady) return <div style={{padding: 50, textAlign: 'center', color: '#666'}}>Chargement éditeur...</div>;

  return (
    <div className="editor-wrapper" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <div style={{display: 'flex', gap: '15px', flex: 1, minHeight: '400px'}}>
        
        <div style={{flex: 3, display: 'flex', flexDirection: 'column'}}>
            <div style={{display: 'flex', marginBottom: '10px', background: '#ecf0f1', padding: '4px', borderRadius: '6px', gap:'5px'}}>
                {getAllPlugins().map(p => (
                    <button key={p.id} onClick={() => handleTypeChange(p.id)} style={getTabStyle(currentType === p.id)}>
                        <span>{p.icon}</span> {p.name}
                    </button>
                ))}
            </div>
            
            <div style={{flex: 1, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', overflowY: 'auto'}}>
                {VisualEditor ? <VisualEditor levelData={levelData} onUpdate={onUpdate} /> : <div>Aucun éditeur</div>}
            </div>
        </div>

        <div style={{flex: 1, minWidth: '220px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflowY: 'auto', border: '1px solid #eee'}}>
          
          <div style={{marginBottom: '10px'}}>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem', display: 'block', marginBottom: '3px', color:'#7f8c8d'}}>Consigne</label>
              <textarea value={levelData.instruction || ""} onChange={(e) => onUpdate({ ...levelData, instruction: e.target.value })} style={{width: '100%', height: '60px', padding: '5px', fontSize: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical'}} placeholder="Ex: Dessine un carré..." />
          </div>

          <div style={{marginBottom: '15px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f8f9fa', padding:'5px 8px', borderRadius:'4px'}}>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem', color:'#27ae60'}}>🏆 Objectif</label>
              <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                <input type="number" min="1" value={levelData.maxBlocks || 5} onChange={(e) => onUpdate({ ...levelData, maxBlocks: parseInt(e.target.value) })} style={{width: '40px', padding: '2px', textAlign: 'center', border:'1px solid #ddd', borderRadius:'3px'}} />
                <span style={{fontSize:'0.8rem', color:'#7f8c8d'}}>blocs</span>
              </div>
          </div>
          
          <h4 style={{marginTop: '15px', marginBottom: '5px', color: '#2c3e50', borderBottom:'2px solid #eee', paddingBottom:'5px'}}>🧰 Toolbox Élève</h4>
          <div style={{fontSize: '0.85rem'}}>
            {displayedCategories.map(catName => {
                let categoryBlocks = CATEGORY_CONTENTS[catName] || [];
                
                if (safeFeature.name === catName || (safeFeature.getToolbox().category === catName)) {
                    if (safeFeature.id === 'MAZE') categoryBlocks = ['maze_move_forward', 'maze_turn', 'maze_if', 'maze_if_else', 'maze_forever'];
                    // Pour Turtle et Math, ils utilisent des blocs standards ou définis dans BlockRegistry, donc CATEGORY_CONTENTS peut suffire
                    // Mais si le plugin définit des blocs spécifiques non listés dans CATEGORY_CONTENTS, il faudrait les ajouter ici.
                }
                
                if (categoryBlocks.length === 0) return null;
                
                const currentAllowed = levelData.allowedBlocks || [];
                const allChecked = categoryBlocks.every(type => currentAllowed.includes(type));
                const isIndeterminate = categoryBlocks.some(type => currentAllowed.includes(type)) && !allChecked;

                return (
                  <details key={catName} open={allChecked || isIndeterminate} style={{marginBottom: '5px', border:'1px solid #f0f0f0', borderRadius:'4px'}}>
                    <summary style={{padding: '6px', cursor: 'pointer', background: '#f9f9f9', fontWeight: 'bold', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <span>{catName}</span>
                        <input type="checkbox" checked={allChecked} ref={input => { if (input) input.indeterminate = isIndeterminate; }} onChange={(e) => { e.stopPropagation(); toggleCategory(catName, categoryBlocks); }} />
                    </summary>
                    <div style={{padding: '5px 10px'}}>
                        {categoryBlocks.map(blockType => (
                          <div key={blockType} style={{margin: '4px 0'}}>
                            <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#666'}}>
                              <input type="checkbox" checked={currentAllowed.includes(blockType)} onChange={() => toggleBlock(blockType)} style={{marginRight: '6px'}} />
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

      <div style={{height: '350px', marginTop: '15px', background: 'white', padding: '0', borderRadius: '8px', border: '1px solid #ccc', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
        <div style={{display: 'flex', background: '#ecf0f1', borderBottom: '1px solid #bdc3c7'}}>
            <button onClick={() => setCodeMode('START')} style={tabStyle(codeMode === 'START', 'START')}>🧩 Code Élève (Preview)</button>
            <button onClick={() => setCodeMode('SOLUTION')} style={tabStyle(codeMode === 'SOLUTION', 'SOLUTION')}>✅ Solution Prof (Complet)</button>
        </div>
        <div style={{flex: 1, position: 'relative', background: codeMode === 'SOLUTION' ? '#f0fbf4' : 'white'}}>
           {codeMode === 'START' && <div style={{position:'absolute', right:10, top:5, zIndex:10, fontSize:'0.75rem', color:'#aaa', background:'rgba(255,255,255,0.8)', padding:'2px 5px', borderRadius:'3px'}}>Vue : Toolbox Élève</div>}
           <BlocklyWorkspace key={workspaceKey} className="blockly-div" toolboxConfiguration={editorToolboxXML} workspaceConfiguration={editorConfig} initialXml={codeMode === 'START' ? (levelData.startBlocks || '<xml></xml>') : (levelData.solutionBlocks || '<xml></xml>')} onXmlChange={(xml) => { if (codeMode === 'START') onUpdate({ ...levelData, startBlocks: xml }); else onUpdate({ ...levelData, solutionBlocks: xml }); }} onInject={handleInject} />
        </div>
      </div>
    </div>
  );
}