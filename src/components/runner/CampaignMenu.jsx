import React from 'react';

export default function CampaignMenu({ campaign, progress, onSelectLevel }) {
  // progress est un objet : { 0: {stars: 3}, 1: {stars: 1} ... }

  return (
    // 👇 MODIF : Largeur augmentée (1200px) et responsive (95%)
    <div style={{
        padding: '40px', 
        maxWidth: '1200px', 
        width: '95%', 
        margin: '0 auto', 
        fontFamily: 'sans-serif',
        boxSizing: 'border-box'
    }}>
      <h1 style={{textAlign: 'center', color: '#2c3e50', fontSize: '2.5rem'}}>
        🗺️ {campaign.title || "Aventure Blokaly"}
      </h1>
      
      <div style={{
        display: 'grid', 
        // 👇 MODIF : Tuiles un peu plus larges (160px) pour l'esthétique
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
        gap: '24px', 
        marginTop: '40px'
      }}>
        {campaign.levels.map((level, index) => {
          // LOGIQUE DE VERROUILLAGE
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
                borderRadius: '20px', // Plus rond
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                opacity: isUnlocked ? 1 : 0.6,
                transition: 'transform 0.2s, box-shadow 0.2s',
                // 👇 Petit effet hover inline
                transform: 'scale(1)',
              }}
              onMouseEnter={(e) => { if(isUnlocked) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)'; } }}
              onMouseLeave={(e) => { if(isUnlocked) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; } }}
            >
              <span style={{fontSize: '2.5rem', marginBottom: '8px'}}>
                {isUnlocked ? (stars > 0 ? '✅' : '🚀') : '🔒'}
              </span>
              <span style={{fontSize: '1.1rem', fontWeight: 'bold', color: 'white'}}>
                Niveau {index + 1}
              </span>
              
              {/* Affichage des étoiles acquises */}
              {isUnlocked && (
                <div style={{marginTop: '8px', color: 'white', fontSize: '1.2rem', textShadow: '0 1px 2px rgba(0,0,0,0.3)'}}>
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