const { builtinDirectives } = require('./builtinDirectives')

const RAW_VALUE = Symbol.for("__RAW_VALUE")
const IS_RULIFIED = Symbol.for("__IS_RULIFIED")
const GET_WITH_NEW_ROOT = Symbol.for("__GET_WITH_NEW_ROOT")

/**
 * @param  {...Record<any, any>} contexts 
 * @returns {any}
 */
function rulify(...contexts) {
    const root = {}
    let directives = {}

    let alreadyRulified = false

    for (const context of contexts) {
        if (context[IS_RULIFIED]) {
            alreadyRulified = true
        }
        Object.assign(root, context)
        Object.assign(directives, normalizeDirectives(context.$directives))
    }

    delete root.$directives

    if (!alreadyRulified) {
        directives = Object.assign({}, builtinDirectives, directives)
    }

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
        return get(target, prop, root, directives, resolved)
    }

    return proxy
}

function get(target, prop, root, directives, resolved) {
    if (prop === RAW_VALUE) {
        return target
    }

    if (prop === IS_RULIFIED) {
        return true
    }

    if (prop === GET_WITH_NEW_ROOT) {
        return (newRoot, newProp) => get(target, newProp, newRoot, directives, resolved)
    }

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

module.exports = {
    buildResponse: rulify,
}
