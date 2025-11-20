import React, { useState, useEffect } from 'react';
import LevelEditor from './LevelEditor';
import LZString from 'lz-string';
import { MAZE_CONFIG } from '../../core/adapters/MazeAdapter';

export default function Builder() {
  // 1. CHARGEMENT : On essaie de lire la sauvegarde, sinon valeur par défaut
  const [campaign, setCampaign] = useState(() => {
    const saved = localStorage.getItem('blokaly_builder_autosave');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erreur de lecture sauvegarde", e);
      }
    }
    // Valeur par défaut si rien n'est trouvé
    return {
      title: "Ma Nouvelle Campagne",
      levels: [{
        id: 1,
        type: 'MAZE',
        grid: MAZE_CONFIG.defaultGrid,
        startPos: {x: 1, y: 1},
        maxBlocks: 5
      }]
    };
  });
  
  // Quel niveau est en train d'être édité ? (Index dans le tableau)
  // On vérifie que l'index existe toujours (cas de suppression)
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);

  // 2. SAUVEGARDE : À chaque changement de 'campaign', on écrit dans le storage
  useEffect(() => {
    localStorage.setItem('blokaly_builder_autosave', JSON.stringify(campaign));
  }, [campaign]);

  // --- ACTIONS ---

  const addLevel = () => {
    const newLevel = {
      id: campaign.levels.length + 1,
      type: 'MAZE',
      grid: [
          [4, 4, 4, 4, 4, 4, 4, 4],
          [4, 2, 1, 1, 1, 1, 3, 4],
          [4, 4, 4, 4, 4, 4, 4, 4],
          [4, 4, 4, 4, 4, 4, 4, 4],
          [4, 4, 4, 4, 4, 4, 4, 4]
      ],
      startPos: {x: 1, y: 1},
      maxBlocks: 10
    };
    setCampaign({ ...campaign, levels: [...campaign.levels, newLevel] });
    setCurrentLevelIndex(campaign.levels.length); // Basculer sur le nouveau
  };

  const deleteLevel = (index) => {
    if (campaign.levels.length <= 1) return alert("Il faut au moins un niveau !");
    const newLevels = campaign.levels.filter((_, i) => i !== index);
    setCampaign({ ...campaign, levels: newLevels });
    setCurrentLevelIndex(0);
  };

  const updateCurrentLevel = (newLevelData) => {
    const newLevels = [...campaign.levels];
    newLevels[currentLevelIndex] = newLevelData;
    setCampaign({ ...campaign, levels: newLevels });
  };

  const generateLink = () => {
    const json = JSON.stringify(campaign);
    const compressed = LZString.compressToEncodedURIComponent(json);
    const url = `${window.location.origin}/?data=${compressed}`;
    
    navigator.clipboard.writeText(url);
    alert("Lien copié ! Ouverture du test...");
    window.location.href = url;
  };

  return (
    <div className="builder-container" style={{display: 'flex', padding: 0, height: '100vh', overflow: 'hidden'}}>
      
      {/* SIDEBAR GAUCHE : Liste des niveaux */}
      <div style={{width: '250px', background: '#2c3e50', color: 'white', display: 'flex', flexDirection: 'column', borderRight: '1px solid #ccc'}}>
        <div style={{padding: '20px', background: '#1a252f'}}>
          <h2 style={{fontSize: '1.2rem', margin: 0}}>🗂️ Niveaux</h2>
        </div>
        
        <div style={{flex: 1, overflowY: 'auto'}}>
          {campaign.levels.map((lvl, index) => (
            <div 
              key={index}
              onClick={() => setCurrentLevelIndex(index)}
              style={{
                padding: '15px', 
                cursor: 'pointer',
                background: index === currentLevelIndex ? '#3498db' : 'transparent',
                borderBottom: '1px solid #34495e',
                display: 'flex', justifyContent: 'space-between'
              }}
            >
              <span>Niveau {index + 1}</span>
              {campaign.levels.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); deleteLevel(index); }} style={{background:'none', border:'none', color:'#e74c3c', cursor:'pointer'}}>🗑️</button>
              )}
            </div>
          ))}
        </div>

        {/* BOUTONS D'ACTION (Dans la sidebar) */}
        <div style={{padding: '10px', borderTop: '1px solid #34495e'}}>
            <button 
                onClick={addLevel} 
                style={{width: '100%', padding: '12px', background: '#27ae60', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px', borderRadius: '4px'}}
            >
            + Ajouter un niveau
            </button>

            <button 
                onClick={() => {
                    if(confirm("Attention, cela va effacer votre travail actuel et recharger la page !")) {
                    localStorage.removeItem('blokaly_builder_autosave');
                    window.location.reload();
                    }
                }} 
                style={{width: '100%', padding: '8px', background: 'none', border: '1px solid #e74c3c', color: '#e74c3c', cursor: 'pointer', fontSize: '0.8rem', borderRadius: '4px'}}
            >
            🗑️ Tout effacer (Reset)
            </button>
        </div>
      </div>

      {/* ZONE CENTRALE : Éditeur */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', height: '100%'}}>
        <div style={{padding: '10px 20px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background:'white'}}>
          <h2 style={{margin:0}}>Édition Niveau {currentLevelIndex + 1}</h2>
          <button onClick={generateLink} className="generate-btn" style={{margin: 0, width: 'auto', fontSize: '0.9rem'}}>
            🚀 GÉNÉRER CAMPAGNE
          </button>
        </div>

        <div style={{flex: 1, overflowY: 'auto', padding: '20px', background: '#f4f4f4'}}>
          {/* Sécurité : on s'assure que le niveau existe avant de l'afficher */}
          {campaign.levels[currentLevelIndex] ? (
            <LevelEditor 
                levelData={campaign.levels[currentLevelIndex]} 
                onUpdate={updateCurrentLevel} 
            />
          ) : (
            <div style={{padding: 20}}>Sélectionnez un niveau...</div>
          )}
        </div>
      </div>

    </div>
  );
}