import { COST } from "../symbols"
import { DEFAULT_UNKNOWN_COST } from "../calculateCost"

export async function $ref(obj, api) {
    return api.getRef(await api.materialize(obj))
}

// we can't know the cost of a reference.
$ref[COST] = DEFAULT_UNKNOWN_COST
 