import { builtinRules } from "./builtinRules"
import { PROXY_CONTEXT, COST } from "./symbols"
import { proxify, materializeInternal, resolve } from "./proxify"
import { initInternalFunctions } from "./methods"

initInternalFunctions({ materializeInternal, resolve, proxify, rulify })

/**
 * Given a set of data sources with objects and rules, returns an object that merges the given objects
 * so that they can be materialized by invoking the referenced rules
 * @param {...Record<any, any>} dataSources
 * @returns {Record<any, any>}
 */
export function rulify(dataSources, costOptions = {}, rules = {}) {
    const merged = {}
    let mergedHandlers = {}

    for (let dataSource of dataSources) {
        const proxyContext = dataSource[PROXY_CONTEXT]
        if (proxyContext) {
            // If the thing is "already rulfied", then we want to grab the
            // raw value and re-proxify it.
            Object.assign(mergedHandlers, proxyContext.rules)

            dataSource = proxyContext.dataSource
        }
        Object.assign(merged, dataSource)
    }

    Object.assign(mergedHandlers, normalizeHandlers(rules), builtinRules)

    // Set up the context
    // rules: the set of rules
    // resolvedValueCache: In the resolution process, if we've already gotten a raw value
    // before, then we'll cache a promise that returns its resolution
    //
    // Note that the caches use weak maps so that they won't cause a memory leak as
    // values go out of scope
    const ctx = {
        rules: mergedHandlers,
        dataSource: merged,
        resolvedValueCache: new WeakMap(),
        costOptions: {
            maxDepth: costOptions.maxDepth ?? 4,
            maxBreadth: costOptions.maxBreadth ?? 25,
            maxNodes: costOptions.maxNodes ?? 200,
        },
    }

    return proxify(merged, ctx)
}

function normalizeHandlers(rules) {
    if (!rules) {
        return undefined
    }

    const entries = Object.entries(rules).map(([k, v]) => [k[0] === "$" ? k : "$" + k, normalizeHandlerFunction(v)])

    return Object.fromEntries(entries)
}

function normalizeHandlerFunction(func) {
    if (typeof func === "function") {
        return func
    } else {
        const newFunc = func.fn
        newFunc[COST] = func.cost
        return newFunc
    }
}
