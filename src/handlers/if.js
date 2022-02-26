import { evaluate } from ".."
import { COST } from "../common"

export async function $if(obj) {
    const condition = await evaluate(obj.condition)
    return condition ? await obj.then : await evaluate(obj.else)
}

$if[COST] = function ifCost(value) {
    return
}
