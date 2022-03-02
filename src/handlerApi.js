import { getRawValue } from "./getRawValue"
import { getRef } from "./getRef"
import { sortNodes } from "./sortNodes"
import { materialize, getTypeof, getKeys, getLength } from "."

export class HandlerApi {
    #ctx
    #visited
    root

    constructor(ctx, visited) {
        this.#ctx = ctx
        this.#visited = visited
        this.root = ctx.proxy
    }

    /**
     * In the context of a comparison handler such as $lt or $regex,
     * gets the value of the corresponding property to compare against.
     * @returns {Promise<any>}
     */
    getComparisonProp() {
        return this.#ctx.comparisonProxy[this.#ctx.rootProp]
    }

    /**
     * Sorts a list of items by their cost; useful for scenarios where you would like to process a list of items,
     * one at a time, but stopping before you get to the end, such as when searching a list for an item that matches some
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
}

// These public functions are included in the API as a courtesy
HandlerApi.prototype.getTypeof = getTypeof
HandlerApi.prototype.getKeys = getKeys
HandlerApi.prototype.getLength = getLength
HandlerApi.prototype.getRawValue = getRawValue
