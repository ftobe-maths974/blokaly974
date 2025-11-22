# 🧩 Blokaly 974

> Une plateforme interactive pour l'apprentissage de l'algorithmique, basée sur Google Blockly.
> Créée pour les élèves et les enseignants, avec un éditeur de niveaux intégré.

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-Bundler-purple?logo=vite)](https://vitejs.dev/)
[![Blockly](https://img.shields.io/badge/Blockly-Google-orange)](https://developers.google.com/blockly)

---

## 🚀 Démo en ligne

Accédez directement à l'application déployée :

👉 **[Lancer Blokaly 974](https://ftobe-maths974.github.io/blokaly974/)**

---

## 🌟 Fonctionnalités

Blokaly propose trois modes de jeu distincts pour couvrir différents concepts de programmation :

| Mode | Description | Concepts Clés |
| :--- | :--- | :--- |
| 🏰 **Labyrinthe** | Guider un robot vers la sortie. | Séquences, Boucles, Conditions simples. |
| 🐢 **Tortue** | Dessiner des formes géométriques. | Repérage spatial (Angles, Distance), Boucles imbriquées. |
| 🧪 **Labo Algo** | Manipuler des variables et des listes. | Variables, Affectation, Tableaux, Opérations mathématiques. |

---

## 🛠️ Guide de l'Interface

L'application se divise en deux parties principales : l'**Atelier** (pour créer) et le **Runner** (pour jouer).

### 1. L'Atelier (Builder)

C'est ici que le professeur crée ses exercices.

* **Zone Gauche (Prévisualisation) :**
    * Configurez le terrain (murs du labyrinthe, position de la tortue).
    * Testez les interactions en temps réel.
* **Zone Droite (Propriétés) :**
    * **Consigne :** Rédigez l'énoncé (supporte le Markdown et MathJax pour les formules $LaTeX$).
    * **Objectif (Par) :** Définissez le nombre idéal de blocs pour obtenir 3 étoiles ⭐.
    * **Toolbox Élève :** Cochez les blocs que l'élève aura le droit d'utiliser.
* **Zone Basse (Code) :**
    * 🧩 **Code Élève :** Préparez le code de départ (trous à remplir).
    * ✅ **Solution / Calque :** Construisez la solution idéale. En mode Tortue, cela génère un "calque gris" pour guider l'élève.
* **Barre d'outils :**
    * 📥 **Import / Export :** Sauvegardez vos campagnes en `.json` pour les partager.
    * 🚀 **Générer & Tester :** Lance le niveau en mode "Élève".

### 2. Le Runner (Jeu)

L'interface visible par l'élève pour résoudre les défis.

* **Barre de contrôle :**
    * ▶️ **Exécuter :** Lance le code.
    * 👣 **Pas à pas :** Exécute le code bloc par bloc (idéal pour le débogage).
    * 🐢—🐇 **Vitesse :** Curseur pour accélérer ou ralentir l'exécution.
* **Validation :**
    * Analyse automatique de la réussite (position atteinte, dessin correct, valeur de variable).
    * Feedback visuel (Blocs illuminés en cours d'exécution).

---

## 📂 Exemple de Campagne

Pour tester les capacités de l'outil, nous fournissons une campagne de démonstration complète.

1.  Téléchargez le fichier suivant : [📥 campagne_de_tests.blokaly.json](./examples/campagne_de_tests.blokaly.json)
2.  Dans l'application, cliquez sur le bouton **📥 Import** dans la colonne de gauche.
3.  Sélectionnez le fichier téléchargé.

---

## 💻 Installation (Développement)

Si vous souhaitez installer le projet localement pour le modifier :

1.  Cloner le dépôt :
    ```bash
    git clone [https://github.com/ftobe-maths974/blokaly974.git](https://github.com/ftobe-maths974/blokaly974.git)
    cd blokaly974
    ```

2.  Installer les dépendances :
    ```bash
    npm install
    ```

3.  Lancer le serveur de développement :
    ```bash
    npm run dev
    ```

---

## 🤝 Contribution

Projet développé avec ❤️ pour l'enseignement des mathématiques et de l'informatique.
Les contributions et suggestions sont les bienvenues via les "Issues".

License MIT.