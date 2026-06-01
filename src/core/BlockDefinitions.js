export const BLOCK_DEFINITIONS = {
  // ... (Garde toutes tes définitions inchangées : controls_repeat_ext, etc.)
  'controls_repeat_ext': `<block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">5</field></shadow></value></block>`,
  'controls_whileUntil': '<block type="controls_whileUntil"></block>',
  'controls_if': '<block type="controls_if"></block>',
  'logic_compare': '<block type="logic_compare"></block>',
  'logic_operation': '<block type="logic_operation"></block>',
  'math_number': '<block type="math_number"></block>',
  'math_arithmetic': `<block type="math_arithmetic"><value name="A"><shadow type="math_number"><field name="NUM">1</field></shadow></value><value name="B"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block>`,
  'math_modulo': `<block type="math_modulo"><value name="DIVIDEND"><shadow type="math_number"><field name="NUM">10</field></shadow></value><value name="DIVISOR"><shadow type="math_number"><field name="NUM">2</field></shadow></value></block>`,
  'math_random_int': `<block type="math_random_int"><value name="FROM"><shadow type="math_number"><field name="NUM">1</field></shadow></value><value name="TO"><shadow type="math_number"><field name="NUM">100</field></shadow></value></block>`,
  'lists_create_with': '<block type="lists_create_with"><mutation items="3"></mutation></block>',
  'lists_getIndex': '<block type="lists_getIndex"></block>',
  'lists_setIndex': '<block type="lists_setIndex"></block>',
  'lists_length': '<block type="lists_length"></block>',
  'text_print': '<block type="text_print"></block>',
  'text_prompt_ext': '<block type="text_prompt_ext"><value name="TEXT"><shadow type="text"><field name="TEXT">?</field></shadow></value></block>',
  'variables_get': '<block type="variables_get"></block>',
  'variables_set': '<block type="variables_set"></block>',
};

export const BLOCK_LABELS = {
  'controls_repeat_ext': 'Répéter N fois', 'controls_whileUntil': 'Répéter tant que', 'controls_if': 'Si... Alors',
  'logic_compare': 'Comparaison', 'logic_operation': 'Opérateur',
  'math_number': 'Nombre', 'math_arithmetic': 'Calcul', 'math_modulo': 'Reste', 'math_random_int': 'Aléatoire',
  'text_print': 'Afficher', 'text_prompt_ext': 'Demander', 'lists_create_with': 'Créer liste', 'lists_getIndex': 'Lire élément', 'lists_setIndex': 'Modifier élément', 'lists_length': 'Longueur liste', 'variables_set': 'Définir variable', 'variables_get': 'Lire variable'
};

export const CATEGORIES_BY_TYPE = {
  'MAZE': ['Logique'], 
  'TURTLE': ['Logique', 'Mathématiques', 'Variables'],
  'MATH': ['Mathématiques', 'Listes', 'Variables', 'Interactions', 'Logique'],
  'EQUATION': [] 
};

export const CATEGORY_CONTENTS = {
  'Logique': ['controls_repeat_ext', 'controls_whileUntil', 'controls_if', 'logic_compare', 'logic_operation'],
  'Mathématiques': ['math_number', 'math_arithmetic', 'math_modulo', 'math_random_int'],
  'Listes': ['lists_create_with', 'lists_getIndex', 'lists_setIndex', 'lists_length'],
  'Variables': ['variables_set', 'variables_get'],
  'Interactions': ['text_print', 'text_prompt_ext']
};

export const generateToolbox = (allowedBlocks, levelInputs, hiddenVars = [], lockedVars = []) => buildToolboxXML(allowedBlocks, levelInputs, hiddenVars, lockedVars);
export const generateMasterToolbox = (type, levelInputs, hiddenVars = [], lockedVars = []) => {
  const categories = CATEGORIES_BY_TYPE[type] || [];
  let allBlocks = []; categories.forEach(cat => { if (CATEGORY_CONTENTS[cat]) allBlocks = [...allBlocks, ...CATEGORY_CONTENTS[cat]]; });
  return buildToolboxXML(allBlocks, levelInputs, hiddenVars, lockedVars, true);
};

const buildToolboxXML = (allowedBlocks, levelInputs, hiddenVars, lockedVars, forceFull = false) => {
  let xmlContent = ''; 
  let remainingBlocks = new Set(allowedBlocks || []);

  // 1. Gestion des Variables
  let variableXml = '';
  if (levelInputs && Object.keys(levelInputs).length > 0) {
      const visibleKeys = Object.keys(levelInputs).filter(k => !hiddenVars.includes(k));
      if (visibleKeys.length > 0) {
          visibleKeys.forEach(key => {
              if (lockedVars.includes(key)) variableXml += `<block type="system_var_get"><field name="VAR_NAME">${key}</field></block>`;
              else { 
                  variableXml += `<block type="variables_get"><field name="VAR">${key}</field></block>`; 
                  if (remainingBlocks.has('variables_set') || forceFull) {
                      variableXml += `<block type="variables_set"><field name="VAR">${key}</field></block>`; 
                  }
              }
          });
          
          if (variableXml) { 
              xmlContent += `<category name="Variables" colour="330">${variableXml}</category>`; 
              remainingBlocks.delete('variables_set'); 
              remainingBlocks.delete('variables_get'); 
          }
      }
  }

  // 2. Boucle sur les Catégories Standards
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
        
        let colour = '0'; 
        if (catName === 'Logique') colour = '210'; 
        if (catName === 'Mathématiques') colour = '230'; 
        if (catName === 'Listes') colour = '260'; 
        if (catName === 'Interactions') colour = '160'; 
        if (catName === 'Variables') colour = '330';
        
        xmlContent += `<category name="${catName}" colour="${colour}">${catXml}</category>`;
    }
  });

  // 3. Gestion des Orphelins (Correction Duplication + Crash)
  let orphansXml = ''; // On repart de zéro pour éviter de dupliquer variableXml
  
  remainingBlocks.forEach(blockType => { 
      if (BLOCK_DEFINITIONS[blockType]) orphansXml += BLOCK_DEFINITIONS[blockType]; 
  });

  if (orphansXml) { 
      xmlContent += `<category name="Divers" colour="0">${orphansXml}</category>`; 
  } 

  // 👇 FIX ANTI-CRASH : Si la toolbox est totalement vide, on ajoute une catégorie placeholder
  // Cela permet à Blockly de maintenir la structure "Catégories" et d'éviter l'erreur fatale.
  if (xmlContent === '') {
      xmlContent = '<category name="..." colour="#ffffff"></category>';
  }

  return { 
      xml: `<xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">${xmlContent}</xml>`, 
      hasCategories: true 
  };
};