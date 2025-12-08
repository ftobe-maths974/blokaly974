import MazeFeature from '../features/maze';
import TurtleFeature from '../features/turtle'; // <--- Vérifiez que c'est bien décommenté

console.log("🕵️‍♂️ DEBUG - MazeFeature:", MazeFeature);     // Doit afficher un Objet {id: "MAZE", ...}
console.log("🕵️‍♂️ DEBUG - TurtleFeature:", TurtleFeature); // Si c'est "undefined", le problème est l'import !

const REGISTRY = {};

export const registerPlugin = (plugin) => {
  if (!plugin) {
      console.error("❌ Erreur : Tentative d'enregistrer un plugin vide/indéfini.");
      return;
  }
  if (!plugin.id) {
      console.error("❌ Erreur : Le plugin n'a pas d'ID.", plugin);
      return;
  }
  
  console.log(`✅ Succès : Plugin "${plugin.id}" ajouté au registre.`);
  REGISTRY[plugin.id] = plugin;
};

registerPlugin(MazeFeature);
registerPlugin(TurtleFeature); 

export const getPlugin = (id) => REGISTRY[id];
export const getAllPlugins = () => Object.values(REGISTRY);