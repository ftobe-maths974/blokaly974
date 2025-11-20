import React, { useEffect, useState } from 'react';
import MazeEditor from './editors/MazeEditor';
import MathEditor from './editors/MathEditor';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { MazePlugin } from '../../plugins/MazePlugin';
import { MathPlugin } from '../../plugins/MathPlugin';

export default function LevelEditor({ levelData, onUpdate }) {
  
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
    readOnly: false // Important : on doit pouvoir glisser les blocs
  };
  
  // --- 2. GESTION DU TYPE ---
  const handleTypeChange = (newType) => {
    // Quand on change de type, on reset les blocs autorisés pour éviter les incohérences
    onUpdate({ 
        ...levelData, 
        type: newType,
        allowedBlocks: undefined // On force le reset aux valeurs par défaut du nouveau mode
    });
  };
  const currentType = levelData.type || 'MAZE';

  // --- 3. CALCUL DE LA TOOLBOX (XML) ---
  let editorToolbox = '<xml></xml>';
  try {
    // On passe explicitement allowedBlocks. Si undefined, le plugin mettra les défauts.
    if (currentType === 'MATH') {
        editorToolbox = MathPlugin.getToolboxXML(levelData.allowedBlocks);
    } else {
        editorToolbox = MazePlugin.getToolboxXML(levelData.allowedBlocks); 
    }
  } catch (e) {}


  // --- 4. CONFIGURATION DES CASES À COCHER ---
  const toggleBlock = (blockType) => {
    // Définition des défauts si la liste est vide
    const defaults = currentType === 'MATH' 
        ? ['math_number', 'math_arithmetic', 'variables_set'] 
        : ['maze_move_forward', 'maze_turn', 'controls_repeat_ext'];

    const currentAllowed = levelData.allowedBlocks || defaults;
    
    let newAllowed;
    if (currentAllowed.includes(blockType)) {
      newAllowed = currentAllowed.filter(t => t !== blockType);
    } else {
      newAllowed = [...currentAllowed, blockType];
    }
    onUpdate({ ...levelData, allowedBlocks: newAllowed });
  };

  // Organisation visuelle des catégories
  const allCategories = {
    "Mouvements": [
      { type: 'maze_move_forward', label: 'Avancer' },
      { type: 'maze_turn', label: 'Tourner' }
    ],
    "Logique": [
      { type: 'controls_repeat_ext', label: 'Boucles (Répéter)' }
    ],
    "Mathématiques": [
      { type: 'math_number', label: 'Nombre' },
      { type: 'math_arithmetic', label: 'Calculs (+ - * /)' }
    ],
    "Variables": [
      { type: 'variables_set', label: 'Définir une variable' }
    ]
  };

  const displayedCategories = currentType === 'MAZE' 
    ? ['Mouvements', 'Logique'] 
    : ['Mathématiques', 'Variables', 'Logique'];

  // --- 5. CORRECTION CRITIQUE : La Clé Unique ---
  // Cette clé force React à détruire et recréer l'éditeur Blockly 
  // à chaque fois qu'on change une option. C'est radical mais ça évite 100% des bugs.
  // On utilise JSON.stringify pour détecter tout changement dans la liste des blocs.
  const workspaceKey = `${currentType}-${JSON.stringify(levelData.allowedBlocks || [])}`;

  return (
    <div className="editor-wrapper" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      
      <div style={{display: 'flex', gap: '20px', flex: 1, minHeight: '400px'}}>
        
        {/* GAUCHE : VISUEL */}
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

        {/* DROITE : CONFIGURATION */}
        <div style={{flex: 1, background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflowY: 'auto'}}>
          <h3 style={{marginTop: 0}}>⚙️ Config {currentType}</h3>
          
          <div style={{marginBottom: '20px'}}>
              <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Consigne :</label>
              <textarea 
                  value={levelData.instruction || ""} // Correction bug null value
                  onChange={(e) => onUpdate({ ...levelData, instruction: e.target.value })}
                  style={{width: '100%', height: '100px', padding: '5px', fontFamily: 'monospace'}}
                  placeholder="Markdown..."
              />
          </div>

          <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '15px 0'}} />

          <div style={{marginBottom: '20px'}}>
            <label style={{fontWeight: 'bold', display: 'block', marginBottom: '10px'}}>Blocs Autorisés :</label>
            {displayedCategories.map(catName => (
              <div key={catName} style={{marginBottom: '10px'}}>
                <div style={{fontSize: '0.8em', color: '#888', fontWeight: 'bold', textTransform: 'uppercase'}}>{catName}</div>
                {allCategories[catName] && allCategories[catName].map(b => {
                    // Vérification sécurisée de l'état coché
                    const currentList = levelData.allowedBlocks || 
                        (currentType === 'MATH' ? ['math_number', 'math_arithmetic', 'variables_set'] : ['maze_move_forward', 'maze_turn', 'controls_repeat_ext']);
                    
                    const isChecked = currentList.includes(b.type);

                    return (
                      <div key={b.type} style={{marginLeft: '10px'}}>
                        <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center'}}>
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
            ))}
          </div>
        </div>
      </div>

      {/* BAS : CODE DE DÉPART */}
      <div style={{height: '350px', marginTop: '20px', background: 'white', padding: '10px', borderRadius: '8px', border: '2px dashed #ccc', display: 'flex', flexDirection: 'column'}}>
        <h4 style={{margin: '0 0 5px 0', color: '#555'}}>🧩 Code de départ (Pré-rempli pour l'élève)</h4>
        <div style={{flex: 1, position: 'relative'}}>
           <BlocklyWorkspace
              key={workspaceKey} // <--- LA SOLUTION MAGIQUE EST ICI
              className="blockly-div"
              toolboxConfiguration={editorToolbox}
              workspaceConfiguration={editorConfig}
              initialXml={levelData.startBlocks || '<xml></xml>'}
              onXmlChange={(xml) => onUpdate({ ...levelData, startBlocks: xml })}
           />
        </div>
      </div>

    </div>
  );
}