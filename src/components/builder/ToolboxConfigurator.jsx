// 📄 src/components/builder/ToolboxConfigurator.jsx
import React, { useState, useEffect } from 'react';
import { getPlugin } from '../../core/PluginRegistry'; // ✅ On utilise le registre

export default function ToolboxConfigurator({ currentType, allowedBlocks, onUpdate, blockLimits = {}, onUpdateLimits }) {
  // 1. Récupération dynamique depuis le plugin
  const plugin = getPlugin(currentType);
  const categories = plugin?.catalog || []; // Si pas de catalogue, tableau vide
  
  // Reset de l'onglet si on change de type (reset d'état volontaire au changement de prop)
  const [activeTab, setActiveTab] = useState(0);
  useEffect(() => { setActiveTab(0); }, [currentType]);

  const toggleBlock = (blockType) => {
    const isAllowed = allowedBlocks.includes(blockType);
    if (isAllowed) {
      onUpdate(allowedBlocks.filter(b => b !== blockType));
    } else {
      onUpdate([...allowedBlocks, blockType]);
    }
  };

  const toggleCategory = (blocksInCategory) => {
    const allIds = blocksInCategory.map(b => b.type);
    const allSelected = allIds.every(id => allowedBlocks.includes(id));

    if (allSelected) {
      onUpdate(allowedBlocks.filter(id => !allIds.includes(id)));
    } else {
      const toAdd = allIds.filter(id => !allowedBlocks.includes(id));
      onUpdate([...allowedBlocks, ...toAdd]);
    }
  };

  if (!categories || categories.length === 0) {
      return (
        <div className="p-6 text-center text-slate-400 text-sm italic">
            Ce mode n'a pas encore de catalogue configuré dans son fichier index.js.
        </div>
      );
  }

  // Sécurité si l'onglet actif n'existe plus
  const currentCategory = categories[activeTab] || categories[0];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* HEADER & ONGLETS */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="flex overflow-x-auto no-scrollbar">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`
                px-4 py-3 text-xs font-bold uppercase whitespace-nowrap transition-colors border-b-2
                ${activeTab === idx 
                  ? `text-${cat.color || 'blue-600'} border-${cat.color || 'blue-600'} bg-white` 
                  : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-100'}
              `}
            >
              {cat.category}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLE DE BLOCS */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-slate-50/30">
        <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase">
                {currentCategory.category}
            </h4>
            <button 
                onClick={() => toggleCategory(currentCategory.blocks)}
                className="text-[10px] text-blue-500 hover:underline cursor-pointer font-medium"
            >
                Tout (dé)sélectionner
            </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {currentCategory.blocks.map((block) => {
            const isSelected = allowedBlocks.includes(block.type);
            const setLimit = (v) => {
                const next = { ...blockLimits };
                if (v > 0) next[block.type] = v; else delete next[block.type];
                onUpdateLimits?.(next);
            };

            return (
              <div key={block.type} className="flex flex-col">
                <button
                  onClick={() => toggleBlock(block.type)}
                  className={`
                    relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 group
                    ${isSelected
                      ? 'bg-white border-blue-500 shadow-md scale-100 opacity-100'
                      : 'bg-slate-50 border-slate-200 shadow-none scale-95 opacity-50 grayscale hover:opacity-80 hover:scale-95'}
                  `}
                >
                  <span className="text-2xl mb-1 filter drop-shadow-sm group-hover:scale-110 transition-transform">
                      {block.icon}
                  </span>
                  <span className={`text-[10px] font-bold text-center leading-tight ${isSelected ? 'text-slate-700' : 'text-slate-400'}`}>
                      {block.label}
                  </span>

                  {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                      </div>
                  )}
                </button>

                {/* Plafond d'usage (vide = illimité) — pousse vers les boucles */}
                {isSelected && onUpdateLimits && (
                  <div className="mt-1 flex items-center justify-center gap-1" title="Nombre maximum d'utilisations (vide = illimité)">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">max</span>
                    <input
                      type="number"
                      min="1"
                      value={blockLimits[block.type] ?? ''}
                      onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                      placeholder="∞"
                      className="w-12 text-center text-[11px] border border-slate-200 rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-400 outline-none"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}