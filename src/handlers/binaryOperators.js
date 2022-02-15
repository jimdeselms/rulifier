import { ROOT_CONTEXT_TRUE, ROOT_CONTEXT_FALSE } from "../common"

export const $lt = (obj, opt) => evaluateBinary(obj, opt, (x, y) => x < y)
export const $lte = (obj, opt) => evaluateBinary(obj, opt, (x, y) => x <= y)
export const $gt = (obj, opt) => evaluateBinary(obj, opt, (x, y) => x > y)
export const $gte = (obj, opt) => evaluateBinary(obj, opt, (x, y) => x >= y)
export const $ne = (obj, opt) => evaluateBinary(obj, opt, (x, y) => x !== y)

export const $regex = (obj, opt) =>
    evaluateBinary(obj, opt, async (x, y) => {
        if (typeof y === "string") {
            return new RegExp(y).test(x)
        } else {
            return new RegExp(y.pattern, y.flags).test(x)
        }
    })

async function evaluateBinary(obj, { root, prop }, predicate) {
    obj = await obj

    if (Array.isArray(obj)) {
        // We're not in the root context; just compare the two things in the array.
        return predicate(await obj[0], await obj[1])
    } else {
        // In the root context, we compare against a property of the root.
        return (await predicate(await root[prop], await obj)) ? ROOT_CONTEXT_TRUE : ROOT_CONTEXT_FALSE
    }
}
