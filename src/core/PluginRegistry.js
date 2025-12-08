// On importe uniquement les plugins qui sont prêts (Features)
import MazeFeature from '../features/maze';

// Plus tard, on décommentera ceux-là quand ils seront migrés
// import TurtleFeature from '../features/turtle';
// import MathFeature from '../features/math';

const REGISTRY = {};

export const registerPlugin = (plugin) => {
  if (!plugin || !plugin.id) {
      console.error("❌ Tentative d'enregistrement d'un plugin invalide", plugin);
      return;
  }
  console.log(`🔌 Plugin enregistré : ${plugin.name} (${plugin.id})`);
  REGISTRY[plugin.id] = plugin;
};

// --- ENREGISTREMENT INITIAL ---
registerPlugin(MazeFeature);
// registerPlugin(TurtleFeature); 
// registerPlugin(MathFeature);

// --- API ---
export const getPlugin = (id) => {
    return REGISTRY[id] || null; // Renvoie null si le plugin n'existe pas (ex: TURTLE désactivé)
};

export const getAllPlugins = () => Object.values(REGISTRY);