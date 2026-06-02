import { MotifLogic } from './logic';
import Runner from './Runner';
import Editor from './Editor';

export default {
  id: 'MOTIF',
  name: 'Motifs',
  icon: '🎨',

  registerBlocks: MotifLogic.registerBlocks,
  getToolbox: (allowedBlocks) => ({ xml: MotifLogic.getToolboxXML(allowedBlocks), category: 'Couleurs' }),
  executeStep: MotifLogic.executeStep,

  evaluateResult: (state, levelData, metrics) => {
    const target = levelData.target || [];
    const cells = state?.cells || [];

    const ok = target.length === cells.length && target.every((c, i) => c === cells[i]);
    if (!ok) {
      const painted = cells.filter(Boolean).length;
      return {
        status: 'FAIL',
        feedback: {
          title: 'Motif incorrect',
          message: painted < target.length
            ? "Toutes les cases ne sont pas peintes comme le modèle."
            : "Les couleurs ne correspondent pas au modèle.",
        },
      };
    }

    // 4 ⭐ : récompense l'usage de « Répéter » (moins de blocs)
    const v = levelData.validation?.stars || {};
    const optimal = v.blocks ?? levelData.maxBlocks ?? 6;
    const flat = v.blocksFlat ?? Math.max(target.length, optimal + 6);
    const usedBlocks = metrics.blockCount || 0;

    let stars, message;
    if (usedBlocks <= optimal) { stars = 4; message = 'Parfait : motif factorisé avec Répéter ! 🎨'; }
    else if (usedBlocks <= Math.round((optimal + flat) / 2)) { stars = 3; message = 'Bien ! Peux-tu faire plus court ?'; }
    else if (usedBlocks <= flat) { stars = 2; message = 'Réussi ! Une boucle Répéter raccourcirait ton code.'; }
    else { stars = 1; message = 'Réussi, mais bloc par bloc. Repère le motif qui se répète !'; }

    return {
      status: 'WIN',
      score: { stars, maxStars: 4, primaryMetric: 'Motif conforme', targetMetric: `Optimal : ${optimal} blocs`, details: { blocks: usedBlocks } },
      feedback: { title: 'Bravo !', message },
    };
  },

  catalog: [
    {
      category: 'Couleurs',
      color: 'purple-500',
      blocks: MotifLogic.COLORS.map((c) => ({ type: c.type, label: c.label.replace(/^\S+\s*/, ''), icon: c.label.match(/^\S+/)[0] })),
    },
    {
      category: 'Boucles',
      color: 'amber-500',
      blocks: [{ type: 'controls_repeat_ext', label: 'Répéter N fois', icon: '🔁' }],
    },
  ],

  RenderComponent: Runner,
  EditorComponent: Editor,
  config: {},
};
