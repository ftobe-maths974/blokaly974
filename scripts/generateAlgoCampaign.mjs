// Générateur du parcours « Algo » (mode Labo Algo / MATH).
// Petits défis classiques pour grands débutants : Hello World, Hello+prénom,
// échange de variables, etc. Validation par `targets` (variables) et/ou
// `expectedOutput` (lignes affichées).
//
// Usage : node scripts/generateAlgoCampaign.mjs
// Sortie : public/examples/parcours_algo.blokaly.json

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// blocs de base par thème
const IO = ['text_print', 'text'];
const TXT = ['text_print', 'text', 'text_join', 'variables_get'];
const VARS = ['variables_set', 'variables_get', 'math_number', 'math_arithmetic'];
const LOGIC = ['variables_set', 'variables_get', 'math_number', 'controls_if', 'logic_compare'];
const LOOP = ['variables_set', 'variables_get', 'math_number', 'math_arithmetic', 'controls_repeat_ext'];

const LEVELS = [
  // ---- CHAPITRE 1 : Premiers affichages ----
  {
    icon: '👋', title: 'Hello World', chapter: 'Premiers affichages', allowed: IO, maxBlocks: 2,
    instruction: "Le grand classique ! **Affiche** le message `Hello World`.\n\n💡 Bloc **Afficher** + bloc **Texte** (écris dedans).",
    expectedOutput: ['Hello World'],
  },
  {
    icon: '🙋', title: 'Bonjour + prénom', chapter: 'Premiers affichages', allowed: TXT, maxBlocks: 4,
    inputs: { prenom: 'Léa' }, vars: ['prenom'],
    instruction: "Affiche `Bonjour ` suivi du **prénom**.\n\n💡 Bloc **Assembler texte** : « Bonjour » + `prenom`.",
    expectedOutput: ['Bonjour Léa'],
  },
  {
    icon: '🧮', title: 'Afficher une somme', chapter: 'Premiers affichages',
    allowed: ['text_print', 'math_arithmetic', 'variables_get', 'math_number'], maxBlocks: 4,
    inputs: { a: 7, b: 5 }, vars: ['a', 'b'],
    instruction: "Affiche le **résultat** de `a + b` (ici 7 + 5).",
    expectedOutput: ['12'],
  },

  // ---- CHAPITRE 2 : Les variables ----
  {
    icon: '➕', title: 'Ranger la somme', chapter: 'Les variables', allowed: VARS, maxBlocks: 4,
    inputs: { a: 7, b: 5 }, vars: ['a', 'b', 'somme'],
    instruction: "Range dans la variable **somme** la valeur de `a + b`.",
    targets: { somme: 12 },
  },
  {
    icon: '✖️', title: 'Le triple', chapter: 'Les variables', allowed: VARS, maxBlocks: 4,
    inputs: { n: 4 }, vars: ['n', 'triple'],
    instruction: "Range dans **triple** la valeur de `n × 3`.",
    targets: { triple: 12 },
  },
  {
    icon: '🔄', title: 'Échanger a et b', chapter: 'Les variables',
    allowed: ['variables_set', 'variables_get'], maxBlocks: 6,
    inputs: { a: 5, b: 9 }, vars: ['a', 'b', 'temp'],
    instruction: "**Échange** les valeurs de a et b (a doit valoir 9, b doit valoir 5).\n\n💡 Astuce : passe par une variable **temp** pour ne rien perdre :\n`temp ← a`, puis `a ← b`, puis `b ← temp`.",
    targets: { a: '@b', b: '@a' },
  },
  {
    icon: '🤯', title: 'Échanger sans temp (pro)', chapter: 'Les variables', allowed: VARS, maxBlocks: 7,
    inputs: { a: 5, b: 9 }, vars: ['a', 'b'],
    instruction: "Défi de pro : échange a et b **sans** variable temporaire, seulement avec des `+` et `−` :\n`a ← a + b`, `b ← a − b`, `a ← a − b`.",
    targets: { a: '@b', b: '@a' },
  },

  // ---- CHAPITRE 3 : Décisions & boucles ----
  {
    icon: '🏆', title: 'Le plus grand', chapter: 'Décisions & boucles', allowed: LOGIC, maxBlocks: 8,
    inputs: { a: 8, b: 5 }, vars: ['a', 'b', 'max'],
    instruction: "Range dans **max** le plus grand de a et b.\n\n💡 `Si a > b alors max ← a sinon max ← b`.",
    targets: { max: 8 },
  },
  {
    icon: '🔢', title: 'Compter jusqu\'à n', chapter: 'Décisions & boucles', allowed: LOOP, maxBlocks: 7,
    inputs: { n: 5 }, vars: ['n', 'compteur'],
    instruction: "Mets **compteur** à 0, puis **répète n fois** : `compteur ← compteur + 1`.",
    targets: { compteur: 5 },
  },
  {
    icon: '⚖️', title: 'Pair ou impair', chapter: 'Décisions & boucles',
    allowed: ['variables_set', 'variables_get', 'math_number', 'math_modulo'], maxBlocks: 4,
    inputs: { n: 7 }, vars: ['n', 'reste'],
    instruction: "Range dans **reste** le reste de `n ÷ 2` (bloc **Reste**). 0 = pair, 1 = impair !",
    targets: { reste: 1 },
  },
];

const seedXml = (vars) =>
  vars && vars.length
    ? `<xml xmlns="https://developers.google.com/blockly/xml"><variables>${vars.map((n, i) => `<variable id="seed_${i}">${n}</variable>`).join('')}</variables></xml>`
    : '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';

const levels = LEVELS.map((l, i) => {
  // Les variables de TRAVAIL (cibles/temporaires) doivent figurer dans `inputs`
  // pour apparaître dans la boîte à blocs (la catégorie Variables est construite
  // depuis inputs). On les initialise à 0.
  const inputs = { ...(l.inputs || {}) };
  (l.vars || []).forEach((name) => { if (!(name in inputs)) inputs[name] = 0; });

  return {
    id: i + 1,
    type: 'MATH',
    chapter: l.chapter,
    maxStars: 4,
    title: `${l.icon} ${l.title}`,
    instruction: l.instruction,
    inputs,
    targets: l.targets || {},
    ...(l.expectedOutput ? { expectedOutput: l.expectedOutput } : {}),
    allowedBlocks: l.allowed,
    maxBlocks: l.maxBlocks,
    validation: { stars: { blocks: l.maxBlocks, blocksFlat: l.maxBlocks * 3, steps: 200 } },
    hiddenVars: [], lockedVars: [],
    startBlocks: seedXml(Object.keys(inputs)),
    solutionBlocks: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
  };
});

const campaign = {
  title: '🧪 Parcours Algo — Labo',
  description: "Les petits programmes de base pour bien démarrer : afficher, variables, échanges, conditions et boucles.",
  levels,
};

const outPath = join(__dirname, '..', 'public', 'examples', 'parcours_algo.blokaly.json');
writeFileSync(outPath, JSON.stringify(campaign, null, 2));
console.log(`${levels.length} niveaux Algo écrits dans ${outPath}`);
levels.forEach((l) => console.log(`  ${l.id}. [${l.chapter}] ${l.title}`));
