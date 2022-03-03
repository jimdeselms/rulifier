const { COST } = require("../symbols")

async function $if(obj, api) {
    const condition = await api.materialize(obj.condition)
    return condition ? obj.then : obj.else
}

$if[COST] = function ifCost(value) {
    return
}

module.exports = { $if }
