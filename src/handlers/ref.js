module.exports.$ref = async function $ref(obj, api) {
    return api.getRef(await api.materialize(obj))
}
