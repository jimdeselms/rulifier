export async function $switch(obj, api) {
    const sorted = await api.sortNodesByCost(obj.cases)
    for await (const currCase of sorted) {
        if (await api.realize(currCase.condition)) {
            return await currCase.value
        }
    }

    return obj.default
}
