// 📄 src/core/BlockCatalog.js

export const BLOCK_CATALOG = {
  'MAZE': [
    {
      category: 'Mouvements',
      color: 'blue-500',
      blocks: [
        { type: 'maze_move_forward', label: 'Avancer', icon: '⬆️' },
        { type: 'maze_turn', label: 'Pivoter', icon: 'Ql' } // Ql = Quick Look icon (flèche)
      ]
    },
    {
      category: 'Capteurs',
      color: 'emerald-500',
      blocks: [
        { type: 'maze_if', label: 'Si Chemin...', icon: 'qa' },
        { type: 'maze_if_else', label: 'Si... Sinon...', icon: 'qt' },
        { type: 'maze_forever', label: 'Répéter jusqu\'à Arrivée', icon: 'jq' }
      ]
    }
  ],
  'TURTLE': [
    {
      category: 'Tortue',
      color: 'green-500',
      blocks: [
        { type: 'turtle_move', label: 'Avancer', icon: '🐢' },
        { type: 'turtle_turn', label: 'Pivoter', icon: 'hz' },
        { type: 'turtle_pen', label: 'Stylo', icon: '✏️' },
        { type: 'turtle_color', label: 'Couleur', icon: '🎨' }
      ]
    },
    {
      category: 'Boucles',
      color: 'yellow-500',
      blocks: [
        { type: 'controls_repeat_ext', label: 'Répéter N fois', icon: 'jq' }
      ]
    }
  ],
  'EQUATION': [
    {
      category: 'Résolution',
      color: 'indigo-500',
      blocks: [
        { type: 'equation_op_both', label: 'Opération (2 côtés)', icon: '⚖️' },
        { type: 'equation_term_x', label: 'Terme X', icon: 'x' },
        { type: 'equation_verify', label: 'Vérifier la réponse', icon: '✅' }
      ]
    },
    {
      category: 'Analyse',
      color: 'purple-500',
      blocks: [
        { type: 'equation_solution_state', label: 'Conclusion (Pas de sol...)', icon: '∅' },
        { type: 'equation_solution_s', label: 'Écrire S = ...', icon: 'S' },
        { type: 'equation_interval', label: 'Intervalle [ ; ]', icon: 'Pw' },
        { type: 'math_infinity', label: 'Infini', icon: '∞' }
      ]
    },
    {
      category: 'Maths',
      color: 'slate-500',
      blocks: [
        { type: 'math_number', label: 'Nombre', icon: '123' }
      ]
    }
  ],
  'MATH': [
    {
      category: 'Logique',
      color: 'yellow-500',
      blocks: [
        { type: 'controls_if', label: 'Si... Alors', icon: 'qt' },
        { type: 'logic_compare', label: 'Comparaison', icon: '=' },
        { type: 'logic_operation', label: 'Et / Ou', icon: '&' }
      ]
    },
    {
      category: 'Maths',
      color: 'blue-500',
      blocks: [
        { type: 'math_number', label: 'Nombre', icon: '123' },
        { type: 'math_arithmetic', label: 'Calcul (+ - * /)', icon: '+-' },
        { type: 'math_random_int', label: 'Aléatoire', icon: '🎲' },
        { type: 'math_modulo', label: 'Reste (Modulo)', icon: '%' }
      ]
    },
    {
      category: 'Variables',
      color: 'pink-500',
      blocks: [
        { type: 'variables_set', label: 'Définir', icon: 'Df' },
        { type: 'variables_get', label: 'Lire', icon: 'Lr' },
        { type: 'math_change', label: 'Incrémenter', icon: '+1' }
      ]
    },
    {
      category: 'Affichage',
      color: 'slate-500',
      blocks: [
        { type: 'text_print', label: 'Afficher', icon: '🖨️' },
        { type: 'text_prompt_ext', label: 'Demander', icon: 'jq' }
      ]
    }
  ]
};