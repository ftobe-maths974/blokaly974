import React from 'react';

export default function FeedbackModal({ isOpen, stats, token, status, onReplay, onMenu, onNext, onAnalyze }) {
  if (!isOpen) return null;

  const isWin = status === 'WON';
  const isFail = status === 'FAILED' || status === 'LOST';

  // --- 1. VERSION VICTOIRE (Feu d'artifice) ---
  if (isWin) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center transform transition-all scale-100 border-4 border-emerald-400 relative overflow-hidden">
            {/* Confettis CSS simple */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-purple-500 to-emerald-500"></div>
            
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h1 className="text-3xl font-extrabold mb-2 text-emerald-600 drop-shadow-sm">Niveau Réussi !</h1>
            
            <div className="flex justify-center gap-2 mb-6">
                {Array.from({ length: stats.maxStars || 3 }, (_, i) => (
                <span key={i} className={`text-5xl transition-all duration-500 ${i < stats.stars ? 'text-yellow-400 drop-shadow-lg scale-110' : 'text-slate-200'}`}>
                    ★
                </span>
                ))}
            </div>

            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 mb-6">
                <p className="text-emerald-800 font-medium text-lg">
                    {stats.metric || "Objectif atteint"}
                </p>
                {stats.target && <p className="text-emerald-600/70 text-sm">Cible : {stats.target}</p>}
                <p className="text-sm text-slate-500 mt-2 italic">"{stats.feedback?.message || "Bravo !"}"</p>
            </div>

            {/* Preuve LTI/Scorm */}
            <div className="mb-6">
                <div className="font-mono text-[10px] text-slate-400 select-all cursor-text">Ref: {token}</div>
            </div>

            <div className="flex gap-3 justify-center">
                <button onClick={onMenu} className="flex-1 py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors">
                    ☰ Menu
                </button>
                {onReplay && (
                    <button onClick={onReplay} className="flex-1 py-3 px-3 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl font-bold transition-colors" title="Continuer à jouer sur ce niveau">
                        🔁 Rester
                    </button>
                )}
                {onNext && (
                    <button onClick={onNext} className="flex-[2] py-3 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1">
                    ⏩ Niveau Suivant
                    </button>
                )}
            </div>
          </div>
        </div>
    );
  }

  // --- 2. VERSION ÉCHEC (Discrète / "Soft") ---
  if (isFail) {
      return (
        <div className="fixed bottom-6 right-6 z-[100] w-96 max-w-[calc(100%-48px)] animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="bg-white rounded-xl shadow-2xl border-l-8 border-amber-500 overflow-hidden flex flex-col">
                <div className="p-5">
                    <div className="flex items-start gap-4">
                        <div className="text-3xl">🤔</div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">Oups, pas tout à fait...</h3>
                            <p className="text-slate-600 text-sm mt-1 leading-snug">
                                {stats.feedback?.message || "Le code ne donne pas le résultat attendu."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-3 flex gap-3 border-t border-slate-100">
                    {onAnalyze && (
                        <button 
                            onClick={onAnalyze} 
                            className="flex-1 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                            title="Voir le plateau pour comprendre l'erreur"
                        >
                            <span>🔍</span> Analyser
                        </button>
                    )}
                    <button 
                        onClick={onReplay} 
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        <span>🔄</span> Corriger
                    </button>
                </div>
            </div>
            <div className="text-center mt-2">
                <span className="text-[10px] text-white/80 bg-slate-800/50 px-2 py-1 rounded backdrop-blur-sm">
                    💡 Clique sur "Corriger" pour modifier ton code.
                </span>
            </div>
        </div>
      );
  }

  return null;
}