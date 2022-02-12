const { builtinDirectives } = require('./builtinDirectives')

/**
 * @param  {...Record<any, any>} contexts 
 * @returns {any}
 */
function rulify(...contexts) {
    const root = {}
    const directives = Object.assign({}, builtinDirectives)

    for (const context of contexts) {
        Object.assign(root, context)
        Object.assign(directives, normalizeDirectives(context.$directives))
    }

    delete root.$directives

    return proxify(root, directives)
}

function normalizeDirectives(directives) {
    if (!directives) {
        return undefined
    }

    const entries = Object.entries(directives).map(([k, v]) => [k[0] === "$" ? k : "$" + k, v])

    return Object.fromEntries(entries)
}

function proxify(context, directives, root, prop) {
    if (typeof context === "function") {
        context = context()
    }

    if (context === null || typeof context !== "object") {
        return context
    }

    const resolved = {}

    const keys = Object.keys(context)
    let key, directive

    if (keys.length === 1 && (key = keys[0]) && (directive = directives?.[key])) {
        const directiveArgument = proxify(context[key], directives, root, prop)

        return proxify(directive(directiveArgument, { root, prop }), directives, root, prop)
    }

    const handler = {}

    const proxy = new Proxy(context, handler)

    if (root === undefined) {
        root = proxy
    }

    handler.get = function (target, prop) {
        if (Object.getOwnPropertyDescriptor(resolved, prop)) {
            return resolved[prop]
        }

        // Is this a promise?
        const then = target?.then
        if (typeof then === "function") {
            if (prop === "then") {
                return then.bind(target)
            } else {
                return proxify(
                    then.bind(target)((data) => {
                        const value = data[prop]
                        return proxify(value, directives, root, prop)
                    }),
                    directives,
                    root,
                    prop
                )
            }
        }

        if (prop === Symbol.iterator) {
            return target[Symbol.iterator]
        }

        const result = proxify(target[prop], directives, root, prop)
        resolved[prop] = result

        return result
    }

    return proxy
}

module.exports = {
    buildResponse: rulify,
}
