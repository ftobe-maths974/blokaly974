// Branchement du collecteur partagé (Route B). Appelé une fois au démarrage.
// Tant que COLLECTOR_URL est vide, le rail reste INACTIF (rien n'est envoyé) :
// la capture locale (localStorage) continue de fonctionner normalement.
import { configureBackend } from './index.js';

// ⚙️ À renseigner avec l'URL du collecteur OVH (cf. OVH/www/competences/README.md).
// Ex. 'https://maths974.fr/competences/collect.php'. Laisser vide = pas d'envoi réseau.
export const COLLECTOR_URL = '';

// Clé du code élève dans le localStorage (partagée par convention entre toutes les apps).
export const STUDENT_KEY_LS = 'maths974:eleve';

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

export function initBackend() {
  configureBackend({
    collectorUrl: COLLECTOR_URL || null,
    studentKey: getStudentKey(),
  });
}
