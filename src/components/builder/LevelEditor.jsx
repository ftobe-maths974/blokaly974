import React, { useEffect, useState, useRef, useMemo } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

import { getPlugin, getAllPlugins } from '../../core/PluginRegistry'; 
import { registerAllBlocks } from '../../core/BlockRegistry';
import { 
    generateToolbox, 
    generateMasterToolbox, 
    CATEGORY_CONTENTS, 
    BLOCK_LABELS 
} from '../../core/BlockDefinitions'; 

// Composant Checkbox pour gérer l'état "indéterminé" sans bug visuel
const CategoryCheckbox = ({ checked, indeterminate, onChange, label }) => {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current) ref.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
        <label style={{cursor: 'pointer', background: '#f9f9f9', padding: '6px', fontWeight: 'bold', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '4px'}}>
            <span>{label}</span>
            <input 
                type="checkbox" 
                ref={ref}
                checked={checked} 
                onChange={onChange}
                onClick={(e) => e.stopPropagation()} 
            />
        </label>
    );
};

export default function LevelEditor({ levelData, onUpdate }) {
  const workspaceRef = useRef(null);
  const [codeMode, setCodeMode] = useState('START');
  
  // Sécurisation : on s'assure que allowedBlocks est toujours un tableau
  const safeLevelData = {
      ...levelData,
      allowedBlocks: Array.isArray(levelData.allowedBlocks) ? levelData.allowedBlocks : []
  };

  const currentType = safeLevelData.type || 'MAZE';
  const activeFeature = getPlugin(currentType); 
  const safeFeature = activeFeature || getAllPlugins()[0];
  const VisualEditor = safeFeature?.EditorComponent; 

  const editorConfig = { scrollbars: true, trashcan: true, readOnly: false };

  // --- 1. STRUCTURE DES CATÉGORIES (Source de vérité) ---
  const categoryStructure = useMemo(() => {
      const structure = [];
      const coreCats = ['Mouvements', 'Capteurs', 'Logique', 'Mathématiques', 'Variables', 'Listes', 'Interactions'];
      
      let featureCatName = safeFeature.name;
      // Si le plugin définit un nom de catégorie spécifique dans son toolbox
      if (safeFeature.getToolbox) {
          const tb = safeFeature.getToolbox([]); // On appelle avec [] juste pour voir la structure
          if (tb.category) featureCatName = tb.category;
      }

      const allCatNames = Array.from(new Set([featureCatName, ...coreCats]));

      allCatNames.forEach(catName => {
          let blocks = CATEGORY_CONTENTS[catName] || [];

          // Définitions manuelles pour garantir l'affichage des blocs Plugin
          if (safeFeature.id === 'MAZE' && catName === 'Labyrinthe') {
              blocks = ['maze_move_forward', 'maze_turn', 'maze_if', 'maze_if_else', 'maze_forever'];
          }
          else if (safeFeature.id === 'TURTLE' && catName === 'Tortue') {
              blocks = ['turtle_move', 'turtle_turn', 'turtle_pen', 'turtle_color'];
          }
          else if (safeFeature.id === 'EQUATION' && catName === 'Algèbre') {
              blocks = ['equation_op_both', 'equation_term_x', 'equation_verify', 'equation_solution_state', 'equation_solution_s', 'equation_interval', 'math_infinity', 'math_number'];
          }

          if (blocks.length > 0) {
              structure.push({ name: catName, blocks: blocks });
          }
      });
      return structure;
  }, [safeFeature]);

  // --- 2. LOGIQUE ACTIONS CHECKBOX ---
  const toggleBlock = (blockType) => {
    const currentAllowed = safeLevelData.allowedBlocks;
    const newAllowed = currentAllowed.includes(blockType) 
        ? currentAllowed.filter(t => t !== blockType) 
        : [...currentAllowed, blockType];
    onUpdate({ ...safeLevelData, allowedBlocks: newAllowed });
  };

  const toggleCategory = (blocksInCategory) => {
    const currentAllowed = safeLevelData.allowedBlocks;
    const allChecked = blocksInCategory.every(b => currentAllowed.includes(b));
    
    const newAllowed = allChecked
        ? currentAllowed.filter(b => !blocksInCategory.includes(b)) // Tout décocher
        : [...new Set([...currentAllowed, ...blocksInCategory])]; // Tout cocher
    
    onUpdate({ ...safeLevelData, allowedBlocks: newAllowed });
  };

  const handleTypeChange = (newType) => {
    const targetPlugin = getPlugin(newType);
    if (!targetPlugin) return;
    const newDefaults = targetPlugin.config?.defaultGrid ? { grid: targetPlugin.config.defaultGrid } : {};
    
    onUpdate({ 
        ...safeLevelData, 
        type: newType, 
        allowedBlocks: [], 
        startBlocks: '<xml></xml>',
        solutionBlocks: '<xml></xml>',
        ...newDefaults
    });
  };

  // --- 3. GÉNÉRATION XML DYNAMIQUE ---
  const editorToolboxXML = useMemo(() => {
      const isMaster = codeMode === 'SOLUTION';
      // Si mode solution -> on veut tout (null). Si mode élève -> on filtre.
      const blocksToShow = isMaster ? null : safeLevelData.allowedBlocks;

      // Base Standard
      const standardResult = isMaster
          ? generateMasterToolbox(currentType, safeLevelData.inputs, safeLevelData.hiddenVars, safeLevelData.lockedVars)
          : generateToolbox(blocksToShow, safeLevelData.inputs, safeLevelData.hiddenVars, safeLevelData.lockedVars);

      // Injection Plugin Filtrée
      if (safeFeature && safeFeature.getToolbox) {
          // 👉 C'EST ICI LA CLÉ : On passe la liste filtrée au plugin !
          const featureToolbox = safeFeature.getToolbox(blocksToShow);
          
          if (featureToolbox.xml && featureToolbox.xml.trim() !== '') {
              if (!standardResult.xml.includes(featureToolbox.xml)) {
                  let finalXml = standardResult.xml;
                  if (!standardResult.hasCategories) {
                      const content = finalXml.match(/<xml[^>]*>([\s\S]*)<\/xml>/)?.[1] || '';
                      const wrappedContent = content.trim() ? `<category name="Outils" colour="#A0A0A0">${content}</category>` : '';
                      finalXml = `<xml xmlns="https://developers.google.com/blockly/xml">${featureToolbox.xml}${wrappedContent}</xml>`;
                  } else {
                      finalXml = finalXml.replace(/(<xml[^>]*>)/, `$1${featureToolbox.xml}`);
                  }
                  return finalXml;
              }
          }
      }
      return standardResult.xml;
  }, [codeMode, currentType, safeFeature, safeLevelData]);

  // --- 4. INJECTION ---
  const handleInject = (newWorkspace) => {
    workspaceRef.current = newWorkspace;
    try {
        registerAllBlocks();
        if (safeFeature?.registerBlocks) safeFeature.registerBlocks(Blockly, javascriptGenerator);
        newWorkspace.updateToolbox(editorToolboxXML);
    } catch(e) { console.error(e); }
    window.setTimeout(() => Blockly.svgResize(newWorkspace), 0);
  };

  useEffect(() => {
    if (workspaceRef.current) {
        workspaceRef.current.updateToolbox(editorToolboxXML);
        Blockly.svgResize(workspaceRef.current);
    }
  }, [editorToolboxXML]);

  // Styles
  const getTabStyle = (isActive) => ({ flex: 1, padding: '6px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: isActive ? 'white' : '#eee', fontWeight: isActive ? 'bold' : 'normal', fontSize: '0.8rem', transition: 'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' });
  const tabStyle = (isActive, mode) => ({ padding: '10px 20px', cursor: 'pointer', border: 'none', borderBottom: isActive ? (mode === 'SOLUTION' ? '3px solid #27ae60' : '3px solid #2980b9') : '3px solid transparent', background: isActive ? (mode === 'SOLUTION' ? '#f0fbf4' : '#f0f8ff') : 'transparent', fontWeight: isActive ? 'bold' : 'normal', color: isActive ? (mode === 'SOLUTION' ? '#27ae60' : '#2980b9') : '#7f8c8d', fontSize: '0.95rem', transition: 'all 0.2s' });
  
  // 👇 MODIFICATION ICI : On ajoute 'currentType' dans la clé unique
  // Cela force React à "jeter" l'ancien éditeur et en créer un neuf propre quand on change de plugin.
  const workspaceKey = `editor-${safeLevelData.id}-${currentType}-${codeMode}`;

  return (
    <div className="editor-wrapper" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <div style={{display: 'flex', gap: '15px', flex: 1, minHeight: '400px'}}>
        {/* GAUCHE */}
        <div style={{flex: 3, display: 'flex', flexDirection: 'column'}}>
            <div style={{display: 'flex', marginBottom: '10px', background: '#ecf0f1', padding: '4px', borderRadius: '6px', gap:'5px'}}>
                {getAllPlugins().map(p => (
                    <button key={p.id} onClick={() => handleTypeChange(p.id)} style={getTabStyle(currentType === p.id)}>
                        <span>{p.icon}</span> {p.name}
                    </button>
                ))}
            </div>
            <div style={{flex: 1, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', overflowY: 'auto'}}>
                {VisualEditor ? <VisualEditor levelData={safeLevelData} onUpdate={onUpdate} /> : <div>Aucun éditeur</div>}
            </div>
        </div>

        {/* DROITE : TOOLBOX */}
        <div style={{flex: 1, minWidth: '220px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflowY: 'auto', border: '1px solid #eee'}}>
          <div style={{marginBottom: '10px'}}>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem', display: 'block', marginBottom: '3px', color:'#7f8c8d'}}>Consigne</label>
              <textarea value={safeLevelData.instruction || ""} onChange={(e) => onUpdate({ ...safeLevelData, instruction: e.target.value })} style={{width: '100%', height: '60px', padding: '5px', fontSize: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical'}} placeholder="Ex: Dessine un carré..." />
          </div>
          <div style={{marginBottom: '15px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f8f9fa', padding:'5px 8px', borderRadius:'4px'}}>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem', color:'#27ae60'}}>🏆 Objectif</label>
              <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                <input type="number" min="1" value={safeLevelData.maxBlocks || 5} onChange={(e) => onUpdate({ ...safeLevelData, maxBlocks: parseInt(e.target.value) })} style={{width: '40px', padding: '2px', textAlign: 'center', border:'1px solid #ddd', borderRadius:'3px'}} />
                <span style={{fontSize:'0.8rem', color:'#7f8c8d'}}>blocs</span>
              </div>
          </div>
          <h4 style={{marginTop: '15px', marginBottom: '5px', color: '#2c3e50', borderBottom:'2px solid #eee', paddingBottom:'5px'}}>🧰 Toolbox Élève</h4>
          <div style={{fontSize: '0.85rem'}}>
            {categoryStructure.map((cat) => {
                const currentAllowed = safeLevelData.allowedBlocks;
                const activeCount = cat.blocks.filter(b => currentAllowed.includes(b)).length;
                const totalCount = cat.blocks.length;
                const allChecked = totalCount > 0 && activeCount === totalCount;
                const isIndeterminate = activeCount > 0 && activeCount < totalCount;

                return (
                  <details key={cat.name} open={activeCount > 0} style={{marginBottom: '5px', border:'1px solid #f0f0f0', borderRadius:'4px'}}>
                    <summary style={{listStyle: 'none'}}>
                        <CategoryCheckbox 
                            label={cat.name}
                            checked={allChecked}
                            indeterminate={isIndeterminate}
                            onChange={() => toggleCategory(cat.blocks)}
                        />
                    </summary>
                    <div style={{padding: '5px 10px'}}>
                        {cat.blocks.map(blockType => (
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

      <div style={{height: '350px', marginTop: '15px', background: 'white', padding: '0', borderRadius: '8px', border: '1px solid #ccc', display: 'flex', flexDirection: 'column', overflow: 'hidden', position:'relative'}}>
        <div style={{display: 'flex', background: '#ecf0f1', borderBottom: '1px solid #bdc3c7'}}>
            <button onClick={() => setCodeMode('START')} style={tabStyle(codeMode === 'START', 'START')}>🧩 Code Élève (Preview)</button>
            <button onClick={() => setCodeMode('SOLUTION')} style={tabStyle(codeMode === 'SOLUTION', 'SOLUTION')}>✅ Solution Prof (Complet)</button>
        </div>
        <div style={{flex: 1, position: 'relative', background: codeMode === 'SOLUTION' ? '#f0fbf4' : 'white'}}>
           <BlocklyWorkspace 
               key={workspaceKey} 
               className="blockly-div" 
               toolboxConfiguration={editorToolboxXML} 
               workspaceConfiguration={editorConfig} 
               initialXml={codeMode === 'START' ? (safeLevelData.startBlocks || '<xml></xml>') : (safeLevelData.solutionBlocks || '<xml></xml>')} 
               onXmlChange={(xml) => { if (codeMode === 'START') onUpdate({ ...safeLevelData, startBlocks: xml }); else onUpdate({ ...safeLevelData, solutionBlocks: xml }); }} 
               onInject={handleInject}
           />
           {codeMode === 'START' && <div style={{position:'absolute', right:10, top:5, zIndex:10, fontSize:'0.75rem', color:'#aaa', background:'rgba(255,255,255,0.8)', padding:'2px 5px', borderRadius:'3px'}}>Vue : Toolbox Élève</div>}
        </div>
      </div>
    </div>
  );
}