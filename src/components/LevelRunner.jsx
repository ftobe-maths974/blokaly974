import Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import buildToolbox from '../blockly/loadBlocksForLevel';
import GridPlugin from '../plugins/GridPlugin';
import BlocklyContainer from './BlocklyContainer';
import EnvironmentPlugin from '../core/EnvironmentPlugin';
import Runtime from '../core/Runtime';
import StateManager from '../core/StateManager';
import Validator from '../core/Validator';

class PlaceholderEnvironment extends EnvironmentPlugin {
  constructor(type) {
    super();
    this.type = type;
  }

  async parseActions(rawActions) {
    return Array.isArray(rawActions) ? rawActions : [];
  }

  async applyAction(action, stateManager) {
    stateManager.updateState({ lastAction: action, environment: this.type });
  }

  render() {
    return <div>placeholder</div>;
  }

  getAvailableBlocks() {
    return [];
  }
}

const registerGridBlocks = () => {
  if (!Blockly.Blocks.grid_move_forward) {
    Blockly.Blocks.grid_move_forward = {
      init() {
        this.appendDummyInput().appendField('avancer');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(160);
      },
    };
  }

  if (!Blockly.Blocks.grid_turn_left) {
    Blockly.Blocks.grid_turn_left = {
      init() {
        this.appendDummyInput().appendField('tourner à gauche');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(160);
      },
    };
  }

  if (!Blockly.Blocks.grid_turn_right) {
    Blockly.Blocks.grid_turn_right = {
      init() {
        this.appendDummyInput().appendField('tourner à droite');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(160);
      },
    };
  }

  javascriptGenerator.forBlock.grid_move_forward = () => 'grid_move_forward();\n';
  javascriptGenerator.forBlock.grid_turn_left = () => 'grid_turn_left();\n';
  javascriptGenerator.forBlock.grid_turn_right = () => 'grid_turn_right();\n';
};

const createEnvironmentPlugin = (type) => {
  if (type === 'grid') {
    return new GridPlugin();
  }
  return new PlaceholderEnvironment(type || 'default');
};

const buildValidatorFromConditions = (conditions = []) => {
  const predicates = conditions
    .map((condition) => {
      if (condition?.type === 'robot_at') {
        const { x, y } = condition;
        return (state) => {
          const robot = state?.robot || {};
          return robot.x === x && robot.y === y;
        };
      }
      return null;
    })
    .filter(Boolean);

  return new Validator({ all: predicates });
};

const LevelRunner = ({ levelJson }) => {
  const initialState = levelJson?.initialState || {};
  const stateManager = useMemo(() => new StateManager(initialState), [initialState]);
  const environmentPlugin = useMemo(
    () => createEnvironmentPlugin(levelJson?.type),
    [levelJson?.type],
  );
  const validator = useMemo(
    () => buildValidatorFromConditions(levelJson?.conditions || []),
    [levelJson],
  );
  const runtime = useMemo(
    () => new Runtime({
      environmentPlugin,
      stateManager,
      validator: {
        validate: async (manager) => validator.check(manager.getState()),
      },
    }),
    [environmentPlugin, stateManager, validator],
  );
  const [feedback, setFeedback] = useState(null);
  const workspaceRef = useRef(null);

  useEffect(() => {
    if (levelJson?.type === 'grid') {
      registerGridBlocks();
    }
  }, [levelJson?.type]);

  const handleRun = useCallback(async () => {
    const actions = workspaceRef.current
      ? javascriptGenerator.workspaceToCode(workspaceRef.current)
      : ['noop'];
    const result = await runtime.run(async () => actions);
    const success = result.validation?.success ?? false;
    setFeedback(success ? 'success' : 'failure');
  }, [runtime]);

  return (
    <div>
      <button type="button" onClick={handleRun}>
        Run
      </button>
      <div>{environmentPlugin.render(stateManager)}</div>
      <BlocklyContainer
        onWorkspaceCreated={(workspace) => {
          workspaceRef.current = workspace;
        }}
        toolboxXml={buildToolbox(levelJson)}
      />
      {feedback && <div>{feedback}</div>}
    </div>
  );
};

export default LevelRunner;
