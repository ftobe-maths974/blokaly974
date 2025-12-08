import React, { useState, useEffect } from 'react';
import LZString from 'lz-string';
import Builder from './components/builder/Builder';
import Runner from './components/runner/Runner';
import Home from './components/Home';
import './App.css';

function App() {
  // Modes : 'home', 'builder', 'runner', 'loading'
  const [mode, setMode] = useState('loading'); 
  const [campaignData, setCampaignData] = useState(null);
  const [ltiConfig, setLtiConfig] = useState(null);
  
  // RÔLES
  const [isTeacher, setIsTeacher] = useState(false);
  
  // ÉTAT MANQUANT QUI CAUSAIT L'ERREUR
  const [startLevelIndex, setStartLevelIndex] = useState(0);

  // 1. Un élève charge un fichier depuis l'accueil
  const handleFileLoaded = (data) => {
      setCampaignData(data);
      setIsTeacher(false); 
      setStartLevelIndex(0); // On commence au début
      setMode('runner');
  };

  // 2. Le prof teste depuis le Builder
  const handleTeacherTest = (currentCampaignData, levelIndex = 0) => {
      setCampaignData(currentCampaignData);
      setStartLevelIndex(levelIndex); // On saute au niveau en cours d'édition
      setMode('runner');
      // On laisse isTeacher à true (défini à l'init)
  };

  // 3. Retour à l'atelier
  const handleBackToBuilder = () => {
      setMode('builder');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const encodedData = params.get('data');
    const jsonUrl = params.get('url');
    const ltiToken = params.get('lti_token');
    const gradeUrl = params.get('api_grade');
    
    // Détection explicite du mode éditeur
    const isEditorMode = params.get('mode') === 'editor'; 

    const initApp = async () => {
      try {
        // A. MODE PROFESSEUR
        if (isEditorMode) {
            console.log("🛠️ Mode Enseignant activé");
            setIsTeacher(true);
            setMode('builder');
        }
        // B. MODE LTI (Élève noté)
        else if (ltiToken && jsonUrl) {
            console.log("🎓 Mode Élève LTI");
            setLtiConfig({ token: ltiToken, apiUrl: gradeUrl });
            const response = await fetch(jsonUrl);
            if (!response.ok) throw new Error("URL campagne invalide");
            setCampaignData(await response.json());
            setIsTeacher(false);
            setMode('runner');
        } 
        // C. MODE PARTAGE (Lien public)
        else if (jsonUrl) {
            console.log("🔗 Mode Élève (Lien)");
            const response = await fetch(jsonUrl);
            if (!response.ok) throw new Error("Fichier introuvable");
            setCampaignData(await response.json());
            setIsTeacher(false); 
            setMode('runner');
        }
        // D. MODE LZSTRING (Anciens liens)
        else if (encodedData) {
            console.log("📦 Mode LZString");
            const jsonStr = LZString.decompressFromEncodedURIComponent(encodedData);
            setCampaignData(JSON.parse(jsonStr));
            setIsTeacher(false);
            setMode('runner');
        }
        // E. PAR DÉFAUT -> ACCUEIL
        else {
            console.log("🏠 Accueil");
            setIsTeacher(false);
            setMode('home');
        }

      } catch (e) {
        console.error("Erreur init:", e);
        alert("Erreur : " + e.message);
        setMode('home');
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
        <Builder 
            onTest={handleTeacherTest} // Passe la fonction au Builder
        />
      )}

      {mode === 'runner' && (
        <Runner 
            campaign={campaignData} 
            ltiConfig={ltiConfig}
            isTeacherMode={isTeacher} 
            onBackToBuilder={handleBackToBuilder}
            initialLevelIndex={startLevelIndex} // Passe l'index de départ
        />
      )}
    </div>
  );
}

export default App;