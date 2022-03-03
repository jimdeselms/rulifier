const { COST } = require("../symbols")
const { DEFAULT_UNKNOWN_COST } = require("../calculateCost")

async function $ref(obj, api) {
    return api.getRef(await api.materialize(obj))
}

$ref[COST] = function refCost(value, calculateCost) {
    return calculateCost(value, calculateCost) + DEFAULT_UNKNOWN_COST
}

module.exports = {
    $ref,
}
