import React, { useState, useEffect, useCallback } from 'react';
import GameEngine from './GameEngine';
import CampaignMenu from './CampaignMenu';
import ScormService from '../../core/scorm/ScormService';

export default function Runner({ campaign, ltiConfig, isTeacherMode }) {
  // Normalisation
  const normalizedCampaign = campaign.levels ? campaign : { title: "Campagne", levels: [campaign] };
  
  const [activeLevelIndex, setActiveLevelIndex] = useState(-1);
  
  // --- 1. CHARGEMENT PERSISTANCE ---
  const [progress, setProgress] = useState(() => {
    // On essaie de récupérer la sauvegarde locale
    const saved = localStorage.getItem('blokaly_progress');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error("Erreur lecture sauvegarde", e); }
    }
    return {};
  });

  // --- INITIALISATION SCORM ---
  useEffect(() => {
    if (!ltiConfig && !isTeacherMode) {
        ScormService.init();
    }
    return () => ScormService.terminate();
  }, [ltiConfig, isTeacherMode]);

  const handleLevelWin = useCallback((stats) => {
    setProgress(prev => {
        const newProgress = { ...prev, [activeLevelIndex]: { stars: stats.stars } };
        
        // --- 2. SAUVEGARDE PERSISTANCE ---
        localStorage.setItem('blokaly_progress', JSON.stringify(newProgress));

        // --- CALCUL DU SCORE GLOBAL ---
        const totalLevels = normalizedCampaign.levels.length;
        let totalStars = 0;
        Object.values(newProgress).forEach(p => totalStars += p.stars);
        const maxStars = totalLevels * 3;
        const scorePercent = maxStars > 0 ? (totalStars / maxStars) : 0;

        // SCORM
        ScormService.setScore(scorePercent);

        return newProgress;
    });
  }, [activeLevelIndex, normalizedCampaign]);

  // --- 3. LOGIQUE NIVEAU SUIVANT ---
  const handleNextLevel = useCallback(() => {
      if (activeLevelIndex < normalizedCampaign.levels.length - 1) {
          setActiveLevelIndex(prev => prev + 1);
      } else {
          // Fin de campagne : retour au menu
          setActiveLevelIndex(-1);
      }
  }, [activeLevelIndex, normalizedCampaign]);

  const handleBackToMenu = () => setActiveLevelIndex(-1);

  // --- AFFICHAGE MENU ---
  if (activeLevelIndex === -1) {
    return (
      <div className="min-h-screen bg-slate-100 font-sans">
        {/* Header Menu */}
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shadow-md">
          {isTeacherMode ? (
              <button 
                onClick={() => window.location.href = window.location.pathname} 
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-bold transition-colors"
              >
                ⬅ Retour Éditeur
              </button>
          ) : (
              <span className="font-bold text-slate-400">Blokaly 974</span>
          )}
          {ltiConfig && <span className="bg-emerald-600 px-2 py-1 rounded text-xs font-bold">Mode Noté (LTI)</span>}
        </div>
        
        <CampaignMenu campaign={normalizedCampaign} progress={progress} onSelectLevel={setActiveLevelIndex} />
      </div>
    );
  }

  // --- AFFICHAGE JEU ---
  return (
    <div className="h-screen flex flex-col font-sans bg-slate-50">
      {/* Header Jeu */}
      <div className="h-14 bg-slate-900 text-white flex items-center justify-between px-6 shadow-md z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBackToMenu} 
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold"
          >
            <span>☰</span> Menu
          </button>
          <div className="h-4 w-px bg-slate-700 mx-2"></div>
          <span className="font-bold text-lg tracking-wide">
            Niveau {activeLevelIndex + 1}
          </span>
        </div>
        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
            {ltiConfig ? "🟢 Suivi Activé" : "Mode Entraînement"}
        </span>
      </div>
      
      <GameEngine
        key={activeLevelIndex} // Force le reset complet quand le niveau change
        levelData={normalizedCampaign.levels[activeLevelIndex]} 
        levelIndex={activeLevelIndex}
        onWin={handleLevelWin}
        onNextLevel={handleNextLevel} // <--- ON PASSE LA FONCTION ICI
      />
    </div>
  );
}