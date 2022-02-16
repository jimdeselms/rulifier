import { ROOT_CONTEXT_TRUE, ROOT_CONTEXT_FALSE } from "../common"

export async function $in(obj, { root, prop }) {
    const lhs = await root[prop]

    for (const entry of await obj) {
        if ((await entry) === lhs) {
            return ROOT_CONTEXT_TRUE
        }
    }

    return ROOT_CONTEXT_FALSE
}
