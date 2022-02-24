import { evaluate } from ".."
import { eq } from "./eq"

export async function $match(obj, { root }) {
    if (await evaluate(obj.length) === 2) {
        return await eq(obj[0], obj[1], true, false)
    } else {
        // When evaluating relative to the root object, the root is the 
        // left hand side.
        return await eq(root, obj, true, true)
    }
}
