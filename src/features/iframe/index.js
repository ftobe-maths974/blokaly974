// 📄 src/features/iframe/index.js
import Runner from './Runner';
import Editor from './Editor';

export default {
    id: 'IFRAME',
    name: 'Web / Externe',
    icon: '🌐',
    
    // Pas de blocs pour ce mode
    registerBlocks: () => {},
    getToolbox: () => ({ xml: '', category: '' }),
    
    // Le runner gère sa propre victoire via le bouton
    evaluateResult: () => ({ status: 'RUNNING' }),
    
    // Configuration spéciale pour GameEngine
    isFullscreen: true, // Indique que ce n'est pas du Blockly
    
    RenderComponent: Runner, // C'est le "MainRunner" dans ce cas
    EditorComponent: Editor,
    config: {}
};