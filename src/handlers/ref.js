export async function $ref(obj, api) {
    return api.getRef(await api.evaluate(obj))
}
