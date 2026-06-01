// Générateur de campagne MAZE à partir de figures « avancer + tourner 90° ».
//
// Idée : chaque figure (carré, escalier, peigne, croix, créneaux…) est un tracé
// continu sur quadrillage. On le transforme en couloir de labyrinthe d'une case
// de large : le robot/tortue va de 🟩 à 🏁 en parcourant exactement la figure.
//
// Figures FERMÉES (carré, croix, engrenage) : on coupe UNE case sur un segment
// droit → 🟩 et 🏁 se retrouvent de part et d'autre de la coupure (2 cases
// d'écart, mur entre les deux) → aucun raccourci, le robot doit faire tout le tour.
//
// Usage : node scripts/generateMazeCampaign.mjs
// Sortie : public/examples/figures_geometriques.blokaly.json
//
// Le script VÉRIFIE la solvabilité de chaque niveau (rejeu de la solution).

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Codes de grille (cf. features/maze/config.js) ---
const WALL = 4, PATH = 1, START = 2, GOAL = 3;

// Directions : 0=Est, 1=Sud, 2=Ouest, 3=Nord (identique au moteur maze)
const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];

// --- Simulation d'un programme relatif → liste ordonnée de cases ---
// program : tableau de { f: n } (avancer n cases) ou { t: 'L'|'R' } (tourner)
function tracePath(program, startDir = 0) {
  let x = 0, y = 0, dir = startDir;
  const cells = [{ x, y }];
  const turnsAt = []; // pour info
  for (const step of program) {
    if (step.t) {
      dir = (dir + (step.t === 'R' ? 1 : 3)) % 4;
      turnsAt.push(cells.length - 1);
    } else {
      for (let i = 0; i < step.f; i++) {
        x += DX[dir]; y += DY[dir];
        cells.push({ x, y });
      }
    }
  }
  return { cells, endDir: dir };
}

const key = (c) => `${c.x},${c.y}`;
const adjacent = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;

// Détecte si deux cases NON consécutives du tracé se touchent (couloir épais / ambigu)
function hasSelfTouch(cells) {
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 2; j < cells.length; j++) {
      if (adjacent(cells[i], cells[j])) {
        // tolère le contact entre première et dernière (boucle fermée) géré ailleurs
        return { i, j, a: cells[i], b: cells[j] };
      }
    }
  }
  return null;
}

// Coupe une boucle fermée : retire une case sur un segment droit, renvoie le
// chemin ouvert + la case retirée (mur). loopCells = cases distinctes de la boucle.
function cutClosedLoop(loopCells) {
  const m = loopCells.length;
  // cherche un index k tel que k-1, k, k+1 alignés (segment droit)
  for (let k = 0; k < m; k++) {
    const a = loopCells[(k - 1 + m) % m];
    const b = loopCells[k];
    const c = loopCells[(k + 1) % m];
    const straight = (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);
    if (straight) {
      const removed = b;
      const open = [];
      for (let i = 1; i < m; i++) open.push(loopCells[(k + i) % m]); // de k+1 ... k-1
      return { open, removed };
    }
  }
  return null;
}

// Construit la grille à partir d'un chemin (cases PATH), start, goal, et cases murs forcées
function buildGrid(pathCells, start, goal, extraWalls = []) {
  const all = [...pathCells, ...extraWalls, start, goal];
  const minX = Math.min(...all.map((c) => c.x));
  const minY = Math.min(...all.map((c) => c.y));
  const maxX = Math.max(...all.map((c) => c.x));
  const maxY = Math.max(...all.map((c) => c.y));
  const MARGIN = 1;
  const cols = maxX - minX + 1 + 2 * MARGIN;
  const rows = maxY - minY + 1 + 2 * MARGIN;
  const ox = -minX + MARGIN, oy = -minY + MARGIN;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(WALL));
  for (const c of pathCells) grid[c.y + oy][c.x + ox] = PATH;
  grid[start.y + oy][start.x + ox] = START;
  grid[goal.y + oy][goal.x + ox] = GOAL;
  return { grid, ox, oy, cols, rows };
}

// Vérifie la solvabilité : depuis start, en suivant le couloir (1 seul chemin),
// on doit atteindre goal. BFS simple.
function isSolvable(grid, start, oxoy) {
  const { ox, oy } = oxoy;
  const rows = grid.length, cols = grid[0].length;
  const seen = new Set();
  const q = [{ x: start.x + ox, y: start.y + oy }];
  seen.add(`${q[0].x},${q[0].y}`);
  while (q.length) {
    const { x, y } = q.shift();
    if (grid[y][x] === GOAL) return true;
    for (let d = 0; d < 4; d++) {
      const nx = x + DX[d], ny = y + DY[d];
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const cell = grid[ny][nx];
      if (cell === WALL) continue;
      const k = `${nx},${ny}`;
      if (seen.has(k)) continue;
      seen.add(k);
      q.push({ x: nx, y: ny });
    }
  }
  return false;
}

// Compte les actions (moves + turns) et le nb de virages d'un chemin ordonné
function pathMetrics(orderedCells) {
  const moves = orderedCells.length - 1;
  let turns = 0;
  for (let i = 2; i < orderedCells.length; i++) {
    const a = orderedCells[i - 2], b = orderedCells[i - 1], c = orderedCells[i];
    const straight = (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);
    if (!straight) turns++;
  }
  return { moves, turns, actions: moves + turns };
}

// dir initial pour aller de a vers b (cases adjacentes)
function dirBetween(a, b) {
  for (let d = 0; d < 4; d++) if (a.x + DX[d] === b.x && a.y + DY[d] === b.y) return d;
  return 0;
}

// =====================================================================
// FIGURES (ordonnées par difficulté). f = avancer N cases ; t = tourner.
// closed:true → figure fermée (sera coupée). optimal = nb de blocs de la
// solution « élégante » (avec boucle Répéter) pour viser 4 ⭐.
// =====================================================================
const VAR_BLOCKS = [
  'maze_move_forward', 'maze_turn', 'controls_repeat_ext',
  'variables_set', 'variables_get', 'math_number', 'math_arithmetic',
];

const FIGURES = [
  {
    id: 'carre-petit', title: 'Le petit carré', icon: '⬜', difficulty: 1, closed: true,
    instruction: "Fais le tour du **carré** 🟩→🏁. Astuce : c'est 4 fois la même chose… pense à **Répéter** !",
    program: rep(4, [{ f: 3 }, { t: 'R' }]), optimal: 6, allowed: ['maze_move_forward', 'maze_turn', 'controls_repeat_ext'],
  },
  {
    id: 'escalier', title: "L'escalier", icon: '🪜', difficulty: 2, closed: false,
    instruction: "Grimpe l'**escalier** marche après marche jusqu'au drapeau 🏁.",
    program: [...rep(4, [{ f: 2 }, { t: 'L' }, { f: 2 }, { t: 'R' }]), { f: 2 }], optimal: 8,
    allowed: ['maze_move_forward', 'maze_turn', 'controls_repeat_ext'],
  },
  {
    id: 'carre-grand', title: 'Le grand carré', icon: '◻️', difficulty: 2, closed: true,
    instruction: "Même idée que le petit carré, mais en plus grand. **Répéter** reste ton ami.",
    program: rep(4, [{ f: 5 }, { t: 'R' }]), optimal: 6, allowed: ['maze_move_forward', 'maze_turn', 'controls_repeat_ext'],
  },
  {
    id: 'peigne', title: 'Le peigne', icon: '🪮', difficulty: 3, closed: false,
    instruction: "Dessine les dents du **peigne**. Repère le motif qui se répète.",
    program: [...rep(4, [{ f: 2 }, { t: 'R' }, { f: 2 }, { t: 'R' }, { f: 2 }, { t: 'L' }, { f: 2 }, { t: 'L' }]), { f: 2 }],
    optimal: 12, allowed: ['maze_move_forward', 'maze_turn', 'controls_repeat_ext'],
  },
  {
    id: 'croix', title: 'La croix', icon: '➕', difficulty: 4, closed: true,
    instruction: "Parcours le contour de la **croix** 🟩→🏁 (12 segments, motif à 4 branches).",
    // Contour exact d'un plus (12 segments de 2 cases), démarrage vers l'est.
    program: [
      { f: 2 }, { t: 'R' }, { f: 2 }, { t: 'L' }, { f: 2 }, { t: 'R' }, { f: 2 }, { t: 'R' },
      { f: 2 }, { t: 'L' }, { f: 2 }, { t: 'R' }, { f: 2 }, { t: 'R' }, { f: 2 }, { t: 'L' },
      { f: 2 }, { t: 'R' }, { f: 2 }, { t: 'R' }, { f: 2 }, { t: 'L' }, { f: 2 },
    ],
    optimal: 12, allowed: ['maze_move_forward', 'maze_turn', 'controls_repeat_ext'],
  },
  {
    id: 'rectangle', title: 'Le rectangle', icon: '▭', difficulty: 4, closed: true,
    instruction: "Un **rectangle** : attention, les côtés n'ont pas tous la même longueur ! Deux longueurs, deux largeurs.",
    program: [{ f: 5 }, { t: 'R' }, { f: 3 }, { t: 'R' }, { f: 5 }, { t: 'R' }, { f: 3 }, { t: 'R' }],
    optimal: 10, allowed: ['maze_move_forward', 'maze_turn', 'controls_repeat_ext'],
  },
  {
    id: 'double-escalier', title: "Le double escalier", icon: '⛰️', difficulty: 5, closed: false,
    instruction: "Monte puis redescends : un grand **escalier** symétrique jusqu'au 🏁.",
    program: [
      ...rep(4, [{ f: 2 }, { t: 'L' }, { f: 2 }, { t: 'R' }]),
      ...rep(4, [{ f: 2 }, { t: 'R' }, { f: 2 }, { t: 'L' }]),
      { f: 2 },
    ],
    optimal: 12, allowed: ['maze_move_forward', 'maze_turn', 'controls_repeat_ext'],
  },

  // ===================================================================
  // CHAPITRE 2 — INTRODUCTION DE LA VARIABLE (les figures grandissent)
  // ===================================================================
  {
    id: 'marches-croissantes', title: 'Les marches qui grandissent', icon: '📈', difficulty: 6, closed: false,
    chapter: 'Variables',
    instruction: "Chaque marche est **plus longue** (1, 2, 3, 4, 5). Crée une **variable** `n` (départ **1**). Dans une boucle **Répéter 5 fois**, fais : « **Répéter `n` fois → avancer** », tourner ↺, avancer, tourner ↻, puis **`n` = `n` + 1**.\n\n⚠️ Le grand « Répéter » compte **5**, pas `n` !",
    program: growStaircase(5), optimal: 12, allowed: VAR_BLOCKS,
  },
  {
    id: 'spirale', title: 'La spirale', icon: '🌀', difficulty: 7, closed: false,
    chapter: 'Variables',
    instruction: "La **spirale** s'agrandit. Crée une **variable** `n` (départ **2**). Dans **Répéter 6 fois** : « Répéter `n` → avancer », tourner ↺, « Répéter `n` → avancer », tourner ↺, puis **`n` = `n` + 2**.\n\n⚠️ Le grand « Répéter » compte **6**, pas `n` !",
    program: squareSpiral(6), optimal: 14, allowed: VAR_BLOCKS,
  },
];

// helper : répète un motif n fois (à plat) pour la simulation
function rep(n, motif) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(...motif);
  return out;
}

// Escalier dont les marches grandissent : marche k de longueur k (1,2,3,…).
// Solution optimale = variable n incrémentée à chaque tour.
function growStaircase(k) {
  const out = [];
  for (let i = 1; i <= k; i++) {
    out.push({ f: i }, { t: 'L' }, { f: 1 }, { t: 'R' });
  }
  return out;
}

// Spirale carrée « lâche » : bras 2,2,4,4,6,6,… (incrément de 2) → 1 case de mur
// entre deux anneaux, donc pas de raccourci. Solution optimale = variable + boucle.
function squareSpiral(laps) {
  const out = [];
  let len = 2;
  for (let i = 0; i < laps; i++) {
    out.push({ f: len }, { t: 'L' });
    out.push({ f: len }, { t: 'L' });
    len += 2;
  }
  return out;
}


// =====================================================================
// GÉNÉRATION
// =====================================================================
const levels = [];
const report = [];

for (const fig of FIGURES) {
  const { cells } = tracePath(fig.program, 0);

  let pathCells, start, goal, removed = null, ordered;

  if (fig.closed) {
    // retire la case de fermeture dupliquée
    const distinct = [];
    const seen = new Set();
    for (const c of cells) { const k = key(c); if (!seen.has(k)) { seen.add(k); distinct.push(c); } }
    const cut = cutClosedLoop(distinct);
    if (!cut) { report.push(`❌ ${fig.id}: impossible de couper la boucle`); continue; }
    pathCells = cut.open;
    removed = cut.removed;
    ordered = cut.open;
    start = ordered[0];
    goal = ordered[ordered.length - 1];
  } else {
    // chemin ouvert : dédoublonne en gardant l'ordre, vérifie pas de revisite
    ordered = cells;
    const seen = new Set();
    let dup = false;
    for (const c of cells) { const k = key(c); if (seen.has(k)) dup = true; seen.add(k); }
    if (dup) report.push(`⚠️  ${fig.id}: chemin ouvert avec case revisitée`);
    pathCells = cells;
    start = cells[0];
    goal = cells[cells.length - 1];
  }

  // contrôle couloir d'une case (pas de contact entre cases non consécutives)
  const touch = hasSelfTouch(ordered);
  if (touch) report.push(`⚠️  ${fig.id}: contact couloir entre (${touch.a.x},${touch.a.y}) et (${touch.b.x},${touch.b.y})`);

  const extraWalls = removed ? [removed] : [];
  const { grid, ox, oy } = buildGrid(pathCells, start, goal, extraWalls);

  const solvable = isSolvable(grid, start, { ox, oy });
  const metrics = pathMetrics(ordered);
  const startDir = dirBetween(ordered[0], ordered[1]);
  // budget « solution à plat » (sans boucle) ≈ actions, budget optimal = fig.optimal
  const flatBlocks = metrics.actions; // 1 bloc par avancer/tourner

  report.push(`${solvable ? '✅' : '❌'} ${fig.id} — ${grid[0].length}×${grid.length}, ${pathCells.length} cases, ${metrics.actions} actions, optimal ${fig.optimal} blocs ${touch ? '(⚠ contact)' : ''}`);

  if (!solvable) continue;

  levels.push({
    id: Number(`${fig.difficulty}${levels.length + 1}`),
    type: 'MAZE',
    chapter: fig.chapter || 'Figures',
    title: `${fig.icon} ${fig.title}`,
    instruction: fig.instruction,
    grid,
    startPos: { x: start.x + ox, y: start.y + oy, dir: startDir },
    allowedBlocks: fig.allowed,
    maxBlocks: fig.optimal,
    // barème 4 ⭐ : blocks (optimal, avec boucle) / blocksFlat (sans boucle) / steps
    validation: { stars: { blocks: fig.optimal, blocksFlat: flatBlocks, steps: metrics.actions } },
    startBlocks: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
    solutionBlocks: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
    inputs: {}, hiddenVars: [], lockedVars: [], targets: {},
  });
}

const campaign = {
  title: '🐢 Figures géométriques — Labyrinthe',
  description: "Reproduis chaque figure en guidant la tortue, uniquement avec avancer et tourner à 90°. Inspiré des cartes Scratch monclasseurdemaths.fr.",
  levels,
};

const outPath = join(__dirname, '..', 'public', 'examples', 'figures_geometriques.blokaly.json');
writeFileSync(outPath, JSON.stringify(campaign, null, 2));

console.log('\n=== RAPPORT DE GÉNÉRATION ===');
report.forEach((r) => console.log(r));
console.log(`\n${levels.length} niveaux écrits dans ${outPath}`);
