import React, { useState } from 'react';
import { getMastery, getMacroMastery, getAttempts, clearAttempts } from '../../core/competences';

const TIER_STYLE = {
  fragile: { label: 'Fragile', bg: 'bg-red-400', text: 'text-red-700', chip: 'bg-red-100' },
  satisfaisant: { label: 'Satisfaisant', bg: 'bg-amber-400', text: 'text-amber-700', chip: 'bg-amber-100' },
  'tres-satisfaisant': { label: 'Très satisfaisant', bg: 'bg-lime-500', text: 'text-lime-700', chip: 'bg-lime-100' },
  expert: { label: 'Expert', bg: 'bg-emerald-500', text: 'text-emerald-700', chip: 'bg-emerald-100' },
  null: { label: 'En cours…', bg: 'bg-slate-300', text: 'text-slate-500', chip: 'bg-slate-100' },
};
const st = (tier) => TIER_STYLE[tier] || TIER_STYLE.null;

function Bar({ rate, tier }) {
  return (
    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${st(tier).bg} transition-all`} style={{ width: `${Math.round(rate * 100)}%` }} />
    </div>
  );
}

export default function CompetencesView() {
  const [, force] = useState(0);
  const skills = getMastery({ minAttempts: 1 });
  const macro = getMacroMastery({ minAttempts: 1 });
  const attempts = getAttempts();

  // micro-compétences groupées par domaine
  const byDomaine = {};
  for (const [id, s] of Object.entries(skills)) {
    (byDomaine[s.domaine] ||= []).push({ id, ...s });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 font-sans p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { window.location.href = window.location.pathname; }} className="text-sm font-bold bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50">🏠 Accueil</button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">📊 Mes compétences</h1>
          <span className="w-16" />
        </div>

        {attempts.length === 0 ? (
          <div className="bg-white/85 rounded-2xl shadow border border-white/60 p-8 text-center text-slate-500">
            Aucune compétence captée pour l'instant.<br />
            <span className="text-sm">Joue et réussis quelques niveaux, puis reviens ici. 🐢</span>
          </div>
        ) : (
          <>
            <p className="text-center text-slate-500 mb-6 text-sm">
              {attempts.length} tentative(s) réussie(s) captée(s) sur cet appareil.
              <span className="block text-xs text-slate-400 mt-1">(Le cumul entre toutes les apps viendra avec le serveur partagé.)</span>
            </p>

            {/* Macro-compétences du socle */}
            <div className="bg-white/85 backdrop-blur rounded-2xl shadow border border-white/60 p-5 mb-5">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">Compétences du socle</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(macro).filter(([, m]) => m.attempts > 0).map(([id, m]) => (
                  <div key={id} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-slate-700">{m.label}</span>
                      <span className={`text-xs font-bold ${st(m.tier).text}`}>{Math.round(m.rate * 100)}% · {st(m.tier).label}</span>
                    </div>
                    <Bar rate={m.rate} tier={m.tier} />
                  </div>
                ))}
              </div>
            </div>

            {/* Micro-compétences par domaine */}
            {Object.entries(byDomaine).map(([domaine, list]) => (
              <div key={domaine} className="bg-white/85 backdrop-blur rounded-2xl shadow border border-white/60 p-5 mb-5">
                <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">{domaine}</h2>
                <div className="flex flex-col gap-3">
                  {list.map((s) => (
                    <div key={s.id} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-slate-700">{s.label}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${st(s.tier).chip} ${st(s.tier).text}`}>
                          {s.ok}/{s.attempts} · {st(s.tier).label}
                        </span>
                      </div>
                      <Bar rate={s.rate} tier={s.tier} />
                      <span className="text-[11px] text-slate-400">supports : {Object.keys(s.byApp).join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="text-center mt-6">
              <button
                onClick={() => { clearAttempts(); force((n) => n + 1); }}
                className="text-xs text-slate-400 hover:text-red-500 underline"
              >
                Réinitialiser mes compétences (cet appareil)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
