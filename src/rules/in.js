import { TRUE, FALSE } from "../symbols"

export async function $in(obj, api) {
    const lhs = await api.materialize(api.getComparisonProp())

    for await (const entry of obj) {
        if ((await api.materialize(entry)) === lhs) {
            return TRUE
        }
    }

    return FALSE
}
