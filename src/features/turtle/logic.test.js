import { describe, it, expect } from 'vitest';
import { TurtleLogic } from './logic';

const level = { startPos: { x: 0, y: 0, dir: 0 } };

describe('TurtleLogic.executeStep', () => {
  it("renvoie l'état initial intact quand action est null", () => {
    const { newState, status } = TurtleLogic.executeStep(null, null, level);
    expect(newState).toMatchObject({ x: 0, y: 0, dir: 0, penDown: true });
    expect(status).toBe('RUNNING');
  });

  it('avance et trace une ligne quand le stylo est baissé', () => {
    const start = { x: 0, y: 0, dir: 0, penDown: true, color: '#000', lines: [] };
    const { newState } = TurtleLogic.executeStep(start, { type: 'MOVE', dist: 10 }, level);
    expect(newState.lines).toHaveLength(1);
    expect(newState.lines[0]).toMatchObject({ x1: 0, y1: 0, x2: 10 });
    expect(newState.x).toBeCloseTo(10);
    expect(newState.y).toBeCloseTo(0);
  });

  it('ne trace pas de ligne quand le stylo est levé', () => {
    const start = { x: 0, y: 0, dir: 0, penDown: false, color: '#000', lines: [] };
    const { newState } = TurtleLogic.executeStep(start, { type: 'MOVE', dist: 10 }, level);
    expect(newState.lines).toHaveLength(0);
    expect(newState.x).toBeCloseTo(10);
  });

  it('TURN ajoute un angle signé à la direction', () => {
    const start = { x: 0, y: 0, dir: 0, penDown: true, color: '#000', lines: [] };
    expect(TurtleLogic.executeStep(start, { type: 'TURN', angle: 90 }, level).newState.dir).toBe(90);
    expect(TurtleLogic.executeStep(start, { type: 'TURN', angle: -45 }, level).newState.dir).toBe(-45);
  });

  it('PEN bascule l\'état du stylo, COLOR change la couleur', () => {
    const start = { x: 0, y: 0, dir: 0, penDown: true, color: '#000', lines: [] };
    expect(TurtleLogic.executeStep(start, { type: 'PEN', state: 'UP' }, level).newState.penDown).toBe(false);
    expect(TurtleLogic.executeStep(start, { type: 'COLOR', color: '#ff0000' }, level).newState.color).toBe('#ff0000');
  });

  it('avance vers le sud (dir=90°) en repère mathématique', () => {
    const start = { x: 0, y: 0, dir: 90, penDown: true, color: '#000', lines: [] };
    const { newState } = TurtleLogic.executeStep(start, { type: 'MOVE', dist: 10 }, level);
    expect(newState.x).toBeCloseTo(0);
    expect(newState.y).toBeCloseTo(10);
  });
});
