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
  
  // RÔLES : Est-ce un prof connecté ?
  const [isTeacher, setIsTeacher] = useState(false);

  // Callback pour quand Home charge un fichier (Mode Élève par défaut)
  const handleFileLoaded = (data) => {
      setCampaignData(data);
      setIsTeacher(false); // C'est un élève qui charge un fichier
      setMode('runner');
  };

  const handleTeacherTest = (currentCampaignData, levelIndex = 0) => {
      setCampaignData(currentCampaignData);
      setStartLevelIndex(levelIndex); // On stocke l'index demandé
      setMode('runner');
  };

  const handleBackToBuilder = () => {
      setMode('builder');
      // Le Builder lira sessionStorage pour retrouver son index
  };
  

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const encodedData = params.get('data');
    const jsonUrl = params.get('url');
    const ltiToken = params.get('lti_token');
    const gradeUrl = params.get('api_grade');
    const previewParam = params.get('preview'); // Ancienne méthode
    
    const isEditorMode = params.get('mode') === 'editor'; 

    const initApp = async () => {
      try {
        // 1. MODE PROFESSEUR (Éditeur)
        if (isEditorMode) {
            console.log("🛠️ Mode Enseignant activé");
            setIsTeacher(true);
            setMode('builder');
        }
        // 2. MODE LTI (Élève noté)
        else if (ltiToken && jsonUrl) {
            console.log("🎓 Mode Élève LTI");
            setLtiConfig({ token: ltiToken, apiUrl: gradeUrl });
            const response = await fetch(jsonUrl);
            if (!response.ok) throw new Error("URL campagne invalide");
            setCampaignData(await response.json());
            setIsTeacher(false);
            setMode('runner');
        } 
        // 3. MODE PARTAGE (Lien public)
        else if (jsonUrl) {
            console.log("🔗 Mode Élève (Lien)");
            const response = await fetch(jsonUrl);
            if (!response.ok) throw new Error("Fichier introuvable");
            setCampaignData(await response.json());
            // Si preview=1, on peut considérer que c'est un "aperçu" mais sans droits d'édition
            // Pour l'instant, on traite comme élève
            setIsTeacher(false); 
            setMode('runner');
        }
        // 4. MODE LZSTRING (Anciens liens de test)
        else if (encodedData) {
            console.log("📦 Mode LZString");
            const jsonStr = LZString.decompressFromEncodedURIComponent(encodedData);
            setCampaignData(JSON.parse(jsonStr));
            setIsTeacher(!!previewParam); // Si c'est un lien généré, on peut donner le droit de retour si preview=1
            setMode('runner');
        }
        // 5. PAR DÉFAUT -> ACCUEIL
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
      {/* ... (Home) */}

      {mode === 'builder' && (
        <Builder onTest={handleTeacherTest} />
      )}

      {mode === 'runner' && (
        <Runner 
            campaign={campaignData} 
            ltiConfig={ltiConfig}
            isTeacherMode={isTeacher} 
            onBackToBuilder={handleBackToBuilder}
            initialLevelIndex={startLevelIndex} // <-- ON PASSE LA PROP
        />
      )}
    </div>
  );
}
export default App;