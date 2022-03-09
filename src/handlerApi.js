import { getRawValue } from "./getRawValue"
import { getRef } from "./getRef"
import { sortNodes } from "./sortNodes"

import { materialize, getTypeof, getKeys, getLength, has } from "./methods"

/**
 * @classdesc Provides the interface between a rule and Rulifier
 */
export class RuleApi {
    #ctx
    #visited
    root

    /**
     * @private
     * @param {*} ctx
     * @param {*} visited
     */
    constructor(ctx, visited) {
        this.#ctx = ctx
        this.#visited = visited
        this.root = ctx.proxy
    }

    /**
     * In the context of a comparison rule such as $lt or $regex,
     * gets the value of the corresponding property to compare against.
     * @returns {Promise<any>}
     */
    getComparisonProp() {
        return this.#ctx.comparisonProxy[this.#ctx.rootProp]
    }

    /**
     * Sorts a list of items by their cost; useful for scenarios where you would like to process a list of items,
     * one at a time, but stopping before you get to the end, such as when seanprching a list for an item that matches some
     * criteria
     * @param {any[]} array An array of items to sort
     * @param {(item: any) => any} accessor Optional function to get the field that will determine the cost of an item in the list
     * @returns {Promise<any[]>}
     */
    sortNodesByCost(array, accessor = (obj) => obj) {
        return sortNodes(array, this.#ctx, accessor)
    }

    /**
     * Traverses the rulified object's properties to find the item at the specified path
     * @param {string} path A '.' separated path to the requested item. Array items may be indexed by either '[n]' or '.n',
     * for example, "person.friends[1].name" or "person.friends.1.name"
     * @returns {any} The referenced item
     */
    getRef(path) {
        return getRef(path, this, this.#visited)
    }

    /**
     * Given a rulified object, converts it into a fully materialized object.
     * @param {any}
     * @returns {Promise<any>}
     */
    materialize(obj) {
        return materialize(obj, this.#visited)
    }

    /**
     * Given a rulified object, returns the raw value with its unevaluated rules.
     *
     * If the object is not rulified, then it just returns the object
     * @param {any} obj
     * @returns {Promise<any>}
     */
    getRawValue(obj) {
        return getRawValue(obj)
    }

    // These pass-throughs are provided as a convenience

    /**
     * Returns the basic Javascript type of the object
     * @param {any} obj
     * @returns {Promise<string>}
     */
    getTypeof(obj) {
        return getTypeof(obj)
    }

    /**
     * Returns the set of keys for the given object, or undefined if the object isn't
     * a type that has keys
     * @param {any} obj
     * @returns {Promise<string[] | undefined>}
     */
    getKeys(obj) {
        return getKeys(obj)
    }

    /**
     * Returns true if the given object has the given key,
     * otherwise, false
     * @param {any} obj
     * @returns {Promise<boolean>}
     */
    has(obj, key){
        return has(obj, key)
    }

    /**
     * Returns the length of an array, or undefined if the object is not an arary
     * @param {any} obj
     * @returns {Promise<string[] | undefined>}
     */
    getLength(obj) {
        return getLength(obj)
    }
}
