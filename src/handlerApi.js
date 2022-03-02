import { getRawValue } from "./getRawValue"
import { getRef } from "./getRef"
import { sortNodes } from "./sortNodes"
import { materialize, getTypeof, getKeys, getLength } from "."

export class HandlerApi {
    #ctx
    root

    constructor(ctx) {
        this.#ctx = ctx
        this.root = ctx.proxy
    }

    getComparisonProp() {
        return this.#ctx.comparisonProxy[this.#ctx.rootProp]
    }

    sortNodesByCost(arr, accessor = (obj) => obj) {
        return sortNodes(arr, this.#ctx, accessor)
    }

    getRef(str) {
        return getRef(str, this)
    }
}

// These public functions are included in the API as a courtesy
HandlerApi.prototype.materialize = materialize
HandlerApi.prototype.getTypeof = getTypeof
HandlerApi.prototype.getKeys = getKeys
HandlerApi.prototype.getLength = getLength
HandlerApi.prototype.getRawValue = getRawValue

