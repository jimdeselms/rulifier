import { COST, PROXY_CONTEXT } from "./symbols"
import { getHandlerAndArgument } from "./getHandlerAndArgument"

const DEFAULT_FUNCTION_COST = 10
const DEFAULT_HANDLER_COST = 10
const DEFAULT_NODE_COST = 1

export async function calculateCost(obj, ctx) {

    // We want to make sure that we've got the raw values.
    const rawValue = obj[PROXY_CONTEXT]
        ? (await obj)[RAW_VALUE]
        : obj

    const type = typeof rawValue

    // Primitive types are essentially free
    if (rawValue === null || (type !== "object" && type !== "function")) {
        return 0
    }

    // Already in the cache? It's also a freebie.
    if (ctx.resolvedValueCache.has(rawValue)) {
        return 0
    }

    // Try to get the cost off of the function; otherwise get the default.
    if (typeof rawValue === "function") {
        return rawValue[COST]?.() ?? DEFAULT_FUNCTION_COST
    }

    // If this is a handler, then we'll try to calculate the cost of the handler
    // if it has a cost function. Otherwise we'll return the default.
    const handlerAndArg = getHandlerAndArgument(rawValue, ctx.handlers)
    if (handlerAndArg) {
        return handlerAndArg.handler[COST]?.(handlerAndArg.argument) ?? DEFAULT_HANDLER_COST
    }

    // This is just a boring node; we'll return a default value.
    // (Q: Should we traverse it or is that a waste?)
    return DEFAULT_NODE_COST
}
