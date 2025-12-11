// 📄 src/components/runner/CampaignNavBar.jsx
import React from 'react';

export default function CampaignNavBar({ title, levels, progress, currentIndex, onSelectLevel }) {
  return (
    <div className="flex items-center gap-6 h-full max-w-full">
      
      {/* 1. TITRE DE LA CAMPAGNE */}
      {title && (
        <div className="hidden lg:flex items-center">
            <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm whitespace-nowrap">
                {title}
            </span>
            <div className="h-1 w-4 bg-slate-300 rounded-full ml-3 opacity-50"></div>
        </div>
      )}

      {/* 2. BULLES DE NIVEAUX */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient py-3 px-1">
        {levels.map((_, index) => {
            const stats = progress[index] || {};
            
            // --- LOGIQUE DE VERROUILLAGE ---
            const prevStats = progress[index - 1] || {};
            const isUnlocked = index === 0 || (prevStats.stars > 0);
            // -------------------------------

            const isCurrent = index === currentIndex;
            const isSolved = stats.stars > 0;
            const isPerfect = stats.stars === 3;
            const hasCode = !!stats.code;

            let baseClasses = "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 shadow-sm flex-shrink-0";
            let statusClasses = "";

            if (!isUnlocked) {
                // Style VERROUILLÉ
                statusClasses = "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed opacity-60";
            } else {
                // Style DÉVERROUILLÉ
                baseClasses += " cursor-pointer";

                if (isCurrent) {
                    statusClasses = "ring-4 ring-blue-100 border-blue-500 text-blue-600 bg-white scale-110 z-10";
                } else if (isSolved) {
                    statusClasses = isPerfect 
                        ? "bg-emerald-500 border-emerald-600 text-white shadow-emerald-200 hover:scale-105"
                        : "bg-lime-400 border-lime-600 text-white hover:scale-105";
                } else if (hasCode) {
                    statusClasses = "bg-white border-amber-400 text-amber-600 hover:scale-105";
                } else {
                    statusClasses = "bg-slate-100 border-slate-300 text-slate-400 hover:bg-slate-200 hover:scale-105";
                }
            }

            return (
            <button
                key={index}
                disabled={!isUnlocked} // 👈 Empêche le clic
                onClick={() => onSelectLevel(index)}
                className={`${baseClasses} ${statusClasses}`}
                title={isUnlocked ? `Niveau ${index + 1}` : `Niveau verrouillé`}
            >
                {/* Affiche un cadenas si verrouillé, sinon l'état (Étoile/Check/Numéro) */}
                {!isUnlocked ? '🔒' : (isSolved ? (isPerfect ? '★' : '✓') : (index + 1))}
            </button>
            );
        })}
      </div>
    </div>
  );
}