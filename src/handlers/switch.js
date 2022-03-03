module.exports.$switch = async function $switch(obj, api) {
    const sorted = await api.sortNodesByCost(obj.cases, (c) => c.condition)
    for await (const currCase of sorted) {
        if (await api.materialize(currCase.condition)) {
            return await currCase.value
        }
    }

    return obj.default
}
