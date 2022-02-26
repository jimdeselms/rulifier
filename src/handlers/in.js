import { TRUE, FALSE } from "../symbols"
import { evaluate } from ".."

export async function $in(obj, { getComparisonProp }) {
    const lhs = await evaluate(getComparisonProp())

    for await (const entry of obj) {
        if ((await evaluate(entry)) === lhs) {
            return TRUE
        }
    }

    return FALSE
}
