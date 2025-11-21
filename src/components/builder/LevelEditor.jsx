import React, { useEffect, useState, useRef } from 'react';
import MazeEditor from './editors/MazeEditor';
import MathEditor from './editors/MathEditor';
import TurtleEditor from './editors/TurtleEditor';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly'; // Nécessaire pour le svgResize
import { MazePlugin } from '../../plugins/MazePlugin';
import { MathPlugin } from '../../plugins/MathPlugin';
import { TurtlePlugin } from '../../plugins/TurtlePlugin';

export default function LevelEditor({ levelData, onUpdate }) {
  const workspaceRef = useRef(null);
  const [codeMode, setCodeMode] = useState('START');

  // Plus besoin de useEffect d'initialisation ici, c'est fait dans main.jsx !
  // Plus besoin de isReady non plus.

  const editorConfig = {
    scrollbars: true,
    trashcan: true,
    readOnly: false
  };
  
  const handleTypeChange = (newType) => {
    onUpdate({ ...levelData, type: newType, allowedBlocks: undefined });
  };
  const currentType = levelData.type || 'MAZE';

  let editorToolbox = '<xml></xml>';
  try {
    if (currentType === 'MATH') {
        editorToolbox = MathPlugin.getToolboxXML(levelData.allowedBlocks, levelData.inputs, levelData.hiddenVars, levelData.lockedVars);
    } else if (currentType === 'TURTLE') {
        editorToolbox = TurtlePlugin.getToolboxXML(levelData.allowedBlocks);
    } else {
        editorToolbox = MazePlugin.getToolboxXML(levelData.allowedBlocks); 
    }
  } catch (e) {}

  useEffect(() => {
    if (workspaceRef.current) {
        workspaceRef.current.updateToolbox(editorToolbox);
    }
  }, [editorToolbox]);

  // --- CORRECTIF BUG AFFICHAGE ---
  const handleInject = (newWorkspace) => {
    workspaceRef.current = newWorkspace;
    // On force le redimensionnement juste après l'injection pour éviter les blocs invisibles
    window.setTimeout(() => {
        Blockly.svgResize(newWorkspace);
    }, 0);
  };

  const toggleBlock = (blockType) => {
    const currentAllowed = levelData.allowedBlocks || [];
    const newAllowed = currentAllowed.includes(blockType) 
        ? currentAllowed.filter(t => t !== blockType)
        : [...currentAllowed, blockType];
    onUpdate({ ...levelData, allowedBlocks: newAllowed });
  };

  const toggleCategory = (catName) => {
    if (!allCategories[catName]) return;
    const categoryBlockTypes = allCategories[catName].map(b => b.type);
    const currentAllowed = levelData.allowedBlocks || [];
    const allChecked = categoryBlockTypes.every(type => currentAllowed.includes(type));

    let newAllowed;
    if (allChecked) {
      newAllowed = currentAllowed.filter(type => !categoryBlockTypes.includes(type));
    } else {
      const toAdd = categoryBlockTypes.filter(type => !currentAllowed.includes(type));
      newAllowed = [...currentAllowed, ...toAdd];
    }
    onUpdate({ ...levelData, allowedBlocks: newAllowed });
  };

  // ... (Garde la constante allCategories et le reste du composant identique) ...
  // Je remets juste la fin pour le contexte des imports
  const allCategories = {
    "Mouvements": [{ type: 'maze_move_forward', label: 'Avancer (Maze)' }, { type: 'maze_turn', label: 'Tourner (Maze)' }],
    "Tortue": [{ type: 'turtle_move', label: 'Avancer 🐢' }, { type: 'turtle_turn', label: 'Tourner 🐢' }, { type: 'turtle_pen', label: 'Stylo ✏️' }, { type: 'turtle_color', label: 'Couleur 🎨' }],
    "Logique": [{ type: 'controls_repeat_ext', label: 'Boucles' }, { type: 'controls_whileUntil', label: 'Tant que' }, { type: 'controls_if', label: 'Si' }, { type: 'logic_compare', label: 'Comparaisons' }, { type: 'logic_operation', label: 'Opérateurs' }],
    "Mathématiques": [{ type: 'math_number', label: 'Nombre' }, { type: 'math_arithmetic', label: 'Calculs' }, { type: 'math_modulo', label: 'Modulo' }, { type: 'math_random_int', label: 'Aléatoire' }],
    "Listes & Tableaux": [{ type: 'lists_create_with', label: 'Créer liste' }, { type: 'lists_getIndex', label: 'Lire' }, { type: 'lists_setIndex', label: 'Modifier' }, { type: 'lists_length', label: 'Longueur' }],
    "Variables": [{ type: 'variables_set', label: 'Variable' }],
    "Interactions": [{ type: 'text_print', label: 'Afficher' }, { type: 'text_prompt_ext', label: 'Demander' }]
  };

  let displayedCategories = [];
  if (currentType === 'MAZE') displayedCategories = ['Mouvements', 'Logique'];
  else if (currentType === 'TURTLE') displayedCategories = ['Tortue', 'Logique', 'Mathématiques', 'Variables'];
  else displayedCategories = ['Mathématiques', 'Listes & Tableaux', 'Variables', 'Interactions', 'Logique'];

  const workspaceKey = `${levelData.id}-${currentType}-${codeMode}-${JSON.stringify(levelData.allowedBlocks || [])}`;
  const getTabStyle = (isActive) => ({ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: isActive ? 'white' : 'transparent', fontWeight: isActive ? 'bold' : 'normal', transition: 'all 0.2s' });
  const tabStyle = (isActive) => ({ padding: '10px 20px', cursor: 'pointer', border: 'none', borderBottom: isActive ? '3px solid #3498db' : '3px solid transparent', background: isActive ? '#f0f8ff' : 'transparent', fontWeight: isActive ? 'bold' : 'normal', color: isActive ? '#2980b9' : '#7f8c8d', fontSize: '0.95rem', transition: 'all 0.2s' });

  return (
    <div className="editor-wrapper" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <div style={{display: 'flex', gap: '20px', flex: 1, minHeight: '400px'}}>
        <div style={{flex: 2, display: 'flex', flexDirection: 'column'}}>
            <div style={{display: 'flex', marginBottom: '15px', background: '#ddd', padding: '5px', borderRadius: '8px'}}>
                <button onClick={() => handleTypeChange('MAZE')} style={getTabStyle(currentType === 'MAZE')}>🏰 Labyrinthe</button>
                <button onClick={() => handleTypeChange('TURTLE')} style={getTabStyle(currentType === 'TURTLE')}>🐢 Tortue</button>
                <button onClick={() => handleTypeChange('MATH')} style={getTabStyle(currentType === 'MATH')}>🧪 Labo Algo</button>
            </div>
            <div style={{flex: 1, background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ccc', overflowY: 'auto'}}>
                {currentType === 'MAZE' && <MazeEditor levelData={levelData} onUpdate={onUpdate} />}
                {currentType === 'TURTLE' && <TurtleEditor levelData={levelData} onUpdate={onUpdate} />}
                {currentType === 'MATH' && <MathEditor levelData={levelData} onUpdate={onUpdate} />}
            </div>
        </div>
        <div style={{flex: 1, background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflowY: 'auto'}}>
          <h3 style={{marginTop: 0}}>⚙️ Config {currentType}</h3>
          <div style={{marginBottom: '20px'}}>
              <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Consigne :</label>
              <textarea value={levelData.instruction || ""} onChange={(e) => onUpdate({ ...levelData, instruction: e.target.value })} style={{width: '100%', height: '100px', padding: '5px', fontFamily: 'monospace'}} placeholder="Markdown..." />
          </div>
          <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '15px 0'}} />
          <div style={{marginBottom: '20px'}}>
            <label style={{fontWeight: 'bold', display: 'block', marginBottom: '10px'}}>Blocs Autorisés :</label>
            {displayedCategories.map(catName => {
                const categoryBlocks = allCategories[catName] || [];
                const currentAllowed = levelData.allowedBlocks || [];
                const allChecked = categoryBlocks.every(b => currentAllowed.includes(b.type));
                const someChecked = categoryBlocks.some(b => currentAllowed.includes(b.type));
                const isIndeterminate = someChecked && !allChecked;
                return (
                  <div key={catName} style={{marginBottom: '15px', background:'#f9f9f9', padding:'10px', borderRadius:'6px'}}>
                    <div style={{fontSize: '0.9em', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', marginBottom:'8px', display:'flex', alignItems:'center', borderBottom:'1px solid #eee', paddingBottom:'5px'}}>
                        <input type="checkbox" checked={allChecked} ref={input => { if (input) input.indeterminate = isIndeterminate; }} onChange={() => toggleCategory(catName)} style={{marginRight: '8px', cursor: 'pointer'}} />
                        {catName}
                    </div>
                    {categoryBlocks.map(b => (
                      <div key={b.type} style={{marginLeft: '10px', marginBottom: '4px'}}>
                        <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize:'0.9rem'}}>
                          <input type="checkbox" checked={currentAllowed.includes(b.type)} onChange={() => toggleBlock(b.type)} style={{marginRight: '8px'}} />
                          {b.label}
                        </label>
                      </div>
                    ))}
                  </div>
                );
            })}
          </div>
        </div>
      </div>
      <div style={{height: '400px', marginTop: '20px', background: 'white', padding: '0', borderRadius: '8px', border: '1px solid #ccc', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
        <div style={{display: 'flex', background: '#ecf0f1', borderBottom: '1px solid #bdc3c7'}}>
            <button onClick={() => setCodeMode('START')} style={tabStyle(codeMode === 'START')}>🧩 Code de départ</button>
            <button onClick={() => setCodeMode('SOLUTION')} style={tabStyle(codeMode === 'SOLUTION')}>✅ Code Modèle / Calque</button>
        </div>
        <div style={{flex: 1, position: 'relative', background: codeMode === 'SOLUTION' ? '#f9fff9' : 'white'}}>
           <BlocklyWorkspace
              key={workspaceKey}
              className="blockly-div"
              toolboxConfiguration={editorToolbox}
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