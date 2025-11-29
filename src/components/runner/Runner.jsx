import React, { useState, useEffect, useCallback } from 'react';
import GameEngine from './GameEngine';
import CampaignMenu from './CampaignMenu';
import ScormService from '../../core/scorm/ScormService';

export default function Runner({ campaign, ltiConfig, isTeacherMode }) {
  // Normalisation : Si c'est un niveau seul, on en fait une campagne d'un niveau
  const normalizedCampaign = campaign.levels ? campaign : { title: "Campagne", levels: [campaign] };
  const [activeLevelIndex, setActiveLevelIndex] = useState(-1);
  const [progress, setProgress] = useState({});

  // --- INITIALISATION SCORM ---
  useEffect(() => {
    // On tente de se connecter au SCORM au montage du Runner
    // (Seulement si on n'est pas déjà en LTI ou mode prof)
    if (!ltiConfig && !isTeacherMode) {
        ScormService.init();
    }
    
    // Nettoyage quand on quitte
    return () => ScormService.terminate();
  }, [ltiConfig, isTeacherMode]);

  const handleLevelWin = useCallback((stats) => {
    setProgress(prev => {
        const newProgress = { ...prev, [activeLevelIndex]: { stars: stats.stars } };
        // ... (Sauvegarde localStorage inchangée) ...

        // --- CALCUL DU SCORE GLOBAL ---
        const totalLevels = normalizedCampaign.levels.length;
        let totalStars = 0;
        Object.values(newProgress).forEach(p => totalStars += p.stars);
        const maxStars = totalLevels * 3;
        const scorePercent = maxStars > 0 ? (totalStars / maxStars) : 0;

        // 1. ENVOI LTI (Si actif)
        if (ltiConfig && ltiConfig.apiUrl) {
             // ... (Code LTI existant)
        }

        // 2. ENVOI SCORM (Si actif)
        // Le service vérifie lui-même s'il est connecté, donc on peut l'appeler sans crainte
        ScormService.setScore(scorePercent);

        return newProgress;
    });
  }, [activeLevelIndex, normalizedCampaign, ltiConfig]);

  const handleBackToMenu = () => setActiveLevelIndex(-1);

  // --- AFFICHAGE MENU ---
  if (activeLevelIndex === -1) {
    return (
      <div style={{minHeight: '100vh', background: '#ecf0f1'}}>
        <div style={{padding: '10px', background: '#333', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          
          {/* CONDITION : Seul le prof en mode preview voit ce bouton */}
          {isTeacherMode ? (
              <button onClick={() => window.location.href = window.location.pathname} style={{color: 'white', background: '#e74c3c', border: 'none', padding:'5px 10px', borderRadius:'4px', cursor: 'pointer', fontWeight:'bold'}}>
                ⬅ Retour Éditeur
              </button>
          ) : (
              // Pour l'élève/LTI, on met un simple titre ou rien
              <span style={{fontWeight:'bold', color:'#aaa'}}>Blokaly 974</span>
          )}

          {ltiConfig && <span style={{fontSize:'0.8rem', background:'#27ae60', padding:'2px 8px', borderRadius:'4px'}}>Mode Noté (LTI)</span>}
        </div>
        <CampaignMenu campaign={normalizedCampaign} progress={progress} onSelectLevel={setActiveLevelIndex} />
      </div>
    );
  }

  // --- AFFICHAGE JEU ---
  return (
    <div style={{height: '100vh', display: 'flex', flexDirection: 'column'}}>
      <div style={{height: '40px', background: '#2c3e50', color: 'white', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <button onClick={handleBackToMenu} style={{background: '#e74c3c', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'}}>☰ Menu</button>
          <span style={{fontWeight: 'bold'}}>Niveau {activeLevelIndex + 1}</span>
        </div>
        <span style={{fontSize: '0.8rem', opacity: 0.7}}>
            {ltiConfig ? "🟢 Suivi Activé" : "Blokaly Runner"}
        </span>
      </div>
      
      <GameEngine
        key={activeLevelIndex}
        levelData={normalizedCampaign.levels[activeLevelIndex]} 
        levelIndex={activeLevelIndex}
        onWin={handleLevelWin} 
      />
    </div>
  );
}