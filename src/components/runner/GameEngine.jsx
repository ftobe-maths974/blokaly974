import React, { useState } from 'react';
import { getPlugin } from '../../core/PluginRegistry';
import InstructionPanel from './InstructionPanel';
import BlocklyRunner from './BlocklyRunner';

// Ce composant est maintenant un "Router" de moteurs de jeu
export default function GameEngine({ levelData, onWin, levelIndex, onNextLevel }) {
  const plugin = getPlugin(levelData?.type);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  if (!plugin) return <div className="p-10 text-red-500 font-bold">🚫 Plugin introuvable : {levelData?.type}</div>;

  // Calcul du titre pour le panneau de consigne
  const displayTitle = levelIndex !== undefined 
    ? `Niveau ${levelIndex + 1}` 
    : (typeof levelData.id === 'number' && levelData.id < 1000000 ? `Niveau ${levelData.id}` : "Niveau Test");

  // SELECTION DU RUNNER
  // Par défaut, on utilise BlocklyRunner.
  // Plus tard, on pourra faire : if (plugin.runnerMode === 'IFRAME') return <IframeRunner ... />
  let RunnerComponent = BlocklyRunner;

  // Exemple futur (préparation) :
  // if (plugin.config?.runnerMode === 'IFRAME') RunnerComponent = IframeRunner;

  return (
    <div style={{display: 'flex', height: '100%', flexDirection: 'row', overflow: 'hidden'}}>
      
     return (
      {/* ... InstructionPanel ... */}

      <div style={{flex: 1, minWidth: 0, height: '100%', position: 'relative'}}>
        <RunnerComponent 
            levelData={levelData} 
            plugin={plugin} 
            savedCode={savedCode}          // 👈 Transmis
            onCodeChange={onCodeChange}    // 👈 Transmis
            onWin={onWin} 
            onNextLevel={onNextLevel} 
        />
      </div>

      {/* 2. Le Moteur Spécifique (Blockly, Iframe, etc.) */}
      <div style={{flex: 1, minWidth: 0, height: '100%', position: 'relative'}}>
        <RunnerComponent 
            levelData={levelData} 
            plugin={plugin} 
            onWin={onWin} 
            onNextLevel={onNextLevel} 
        />
      </div>

      <div style={{flex: 1, minWidth: 0, height: '100%', position: 'relative'}}>
        <RunnerComponent 
            levelData={levelData} 
            plugin={plugin} 
            savedCode={savedCode}          // 👈 Transmis
            onCodeChange={onCodeChange}    // 👈 Transmis
            onWin={onWin} 
            onNextLevel={onNextLevel} 
        />
      </div>

    </div>
  );
}