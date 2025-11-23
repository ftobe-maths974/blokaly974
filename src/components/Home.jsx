import React, { useRef } from 'react';

export default function Home({ onFileLoaded }) {
  const fileInputRef = useRef(null);

  // Gestion du chargement de fichier local
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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🧩 Blokaly 974</h1>
        <p style={styles.subtitle}>La plateforme d'algorithmique pour le collège.</p>

        <div style={styles.section}>
          <h3>📂 J'ai un fichier d'exercice</h3>
          <button onClick={() => fileInputRef.current.click()} style={styles.btnPrimary}>
            📥 Charger un fichier .blokaly (.json)
          </button>
          <input 
            type="file" accept=".json" ref={fileInputRef} 
            style={{display:'none'}} onChange={handleFileChange} 
          />
        </div>

        <div style={styles.section}>
          <h3>🚀 Essayer un exemple</h3>
          <div style={styles.examplesGrid}>
             <button 
                onClick={() => window.location.href = '?url=examples/campagne_de_tests.blokaly.json'} 
                style={styles.btnSecondary}
             >
                🏰 Campagne Démo (Maze & Tortue)
             </button>
          </div>
        </div>

        {/* ZONE PROFESSEUR "CACHÉE" */}
        <div style={{marginTop: '50px', borderTop: '1px solid #f0f0f0', paddingTop: '10px', textAlign: 'center'}}>
          <details>
            <summary style={{
                fontSize: '0.8rem', color: '#dcdcdc', cursor: 'pointer', 
                listStyle: 'none', userSelect: 'none', transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#aaa'}
            onMouseLeave={(e) => e.target.style.color = '#dcdcdc'}
            >
                ( Accès Enseignant )
            </summary>
            
            <div style={{marginTop: '15px', paddingBottom: '10px', animation: 'fadeIn 0.3s'}}>
                <p style={{fontSize: '0.85rem', color: '#95a5a6', marginBottom: '10px'}}>
                    Créer ou modifier des parcours pédagogiques :
                </p>
                <button 
                    onClick={() => window.location.href = '?mode=editor'} 
                    style={styles.btnTertiary}
                >
                    🛠️ Ouvrir l'Atelier
                </button>
            </div>
          </details>
        </div>
      </div>
      
      {/* CSS pour cacher la flèche par défaut du <details> */}
      <style>{`
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', fontFamily: 'sans-serif'
  },
  card: {
    background: 'white', padding: '40px', borderRadius: '15px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center',
    maxWidth: '500px', width: '90%'
  },
  title: { color: '#2c3e50', margin: '0 0 10px 0', fontSize: '2.5rem' },
  subtitle: { color: '#7f8c8d', margin: '0 0 30px 0', fontSize: '1.1rem' },
  section: { marginBottom: '25px' },
  btnPrimary: {
    background: '#3498db', color: 'white', border: 'none', padding: '12px 25px',
    fontSize: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
    width: '100%', transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(52, 152, 219, 0.3)'
  },
  btnSecondary: {
    background: 'white', color: '#2c3e50', border: '2px solid #eee', padding: '10px',
    fontSize: '0.9rem', borderRadius: '8px', cursor: 'pointer', width: '100%'
  },
  btnTertiary: {
    background: '#f8f9fa', color: '#7f8c8d', border: '1px solid #ddd', padding: '8px 20px',
    fontSize: '0.85rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
  },
  examplesGrid: { display: 'flex', flexDirection: 'column', gap: '10px' }
};