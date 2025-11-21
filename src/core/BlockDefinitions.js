export const BLOCK_DEFINITIONS = {
  // --- MAZE ---
  'maze_move_forward': '<block type="maze_move_forward"></block>',
  'maze_turn': `
    <block type="maze_turn"><field name="DIR">LEFT</field></block>
    <block type="maze_turn"><field name="DIR">RIGHT</field></block>
  `,

  // --- LOGIQUE & BOUCLES ---
  'controls_repeat_ext': `
    <block type="controls_repeat_ext">
      <value name="TIMES">
        <shadow type="math_number"><field name="NUM">5</field></shadow>
      </value>
    </block>
  `,
  'controls_if': '<block type="controls_if"></block>',
  'logic_compare': '<block type="logic_compare"></block>',
  'logic_operation': '<block type="logic_operation"></block>',
  'controls_whileUntil': '<block type="controls_whileUntil"></block>',

  // --- MATHS ---
  'math_number': '<block type="math_number"></block>',
  'math_arithmetic': `
    <block type="math_arithmetic">
      <value name="A"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
      <value name="B"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
    </block>
  `,
  'math_modulo': `
    <block type="math_modulo">
      <value name="DIVIDEND"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
      <value name="DIVISOR"><shadow type="math_number"><field name="NUM">2</field></shadow></value>
    </block>
  `,
  'math_random_int': `
    <block type="math_random_int">
      <value name="FROM"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
      <value name="TO"><shadow type="math_number"><field name="NUM">100</field></shadow></value>
    </block>
  `,

  // --- LISTES ---
  'lists_create_with': '<block type="lists_create_with"><mutation items="3"></mutation></block>',
  'lists_getIndex': '<block type="lists_getIndex"></block>',
  'lists_setIndex': '<block type="lists_setIndex"></block>',
  'lists_length': '<block type="lists_length"></block>',

  // --- INTERACTIONS ---
  'text_print': '<block type="text_print"></block>',
  'text_prompt_ext': '<block type="text_prompt_ext"><value name="TEXT"><shadow type="text"><field name="TEXT">?</field></shadow></value></block>',
};

const CATEGORY_STRUCTURE = {
  'Mouvements': ['maze_move_forward', 'maze_turn'],
  'Logique': ['controls_repeat_ext', 'controls_whileUntil', 'controls_if', 'logic_compare', 'logic_operation'],
  'Mathématiques': ['math_number', 'math_arithmetic', 'math_modulo', 'math_random_int'],
  'Listes & Tableaux': ['lists_create_with', 'lists_getIndex', 'lists_setIndex', 'lists_length'],
  'Interactions': ['text_print', 'text_prompt_ext']
};

export const generateToolbox = (allowedBlocks, levelInputs, hiddenVars = [], lockedVars = []) => {
  
  // 1. PRÉPARATION DES MORCEAUX XML
  let variableCategoryXml = '';
  let variableRootXml = '';
  let categoriesXml = '';
  let orphansXml = '';

  let remainingBlocks = new Set(allowedBlocks || []);
  let hasAnyCategory = false;

  // --- TRAITEMENT DES VARIABLES ---
  if (levelInputs && Object.keys(levelInputs).length > 0) {
      const allKeys = Object.keys(levelInputs);
      const visibleKeys = allKeys.filter(k => !hiddenVars.includes(k));
      
      if (visibleKeys.length > 0) {
          const hasSet = remainingBlocks.has('variables_set');
          
          let blocksStr = '';
          visibleKeys.forEach(key => {
              if (lockedVars.includes(key)) {
                  blocksStr += `<block type="system_var_get"><field name="VAR_NAME">${key}</field></block>`;
              } else {
                  blocksStr += `<block type="variables_get"><field name="VAR">${key}</field></block>`;
                  if (hasSet) {
                      blocksStr += `<block type="variables_set"><field name="VAR">${key}</field></block>`;
                  }
              }
          });

          if (hasSet) {
              // Si écriture permise => Dossier "Variables"
              variableCategoryXml = `<category name="Variables" colour="330">${blocksStr}</category>`;
              hasAnyCategory = true;
          } else {
              // Sinon => Racine
              variableRootXml = blocksStr;
          }
      }
      remainingBlocks.delete('variables_set');
      remainingBlocks.delete('variables_get');
  }

  // --- TRAITEMENT DES CATÉGORIES STANDARDS ---
  Object.entries(CATEGORY_STRUCTURE).forEach(([catName, catBlockList]) => {
    const selectedInCat = catBlockList.filter(b => remainingBlocks.has(b));
    if (selectedInCat.length === 0) return;

    // Règle : Dossier SEULEMENT si la catégorie est COMPLÈTE
    const isFullCategory = selectedInCat.length === catBlockList.length;

    if (isFullCategory) {
      let colour = '0'; 
      if (catName === 'Mouvements') colour = '120';
      if (catName === 'Logique') colour = '210';
      if (catName === 'Mathématiques') colour = '230';
      if (catName === 'Listes & Tableaux') colour = '260';
      if (catName === 'Interactions') colour = '160';

      categoriesXml += `<category name="${catName}" colour="${colour}">`;
      selectedInCat.forEach(blockType => {
        if (BLOCK_DEFINITIONS[blockType]) {
          categoriesXml += BLOCK_DEFINITIONS[blockType];
          remainingBlocks.delete(blockType);
        }
      });
      categoriesXml += '</category>';
      hasAnyCategory = true; // On a créé un dossier, donc on passe en mode "Catégorie"
    } 
  });

  // --- TRAITEMENT DES ORPHELINS ---
  remainingBlocks.forEach(blockType => {
     if (BLOCK_DEFINITIONS[blockType]) {
        orphansXml += BLOCK_DEFINITIONS[blockType];
     }
  });

  // 2. ASSEMBLAGE FINAL INTELLIGENT
  let finalXml = '<xml id="toolbox" style="display: none">';

  if (hasAnyCategory) {
      // MODE CATÉGORIE : Tout doit être dans une catégorie
      finalXml += variableCategoryXml; // Le dossier Variables (s'il existe)
      finalXml += categoriesXml;       // Les autres dossiers complets
      
      // Si on a des variables "racine" (lecture seule) mais qu'on est en mode catégorie à cause d'un autre dossier
      if (variableRootXml) {
          finalXml += `<category name="Constantes" colour="60">${variableRootXml}</category>`;
      }

      // Les blocs orphelins vont dans "Divers"
      if (orphansXml) {
          finalXml += `<category name="Divers" colour="0">${orphansXml}</category>`;
      }
  } else {
      // MODE FLYOUT (PLAT) : Aucun dossier n'a été créé, on met tout à la racine
      finalXml += variableRootXml;
      finalXml += orphansXml;
  }

  finalXml += '</xml>';
  return finalXml;
};