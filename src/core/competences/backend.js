// Branchement du collecteur partagé (Route B). Appelé une fois au démarrage.
// Tant que COLLECTOR_URL est vide, le rail reste INACTIF (rien n'est envoyé) :
// la capture locale (localStorage) continue de fonctionner normalement.
import { configureBackend } from './index.js';
import { isEmbedded } from '../embed/orchestrator.js';

// ⚙️ URL du collecteur OVH (cf. OVH/www/competences/README.md). Vide = pas d'envoi réseau.
export const COLLECTOR_URL = 'https://competences.maths974.fr/collect.php';

// Clé du code élève dans le localStorage (partagée par convention entre toutes les apps).
export const STUDENT_KEY_LS = 'maths974:eleve';
// Clé du code de SÉANCE (regroupe une classe pour un envoi en lot).
export const SESSION_KEY_LS = 'maths974:session';

export function getStudentKey() {
  try { return localStorage.getItem(STUDENT_KEY_LS) || null; } catch { return null; }
}

export function setStudentKey(code) {
  try {
    if (code) localStorage.setItem(STUDENT_KEY_LS, code);
    else localStorage.removeItem(STUDENT_KEY_LS);
  } catch { /* ignore */ }
  initBackend(); // re-configure avec la nouvelle clé
}

export function getSessionCode() {
  try { return localStorage.getItem(SESSION_KEY_LS) || null; } catch { return null; }
}

export function setSessionCode(code) {
  try {
    if (code) localStorage.setItem(SESSION_KEY_LS, code);
    else localStorage.removeItem(SESSION_KEY_LS);
  } catch { /* ignore */ }
  initBackend(); // re-configure (bascule streaming ↔ envoi explicite)
}

export function initBackend() {
  // Garde-fou DUAL-MODE — décide qui capte la tentative :
  //  • EMBARQUÉ dans l'orchestrateur → le connecteur (couche 2) est le sink ;
  //    on coupe le collecteur OVH pour ne PAS compter deux fois.
  //  • STANDALONE + code de séance → modèle « bouton Envoyer » (flushSession) :
  //    capture locale, puis envoi explicite en lot idempotent. Pas de streaming.
  //  • STANDALONE sans séance → streaming à chaque victoire (corpus / élève seul).
  const embedded = isEmbedded();
  const session = getSessionCode();
  configureBackend({
    collectorUrl: COLLECTOR_URL || null,
    studentKey: getStudentKey(),
    session,
    autoPost: !embedded && !session,
  });
}
