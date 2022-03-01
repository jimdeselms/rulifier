import { realize, getTypeof, getKeys } from ".."
import { TRUE, FALSE, GET_WITH_NEW_ROOT } from "../symbols"

export async function $eq(obj, ctx) {
    if ((await realize(obj.length)) === 2) {
        return await eq(obj[0], obj[1], false, false)
    } else {
        return await eq(await ctx.root, obj, false, true)
    }
}

export async function eq(item1, item2, match, useRootDataSource) {
    const i1 = await item1
    const i2 = await item2

    if (i1 === i2) {
        return true
    }

    const i2Type = await getTypeof(i2)
    if (i2Type === "symbol") {
        const i2Val = await realize(i2)
        if (i2Val === TRUE) {
            return true
        } else if (i2Val === FALSE) {
            return false
        }
    }

    const i1Type = await getTypeof(i1)

    if (i1Type === "string" && match && i2Type === "object") {
        const i1Val = await realize(i1)
        const i2Val = await realize(i2)
        if (i2Val instanceof RegExp) {
            return i2Val.test(i1Val) ? TRUE : FALSE
        }
    }

    if (i1Type !== i2Type) {
        return false
    }

    if (i1Type === "function") {
        return false
    }

    if (i1Type === "object") {
        const i1Keys = await getKeys(i1)
        const i2Keys = await getKeys(i2)

        if (!useRootDataSource && i1Keys.length !== i2Keys.length) {
            return false
        }

        // TODO: We should figure out how to sort these based on cost
        for (const key of i2Keys) {
            const val2 = useRootDataSource ? await i2[GET_WITH_NEW_ROOT](i1, key) : i2[key]

            const result = await eq(i1[key], val2, match, useRootDataSource)
            if (result === false || result === FALSE) {
                return false
            }
        }

        return true
    } else {
        const i1Val = await realize(i1)
        const i2Val = await realize(i2)

        return i1Val === i2Val
    }

    return "Hello"
}
