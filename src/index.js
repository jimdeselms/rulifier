//const { builtinHandlers } = require("./builtinHandlers")

import { builtinHandlers } from "./builtinHandlers"

const RAW_VALUE = Symbol.for("__RAW_VALUE")
const IS_RULIFIED = Symbol.for("__IS_RULIFIED")
const GET_WITH_NEW_ROOT = Symbol.for("__GET_WITH_NEW_ROOT")

/**
 * @param  {...Record<any, any>} contexts
 * @returns {any}
 */
export function rulify(...contexts) {
    const root = {}
    let handlers = {}

    let alreadyRulified = false

    // The caches use weak maps so that they won't cause memory leaks
    // when the proxies or resolved values go out of scope.
    const caches = {
        proxyCache: new WeakMap(),
        resolvedValueCache: new WeakMap(),
    }

    for (let context of contexts) {
        if (context[IS_RULIFIED]) {
            // If the thing is "already rulfied", then we want to grab the
            // raw value and re-proxify it.
            context = context[RAW_VALUE]
            alreadyRulified = true
        }
        Object.assign(root, context)
        Object.assign(handlers, normalizeHandlers(context.$handlers))
    }

    delete root.$handlers

    // If none of the contexts are already "rulified", then that means
    // we have to add in the builtin handlers.
    if (!alreadyRulified) {
        handlers = Object.assign({}, builtinHandlers, handlers)
    }

    return proxify(root, handlers, undefined, undefined, caches)
}

function normalizeHandlers(handlers) {
    if (!handlers) {
        return undefined
    }

    const entries = Object.entries(handlers).map(([k, v]) => [k[0] === "$" ? k : "$" + k, v])

    return Object.fromEntries(entries)
}

function proxify(context, handlers, root, prop, caches) {
    const originalContext = context

    if (caches.proxyCache.has(context)) {
        return caches.proxyCache.get(context)
    }

    if (typeof context === "function") {
        context = context()
    }

    if (context === null || typeof context !== "object") {
        return context
    }

    const keys = Object.keys(context)
    let key, handler

    if (keys.length === 1 && (key = keys[0]) && (handler = handlers?.[key])) {
        const handlerArgument = proxify(context[key], handlers, root, prop, caches)

        return proxify(handler(handlerArgument, { root, prop }), handlers, root, prop, caches)
    }

    const proxyHandler = {}

    const proxy = new Proxy(context, proxyHandler)
    caches.proxyCache.set(context, proxy)

    // If the context was a function, then the value of that function should also be cached.
    if (context !== originalContext) {
        caches.proxyCache.set(originalContext, proxy)
    }

    if (root === undefined) {
        root = proxy
    }

    proxyHandler.get = function (target, prop) {
        return get(target, proxy, prop, root, handlers, caches)
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
        case Symbol.iterator:
            return target[Symbol.iterator]
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
