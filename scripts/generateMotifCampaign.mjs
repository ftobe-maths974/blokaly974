// Générateur du parcours « Motifs sur une grille » (mode MOTIF), façon Algorea.
// Chaque niveau = un motif cible (suite de couleurs) à reproduire. Le budget de
// blocs (maxBlocks) correspond à la solution FACTORISÉE avec « Répéter » → vise 4⭐.
//
// Usage : node scripts/generateMotifCampaign.mjs
// Sortie : public/examples/motifs_grille.blokaly.json

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const COLOR_BLOCKS = ['motif_R', 'motif_B', 'motif_J', 'motif_V'];
const ALLOWED = [...COLOR_BLOCKS, 'controls_repeat_ext'];

// motif = unité répétée `count` fois
const rep = (unit, count) => Array.from({ length: count }, () => unit).flat();
// solution factorisée : repeat(1) + shadow math_number(1) + 1 bloc / couleur
const optimalBlocks = (unit) => 2 + unit.length;

const LEVELS = [
  // ---- Motifs répétés ----
  { icon: '🔴', title: 'Rouge & Bleu', chapter: 'Motifs répétés', unit: ['R', 'B'], count: 3,
    instruction: "Reproduis le motif **rouge, bleu** qui se répète. Repère l'unité qui revient et utilise **Répéter** !" },
  { icon: '🚦', title: 'Feu tricolore', chapter: 'Motifs répétés', unit: ['R', 'J', 'V'], count: 3,
    instruction: "Le motif **rouge, jaune, vert** se répète 3 fois." },
  { icon: '🧱', title: 'Deux rouges, un bleu', chapter: 'Motifs répétés', unit: ['R', 'R', 'B'], count: 4,
    instruction: "Motif **rouge, rouge, bleu**, répété 4 fois." },
  { icon: '🌈', title: 'Quatre couleurs', chapter: 'Motifs répétés', unit: ['B', 'V', 'R', 'J'], count: 3,
    instruction: "Le motif **bleu, vert, rouge, jaune** revient 3 fois." },
  { icon: '➿', title: 'La longue bande', chapter: 'Motifs répétés', unit: ['R', 'B'], count: 8,
    instruction: "16 cases ! Sans **Répéter** c'est très long… repère le motif **rouge, bleu**." },

  // ---- Motifs plus riches ----
  { icon: '🎏', title: 'Bandes de 3', chapter: 'Motifs riches', unit: ['R', 'R', 'R', 'B', 'B'], count: 3,
    instruction: "Motif **3 rouges, 2 bleus**, répété 3 fois. (Astuce : tu peux même imbriquer un Répéter !)" },
  { icon: '🎽', title: 'Drapeau répété', chapter: 'Motifs riches', unit: ['B', 'B', 'J', 'V', 'V'], count: 3,
    instruction: "Motif **bleu, bleu, jaune, vert, vert**, répété 3 fois." },
];

const levels = LEVELS.map((l, i) => {
  const target = rep(l.unit, l.count);
  const optimal = optimalBlocks(l.unit);
  return {
    id: i + 1,
    type: 'MOTIF',
    chapter: l.chapter,
    maxStars: 4,
    title: `${l.icon} ${l.title}`,
    instruction: l.instruction,
    target,
    allowedBlocks: ALLOWED,
    maxBlocks: optimal,
    validation: { stars: { blocks: optimal, blocksFlat: target.length, steps: target.length + 5 } },
    startBlocks: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
    solutionBlocks: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
    inputs: {}, hiddenVars: [], lockedVars: [], targets: {},
  };
});

const campaign = {
  title: '🎨 Motifs sur une grille',
  description: "Reproduis chaque motif coloré en repérant ce qui se répète, puis factorise avec la boucle « Répéter ». Inspiré des défis Algorea (didapro).",
  levels,
};

const outPath = join(__dirname, '..', 'public', 'examples', 'motifs_grille.blokaly.json');
writeFileSync(outPath, JSON.stringify(campaign, null, 2));
console.log(`${levels.length} niveaux Motifs écrits dans ${outPath}`);
levels.forEach((l) => console.log(`  ${l.id}. ${l.title} — cible ${l.target.join('')} (optimal ${l.maxBlocks} blocs)`));
