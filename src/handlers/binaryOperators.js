const { TRUE, FALSE, COST } = require("../symbols")
const { DEFAULT_UNKNOWN_COST } = require("../calculateCost")
const { materialize } = require("../methods")

const $lt = (obj, opt) => evaluateBinary(obj, opt, (x, y) => x < y)
const $lte = (obj, opt) => evaluateBinary(obj, opt, (x, y) => x <= y)
const $gt = (obj, opt) => evaluateBinary(obj, opt, (x, y) => x > y)
const $gte = (obj, opt) => evaluateBinary(obj, opt, (x, y) => x >= y)
const $ne = (obj, opt) => evaluateBinary(obj, opt, (x, y) => x !== y)

const $regex = (obj, opt) =>
    evaluateBinary(obj, opt, (x, y) => {
        if (typeof y === "string") {
            return new RegExp(y).test(x)
        } else {
            return new RegExp(y.pattern, y.flags).test(x)
        }
    })

async function evaluateBinary(obj, api, predicate) {
    obj = await materialize(obj)

    if (Array.isArray(obj)) {
        // We're not in the root data source; just compare the two things in the array.
        return predicate(obj[0], obj[1])
    } else {
        const lhs = await materialize(api.getComparisonProp())

        // In the root data source, we compare against a property of the root.
        const result = predicate(lhs, obj)
        return result ? TRUE : FALSE
    }
}

function binaryOperatorCost(value, calculateCost) {
    if (Array.isArray(value)) {
        return calculateCost(value[0]) + calculateCost(value[1])
    } else {
        return calculateCost(value) + DEFAULT_UNKNOWN_COST
    }
}

$lt[COST] = binaryOperatorCost
$lte[COST] = binaryOperatorCost
$gt[COST] = binaryOperatorCost
$gte[COST] = binaryOperatorCost
$ne[COST] = binaryOperatorCost
$regex[COST] = binaryOperatorCost

module.exports = {
    $lt,
    $lte,
    $gt,
    $gte,
    $ne,
    $regex,
}
