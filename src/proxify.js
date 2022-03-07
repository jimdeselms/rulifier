import { GET_WITH_NEW_ROOT, RAW_VALUE, PROXY_CONTEXT, ROUTE, ITERATE_RAW } from "./symbols"
import { getHandlerAndArgument } from "./getHandlerAndArgument"
import { HandlerApi } from "./handlerApi"
import { resolveSafe } from "./methods"

export function proxify(value, ctx) {
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
        ctx = { ...ctx, proxy, comparisonProxy: proxy }
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
                get(target, newProp, { ...ctx, prop: newProp, rootProp: newProp, comparisonProxy: newRoot })
        case Symbol.asyncIterator:
            return () => iterate(target, ctx)
        case ITERATE_RAW:
            return () => iterateRaw(target, ctx)
    }

    ctx = { ...ctx, prop }
    return proxify(getAsync(target, ctx), ctx)
}

export async function resolve(target, ctx, visited = []) {
    if (target?.[PROXY_CONTEXT]) {
        // If the thing we're resolving is itself a proxy, then use its
        // own context, and get its raw value as the target.
        ctx = target[PROXY_CONTEXT]
        target = target[RAW_VALUE]
    }

    let value = await target
    if (visited.includes(value)) {
        throw new Error("Cycle detected")
    }

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
                const resolvedValuePromise = resolveHandler(h, ctx, [...visited, value])

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

async function resolveHandler({ handler, argument }, ctx, visited) {
    const arg = await proxify(argument, ctx)

    // If this is $route, then we don't actually resolve it here.
    // The function is only invoked when the route is fully materialized.
    if (handler === ROUTE) {
        return {
            $route: arg,
        }
    }

    let result = await handler(arg, new HandlerApi(ctx, visited))

    if (result !== null && typeof result === "object" && result[PROXY_CONTEXT]) {
        result = await resolve(result[RAW_VALUE], result[PROXY_CONTEXT], visited)
    }

    return await resolve(result, ctx, visited)
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

    if (resolved === undefined || resolved === null) {
        return []
    }

    if (typeof resolved === "object" && (resolved[Symbol.iterator] || resolved[Symbol.asyncIterator])) {
        return resolved
    }

    return undefined
}

async function getAsync(target, ctx) {
    const resolved = await resolve(target, ctx)

    const handler = getHandlerAndArgument(resolved, ctx.handlers)
    // Normal case; we just get the given property
    if (handler?.handler !== ROUTE) {
        const result = resolved?.[ctx.prop]
        return await resolveSafe(result)
    }

    // Special case: if we're getting something from a route, then we add the property to the path.
    const arg = await handler.argument[RAW_VALUE]

    if (typeof arg === "function") {
        return {
            $route: {
                fn: arg,
                path: [ctx.prop],
            },
        }
    } else {
        const previousPath = arg.path
        return {
            $route: {
                fn: arg.fn,
                path: [...previousPath, ctx.prop],
            },
        }
    }
}

export async function materializeInternal(value, ctx, visited) {
    value = await resolve(value, ctx, visited)

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
        const result =
            typeof route === "function"
                ? await materializeInternal(await route([]), ctx, [...visited, value])
                : await materializeInternal(await route.fn(route.path), ctx, [...visited, value])

        return result
    }

    for (const [k, v] of Object.entries(value)) {
        result[k] = await materializeInternal(await v, ctx, [...visited, value])
    }

    return result
}
