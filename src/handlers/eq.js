import { ROOT_CONTEXT_TRUE, GET_WITH_NEW_ROOT, RAW_VALUE } from '../common'

export async function $eq([item1, item2]) {
    return eq(item1, item2, false)
}

export async function eq(item1, item2, match, useRootContext) {
    const i1 = await item1
    const i2 = await item2

    if (i1 === i2 || i1 === ROOT_CONTEXT_TRUE) {
        return true
    }

    // Are they at least the same type?
    if (i1 === null || i2 === null) {
        return false
    }

    if (typeof i2 === "string" && i1 instanceof RegExp) {
        return i1[RAW_VALUE].test(i2)
    }

    if (typeof i1 !== "object" || typeof i2 !== "object") {
        return false
    }

    const props = Object.keys(i1)
    if (!match) {
        if (props.length !== Object.keys(i2)) {
            return false
        }
    }

    // Now just make sure that every property of i1 matches i2.
    for (const prop of props) {
        // Since we might have handlers here that care about the root, we want to replace the root, so let's use the
        // "GET_WITH_NEW_ROOT" function
        const val1 = useRootContext ? i1[GET_WITH_NEW_ROOT](i2, prop) : i1[prop]
        const val2 = i2[prop]

        if (!(await eq(val1, val2, match, useRootContext))) {
            return false
        }
    }

    return true
}
