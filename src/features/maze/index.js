import { MazePlugin } from './logic';
import Editor from './Editor';
import Runner from './Runner';
import { MAZE_CONFIG } from './config';

export default {
    id: 'MAZE',
    name: 'Labyrinthe',
    icon: '🏰',
    ...MazePlugin, // <--- C'est ici que getToolboxXML est transmis
    RenderComponent: Runner,
    EditorComponent: Editor,
    config: MAZE_CONFIG
};