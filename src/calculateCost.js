import { RAW_VALUE, COST, CALCULATE_COST } from './common'

const DEFAULT_FUNCTION_COST = 10
const DEFAULT_NODE_COST = 1

export function calculateCost(proxy, property=undefined) {
    const rawValue = proxy[RAW_VALUE]

    if (typeof rawValue === "function") {
        return rawValue[COST] ?? rawValue[CALCULATE_COST]?.() ?? DEFAULT_FUNCTION_COST
    }

    return DEFAULT_NODE_COST
}