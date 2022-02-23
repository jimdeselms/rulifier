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

    // Set up the context
    // handlers: the set of handlers
    // proxyCache: the set of proxied objects; if we proxify the same object
    //   more than once, then we should return the same proxy.
    // resolvedValueCache: when we get values, if we've already resolved an object
    //   then we'll just return the resolved object so that we don't have to waste
    //   cycles.
    // 
    // Note that the caches use weak maps so that they won't cause a memory leak as
    // values go out of scope
    const ctx = { 
        handlers,
        proxyCache: new WeakMap(),
        resolvedValueCache: new WeakMap()
    }

    return proxify(root, ctx)
}

function normalizeHandlers(handlers) {
    if (!handlers) {
        return undefined
    }

    const entries = Object.entries(handlers).map(([k, v]) => [k[0] === "$" ? k : "$" + k, v])

    return Object.fromEntries(entries)
}

export function proxify(value, ctx) {

    // If this is already a proxy, then just return it.
    if (value[IS_RULIFIED]) {
        return value
    }

    // If we've already built a proxy for this object, then return it.
    if (ctx.proxyCache.has(value)) {
        return ctx.proxyCache.get(value)
    }

    let promisifiedObject = value

    // proxify always wraps promises.
    if (promisifiedObject === null || typeof promisifiedObject !== "object" || typeof promisifiedObject?.then !== "function") {
        promisifiedObject = Promise.resolve(promisifiedObject)
    }

    // Create the proxy, and add the handlers later so that they can reference the proxy.
    const proxyHandler = {}
    const proxy = new Proxy(value, proxyHandler)

    proxyHandler.get = function (target, prop) {
        return get(target, prop, proxy, ctx)
    }

    ctx.proxyCache.set(value, proxy)

    return proxy
}

function get(target, prop, proxy, ctx) {
    switch (prop) {
        // When requesting the value function, we return a promise to a function (not a proxy)
        case "value": return () => materialize(target, proxy, ctx)

        // This just tells us that we've already got an object that's a proxy
        case IS_RULIFIED: return true

        // This returns the raw, unprocessed promise
        case RAW_VALUE: return target
    }

    return proxify(getAsync(target, prop, proxy, ctx), ctx)
}

async function getAsync(target, prop, proxy, ctx) {
    const resolved = await resolve(target, proxy, ctx)
    return resolved[prop]
}

async function resolve(target, proxy, ctx) {
    if (ctx.resolvedValueCache.has(proxy)) {
        return ctx.resolvedValueCache.get(proxy)
    }

    let value = await target

    if (value === null || typeof value !== "object") {
        return value
    } else {
        // Are we calling a handler? Then do it and pass back the result.
        const h = getHandlerAndArgument(value, ctx.handlers)
        if (h) {
            // Proxify the argument so that we can resolve if it's also a rule reference.
            const arg = await proxify(h.argument, ctx)
            value = await h.handler(arg)
        }
    }

    ctx.resolvedValueCache.set(target, value)

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

async function materialize(value, proxy, ctx) {

    value = await resolve(value, proxy, ctx)
    const type = typeof value
    if (value === null || (type !== "object" && type !== "function")) {
        return value
    }

    const result = Array.isArray(value)
        ? []
        : {}

    for (const [k, v] of Object.entries(value)) {
        const resolved = await v
        result[k] = await materialize(resolved, proxy, ctx)
    }

    return result
}
