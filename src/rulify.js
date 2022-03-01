import { builtinHandlers } from "./builtinHandlers"
import { GET_WITH_NEW_ROOT, RAW_VALUE, PROXY_CONTEXT, ROUTE, ITERATE_RAW } from "./symbols"
import { getHandlerAndArgument } from "./getHandlerAndArgument"
import { calculateCost } from "./calculateCost"
import { getRef } from "./getRef"
import { sortNodes } from "./handlers/sortNodes"

/**
 * @param {...Record<any, any>} dataSources
 * @returns {any}
 */
export function rulify(...dataSources) {
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

/**
 * Given a rulified object, converts it into a fully materialized object.
 */
export async function realize(proxy) {
    if (!proxy[PROXY_CONTEXT]) {
        throw new Error("Attempt to call realize on an object that isn't rulified")
    }

    return await realizeInternal(proxy[RAW_VALUE], proxy[PROXY_CONTEXT])
}

/**
 * Returns the basic Javascript type of the object
 * @param {any} obj
 * @returns {string}
 */
export async function getTypeof(obj) {
    const resolved = await resolve(obj[RAW_VALUE], obj[PROXY_CONTEXT])
    return typeof resolved
}

/**
 * Returns the set of keys for the given object
 * @param {any} obj
 * @returns {string[]}
 */
export async function getKeys(obj) {
    const resolved = await resolve(obj[RAW_VALUE], obj[PROXY_CONTEXT])
    if (typeof resolved !== "object") {
        return undefined
    } else {
        return Object.keys(resolved)
    }
}

/**
 * Returns the length of an array, or undefined if the object is not an arary
 * @param {any} obj
 * @returns {string[]}
 */
 export async function getLength(obj) {
    const resolved = await resolve(obj[RAW_VALUE], obj[PROXY_CONTEXT])
    if (typeof resolved !== "object" || !Array.isArray(resolved)) {
        return undefined
    } else {
        return resolved.length
    }
}


function normalizeHandlers(handlers) {
    if (!handlers) {
        return undefined
    }

    const entries = Object.entries(handlers).map(([k, v]) => [k[0] === "$" ? k : "$" + k, v])

    return Object.fromEntries(entries)
}

function proxify(value, ctx) {
    // If this is already a proxy, then just return it.
    if (value[PROXY_CONTEXT]) {
        return value
    }

    let promisifiedObject = value

    // proxify always wraps promises.
    if (
        promisifiedObject === null ||
        typeof promisifiedObject !== "object" ||
        typeof promisifiedObject?.then !== "function"
    ) {
        promisifiedObject = Promise.resolve(promisifiedObject)
    }

    // Create the proxy, and add the handlers later so that they can reference the proxy.
    const proxyHandler = {}
    const proxy = new Proxy(promisifiedObject, proxyHandler)

    proxyHandler.get = function (target, prop) {
        return get(target, prop, ctx)
    }

    // Make sure to set the proxy the first time through.
    if (!ctx.proxy) {
        ctx = { ...ctx, proxy }
    }

    return proxy
}

function get(target, prop, ctx) {
    switch (prop) {
        case PROXY_CONTEXT:
            return ctx
        case RAW_VALUE:
            return target
        case GET_WITH_NEW_ROOT:
            return (newRoot, newProp) =>
                get(target, newProp, { ...ctx, prop: newProp, rootProp: newProp, proxy: newRoot })
        case Symbol.asyncIterator:
            return () => iterate(target, ctx)
        case ITERATE_RAW:
            return () => iterateRaw(target, ctx)
    }

    ctx = { ...ctx, prop }
    return proxify(getAsync(target, ctx), ctx)
}

export async function resolve(target, ctx) {
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

async function resolveHandler({ handler, argument }, ctx) {
    const arg = await proxify(argument, ctx)

    // If this is $route, then we don't actually resolve it here.
    // The function is only invoked when the route is fully realized.
    if (handler === ROUTE) {
        return {
            $route: arg
        }
    }

    const proxifyFunc = (obj) => proxify(obj, ctx)
    const api = {
        getComparisonProp() {
            return ctx.proxy[ctx.rootProp]
        },
        async calculateCost(obj) {},
        sortNodesByCost(arr) {
            return sortNodes(arr, ctx)
        },
        root: ctx.proxy,
        proxify: proxifyFunc,
        realize(obj) {
            return realize(obj)
        },
    }
    api.getRef = (str) => getRef(str, api)

    let result = await handler(arg, api)

    if (result !== null && typeof result === "object" && result[PROXY_CONTEXT]) {
        result = await resolve(result[RAW_VALUE], ctx)
    }

    return await resolve(result, ctx)
}

async function* iterate(target, ctx) {
    const resolved = await resolve(target, ctx)

    if (typeof resolved === "object" && (resolved[Symbol.iterator] || resolved[Symbol.asyncIterator])) {
        for (const value of resolved) {
            yield await proxify(value, ctx)
        }
    }
}

async function iterateRaw(target, ctx) {
    const resolved = await resolve(target, ctx)

    if (typeof resolved === "object" && (resolved[Symbol.iterator] || resolved[Symbol.asyncIterator])) {
        return resolved
    }
}

async function getAsync(target, ctx) {
    const resolved = await resolve(target, ctx)

    const handler = getHandlerAndArgument(resolved, ctx.handlers)
    // Normal case; we just get the given property
    if (handler?.handler !== ROUTE) {
        return resolved?.[ctx.prop]
    }

    // Special case: if we're getting something from a route, then we add the property to the path.
    const arg = await handler.argument[RAW_VALUE]

    if (typeof arg === "function") {
        return {
            $route: {
                fn: arg,
                path: [ctx.prop]
            }
          }
    } else {
        const previousPath = arg.path
        return {
            $route: {
                fn: arg.fn,
                path: [...previousPath, ctx.prop]
            }
        }
    }
}

async function realizeInternal(value, ctx) {
    value = await resolve(value, ctx)
    const type = typeof value
    if (value === null || (type !== "object" && type !== "function")) {
        return value
    }

    if (value instanceof RegExp) {
        return value
    }

    const result = Array.isArray(value) ? [] : {}

    // Special case. If we've got a route, then we want to call its function and pass the given route.
    if (value.$route && Object.keys(value).length === 1) {
        const route = await value.$route[RAW_VALUE]

        // If we've never accessed a property off of the route, then we're just accessing the route path.
        const result = typeof route === "function"
            ? await realizeInternal(await route([]), ctx)
            : await realizeInternal(await route.fn(route.path), ctx)

        return result
    }

    for (const [k, v] of Object.entries(value)) {
        const resolved = await v
        result[k] = await realizeInternal(resolved, ctx)
    }

    return result
}
