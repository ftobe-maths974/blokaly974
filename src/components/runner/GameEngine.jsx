import MazeFeature from '../features/maze';
import TurtleFeature from '../features/turtle';
import MathFeature from '../features/math';
import EquationFeature from '../features/equation';
// 👇 AJOUT DE L'IMPORT OBLIGATOIRE
import IframeFeature from '../features/iframe'; 

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
registerPlugin(MathFeature);
registerPlugin(EquationFeature);
// 👇 ENREGISTREMENT
registerPlugin(IframeFeature); 

export const getPlugin = (id) => REGISTRY[id];
export const getAllPlugins = () => Object.values(REGISTRY);