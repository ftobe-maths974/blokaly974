import React, { useState, useEffect } from 'react';
import LZString from 'lz-string';
import Builder from './components/builder/Builder';
import Runner from './components/runner/Runner';
import './App.css'; // On garde le css par défaut pour l'instant

function App() {
  const [mode, setMode] = useState('loading'); // 'builder' ou 'runner'
  const [campaignData, setCampaignData] = useState(null);

  useEffect(() => {
    // Regarder l'URL
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get('data');

    if (encodedData) {
      try {
        console.log("Chargement des données compressées...");
        const json = LZString.decompressFromEncodedURIComponent(encodedData);
        const data = JSON.parse(json);
        setCampaignData(data);
        setMode('runner');
      } catch (e) {
        console.error("Erreur de lecture", e);
        setMode('builder');
      }
    } else {
      setMode('builder');
    }
  }, []);

  if (mode === 'loading') return <div>Chargement...</div>;

  return (
    <div className="App">
      {mode === 'builder' ? (
        <Builder />
      ) : (
        <Runner campaign={campaignData} />
      )}
    </div>
  );
}

export default App;