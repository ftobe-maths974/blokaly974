export const BLOCK_DEFINITIONS = {
  // --- MAZE ---
  'maze_move_forward': '<block type="maze_move_forward"></block>',
  'maze_forever': '<block type="maze_forever"></block>',
  'maze_if': '<block type="maze_if"></block>',
  'maze_if_else': '<block type="maze_if_else"></block>',
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
  // --- ALGEBRE ---
  'equation_op_both': `
    <block type="equation_op_both">
      <value name="VAL"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
    </block>
  `,
  // --- LOGIQUE ---
  'controls_repeat_ext': `
    <block type="controls_repeat_ext">
      <value name="TIMES">
        <shadow type="math_number"><field name="NUM">5</field></shadow>
      </value>
    </block>
  `,
  'controls_whileUntil': '<block type="controls_whileUntil"></block>',
  'controls_if': '<block type="controls_if"></block>',
  'logic_compare': '<block type="logic_compare"></block>',
  'logic_operation': '<block type="logic_operation"></block>',
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
  
  // --- VARIABLES (Fallback) ---
  'variables_get': '<block type="variables_get"></block>',
  'variables_set': '<block type="variables_set"></block>',
};

export const BLOCK_LABELS = {
  'maze_move_forward': 'Avancer ✥', 
  'maze_turn': 'Pivoter 🗘',
  'maze_if': 'Si chemin... 📡',
  'maze_if_else': 'Si... Sinon... 📡',
  'maze_forever': 'Répéter jusqu\'à 🏁',
  'turtle_move': 'Avancer 🐢',
  'turtle_turn': 'Pivoter 🐢',
  'turtle_pen': 'Stylo ✏️',
  'turtle_color': 'Couleur 🎨',
  'controls_repeat_ext': 'Répéter N fois',
  'controls_whileUntil': 'Répéter tant que',
  'controls_if': 'Si... Alors',
  'logic_compare': 'Comparaison',
  'logic_operation': 'Opérateur',
  'math_number': 'Nombre',
  'math_arithmetic': 'Calcul',
  'math_modulo': 'Reste',
  'math_random_int': 'Aléatoire',
  'equation_op_both': 'Opération Équation',
  'text_print': 'Afficher',
  'text_prompt_ext': 'Demander',
  'lists_create_with': 'Créer liste',
  'lists_getIndex': 'Lire élément',
  'lists_setIndex': 'Modifier élément',
  'lists_length': 'Longueur liste',
  'variables_set': 'Définir variable',
  'variables_get': 'Lire variable'
};

export const CATEGORIES_BY_TYPE = {
  'MAZE': ['Mouvements', 'Capteurs', 'Logique'],
  'TURTLE': ['Tortue', 'Logique', 'Mathématiques', 'Variables'],
  'MATH': ['Mathématiques', 'Listes', 'Variables', 'Interactions', 'Logique'],
  'EQUATION': ['Algèbre']
};

export const CATEGORY_CONTENTS = {
  'Mouvements': ['maze_move_forward', 'maze_turn'],
  'Capteurs': ['maze_if', 'maze_if_else', 'maze_forever'],
  'Tortue': ['turtle_move', 'turtle_turn', 'turtle_pen', 'turtle_color'],
  'Logique': ['controls_repeat_ext', 'controls_whileUntil', 'controls_if', 'logic_compare', 'logic_operation'],
  'Mathématiques': ['math_number', 'math_arithmetic', 'math_modulo', 'math_random_int'],
  'Listes': ['lists_create_with', 'lists_getIndex', 'lists_setIndex', 'lists_length'],
  'Variables': ['variables_set'],
  'Interactions': ['text_print', 'text_prompt_ext'],
  'Algèbre': ['equation_op_both', 'math_number']
};

// --- GÉNÉRATEUR ADAPTATIF ---

export const generateToolbox = (allowedBlocks, levelInputs, hiddenVars = [], lockedVars = []) => {
  return buildToolboxXML(allowedBlocks, levelInputs, hiddenVars, lockedVars);
};

export const generateMasterToolbox = (type, levelInputs, hiddenVars = [], lockedVars = []) => {
  const categories = CATEGORIES_BY_TYPE[type] || [];
  let allBlocks = []; 
  categories.forEach(cat => {
    if (CATEGORY_CONTENTS[cat]) {
      allBlocks = [...allBlocks, ...CATEGORY_CONTENTS[cat]];
    }
  });
  return buildToolboxXML(allBlocks, levelInputs, hiddenVars, lockedVars, true);
};

const buildToolboxXML = (allowedBlocks, levelInputs, hiddenVars, lockedVars, forceFull = false) => {
  let xmlContent = '';
  let remainingBlocks = new Set(allowedBlocks || []);
  
  // HEURISTIQUE : Si < 6 blocs, on affiche tout à plat (Flyout)
  const totalBlocksCount = (allowedBlocks || []).length;
  const useCategories = forceFull || (totalBlocksCount >= 6);

  let hasCategories = false;

  // 1. VARIABLES
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
          
          if (variableXml) {
             if (useCategories) {
                 xmlContent += `<category name="Variables" colour="330">${variableXml}</category>`;
                 hasCategories = true;
             } else {
                 xmlContent += variableXml;
             }
             variableXml = ''; 
             remainingBlocks.delete('variables_set');
             remainingBlocks.delete('variables_get');
          }
      }
  }

  // 2. CATÉGORIES
  Object.entries(CATEGORY_CONTENTS).forEach(([catName, catBlockList]) => {
    const selectedInCat = catBlockList.filter(b => remainingBlocks.has(b));
    if (selectedInCat.length === 0 && !forceFull) return;

    const blocksToAdd = forceFull ? catBlockList : selectedInCat;
    
    if (blocksToAdd.length > 0) {
        let catXml = '';
        blocksToAdd.forEach(blockType => {
            if (BLOCK_DEFINITIONS[blockType]) {
                catXml += BLOCK_DEFINITIONS[blockType];
                remainingBlocks.delete(blockType);
            }
        });

        if (useCategories) {
            let colour = '0'; 
            if (catName === 'Mouvements') colour = '120';
            if (catName === 'Tortue') colour = '160';
            if (catName === 'Logique') colour = '210';
            if (catName === 'Mathématiques') colour = '230';
            if (catName === 'Listes') colour = '260';
            if (catName === 'Interactions') colour = '160';
            if (catName === 'Algèbre') colour = '290';

            xmlContent += `<category name="${catName}" colour="${colour}">${catXml}</category>`;
            hasCategories = true;
        } else {
            xmlContent += catXml;
        }
    }
  });

  // 3. ORPHELINS
  let orphansXml = variableXml; 
  remainingBlocks.forEach(blockType => {
     if (BLOCK_DEFINITIONS[blockType]) {
        orphansXml += BLOCK_DEFINITIONS[blockType];
     }
  });

  // 4. FINALISATION
  if (hasCategories) {
      if (orphansXml) {
          xmlContent += `<category name="⭐ Divers" colour="0">${orphansXml}</category>`;
      }
  } else {
      xmlContent += orphansXml;
  }

  return { 
      xml: `<xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">${xmlContent}</xml>`, 
      hasCategories 
  };
};