import React from 'react';

export default function FeedbackModal({ isOpen, stats, token, onReplay, onMenu, onNext }) {
  if (!isOpen) return null;

  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < 3; i++) {
      stars.push(
        <span key={i} style={{ 
          fontSize: '40px', 
          color: i < stats.stars ? '#f1c40f' : '#bdc3c7',
          textShadow: i < stats.stars ? '0 0 10px #f39c12' : 'none'
        }}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h1 style={{margin: 0, color: '#27ae60'}}>Niveau Terminé !</h1>
        
        <div style={{margin: '10px 0'}}>
          {renderStars()}
        </div>

        <div style={styles.stats}>
          <p>🧱 Blocs utilisés : <strong>{stats.blockCount}</strong> / {stats.target}</p>
          <p>{stats.stars === 3 ? "✨ Code Parfait !" : "💡 Tu peux optimiser..."}</p>
        </div>

        <div style={styles.proofSection}>
          <p style={{fontSize: '0.9em', marginBottom: '5px'}}>🔑 Code de preuve (à donner au prof) :</p>
          <div style={styles.tokenBox}>
            {token}
          </div>
          <button 
            onClick={() => navigator.clipboard.writeText(token)}
            style={styles.copyBtn}
          >
            Copier le code
          </button>
        </div>

        <div style={styles.actions}>
          <button onClick={onReplay} style={styles.replayBtn}>
            🔄 Rejouer pour améliorer
          </button>
          
          {/* NOUVEAU : Bouton Menu */}
          <button onClick={onMenu} style={{...styles.replayBtn, background: '#95a5a6', marginLeft: '10px'}}>
                   ☰ Menu
          </button>

          {/* NOUVEAU : Bouton Suivant (seulement si onNext existe) */}
          {onNext && (
            <button onClick={onNext} style={{...styles.replayBtn, background: '#27ae60', marginLeft: '10px'}}>
              ⏩ Suivant
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000, backdropFilter: 'blur(4px)'
  },
  modal: {
    backgroundColor: 'white', padding: '30px', borderRadius: '15px',
    width: '400px', textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },
  stats: {
    backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px',
    margin: '15px 0', border: '1px solid #eee'
  },
  proofSection: {
    margin: '20px 0', padding: '15px',
    border: '2px dashed #3498db', borderRadius: '8px',
    backgroundColor: '#ebf5fb'
  },
  tokenBox: {
    fontFamily: 'monospace', background: 'white', padding: '8px',
    border: '1px solid #ccc', borderRadius: '4px',
    overflowWrap: 'break-word', fontSize: '12px',
    marginBottom: '8px'
  },
  copyBtn: {
    background: '#3498db', color: 'white', border: 'none',
    padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem'
  },
  replayBtn: {
    background: '#e67e22', color: 'white', border: 'none',
    padding: '10px 20px', borderRadius: '5px', cursor: 'pointer',
    fontSize: '1rem', fontWeight: 'bold'
  }
};
