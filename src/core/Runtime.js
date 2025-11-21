/**
 * Runtime orchestrates the execution cycle for Blockly-generated programs.
 * It ties together three main collaborators:
 *  - a StateManager that exposes the mutable world state
 *  - an EnvironmentPlugin that knows how to translate and apply actions in a given environment
 *  - an optional Validator that provides post-run validation
 *
 * The runtime expects an action producer (usually a compiled Blockly program) that returns
 * a list of raw actions. Those actions are interpreted by the EnvironmentPlugin and applied
 * to the current state. The runtime does not directly depend on Blockly and remains agnostic
 * to the environment implementation details.
 */
export default class Runtime {
  /**
   * @param {Object} [config]
   * @param {Object} [config.environmentPlugin] - Component implementing the EnvironmentPlugin contract.
   * @param {Object} [config.stateManager] - State container responsible for storing and exposing the world state.
   * @param {Object} [config.validator] - Validator that can check the final state after execution.
   * @param {number} [config.timeoutMs=5000] - Timeout budget reserved for later defensive execution.
   */
  constructor({ environmentPlugin = null, stateManager = null, validator = null, timeoutMs = 5000 } = {}) {
    this.environmentPlugin = environmentPlugin;
    this.stateManager = stateManager;
    this.validator = validator;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Registers or replaces the environment plugin used by the runtime.
   * @param {Object} plugin - Expected to expose parseActions and applyAction methods.
   */
  setEnvironmentPlugin(plugin) {
    this.environmentPlugin = plugin;
  }

  /**
   * Registers or replaces the state manager instance.
   * @param {Object} manager
   */
  setStateManager(manager) {
    this.stateManager = manager;
  }

  /**
   * Registers or replaces the validator instance.
   * @param {Object} validator
   */
  setValidator(validator) {
    this.validator = validator;
  }

  /**
   * Primary entry point for executing a Blockly program.
   * @param {Function} actionProducer - Function returning raw actions (sync or async).
   * @returns {Promise<{ actions: Array, validation: Object | null }>}
   */
  async run(actionProducer) {
    if (!this.environmentPlugin) {
      throw new Error('Runtime requires an environment plugin to execute.');
    }

    if (typeof actionProducer !== 'function') {
      throw new Error('Runtime.run expects an action producer function.');
    }

    const rawActions = await actionProducer();
    const parsedActions = await this.environmentPlugin.parseActions(rawActions, this.stateManager);

    if (Array.isArray(parsedActions)) {
      for (const action of parsedActions) {
        // Delegates action application to the environment to keep the runtime generic.
        await this.environmentPlugin.applyAction(action, this.stateManager);
      }
    }

    const validation = this.validator && typeof this.validator.validate === 'function'
      ? await this.validator.validate(this.stateManager)
      : null;

    return {
      actions: parsedActions || [],
      validation,
    };
  }
}
