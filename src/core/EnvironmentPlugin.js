/**
 * Defines the contract an environment must implement to interact with the runtime.
 * Implementations translate raw program output into actionable commands, apply them
 * to the state manager, expose UI rendering hooks, and declare available Blockly blocks.
 */
export default class EnvironmentPlugin {
  /**
   * Transforms raw actions produced by a program into normalized actions understood
   * by the environment.
   *
   * @param {Array|Object} rawActions - Unprocessed actions produced by the program.
   * @param {Object} stateManager - State container exposing the current environment state.
   * @returns {Promise<Array>} Normalized actions ready to be applied sequentially.
   */
  async parseActions(rawActions, stateManager) {
    throw new Error('EnvironmentPlugin.parseActions must be implemented.');
  }

  /**
   * Applies a single normalized action to the environment state.
   *
   * @param {Object} action - Action object after parsing and validation.
   * @param {Object} stateManager - Mutable state manager used to persist changes.
   * @returns {Promise<void>} Resolves when the action has been applied.
   */
  async applyAction(action, stateManager) {
    throw new Error('EnvironmentPlugin.applyAction must be implemented.');
  }

  /**
   * Provides a renderable representation of the current environment.
   *
   * @param {Object} stateManager - Source of truth for the environment state.
   * @returns {React.ReactNode|any} A renderable element or primitive describing the UI.
   */
  render(stateManager) {
    throw new Error('EnvironmentPlugin.render must be implemented.');
  }

  /**
   * Returns the Blockly blocks available for this environment.
   *
   * @returns {Array<Object>} Definitions describing custom blocks to register.
   */
  getAvailableBlocks() {
    throw new Error('EnvironmentPlugin.getAvailableBlocks must be implemented.');
  }
}
