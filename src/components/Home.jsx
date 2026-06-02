import React, { useRef } from 'react';

// Les deux parcours « clé en main » fournis avec l'app (public/examples/)
const PARCOURS = [
  {
    key: 'maze',
    emoji: '🧩',
    title: 'Le Labyrinthe',
    tagline: 'Guide la tortue de case en case',
    url: 'examples/figures_geometriques.blokaly.json',
    gradient: 'from-emerald-500 to-teal-600',
    ring: 'hover:shadow-emerald-500/30',
    desc: "Reproduis des figures (carré, escalier, croix, spirale…) en programmant les déplacements pas à pas. Tu y découvres les boucles « Répéter » et les variables.",
  },
  {
    key: 'turtle',
    emoji: '🐢',
    title: 'La Tortue géomètre',
    tagline: 'Dessine de belles figures',
    url: 'examples/figures_tortue.blokaly.json',
    gradient: 'from-blue-500 to-indigo-600',
    ring: 'hover:shadow-blue-500/30',
    desc: "Trace polygones réguliers (angle = 360/n), rosaces et spirales. Tu apprends les angles, les boucles et les variables… en faisant de l'art !",
  },
  {
    key: 'algo',
    emoji: '🧪',
    title: 'Le Labo Algo',
    tagline: 'Programme comme un pro',
    url: 'examples/parcours_algo.blokaly.json',
    gradient: 'from-fuchsia-500 to-pink-600',
    ring: 'hover:shadow-pink-500/30',
    desc: 'Hello World, variables, échange de valeurs, conditions et boucles : les petits programmes qui font les vrais programmeurs.',
  },
  {
    key: 'motif',
    emoji: '🎨',
    title: 'Motifs sur une grille',
    tagline: 'Reproduis les motifs colorés',
    url: 'examples/motifs_grille.blokaly.json',
    gradient: 'from-purple-500 to-violet-600',
    ring: 'hover:shadow-purple-500/30',
    desc: "Repère le motif de couleurs qui se répète et factorise-le avec la boucle Répéter. Inspiré des défis Algorea.",
  },
];

const launch = (url) => { window.location.href = '?url=' + encodeURIComponent(url); };

export default function Home({ onFileLoaded }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try { onFileLoaded(JSON.parse(event.target.result)); }
      catch (err) { alert('Fichier invalide : ' + err.message); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 font-sans p-4">
        <div className="bg-white/80 backdrop-blur-lg border border-white/50 p-8 sm:p-10 rounded-3xl shadow-2xl max-w-2xl w-full text-center">
          <h1 className="text-5xl font-extrabold text-slate-800 mb-2 tracking-tight">
            🧩 Blokaly <span className="text-blue-600">974</span>
          </h1>
          <p className="text-slate-500 text-lg mb-8 font-medium">
            Apprends à programmer en jouant.
          </p>

          {/* SECTION 1 : LES DEUX PARCOURS (CTA) */}
          <h3 className="text-sm uppercase tracking-wide text-slate-400 font-bold mb-4">
            Choisis ton aventure
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {PARCOURS.map((p) => (
              <button
                key={p.key}
                onClick={() => launch(p.url)}
                title={p.desc}
                className={`group bg-gradient-to-br ${p.gradient} text-white rounded-2xl p-6 shadow-lg ${p.ring}
                            transform transition-all duration-200 hover:scale-[1.03] active:scale-95 text-left flex flex-col gap-2`}
              >
                <span className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform">{p.emoji}</span>
                <span className="text-xl font-extrabold leading-tight">{p.title}</span>
                <span className="text-white/85 text-sm">{p.tagline}</span>
                <span className="mt-2 text-sm font-bold inline-flex items-center gap-1 opacity-90 group-hover:gap-2 transition-all">
                  ▶️ Jouer →
                </span>
              </button>
            ))}
          </div>

          {/* SECTION 2 : IMPORT / DÉMO */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => fileInputRef.current.click()}
              className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-colors flex items-center justify-center gap-2"
            >
              <span>📥</span> Charger un fichier .blokaly
            </button>
            <button
              onClick={() => launch('examples/campagne_de_tests.blokaly.json')}
              className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-colors flex items-center justify-center gap-2"
            >
              <span>🎲</span> Campagne démo
            </button>
            <button
              onClick={() => { window.location.href = '?lab=angles'; }}
              className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl hover:bg-slate-50 hover:border-indigo-300 transition-colors flex items-center justify-center gap-2"
            >
              <span>📐</span> Atelier des angles
            </button>
            <button
              onClick={() => { window.location.href = '?lab=competences'; }}
              className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl hover:bg-slate-50 hover:border-emerald-300 transition-colors flex items-center justify-center gap-2"
            >
              <span>📊</span> Mes compétences
            </button>
            <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
          </div>

          {/* ZONE PROFESSEUR */}
          <div className="mt-10 pt-6 border-t border-slate-100">
            <details className="group">
              <summary className="text-xs text-slate-300 cursor-pointer list-none select-none hover:text-slate-400">
                ( Accès Enseignant )
              </summary>
              <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-xs text-slate-400 mb-3">Créer ou modifier des parcours :</p>
                <button
                  onClick={() => { window.location.href = '?mode=editor'; }}
                  className="bg-slate-100 text-slate-500 border border-slate-200 py-2 px-6 rounded-lg text-sm font-bold hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  🛠️ Ouvrir l'Atelier
                </button>
              </div>
            </details>
          </div>
        </div>

      <style>{`details > summary::-webkit-details-marker { display: none; }`}</style>
    </div>
  );
}
