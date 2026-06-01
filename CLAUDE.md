# CLAUDE.md — Blokaly 974

Plateforme React/Vite d'apprentissage de l'algorithmique via Google Blockly (blocs visuels).
Deux faces : **Builder** (le prof crée des niveaux/campagnes) et **Runner** (l'élève joue).
Chaque mode de jeu est un **plugin auto-contenu**. Le cap produit : tout nouveau mode doit
s'ajouter comme plugin, et **toute notation doit passer par un système agnostique** (mêmes
règles d'étoiles/score pour tous les modes, remontée LMS via SCORM/LTI).

> ⚠️ La branche de référence est **`v2`** (et non `main`). `v2` = `main` + refonte en
> modules `features/` + registre de plugins + mode `iframe`. C'est elle qu'on fait évoluer.

## Démarrer

```bash
npm install                      # plus de --legacy-peer-deps depuis le retrait de react-blockly
npm run dev                      # http://localhost:5173
npm run build                    # build prod (sortie dans dist/)
npm test                         # vitest run (tests unitaires des plugins)
npm run lint                     # eslint (vert : 0 erreur ; warnings React Compiler/deps volontaires)
npm run deploy                   # gh-pages -d dist  →  https://ftobe-maths974.github.io/blokaly974/
```

> Blockly est injecté via un wrapper maison `src/components/BlocklyWorkspace.jsx`
> (remplace `react-blockly`, qui bloquait l'install en React 19).

## Architecture

```
src/
├── core/
│   ├── PluginRegistry.js     # registre central : registerPlugin(feature) / getPlugin(id) / getAllPlugins()
│   ├── BlockRegistry.js      # registerAllBlocks() : blocs "système" partagés (variables, listes, print)
│   ├── BlockDefinitions.js   # generateToolbox() + CATEGORIES_BY_TYPE (toolbox standard du builder)
│   ├── validation.js         # generateProofToken() (jeton de preuve — non cryptographique)
│   └── scorm/ScormService.js # wrapper SCORM 1.2 (⚠️ actuellement jamais appelé)
├── features/<mode>/          # UN dossier = UN plugin
│   ├── index.js              # MANIFESTE du plugin (le contrat, voir ci-dessous)
│   ├── logic.js              # registerBlocks + executeStep + getToolboxXML (maze, turtle, equation)
│   ├── config.js             # constantes/géométrie (maze, turtle)
│   ├── Runner.jsx            # rendu côté élève
│   └── Editor.jsx            # rendu côté prof (config du niveau)
├── hooks/useGameRunner.js    # MOTEUR : génère le code Blockly → liste d'actions → rejoue via plugin.executeStep
├── components/
│   ├── runner/  (GameEngine, BlocklyRunner, Runner, FeedbackModal, CampaignMenu, CampaignNavBar)
│   └── builder/ (Builder, LevelEditor, ToolboxConfigurator)
└── App.jsx                   # routage par query params (?mode=editor, ?url=, ?data=, lti_token)
```

Modes existants : `maze` 🏰, `turtle` 🐢, `math` 🧪, `equation` ➗, `iframe` 🖼️.

### Le flux d'exécution (clé pour comprendre le moteur)

Les générateurs Blockly **n'exécutent rien** : ils poussent des actions dans un tableau
(`actions.push({type:'MOVE', id, ...})`). Puis `useGameRunner` :
1. `workspaceToCode()` → code JS, exécuté dans `new Function('actions','api', code)` pour produire `actions[]`.
2. Rejoue les actions une par une via `plugin.executeStep(state, action, levelData)` → permet pas-à-pas, time-travel (`goToStep`), contrôle de vitesse.
3. À la fin, `plugin.evaluateResult(...)` rend le verdict (étoiles/feedback).

## Le contrat plugin (`features/<mode>/index.js`)

Aujourd'hui **implicite** (aucune interface/JSDoc) et **inconsistant** entre modes — à
formaliser (cf. AUDIT.md). Champs attendus, reconstitués depuis l'usage :

| Champ | Signature | Requis |
|---|---|---|
| `id` | string MAJUSCULE (seul champ vérifié par le registre) | ✅ |
| `name`, `icon` | string / emoji (onglets builder) | implicite |
| `registerBlocks` | `(Blockly, javascriptGenerator) => void` | optionnel |
| `getToolbox` | `(allowedBlocks) => { xml, category }` | optionnel |
| `executeStep` | `(state, action, levelData) => { newState, status }` — `status ∈ RUNNING\|WIN\|LOST` | de-facto requis |
| `evaluateResult` | `(state, levelData, metrics, solutionLines) => { status, score?, feedback? }` — `status ∈ WIN\|FAIL\|RUNNING` | optionnel |
| `catalog` | `[{ category, color, blocks:[{type,label,icon}] }]` (palette builder) | optionnel |
| `RenderComponent` | composant React (rendu élève) | ✅ rendu |
| `EditorComponent` | composant React (rendu prof) | optionnel |
| `config` | objet mode-spécifique (`defaultGrid`, `checkMove`, `look`, `victoryDelay`…) | optionnel |
| `isFullscreen` | bool (mode plein écran, ex. iframe) | optionnel |

⚠️ Incohérence connue : `executeStep` renvoie `LOST`, `evaluateResult` renvoie `FAIL`.
Le vocabulaire de statut n'est pas figé.

### Ajouter un plugin aujourd'hui

1. Créer `src/features/<mode>/` avec au minimum `index.js` + `Runner.jsx`.
2. **Éditer `core/PluginRegistry.js`** (import + `registerPlugin`) — seule édition core obligatoire.
3. Selon le mode : éventuellement `BlockDefinitions.js` (blocs standard), `useGameRunner.js`
   (API de simulation maze-centrée, ghost TURTLE-only), `BlocklyRunner.jsx` (render props).

> L'objectif "zéro édition core" **n'est pas encore atteint**. Voir AUDIT.md §Architecture.

## Système de notation (état actuel ≠ cible)

- Chaque plugin calcule ses étoiles dans `evaluateResult` — mais la logique d'étoiles est
  **copiée-collée à l'identique dans 4 plugins** (à centraliser).
- **Aucun score ne sort vers un LMS** : `ScormService` est importé mais jamais appelé ;
  l'`apiUrl` LTI est stocké mais aucune note n'est postée. À implémenter (cf. AUDIT.md §Notation).
- Cible : un `Evaluation` brut renvoyé par le plugin (mesures + correctness) + un
  `computeGrade(evaluation, level.rubric)` central qui produit l'unique valeur normalisée 0..1,
  rejouée vers SCORM **et** LTI par un service de reporting unique.
- **Cible LMS = Moodle** (académique ou perso), par deux canaux : package **SCORM** importé dans
  Moodle, et **LTI** où `api_grade` pointe vers un **relais hébergé sur OVH** qui repousse la note
  vers Moodle.

## Conventions

- JS/JSX pur (pas de TypeScript), modules ES. React 19, Vite 7, Tailwind 3.
- Tests : Vitest (`*.test.js` co-localisés ; pour l'instant sur `executeStep`). CI : `.github/workflows/ci.yml` (lint + test + build).
- Format des campagnes : voir `public/examples/campagne_de_tests.blokaly.json`.
- Détail complet des dettes et de la feuille de route : **`AUDIT.md`**.
