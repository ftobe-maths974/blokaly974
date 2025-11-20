import React from 'react';

export default function CampaignMenu({ campaign, progress, onSelectLevel }) {
  // progress est un objet : { 0: {stars: 3}, 1: {stars: 1} ... } (Clés = Index des niveaux)

  return (
    <div style={{padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif'}}>
      <h1 style={{textAlign: 'center', color: '#2c3e50', fontSize: '2.5rem'}}>
        🗺️ {campaign.title || "Aventure Blokaly"}
      </h1>
      
      <div style={{
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
        gap: '20px', 
        marginTop: '40px'
      }}>
        {campaign.levels.map((level, index) => {
          // LOGIQUE DE VERROUILLAGE
          // Le niveau 0 est toujours ouvert.
          // Le niveau N est ouvert si le niveau N-1 a au moins 1 étoile.
          const prevLevelScore = progress[index - 1];
          const isUnlocked = index === 0 || (prevLevelScore && prevLevelScore.stars > 0);
          
          const currentScore = progress[index];
          const stars = currentScore ? currentScore.stars : 0;

          return (
            <button
              key={index}
              disabled={!isUnlocked}
              onClick={() => onSelectLevel(index)}
              style={{
                aspectRatio: '1/1',
                background: isUnlocked ? (stars === 3 ? '#2ecc71' : '#f1c40f') : '#bdc3c7',
                border: 'none',
                borderRadius: '15px',
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                opacity: isUnlocked ? 1 : 0.6,
                transition: 'transform 0.2s'
              }}
            >
              <span style={{fontSize: '2rem', marginBottom: '10px'}}>
                {isUnlocked ? (stars > 0 ? '✅' : '🚀') : '🔒'}
              </span>
              <span style={{fontSize: '1.2rem', fontWeight: 'bold', color: 'white'}}>
                Niveau {index + 1}
              </span>
              
              {/* Affichage des étoiles acquises */}
              {isUnlocked && (
                <div style={{marginTop: '10px', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>
                  {'★'.repeat(stars)}{'☆'.repeat(3 - stars)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
