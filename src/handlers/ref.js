export async function $ref(obj, api) {
    return api.getRef(await api.realize(obj))
}
