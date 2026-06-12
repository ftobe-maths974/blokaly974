// VENDORÉ depuis maths974-embed (connecteur couche 2) — ne pas éditer ici.
// Protocole d'embarquement Maths974 — couche 2.
// Agnostique du framework. Vocabulaire commun host <-> child (iframe + postMessage).
//
// Idée : l'ORCHESTRATEUR (host) lance une APP (child) dans une iframe avec une
// config {level, mode, timeLimit, studentKey...} ; l'app, en fin de niveau, POSTE
// un AttemptResult (cf. @maths974/competences) au host, qui le relaie au backend.
//
// L'app reste jouable EN AUTONOME (hors iframe) : le SDK devient alors un no-op.

export const PROTOCOL = 'm974';
export const VERSION = 1;

// Types de messages (préfixe « m974: » pour cohabiter sans collision).
export const MSG = {
  READY: 'm974:ready', // child -> host : iframe chargée, connaît son activité
  LAUNCH: 'm974:launch', // host  -> child: config (level, mode, timeLimit, studentKey, locale)
  ATTEMPT: 'm974:attempt', // child -> host : un AttemptResult (le signal-clé)
  PROGRESS: 'm974:progress', // child -> host : progression partielle 0..1 (chrono/UI host)
  EXIT: 'm974:exit', // child -> host : l'activité veut sortir / a fini
  COMMAND: 'm974:command', // host  -> child: {action:'pause'|'resume'|'reset'|'timeup'|'mute'}
};

// Clés AUTORISÉES dans l'URL de l'iframe. Tout le reste (studentKey, et toute
// donnée potentiellement identifiante d'un mineur) ne transite QUE par le
// postMessage LAUNCH — jamais l'URL, qui fuiterait dans l'historique, le Referer
// et les logs des apps tierces. RGPD/mineurs : minimisation par construction.
export const URL_SAFE_KEYS = ['m974', 'session', 'activity', 'level', 'mode', 'kind', 'locale', 'timeLimit'];

export function isM974Message(data) {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.type === 'string' &&
    data.type.indexOf('m974:') === 0
  );
}

// Liste blanche d'origines. '*' = toutes (DEV uniquement — en prod, passer l'origine exacte).
export function originAllowed(origin, allow) {
  if (!allow || allow === '*') return true;
  const list = Array.isArray(allow) ? allow : [allow];
  return list.indexOf('*') !== -1 || list.indexOf(origin) !== -1;
}
