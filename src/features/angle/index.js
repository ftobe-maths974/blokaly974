import Runner from './Runner';
import Editor from './Editor';

// Mode « leçon interactive » sur les angles (plein écran, pas de Blockly).
export default {
  id: 'ANGLE',
  name: 'Atelier des angles',
  icon: '📐',

  registerBlocks: () => {},
  getToolbox: () => ({ xml: '', category: '' }),
  evaluateResult: () => ({ status: 'RUNNING' }), // la victoire est gérée par le Runner

  isFullscreen: true,
  RenderComponent: Runner,
  EditorComponent: Editor,
  config: {},
};
