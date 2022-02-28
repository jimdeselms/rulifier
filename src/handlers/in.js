import { TRUE, FALSE } from "../symbols"

export async function $in(obj, api) {
    const lhs = await api.realize(api.getComparisonProp())

    for await (const entry of obj) {
        if ((await api.realize(entry)) === lhs) {
            return TRUE
        }
    }

    return FALSE
}
