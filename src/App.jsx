import React, { useState, useEffect } from 'react';
import LZString from 'lz-string';
import Builder from './components/builder/Builder';
import Runner from './components/runner/Runner';
import Home from './components/Home';
import AngleLab from './components/labs/AngleLab';
import CompetencesView from './components/labs/CompetencesView';
import './App.css';

// Importation globale des blocs
import { registerAllBlocks } from './core/BlockRegistry';
// Sécurité pour éviter le double-enregistrement
try { registerAllBlocks(); } catch { console.warn("Blocks already registered"); }

function App() {
  const [mode, setMode] = useState('loading'); 
  const [campaignData, setCampaignData] = useState(null);
  const [ltiConfig, setLtiConfig] = useState(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [startLevelIndex, setStartLevelIndex] = useState(-1); // -1 = écran de sélection des niveaux

  // --- ACTIONS ---
  const handleFileLoaded = (data) => {
      setCampaignData(data);
      setIsTeacher(false);
      setStartLevelIndex(-1); // affiche l'écran des niveaux
      setMode('runner');
  };

  const handleTeacherTest = (currentCampaignData, levelIndex = 0) => {
      setCampaignData(currentCampaignData);
      setStartLevelIndex(levelIndex);
      setMode('runner');
  };

  const handleBackToBuilder = () => {
      setMode('builder');
  };

  // --- HELPER DE CHARGEMENT ROBUSTE ---
  // C'est cette fonction qui corrige votre bug
  const fetchCampaign = async (url) => {
      console.log(`📥 Tentative chargement : "${url}"`);
      
      // 1. Essai Standard (Relatif)
      let response = await fetch(url);
      let contentType = response.headers.get("content-type");

      // Si échec (404) ou si Vite renvoie index.html à la place du JSON
      if (!response.ok || (contentType && contentType.includes("text/html"))) {
          // Si c'est un chemin local relatif, on tente la racine absolue
          if (!url.startsWith('http') && !url.startsWith('/')) {
              console.warn(`⚠️ Échec relatif. Tentative à la racine : "/${url}"`);
              const rootUrl = `/${url}`;
              response = await fetch(rootUrl);
              contentType = response.headers.get("content-type");
          }
      }

      // Vérification finale
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
      if (contentType && contentType.includes("text/html")) {
          throw new Error(`Fichier introuvable. Vérifiez que "${url}" est bien dans le dossier /public/`);
      }
      
      return await response.json();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const encodedData = params.get('data');
    const jsonUrl = params.get('url');
    const ltiToken = params.get('lti_token');
    const gradeUrl = params.get('api_grade');
    const isEditorMode = params.get('mode') === 'editor';
    const labParam = params.get('lab');

    const initApp = async () => {
      try {
        // 0. ATELIERS (leçons interactives)
        if (labParam === 'angles') {
            console.log("📐 Atelier des angles");
            setMode('angles');
        }
        else if (labParam === 'competences') {
            console.log("📊 Mes compétences");
            setMode('competences');
        }
        // A. MODE PROFESSEUR
        else if (isEditorMode) {
            console.log("🛠️ Mode Enseignant activé");
            setIsTeacher(true);
            setMode('builder');
        }
        // B. MODE LTI (Noté)
        else if (ltiToken && jsonUrl) {
            console.log("🎓 Mode Élève LTI");
            setLtiConfig({ token: ltiToken, apiUrl: gradeUrl });
            
            // Utilisation du fetch intelligent
            const data = await fetchCampaign(jsonUrl);
            
            setCampaignData(data);
            setIsTeacher(false);
            setMode('runner');
        } 
        // C. MODE PARTAGE (Lien public)
        else if (jsonUrl) {
            console.log("🔗 Mode Élève (Lien)");
            
            // Utilisation du fetch intelligent
            const data = await fetchCampaign(jsonUrl);

            setCampaignData(data);
            setIsTeacher(false); 
            setMode('runner');
        }
        // D. MODE LZSTRING
        else if (encodedData) {
            console.log("📦 Mode LZString");
            const jsonStr = LZString.decompressFromEncodedURIComponent(encodedData);
            setCampaignData(JSON.parse(jsonStr));
            setIsTeacher(false);
            setMode('runner');
        }
        // E. ACCUEIL
        else {
            console.log("🏠 Accueil");
            setIsTeacher(false);
            setMode('home');
        }

      } catch (e) {
        console.error("❌ Erreur init:", e);
        alert("Impossible de charger l'exercice :\n" + e.message);
        setMode('home');
      }
    };

    initApp();
  }, []);

  if (mode === 'loading') return <div className="flex items-center justify-center h-screen text-slate-500">Chargement...</div>;

  return (
    <div className="App">
      {mode === 'home' && <Home onFileLoaded={handleFileLoaded} />}

      {mode === 'angles' && <AngleLab />}

      {mode === 'competences' && <CompetencesView />}
      
      {mode === 'builder' && (
        <Builder onTest={handleTeacherTest} />
      )}

      {mode === 'runner' && (
        <Runner 
            campaign={campaignData} 
            ltiConfig={ltiConfig}
            isTeacherMode={isTeacher} 
            onBackToBuilder={handleBackToBuilder}
            initialLevelIndex={startLevelIndex}
        />
      )}
    </div>
  );
}

export default App;