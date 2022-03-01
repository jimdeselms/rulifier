import { COST } from "./symbols"
import { getHandlerAndArgument } from "./getHandlerAndArgument"

const DEFAULT_HANDLER_COST = 10
const DEFAULT_NODE_COST = 2

export function calculateCost(rawValue, ctx) {
    const type = typeof rawValue

    // Primitive types are essentially free
    if (rawValue === null || (type !== "object" && type !== "function")) {
        return 0
    }

    // If this value is already being resolved, then it's almost free.
    // It might not be instantaneous, but it's already being awaited somewhere
    // else, so it's at least it won't an extra thing that has to be executed
    if (ctx.resolvedValueCache.has(rawValue)) {
        return 1
    }

    // If this is a handler, then we'll try to calculate the cost of the handler
    // if it has a cost function. Otherwise we'll return the default.
    const handlerAndArg = getHandlerAndArgument(rawValue, ctx.handlers)
    const calculateCostFn = (rawValue) => calculateCost(rawValue, ctx)

    if (handlerAndArg) {
        return handlerAndArg.handler[COST]?.(handlerAndArg.argument, calculateCostFn) ?? DEFAULT_HANDLER_COST
    }

    // This is just a boring node; we'll return a default value.
    // TODO - do we want to traverse the node to calculate its cost?
    // We could set a maximum number of nodes to visit to limit complexity.
    return DEFAULT_NODE_COST
}
