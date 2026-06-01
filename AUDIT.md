# Audit profond & feuille de route — Blokaly 974 (branche `v2`)

Audit du 2026-06-01. Baseline : `v2` build ✅, dev ✅ (après `npm install --legacy-peer-deps`),
mais `npm run lint` rouge (50 erreurs) et la feature **équation cassée**.

Objectifs long terme guidant les priorités :
1. **Architecture plugin scalable** — ajouter un mode = ajouter un dossier, ~0 édition du core.
2. **Système de notation agnostique** — mêmes règles de score pour tous les modes, remontée LMS (SCORM/LTI).
3. **Qualité / DRY** — code sain, lint vert, build optimisé, CI.

---

## P0 — Bugs bloquants (à corriger avant tout)

| # | Fichier | Problème | Impact |
|---|---|---|---|
| 1 | `src/features/equation/logic.js:3` & `:57` | Deux déclarations (`let isRegistered`, `const state`) **avalées dans des commentaires `//`** suite à un écrasement des sauts de ligne. | Feature équation cassée, ~17 erreurs `no-undef`. |
| 2 | `src/features/equation/Editor.jsx:14` | `updateGlobal` appelé dans un `useEffect` **avant** sa déclaration `const` (TDZ). | Crash au montage d'un nouveau niveau équation. |
| 3 | `src/components/runner/Runner.jsx:11` | `if (!campaign) return` placé **avant** les hooks → violation des Rules of Hooks. | Ordre des hooks instable, crash potentiel. |
| 4 | `src/components/runner/BlocklyRunner.jsx:68-87` | `startResizing` enregistre `handleMouseMove`/`stopResizing` déclarés **après** (TDZ + closures `[]` périmées). | Le redimensionnement du splitter ne marche pas / capture périmée. |

---

## Architecture & scalabilité plugin

**État : ~70 % de l'objectif.** Un registre existe, le runtime est piloté par duck-typing,
le builder lit `plugin.catalog`/`icon` dynamiquement. Mais le contrat est implicite et 3 fuites
core empêchent le « zéro édition core ».

### Fuites de couplage core ↔ mode (à éliminer)
- `core/PluginRegistry.js:1-29` — **imports statiques** de chaque feature + un `registerPlugin` manuel par mode. Fuite #1. → remplacer par auto-découverte `import.meta.glob('../features/*/index.js')`.
- `components/runner/GameEngine.jsx:16` — `if (plugin.id === 'IFRAME' || plugin.isFullscreen)` : le littéral `'IFRAME'` est redondant avec le flag → supprimer le littéral.
- `hooks/useGameRunner.js:45` — ghost/solution model **gaté sur `plugin.id !== 'TURTLE'`** → piloter par un flag déclaratif `plugin.capabilities.hasSolutionModel`.
- `hooks/useGameRunner.js:227-240` — l'**API de simulation est maze-centrée** (grille `move/turn/isPath/isDone`) dans le moteur → déléguer au plugin via `plugin.createSimApi(level)`.
- `core/BlockDefinitions.js:29-42` — `CATEGORIES_BY_TYPE` code en dur `MAZE/TURTLE/MATH/EQUATION`.
- `components/runner/BlocklyRunner.jsx:29-39,140-149` — `safeData`/`renderProps` codent en dur les champs maze/turtle/equation/math.

### Violations DRY (~150 lignes dupliquées)
- **Toolbox XML** : même fonction copiée 3× (`maze/logic.js:74`, `turtle/logic.js:69`, `equation/logic.js:45`) → helper `buildToolboxXML(category, color, blockXmlMap)`.
- **Garde d'enregistrement** `let isRegistered…` répétée 3× → helper `registerOnce(id, defs, gens)`.
- **Bloc de scoring étoiles** copié 4× (maze/turtle/math/equation) → centraliser (cf. Notation).
- **Garde `executeStep`** (`const state = currentState || {…}; if (!action) return…`) répétée 4×.
- **Fusion de toolbox** réimplémentée 2× (`BlocklyRunner.jsx:90-109` & `LevelEditor.jsx:50-78`).

### Code mort / doublons à supprimer
- `core/BlockCatalog.js` (108 lignes) — `BLOCK_CATALOG` importé nulle part, remplacé par `plugin.catalog`.
- `core/StandardBlocks.js` — `registerStandardBlocks` **jamais appelé**, doublon divergent de `BlockRegistry.js`.
- `core/storage.js` — fichier **vide**, aucun import.
- `BlockRegistry.js` — boucle de define/delete dupliquée (lignes ~29 & ~34).
- `maze/logic.js:9` — `id`/`RenderComponent` redéclarés (ignorés, `index.js` gagne).

### Contrat plugin
Aucune interface/JSDoc/validation (le registre ne vérifie que `.id`). Les 5 features divergent :
seuls `maze`/`turtle` ont index+logic+config ; `equation` a index+logic ; `math`/`iframe` n'ont
qu'index. Vocabulaire de statut incohérent (`LOST` vs `FAIL`).
→ **Formaliser un contrat** (JSDoc `@typedef` ou migration TS partielle) + `validatePlugin()` dans `registerPlugin`.

---

## Système de notation agnostique (axe produit prioritaire)

**Constat majeur : aucun score ne sort vers un LMS.**
- **SCORM mort** : `ScormService` (`core/scorm/ScormService.js`) est fonctionnel mais importé sans jamais être appelé (`Runner.jsx:6`). Aucun `init/setScore/terminate`.
- **LTI cosmétique** : `App.jsx:87` stocke `apiUrl`/`token` mais **aucun POST de note** n'existe ; seul un badge « Noté (LTI) » est affiché (`Runner.jsx:102`).
- **Proof token cassé** : `validation.js:5` référence `scoreData.blocks` alors que `useGameRunner.js:104` ne passe que `{stars}` → `BL:undefined`. Hash non cryptographique salé à l'heure (non reproductible, non vérifiable).

**Contrat `evaluateResult` informel et incohérent** (signature 4-positionnelle, `solutionLines`
turtle-only ; chaque mode renvoie des clés/seuils différents ; iframe ne renvoie jamais de score
et court-circuite via `onWin({stars:3})`).

**Fuites de notation dans le core** : message d'échec maze en dur (`useGameRunner.js:113`),
fallback `{stars:3}` inventé par le core (`:92`), UI figée à 3 étoiles (`FeedbackModal.jsx:21`),
déverrouillage gaté sur `stars>0` (`CampaignMenu.jsx:30`).

**Métriques captées trop pauvres** : seulement `blockCount` + `steps` (`useGameRunner.js:84-87`).
Manquent : durée, nombre d'essais/erreurs, composition des blocs, **correctness partielle**
(math calcule un résultat par objectif puis le jette).

### Cible proposée
1. **Plugin = mesure, Core = note.** Le plugin renvoie un `Evaluation` brut :
   ```js
   evaluate({ state, level, metrics }) => {
     status: 'WIN'|'FAIL'|'PARTIAL',
     outcome: { passed: boolean, correctness: 0..1 },   // crédit partiel
     measures: { blocks, steps, durationMs, ... },       // chiffres bruts, PAS d'étoiles
     feedback: { title, message, hints? }
   }
   ```
2. **Rubrique sur le niveau**, interprétée par un `computeGrade(evaluation, level.rubric)` central
   (unique endroit qui produit `normalized ∈ 0..1` et le nombre d'étoiles). Remplace les 4 copies.
3. **Service de reporting unique** : `report(levelId, {normalized, passed})` qui appelle
   réellement `ScormService.setScore(normalized)` **et** un `postLtiGrade(apiUrl, token, normalized)`.

   > **Cible LMS = Moodle** (académique ou perso), via deux canaux à servir par ce même service :
   > - **SCORM** : l'app packagée en SCORM importée dans Moodle (`ScormService` → `cmi.core.score.raw`).
   > - **LTI / relais OVH** : `api_grade` pointe vers un relais hébergé sur OVH qui repousse la note
   >   vers Moodle. Le `postLtiGrade` doit donc poster `{token, normalized}` à ce relais (définir le
   >   contrat exact attendu par le relais OVH : format payload, auth, idempotence). Le `normalized`
   >   0..1 unique est la valeur pivot des deux canaux.
4. Métriques enrichies (durée, essais, erreurs) captées par le moteur.
5. `FeedbackModal` rend `rubric.maxScore` points (plus de `[0,1,2]` figé).
6. iframe passe par `evaluate` comme les autres (plus de `onWin` direct).

---

## Qualité, dépendances, build, CI

### Lint (`npm run lint` — 50 erreurs)
Les vrais bugs sont les P0 ci-dessus. Le reste = bruit : `catch(e)` non utilisés → `catch {}`,
locals morts, `react-hooks` v7 (règles React Compiler en `error` : `set-state-in-effect`,
`preserve-manual-memoization`) — à passer en `warn`. `eslint.config.js:17` fixe `ecmaVersion: 2020`
incohérent avec `parserOptions: latest`.

### Dépendances / sécurité (`npm audit` : 14 vulns, 2 critiques)
- **Dev-only** (vite, rollup, picomatch, minimatch, postcss) : réglé par `npm audit fix` → bumps mineurs, **pas dans le bundle prod**.
- **Runtime critique** : chaîne `function-plot` → `built-in-math-eval` → `math-codegen` (RCE par injection d'expression). Contenu auteuré par le prof = risque faible mais réel si des URL acceptent des expressions arbitraires. `uuid@13.0.0→13.0.2` (patch).
- **react-blockly@9 / React 19** : pas de release react-blockly supportant React 19. Recommandé : **supprimer `react-blockly`** et utiliser `blockly` directement (un seul `<BlocklyWorkspace>` à remplacer par `Blockly.inject` dans `BlocklyRunner.jsx`) → supprime le besoin de `--legacy-peer-deps`.

### Build
- **Un seul chunk de 2,86 Mo** (blockly + katex + nerdamer + function-plot, tout en eager).
  → `build.rollupOptions.manualChunks` (séparer blockly / katex / nerdamer+function-plot) + `React.lazy` par feature (la plupart des sessions n'utilisent qu'un mode).
- `vite.config.js` `base: './'` correct pour GitHub Pages. **Mais** `index.html:5` référence `/vite.svg` en absolu → 404 sur Pages, mettre `./vite.svg`.
- ~30 `console.log` shippés en prod → `esbuild: { drop: ['console'] }`.

### Tests & CI — totalement absents
Pas de tests, pas de `.github/`, pas de `tsconfig`. Le déploiement gh-pages est manuel.
→ Ajouter un workflow CI (`lint` + `build`), introduire Vitest sur le cœur (executeStep, computeGrade).

---

## Feuille de route proposée (par lots)

- **Lot 0 — Stabiliser** : corriger les 4 bugs P0, `npm audit fix`, supprimer code mort
  (`BlockCatalog`, `StandardBlocks`, `storage.js`), favicon, `drop:['console']`. Lint au vert.
- **Lot 1 — Durcir le socle** : remplacer `react-blockly` par `blockly` direct (supprime `--legacy-peer-deps`),
  `manualChunks` + `React.lazy`, ajouter CI (lint+build) + premiers tests Vitest sur `executeStep`.
- **Lot 2 — Notation agnostique** : `Evaluation` + `computeGrade(rubric)` central, métriques enrichies,
  brancher réellement SCORM + implémenter le POST LTI, `FeedbackModal` piloté par `maxScore`,
  réparer/refondre le proof token.
- **Lot 3 — Scalabilité plugin** : auto-découverte registre (`import.meta.glob`), contrat formalisé
  + `validatePlugin`, extraire les helpers DRY (toolbox, registerOnce, simApi), sortir l'API de
  simulation et le ghost-model du core vers les plugins. Objectif : ajouter un mode = un dossier, 0 édition core.
