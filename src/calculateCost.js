import { COST } from "./symbols"

const DEFAULT_FUNCTION_COST = 10
const DEFAULT_HANDLER_COST = 10
const DEFAULT_NODE_COST = 1

export function calculateCost(rawValue, handlers, caches) {
    const type = typeof rawValue

    if (rawValue === null || (type !== "object" && type !== "function")) {
        return 0
    }

    if (typeof rawValue === "function") {
        return rawValue[COST]?.() ?? DEFAULT_FUNCTION_COST
    }

    const keys = Object.keys(rawValue)
    let key, handler

    if (keys.length === 1 && (key = keys[0]) && (handler = handlers?.[key])) {
        return handler[COST]?.(rawValue[key]) ?? DEFAULT_HANDLER_COST
    }

    return DEFAULT_NODE_COST
}
