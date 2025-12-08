import React, { useState, useEffect, useCallback, useMemo } from 'react';
import GameEngine from './GameEngine';
import CampaignMenu from './CampaignMenu';
import ScormService from '../../core/scorm/ScormService';

export default function Runner({ campaign, ltiConfig, isTeacherMode, onBackToBuilder, initialLevelIndex = -1 }) {
  
  // 1. Sécurité : Si pas de campagne, on attend
  if (!campaign) {
      return (
          <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-500 font-bold">
              ⏳ Chargement de la campagne...
          </div>
      );
  }

  // 2. Normalisation stable avec useMemo (évite les recalculs/erreurs à chaque rendu)
  const normalizedCampaign = useMemo(() => {
      console.log("📦 Chargement Campagne :", campaign);
      // Si c'est déjà une campagne (avec un tableau levels)
      if (campaign.levels && Array.isArray(campaign.levels)) {
          return campaign;
      }
      // Sinon c'est un niveau unique qu'on encapsule
      return { title: "Niveau Unique", levels: [campaign] };
  }, [campaign]);

  // 3. Gestion de l'index actif
  const [activeLevelIndex, setActiveLevelIndex] = useState(initialLevelIndex);

  // Sécurité : Si l'index demandé est hors limites (ex: 0 alors qu'il n'y a pas de niveaux), on revient au menu (-1)
  useEffect(() => {
      if (activeLevelIndex >= 0 && (!normalizedCampaign.levels || !normalizedCampaign.levels[activeLevelIndex])) {
          console.warn(`⚠️ Niveau ${activeLevelIndex} introuvable. Retour menu.`);
          setActiveLevelIndex(-1);
      }
  }, [activeLevelIndex, normalizedCampaign]);

  // --- PERSISTANCE ---
  const [progress, setProgress] = useState(() => {
    try {
        const saved = localStorage.getItem('blokaly_progress');
        return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  // --- SCORM ---
  useEffect(() => {
    if (!ltiConfig && !isTeacherMode) ScormService.init();
    return () => ScormService.terminate();
  }, [ltiConfig, isTeacherMode]);

  // --- LOGIQUE VICTOIRE ---
  const handleLevelWin = useCallback((stats) => {
    setProgress(prev => {
        const newProgress = { ...prev, [activeLevelIndex]: { stars: stats.stars } };
        localStorage.setItem('blokaly_progress', JSON.stringify(newProgress));

        // Calcul score global
        if (normalizedCampaign.levels) {
            const totalLevels = normalizedCampaign.levels.length;
            let totalStars = 0;
            Object.values(newProgress).forEach(p => totalStars += p.stars);
            const maxStars = totalLevels * 3;
            const scorePercent = maxStars > 0 ? (totalStars / maxStars) : 0;
            ScormService.setScore(scorePercent);
        }
        return newProgress;
    });
  }, [activeLevelIndex, normalizedCampaign]);

  const handleNextLevel = useCallback(() => {
      if (normalizedCampaign.levels && activeLevelIndex < normalizedCampaign.levels.length - 1) {
          setActiveLevelIndex(prev => prev + 1);
      } else {
          setActiveLevelIndex(-1);
      }
  }, [activeLevelIndex, normalizedCampaign]);

  const handleBackToMenu = () => setActiveLevelIndex(-1);

  // --- AFFICHAGE : MENU ---
  if (activeLevelIndex === -1) {
    return (
      <div className="min-h-screen bg-slate-100 font-sans">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shadow-md">
          {isTeacherMode ? (
              <button 
                onClick={onBackToBuilder} 
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-bold transition-colors flex items-center gap-2"
              >
                🛠️ Retour Atelier
              </button>
          ) : (
              <button 
                onClick={() => window.location.href = window.location.pathname} 
                className="text-slate-400 hover:text-white transition-colors font-bold"
              >
                🏠 Accueil
              </button>
          )}
          {ltiConfig && <span className="bg-emerald-600 px-2 py-1 rounded text-xs font-bold">Mode Noté (LTI)</span>}
        </div>
        
        <CampaignMenu campaign={normalizedCampaign} progress={progress} onSelectLevel={setActiveLevelIndex} />
      </div>
    );
  }
  

  // --- AFFICHAGE : JEU ---
  // Sécurité ultime : on vérifie que le niveau existe avant de le rendre
  const currentLevel = normalizedCampaign.levels ? normalizedCampaign.levels[activeLevelIndex] : null;

  if (!currentLevel) {
      return <div className="p-10 text-center text-red-500 font-bold">Erreur : Niveau introuvable ({activeLevelIndex})</div>;
  }

  return (
    <div className="h-screen flex flex-col font-sans bg-slate-50">
      <div className="h-14 bg-slate-900 text-white flex items-center justify-between px-6 shadow-md z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBackToMenu} 
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold"
          >
            <span>☰</span> Niveaux
          </button>

          {isTeacherMode && (
             <button 
                onClick={onBackToBuilder}
                className="bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/50 px-3 py-1 rounded text-xs font-bold transition-all ml-4"
             >
                🛠️ Sortir
             </button>
          )}

          <div className="h-4 w-px bg-slate-700 mx-2"></div>
          <span className="font-bold text-lg tracking-wide">
            Niveau {activeLevelIndex + 1}
          </span>
        </div>
        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
            {isTeacherMode ? "👀 Vue Élève (Test)" : (ltiConfig ? "🟢 Suivi Activé" : "Mode Entraînement")}
        </span>
      </div>
      
      <GameEngine
        key={activeLevelIndex} 
        levelData={currentLevel} 
        levelIndex={activeLevelIndex}
        onWin={handleLevelWin}
        onNextLevel={handleNextLevel} 
      />
    </div>
  );
}