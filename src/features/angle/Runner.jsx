import React, { useState } from 'react';
import { SupplementMode, TourCompletMode, QuizMode } from '../../components/labs/AngleLab';

const MODES = { supp: SupplementMode, tour: TourCompletMode, quiz: QuizMode };

// Niveau-leçon interactif (plein écran). Le mode est porté par levelData.mode.
export default function AngleLessonRunner({ levelData, onWin, onNextLevel }) {
  const mode = levelData.mode || 'supp';
  const Comp = MODES[mode] || MODES.supp;
  const [done, setDone] = useState(false);

  const finish = () => {
    onWin({ stars: 4, maxStars: 4, feedback: { message: 'Leçon terminée !' } });
    setDone(true);
  };

  return (
    <div className="h-full w-full overflow-auto bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">
      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto bg-white/85 backdrop-blur rounded-2xl shadow-lg border border-white/60 p-5 sm:p-6">
          <Comp />
        </div>
      </div>
      <div className="bg-white border-t border-slate-200 p-4 flex justify-center shrink-0">
        {!done ? (
          <button onClick={finish} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
            <span>✅</span> J'ai compris
          </button>
        ) : (
          <button onClick={onNextLevel} className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
            Niveau suivant <span>➡️</span>
          </button>
        )}
      </div>
    </div>
  );
}
