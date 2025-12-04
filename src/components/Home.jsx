import React, { useRef } from 'react';

export default function Home({ onFileLoaded }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target.result);
            onFileLoaded(json); 
        } catch (err) {
            alert("Fichier invalide : " + err.message);
        }
    };
    reader.readAsText(file);
  };

  return (
    // CONTENEUR PRINCIPAL : Dégradé moderne plein écran
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 font-sans p-4">
      
      {/* CARTE : Effet Glassmorphism + Ombre douce */}
      <div className="bg-white/80 backdrop-blur-lg border border-white/50 p-10 rounded-2xl shadow-2xl max-w-lg w-full text-center transition-all hover:shadow-indigo-200/50">
        
        {/* TITRE : Typo grasse et couleur sombre */}
        <h1 className="text-5xl font-extrabold text-slate-800 mb-2 tracking-tight">
          🧩 Blokaly <span className="text-blue-600">974</span>
        </h1>
        <p className="text-slate-500 text-lg mb-10 font-medium">
          La plateforme d'algorithmique pour le collège.
        </p>

        {/* SECTION 1 : IMPORT */}
        <div className="mb-8">
          <h3 className="text-sm uppercase tracking-wide text-slate-400 font-bold mb-3">
            J'ai un fichier d'exercice
          </h3>
          <button 
            onClick={() => fileInputRef.current.click()} 
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg 
                       transform transition-all duration-200 hover:scale-[1.02] hover:shadow-blue-500/30 active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="text-xl">📥</span> Charger un fichier .blokaly
          </button>
          <input 
            type="file" accept=".json" ref={fileInputRef} 
            style={{display:'none'}} onChange={handleFileChange} 
          />
        </div>

        {/* SECTION 2 : EXEMPLES */}
        <div className="mb-8">
          <h3 className="text-sm uppercase tracking-wide text-slate-400 font-bold mb-3">
            Découvrir
          </h3>
          <div className="flex flex-col gap-3">
             <button 
                onClick={() => window.location.href = '?url=examples/campagne_de_tests.blokaly.json'} 
                className="w-full bg-white border border-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl
                           hover:bg-slate-50 hover:border-blue-300 transition-colors duration-200 flex items-center justify-center gap-2"
             >
                🏰 Campagne Démo (Maze & Tortue)
             </button>
          </div>
        </div>

        {/* ZONE PROFESSEUR "CACHÉE" */}
        <div className="mt-12 pt-6 border-t border-slate-100">
          <details className="group">
            <summary className="text-xs text-slate-300 cursor-pointer list-none select-none transition-colors hover:text-slate-400">
                ( Accès Enseignant )
            </summary>
            
            <div className="mt-4 pb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-xs text-slate-400 mb-3">
                    Créer ou modifier des parcours pédagogiques :
                </p>
                <button 
                    onClick={() => window.location.href = '?mode=editor'} 
                    className="bg-slate-100 text-slate-500 border border-slate-200 py-2 px-6 rounded-lg text-sm font-bold
                               hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                    🛠️ Ouvrir l'Atelier
                </button>
            </div>
          </details>
        </div>
      </div>
      
      {/* On garde juste le hack pour cacher la flèche du details car Tailwind ne le fait pas par défaut */}
      <style>{`
        details > summary::-webkit-details-marker { display: none; }
      `}</style>
    </div>
  );
}