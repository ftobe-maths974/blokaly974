import React from 'react';
import { getPlugin } from '../../core/PluginRegistry';
import BlocklyRunner from './BlocklyRunner';

// Le GameEngine ne sert plus qu'à choisir le bon moteur d'exécution
export default function GameEngine({ levelData, onWin, onNextLevel, ...props }) {
  const currentType = levelData.type || 'MAZE';
  const plugin = getPlugin(currentType);

  if (!plugin) {
    return <div className="p-10 text-center">❌ Erreur : Plugin "{currentType}" introuvable.</div>;
  }

  // --- CAS 1 : Moteur Spécifique (ex: IFRAME, et bientôt PHASER) ---
  // Si le plugin déclare être autonome via "isFullscreen" ou si c'est explicitement IFRAME
  if (plugin.id === 'IFRAME' || plugin.isFullscreen) {
      // On récupère le composant visuel défini dans le plugin (ex: IframeRunner)
      const CustomRunner = plugin.RenderComponent;
      
      return (
        <CustomRunner 
            levelData={levelData} 
            onWin={onWin} 
            onNextLevel={onNextLevel} 
            {...props} 
        />
      );
  }

  // --- CAS 2 : Moteur Standard (Blockly) ---
  // C'est le cas par défaut pour Maze, Turtle, Math, Equation
  return (
    <BlocklyRunner 
        levelData={levelData} 
        plugin={plugin} 
        onWin={onWin} 
        onNextLevel={onNextLevel}
        {...props} 
    />
  );
}