//const { builtinHandlers } = require("./builtinHandlers")

import { builtinHandlers } from "./builtinHandlers"
import { GET_WITH_NEW_ROOT, RAW_VALUE, COST } from "./common"
import { calculateCost } from './calculateCost'

const IS_RULIFIED = Symbol.for("__IS_RULIFIED")

/**
 * @param  {...Record<any, any>} dataSources
 * @returns {any}
 */
export function rulify(...dataSources) {
    const root = {}
    let handlers = {}

    let alreadyRulified = false

    // The caches use weak maps so that they won't cause memory leaks
    // when the proxies or resolved values go out of scope.
    const caches = {
        proxyCache: new WeakMap(),
        resolvedValueCache: new WeakMap(),
    }

    for (let dataSource of dataSources) {
        if (dataSource[IS_RULIFIED]) {
            // If the thing is "already rulfied", then we want to grab the
            // raw value and re-proxify it.
            dataSource = dataSource[RAW_VALUE]
            alreadyRulified = true
        }
        Object.assign(root, dataSource)
        Object.assign(handlers, normalizeHandlers(dataSource.$handlers))
    }

    delete root.$handlers

    Object.assign(handlers, builtinHandlers)

    return proxify(root, handlers, undefined, undefined, caches)
}

function normalizeHandlers(handlers) {
    if (!handlers) {
        return undefined
    }

    const entries = Object.entries(handlers).map(([k, v]) => [k[0] === "$" ? k : "$" + k, v])

    return Object.fromEntries(entries)
}

function proxify(dataSource, handlers, root, prop, caches) {
    const originalDataSource = dataSource

    if (caches.proxyCache.has(dataSource)) {
        return caches.proxyCache.get(dataSource)
    }

    const type = typeof dataSource

    if (dataSource === null || (type !== "object" && type !== "function")) {
        return dataSource
    }

    if (type === "object") {
        // Check if it's a call to a handler
        const keys = Object.keys(dataSource)
        let key, handler
    
        if (keys.length === 1 && (key = keys[0]) && (handler = handlers?.[key])) {
            const handlerArgument = proxify(dataSource[key], handlers, root, prop, caches)
    
            return proxify(handler(handlerArgument, { root, prop }), handlers, root, prop, caches)
        }
    }

    const proxyHandler = {}

    const proxy = new Proxy(dataSource, proxyHandler)
    caches.proxyCache.set(dataSource, proxy)

    // If the data source was a function, then the value of that function should also be cached.
    if (dataSource !== originalDataSource) {
        caches.proxyCache.set(originalDataSource, proxy)
    }

    if (root === undefined) {
        root = proxy
    }

    proxyHandler.get = function (target, prop) {
        return get(target, proxy, prop, root, handlers, caches)
    }

    proxyHandler.apply = function(target, thisArg, argumentsList) {
        const result = target.apply(thisArg[RAW_VALUE], argumentsList)
        return proxify(result, handlers, root, prop, caches)
    }

    return proxy
}

function get(target, proxy, prop, root, handlers, caches) {
    // Handle these special properties first. Switch is faster than an if-else chain.
    switch (prop) {
        case RAW_VALUE:
            return target
        case IS_RULIFIED:
            return true
        case GET_WITH_NEW_ROOT:
            return (newRoot, newProp) => get(target, proxy, newProp, newRoot, handlers, caches)
        case COST:
            return calculateCost(proxy, root, handlers)
        // case Symbol.iterator:
        //     return target[Symbol.iterator]
    }

    let resolvedValues = caches.resolvedValueCache.get(proxy)
    if (resolvedValues) {
        if (resolvedValues.has(prop)) {
            return resolvedValues.get(prop)
        }
    } else {
        resolvedValues = new Map()
        caches.resolvedValueCache.set(proxy, resolvedValues)
    }

    let result

    // Is this a promise?
    const then = target?.then
    if (typeof then === "function") {
        if (prop === "then") {
            result = then.bind(target)
        } else {
            result = proxify(
                then.bind(target)((data) => {
                    const value = data[prop]
                    return proxify(value, handlers, root, prop, caches)
                }),
                handlers,
                root,
                prop,
                caches
            )
        }
    } else {
        result = proxify(target[prop], handlers, root, prop, caches)
    }

    resolvedValues.set(prop, result)

    return result
}
