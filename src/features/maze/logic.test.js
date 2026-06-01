import { describe, it, expect } from 'vitest';
import { MazePlugin } from './logic';
import { MAZE_CONFIG } from './config';

// Grille par défaut : départ (1,1)=2, chemin 1..5, arrivée (6,1)=3, murs=4
const grid = MAZE_CONFIG.defaultGrid;
const at = (x, y, dir = 0) => ({ grid, startPos: { x, y, dir } });

describe('MazePlugin.executeStep', () => {
  it("renvoie l'état initial intact quand action est null (pas de crash)", () => {
    const { newState, status } = MazePlugin.executeStep(null, null, at(1, 1, 0));
    expect(newState).toEqual({ x: 1, y: 1, dir: 0 });
    expect(status).toBe('RUNNING');
  });

  it('avance d\'une case vers l\'est sur un chemin libre', () => {
    const { newState, status } = MazePlugin.executeStep({ x: 1, y: 1, dir: 0 }, { type: 'MOVE' }, { grid });
    expect(newState).toMatchObject({ x: 2, y: 1 });
    expect(status).toBe('RUNNING');
  });

  it('atteint l\'arrivée -> statut WIN', () => {
    const { newState, status } = MazePlugin.executeStep({ x: 5, y: 1, dir: 0 }, { type: 'MOVE' }, { grid });
    expect(newState).toMatchObject({ x: 6, y: 1 });
    expect(status).toBe('WIN');
  });

  it('contre un mur -> statut LOST et position inchangée', () => {
    const { newState, status } = MazePlugin.executeStep({ x: 1, y: 1, dir: 3 }, { type: 'MOVE' }, { grid });
    expect(newState).toMatchObject({ x: 1, y: 1 });
    expect(status).toBe('LOST');
  });

  it('TURN_RIGHT incrémente la direction, TURN_LEFT la décrémente', () => {
    expect(MazePlugin.executeStep({ x: 1, y: 1, dir: 0 }, { type: 'TURN_RIGHT' }, { grid }).newState.dir).toBe(1);
    expect(MazePlugin.executeStep({ x: 1, y: 1, dir: 0 }, { type: 'TURN_LEFT' }, { grid }).newState.dir).toBe(-1);
  });

  it('normalise les directions négatives lors du déplacement', () => {
    // dir = -1 équivaut à 3 (Nord) -> mur au-dessus du départ -> LOST
    const { status } = MazePlugin.executeStep({ x: 1, y: 1, dir: -1 }, { type: 'MOVE' }, { grid });
    expect(status).toBe('LOST');
  });
});
