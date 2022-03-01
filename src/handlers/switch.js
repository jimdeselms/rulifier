export async function $switch(obj, api) {
    debugger
    const sorted = await api.sortNodesByCost(obj.cases, c => c.condition)
    for await (const currCase of sorted) {
        if (await api.realize(currCase.condition)) {
            return await currCase.value
        }
    }

    return obj.default
}
