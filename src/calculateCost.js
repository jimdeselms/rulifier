import { COST } from "./symbols"
import { getHandlerAndArgument } from "./getHandlerAndArgument"

const DEFAULT_NODE_COST = 2

// This is a helper for handlers that have to calculate the cost of unknown things.
// We'll assume that these things are kind of expensive.
export const DEFAULT_UNKNOWN_COST = 10

export const calculateCost = function calculateCost(rawValue, ctx, depth = 0) {
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

    // Don't go too deep.
    if (depth >= ctx.costOptions.maxDepth) {
        return DEFAULT_NODE_COST
    }

    // If this is a function, get its cost or return the default.
    if (type === "function") {
        const fnCost = rawValue[COST]
        return fnCost ?? 1
    }

    // If this is a handler, then we'll try to calculate the cost of the handler
    // if it has a cost function. Otherwise we'll return the default.
    const handlerAndArg = getHandlerAndArgument(rawValue, ctx.handlers)

    if (handlerAndArg) {
        const cost = handlerAndArg.handler[COST]
        let baseCost = 1
        if (cost) {
            baseCost = typeof cost === "function" ? cost(handlerAndArg.argument) : cost
        }

        debugger

        return baseCost + calculateCost(handlerAndArg.argument, ctx, depth + 1)
    }

    // We'll calculate the cost of each of the values in the object,
    // but we'll limit this so that the act of calculating the cost
    // doesn't take too much time.
    //
    // TODO - make these limits configurable
    const values = Object.values(rawValue)
    const iterations = Math.min(values.length, ctx.costOptions.maxBreadth)

    // Each node that we traverse starts with a value of 1.
    let totalCost = values.length

    for (let i = 0; i < iterations; i++) {
        totalCost += calculateCost(values[i], ctx, depth + 1)
    }
    return totalCost
}
