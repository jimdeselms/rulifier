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

export function proxify(value, handlers) {

    debugger 

    // If this is already a proxy, then just return it.
    if (value[IS_RULIFIED]) {
        return value
    }

    // proxify always wraps promises.
    if (value === null || typeof value !== "object" || typeof value?.then !== "function") {
        value = Promise.resolve(value)
    }

    // Create the proxy, and add the handlers later so that they can reference the proxy.
    const proxyHandler = {}
    const proxy = new Proxy(value, proxyHandler)

    proxyHandler.get = function (target, prop) {
        return get(target, prop, handlers)
    }

    return proxy
}

function get(target, prop, handlers) {
    switch (prop) {
        // When requesting the value function, we return a promise to a function (not a proxy)
        case "value": return () => materialize(target, handlers)

        // We're trying to resolve the promise. Return a then that 
        // gets the resolved value and turns it into a proxy.
//        case "then": return (fn) => target.then(result => fn(proxify(result, handlers)))

        // This just tells us that we've already got an object that's a proxy
        case IS_RULIFIED: return true

        // This returns the raw, unprocessed promise
        case RAW_VALUE: return target
    }

    return proxify(getAsync(target, prop, handlers), handlers)
}



async function getAsync(target, prop, handlers) {
    const resolved = await resolve(target, handlers)
    return resolved[prop]
}

async function resolve(target, handlers) {
    let value = await target

    if (value === null || typeof value !== "object") {
        return value
    }

    // Are we calling a handler? Then do it and pass back the result.
    const h = getHandlerAndArgument(value, handlers)
    if (h) {
        // Proxify the argument so that we can resolve if it's also a rule reference.
        const arg = await proxify(h.argument, handlers)
        value = await h.handler(arg)
    }

    return value
}

function getHandlerAndArgument(obj, handlers) {
    if (typeof obj !== "object") {
        return undefined
    }

    const keys = Object.keys(obj)
    let key, handler
    if (keys.length === 1 && (key = keys[0])[0] === "$" && (handler = handlers[key])) {
        return { handler, argument: obj[key] }
    } else {
        return undefined
    }
}

async function materialize(value, handlers) {

    value = await resolve(value, handlers)
    const type = typeof value
    if (value === null || (type !== "object" && type !== "function")) {
        return value
    }

    const result = Array.isArray(value)
        ? []
        : {}

    for (const [k, v] of Object.entries(value)) {
        const resolved = await v
        result[k] = await materialize(resolved, handlers)
    }

    return result
}
