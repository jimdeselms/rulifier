import { COST } from "../symbols"
import { DEFAULT_UNKNOWN_COST } from "../calculateCost"

export async function $ref(obj, api) {
    return api.getRef(await api.materialize(obj))
}

$ref[COST] = function refCost(value, calculateCost) {
    return calculateCost(value, calculateCost) + DEFAULT_UNKNOWN_COST
}
