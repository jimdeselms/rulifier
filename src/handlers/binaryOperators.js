import { evaluate, getKeys } from ".."
import { ROOT_CONTEXT_TRUE, ROOT_CONTEXT_FALSE, MATERIALIZE_RAW } from "../common"

export const $lt = (obj, opt) => evaluateBinary(obj, opt, (x, y) => x < y)
export const $lte = (obj, opt) => evaluateBinary(obj, opt, (x, y) => x <= y)
export const $gt = (obj, opt) => evaluateBinary(obj, opt, (x, y) => x > y)
export const $gte = (obj, opt) => evaluateBinary(obj, opt, (x, y) => x >= y)
export const $ne = (obj, opt) => evaluateBinary(obj, opt, (x, y) => x !== y)

export const $regex = (obj, opt) =>
    evaluateBinary(obj, opt, (x, y) => {
        if (typeof y === "string") {
            return new RegExp(y).test(x)
        } else {
            return new RegExp(y.pattern, y.flags).test(x)
        }
    })

async function evaluateBinary(obj, { root, prop, rootProp }, predicate) {
    obj = await evaluate(obj)

    if (Array.isArray(obj)) {
        // We're not in the root data source; just compare the two things in the array.
        return predicate(obj[0], obj[1])
    } else {
        debugger 
        
        const keys = await getKeys(root)

        const lhs = await evaluate(root[rootProp])

        // In the root data source, we compare against a property of the root.
        const result = predicate(lhs, obj)
        return result ? ROOT_CONTEXT_TRUE : ROOT_CONTEXT_FALSE
    }
}
