import { RAW_VALUE, COST } from './common'

const DEFAULT_FUNCTION_COST = 10
const DEFAULT_NODE_COST = 1

export function calculateCost(proxy) {
    const rawValue = proxy[RAW_VALUE]

    if (typeof rawValue === "function") {
        return rawValue[COST] ?? DEFAULT_FUNCTION_COST
    }

    return DEFAULT_NODE_COST
}