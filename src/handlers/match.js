import { COST } from "../symbols"
import { eq } from "./eq"
import { DEFAULT_UNKNOWN_COST } from "../calculateCost"

export async function $match(obj, api) {
    if ((await api.getLength(obj)) === 2) {
        return await eq(obj[0], obj[1], true, false)
    } else {
        // When evaluating relative to the root object, the root is the
        // left hand side.
        return await eq(api.root, obj, true, true)
    }
}

$match[COST] = function matchCost(value, calculateCost) {
    if (value?.length === 2) {
        return calculateCost(value[0]) + calculateCost(value[1])
    } else {
        return calculateClost(value) + DEFAULT_UNKNOWN_COST
    }
}
