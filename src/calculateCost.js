import { COST } from "./symbols"
import { getHandlerAndArgument } from "./getHandlerAndArgument"

const DEFAULT_HANDLER_COST = 10
const DEFAULT_FUNCTION_COST = 10
const DEFAULT_NODE_COST = 2

const MAX_BREADTH_PER_NODE = 25
const MAX_DEPTH = 3

export function calculateCost(rawValue, ctx, depth = 0) {
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

    // If this is a function, call its cost function if it has one.
    const calculateCostFn = (rawValue) => calculateCost(rawValue, ctx)
    if (type === "function") {
        return rawValue[COST]?.(undefined, calculateCostFn) ?? DEFAULT_FUNCTION_COST
    }

    // If this is a handler, then we'll try to calculate the cost of the handler
    // if it has a cost function. Otherwise we'll return the default.
    const handlerAndArg = getHandlerAndArgument(rawValue, ctx.handlers)

    if (handlerAndArg) {
        return handlerAndArg.handler[COST]?.(handlerAndArg.argument, calculateCostFn) ?? DEFAULT_HANDLER_COST
    }

    // Don't go too deep.
    if (depth >= MAX_DEPTH) {
        return DEFAULT_NODE_COST
    }

    // We'll calculate the cost of each of the values in the object,
    // but we'll limit this so that the act of calculating the cost
    // doesn't take too much time.
    //
    // TODO - make these limits configurable
    const values = Object.values(rawValue)
    const iterations = Math.min(values.length, MAX_BREADTH_PER_NODE)

    let totalCost = 0

    for (let i = 0; i < iterations; i++) {
        totalCost += calculateCost(values[i], ctx, depth + 1)
    }
    return totalCost
}
