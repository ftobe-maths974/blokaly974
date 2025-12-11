// 📄 src/features/iframe/Editor.jsx
import React from 'react';

export default function IframeEditor({ levelData, onUpdate }) {
  const url = levelData.url || "";

  const handleChange = (e) => {
      onUpdate({ ...levelData, url: e.target.value });
  };

  return (
    <div className="p-6 h-full bg-slate-50 flex flex-col gap-6 overflow-y-auto">
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
                <span>🔗</span> Configuration URL
            </h3>
            
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Lien de l'activité (HTTPS obligatoire)
            </label>
            <input 
                type="url" 
                value={url} 
                onChange={handleChange} 
                placeholder="https://..." 
                className="w-full p-3 border-2 border-slate-200 rounded-lg text-sm font-mono focus:border-blue-500 outline-none transition-colors"
            />
            
            <p className="mt-3 text-xs text-slate-500 bg-blue-50 p-3 rounded border border-blue-100">
                💡 <strong>Idées d'intégration :</strong>
                <br/>• Mathalea (Copier le lien "Vue Élève")
                <br/>• GeoGebra (Lien de partage)
                <br/>• LearningApps, Wooclap, YouTube...
            </p>
        </div>

        <div className="flex-1 bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[300px]">
            <span className="text-[10px] font-bold text-slate-300 uppercase mb-2 text-center">Prévisualisation</span>
            {url ? (
                <iframe src={url} className="flex-1 w-full border border-slate-100 rounded bg-slate-50" title="Preview" />
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-300 italic">
                    Entrez une URL pour voir le résultat.
                </div>
            )}
        </div>

    </div>
  );
}