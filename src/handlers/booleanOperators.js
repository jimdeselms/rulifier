async function $and(obj, api) {
    const sorted = await api.sortNodesByCost(obj)
    for (const value of sorted) {
        if (!(await api.materialize(value))) {
            return false
        }
    }
    return true
}

async function $or(obj, api) {
    const sorted = await api.sortNodesByCost(obj)
    for (const value of sorted) {
        if (await api.materialize(value)) {
            return true
        }
    }
    return false
}

async function $not(obj, api) {
    return !(await api.materialize(obj))
}

module.exports = {
    $and,
    $or,
    $not,
}
