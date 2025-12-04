import React from 'react';

export default function FeedbackModal({ isOpen, stats, token, status, onReplay, onMenu, onNext }) {
  if (!isOpen) return null;

  const isWin = status === 'WON';
  const isFail = status === 'FAILED';
  const isLost = status === 'LOST';

  let title = "Niveau Terminé !";
  let message = stats.stars === 3 ? "✨ Code Parfait !" : "💡 Tu peux optimiser...";
  let titleColor = "text-emerald-600";
  let icon = "🎉";

  if (isFail) {
      title = "Presque...";
      message = "Le résultat ne correspond pas au modèle.";
      titleColor = "text-amber-500";
      icon = "🤔";
  } else if (isLost) {
      title = "Aïe !";
      message = "Le robot a rencontré un obstacle.";
      titleColor = "text-red-500";
      icon = "💥";
  }

  const renderStars = () => {
    if (!isWin) return <div className="text-6xl mb-4 grayscale opacity-50">{icon}</div>;
    return (
      <div className="flex justify-center gap-2 mb-6">
        {[0, 1, 2].map(i => (
          <span key={i} className={`text-5xl transition-all duration-500 ${i < stats.stars ? 'text-yellow-400 drop-shadow-lg scale-110' : 'text-slate-200'}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center transform transition-all scale-100 border border-white/20">
        
        <h1 className={`text-3xl font-extrabold mb-2 ${titleColor} drop-shadow-sm`}>{title}</h1>
        
        <div className="my-4">
          {renderStars()}
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
          {isWin ? (
             <p className="text-slate-600 font-medium">
               🧱 Blocs utilisés : <strong className="text-slate-900 text-lg">{stats.blockCount}</strong> <span className="text-slate-400">/ {stats.target}</span>
             </p>
          ) : (
             <p className="font-bold text-slate-500">Essaie encore !</p>
          )}
          <p className="text-sm text-slate-400 mt-1">{message}</p>
        </div>

        {isWin && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-left">
                <p className="text-xs font-bold text-blue-400 uppercase mb-2">🔑 Code de preuve :</p>
                <div className="font-mono text-xs bg-white p-2 rounded border border-blue-200 text-slate-600 break-all select-all">
                    {token}
                </div>
            </div>
        )}

        <div className="flex gap-3 justify-center">
          <button 
            onClick={onReplay} 
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors"
          >
            🔄 Rejouer
          </button>
          
          <button 
            onClick={onMenu} 
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors"
          >
             ☰ Menu
          </button>

          {isWin && onNext && (
            <button 
                onClick={onNext} 
                className="flex-[1.5] py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5"
            >
              ⏩ Suivant
            </button>
          )}
        </div>
      </div>
    </div>
  );
}