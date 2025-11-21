import EnvironmentPlugin from '../core/EnvironmentPlugin';

const GRID_SIZE = 5;
const DEFAULT_ROBOT = { x: 0, y: 0, dir: 'N' };
const JS_TO_ACTION = {
  grid_move_forward: 'move_forward',
  grid_turn_left: 'turn_left',
  grid_turn_right: 'turn_right'
};

function createDefaultGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

function rotateLeft(direction) {
  if (direction === 'N') return 'W';
  if (direction === 'W') return 'S';
  if (direction === 'S') return 'E';
  return 'N';
}

function rotateRight(direction) {
  if (direction === 'N') return 'E';
  if (direction === 'E') return 'S';
  if (direction === 'S') return 'W';
  return 'N';
}

function ensureState(stateManager) {
  const state = stateManager.getState();
  const patch = {};

  if (!state.grid || state.grid.length !== GRID_SIZE) {
    patch.grid = createDefaultGrid();
  }

  if (!state.robot) {
    patch.robot = { ...DEFAULT_ROBOT };
  }

  if (Object.keys(patch).length > 0) {
    stateManager.updateState(patch);
  }

  return { ...state, ...patch };
}

function moveForward(robot) {
  const deltas = {
    N: { x: 0, y: -1 },
    E: { x: 1, y: 0 },
    S: { x: 0, y: 1 },
    W: { x: -1, y: 0 }
  };

  const delta = deltas[robot.dir] || { x: 0, y: 0 };
  const nextX = Math.min(Math.max(robot.x + delta.x, 0), GRID_SIZE - 1);
  const nextY = Math.min(Math.max(robot.y + delta.y, 0), GRID_SIZE - 1);

  return { ...robot, x: nextX, y: nextY };
}

export default class GridPlugin extends EnvironmentPlugin {
  async parseActions(rawCode) {
    const matches = typeof rawCode === 'string'
      ? rawCode.matchAll(/(grid_[a-zA-Z0-9_]+)\s*\(/g)
      : [];

    const actions = [];

    for (const match of matches) {
      const funcName = match[1];
      const action = JS_TO_ACTION[funcName];
      if (action) {
        actions.push(action);
      }
    }

    return actions;
  }

  async applyAction(action, stateManager) {
    const state = ensureState(stateManager);
    let robot = state.robot || { ...DEFAULT_ROBOT };

    if (action === 'turn_left') {
      robot = { ...robot, dir: rotateLeft(robot.dir) };
    } else if (action === 'turn_right') {
      robot = { ...robot, dir: rotateRight(robot.dir) };
    } else if (action === 'move_forward') {
      robot = moveForward(robot);
    }

    stateManager.updateState({ robot });
  }

  render(stateManager) {
    const state = ensureState(stateManager);
    const { robot } = state;
    const robotSymbols = { N: '↑', E: '→', S: '↓', W: '←' };

    const cells = [];
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const isRobot = robot && robot.x === x && robot.y === y;
        cells.push(
          <div
            key={`${x}-${y}`}
            style={{
              width: '20px',
              height: '20px',
              border: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}
          >
            {isRobot ? robotSymbols[robot.dir] || '🤖' : ''}
          </div>
        );
      }
    }

    return (
      <div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, 20px)`,
            gap: '2px'
          }}
        >
          {cells}
        </div>
      </div>
    );
  }

  getAvailableBlocks() {
    return [
      { type: 'grid_move_forward' },
      { type: 'grid_turn_left' },
      { type: 'grid_turn_right' },
      { type: 'controls_repeat' }
    ];
  }
}
