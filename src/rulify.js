const { builtinHandlers } = require("./builtinHandlers")
const { PROXY_CONTEXT, COST } = require("./symbols")
const { proxify } = require("./proxify")

/**
 * Given a set of data sources with objects and handlers, returns an object that merges the given objects
 * so that they can be materialized by invoking the referenced handlers
 * @param {...Record<any, any>} dataSources
 * @returns {Record<any, any>}
 */
module.exports.rulify = function rulify(...dataSources) {
    const merged = {}
    let handlers = {}

    for (let dataSource of dataSources) {
        const proxyContext = dataSource[PROXY_CONTEXT]
        if (proxyContext) {
            // If the thing is "already rulfied", then we want to grab the
            // raw value and re-proxify it.
            Object.assign(handlers, proxyContext.handlers)

            dataSource = proxyContext.dataSource
        } else {
            Object.assign(handlers, normalizeHandlers(dataSource.$handlers))
            delete dataSource.$handlers
        }
        Object.assign(merged, dataSource)
    }

    Object.assign(handlers, builtinHandlers)

    // Set up the context
    // handlers: the set of handlers
    // resolvedValueCache: In the resolution process, if we've already gotten a raw value
    // before, then we'll cache a promise that returns its resolution
    //
    // Note that the caches use weak maps so that they won't cause a memory leak as
    // values go out of scope
    const ctx = {
        handlers,
        dataSource: merged,
        resolvedValueCache: new WeakMap(),
    }

    return proxify(merged, ctx)
}

function normalizeHandlers(handlers) {
    if (!handlers) {
        return undefined
    }

    const entries = Object.entries(handlers).map(([k, v]) => [k[0] === "$" ? k : "$" + k, normalizeHandlerFunction(v)])

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
