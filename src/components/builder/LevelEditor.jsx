import React, { useEffect, useState, useRef } from 'react';
import MazeEditor from './editors/MazeEditor';
import MathEditor from './editors/MathEditor';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { MazePlugin } from '../../plugins/MazePlugin';
import { MathPlugin } from '../../plugins/MathPlugin';

export default function LevelEditor({ levelData, onUpdate }) {
  const workspaceRef = useRef(null);

  // --- 1. INIT DES BLOCS ---
  useEffect(() => {
    try {
        const dummyGenerator = { forBlock: {} };
        const B = Blockly.default || Blockly; 
        if (B) {
            MazePlugin.registerBlocks(B, dummyGenerator);
            MathPlugin.registerBlocks(B, dummyGenerator);
        }
    } catch(e) {
        console.error("Erreur init blocs éditeur", e);
    }
  }, []);

  const editorConfig = {
    scrollbars: true,
    trashcan: true,
    readOnly: false
  };
  
  const handleTypeChange = (newType) => {
    onUpdate({ 
        ...levelData, 
        type: newType,
        allowedBlocks: undefined 
    });
  };
  const currentType = levelData.type || 'MAZE';

  // --- 2. TOOLBOX ---
  let editorToolbox = '<xml></xml>';
  try {
    if (currentType === 'MATH') {
        editorToolbox = MathPlugin.getToolboxXML(
            levelData.allowedBlocks,
            levelData.inputs,
            levelData.hiddenVars,
            levelData.lockedVars
        );
    } else {
        editorToolbox = MazePlugin.getToolboxXML(levelData.allowedBlocks); 
    }
  } catch (e) {}

  useEffect(() => {
    if (workspaceRef.current) {
        workspaceRef.current.updateToolbox(editorToolbox);
    }
  }, [editorToolbox]);

  const handleInject = (newWorkspace) => {
    workspaceRef.current = newWorkspace;
  };

  // --- 3. CONFIGURATION DES CASES (INDIVIDUELLE) ---
  const toggleBlock = (blockType) => {
    // Pas de défauts imposés, on part de vide si nécessaire (Zéro Catalogue)
    const currentAllowed = levelData.allowedBlocks || [];
    
    let newAllowed;
    if (currentAllowed.includes(blockType)) {
      newAllowed = currentAllowed.filter(t => t !== blockType);
    } else {
      newAllowed = [...currentAllowed, blockType];
    }
    onUpdate({ ...levelData, allowedBlocks: newAllowed });
  };

  // --- 4. CONFIGURATION DES CASES (PAR CATÉGORIE) ---
  const toggleCategory = (catName) => {
    if (!allCategories[catName]) return;

    const categoryBlockTypes = allCategories[catName].map(b => b.type);
    const currentAllowed = levelData.allowedBlocks || [];

    // Vérifier si TOUS les blocs de cette catégorie sont déjà cochés
    const allChecked = categoryBlockTypes.every(type => currentAllowed.includes(type));

    let newAllowed;
    if (allChecked) {
      // Si tout est coché -> On décoche tout (on retire les blocs de la catégorie)
      newAllowed = currentAllowed.filter(type => !categoryBlockTypes.includes(type));
    } else {
      // Si pas tout coché -> On coche tout (on ajoute ceux qui manquent)
      const toAdd = categoryBlockTypes.filter(type => !currentAllowed.includes(type));
      newAllowed = [...currentAllowed, ...toAdd];
    }
    
    onUpdate({ ...levelData, allowedBlocks: newAllowed });
  };

  const allCategories = {
    "Mouvements": [
      { type: 'maze_move_forward', label: 'Avancer' },
      { type: 'maze_turn', label: 'Tourner' }
    ],
    "Logique": [
      { type: 'controls_repeat_ext', label: 'Boucles (Répéter)' },
      { type: 'controls_whileUntil', label: 'Répéter (Tant que)' },
      { type: 'controls_if', label: 'Si / Sinon' },
      { type: 'logic_compare', label: 'Comparaisons' },
      { type: 'logic_operation', label: 'Opérateurs (ET/OU)' }
    ],
    "Mathématiques": [
      { type: 'math_number', label: 'Nombre' },
      { type: 'math_arithmetic', label: 'Calculs (+ - * /)' },
      { type: 'math_modulo', label: 'Modulo' },
      { type: 'math_random_int', label: 'Aléatoire' }
    ],
    "Listes & Tableaux": [
      { type: 'lists_create_with', label: 'Créer une liste' },
      { type: 'lists_getIndex', label: 'Lire un élément' },
      { type: 'lists_setIndex', label: 'Modifier un élément' },
      { type: 'lists_length', label: 'Longueur de liste' }
    ],
    "Variables": [
      { type: 'variables_set', label: 'Définir une variable' }
    ],
    "Interactions": [
      { type: 'text_print', label: 'Afficher (Print)' },
      { type: 'text_prompt_ext', label: 'Demander (Input)' }
    ]
  };

  const displayedCategories = currentType === 'MAZE' 
    ? ['Mouvements', 'Logique'] 
    : ['Mathématiques', 'Listes & Tableaux', 'Variables', 'Interactions', 'Logique'];

  const workspaceKey = `${levelData.id}-${currentType}-${JSON.stringify(levelData.allowedBlocks || [])}-${JSON.stringify(levelData.inputs || {})}-${JSON.stringify(levelData.hiddenVars || [])}`;

  return (
    <div className="editor-wrapper" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      
      <div style={{display: 'flex', gap: '20px', flex: 1, minHeight: '400px'}}>
        
        {/* GAUCHE */}
        <div style={{flex: 2, display: 'flex', flexDirection: 'column'}}>
            <div style={{display: 'flex', marginBottom: '15px', background: '#ddd', padding: '5px', borderRadius: '8px'}}>
                <button onClick={() => handleTypeChange('MAZE')} style={{flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: currentType === 'MAZE' ? 'white' : 'transparent', fontWeight: currentType === 'MAZE' ? 'bold' : 'normal'}}>🏰 Labyrinthe</button>
                <button onClick={() => handleTypeChange('MATH')} style={{flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: currentType === 'MATH' ? 'white' : 'transparent', fontWeight: currentType === 'MATH' ? 'bold' : 'normal'}}>🧪 Labo Algo</button>
            </div>

            <div style={{flex: 1, background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ccc', overflowY: 'auto'}}>
                {currentType === 'MAZE' ? (
                    <MazeEditor levelData={levelData} onUpdate={onUpdate} />
                ) : (
                    <MathEditor levelData={levelData} onUpdate={onUpdate} />
                )}
            </div>
        </div>

        {/* DROITE */}
        <div style={{flex: 1, background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflowY: 'auto'}}>
          <h3 style={{marginTop: 0}}>⚙️ Config {currentType}</h3>
          
          <div style={{marginBottom: '20px'}}>
              <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Consigne :</label>
              <textarea 
                  value={levelData.instruction || ""}
                  onChange={(e) => onUpdate({ ...levelData, instruction: e.target.value })}
                  style={{width: '100%', height: '100px', padding: '5px', fontFamily: 'monospace'}}
                  placeholder="Markdown..."
              />
          </div>

          <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '15px 0'}} />

          <div style={{marginBottom: '20px'}}>
            <label style={{fontWeight: 'bold', display: 'block', marginBottom: '10px'}}>Blocs Autorisés :</label>
            
            {displayedCategories.map(catName => {
                // LOGIQUE D'AFFICHAGE DE LA CHECKBOX CATÉGORIE
                const categoryBlocks = allCategories[catName] || [];
                const currentAllowed = levelData.allowedBlocks || [];
                const catBlockTypes = categoryBlocks.map(b => b.type);
                
                // État : Tout coché, rien coché, ou mixte ?
                const allChecked = catBlockTypes.every(t => currentAllowed.includes(t));
                const someChecked = catBlockTypes.some(t => currentAllowed.includes(t));
                const isIndeterminate = someChecked && !allChecked;

                return (
                  <div key={catName} style={{marginBottom: '15px', background:'#f9f9f9', padding:'10px', borderRadius:'6px'}}>
                    
                    {/* TITRE DE CATÉGORIE AVEC CHECKBOX */}
                    <div style={{fontSize: '0.9em', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', marginBottom:'8px', display:'flex', alignItems:'center', borderBottom:'1px solid #eee', paddingBottom:'5px'}}>
                        <input 
                            type="checkbox" 
                            checked={allChecked}
                            ref={input => { if (input) input.indeterminate = isIndeterminate; }}
                            onChange={() => toggleCategory(catName)}
                            style={{marginRight: '8px', cursor: 'pointer'}}
                        />
                        {catName}
                    </div>

                    {/* LISTE DES BLOCS */}
                    {categoryBlocks.map(b => {
                        const isChecked = currentAllowed.includes(b.type);
                        return (
                          <div key={b.type} style={{marginLeft: '10px', marginBottom: '4px'}}>
                            <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize:'0.9rem'}}>
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => toggleBlock(b.type)}
                                style={{marginRight: '8px'}}
                              />
                              {b.label}
                            </label>
                          </div>
                        );
                    })}
                  </div>
                );
            })}
          </div>
        </div>
      </div>

      {/* BAS */}
      <div style={{height: '350px', marginTop: '20px', background: 'white', padding: '10px', borderRadius: '8px', border: '2px dashed #ccc', display: 'flex', flexDirection: 'column'}}>
        <h4 style={{margin: '0 0 5px 0', color: '#555'}}>🧩 Code de départ (Pré-rempli pour l'élève)</h4>
        <div style={{flex: 1, position: 'relative'}}>
           <BlocklyWorkspace
              key={workspaceKey}
              className="blockly-div"
              toolboxConfiguration={editorToolbox}
              workspaceConfiguration={editorConfig}
              initialXml={levelData.startBlocks || '<xml></xml>'}
              onXmlChange={(xml) => onUpdate({ ...levelData, startBlocks: xml })}
              onInject={handleInject}
           />
        </div>
      </div>

    </div>
  );
}