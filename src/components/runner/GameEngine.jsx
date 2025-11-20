import React, { useState, useRef, useEffect } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import MazeRender from './MazeRender';
import { MAZE_CONFIG } from '../../core/adapters/MazeAdapter';
import FeedbackModal from './FeedbackModal';
import { generateProofToken } from '../../core/validation';

// --- DÉFINITION DES BLOCS ---
const registerBlock = (name, definition, generator) => {
  if (!Blockly.Blocks[name]) {
    Blockly.Blocks[name] = {
      init: function() { this.jsonInit(definition); }
    };
  }
  javascriptGenerator.forBlock[name] = generator;
};

// Avancer
registerBlock('maze_move_forward', 
  {
    "message0": "Avancer ⬆️",
    "previousStatement": null,
    "nextStatement": null,
    "colour": 160,
    "tooltip": "Avance d'une case"
  },
  function(block) { return 'actions.push("MOVE");\n'; }
);

// Tourner
registerBlock('maze_turn',
  {
    "message0": "Tourner %1 ↪️",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "DIR",
        "options": [["à gauche ↺", "LEFT"], ["à droite ↻", "RIGHT"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 160
  },
  function(block) {
    const dir = block.getFieldValue('DIR');
    return `actions.push("TURN_${dir}");\n`;
  }
);

// --- CONFIGURATION ---
const workspaceConfig = {
  // toolbox: ... ON LE RETIRE D'ICI CAR ON LE GÈRE DYNAMIQUEMENT
  collapse: true,
  comments: true,
  disable: true,
  maxBlocks: Infinity,
  trashcan: true,
  horizontalLayout: false,
  toolboxPosition: 'start',
  css: true,
  media: 'https://blockly-demo.appspot.com/static/media/',
  rtl: false,
  scrollbars: true, 
  oneBasedIndex: true,
};

export default function GameEngine({ levelData, onWin }) {
  
  const safeData = levelData || { grid: MAZE_CONFIG.defaultGrid, startPos: {x:0, y:1} };
  
  const [grid, setGrid] = useState(safeData.grid);
  const [playerPos, setPlayerPos] = useState(safeData.startPos || {x: 0, y: 1});
  const [playerDir, setPlayerDir] = useState(1);
  const [xml, setXml] = useState("");
  const [gameState, setGameState] = useState('IDLE');
  const [showModal, setShowModal] = useState(false);
  const [gameStats, setGameStats] = useState({ stars: 0, blockCount: 0, target: 0 });
  const [proofToken, setProofToken] = useState("");

  const executionRef = useRef(null);
  const workspaceRef = useRef(null);

  // 1. Génération XML dynamique
  const getToolboxXML = () => {
    const allowed = safeData.allowedBlocks || ['maze_move_forward', 'maze_turn', 'controls_repeat_ext'];
    
    let xmlString = '<xml id="toolbox" style="display: none">';
    
    // Catégorie Actions
    if (allowed.includes('maze_move_forward') || allowed.includes('maze_turn')) {
      xmlString += '<category name="🏃 Actions" colour="120">';
      if (allowed.includes('maze_move_forward')) {
        xmlString += '<block type="maze_move_forward"></block>';
      }
      if (allowed.includes('maze_turn')) {
        xmlString += '<block type="maze_turn"><field name="DIR">LEFT</field></block>';
        xmlString += '<block type="maze_turn"><field name="DIR">RIGHT</field></block>';
      }
      xmlString += '</category>';
    }

    // Catégorie Boucles
    if (allowed.includes('controls_repeat_ext')) {
      xmlString += '<category name="🔄 Boucles" colour="210">';
      xmlString += '<block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">5</field></shadow></value></block>';
      xmlString += '</category>';
    }

    xmlString += '</xml>';
    return xmlString;
  };

  // 2. HandleInject
  const handleInject = (newWorkspace) => {
    workspaceRef.current = newWorkspace;
    javascriptGenerator.init(newWorkspace); 
    newWorkspace.updateToolbox(getToolboxXML());
  };

  // 3. useEffect
  useEffect(() => {
    if (workspaceRef.current) {
      workspaceRef.current.updateToolbox(getToolboxXML());
    }
  }, [safeData]); 
  

  const runCode = () => {
    if (!workspaceRef.current) return;
    setGameState('RUNNING');
    
    let currentX = safeData.startPos ? safeData.startPos.x : 0;
    let currentY = safeData.startPos ? safeData.startPos.y : 1;
    let currentDir = 1;
    setPlayerPos({x: currentX, y: currentY});
    setPlayerDir(currentDir);

    javascriptGenerator.init(workspaceRef.current);
    let code = javascriptGenerator.workspaceToCode(workspaceRef.current);
    
    const actions = [];
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('actions', code);
      fn(actions);
    } catch (e) {
      alert("Erreur : " + e.message);
      setGameState('IDLE');
      return;
    }

    let step = 0;
    const playStep = () => {
      if (step >= actions.length) {
        setGameState('IDLE');
        return;
      }

      const action = actions[step];
      step++;

      if (action === 'MOVE') {
        let nextX = currentX;
        let nextY = currentY;
        
        if (currentDir === 0) nextY--; 
        if (currentDir === 1) nextX++; 
        if (currentDir === 2) nextY++; 
        if (currentDir === 3) nextX--; 

        const status = MAZE_CONFIG.checkMove(grid, nextX, nextY);
        
        if (status === 'OK' || status === 'WIN') {
          currentX = nextX;
          currentY = nextY;
          setPlayerPos({x: currentX, y: currentY});
          
          if (status === 'WIN') {
            setGameState('WON');

            const currentBlocks = workspaceRef.current.getAllBlocks(false).length;
            const targetBlocks = safeData.maxBlocks || 5; 

            let stars = 1;
            if (currentBlocks <= targetBlocks) stars = 3;
            else if (currentBlocks <= targetBlocks + 2) stars = 2;

            setGameStats({ stars, blockCount: currentBlocks, target: targetBlocks });
            
            if (onWin) onWin({ stars, blockCount: currentBlocks });
            
            const token = generateProofToken(1, { stars, blocks: currentBlocks });
            setProofToken(token);

            setTimeout(() => setShowModal(true), 500);
            return; 
          }
        } else {
          setGameState('LOST');
          return;
        }
      } 
      else if (action.startsWith('TURN_')) {
        const side = action.split('_')[1];
        if (side === 'LEFT') currentDir = (currentDir + 3) % 4;
        else currentDir = (currentDir + 1) % 4;
        setPlayerDir(currentDir);
      }
      executionRef.current = setTimeout(playStep, 500);
    };
    playStep();
  };

  const handleReset = () => {
    if (executionRef.current) clearTimeout(executionRef.current);
    setGameState('IDLE');
    setPlayerPos(safeData.startPos || {x:0, y:1});
    setPlayerDir(1);
  }

  // --- C'EST ICI QUE CA SE PASSE ---
  // On calcule le XML pour l'affichage initial
  const currentToolbox = getToolboxXML();

  return (
    <div style={{display: 'flex', height: '100%', flexDirection: 'column'}}>
      <div style={{padding: '10px', background: '#eee', display: 'flex', gap: '10px', borderBottom:'1px solid #ccc'}}>
        <button onClick={runCode} disabled={gameState === 'RUNNING'} style={{padding: '8px 16px', background: '#27ae60', color: 'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>
          ▶️ Exécuter
        </button>
        <button onClick={handleReset} style={{padding: '8px 16px', background: '#e74c3c', color: 'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>
          🔄 Reset
        </button>
      </div>

      <div style={{display: 'flex', flex: 1, overflow: 'hidden'}}>
        <div className="blocklyContainer" style={{width: '60%', height: '100%', position: 'relative'}}>
          <BlocklyWorkspace
            className="blockly-div"
            toolboxConfiguration={currentToolbox} // <--- ICI : On utilise la variable calculée
            initialXml={xml}
            onXmlChange={setXml}
            workspaceConfiguration={workspaceConfig}
            onInject={handleInject}
          />
        </div>
      
        <div style={{width: '40%', background: '#2c3e50', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <MazeRender 
            grid={grid} 
            playerPos={playerPos} 
            playerDir={playerDir} 
          />
        </div>
        <FeedbackModal 
          isOpen={showModal} 
          stats={gameStats} 
          token={proofToken}
          onReplay={() => {
            setShowModal(false);
            handleReset();
          }}
          onMenu={() => window.location.reload()}
        />
      </div>
    </div>
  );
}
