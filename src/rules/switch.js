export async function $switch(obj, api) {
    const sorted = await api.sortNodesByCost(obj, (c) => c.condition)
    let defaultValue
    for await (const currCase of sorted) {
        if (!await api.has(currCase, "condition")) {
            defaultValue = currCase.value
        } else if (await api.materialize(currCase.condition)) {
            return await currCase.value
        }
    }

    return defaultValue
}
