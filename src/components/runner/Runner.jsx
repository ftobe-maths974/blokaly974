// 📄 src/components/runner/Runner.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import GameEngine from './GameEngine';
import CampaignMenu from './CampaignMenu';
import CampaignNavBar from './CampaignNavBar'; 
import ScormService from '../../core/scorm/ScormService';

export default function Runner({ campaign, ltiConfig, isTeacherMode, onBackToBuilder, initialLevelIndex = -1 }) {
  
  if (!campaign) return <div className="flex items-center justify-center h-screen">⏳ Chargement...</div>;

  const normalizedCampaign = useMemo(() => {
      if (campaign.levels && Array.isArray(campaign.levels)) return campaign;
      return { title: "Niveau Unique", levels: [campaign] };
  }, [campaign]);

  const [activeLevelIndex, setActiveLevelIndex] = useState(initialLevelIndex);

  // --- PERSISTANCE (LocalStorage) ---
  const [progress, setProgress] = useState(() => {
    try {
        const saved = localStorage.getItem('blokaly_progress');
        return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const saveProgress = useCallback((levelIdx, data) => {
      setProgress(prev => {
          const prevLevelData = prev[levelIdx] || {};
          const newLevelData = { ...prevLevelData, ...data };
          if (data.stars !== undefined) newLevelData.stars = Math.max(prevLevelData.stars || 0, data.stars);
          const newProgress = { ...prev, [levelIdx]: newLevelData };
          localStorage.setItem('blokaly_progress', JSON.stringify(newProgress));
          return newProgress;
      });
  }, []);

  const handleLevelWin = useCallback((stats) => { saveProgress(activeLevelIndex, { stars: stats.stars }); }, [activeLevelIndex, saveProgress]);
  const handleCodeChange = useCallback((code) => { saveProgress(activeLevelIndex, { code }); }, [activeLevelIndex, saveProgress]);
  const handleNextLevel = useCallback(() => {
      if (activeLevelIndex < normalizedCampaign.levels.length - 1) setActiveLevelIndex(prev => prev + 1);
      else setActiveLevelIndex(-1);
  }, [activeLevelIndex, normalizedCampaign]);

  // --- VUE MENU (Liste des niveaux) ---
  if (activeLevelIndex === -1) {
    return (
      <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
        {/* HEADER MENU */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
           <div className="flex items-center gap-4">
               {/* LOGO MATHS974 */}
               <a href="https://maths974.fr" target="_blank" rel="noreferrer" className="flex flex-col leading-none text-slate-700 hover:text-blue-600 transition-colors no-underline group">
                    <span className="font-extrabold text-xl tracking-tight">Maths<span className="text-blue-600 group-hover:text-blue-500">974</span></span>
                    <span className="text-[10px] text-slate-400 font-mono tracking-wider">.fr</span>
               </a>
               <div className="h-8 w-px bg-slate-200"></div>
               {/* BOUTON ACCUEIL */}
               <button 
                  onClick={() => window.location.href = window.location.pathname} 
                  className="flex items-center gap-2 text-sm font-bold bg-slate-100 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
               >
                  <span>🏠</span> Accueil
               </button>
           </div>
           
           <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-slate-800">🧩 Blokaly</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">v2.0</span>
           </div>
        </div>
        <CampaignMenu campaign={normalizedCampaign} progress={progress} onSelectLevel={setActiveLevelIndex} />
      </div>
    );
  }

  // --- VUE JEU (Niveau actif) ---
  const currentLevel = normalizedCampaign.levels[activeLevelIndex];
  if (!currentLevel) return <div>Erreur niveau</div>;
  const savedCode = progress[activeLevelIndex]?.code;

  return (
    <div className="h-screen flex flex-col font-sans bg-slate-50">
      
      {/* --- NAVBAR DU JEU --- */}
      <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-30 shrink-0">
        
        {/* GAUCHE : Logo & Navigation */}
        <div className="flex items-center gap-4 min-w-[200px]">
            
            {/* 1. Logo Maths974 */}
            <a href="https://www.maths974.fr" target="_blank" rel="noreferrer" className="hidden md:flex flex-col leading-none text-slate-700 hover:text-blue-600 transition-colors no-underline group mr-2">
                <span className="font-extrabold text-lg tracking-tight">Maths<span className="text-blue-600 group-hover:text-blue-500">974</span></span>
                <span className="text-[10px] text-slate-400 font-mono">.fr</span>
            </a>

            <div className="hidden md:block h-8 w-px bg-slate-200"></div>

            {/* 2. Bouton "B" (Retour au Menu de la campagne) */}
            <button 
                onClick={() => setActiveLevelIndex(-1)}
                className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white font-bold shadow-md hover:scale-105 hover:shadow-lg transition-all"
                title="Retour au menu des niveaux"
            >
                B
            </button>

            {/* 3. Bouton Accueil (Maison) - Pour changer de fichier */}
            <button 
                onClick={() => { if(confirm("Quitter l'exercice et retourner à l'accueil ?")) window.location.href = window.location.pathname; }}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-xl border border-slate-200 transition-colors"
                title="Quitter (Retour Accueil)"
            >
                🏠
            </button>

            {isTeacherMode && (
                <button onClick={onBackToBuilder} className="ml-2 text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold hover:bg-amber-200 border border-amber-200">
                    🛠️ Éditeur
                </button>
            )}
        </div>

        {/* CENTRE : NAVIGATION MAP */}
        <div className="flex-1 flex justify-center max-w-4xl h-full mx-4">
            <CampaignNavBar 
                title={normalizedCampaign.title} 
                levels={normalizedCampaign.levels} 
                progress={progress} 
                currentIndex={activeLevelIndex} 
                onSelectLevel={setActiveLevelIndex} 
            />
        </div>

        {/* DROITE : INDICATEURS */}
        <div className="flex justify-end items-center min-w-[150px] gap-3">
             {ltiConfig ? (
                 <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-bold shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Noté (LTI)
                 </span>
             ) : (
                 <span className="hidden sm:inline-flex px-3 py-1.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-xs font-bold">
                    Entraînement
                 </span>
             )}
        </div>
      </div>
      
      {/* MOTEUR DE JEU */}
      <GameEngine
        key={activeLevelIndex} 
        levelData={currentLevel} 
        levelIndex={activeLevelIndex}
        savedCode={savedCode}
        onCodeChange={handleCodeChange}
        onWin={handleLevelWin}
        onNextLevel={handleNextLevel} 
      />
    </div>
  );
}