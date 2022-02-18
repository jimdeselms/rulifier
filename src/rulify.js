import { builtinHandlers } from "./builtinHandlers"
import { GET_WITH_NEW_ROOT, RAW_VALUE, COST } from "./common"
import { calculateCost } from './calculateCost'

const IS_RULIFIED = Symbol.for("__IS_RULIFIED")
const IS_MATERIALIZED = Symbol.for("__IS_MATERIALIZED")

/**
 * @param  {...Record<any, any>} dataSources
 * @returns {any}
 */
export function rulify(...dataSources) {
    const root = {}
    let handlers = {}

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
    if (caches.proxyCache.has(dataSource)) {
        return caches.proxyCache.get(dataSource)
    }

    const type = typeof dataSource

    if (dataSource === null || type !== "object") {
        // If it's a plain object, just return it.
        return dataSource
    }

    // If the thing is already a proxy, return it.
    if (dataSource[IS_RULIFIED]) {
        return dataSourcd
    }

    // Check if it's a call to a handler
    const keys = Object.keys(dataSource)
    let key, handler

    // If it's a call to a handler then get the value of the proxy and call the handler with it.
    if (keys.length === 1 && (key = keys[0]) && (handler = handlers?.[key])) {
        const handlerArgument = proxify(dataSource[key], handlers, root, prop, caches)
        const handlerResult = handler(handlerArgument, { root, prop })
        return proxify(handlerResult, handlers, root, prop, caches)
    }

    // Create the proxy, and add the handlers later so that they can reference the proxy.
    const proxyHandler = {}
    const proxy = new Proxy(dataSource, proxyHandler)

    caches.proxyCache.set(dataSource, proxy)

    proxyHandler.get = function (target, prop) {
        return get(target, proxy, prop, root, handlers, caches)
    }

    // If root isn't yet defined, then this must be the top object.
    if (root === undefined) {
        root = proxy
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
            return calculateCost(target, handlers, caches)
        case IS_MATERIALIZED:
            return target[IS_MATERIALIZED]
    }

    // If this thing is "materialized" then just return it directly.
    if (target[IS_MATERIALIZED]) {
        return target[prop]
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

    // If this is a promise, then if we're actually resolving the promise, then we want to return an actual
    // Promise that "materializes" the object. If this is a promise, but we're reading some other property off it,
    // then we want to 
    const then = target?.then
    if (typeof then === "function") {
        if (prop === "then") {
            result = (fn) => target.then(value => materialize(value).then(fn))
        } else {
            result = proxify(
                target.then(r => proxify(r, handlers, root, prop, caches)[prop]),
                handlers,
                root,
                prop,
                caches)
        }
    } else {
        // It's not a promise, so just get the value directly.
        result = proxify(target[prop], handlers, root, prop, caches)
    }

    // And store away this result so that we don't have to evaluate it again.
    resolvedValues.set(prop, result)

    return result
}

async function materialize(obj) {
    const value = await obj

    const type = typeof value

    // It's just a boring object. Return it directly.
    if (value === null || type !== "object") {
        return value
    }

    if (value[IS_RULIFIED]) {
        value[IS_MATERIALIZED] = true
    }

    return value
}