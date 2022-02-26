import { ROOT_CONTEXT_TRUE, ROOT_CONTEXT_FALSE } from "../common"
import { evaluate } from ".."

export async function $in(obj, { getComparisonProp }) {
    const lhs = await evaluate(getComparisonProp())

    for await (const entry of obj) {
        if ((await evaluate(entry)) === lhs) {
            return ROOT_CONTEXT_TRUE
        }
    }

    return ROOT_CONTEXT_FALSE
}
