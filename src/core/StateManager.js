/**
 * StateManager is responsible for storing and exposing the mutable world state.
 * It acts as a thin abstraction over a plain object to centralize mutations and
 * provide a consistent contract for consumers such as Runtime and environment plugins.
 */
export default class StateManager {
  /**
   * @param {Object} [initialState={}] - Optional initial state snapshot.
   */
  constructor(initialState = {}) {
    this.state = { ...initialState };
  }

  /**
   * Returns a shallow copy of the current state to avoid accidental external mutations.
   * @returns {Object}
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Replaces the entire state with a new snapshot.
   * @param {Object} nextState
   */
  setState(nextState) {
    this.state = { ...nextState };
  }

  /**
   * Performs a partial update by merging the provided patch into the current state.
   * @param {Object} patch
   */
  updateState(patch) {
    this.state = { ...this.state, ...patch };
  }

  /**
   * Clears the state back to an empty object.
   */
  reset() {
    this.state = {};
  }
}
