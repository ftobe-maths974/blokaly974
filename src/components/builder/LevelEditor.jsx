import React, { useEffect } from 'react';
import MazeEditor from './editors/MazeEditor';
import MathEditor from './editors/MathEditor';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { MazePlugin } from '../../plugins/MazePlugin';

export default function LevelEditor({ levelData, onUpdate }) {
  
  // --- 1. INIT DES BLOCS POUR L'ÉDITEUR ---
  // On doit enregistrer les blocs dès le chargement du composant pour qu'ils apparaissent
  useEffect(() => {
    try {
        const dummyGenerator = { forBlock: {} };
        const B = Blockly.default || Blockly; 
        if (B) {
            MazePlugin.registerBlocks(B, dummyGenerator);
        }
    } catch(e) {
        console.error("Erreur init blocs éditeur", e);
    }
  }, []);

  // Configuration de l'espace Blockly "Code de départ"
  const editorConfig = {
    scrollbars: true,
    trashcan: true
  };
  
  // Récupération de la toolbox via le Plugin (pour être sûr d'avoir les bons blocs)
  let editorToolbox = '<xml></xml>';
  try {
    editorToolbox = MazePlugin.getToolboxXML(); 
  } catch (e) {}


  // --- 2. GESTION DU TYPE (ONGLETS) ---
  const handleTypeChange = (newType) => {
    onUpdate({ ...levelData, type: newType });
  };
  const currentType = levelData.type || 'MAZE';


  // --- 3. GESTION CONFIGURATION ---
  const toggleBlock = (blockType) => {
    const currentAllowed = levelData.allowedBlocks || ['maze_move_forward', 'maze_turn', 'controls_repeat_ext'];
    let newAllowed;
    if (currentAllowed.includes(blockType)) {
      newAllowed = currentAllowed.filter(t => t !== blockType);
    } else {
      newAllowed = [...currentAllowed, blockType];
    }
    onUpdate({ ...levelData, allowedBlocks: newAllowed });
  };

  // Catégories pour les checkboxes
  const blocksByCategory = {
    "Mouvements": [
      { type: 'maze_move_forward', label: 'Avancer' },
      { type: 'maze_turn', label: 'Tourner' }
    ],
    "Logique": [
      { type: 'controls_repeat_ext', label: 'Boucles' }
    ]
  };

  return (
    <div className="editor-wrapper" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      
      {/* HAUT : Onglets + Zone Visuelle + Config */}
      <div style={{display: 'flex', gap: '20px', flex: 1, minHeight: '400px'}}>
        
        {/* GAUCHE : VISUEL (Labyrinthe ou Math) */}
        <div style={{flex: 2, display: 'flex', flexDirection: 'column'}}>
            
            {/* ONGLETS */}
            <div style={{display: 'flex', marginBottom: '15px', background: '#ddd', padding: '5px', borderRadius: '8px'}}>
                <button 
                    onClick={() => handleTypeChange('MAZE')}
                    style={{flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: currentType === 'MAZE' ? 'white' : 'transparent', fontWeight: currentType === 'MAZE' ? 'bold' : 'normal'}}
                >
                    🏰 Labyrinthe
                </button>
                <button 
                    onClick={() => handleTypeChange('MATH')}
                    style={{flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: currentType === 'MATH' ? 'white' : 'transparent', fontWeight: currentType === 'MATH' ? 'bold' : 'normal'}}
                >
                    Fn Algo / Maths
                </button>
            </div>

            {/* CONTENU DE L'ÉDITEUR */}
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
          <h3 style={{marginTop: 0}}>⚙️ Config</h3>
          
          {/* Consigne */}
          <div style={{marginBottom: '20px'}}>
              <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Consigne :</label>
              <textarea 
                  value={levelData.instruction || ""}
                  onChange={(e) => onUpdate({ ...levelData, instruction: e.target.value })}
                  style={{width: '100%', height: '100px', padding: '5px', fontFamily: 'monospace'}}
                  placeholder="Markdown / LaTeX supporté..."
              />
          </div>

          <hr style={{border: 'none', borderTop: '1px solid #eee', margin: '15px 0'}} />

          {/* Sélection des blocs */}
          <div style={{marginBottom: '20px'}}>
            <label style={{fontWeight: 'bold', display: 'block', marginBottom: '10px'}}>Blocs Autorisés :</label>
            {Object.entries(blocksByCategory).map(([category, blocks]) => (
              <div key={category} style={{marginBottom: '10px'}}>
                <div style={{fontSize: '0.8em', color: '#888', fontWeight: 'bold', textTransform: 'uppercase'}}>{category}</div>
                {blocks.map(b => (
                  <div key={b.type} style={{marginLeft: '10px'}}>
                    <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center'}}>
                      <input 
                        type="checkbox" 
                        checked={(levelData.allowedBlocks || []).includes(b.type)}
                        onChange={() => toggleBlock(b.type)}
                        style={{marginRight: '8px'}}
                      />
                      {b.label}
                    </label>
                  </div>
                ))}
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