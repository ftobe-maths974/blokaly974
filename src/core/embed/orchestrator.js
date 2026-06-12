// Pont vers l'orchestrateur Maths974 (couche 4).
// Quand Blokaly est EMBARQUÉ en iframe par l'orchestrateur, on poste son
// AttemptResult au parent via le connecteur @maths974/embed. Hors iframe : no-op
// total (Blokaly marche à l'identique en autonome). Cf. orchestrateur-maths974/HANDOFF.md.
//
// Singleton de session : backend.js (garde-fou autoPost) et Runner.jsx (émission
// à la victoire) passent par CE module → une seule connexion partagée.
import { connect } from './child.js';

let _session = null;
function session() {
  if (!_session) _session = connect({ app: 'blokaly' });
  return _session;
}

/** Poste une Tentative (AttemptResult) au parent si on est embarqué (sinon no-op). */
export function reportToOrchestrator(attempt) {
  try {
    session().reportAttempt(attempt);
  } catch {
    /* silencieux — ne jamais casser Blokaly pour ça */
  }
}

/** true si Blokaly tourne dans l'orchestrateur (iframe). */
export function isEmbedded() {
  try {
    return session().embedded;
  } catch {
    return false;
  }
}
