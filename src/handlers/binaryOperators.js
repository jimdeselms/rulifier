import { realize, getKeys } from ".."
import { TRUE, FALSE } from "../symbols"

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

async function evaluateBinary(obj, api, predicate) {
    obj = await realize(obj)

    if (Array.isArray(obj)) {
        // We're not in the root data source; just compare the two things in the array.
        return predicate(obj[0], obj[1])
    } else {
        const lhs = await realize(api.getComparisonProp())

        // In the root data source, we compare against a property of the root.
        const result = predicate(lhs, obj)
        return result ? TRUE : FALSE
    }
}
