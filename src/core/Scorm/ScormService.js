// Petit wrapper SCORM 1.2 (Le standard le plus supporté)
const ScormService = {
  api: null,
  isActive: false,

  // 1. Trouver l'API SCORM dans la fenêtre parente (Moodle)
  findAPI: (win) => {
    let attempts = 0;
    while ((win.API == null) && (win.parent != null) && (win.parent != win) && (attempts < 10)) {
      attempts++;
      win = win.parent;
    }
    return win.API;
  },

  // 2. Démarrer la session
  init: () => {
    try {
      const api = ScormService.findAPI(window);
      if (api) {
        ScormService.api = api;
        const status = api.LMSInitialize("");
        if (status === "true") {
          console.log("🔌 SCORM: Connecté !");
          ScormService.isActive = true;
          api.LMSSetValue("cmi.core.score.min", "0");
          api.LMSSetValue("cmi.core.score.max", "100");
          api.LMSSetValue("cmi.core.lesson_status", "incomplete");
          api.LMSCommit("");
          return true;
        }
      }
    } catch (e) {
      console.warn("SCORM introuvable (Mode local ?)");
    }
    return false;
  },

  // 3. Envoyer le score (0-100)
  setScore: (scorePercent) => {
    if (!ScormService.isActive || !ScormService.api) return;
    
    const score = Math.round(scorePercent * 100); // SCORM veut du 0-100
    console.log(`📤 SCORM: Envoi note ${score}/100`);
    
    ScormService.api.LMSSetValue("cmi.core.score.raw", score);
    
    if (score >= 100) {
        ScormService.api.LMSSetValue("cmi.core.lesson_status", "passed");
    } else {
        ScormService.api.LMSSetValue("cmi.core.lesson_status", "incomplete");
    }
    
    ScormService.api.LMSCommit(""); // Forcer l'enregistrement immédiat
  },

  // 4. Fermer proprement (Important pour Moodle !)
  terminate: () => {
    if (ScormService.isActive && ScormService.api) {
      console.log("🔌 SCORM: Déconnexion.");
      ScormService.api.LMSFinish("");
      ScormService.isActive = false;
    }
  }
};

export default ScormService;