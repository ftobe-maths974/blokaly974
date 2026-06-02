import React from 'react';

// Sépare l'emoji de tête du reste du titre ("🐢 La tortue" -> ["🐢", "La tortue"])
function splitTitle(title = '') {
  const m = title.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*(.*)$/u);
  if (m) return { icon: m[1], label: m[2] };
  return { icon: '🎯', label: title };
}

export default function CampaignMenu({ campaign, progress, onSelectLevel }) {
  const levels = campaign.levels || [];

  // Regroupe par chapitre (en gardant l'index global pour le verrouillage / progrès)
  const chapters = [];
  levels.forEach((level, index) => {
    const name = level.chapter || 'Niveaux';
    let ch = chapters.find((c) => c.name === name);
    if (!ch) { ch = { name, items: [] }; chapters.push(ch); }
    ch.items.push({ level, index });
  });
  const showChapterHeaders = chapters.length > 1;

  return (
    <div className="max-w-5xl w-[95%] mx-auto px-4 py-10 font-sans">
      <h1 className="text-center text-3xl sm:text-4xl font-extrabold text-slate-800 mb-2">
        {campaign.title || 'Aventure Blokaly'}
      </h1>
      {campaign.description && (
        <p className="text-center text-slate-500 max-w-2xl mx-auto mb-8">{campaign.description}</p>
      )}

      {chapters.map((ch, ci) => (
        <div key={ch.name} className="mb-10">
          {showChapterHeaders && (
            <h2 className="flex items-center gap-2 text-sm uppercase tracking-wider font-bold text-slate-400 mb-4">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs">{ci + 1}</span>
              {ch.name}
            </h2>
          )}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-5">
            {ch.items.map(({ level, index }) => {
              const prev = progress[index - 1];
              const isUnlocked = index === 0 || (prev && prev.stars > 0);
              const stars = progress[index]?.stars || 0;
              const maxStars = level.maxStars || 3;
              const { icon, label } = splitTitle(level.title);
              const done = stars > 0;

              return (
                <button
                  key={index}
                  disabled={!isUnlocked}
                  onClick={() => onSelectLevel(index)}
                  className={`relative rounded-2xl p-4 flex flex-col items-center text-center shadow-md transition-all duration-200
                    ${isUnlocked
                      ? 'bg-white border border-slate-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer'
                      : 'bg-slate-100 border border-slate-200 opacity-60 cursor-not-allowed'}`}
                >
                  <span className="absolute top-2 left-3 text-[11px] font-bold text-slate-300">{index + 1}</span>
                  {done && <span className="absolute top-2 right-3 text-emerald-500 text-sm">✓</span>}

                  <span className="text-4xl mb-2 mt-1">
                    {isUnlocked ? icon : '🔒'}
                  </span>
                  <span className="text-sm font-bold text-slate-700 leading-tight min-h-[2.4em] flex items-center">
                    {label || `Niveau ${index + 1}`}
                  </span>

                  <span className="mt-2 text-yellow-400 text-base tracking-tight" title={`${stars}/${maxStars}`}>
                    {'★'.repeat(stars)}<span className="text-slate-200">{'★'.repeat(Math.max(0, maxStars - stars))}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
