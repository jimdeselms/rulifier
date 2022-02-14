//const { builtinDirectives } = require("./builtinDirectives")

import { builtinDirectives } from "./builtinDirectives"

const RAW_VALUE = Symbol.for("__RAW_VALUE")
const IS_RULIFIED = Symbol.for("__IS_RULIFIED")
const GET_WITH_NEW_ROOT = Symbol.for("__GET_WITH_NEW_ROOT")

/**
 * @param  {...Record<any, any>} contexts
 * @returns {any}
 */
export function rulify(...contexts) {
    const root = {}
    let directives = {}

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
        Object.assign(directives, normalizeDirectives(context.$directives))
    }

    delete root.$directives

    // If none of the contexts are already "rulified", then that means
    // we have to add in the builtin directives.
    if (!alreadyRulified) {
        directives = Object.assign({}, builtinDirectives, directives)
    }

    return proxify(root, directives, undefined, undefined, caches)
}

function normalizeDirectives(directives) {
    if (!directives) {
        return undefined
    }

    const entries = Object.entries(directives).map(([k, v]) => [k[0] === "$" ? k : "$" + k, v])

    return Object.fromEntries(entries)
}

function proxify(context, directives, root, prop, caches) {
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
    let key, directive

    if (keys.length === 1 && (key = keys[0]) && (directive = directives?.[key])) {
        const directiveArgument = proxify(context[key], directives, root, prop, caches)

        return proxify(directive(directiveArgument, { root, prop }), directives, root, prop, caches)
    }

    const handler = {}

    const proxy = new Proxy(context, handler)
    caches.proxyCache.set(context, proxy)

    // If the context was a function, then the value of that function should also be cached.
    if (context !== originalContext) {
        caches.proxyCache.set(originalContext, proxy)
    }

    if (root === undefined) {
        root = proxy
    }

    handler.get = function (target, prop) {
        return get(target, proxy, prop, root, directives, caches)
    }

    return proxy
}

function get(target, proxy, prop, root, directives, caches) {
    // Handle these special properties first. Switch is faster than an if-else chain.
    switch (prop) {
        case RAW_VALUE:
            return target
        case IS_RULIFIED:
            return true
        case GET_WITH_NEW_ROOT:
            return (newRoot, newProp) => get(target, proxy, newProp, newRoot, directives, caches)
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
                    return proxify(value, directives, root, prop, caches)
                }),
                directives,
                root,
                prop,
                caches
            )
        }
    } else {
        result = proxify(target[prop], directives, root, prop, caches)
    }

    resolvedValues.set(prop, result)

    return result
}

