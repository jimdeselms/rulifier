export async function $switch(obj) {
    for (const currCase of (await obj.cases) ?? []) {
        if (await currCase.condition) {
            return currCase.value
        }
    }

    return obj.default
}
