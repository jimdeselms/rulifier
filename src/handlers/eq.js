import { evaluate, getTypeof, getKeys } from ".."
import { ROOT_CONTEXT_TRUE, GET_WITH_NEW_ROOT, RAW_VALUE } from "../common"

export async function $eq(obj, ctx) {
    if (await evaluate(obj.length) === 2) {
        return await eq(obj[0], obj[1], false, false)
    } else {
        return await eq(obj, await ctx.root, false, true)
    }
}

export async function eq(item1, item2, match, useRootDataSource) {
    debugger 

    const i1 = await item1
    const i2 = await item2

    if (i1 === i2) {
        return true
    }

    const i1Type = await getTypeof(i1)
    const i2Type = await getTypeof(i2)

    if (i1Type !== i2Type) {
        return false
    }

    if (i1Type === "symbol") {
        const i1Val = await evaluate(i1)
        const i2Val = await evaluate(i2)

        if (i1Val === i2Val || i1Val === ROOT_CONTEXT_TRUE) {
            return true
        }
    } else if (i1Type === "function") {
        return false
    }

    if (i1Type === "object") {
        const i1Keys = await getKeys(i1)
        const i2Keys = await getKeys(i2)

        if (i1Keys.length !== i2Keys.length) {
            return false
        }

        for (const key of i1Keys) {
            if (!await eq(i1[key], i2[key], match, useRootDataSource)) {
                return false
            }
        }

        return true
        
    } else {
        const i1Val = await evaluate(i1)
        const i2Val = await evaluate(i2)

        return i1Val === i2Val
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
        const val1 = useRootDataSource ? i1[GET_WITH_NEW_ROOT](i2, prop) : i1[prop]
        const val2 = i2[prop]

        if (!(await eq(val1, val2, match, useRootDataSource))) {
            return false
        }
    }

    return true
}
