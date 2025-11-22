import React, { useEffect, useState, useRef, useMemo } from 'react';
import MazeEditor from './editors/MazeEditor';
import MathEditor from './editors/MathEditor';
import TurtleEditor from './editors/TurtleEditor';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { MazePlugin } from '../../plugins/MazePlugin';
import { MathPlugin } from '../../plugins/MathPlugin';
import { TurtlePlugin } from '../../plugins/TurtlePlugin';
import { registerAllBlocks } from '../../core/BlockRegistry';
import { 
    generateToolbox, 
    generateMasterToolbox, 
    CATEGORIES_BY_TYPE, 
    CATEGORY_CONTENTS,
    BLOCK_LABELS // <--- Import des traductions/icônes centralisées
} from '../../core/BlockDefinitions'; 
import { MAZE_CONFIG } from '../../core/adapters/MazeAdapter';

export default function LevelEditor({ levelData, onUpdate }) {
  const workspaceRef = useRef(null);
  const [codeMode, setCodeMode] = useState('START');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
        try {
            registerAllBlocks();
            setIsReady(true);
        } catch(e) { console.error(e); }
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const editorConfig = { scrollbars: true, trashcan: true, readOnly: false };
  
  const handleTypeChange = (newType) => {
    let newDefaults = {};
    if (newType === 'MAZE') {
        newDefaults = {
            grid: MAZE_CONFIG.defaultGrid,
            startPos: { x: 1, y: 1, dir: 1 },
            maxBlocks: 10
        };
    } else if (newType === 'TURTLE') {
        newDefaults = {
            startPos: { x: 0, y: 0, dir: 0 },
            maxBlocks: 10,
            grid: undefined 
        };
    } else if (newType === 'MATH') {
        newDefaults = {
            maxBlocks: 20,
            startPos: undefined
        };
    }

    onUpdate({ 
        ...levelData, 
        type: newType, 
        allowedBlocks: undefined,
        ...newDefaults
    });
  };

  const currentType = levelData.type || 'MAZE';

  const studentToolboxResult = useMemo(() => generateToolbox(
      levelData.allowedBlocks, 
      levelData.inputs, 
      levelData.hiddenVars, 
      levelData.lockedVars
  ), [levelData.allowedBlocks, levelData.inputs, levelData.hiddenVars, levelData.lockedVars]);

  const masterToolboxResult = useMemo(() => generateMasterToolbox(
      currentType, 
      levelData.inputs, 
      levelData.hiddenVars, 
      levelData.lockedVars
  ), [currentType, levelData.inputs, levelData.hiddenVars, levelData.lockedVars]);

  const activeToolbox = codeMode === 'SOLUTION' ? masterToolboxResult : studentToolboxResult;
  const editorToolboxXML = activeToolbox.xml;
  const hasCategories = activeToolbox.hasCategories;

  const workspaceKey = `${levelData.id}-${currentType}-${codeMode}-${hasCategories ? 'CAT' : 'FLY'}`;

  const handleInject = (newWorkspace) => {
    workspaceRef.current = newWorkspace;
    window.setTimeout(() => Blockly.svgResize(newWorkspace), 0);
  };

  useEffect(() => {
    if (workspaceRef.current && isReady) {
        workspaceRef.current.updateToolbox(editorToolboxXML);
    }
  }, [editorToolboxXML, isReady]);

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
  const getTabStyle = (isActive) => ({ flex: 1, padding: '6px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: isActive ? 'white' : '#eee', fontWeight: isActive ? 'bold' : 'normal', fontSize: '0.8rem', transition: 'all 0.2s' });
  const tabStyle = (isActive, mode) => ({ padding: '10px 20px', cursor: 'pointer', border: 'none', borderBottom: isActive ? (mode === 'SOLUTION' ? '3px solid #27ae60' : '3px solid #2980b9') : '3px solid transparent', background: isActive ? (mode === 'SOLUTION' ? '#f0fbf4' : '#f0f8ff') : 'transparent', fontWeight: isActive ? 'bold' : 'normal', color: isActive ? (mode === 'SOLUTION' ? '#27ae60' : '#2980b9') : '#7f8c8d', fontSize: '0.95rem', transition: 'all 0.2s' });

  if (!isReady) return <div style={{padding: 50, textAlign: 'center', color: '#666'}}>Chargement...</div>;

  return (
    <div className="editor-wrapper" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <div style={{display: 'flex', gap: '15px', flex: 1, minHeight: '400px'}}>
        
        {/* GAUCHE */}
        <div style={{flex: 3, display: 'flex', flexDirection: 'column'}}>
            <div style={{display: 'flex', marginBottom: '10px', background: '#ecf0f1', padding: '4px', borderRadius: '6px', gap:'5px'}}>
                <button onClick={() => handleTypeChange('MAZE')} style={getTabStyle(currentType === 'MAZE')}>🏰 Labyrinthe</button>
                <button onClick={() => handleTypeChange('TURTLE')} style={getTabStyle(currentType === 'TURTLE')}>🐢 Tortue</button>
                <button onClick={() => handleTypeChange('MATH')} style={getTabStyle(currentType === 'MATH')}>🧪 Labo</button>
            </div>
            <div style={{flex: 1, background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', overflowY: 'auto'}}>
                {currentType === 'MAZE' && <MazeEditor levelData={levelData} onUpdate={onUpdate} />}
                {currentType === 'TURTLE' && <TurtleEditor levelData={levelData} onUpdate={onUpdate} />}
                {currentType === 'MATH' && <MathEditor levelData={levelData} onUpdate={onUpdate} />}
            </div>
        </div>

        {/* DROITE */}
        <div style={{flex: 1, minWidth: '220px', background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflowY: 'auto', border: '1px solid #eee'}}>
          <h4 style={{marginTop: 0, marginBottom: '10px', color: '#2c3e50', borderBottom:'2px solid #eee', paddingBottom:'5px'}}>⚙️ Propriétés</h4>
          
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

          <h4 style={{marginTop: '15px', marginBottom: '5px', color: '#2c3e50', borderBottom:'2px solid #eee', paddingBottom:'5px'}}>
            🧰 Toolbox Élève
          </h4>
          
          <div style={{fontSize: '0.85rem'}}>
            {displayedCategories.map(catName => {
                const categoryBlocks = CATEGORY_CONTENTS[catName] || [];
                const currentAllowed = levelData.allowedBlocks || [];
                const allChecked = categoryBlocks.every(type => currentAllowed.includes(type));
                const isIndeterminate = categoryBlocks.some(type => currentAllowed.includes(type)) && !allChecked;

                if (catName === 'Variables' && (!levelData.inputs || Object.keys(levelData.inputs).length === 0)) return null;

                return (
                  <details key={catName} open={allChecked || isIndeterminate} style={{marginBottom: '5px', border:'1px solid #f0f0f0', borderRadius:'4px'}}>
                    <summary style={{padding: '6px', cursor: 'pointer', background: '#f9f9f9', fontWeight: 'bold', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <span>{catName}</span>
                        <input 
                            type="checkbox" 
                            checked={allChecked} 
                            ref={input => { if (input) input.indeterminate = isIndeterminate; }}
                            onChange={(e) => { e.stopPropagation(); toggleCategory(catName); }} 
                        />
                    </summary>
                    <div style={{padding: '5px 10px'}}>
                        {categoryBlocks.map(blockType => (
                          <div key={blockType} style={{margin: '4px 0'}}>
                            <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#666'}}>
                              <input type="checkbox" checked={currentAllowed.includes(blockType)} onChange={() => toggleBlock(blockType)} style={{marginRight: '6px'}} />
                              {/* C'EST ICI QUE C'EST CORRIGÉ : ON UTILISE LA TRADUCTION */}
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
           {codeMode === 'START' && (
               <div style={{position:'absolute', right:10, top:5, zIndex:10, fontSize:'0.75rem', color:'#aaa', background:'rgba(255,255,255,0.8)', padding:'2px 5px', borderRadius:'3px'}}>
                   Vue : Toolbox Élève
               </div>
           )}
           <BlocklyWorkspace
              key={workspaceKey}
              className="blockly-div"
              toolboxConfiguration={editorToolboxXML}
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
  );
}