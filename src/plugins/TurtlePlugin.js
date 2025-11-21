import EnvironmentPlugin from '../core/EnvironmentPlugin';

export default class TurtlePlugin extends EnvironmentPlugin {
  async parseActions(rawCode) {
    return [];
  }

  async applyAction(action, stateManager) {
    stateManager.updateState({ lastTurtleAction: action });
  }

  render(stateManager) {
    return <div>turtle placeholder</div>;
  }

  getAvailableBlocks() {
    return [];
  }
}
