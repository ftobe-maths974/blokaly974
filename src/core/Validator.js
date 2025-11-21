/**
 * Validator evaluates configured conditions against a given state object.
 */
class Validator {
  /**
   * Create a new Validator.
   *
   * @param {{ all?: Array<(state: unknown) => boolean> }} conditionsConfig -
   * Configuration object containing an array of predicates in `all`.
   */
  constructor(conditionsConfig = {}) {
    const { all = [] } = conditionsConfig;
    this.conditions = Array.isArray(all) ? all : [];
  }

  /**
   * Check whether all configured conditions pass for the provided state.
   *
   * @param {unknown} state - Arbitrary state object to validate.
   * @returns {{ success: boolean }} Object describing validation success.
   */
  check(state) {
    const success = this.conditions.every((predicate) => {
      try {
        return typeof predicate === 'function' ? predicate(state) : false;
      } catch (_) {
        return false;
      }
    });

    return { success };
  }
}

export default Validator;
