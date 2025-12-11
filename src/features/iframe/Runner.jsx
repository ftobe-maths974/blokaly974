// 📄 src/features/iframe/Runner.jsx
import React, { useState } from 'react';

export default function IframeRunner({ levelData, onWin }) {
  const [isValidated, setIsValidated] = useState(false);
  const url = levelData.url || "https://coopmaths.fr/alea/"; // Défaut Mathalea

  const handleValidate = () => {
    setIsValidated(true);
    // On simule une victoire immédiate
    onWin({ 
        stars: 3, 
        metric: "Validé", 
        feedback: { message: "Activité externe terminée." } 
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-100">
      {/* BARRE D'OUTILS SPÉCIALE */}
      <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
          <span className="text-xs font-bold text-slate-400 uppercase">
              🌐 Activité Externe
          </span>
          <div className="flex gap-2">
             <button 
                onClick={() => window.open(url, '_blank')}
                className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100"
             >
                🔗 Ouvrir dans un nouvel onglet
             </button>
          </div>
      </div>

      {/* IFRAME */}
      <div className="flex-1 relative w-full h-full">
          <iframe 
            src={url} 
            className="absolute inset-0 w-full h-full border-none"
            title="External Activity"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
      </div>

      {/* BARRE DE VALIDATION */}
      <div className="p-4 bg-white border-t border-slate-200 flex justify-center shrink-0">
          {isValidated ? (
              <div className="flex items-center gap-2 text-emerald-600 font-bold animate-pulse">
                  <span>🎉</span> Activité validée !
              </div>
          ) : (
              <button 
                onClick={handleValidate}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
              >
                  <span>✅</span> J'ai terminé l'activité
              </button>
          )}
      </div>
    </div>
  );
}