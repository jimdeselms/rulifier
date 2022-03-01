import { getRawValue } from './getRawValue'
import { getRef } from './getRef'
import { sortNodes } from './sortNodes'

export class HandlerApi {
    #ctx
    root 
    #realize
 
    constructor(ctx, realize) {
        this.#ctx = ctx
        this.root = ctx.proxy
        this.#realize = realize
    }

    getComparisonProp() {
        return this.#ctx.comparisonProxy[this.#ctx.rootProp]
    }
    
    getRawValue(obj) {
        return getRawValue(obj)
    }

    sortNodesByCost(arr, accessor=(obj)=>obj) {
        return sortNodes(arr, this.#ctx, accessor)
    }

    realize(obj) {
        return this.#realize(obj)
    }

    getRef(str) {
        return getRef(str, this)
    }
}
