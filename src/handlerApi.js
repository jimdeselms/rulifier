import { getRawValue } from "./getRawValue"
import { getRef } from "./getRef"
import { sortNodes } from "./sortNodes"
import { materialize } from "."

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

    getRawValue(obj) {
        return getRawValue(obj)
    }

    sortNodesByCost(arr, accessor = (obj) => obj) {
        return sortNodes(arr, this.#ctx, accessor)
    }

    materialize(obj) {
        return materialize(obj)
    }

    getRef(str) {
        return getRef(str, this)
    }
}
