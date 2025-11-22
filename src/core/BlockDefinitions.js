export const BLOCK_DEFINITIONS = {
  // --- MAZE ---
  'maze_move_forward': '<block type="maze_move_forward"></block>',
  'maze_turn': `
    <block type="maze_turn"><field name="DIR">LEFT</field></block>
    <block type="maze_turn"><field name="DIR">RIGHT</field></block>
  `,

  // --- TURTLE ---
  'turtle_move': `
    <block type="turtle_move">
      <value name="VALUE"><shadow type="math_number"><field name="NUM">50</field></shadow></value>
    </block>
  `,
  'turtle_turn': `
    <block type="turtle_turn">
      <value name="VALUE"><shadow type="math_number"><field name="NUM">90</field></shadow></value>
    </block>
  `,
  'turtle_pen': `
    <block type="turtle_pen"><field name="STATE">UP</field></block>
    <block type="turtle_pen"><field name="STATE">DOWN</field></block>
  `,
  'turtle_color': `
    <block type="turtle_color"><field name="COLOR">#ff0000</field></block>
  `,

  // --- LOGIQUE ---
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

// Configuration des catégories par type de jeu
// Exporté pour être utilisé par l'UI de l'éditeur (les checkboxes)
export const CATEGORIES_BY_TYPE = {
  'MAZE': ['Mouvements', 'Logique'],
  'TURTLE': ['Tortue', 'Logique', 'Mathématiques', 'Variables'],
  'MATH': ['Mathématiques', 'Listes', 'Variables', 'Interactions', 'Logique']
};

// Contenu de chaque catégorie
export const CATEGORY_CONTENTS = {
  'Mouvements': ['maze_move_forward', 'maze_turn'],
  'Tortue': ['turtle_move', 'turtle_turn', 'turtle_pen', 'turtle_color'],
  'Logique': ['controls_repeat_ext', 'controls_whileUntil', 'controls_if', 'logic_compare', 'logic_operation'],
  'Mathématiques': ['math_number', 'math_arithmetic', 'math_modulo', 'math_random_int'],
  'Listes': ['lists_create_with', 'lists_getIndex', 'lists_setIndex', 'lists_length'],
  'Interactions': ['text_print', 'text_prompt_ext']
};

// Générateur pour l'ÉLÈVE (filtre selon allowedBlocks)
export const generateToolbox = (allowedBlocks, levelInputs, hiddenVars = [], lockedVars = []) => {
  return buildToolboxXML(allowedBlocks, levelInputs, hiddenVars, lockedVars);
};

// Générateur pour le PROF (donne TOUT pour un type donné)
export const generateMasterToolbox = (type, levelInputs, hiddenVars = [], lockedVars = []) => {
  // 1. Récupérer toutes les catégories pour ce type
  const categories = CATEGORIES_BY_TYPE[type] || [];
  
  // 2. Récupérer tous les blocs de ces catégories + variables_set (toujours dispo pour le prof)
  let allBlocks = ['variables_set']; 
  categories.forEach(cat => {
    if (CATEGORY_CONTENTS[cat]) {
      allBlocks = [...allBlocks, ...CATEGORY_CONTENTS[cat]];
    }
  });

  // 3. Générer la toolbox complète
  return buildToolboxXML(allBlocks, levelInputs, hiddenVars, lockedVars, true);
};

// Fonction interne de construction
const buildToolboxXML = (allowedBlocks, levelInputs, hiddenVars, lockedVars, forceFull = false) => {
  let xmlContent = '';
  let remainingBlocks = new Set(allowedBlocks || []);
  let hasCategories = false;

  // --- 1. VARIABLES ---
  let variableXml = '';
  if (levelInputs && Object.keys(levelInputs).length > 0) {
      const visibleKeys = Object.keys(levelInputs).filter(k => !hiddenVars.includes(k));
      if (visibleKeys.length > 0) {
          visibleKeys.forEach(key => {
              if (lockedVars.includes(key)) {
                  variableXml += `<block type="system_var_get"><field name="VAR_NAME">${key}</field></block>`;
              } else {
                  variableXml += `<block type="variables_get"><field name="VAR">${key}</field></block>`;
                  if (remainingBlocks.has('variables_set')) {
                      variableXml += `<block type="variables_set"><field name="VAR">${key}</field></block>`;
                  }
              }
          });
          
          if (remainingBlocks.has('variables_set')) {
             xmlContent += `<category name="Variables" colour="330">${variableXml}</category>`;
             hasCategories = true;
             variableXml = ''; 
          }
      }
      remainingBlocks.delete('variables_set');
      remainingBlocks.delete('variables_get');
  }

  // --- 2. CATÉGORIES ---
  Object.entries(CATEGORY_CONTENTS).forEach(([catName, catBlockList]) => {
    const selectedInCat = catBlockList.filter(b => remainingBlocks.has(b));
    if (selectedInCat.length === 0) return;

    // Mode Prof (forceFull) : On crée toujours le dossier
    // Mode Élève : On crée le dossier SEULEMENT si tout est coché
    const isFullCategory = forceFull || (selectedInCat.length === catBlockList.length);

    if (isFullCategory) {
      let colour = '0'; 
      if (catName === 'Mouvements') colour = '120';
      if (catName === 'Tortue') colour = '160';
      if (catName === 'Logique') colour = '210';
      if (catName === 'Mathématiques') colour = '230';
      if (catName === 'Listes') colour = '260';
      if (catName === 'Interactions') colour = '160';

      xmlContent += `<category name="${catName}" colour="${colour}">`;
      selectedInCat.forEach(blockType => {
        if (BLOCK_DEFINITIONS[blockType]) {
          xmlContent += BLOCK_DEFINITIONS[blockType];
          remainingBlocks.delete(blockType);
        }
      });
      xmlContent += '</category>';
      hasCategories = true;
    }
  });

  // --- 3. ORPHELINS ---
  let orphansXml = variableXml; 
  remainingBlocks.forEach(blockType => {
     if (BLOCK_DEFINITIONS[blockType]) {
        orphansXml += BLOCK_DEFINITIONS[blockType];
     }
  });

  // --- 4. FINAL ---
  if (hasCategories) {
      if (orphansXml) {
          xmlContent += `<category name="⭐ Actions" colour="0">${orphansXml}</category>`;
      }
  } else {
      xmlContent += orphansXml;
  }

  return { 
      xml: `<xml id="toolbox" style="display: none">${xmlContent}</xml>`, 
      hasCategories 
  };
};