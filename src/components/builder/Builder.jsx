import React, { useState, useEffect, useRef } from 'react';
import LevelEditor from './LevelEditor';
import LZString from 'lz-string';
import { MAZE_CONFIG } from '../../core/adapters/MazeAdapter';

// Définition des types disponibles avec leurs blocs par défaut
const LEVEL_TYPES = [
  { 
    id: 'MAZE', label: 'Labyrinthe', icon: '🏰',
    defaultBlocks: ['maze_move_forward', 'maze_turn', 'maze_forever', 'maze_if'] 
  },
  { 
    id: 'TURTLE', label: 'Tortue', icon: '🐢',
    defaultBlocks: ['turtle_move', 'turtle_turn', 'turtle_pen', 'turtle_color', 'controls_repeat_ext']
  },
  { 
    id: 'MATH', label: 'Labo', icon: '🧪',
    defaultBlocks: ['variables_set', 'math_number', 'math_arithmetic', 'text_print']
  },
  { 
    id: 'EQUATION', label: 'Équation', icon: '⚖️',
    defaultBlocks: ['equation_op_both', 'math_number']
  }
];

const LEVEL_ICONS = {
  'MAZE': '🏰', 'TURTLE': '🐢', 'MATH': '🧪', 'EQUATION': '⚖️'
};

export default function Builder() {
  const [campaign, setCampaign] = useState(() => {
    const saved = localStorage.getItem('blokaly_builder_autosave');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      title: "Ma Nouvelle Campagne",
      levels: [{
        id: 1, 
        type: 'MAZE', 
        grid: MAZE_CONFIG.defaultGrid, 
        startPos: {x: 1, y: 1}, 
        maxBlocks: 5,
        allowedBlocks: LEVEL_TYPES[0].defaultBlocks // Important : Blocs par défaut
      }]
    };
  });
  
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('blokaly_builder_autosave', JSON.stringify(campaign));
  }, [campaign]);

  // --- LOGIQUE MÉTIER ---

  const updateCurrentLevel = (newLevelData) => {
    const newLevels = [...campaign.levels];
    newLevels[currentLevelIndex] = newLevelData;
    setCampaign({ ...campaign, levels: newLevels });
  };

  const handleTypeChange = (newType) => {
    const currentLevel = campaign.levels[currentLevelIndex];
    if (currentLevel.type === newType) return;

    const typeDef = LEVEL_TYPES.find(t => t.id === newType);
    
    let newDefaults = {};
    if (newType === 'MAZE') {
        newDefaults = { grid: MAZE_CONFIG.defaultGrid, startPos: { x: 1, y: 1, dir: 1 }, maxBlocks: 10 };
    } else if (newType === 'TURTLE') {
        newDefaults = { startPos: { x: 0, y: 0, dir: 0 }, maxBlocks: 10, grid: undefined };
    } else if (newType === 'MATH') {
        newDefaults = { maxBlocks: 20, startPos: undefined };
    } else if (newType === 'EQUATION') {
        newDefaults = { equation: { a: 2, b: 4, c: 0, d: 10, lhs: "2*x+4", rhs: "10" }, maxBlocks: 5 };
    }

    if(confirm(`Passer en mode ${typeDef.label} ? Cela réinitialisera ce niveau.`)) {
        updateCurrentLevel({ 
            ...currentLevel, 
            type: newType, 
            allowedBlocks: typeDef.defaultBlocks, // Reset toolbox avec les bons blocs
            startBlocks: '<xml></xml>', // Reset code élève
            solutionBlocks: '<xml></xml>', // Reset solution
            ...newDefaults 
        });
    }
  };

  // --- DRAG & DROP ---
  const handleDragStart = (e, pos) => { dragItem.current = pos; };
  const handleDragEnter = (e, pos) => { dragOverItem.current = pos; e.preventDefault(); };
  const handleDragEnd = () => {
    const start = dragItem.current; const end = dragOverItem.current;
    if (start !== null && end !== null && start !== end) {
        const list = [...campaign.levels]; const item = list[start];
        list.splice(start, 1); list.splice(end, 0, item);
        setCampaign({ ...campaign, levels: list });
        setCurrentLevelIndex(end);
    }
    dragItem.current = null; dragOverItem.current = null;
  };

  // --- ACTIONS CRUD ---
  const addLevel = () => {
    const defaultType = LEVEL_TYPES[0]; // Maze par défaut
    const newLevel = { 
        id: Date.now(), 
        type: defaultType.id, 
        grid: MAZE_CONFIG.defaultGrid, 
        startPos: {x: 1, y: 1}, 
        maxBlocks: 10,
        allowedBlocks: defaultType.defaultBlocks // <--- FIX : Blocs par défaut
    };
    setCampaign({ ...campaign, levels: [...campaign.levels, newLevel] });
    setCurrentLevelIndex(campaign.levels.length); 
  };

  const duplicateLevel = (idx) => {
    const copy = { ...JSON.parse(JSON.stringify(campaign.levels[idx])), id: Date.now() };
    const list = [...campaign.levels]; list.splice(idx + 1, 0, copy);
    setCampaign({ ...campaign, levels: list });
    setCurrentLevelIndex(idx + 1);
  };

  const deleteLevel = (idx) => {
    if (campaign.levels.length <= 1) return alert("Impossible de supprimer le dernier niveau !");
    const list = campaign.levels.filter((_, i) => i !== idx);
    setCampaign({ ...campaign, levels: list });
    if (idx <= currentLevelIndex) setCurrentLevelIndex(Math.max(0, currentLevelIndex - 1));
  };

  // --- IMPORT / EXPORT ---
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(campaign, null, 2)], { type: "application/json" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${campaign.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.blokaly.json`;
    link.click();
  };

  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const r = new FileReader(); 
      r.onload = (ev) => { 
          try { 
              const json = JSON.parse(ev.target.result);
              if (!json.levels || !Array.isArray(json.levels)) throw new Error("Format invalide (pas de niveaux)");
              
              if(confirm(`Charger la campagne "${json.title || 'Sans titre'}" ?`)) {
                  setCampaign(json); 
                  setCurrentLevelIndex(0); 
              }
          } catch(err) { 
              alert("Erreur lors du chargement : " + err.message); 
          }
      }; 
      r.readAsText(file);
      e.target.value = null; // <--- FIX : Permet de recharger le même fichier
  };

  const generateLink = () => {
    const url = new URL(window.location.href);
    url.search = `?data=${LZString.compressToEncodedURIComponent(JSON.stringify(campaign))}&preview=1`;
    window.open(url.toString(), '_blank');
  };

  const currentLevel = campaign.levels[currentLevelIndex];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      
      {/* SIDEBAR GAUCHE */}
      <div className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 flex-shrink-0 z-20">
        <div className="p-6 bg-slate-950 border-b border-slate-800">
          <label className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1 block">Campagne</label>
          <input 
            type="text" value={campaign.title} 
            onChange={(e) => setCampaign({...campaign, title: e.target.value})}
            className="bg-transparent border-none text-lg font-bold text-white w-full focus:ring-0 placeholder-slate-600 p-0"
            placeholder="Titre..."
          />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {campaign.levels.map((lvl, index) => (
            <div 
              key={lvl.id} draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()} 
              onClick={() => setCurrentLevelIndex(index)}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border border-transparent ${index === currentLevelIndex ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                  <span className="cursor-grab opacity-50">⋮⋮</span>
                  <span className="text-lg">{LEVEL_ICONS[lvl.type] || '❓'}</span>
                  <span className="truncate text-sm font-medium">Niveau {index + 1}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={(e) => {e.stopPropagation(); duplicateLevel(index)}} className="p-1 hover:bg-white/20 rounded" title="Dupliquer">📑</button>
                  {campaign.levels.length > 1 && <button onClick={(e) => {e.stopPropagation(); deleteLevel(index)}} className="p-1 hover:bg-red-500/20 text-red-400 rounded" title="Supprimer">🗑️</button>}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col gap-2">
            <button onClick={addLevel} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs flex justify-center gap-2"><span>+</span> Nouveau Niveau</button>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={handleExport} className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors">📤 Export</button>
                <button onClick={() => fileInputRef.current.click()} className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors">📥 Import</button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".json" />
        </div>
      </div>

      {/* ZONE PRINCIPALE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* HEADER */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-6">
             <h2 className="text-lg font-bold text-slate-700 whitespace-nowrap">
                Niveau {currentLevelIndex + 1}
             </h2>
             
             <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                {LEVEL_TYPES.map(type => {
                    const isActive = currentLevel?.type === type.id;
                    return (
                        <button
                            key={type.id}
                            onClick={() => handleTypeChange(type.id)}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all
                                ${isActive 
                                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                            `}
                        >
                            <span>{type.icon}</span>
                            <span className="hidden xl:inline">{type.label}</span>
                        </button>
                    );
                })}
             </div>
          </div>
          
          <button 
            onClick={generateLink} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-xs shadow transition-all flex items-center gap-2"
          >
            🚀 TESTER
          </button>
        </div>

        {/* CONTENU */}
        <div className="flex-1 overflow-hidden p-6 bg-slate-50">
          {currentLevel ? (
            <LevelEditor 
                key={currentLevel.id} 
                levelData={currentLevel} 
                onUpdate={updateCurrentLevel} 
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">Sélectionnez un niveau...</div>
          )}
        </div>
      </div>
    </div>
  );
}