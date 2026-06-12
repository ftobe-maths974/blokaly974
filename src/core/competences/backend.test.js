// Garde-fou DUAL-MODE : qui capte la tentative ? (anti double-comptage)
//   • standalone sans séance  → streaming au collecteur (autoPost)
//   • standalone + séance      → PAS de streaming (envoi explicite via flushSession)
//   • embarqué (orchestrateur) → PAS de streaming (le connecteur est le sink)
import { describe, it, expect, vi, beforeEach } from 'vitest';

// On contrôle l'état « embarqué » en mockant le pont orchestrateur.
vi.mock('../embed/orchestrator.js', () => ({ isEmbedded: vi.fn(() => false) }));

import { isEmbedded } from '../embed/orchestrator.js';
import { initBackend, setSessionCode, setStudentKey } from './backend.js';
import { recordAttempt, makeAttempt, clearAttempts, flushSession } from './index.js';

function win() {
  recordAttempt(makeAttempt({ app: 'blokaly', activityId: 'lvl1', passed: true, competencies: ['x.y'] }));
}

describe('garde-fou dual-mode (autoPost)', () => {
  beforeEach(() => {
    // localStorage mock (node) — backend.js lit le code séance/élève dedans.
    const ls = {};
    global.localStorage = {
      getItem: (k) => (k in ls ? ls[k] : null),
      setItem: (k, v) => { ls[k] = String(v); },
      removeItem: (k) => { delete ls[k]; },
    };
    global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ ok: true }) }));
    isEmbedded.mockReturnValue(false);
    clearAttempts();
    setStudentKey(null);
    setSessionCode(null);
    global.fetch.mockClear();
  });

  it('streame quand standalone SANS séance', () => {
    initBackend();
    win();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('ne streame PAS quand une séance est posée (modèle bouton Envoyer)', () => {
    setSessionCode('6B'); // déclenche initBackend → autoPost off
    win();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('ne streame PAS quand embarqué (le connecteur est le sink)', () => {
    isEmbedded.mockReturnValue(true);
    initBackend();
    win();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('flushSession envoie un lot estampillé (student, session, replace)', async () => {
    setStudentKey('emma');
    setSessionCode('6B');
    win(); win();
    const res = await flushSession();
    expect(global.fetch).toHaveBeenCalledTimes(1); // le lot seulement (pas de streaming)
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.student).toBe('emma');
    expect(body.session).toBe('6B');
    expect(body.replace).toBe(true);
    expect(body.attempts.length).toBe(2);
    expect(res).toEqual({ ok: true });
  });
});
