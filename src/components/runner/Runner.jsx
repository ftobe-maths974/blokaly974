// 📄 src/components/runner/Runner.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import GameEngine from './GameEngine';
import CampaignMenu from './CampaignMenu';
import CampaignNavBar from './CampaignNavBar'; // 👈 IMPORT
import ScormService from '../../core/scorm/ScormService';

export default function Runner({ campaign, ltiConfig, isTeacherMode, onBackToBuilder, initialLevelIndex = -1 }) {
  
  if (!campaign) return <div className="flex items-center justify-center h-screen">⏳ Chargement...</div>;

  const normalizedCampaign = useMemo(() => {
      if (campaign.levels && Array.isArray(campaign.levels)) return campaign;
      return { title: "Niveau Unique", levels: [campaign] };
  }, [campaign]);

  const [activeLevelIndex, setActiveLevelIndex] = useState(initialLevelIndex);

  // --- PERSISTANCE ---
  const [progress, setProgress] = useState(() => {
    try {
        const saved = localStorage.getItem('blokaly_progress');
        return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  // Sauvegarde unifiée (Score ou Code)
  const saveProgress = useCallback((levelIdx, data) => {
      setProgress(prev => {
          const prevLevelData = prev[levelIdx] || {};
          const newLevelData = { ...prevLevelData, ...data };
          
          // On garde le meilleur score d'étoiles
          if (data.stars !== undefined) {
              newLevelData.stars = Math.max(prevLevelData.stars || 0, data.stars);
          }

          const newProgress = { ...prev, [levelIdx]: newLevelData };
          localStorage.setItem('blokaly_progress', JSON.stringify(newProgress));
          
          // Mise à jour SCORM si changement d'étoiles
          if (data.stars !== undefined) {
             /* (Logique SCORM inchangée...) */
          }
          
          return newProgress;
      });
  }, []);

  const handleLevelWin = useCallback((stats) => {
      saveProgress(activeLevelIndex, { stars: stats.stars });
  }, [activeLevelIndex, saveProgress]);

  // Nouvelle fonction pour sauvegarder le code en temps réel
  const handleCodeChange = useCallback((code) => {
      saveProgress(activeLevelIndex, { code });
  }, [activeLevelIndex, saveProgress]);

  const handleNextLevel = useCallback(() => {
      if (activeLevelIndex < normalizedCampaign.levels.length - 1) setActiveLevelIndex(prev => prev + 1);
      else setActiveLevelIndex(-1);
  }, [activeLevelIndex, normalizedCampaign]);

  // --- MENU ---
  if (activeLevelIndex === -1) {
    return (
      <div className="min-h-screen bg-slate-100 font-sans">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shadow-md">
           {/* ... (Boutons Menu inchangés) ... */}
           <h1 className="font-bold text-xl tracking-tight">🧩 Blokaly <span className="text-blue-400">974</span></h1>
        </div>
        <CampaignMenu campaign={normalizedCampaign} progress={progress} onSelectLevel={setActiveLevelIndex} />
      </div>
    );
  }

  const currentLevel = normalizedCampaign.levels[activeLevelIndex];
  if (!currentLevel) return <div>Erreur niveau</div>;

  // Récupération du code sauvegardé pour ce niveau
  const savedCode = progress[activeLevelIndex]?.code;

  return (
    <div className="h-screen flex flex-col font-sans bg-slate-50">
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-30">
        
        {/* GAUCHE : LOGO & RETOUR */}
        <div className="flex items-center gap-4 min-w-[200px]">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveLevelIndex(-1)}>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                    B
                </div>
                <span className="font-bold text-slate-700 hidden md:block">Blokaly</span>
            </div>
            {isTeacherMode && (
                <button onClick={onBackToBuilder} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold hover:bg-red-200">
                    Sortir
                </button>
            )}
        </div>

        {/* CENTRE : NAVIGATION MAP */}
        <div className="flex-1 flex justify-center max-w-2xl">
            <CampaignNavBar 
                levels={normalizedCampaign.levels} 
                progress={progress} 
                currentIndex={activeLevelIndex} 
                onSelectLevel={setActiveLevelIndex} 
            />
        </div>

        {/* DROITE : STATUS */}
        <div className="flex justify-end min-w-[200px]">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full">
                {ltiConfig ? "🟢 Noté" : "⚪ Entraînement"}
             </span>
        </div>
      </div>
      
      <GameEngine
        key={activeLevelIndex} 
        levelData={currentLevel} 
        levelIndex={activeLevelIndex}
        savedCode={savedCode}          // 👈 Injection du code sauvegardé
        onCodeChange={handleCodeChange} // 👈 Callback de sauvegarde
        onWin={handleLevelWin}
        onNextLevel={handleNextLevel} 
      />
    </div>
  );
}