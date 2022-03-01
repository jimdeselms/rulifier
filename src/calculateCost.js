import { COST } from "./symbols"
import { getHandlerAndArgument } from "./getHandlerAndArgument"

const DEFAULT_HANDLER_COST = 10
const DEFAULT_FUNCTION_COST = 10

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

    // Go through each of the values and sum up its cost
    // TODO:
    // * Make sure we don't blow up on cycles
    // * Limit this so that if the object is very big, we don't take too long.
    return Object.values(rawValue).reduce((prev, curr) => prev + calculateCost(curr, ctx), 0)
}
