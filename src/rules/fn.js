export async function $fn(obj, api) {
    const value = (await api.getRawValue(obj))()
    return value
}
