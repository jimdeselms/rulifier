import { PROXY_CONTEXT, RAW_VALUE } from "./symbols"

let materializeInternal, resolve, proxify, rulify

// In order to avoid a circular reference, we'll have the proxify module initialize these.
export function initInternalFunctions(funcs) {
    materializeInternal = funcs.materializeInternal
    resolve = funcs.resolve
    proxify = funcs.proxify
    rulify = funcs.rulify
}

export async function materialize(obj, visited = []) {
    const ctx = getProxyContext(obj)
    return ctx ? await materializeInternal(obj[RAW_VALUE], ctx, visited) : obj
}

export async function getTypeof(obj) {
    const resolved = await resolveSafe(obj)
    return typeof resolved
}

export async function getKeys(obj) {
    const resolved = await resolveSafe(obj)

    if (typeof resolved !== "object") {
        return undefined
    } else {
        return Object.keys(resolved)
    }
}

export async function getLength(obj) {
    const resolved = await resolveSafe(obj)

    if (typeof resolved !== "object" || !Array.isArray(resolved)) {
        return undefined
    } else {
        return resolved.length
    }
}

export async function resolveSafe(obj) {
    const ctx = getProxyContext(obj)
    return ctx ? await resolve(obj[RAW_VALUE], ctx) : obj
}

export async function applyNewContext(expr, context) {
    const ctx = getProxyContext(expr)

    const o = rulify([ctx.proxy[RAW_VALUE], await context[RAW_VALUE]], ctx.costOptions)

    const newVal = proxify(await expr[RAW_VALUE], await o[PROXY_CONTEXT])

    return newVal
}

function getProxyContext(obj) {
    return obj !== null && (typeof obj === "object" || typeof obj === "function") && obj[PROXY_CONTEXT]
}
