// VENDORÉ depuis maths974-embed (connecteur couche 2) — ne pas éditer ici.
// SDK côté APP (child) — à coller dans n'importe quelle app pour qu'elle se
// branche à l'orchestrateur Maths974. ~30 lignes d'usage côté app :
//
//   import { connect } from '@maths974/embed/child';
//   const session = connect({ app: 'lambdazef' });
//   session.ready('lesson:a');
//   session.on('command', (c) => { if (c.action === 'reset') restart(); });
//   // en fin de niveau :
//   session.reportAttempt(makeAttempt({ app:'lambdazef', activityId:'lesson:a', passed:true }));
//   // ou, pour un écran « à consulter » (pas d'évaluation) :
//   session.viewed({ durationMs: 12000 });
//
// Hors iframe (app jouée en autonome) : tout devient no-op, l'app marche pareil.

import { MSG, VERSION, isM974Message, originAllowed } from './protocol.js';

export function connect(opts = {}) {
  const app = opts.app || 'unknown';
  const allow = opts.allowOrigin || '*';
  const hostOrigin = opts.hostOrigin || '*'; // cible des messages sortants (prod : origine exacte du host)
  const embedded =
    typeof window !== 'undefined' && window.parent && window.parent !== window;

  let host = null; // { win, origin } renseigné à la réception du LAUNCH
  let session = opts.session || null;
  let params = readUrlParams(); // config de repli via URL (l'app marche aussi sans LAUNCH)
  if (params.session) session = params.session;
  const listeners = Object.create(null);

  function emit(ev, data) {
    const fns = listeners[ev];
    if (!fns) return;
    for (const fn of fns) {
      try {
        fn(data);
      } catch (e) {
        console.error('[m974/child]', ev, e);
      }
    }
  }

  function post(type, payload) {
    if (!embedded) return false;
    const target = host ? host.win : window.parent;
    const origin = host ? host.origin : hostOrigin;
    target.postMessage({ type, version: VERSION, app, session, payload }, origin);
    return true;
  }

  function onMessage(e) {
    if (!isM974Message(e.data)) return;
    if (!originAllowed(e.origin, allow)) return;
    const { type, payload, session: sid } = e.data;
    if (type === MSG.LAUNCH) {
      host = { win: e.source, origin: e.origin };
      if (sid) session = sid;
      params = Object.assign({}, params, payload || {});
      emit('launch', params);
    } else if (type === MSG.COMMAND) {
      emit('command', payload || {});
    }
  }
  if (embedded) window.addEventListener('message', onMessage);

  const api = {
    /** true si l'app tourne dans l'orchestrateur (iframe). */
    embedded,
    /** config courante (URL puis LAUNCH écrasent). { activity, level, mode, timeLimit, studentKey, locale, kind, ... } */
    get params() {
      return params;
    },
    /** s'abonner : on('launch'|'command', fn). */
    on(ev, fn) {
      (listeners[ev] || (listeners[ev] = [])).push(fn);
      return api;
    },
    /** annonce au host que l'app est prête (déclenche le LAUNCH côté host). */
    ready(activityId) {
      if (embedded) {
        window.parent.postMessage(
          { type: MSG.READY, version: VERSION, app, session, payload: { activityId, params } },
          hostOrigin,
        );
      }
      return api;
    },
    /** émet un AttemptResult (cf. @maths974/competences). Retourne l'objet (utile en autonome). */
    reportAttempt(attempt) {
      post(MSG.ATTEMPT, attempt);
      return attempt;
    },
    /** signal DOUX pour un écran « à consulter » (pas d'évaluation réelle).
     *  Émet un AttemptResult minimal : passed = a-t-on consulté assez longtemps,
     *  aucune compétence, marqué measures.viewed pour que le backend le distingue. */
    viewed(o = {}) {
      const durationMs = o.durationMs || 0;
      const minMs = o.minMs != null ? o.minMs : 0;
      const attempt = {
        app,
        activityId: String(o.activityId || params.activity || 'consult'),
        ts: o.ts || new Date().toISOString(),
        outcome: { passed: durationMs >= minMs, score: 0 },
        measures: { viewed: true, durationMs },
        competencies: [],
        kind: 'consult',
      };
      post(MSG.ATTEMPT, attempt);
      return attempt;
    },
    /** progression partielle 0..1 (le host peut l'afficher dans son chrono/HUD). */
    progress(value, extra) {
      post(MSG.PROGRESS, Object.assign({ value }, extra));
      return api;
    },
    /** demande à sortir / signale la fin de l'activité. */
    exit(reason) {
      post(MSG.EXIT, { reason });
      return api;
    },
    dispose() {
      if (embedded) window.removeEventListener('message', onMessage);
    },
  };
  return api;
}

function readUrlParams() {
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get('m974') == null) return {};
    const num = (k) => (q.get(k) != null ? Number(q.get(k)) : undefined);
    return clean({
      session: q.get('session') || undefined,
      activity: q.get('activity') || undefined,
      level: q.get('level') || undefined,
      mode: q.get('mode') || undefined,
      kind: q.get('kind') || undefined, // 'graded' | 'consult'
      timeLimit: num('timeLimit'),
      studentKey: q.get('studentKey') || undefined,
      locale: q.get('locale') || undefined,
    });
  } catch {
    return {};
  }
}

function clean(o) {
  for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
  return o;
}
