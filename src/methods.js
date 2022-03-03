const { PROXY_CONTEXT, RAW_VALUE } = require("./symbols")

let materializeInternal, resolve

// In order to avoid a circular reference, we'll have the proxify module initialize these.
module.exports.initInternalFunctions = function initInternalFunctions(funcs) {
    materializeInternal = funcs.materializeInternal
    resolve = funcs.resolve
}

/**
 * Given a rulified object, converts it into a fully materialized object.
 * @param {any}
 * @returns {any}
 */
module.exports.materialize = async function materialize(obj, visited = new Set()) {
    const ctx = getProxyContext(obj)
    return ctx ? await materializeInternal(obj[RAW_VALUE], ctx, visited) : obj
}

/**
 * Returns the basic Javascript type of the object
 * @param {any} obj
 * @returns {Promise<string>}
 */
module.exports.getTypeof = async function getTypeof(obj) {
    const resolved = await resolveSafe(obj)
    return typeof resolved
}

/**
 * Returns the set of keys for the given object, or undefined if the object isn't
 * a type that has keys
 * @param {any} obj
 * @returns {Promise<string[] | undefined>}
 */
module.exports.getKeys = async function getKeys(obj) {
    const resolved = await resolveSafe(obj)

    if (typeof resolved !== "object") {
        return undefined
    } else {
        return Object.keys(resolved)
    }
}

/**
 * Returns the length of an array, or undefined if the object is not an arary
 * @param {any} obj
 * @returns {Promise<string[] | undefined>}
 */
module.exports.getLength = async function getLength(obj) {
    const resolved = await resolveSafe(obj)

    if (typeof resolved !== "object" || !Array.isArray(resolved)) {
        return undefined
    } else {
        return resolved.length
    }
}

async function resolveSafe(obj) {
    const ctx = getProxyContext(obj)
    return ctx ? await resolve(obj[RAW_VALUE], ctx) : obj
}

function getProxyContext(obj) {
    return obj !== null && (typeof obj === "object" || typeof obj === "function") && obj[PROXY_CONTEXT]
}