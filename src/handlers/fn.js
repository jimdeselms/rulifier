import { COST } from "../symbols"

export async function $fn(obj, api) {
    const value = (await api.getRawValue(obj))()
    return value
}

$fn[COST] = function fnCost(value, calculateCost) {
    return calculateCost(value, calculateCost)
}
