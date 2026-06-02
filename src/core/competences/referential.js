// Référentiel de compétences PARTAGÉ entre les apps Maths974.
// Agnostique du support. Reprend le vocabulaire socle/DNB de GS.C4.2026.

// --- Macro-compétences (socle / DNB) ---
export const MACRO = {
  ch: 'Chercher',
  mo: 'Modéliser',
  re: 'Représenter',
  ra: 'Raisonner',
  ca: 'Calculer',
  co: 'Communiquer',
};

// --- Micro-compétences (granulaires), id = "domaine.action".
// Chaque micro-compétence est rattachée à ≥1 macro-compétence.
// C'est ce niveau qui est capté/cumulé entre supports.
export const SKILLS = {
  // Programmation (Blokaly : maze, turtle, motif)
  'prog.sequence': { label: 'Enchaîner des instructions', macro: ['ra'], domaine: 'Programmation' },
  'prog.boucle': { label: 'Utiliser une boucle « Répéter »', macro: ['ra', 'mo'], domaine: 'Programmation' },
  'prog.variable': { label: 'Utiliser une variable', macro: ['mo', 're'], domaine: 'Programmation' },
  'prog.condition': { label: 'Utiliser une condition (Si…)', macro: ['ra'], domaine: 'Programmation' },

  // Géométrie / repérage (Blokaly : turtle, angles)
  'geom.deplacement': { label: 'Se repérer et se déplacer', macro: ['re'], domaine: 'Géométrie' },
  'geom.angle': { label: "Comprendre l'angle de rotation (360/n, supplément)", macro: ['re', 'ca'], domaine: 'Géométrie' },
  'geom.polygone': { label: 'Construire un polygone régulier', macro: ['re', 'ra'], domaine: 'Géométrie' },

  // Motifs / régularités (Blokaly motif ; GS rapidos)
  'motif.identifier': { label: 'Identifier un motif qui se répète', macro: ['ra', 're'], domaine: 'Algorithmique' },

  // Algèbre / équations (Aljeb, Pezali, Blokaly équation, GS)
  'equation.isoler': { label: "Isoler l'inconnue", macro: ['ca', 'ra'], domaine: 'Algèbre' },
  'equation.equilibre': { label: "Conserver l'égalité (équilibre)", macro: ['mo', 'ra'], domaine: 'Algèbre' },

  // Calcul (GS ; Blokaly labo algo)
  'calcul.operation': { label: 'Effectuer un calcul', macro: ['ca'], domaine: 'Nombres & calculs' },
  'calcul.modulo': { label: 'Utiliser le reste (parité, division)', macro: ['ca', 'ra'], domaine: 'Nombres & calculs' },
};

// --- Paliers de maîtrise (4 niveaux, repris de GS) ---
export const TIERS = ['fragile', 'satisfaisant', 'tres-satisfaisant', 'expert'];

// Palier déduit d'un taux de réussite (sur une fenêtre de tentatives récentes).
// En-dessous de `minAttempts` tentatives → null (pas encore évaluable).
export function tierFromRate(rate, attempts, minAttempts = 3) {
  if (attempts < minAttempts) return null;
  if (rate < 0.4) return 'fragile';
  if (rate < 0.7) return 'satisfaisant';
  if (rate < 0.9) return 'tres-satisfaisant';
  return 'expert';
}

export const isKnownSkill = (id) => Object.prototype.hasOwnProperty.call(SKILLS, id);
