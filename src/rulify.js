import { builtinHandlers } from "./builtinHandlers"
import { GET_WITH_NEW_ROOT, RAW_VALUE, COST } from "./common"
import { calculateCost } from './calculateCost'

const IS_RULIFIED = Symbol.for("__IS_RULIFIED")
const HANDLERS = Symbol.for("__HANDLERS")
const DATA_SOURCE = Symbol.for("__DATA_SOURCE")

/**
 * @param  {...Record<any, any>} dataSources
 * @returns {any}
 */
export function rulify(...dataSources) {

    const root = {}
    let handlers = {}

    const caches = {
        resolvedValueCache: new WeakMap(),
    }

    for (let dataSource of dataSources) {
        if (dataSource[DATA_SOURCE]) {
            // If the thing is "already rulfied", then we want to grab the
            // raw value and re-proxify it.
            Object.assign(handlers, dataSource[HANDLERS])

            dataSource = dataSource[DATA_SOURCE]
        } else {
            Object.assign(handlers, normalizeHandlers(dataSource.$handlers))
            delete dataSource.$handlers
        }
        Object.assign(root, dataSource)
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
        dataSource: root,
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

    let promisifiedObject = value

    // proxify always wraps promises.
    if (promisifiedObject === null || typeof promisifiedObject !== "object" || typeof promisifiedObject?.then !== "function") {
        promisifiedObject = Promise.resolve(promisifiedObject)
    }

    // Create the proxy, and add the handlers later so that they can reference the proxy.
    const proxyHandler = {}
    const proxy = new Proxy(promisifiedObject, proxyHandler)

    proxyHandler.get = function (target, prop) {
        return get(target, prop, ctx)
    }

    return proxy
}

function get(target, prop, ctx) {
    switch (prop) {
        // When requesting the value function, we return a promise to a function (not a proxy)
        case "value": return () => materialize(target, ctx)

        // This just tells us that we've already got an object that's a proxy
        case IS_RULIFIED: return true

        // This returns the raw, unprocessed promise
        case RAW_VALUE: return target

        // Get the handlers
        case HANDLERS: return ctx.handlers

        // When rebuilding, grab the existing dataSource.
        case DATA_SOURCE: return ctx.dataSource
    }

    return proxify(getAsync(target, prop, ctx), ctx)
}

async function getAsync(target, prop, ctx) {
    const resolved = await resolve(target, ctx)
    return resolved[prop]
}

async function resolve(target, ctx) {
    let value = await target

    if (ctx.resolvedValueCache.has(value)) {
        return await ctx.resolvedValueCache.get(value)
    }

    if (value !== null && (typeof value === "object" || typeof value === "function")) {
        if (typeof value === "object") {
            // Are we calling a handler? Then do it and pass back the result.
            const h = getHandlerAndArgument(value, ctx.handlers)
            if (h) {
                // We'll cache the promise so that if another request tries to 
                // resolve the same value, they'll both be waiting on the same
                // promise.
                const resolvedValuePromise = resolveHandler(h, ctx)
                ctx.resolvedValueCache.set(value, resolvedValuePromise)
                value = await resolvedValuePromise
            } else {
                // This might not be worth it; if we have a cache hit, the only
                // thing we've saved is the type check and call to getHandlerAndArgument.
                // 
                // Later when we do a performance analysis, we can see if this
                // actually speeds it up or not.
                ctx.resolvedValueCache.set(value, Promise.resolve(value))
            }
        }
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

async function resolveHandler({ handler, argument }, ctx) {
    const arg = await proxify(argument, ctx)
    return await handler(arg)
}

async function materialize(value, ctx) {

    value = await resolve(value, ctx)
    const type = typeof value
    if (value === null || (type !== "object" && type !== "function")) {
        return value
    }

    const result = Array.isArray(value)
        ? []
        : {}

    for (const [k, v] of Object.entries(value)) {
        const resolved = await v
        result[k] = await materialize(resolved, ctx)
    }

    return result
}
