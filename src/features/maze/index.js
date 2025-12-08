import { MazePlugin } from './logic';
import Editor from './Editor';
import Runner from './Runner';
import { MAZE_CONFIG } from './config';

export default {
    id: 'MAZE',
    name: 'Labyrinthe',
    icon: '🏰',
    
    // On expose directement les méthodes du plugin logique
    registerBlocks: MazePlugin.registerBlocks,
    
    // On normalise la récupération de la toolbox
    getToolbox: () => {
        // Si logic.js renvoie du JSON ou du XML, on normalise ici
        return {
            xml: MazePlugin.getToolboxXML(), 
            category: 'Labyrinthe'
        };
    },

    executeStep: MazePlugin.executeStep,
    
    RenderComponent: Runner,
    EditorComponent: Editor,
    config: MAZE_CONFIG
};