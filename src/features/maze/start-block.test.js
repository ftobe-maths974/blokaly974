import { describe, it, expect, beforeAll } from 'vitest';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { MazePlugin } from './logic';
import { registerAllBlocks, ensureStartBlock } from '../../core/BlockRegistry';

// program_start vient désormais du core (registerAllBlocks) ; blocs maze du plugin.
beforeAll(() => {
  registerAllBlocks();
  MazePlugin.registerBlocks(Blockly, javascriptGenerator);
});

describe('bloc « Exécuter » (program_start)', () => {
  it('migre les blocs libres existants SOUS le chapeau et le rend non supprimable', () => {
    const ws = new Blockly.Workspace();
    ws.newBlock('maze_move_forward'); // pile libre (niveau d'avant le chapeau)
    const hat = ensureStartBlock(ws);

    expect(hat.type).toBe('program_start');
    expect(hat.isDeletable()).toBe(false);
    expect(hat.getNextBlock()?.type).toBe('maze_move_forward'); // accroché dessous
    expect(ws.getBlocksByType('program_start', false).length).toBe(1); // un seul chapeau
  });

  it('crée un chapeau seul quand le workspace est vide', () => {
    const ws = new Blockly.Workspace();
    const hat = ensureStartBlock(ws);
    expect(hat.type).toBe('program_start');
    expect(hat.getNextBlock()).toBeNull();
  });

  it('ne crée pas de second chapeau si un existe déjà', () => {
    const ws = new Blockly.Workspace();
    ensureStartBlock(ws);
    ensureStartBlock(ws); // 2e appel (re-chargement)
    expect(ws.getBlocksByType('program_start', false).length).toBe(1);
  });

  it('ne génère QUE la pile sous le chapeau (les blocs à côté sont ignorés)', () => {
    const ws = new Blockly.Workspace();
    ws.newBlock('maze_move_forward'); // sera migré sous le chapeau
    const hat = ensureStartBlock(ws);
    ws.newBlock('maze_turn'); // pile DÉTACHÉE, posée à côté du chapeau

    javascriptGenerator.init(ws);
    const raw = javascriptGenerator.blockToCode(hat);
    const code = Array.isArray(raw) ? raw[0] : raw;
    expect(code).toContain('api.move()');   // le bloc sous le chapeau est exécuté
    expect(code).not.toContain('api.turn'); // le bloc détaché est ignoré
  });
});
