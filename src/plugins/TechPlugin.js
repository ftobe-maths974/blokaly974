import EnvironmentPlugin from '../core/EnvironmentPlugin';

export default class TechPlugin extends EnvironmentPlugin {
  async parseActions(rawCode) {
    return [];
  }

  async applyAction(action, stateManager) {
    stateManager.updateState({ lastTechAction: action });
  }

  render(stateManager) {
    return <div>tech placeholder</div>;
  }

  getAvailableBlocks() {
    return [];
  }
}
