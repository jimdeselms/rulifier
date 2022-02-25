import { evaluate } from '..'

export async function $switch(obj) {
    for await (const currCase of obj.cases) {
        if (await evaluate(currCase.condition)) {
            return await evaluate(currCase.value)
        }
    }

    return await evaluate(obj.default)
}
