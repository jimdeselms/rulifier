import { COST } from "./symbols"
import { getRuleAndArgument } from "./getRuleAndArgument"

// This is a helper for rules that have to calculate the cost of unknown things.
// We'll assume that these things are kind of expensive.
export const DEFAULT_UNKNOWN_COST = 10

export const calculateCost = function calculateCost(rawValue, ctx, depth = 0, visited = 0) {
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
    if (depth >= ctx.costOptions.maxDepth || visited >= ctx.costOptions.maxNodes) {
        return 1
    }

    // If this is a function, get its cost or return the default.
    if (type === "function") {
        const fnCost = rawValue[COST]
        return fnCost ?? 1
    }

    // If this is a rule, then we'll try to calculate the cost of the rule
    // if it has a cost function. Otherwise we'll return the default.
    const handlerAndArg = getRuleAndArgument(rawValue, ctx.rules)

    if (handlerAndArg) {
        const cost = handlerAndArg.rule[COST]
        let baseCost = 1
        if (cost) {
            baseCost = typeof cost === "function" ? cost(handlerAndArg.argument) : cost
        }

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
        visited++
        totalCost += calculateCost(values[i], ctx, depth + 1, visited)
    }
    return totalCost
}
