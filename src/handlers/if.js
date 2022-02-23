import { evaluate } from ".."

export async function $if(obj) {
    const condition = await evaluate(obj.condition)
    return condition ? await evaluate(obj.then) : await evaluate(obj.else)
}
