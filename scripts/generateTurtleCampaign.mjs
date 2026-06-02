// Générateur de campagne TORTUE.
//
// Chaque figure est décrite par un petit AST (move / turn / repeat / setVar /
// var / add). On en dérive :
//   1. le XML Blockly de la SOLUTION (solutionBlocks) — le « calque » gris + le juge,
//   2. une SIMULATION (interpréteur) → segments tracés → centrage + cibles d'étoiles.
//
// 3 chapitres : Polygones (angle = 360/n), Rosaces (motif = boucle imbriquée),
// Variables (figures qui grandissent).
//
// Usage : node scripts/generateTurtleCampaign.mjs
// Sortie : public/examples/figures_tortue.blokaly.json

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// =====================================================================
// AST — constructeurs
// =====================================================================
const move = (dist) => ({ k: 'move', dist });
const turn = (dir, deg) => ({ k: 'turn', dir, deg });       // dir: 'L' | 'R'
const repeat = (times, body) => ({ k: 'repeat', times, body });
const setVar = (name, value) => ({ k: 'set', name, value });
const v = (name) => ({ k: 'var', name });                    // lecture variable
const add = (a, b) => ({ k: 'add', a, b });                  // a + b

const isExpr = (x) => x && (typeof x === 'number' || x.k === 'var' || x.k === 'add');

// =====================================================================
// XML Blockly
// =====================================================================
const nx = (s) => (s ? `<next>${s}</next>` : '');

// valeur (socket) : nombre → shadow math_number ; variable → bloc ; add → math_arithmetic
function valueXml(name, expr, varIds) {
  let inner;
  if (typeof expr === 'number') {
    inner = `<shadow type="math_number"><field name="NUM">${expr}</field></shadow>`;
  } else if (expr.k === 'var') {
    inner = `<block type="variables_get"><field name="VAR" id="${varIds[expr.name]}">${expr.name}</field></block>`;
  } else if (expr.k === 'add') {
    inner = `<block type="math_arithmetic"><field name="OP">ADD</field>` +
      valueXml('A', expr.a, varIds) + valueXml('B', expr.b, varIds) + `</block>`;
  }
  return `<value name="${name}">${inner}</value>`;
}

function nodeXml(node, varIds) {
  switch (node.k) {
    case 'move':
      return (next) => `<block type="turtle_move">${valueXml('VALUE', node.dist, varIds)}${nx(next)}</block>`;
    case 'turn':
      return (next) => `<block type="turtle_turn"><field name="DIR">${node.dir === 'L' ? 'LEFT' : 'RIGHT'}</field>${valueXml('VALUE', node.deg, varIds)}${nx(next)}</block>`;
    case 'set':
      return (next) => `<block type="variables_set"><field name="VAR" id="${varIds[node.name]}">${node.name}</field>${valueXml('VALUE', node.value, varIds)}${nx(next)}</block>`;
    case 'repeat': {
      // times : nombre → shadow ; variable → bloc
      const timesXml = typeof node.times === 'number'
        ? `<value name="TIMES"><shadow type="math_number"><field name="NUM">${node.times}</field></shadow></value>`
        : valueXml('TIMES', node.times, varIds);
      return (next) => `<block type="controls_repeat_ext">${timesXml}<statement name="DO">${chainXml(node.body, varIds)}</statement>${nx(next)}</block>`;
    }
    default:
      return () => '';
  }
}

function chainXml(nodes, varIds) {
  return nodes.reduceRight((acc, n) => nodeXml(n, varIds)(acc), '');
}

function programXml(nodes, varNames = []) {
  const varIds = {};
  varNames.forEach((n, i) => { varIds[n] = `var_${n}_${i}`; });
  const vars = varNames.length
    ? `<variables>${varNames.map((n) => `<variable id="${varIds[n]}">${n}</variable>`).join('')}</variables>`
    : '';
  return `<xml xmlns="https://developers.google.com/blockly/xml">${vars}${chainXml(nodes, varIds)}</xml>`;
}

// =====================================================================
// SIMULATION (interpréteur) → segments + métriques
// =====================================================================
function evalExpr(expr, env) {
  if (typeof expr === 'number') return expr;
  if (expr.k === 'var') return env[expr.name] ?? 0;
  if (expr.k === 'add') return evalExpr(expr.a, env) + evalExpr(expr.b, env);
  return 0;
}

function simulate(nodes, startPos) {
  const state = { x: startPos.x, y: startPos.y, dir: startPos.dir || 0, lines: [] };
  const env = {};
  let moves = 0, turns = 0, actionCount = 0;
  const LIMIT = 20000;

  const run = (list) => {
    for (const node of list) {
      if (actionCount > LIMIT) throw new Error('Simulation trop longue (boucle ?)');
      if (node.k === 'move') {
        const dist = evalExpr(node.dist, env);
        const rad = state.dir * (Math.PI / 180);
        const nx2 = state.x + dist * Math.cos(rad);
        const ny2 = state.y + dist * Math.sin(rad);
        state.lines.push({ x1: state.x, y1: state.y, x2: nx2, y2: ny2 });
        state.x = nx2; state.y = ny2; moves++; actionCount++;
      } else if (node.k === 'turn') {
        const deg = evalExpr(node.deg, env);
        state.dir += (node.dir === 'L' ? deg : -deg);
        turns++; actionCount++;
      } else if (node.k === 'set') {
        env[node.name] = evalExpr(node.value, env);
      } else if (node.k === 'repeat') {
        const n = evalExpr(node.times, env);
        for (let i = 0; i < n; i++) run(node.body);
      }
    }
  };
  run(nodes);
  return { lines: state.lines, moves, turns, actions: moves + turns };
}

// compte les blocs de la solution structurée (≈ solution « optimale », shadows inclus)
function countBlocks(nodes) {
  let c = 0;
  const exprCount = (e) => {
    if (typeof e === 'number') return 1;       // shadow math_number
    if (e.k === 'var') return 1;               // variables_get
    if (e.k === 'add') return 1 + exprCount(e.a) + exprCount(e.b);
    return 0;
  };
  for (const n of nodes) {
    if (n.k === 'move') c += 1 + exprCount(n.dist);
    else if (n.k === 'turn') c += 1 + exprCount(n.deg);
    else if (n.k === 'set') c += 1 + exprCount(n.value);
    else if (n.k === 'repeat') c += 1 + exprCount(n.times) + countBlocks(n.body);
  }
  return c;
}

// =====================================================================
// FIGURES
// =====================================================================
const TURTLE = ['turtle_move', 'turtle_turn', 'controls_repeat_ext'];
const TURTLE_VARS = [...TURTLE, 'variables_set', 'variables_get', 'math_number', 'math_arithmetic'];

// polygone régulier à n côtés, tracé dans le sens horaire (turn R = 360/n)
const polygon = (n, side) => [repeat(n, [move(side), turn('R', Math.round((360 / n) * 100) / 100)])];

const FIGURES = [
  // --- EXERCICES « COMPRENDRE LES ANGLES » (appliquent la leçon) ---
  { id: 'chevron', title: 'Un angle de 60°', icon: '📐', chapter: 'Comprendre les angles', vars: [],
    allowed: ['turtle_move', 'turtle_turn'],
    instruction: "Trace un **angle de 60°** : avance, **tourne de 120°** (le supplément : 180 − 60), puis avance.",
    nodes: [move(130), turn('R', 120), move(130)] },
  { id: 'triangle', title: 'Le triangle équilatéral', icon: '🔺', chapter: 'Comprendre les angles', vars: [],
    instruction: "Applique le **tour complet** : un **triangle** a 3 sommets → on tourne de **360 ÷ 3 = 120°** à chaque fois.",
    nodes: polygon(3, 160) },
  { id: 'pentagone', title: 'Le pentagone', icon: '⬠', chapter: 'Comprendre les angles', vars: [],
    instruction: "À toi de trouver l'angle : **pentagone** = 5 côtés → **360 ÷ 5 = 72°** (et oui, 72 n'est pas rond !).",
    nodes: polygon(5, 110) },

  // --- CHAPITRE : POLYGONES (angle extérieur = 360 / n) ---
  { id: 'carre', title: 'Le carré', icon: '⬜', chapter: 'Polygones', vars: [],
    instruction: "Un **carré** : 4 côtés. Angle de rotation = **360 ÷ 4 = 90°**.",
    nodes: polygon(4, 130) },
  { id: 'hexagone', title: "L'hexagone", icon: '⬡', chapter: 'Polygones', vars: [],
    instruction: "Un **hexagone régulier** : 6 côtés. Angle = **360 ÷ 6 = 60°**.",
    nodes: polygon(6, 95) },
  { id: 'octogone', title: "L'octogone", icon: '🛑', chapter: 'Polygones', vars: [],
    instruction: "Un **octogone régulier** : 8 côtés. Angle = **360 ÷ 8 = 45°**.",
    nodes: polygon(8, 75) },
  { id: 'decagone', title: 'Le décagone', icon: '🔟', chapter: 'Polygones', vars: [],
    instruction: "Un **décagone** : 10 côtés. Angle = **360 ÷ 10 = 36°**. Presque un cercle !",
    nodes: polygon(10, 62) },

  // --- CHAPITRE 2 : ROSACES (motif = boucle dans une boucle) ---
  { id: 'rosace-carres', title: 'La rosace de carrés', icon: '🌸', chapter: 'Rosaces', vars: [],
    instruction: "Une **rosace** : on dessine un carré, on pivote un peu, et on recommence. **Répéter 12 fois** [ un carré, puis **tourner 30°** ] (12 × 30 = 360°).",
    nodes: [repeat(12, [...polygon(4, 120), turn('R', 30)])] },
  { id: 'rosace-triangles', title: 'La rosace de triangles', icon: '❇️', chapter: 'Rosaces', vars: [],
    instruction: "Même principe avec des **triangles** : **Répéter 8 fois** [ un triangle, puis **tourner 45°** ] (8 × 45 = 360°).",
    nodes: [repeat(8, [...polygon(3, 130), turn('R', 45)])] },
  { id: 'rosace-hexagones', title: "La rosace d'hexagones", icon: '🏵️', chapter: 'Rosaces', vars: [],
    instruction: "Un motif d'**hexagones** : **Répéter 6 fois** [ un hexagone, puis **tourner 60°** ].",
    nodes: [repeat(6, [...polygon(6, 70), turn('R', 60)])] },

  // --- CHAPITRE 3 : VARIABLES (figures qui grandissent) ---
  { id: 'spirale-carree', title: 'La spirale carrée', icon: '🌀', chapter: 'Variables', vars: ['côté'],
    instruction: "Une **spirale** : chaque côté est plus long. Crée une variable **côté** (départ 20). **Répéter 14 fois** [ avancer **côté**, tourner **90°**, **côté = côté + 12** ].",
    nodes: [
      setVar('côté', 20),
      repeat(14, [move(v('côté')), turn('R', 90), setVar('côté', add(v('côté'), 12))]),
    ] },
  { id: 'spirale-triangle', title: 'La spirale de triangle', icon: '📐', chapter: 'Variables', vars: ['côté'],
    instruction: "Même idée, mais on tourne de **120°** : une spirale **triangulaire**. Variable **côté** (départ 15), +18 à chaque tour, sur **18 fois**.",
    nodes: [
      setVar('côté', 15),
      repeat(18, [move(v('côté')), turn('R', 120), setVar('côté', add(v('côté'), 18))]),
    ] },
];

// =====================================================================
// GÉNÉRATION
// =====================================================================
const report = [];
const figById = Object.fromEntries(FIGURES.map((f) => [f.id, f]));

function buildFigureLevel(fig, idx) {
  const probe = simulate(fig.nodes, { x: 0, y: 0, dir: 0 });
  const xs = probe.lines.flatMap((l) => [l.x1, l.x2]);
  const ys = probe.lines.flatMap((l) => [l.y1, l.y2]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const startPos = { x: Math.round(-cx), y: Math.round(-cy), dir: 0 };
  const sim = simulate(fig.nodes, startPos);
  const optimal = countBlocks(fig.nodes);
  const flat = sim.actions * 2;
  report.push(`${span <= 760 ? '✅' : '⚠️ '} ${fig.id} — span ${Math.round(span)}px, ${sim.lines.length} segments, optimal ${optimal} blocs`);

  return {
    id: idx + 1,
    type: 'TURTLE',
    chapter: fig.chapter,
    maxStars: 4,
    title: `${fig.icon} ${fig.title}`,
    instruction: fig.instruction,
    startPos,
    allowedBlocks: fig.allowed || (fig.vars.length ? TURTLE_VARS : TURTLE),
    maxBlocks: optimal,
    validation: { stars: { blocks: optimal, blocksFlat: flat, steps: sim.actions * 4 } },
    startBlocks: fig.vars.length
      ? `<xml xmlns="https://developers.google.com/blockly/xml"><variables>${fig.vars.map((n, i) => `<variable id="seed_${n}_${i}">${n}</variable>`).join('')}</variables></xml>`
      : '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
    solutionBlocks: programXml(fig.nodes, fig.vars),
    inputs: {}, hiddenVars: [], lockedVars: [], targets: {},
  };
}

// Leçons interactives (plugin ANGLE, plein écran)
const LESSONS = {
  supp: { icon: '📐', title: 'Leçon : le supplément', instruction: "Découvre pourquoi **tourner de 120°** dessine un angle de **60°**. Joue avec le curseur, puis « J'ai compris »." },
  tour: { icon: '🔄', title: 'Leçon : le tour complet', instruction: "Regarde la tortue faire le tour d'un polygone : ses virages totalisent **360°**. D'où **360 ÷ n**." },
  quiz: { icon: '🎯', title: 'Leçon : quiz des angles', instruction: "Entraîne-toi à trouver le bon **virage** selon l'angle voulu, puis « J'ai compris »." },
};
function buildLessonLevel(mode, idx) {
  const l = LESSONS[mode];
  report.push(`📐 leçon ${mode}`);
  return {
    id: idx + 1, type: 'ANGLE', mode, chapter: 'Comprendre les angles', maxStars: 4,
    title: `${l.icon} ${l.title}`, instruction: l.instruction,
  };
}

// ORDRE de la campagne : 6 niveaux d'intro (leçon → exercice ×3) puis le reste.
const ORDER = [
  { lesson: 'supp' }, { fig: 'chevron' },
  { lesson: 'tour' }, { fig: 'triangle' },
  { lesson: 'quiz' }, { fig: 'pentagone' },
  { fig: 'carre' }, { fig: 'hexagone' }, { fig: 'octogone' }, { fig: 'decagone' },
  { fig: 'rosace-carres' }, { fig: 'rosace-triangles' }, { fig: 'rosace-hexagones' },
  { fig: 'spirale-carree' }, { fig: 'spirale-triangle' },
];

const levels = ORDER.map((entry, i) =>
  entry.lesson ? buildLessonLevel(entry.lesson, i) : buildFigureLevel(figById[entry.fig], i)
);

const campaign = {
  title: '🐢 Figures géométriques — Tortue',
  description: "Reproduis chaque figure avec la tortue : polygones réguliers (angle = 360/n), rosaces (motifs) et spirales (variables). Inspiré des défis Scratch monclasseurdemaths.fr.",
  levels,
};

const outPath = join(__dirname, '..', 'public', 'examples', 'figures_tortue.blokaly.json');
writeFileSync(outPath, JSON.stringify(campaign, null, 2));

console.log('\n=== RAPPORT TORTUE ===');
report.forEach((r) => console.log(r));
console.log(`\n${levels.length} niveaux écrits dans ${outPath}`);
