import React, { useState, useEffect, useRef } from 'react';
import LevelEditor from './LevelEditor';
import LZString from 'lz-string';

// ✅ On utilise le Registre (plus d'import de MazeFeature ici !)
import { getPlugin, getAllPlugins } from '../../core/PluginRegistry';

const getLevelIcon = (type) => {
    const p = getPlugin(type);
    return p ? p.icon : '❓';
};

export default function Builder({ onTest }) {
  // 1. CHARGEMENT
  const [campaign, setCampaign] = useState(() => {
    const saved = localStorage.getItem('blokaly_builder_autosave');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    
    const defaultPlugin = getAllPlugins()[0]; 
    return {
      title: "Ma Nouvelle Campagne",
      levels: [{
        id: 1,
        type: defaultPlugin ? defaultPlugin.id : 'MAZE',
        grid: defaultPlugin?.config?.defaultGrid,
        startPos: {x: 1, y: 1},
        maxBlocks: 5
      }]
    };
  });
  
  // Unique déclaration de l'état
  const [currentLevelIndex, setCurrentLevelIndex] = useState(() => {
      const savedIndex = sessionStorage.getItem('blokaly_editor_last_level');
      return savedIndex ? parseInt(savedIndex, 10) : 0;
  });
  
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('blokaly_builder_autosave', JSON.stringify(campaign));
  }, [campaign]);

  // ... (Fonctions Drag & Drop inchangées : handleDragStart, handleDragEnter, handleDragEnd) ...
  const handleDragStart = (e, position) => { dragItem.current = position; e.dataTransfer.effectAllowed = "move"; };
  const handleDragEnter = (e, position) => { dragOverItem.current = position; e.preventDefault(); };
  const handleDragEnd = () => {
    const startIdx = dragItem.current; const endIdx = dragOverItem.current;
    if (startIdx !== null && endIdx !== null && startIdx !== endIdx) {
        const newLevels = [...campaign.levels];
        const draggedLevel = newLevels[startIdx];
        newLevels.splice(startIdx, 1);
        newLevels.splice(endIdx, 0, draggedLevel);
        if (currentLevelIndex === startIdx) setCurrentLevelIndex(endIdx);
        else if (currentLevelIndex > startIdx && currentLevelIndex <= endIdx) setCurrentLevelIndex(currentLevelIndex - 1);
        else if (currentLevelIndex < startIdx && currentLevelIndex >= endIdx) setCurrentLevelIndex(currentLevelIndex + 1);
        setCampaign({ ...campaign, levels: newLevels });
    }
    dragItem.current = null; dragOverItem.current = null;
  };

  // ... (Fonctions Import/Export inchangées : handleExport, handleImportClick, handleFileChange) ...
  const handleExport = () => { const dataStr = JSON.stringify(campaign, null, 2); const blob = new Blob([dataStr], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.download = `${campaign.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.blokaly.json`; link.href = url; link.click(); URL.revokeObjectURL(url); };
  const handleImportClick = () => { if (fileInputRef.current) fileInputRef.current.click(); };
  const handleFileChange = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (event) => { try { const json = JSON.parse(event.target.result); if (!json.levels || !Array.isArray(json.levels)) throw new Error("Format invalide"); if (confirm(`Charger "${json.title}" ?`)) { setCampaign(json); setCurrentLevelIndex(0); } } catch (err) { alert("Erreur : " + err.message); } }; reader.readAsText(file); e.target.value = null; };

  // --- ACTIONS CRUD (C'est là qu'il y avait l'erreur) ---

  const addLevel = () => {
    // 👇 CORRECTION : On cherche le plugin via le registre, pas via MazeFeature direct
    const defaultPlugin = getPlugin('MAZE') || getAllPlugins()[0];
    
    const newLevel = {
      id: Date.now(), 
      type: defaultPlugin ? defaultPlugin.id : 'MAZE',
      // 👇 UTILISATION DE LA CONFIG DU PLUGIN TROUVÉ
      grid: defaultPlugin?.config?.defaultGrid,
      startPos: {x: 1, y: 1},
      maxBlocks: 10
    };
    setCampaign({ ...campaign, levels: [...campaign.levels, newLevel] });
    setCurrentLevelIndex(campaign.levels.length); 
  };

  const duplicateLevel = (index) => {
    const levelToCopy = campaign.levels[index];
    const newLevel = { ...JSON.parse(JSON.stringify(levelToCopy)), id: Date.now() };
    const newLevels = [...campaign.levels];
    newLevels.splice(index + 1, 0, newLevel);
    setCampaign({ ...campaign, levels: newLevels });
    setCurrentLevelIndex(index + 1);
  };

  const deleteLevel = (index) => {
    if (campaign.levels.length <= 1) return alert("Il faut au moins un niveau !");
    const newLevels = campaign.levels.filter((_, i) => i !== index);
    if (index < currentLevelIndex) setCurrentLevelIndex(currentLevelIndex - 1);
    else if (index === currentLevelIndex) setCurrentLevelIndex(Math.max(0, index - 1));
    setCampaign({ ...campaign, levels: newLevels });
  };

  const updateCurrentLevel = (newLevelData) => {
    const newLevels = [...campaign.levels];
    newLevels[currentLevelIndex] = newLevelData;
    setCampaign({ ...campaign, levels: newLevels });
  };

  const handleQuickTest = () => {
      localStorage.setItem('blokaly_builder_autosave', JSON.stringify(campaign));
      sessionStorage.setItem('blokaly_editor_last_level', currentLevelIndex);
      if (onTest) onTest(campaign, currentLevelIndex);
  };

  const generateLink = () => {
    const json = JSON.stringify(campaign);
    const compressed = LZString.compressToEncodedURIComponent(json);
    const url = new URL(window.location.href);
    url.search = `?data=${compressed}`; 
    url.hash = ''; 
    prompt("Lien à partager :", url.toString());
  };

  return (
    <div className="builder-container" style={{display: 'flex', padding: 0, height: '100vh', overflow: 'hidden'}}>
      
      {/* SIDEBAR GAUCHE */}
      <div style={{width: '250px', background: '#2c3e50', color: 'white', display: 'flex', flexDirection: 'column', borderRight: '1px solid #ccc'}}>
        <div style={{padding: '20px', background: '#1a252f'}}>
          <h2 style={{fontSize: '1.2rem', margin: 0}}>🗂️ Campagne</h2>
          <input type="text" value={campaign.title} onChange={(e) => setCampaign({...campaign, title: e.target.value})} style={{background: 'transparent', border: 'none', borderBottom: '1px solid #555', color: 'white', width: '100%', marginTop: '10px', fontSize: '0.9rem'}} placeholder="Titre..." />
        </div>
        
        <div style={{flex: 1, overflowY: 'auto'}}>
          {campaign.levels.map((lvl, index) => (
            <div key={lvl.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()} onClick={() => setCurrentLevelIndex(index)}
              style={{ padding: '15px', cursor: 'grab', background: index === currentLevelIndex ? '#3498db' : 'transparent', borderBottom: '1px solid #34495e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <span style={{color: '#555', fontSize: '1.2rem'}}>⋮</span>
                  <span style={{fontSize: '1.2rem'}} title={lvl.type}>{getLevelIcon(lvl.type)}</span>
                  <span style={{fontWeight: index === currentLevelIndex ? 'bold' : 'normal'}}>Niveau {index + 1}</span>
              </div>
              <div style={{display: 'flex', gap: '5px'}}>
                  <button onClick={(e) => { e.stopPropagation(); duplicateLevel(index); }} style={{background:'none', border:'none', cursor:'pointer', fontSize:'0.8rem', opacity: 0.7}}>📑</button>
                  {campaign.levels.length > 1 && ( <button onClick={(e) => { e.stopPropagation(); deleteLevel(index); }} style={{background:'none', border:'none', color:'#e74c3c', cursor:'pointer', fontSize:'0.8rem', opacity: 0.7}}>🗑️</button> )}
              </div>
            </div>
          ))}
        </div>

        <div style={{padding: '10px', borderTop: '1px solid #34495e', background: '#222', display:'flex', flexDirection:'column', gap:'10px'}}>
            <button onClick={addLevel} style={{width: '100%', padding: '10px', background: '#27ae60', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px'}}>+ Nouveau Niveau</button>
            <div style={{display:'flex', gap:'10px'}}>
                <button onClick={handleExport} style={{flex:1, padding: '8px', background: '#34495e', color: 'white', border: '1px solid #7f8c8d', cursor: 'pointer', fontSize: '0.8rem', borderRadius: '4px'}}>📤 Export</button>
                <button onClick={handleImportClick} style={{flex:1, padding: '8px', background: '#34495e', color: 'white', border: '1px solid #7f8c8d', cursor: 'pointer', fontSize: '0.8rem', borderRadius: '4px'}}>📥 Import</button>
                <input type="file" accept=".json" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileChange} />
            </div>
            <button onClick={() => { if(confirm("Tout effacer ?")) { localStorage.removeItem('blokaly_builder_autosave'); window.location.reload(); }}} style={{width: '100%', padding: '8px', background: 'none', border: '1px solid #c0392b', color: '#c0392b', cursor: 'pointer', fontSize: '0.8rem', borderRadius: '4px'}}>🗑️ Reset</button>
        </div>
      </div>

      {/* ZONE CENTRALE */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', height: '100%'}}>
        <div style={{padding: '10px 20px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background:'white'}}>
          <h2 style={{margin:0, color: '#2c3e50'}}>
             Édition Niveau {currentLevelIndex + 1} <span style={{fontSize: '0.6em', color: '#777', marginLeft: '10px', fontWeight: 'normal'}}>({campaign.levels[currentLevelIndex]?.type})</span>
          </h2>
          <div style={{display:'flex', gap:'10px'}}>
              <button onClick={handleQuickTest} style={{margin: 0, fontSize: '0.9rem', background: '#27ae60', padding: '8px 15px', border:'none', color:'white', fontWeight:'bold', cursor:'pointer', borderRadius:'4px'}}>▶️ TESTER (Mode Élève)</button>
              <button onClick={generateLink} style={{margin: 0, fontSize: '0.9rem', background: '#3498db', padding: '8px 15px', border:'none', color:'white', fontWeight:'bold', cursor:'pointer', borderRadius:'4px'}}>🔗 Partager</button>
          </div>
        </div>
        <div style={{flex: 1, overflowY: 'auto', padding: '20px', background: '#f4f4f4'}}>
          {campaign.levels[currentLevelIndex] ? (
            <LevelEditor key={campaign.levels[currentLevelIndex].id} levelData={campaign.levels[currentLevelIndex]} onUpdate={updateCurrentLevel} />
          ) : ( <div style={{padding: 20, textAlign: 'center', color: '#777'}}>Sélectionnez ou créez un niveau...</div> )}
        </div>
      </div>
    </div>
  );
}