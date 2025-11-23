import React, { useState, useEffect } from 'react';
import LZString from 'lz-string';
import Builder from './components/builder/Builder';
import Runner from './components/runner/Runner';
import Home from './components/Home'; // <--- NOUVEAU IMPORT
import './App.css';

function App() {
  // Modes : 'home', 'builder', 'runner', 'loading'
  const [mode, setMode] = useState('loading'); 
  const [campaignData, setCampaignData] = useState(null);
  const [ltiConfig, setLtiConfig] = useState(null);
  const [isPreview, setIsPreview] = useState(false);

  // Callback pour quand Home charge un fichier
  const handleFileLoaded = (data) => {
      setCampaignData(data);
      setMode('runner');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const encodedData = params.get('data');
    const jsonUrl = params.get('url');
    const ltiToken = params.get('lti_token');
    const gradeUrl = params.get('api_grade');
    const previewParam = params.get('preview');
    
    // NOUVEAU : Paramètre explicite pour l'éditeur
    const isEditorMode = params.get('mode') === 'editor'; 

    const initApp = async () => {
      try {
        if (previewParam) setIsPreview(true);

        // 1. MODE LTI (Prioritaire)
        if (ltiToken && jsonUrl) {
            console.log("🎓 Mode LTI");
            setLtiConfig({ token: ltiToken, apiUrl: gradeUrl });
            const response = await fetch(jsonUrl);
            if (!response.ok) throw new Error("URL campagne invalide");
            setCampaignData(await response.json());
            setMode('runner');
        } 
        // 2. MODE LIEN JSON
        else if (jsonUrl) {
            console.log("🔗 Mode Lien JSON");
            const response = await fetch(jsonUrl);
            if (!response.ok) throw new Error("Fichier introuvable");
            setCampaignData(await response.json());
            setMode('runner');
        }
        // 3. MODE LIEN COMPRESSÉ
        else if (encodedData) {
            console.log("📦 Mode LZString");
            const jsonStr = LZString.decompressFromEncodedURIComponent(encodedData);
            setCampaignData(JSON.parse(jsonStr));
            setMode('runner');
        }
        // 4. MODE ÉDITEUR EXPLICITE (?mode=editor)
        else if (isEditorMode) {
            console.log("🛠️ Mode Éditeur");
            setMode('builder');
        }
        // 5. PAR DÉFAUT -> ACCUEIL
        else {
            console.log("🏠 Accueil");
            setMode('home');
        }

      } catch (e) {
        console.error("Erreur init:", e);
        alert("Erreur : " + e.message);
        setMode('home'); // En cas d'erreur, retour à l'accueil
      }
    };

    initApp();
  }, []);

  if (mode === 'loading') return <div style={{padding:20, textAlign:'center'}}>Chargement...</div>;

  return (
    <div className="App">
      {mode === 'home' && (
          <Home onFileLoaded={handleFileLoaded} />
      )}

      {mode === 'builder' && (
        <Builder />
      )}

      {mode === 'runner' && (
        <Runner 
            campaign={campaignData} 
            ltiConfig={ltiConfig}
            isTeacherMode={isPreview}
        />
      )}
    </div>
  );
}

export default App;