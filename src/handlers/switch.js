export async function $switch(obj, api) {
    for await (const currCase of obj.cases) {
        if (await api.realize(currCase.condition)) {
            return await currCase.value
        }
    }

    return obj.default
}
