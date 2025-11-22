import React, { useState, useEffect, useCallback } from 'react';
import GameEngine from './GameEngine';
import CampaignMenu from './CampaignMenu';

export default function Runner({ campaign }) {
  const normalizedCampaign = campaign.levels ? campaign : { title: "Campagne", levels: [campaign] };
  const [activeLevelIndex, setActiveLevelIndex] = useState(-1);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    // Clé de sauvegarde basée sur le titre de la campagne
    const saveKey = `blokaly_save_${normalizedCampaign.title.replace(/\s/g, '_')}`;
    const saved = localStorage.getItem(saveKey);
    if (saved) {
      try { setProgress(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, [normalizedCampaign]);

  const handleLevelWin = useCallback((stats) => {
    setProgress(prev => {
        const newProgress = { ...prev, [activeLevelIndex]: { stars: stats.stars } };
        const saveKey = `blokaly_save_${normalizedCampaign.title.replace(/\s/g, '_')}`;
        localStorage.setItem(saveKey, JSON.stringify(newProgress));
        return newProgress;
    });
  }, [activeLevelIndex, normalizedCampaign.title]);

  const handleBackToMenu = () => setActiveLevelIndex(-1);

  // --- MENU ---
  if (activeLevelIndex === -1) {
    return (
      <div style={{minHeight: '100vh', background: '#ecf0f1'}}>
        <div style={{padding: '10px', background: '#333'}}>
          <button onClick={() => window.location.href = window.location.pathname} style={{color: 'white', background: 'none', border: 'none', cursor: 'pointer'}}>
            ⬅ Retour à l'éditeur
          </button>
        </div>
        <CampaignMenu campaign={normalizedCampaign} progress={progress} onSelectLevel={setActiveLevelIndex} />
      </div>
    );
  }

  // --- JEU ---
  return (
    <div style={{height: '100vh', display: 'flex', flexDirection: 'column'}}>
      <div style={{height: '40px', background: '#2c3e50', color: 'white', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <button onClick={handleBackToMenu} style={{background: '#e74c3c', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'}}>☰ Menu</button>
          
          {/* Ici on affiche le bon numéro dans le header */}
          <span style={{fontWeight: 'bold'}}>Niveau {activeLevelIndex + 1}</span>
        </div>
        <span style={{fontSize: '0.8rem', opacity: 0.7}}>Blokaly Runner</span>
      </div>
      
      <GameEngine
        key={activeLevelIndex}
        levelData={normalizedCampaign.levels[activeLevelIndex]} 
        // AJOUT ICI : On passe l'index pour l'affichage du titre interne
        levelIndex={activeLevelIndex}
        onWin={handleLevelWin} 
      />
    </div>
  );
}