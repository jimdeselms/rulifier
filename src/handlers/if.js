const { COST } = require("../symbols")

async function $if(obj, api) {
    const condition = await api.materialize(obj.condition)
    return condition ? obj.then : obj.else
}

$if[COST] = function ifCost(value, calculateCost) {
    // Only one of these will be evaluated, so we'll average the cost of the then and else
    // (We could get fancier and have the ability to specify the probability that the "then" condition)
    // will be executed, but we don't have to worry about that now.
    return calculateCost(value.condition) + (calculateCost(value.then) + calculateCost(value.else)) / 2
}

module.exports = { $if }
