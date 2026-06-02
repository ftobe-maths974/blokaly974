// Stockage + agrégation des tentatives. Persistance locale (localStorage) avec
// repli mémoire (tests Node). Plus tard : adaptateur backend (Moodle / relais OVH).
import { SKILLS, MACRO, tierFromRate } from './referential.js';

const KEY = 'maths974:competences:attempts';
const CAP = 2000;

const memory = {};
const storage =
  typeof localStorage !== 'undefined'
    ? localStorage
    : { getItem: (k) => memory[k] ?? null, setItem: (k, v) => { memory[k] = v; }, removeItem: (k) => { delete memory[k]; } };

export function getAttempts() {
  try { return JSON.parse(storage.getItem(KEY)) || []; } catch { return []; }
}

export function recordAttempt(attempt) {
  const all = getAttempts();
  all.push(attempt);
  if (all.length > CAP) all.splice(0, all.length - CAP);
  storage.setItem(KEY, JSON.stringify(all));
  return attempt;
}

export function clearAttempts() { storage.removeItem(KEY); }

/**
 * Maîtrise par micro-compétence, cumulée TOUS supports confondus.
 * @param {object} [opt]
 * @param {number} [opt.window=10]  ne considère que les N dernières tentatives par compétence
 * @param {number} [opt.minAttempts=3]
 * @returns {object} { [skillId]: { label, domaine, macro, attempts, ok, rate, tier, byApp } }
 */
export function getMastery({ window = 10, minAttempts = 3 } = {}) {
  const bySkill = {};
  for (const a of getAttempts()) {
    for (const c of a.competencies || []) {
      const m = (bySkill[c.id] ||= { events: [], byApp: {} });
      m.events.push({ ok: c.ok, app: a.app });
    }
  }
  const out = {};
  for (const [id, m] of Object.entries(bySkill)) {
    const recent = m.events.slice(-window);
    const attempts = recent.length;
    const ok = recent.filter((e) => e.ok).length;
    const rate = attempts ? ok / attempts : 0;
    const byApp = {};
    for (const e of m.events) {
      const b = (byApp[e.app] ||= { attempts: 0, ok: 0 });
      b.attempts++; if (e.ok) b.ok++;
    }
    const def = SKILLS[id] || {};
    out[id] = {
      label: def.label || id,
      domaine: def.domaine || 'Autre',
      macro: def.macro || [],
      attempts, ok, rate,
      tier: tierFromRate(rate, attempts, minAttempts),
      byApp,
    };
  }
  return out;
}

/** Maîtrise agrégée par macro-compétence (ch/mo/re/ra/ca/co). */
export function getMacroMastery(opt) {
  const skills = getMastery(opt);
  const acc = {};
  for (const id of Object.keys(MACRO)) acc[id] = { label: MACRO[id], attempts: 0, ok: 0 };
  for (const s of Object.values(skills)) {
    for (const code of s.macro) {
      if (!acc[code]) continue;
      acc[code].attempts += s.attempts;
      acc[code].ok += s.ok;
    }
  }
  for (const code of Object.keys(acc)) {
    const a = acc[code];
    a.rate = a.attempts ? a.ok / a.attempts : 0;
    a.tier = tierFromRate(a.rate, a.attempts);
  }
  return acc;
}
