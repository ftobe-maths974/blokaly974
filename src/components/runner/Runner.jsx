import React, { useState, useEffect } from 'react';
import GameEngine from './GameEngine';
import CampaignMenu from './CampaignMenu';

export default function Runner({ campaign }) {
  // Si 'campaign' n'a pas de champ 'levels' (vieux format), on le normalise
  const normalizedCampaign = campaign.levels ? campaign : { title: "Campagne", levels: [campaign] };

  // Index du niveau en cours (-1 = Menu)
  const [activeLevelIndex, setActiveLevelIndex] = useState(-1);
  
  // Progression (Lecture depuis LocalStorage)
  const [progress, setProgress] = useState({});

  useEffect(() => {
    // Charger la progression unique pour cette campagne (basée sur le titre ou un ID si on en avait un)
    const saveKey = `blokaly_save_${normalizedCampaign.title.replace(/\s/g, '_')}`;
    const saved = localStorage.getItem(saveKey);
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  }, [normalizedCampaign]);

  const handleLevelWin = (stats) => {
    // 1. Mettre à jour la progression
    const newProgress = { 
      ...progress, 
      [activeLevelIndex]: { stars: stats.stars } 
    };
    setProgress(newProgress);
    
    // 2. Sauvegarder
    const saveKey = `blokaly_save_${normalizedCampaign.title.replace(/\s/g, '_')}`;
    localStorage.setItem(saveKey, JSON.stringify(newProgress));
  };

  const handleBackToMenu = () => {
    setActiveLevelIndex(-1);
  };

  // --- RENDU ---

  // Cas 1 : Afficher le Menu
  if (activeLevelIndex === -1) {
    return (
      <div style={{minHeight: '100vh', background: '#ecf0f1'}}>
        <div style={{padding: '10px', background: '#333'}}>
          <button onClick={() => window.location.href = '/'} style={{color: 'white', background: 'none', border: 'none', cursor: 'pointer'}}>
            ⬅ Retour à l'éditeur (Reset URL)
          </button>
        </div>
        <CampaignMenu 
          campaign={normalizedCampaign} 
          progress={progress} 
          onSelectLevel={setActiveLevelIndex} 
        />
      </div>
    );
  }

  // Cas 2 : Afficher le Jeu
  return (
    <div style={{height: '100vh', display: 'flex', flexDirection: 'column'}}>
      {/* Header du Jeu */}
      <div style={{height: '40px', background: '#2c3e50', color: 'white', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <button onClick={handleBackToMenu} style={{background: '#e74c3c', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'}}>
             ☰ Menu
          </button>
          <span style={{fontWeight: 'bold'}}>Niveau {activeLevelIndex + 1}</span>
        </div>
        <span style={{fontSize: '0.8rem', opacity: 0.7}}>Blokaly Runner</span>
      </div>
      
      <GameEngine
        key={activeLevelIndex}
        levelData={normalizedCampaign.levels[activeLevelIndex]} 
        onWin={handleLevelWin} // Callback quand l'élève gagne
      />
    </div>
  );
}
