// 📄 src/components/runner/CampaignNavBar.jsx
import React from 'react';

export default function CampaignNavBar({ levels, progress, currentIndex, onSelectLevel }) {
  return (
    <div className="flex items-center gap-2 px-4 overflow-x-auto no-scrollbar mask-gradient">
      {levels.map((_, index) => {
        const stats = progress[index] || {};
        const isCurrent = index === currentIndex;
        const isSolved = stats.stars > 0;
        const isPerfect = stats.stars === 3;
        const hasCode = !!stats.code; // L'élève a commencé à coder

        // Détermination du style de la bulle
        let baseClasses = "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer border-2 shadow-sm flex-shrink-0";
        let statusClasses = "bg-slate-200 border-slate-300 text-slate-500"; // Par défaut (Gris)

        if (isSolved) {
            statusClasses = isPerfect 
                ? "bg-emerald-500 border-emerald-600 text-white"  // Vert (Parfait)
                : "bg-lime-400 border-lime-600 text-white";       // Vert clair (Réussi mais < 3 étoiles)
        } else if (hasCode) {
            statusClasses = "bg-white border-amber-400 text-amber-600"; // En cours (Jaune/Blanc)
        }

        if (isCurrent) {
            statusClasses += " ring-2 ring-blue-400 ring-offset-2 scale-110 z-10"; // Focus actuel
        } else {
            statusClasses += " hover:scale-105 opacity-80 hover:opacity-100";
        }

        return (
          <button
            key={index}
            onClick={() => onSelectLevel(index)}
            className={`${baseClasses} ${statusClasses}`}
            title={`Niveau ${index + 1} ${isSolved ? `(${stats.stars} étoiles)` : ''}`}
          >
            {isSolved ? (isPerfect ? '★' : '✓') : (index + 1)}
          </button>
        );
      })}
    </div>
  );
}