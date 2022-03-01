import { COST } from "./symbols"
import { getHandlerAndArgument } from "./getHandlerAndArgument"

const DEFAULT_HANDLER_COST = 10
const DEFAULT_NODE_COST = 1

export function calculateCost(rawValue, ctx) {
    const type = typeof rawValue

    // Primitive types are essentially free
    if (rawValue === null || (type !== "object" && type !== "function")) {
        return 0
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
