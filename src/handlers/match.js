import { evaluate } from ".."
import { eq } from "./eq"

export async function $match(obj, { root }) {
    
    if (await evaluate(obj.length) === 2) {
        return eq(obj[0], obj[1], true, false)
    } else {
        return eq(obj, root, true, true)
    }
}
