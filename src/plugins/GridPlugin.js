import EnvironmentPlugin from '../core/EnvironmentPlugin';

export default class GridPlugin extends EnvironmentPlugin {
  async parseActions(rawCode) {
    return [];
  }

  async applyAction(action, stateManager) {
    stateManager.updateState({ lastGridAction: action });
  }

  render(stateManager) {
    return <div>grid placeholder</div>;
  }

  getAvailableBlocks() {
    return [];
  }
}
