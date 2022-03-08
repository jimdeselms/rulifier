import { rulify } from "./rulify"
import { materialize, getTypeof, getKeys, getLength } from "./methods"

export class Rulifier {
    #opts
    #root

    /**
     * @typedef { Object } CostOptions Defines limits for calculating costs
     * @property { number } [maxDepth] The maximum depth to explore
     * @property { number } [maxBreadth] The maximum number of nodes to explore when iterating a large object or array
     * @property { number } [maxNodes] The total number of nodes to explore when calculating cost
     */

    /**
     * @param {Object} [opts]
     * @param {Record<string, any>[]} opts.dataSources The set of data sources to rulify
     * @param {Record<string, (arg: any, sdk: RuleApi) => any>} [opts.rules] Custom rules
     * @param {CostOptions} [opts.costOptions] Defines limits when calculating costs
     */
    constructor(opts) {
        opts = opts ?? {}
        this.#opts = opts
        const dataSources = opts.dataSources
            ? Array.isArray(opts.dataSources)
                ? opts.dataSources
                : [opts.dataSources]
            : []

        this.#root = rulify(dataSources, opts.costOptions, opts.rules)
    }

    /**
     * Given a rulified object, the object is evaluated and converted into a
     * fully materialized object
     * @template T
     * @param {Rulified<T>} obj A rulified object that
     * @returns {Promise<T>}
     */
    materialize(obj) {
        return materialize(obj)
    }

    /**
     * Applies a new set of context to a rulified object and returns the new root.
     *
     * Any cached values will be cleared
     * @template T
     * @param {Record<any, any>} dataSource The new context to apply
     * @returns {Rulified<T>}
     */
    applyContext(dataSource = {}) {
        return rulify([this.#root, dataSource], this.#opts.costOptions)
    }

    /**
     * Returns the simple Javascript type of the given Rulified object
     * @param {Rulified<any>} obj
     * @returns {Promise<string>}
     */
    getTypeof(obj) {
        return getTypeof(obj)
    }

    /**
     * Returns the keys of a rulified object, or undefined if the object is a type
     * that doesn't have keys (such as a number or string.)
     * @param {Rulified<any>} obj
     * @returns {Promise<string[] | undefined>}
     */
    getKeys(obj) {
        return getKeys(obj)
    }

    /**
     * Returns the length of the rulified object if it represents an array. Otherwise,
     * it returns undefined
     * @param {Rulified<any>} obj
     * @returns {Promise<number | undefined>}
     */
    getLength(obj) {
        return getLength(obj)
    }
}
