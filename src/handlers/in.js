import { TRUE, FALSE } from "../symbols"

export async function $in(obj, api) {
    const lhs = await api.evaluate(api.getComparisonProp())

    for await (const entry of obj) {
        if ((await api.evaluate(entry)) === lhs) {
            return TRUE
        }
    }

    return FALSE
}
