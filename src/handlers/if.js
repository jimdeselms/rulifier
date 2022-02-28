import { COST } from "../symbols"

export async function $if(obj, api) {
    const condition = await api.evaluate(obj.condition)
    return condition ? obj.then : obj.else
}

$if[COST] = function ifCost(value) {
    return
}
