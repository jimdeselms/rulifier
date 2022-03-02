export { rulify } from "./rulify"
import { materializeInternal, resolve } from "./proxify"
import { PROXY_CONTEXT, RAW_VALUE } from "./symbols"

/**
 * Given a rulified object, converts it into a fully materialized object.
 */
export async function materialize(obj) {
    const ctx = getProxyContext(obj)
    return ctx ? await materializeInternal(obj[RAW_VALUE], ctx) : obj
}

/**
 * Returns the basic Javascript type of the object
 * @param {any} obj
 * @returns {string}
 */
export async function getTypeof(obj) {
    const resolved = await resolveSafe(obj)
    return typeof resolved
}

/**
 * Returns the set of keys for the given object
 * @param {any} obj
 * @returns {string[]}
 */
export async function getKeys(obj) {
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
 * @returns {string[]}
 */
export async function getLength(obj) {
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
