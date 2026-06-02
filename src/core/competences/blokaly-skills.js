// Compétences exercées par chaque mode Blokaly (défaut). Un niveau peut surcharger
// via `levelData.competences` dans le JSON de campagne.
// Vocabulaire : voir le référentiel partagé (@maths974/competences).
export const SKILLS_BY_TYPE = {
  MAZE: ['prog.sequence', 'prog.boucle', 'geom.deplacement'],
  TURTLE: ['prog.boucle', 'geom.angle', 'geom.polygone'],
  MOTIF: ['prog.boucle', 'motif.identifier'],
  MATH: ['prog.variable', 'calcul.operation'],
  EQUATION: ['equation.isoler', 'equation.equilibre'],
  ANGLE: ['geom.angle'],
  IFRAME: [],
};

export const skillsForLevel = (level) =>
  (Array.isArray(level?.competences) && level.competences.length)
    ? level.competences
    : (SKILLS_BY_TYPE[level?.type] || []);
