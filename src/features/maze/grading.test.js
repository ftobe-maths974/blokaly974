import { describe, it, expect, beforeAll } from 'vitest';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import maze from './index';
import { MazePlugin } from './logic';
import { registerAllBlocks } from '../../core/BlockRegistry';

// État final SUR l'arrivée (checkMove(grid,x,y)==='WIN') pour passer la garde de victoire.
const WIN_LEVEL = (extra) => ({ grid: [[3]], ...extra });
const STATE = { x: 0, y: 0 };

describe('notation maze (étoiles)', () => {
  it("n1 découverte (3 blocs, sans boucle) → 4★ et N'AVISE PAS « Répéter »", () => {
    const r = maze.evaluateResult(STATE, WIN_LEVEL({
      validation: { stars: { blocks: 3, blocksFlat: 3 } },
      allowedBlocks: ['maze_move_forward'],
    }), { blockCount: 3 });
    expect(r.score.stars).toBe(4);
    expect(r.feedback.message).not.toMatch(/Répéter/);
  });

  it('figure (optimal 6, boucle dispo) : solution optimale 6 → 4★', () => {
    const r = maze.evaluateResult(STATE, WIN_LEVEL({
      validation: { stars: { blocks: 6, blocksFlat: 16 } },
      allowedBlocks: ['maze_move_forward', 'maze_turn', 'controls_repeat_ext'],
    }), { blockCount: 6 });
    expect(r.score.stars).toBe(4);
  });

  it('figure : 1 bloc au-dessus de l\'optimal → 3★ et avise « Répéter »', () => {
    const r = maze.evaluateResult(STATE, WIN_LEVEL({
      validation: { stars: { blocks: 6, blocksFlat: 16 } },
      allowedBlocks: ['maze_move_forward', 'maze_turn', 'controls_repeat_ext'],
    }), { blockCount: 7 });
    expect(r.score.stars).toBe(3);
    expect(r.feedback.message).toMatch(/Répéter/);
  });
});

describe('compte de blocs : chapeau exclu, ombres gardées', () => {
  beforeAll(() => {
    registerAllBlocks();
    MazePlugin.registerBlocks(Blockly, javascriptGenerator);
  });

  it('exclut program_start mais garde les blocs-ombres', () => {
    const ws = new Blockly.Workspace();
    const dom = Blockly.utils.xml.textToDom(
      '<xml><block type="program_start"><next><block type="maze_move_forward"><next>' +
      '<block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">3</field></shadow></value>' +
      '<statement name="DO"><block type="maze_move_forward"></block></statement></block></next></block></next></block></xml>',
    );
    Blockly.Xml.domToWorkspace(dom, ws);
    const counted = ws.getAllBlocks(false).filter((b) => b.type !== 'program_start').length;
    // avancer + répéter + nombre(ombre) + avancer = 4 (le chapeau program_start exclu)
    expect(counted).toBe(4);
  });
});
