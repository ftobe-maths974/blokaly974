import React, { useState, useEffect, useCallback } from 'react'; // <--- Ajout de useCallback
import GameEngine from './GameEngine';
import CampaignMenu from './CampaignMenu';

export default function Runner({ campaign }) {
  // Normalisation des données de campagne
  const normalizedCampaign = campaign.levels ? campaign : { title: "Campagne", levels: [campaign] };

  const [activeLevelIndex, setActiveLevelIndex] = useState(-1);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    const saveKey = `blokaly_save_${normalizedCampaign.title.replace(/\s/g, '_')}`;
    const saved = localStorage.getItem(saveKey);
    if (saved) {
      try {
        setProgress(JSON.parse(saved));
      } catch (e) { console.error("Erreur chargement save", e); }
    }
  }, [normalizedCampaign]);

  // --- CORRECTION ICI : useCallback pour stabiliser la fonction ---
  const handleLevelWin = useCallback((stats) => {
    // 1. On utilise la version fonctionnelle de setProgress pour éviter les dépendances cycliques
    setProgress(prevProgress => {
        const newProgress = { 
          ...prevProgress, 
          [activeLevelIndex]: { stars: stats.stars } 
        };
        
        // 2. Sauvegarde (Effet de bord)
        const saveKey = `blokaly_save_${normalizedCampaign.title.replace(/\s/g, '_')}`;
        localStorage.setItem(saveKey, JSON.stringify(newProgress));
        
        return newProgress;
    });
  }, [activeLevelIndex, normalizedCampaign.title]); // Dépendances minimales

  const handleBackToMenu = () => {
    setActiveLevelIndex(-1);
  };

  // --- RENDU ---

  if (activeLevelIndex === -1) {
    return (
      <div style={{minHeight: '100vh', background: '#ecf0f1'}}>
        <div style={{padding: '10px', background: '#333'}}>
          <button onClick={() => window.location.href = '/'} style={{color: 'white', background: 'none', border: 'none', cursor: 'pointer'}}>
            ⬅ Retour à l'éditeur
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

  return (
    <div style={{height: '100vh', display: 'flex', flexDirection: 'column'}}>
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
        onWin={handleLevelWin} // Cette fonction est maintenant stable !
      />
    </div>
  );
}