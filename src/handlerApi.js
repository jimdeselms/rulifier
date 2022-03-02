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

    getComparisonProp() {
        return this.#ctx.comparisonProxy[this.#ctx.rootProp]
    }

    sortNodesByCost(arr, accessor = (obj) => obj) {
        return sortNodes(arr, this.#ctx, accessor)
    }

    getRef(str) {
        return getRef(str, this, this.#visited)
    }

    materialize(obj) {
        return materialize(obj, this.#visited)
    }
}

// These public functions are included in the API as a courtesy
HandlerApi.prototype.getTypeof = getTypeof
HandlerApi.prototype.getKeys = getKeys
HandlerApi.prototype.getLength = getLength
HandlerApi.prototype.getRawValue = getRawValue
