import { javascriptGenerator } from 'blockly/javascript';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import buildToolbox from '../blockly/loadBlocksForLevel';
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

const createEnvironmentPlugin = (type) => new PlaceholderEnvironment(type || 'default');

const LevelRunner = ({ levelJson }) => {
  const initialState = levelJson?.initialState || {};
  const stateManager = useMemo(() => new StateManager(initialState), [initialState]);
  const environmentPlugin = useMemo(
    () => createEnvironmentPlugin(levelJson?.type),
    [levelJson?.type],
  );
  const validator = useMemo(() => new Validator(levelJson?.conditions), [levelJson]);
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
