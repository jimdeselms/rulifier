import { evaluate } from ".."

export async function $ref(obj, api) {
    return api.getRef(await evaluate(obj))
}
