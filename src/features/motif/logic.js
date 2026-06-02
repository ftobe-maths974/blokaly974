// Mode MOTIF — « Motifs sur une grille » (façon Algorea, cf. didapro motifs).
// Le robot parcourt une bande de cases et DÉPOSE une couleur : chaque bloc
// couleur peint la case courante puis avance d'une case. L'élève reproduit le
// motif cible — le bloc « Répéter » sert à factoriser le motif répété.

let isRegistered = false;

const COLORS = [
  { type: 'motif_R', label: '🟥 Rouge', code: 'R', colour: '#e74c3c' },
  { type: 'motif_B', label: '🟦 Bleu', code: 'B', colour: '#3498db' },
  { type: 'motif_J', label: '🟨 Jaune', code: 'J', colour: '#f1c40f' },
  { type: 'motif_V', label: '🟩 Vert', code: 'V', colour: '#2ecc71' },
];

export const MotifLogic = {
  COLORS,

  registerBlocks: (Blockly, javascriptGenerator) => {
    if (isRegistered) return;
    isRegistered = true;
    console.log('🎨 Enregistrement des blocs MOTIF...');

    Blockly.common.defineBlocksWithJsonArray(
      COLORS.map((c) => ({
        type: c.type,
        message0: c.label,
        previousStatement: null,
        nextStatement: null,
        colour: c.colour,
        tooltip: `Peint la case courante en ${c.label} puis avance.`,
      })),
    );

    COLORS.forEach((c) => {
      javascriptGenerator.forBlock[c.type] = (block) =>
        `actions.push({ type: 'PAINT', color: '${c.code}', id: "${block.id}" });\n`;
    });
  },

  getToolboxXML: (allowedBlocks) => {
    let xml = '<category name="Couleurs" colour="#9b59b6">';
    COLORS.forEach((c) => {
      if (!allowedBlocks || allowedBlocks.includes(c.type)) {
        xml += `<block type="${c.type}"></block>`;
      }
    });
    xml += '</category>';
    return xml;
  },

  executeStep: (currentState, action, levelData) => {
    const n = (levelData.target || []).length || 1;
    const state = currentState || { pos: 0, cells: new Array(n).fill(null) };

    if (!action) return { newState: state, status: 'RUNNING' };

    if (action.type === 'PAINT') {
      const cells = [...state.cells];
      let pos = state.pos;
      if (pos < n) cells[pos] = action.color;
      pos += 1;
      return { newState: { pos, cells }, status: 'RUNNING' };
    }
    return { newState: state, status: 'RUNNING' };
  },
};
