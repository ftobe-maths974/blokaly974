// Objet « Tentative » unifié — la trace de fin de niveau, émise par n'importe
// quelle app, quel que soit son support.
import { isKnownSkill } from './referential.js';

/**
 * Construit (et normalise) une Tentative.
 * @param {object} o
 * @param {string} o.app          identifiant de l'app : 'blokaly' | 'aljeb' | 'gs' | 'pezali'
 * @param {string} o.activityId   id du niveau/exercice dans l'app
 * @param {boolean} o.passed      niveau réussi ?
 * @param {number} [o.score]      score normalisé 0..1 (défaut : stars/maxStars, sinon passed?1:0)
 * @param {number} [o.stars]      étoiles obtenues
 * @param {number} [o.maxStars]   étoiles max
 * @param {object} [o.measures]   mesures brutes { moves, blocks, attempts, durationMs, … }
 * @param {Array}  [o.competencies] [{ id, ok, weight? }] ou ['skill.id', …] (raccourci : ok = passed)
 * @param {string} [o.ts]         ISO timestamp (à fournir : pas de Date.now() ici pour rester pur)
 */
export function makeAttempt(o) {
  if (!o || !o.app || !o.activityId) {
    throw new Error('makeAttempt: `app` et `activityId` sont requis');
  }
  const passed = !!o.passed;
  let score = o.score;
  if (typeof score !== 'number') {
    score = (typeof o.stars === 'number' && o.maxStars) ? o.stars / o.maxStars : (passed ? 1 : 0);
  }
  score = Math.max(0, Math.min(1, score));

  const competencies = (o.competencies || []).map((c) => {
    const raw = typeof c === 'string' ? { id: c } : c;
    return { id: raw.id, ok: raw.ok === undefined ? passed : !!raw.ok, weight: raw.weight ?? 1 };
  });
  // garde une trace des compétences inconnues (utile en dev pour compléter le référentiel)
  const unknown = competencies.filter((c) => !isKnownSkill(c.id)).map((c) => c.id);

  return {
    app: o.app,
    activityId: String(o.activityId),
    ts: o.ts || new Date().toISOString(),
    outcome: {
      passed,
      score,
      ...(typeof o.stars === 'number' ? { stars: o.stars } : {}),
      ...(typeof o.maxStars === 'number' ? { maxStars: o.maxStars } : {}),
    },
    measures: o.measures || {},
    competencies,
    ...(unknown.length ? { _unknownSkills: unknown } : {}),
  };
}
